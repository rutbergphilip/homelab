// Server-side retailer search. Only retailers that answer plain server-side
// requests get adapters (probed 2026-08-02): Kicks (JSON quicksearch) and
// Deloox (HTML suggest + JSON-LD product pages). Notino is bot-walled (403),
// Fragrantica likewise, Lyko/Parfym.se expose no stable endpoint — those are
// covered by Claude's own web search + fragrance_save_offer.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const TIMEOUT_MS = 6_000;

export interface RetailerHit {
  retailer: string;
  name: string;
  brand: string | null;
  price_sek: number | null;
  size_ml: number | null;
  url: string;
}

export interface RetailerResult {
  retailer: string;
  hits: RetailerHit[];
  error?: string;
}

async function get(url: string, accept: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// "2 625 kr" / "2213.00" / "1 299,50 kr" → SEK number
export function parsePriceSek(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d,.]/g, "").replace(",", ".");
  if (!cleaned) return null;
  // "2 625" arrives as "2625" after strip; "2213.00" stays
  const value = parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

// "Aventus Eau de Parfum 50 ml" / "...-100-ml.html" → ml
export function parseSizeMl(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+(?:[.,]\d+)?)[\s-]?ml\b/);
  return m ? parseFloat(m[1]!.replace(",", ".")) : null;
}

interface KicksProduct {
  name?: string;
  brandName?: string;
  price?: { priceText?: string | null };
  linkAction?: { url?: string };
}

export function parseKicks(json: string, limit: number): RetailerHit[] {
  const data = JSON.parse(json) as { products?: { items?: KicksProduct[] } };
  const items = data.products?.items ?? [];
  return items.slice(0, limit).map((p) => ({
    retailer: "kicks",
    name: p.name ?? "?",
    brand: p.brandName ?? null,
    price_sek: parsePriceSek(p.price?.priceText),
    size_ml: parseSizeMl(p.name),
    url: p.linkAction?.url ? new URL(p.linkAction.url, "https://www.kicks.se").href : "",
  }));
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#039;": "'", "&#8217;": "’", "&lt;": "<", "&gt;": ">" };

export function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|quot|lt|gt|#039|#8217);/g, (m) => ENTITIES[m] ?? m);
}

export function parseDelooxSuggest(html: string, limit: number): Array<{ name: string; url: string }> {
  const out: Array<{ name: string; url: string }> = [];
  const re = /<a[^>]+href="(https:\/\/www\.deloox\.se\/produkt\/[^"]+)"[\s\S]*?<span class="c-name">([^<]+)<\/span>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < limit) {
    out.push({ url: m[1]!, name: decodeEntities(m[2]!.trim()) });
  }
  return out;
}

export function parseDelooxProductLd(html: string): { price_sek: number | null; brand: string | null } {
  const brand = html.match(/"@type":"Brand","name":"([^"]+)"/)?.[1] ?? null;
  const price = html.match(/"@type":"Offer","priceCurrency":"SEK","price":"([\d.]+)"/)?.[1] ?? null;
  return { price_sek: parsePriceSek(price), brand };
}

async function searchKicks(query: string, limit: number): Promise<RetailerResult> {
  const json = await get(
    `https://www.kicks.se/internal/search/quicksearch?searchtext=${encodeURIComponent(query)}`,
    "application/json",
  );
  return { retailer: "kicks", hits: parseKicks(json, limit) };
}

async function searchDeloox(query: string, limit: number): Promise<RetailerResult> {
  const html = await get(
    `https://www.deloox.se/api/search?keyword=${encodeURIComponent(query)}`,
    "text/html",
  );
  const suggestions = parseDelooxSuggest(html, limit);
  const hits = await Promise.all(
    suggestions.map(async (s): Promise<RetailerHit> => {
      let price_sek: number | null = null;
      let brand: string | null = null;
      try {
        const page = await get(s.url, "text/html");
        ({ price_sek, brand } = parseDelooxProductLd(page));
      } catch {
        // suggest hit without a price is still useful
      }
      return { retailer: "deloox", name: s.name, brand, price_sek, size_ml: parseSizeMl(s.url), url: s.url };
    }),
  );
  return { retailer: "deloox", hits };
}

export async function searchRetailers(query: string, limit: number): Promise<RetailerResult[]> {
  const attempts: Array<[string, Promise<RetailerResult>]> = [
    ["kicks", searchKicks(query, limit)],
    ["deloox", searchDeloox(query, limit)],
  ];
  return Promise.all(
    attempts.map(([retailer, p]) =>
      p.catch((e) => ({ retailer, hits: [], error: e instanceof Error ? e.message : String(e) })),
    ),
  );
}
