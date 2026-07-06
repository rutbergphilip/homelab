// Store-scoped ICA lookups via handlaprivatkund.ica.se's public web API
// (endpoints captured from the real site 2026-07-06; no auth required).
// Search: /stores/{id}/api/webproductpagews/v6/product-pages/search
// Detail: /stores/{id}/api/webproductpagews/v5/products/bop

const BASE = "https://handlaprivatkund.ica.se/stores";
// ICA's AWS WAF rejects non-browser User-Agents with 403 (verified 2026-07-06),
// so a browser UA is required. Volume stays low: single user + 7-day detail cache.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TIMEOUT_MS = 8_000;
const DETAIL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // nutrition rarely changes

export interface IcaNutrition {
  basis: string | null; // "100 Gram" | "100 Milliliter"
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface IcaSearchHit {
  retailer_product_id: string;
  name: string;
  brand: string | null;
  pack_size: string | null;
  price_sek: string | null;
  available: boolean;
}

export interface IcaDetail {
  nutrition: IcaNutrition;
  ingredients: string | null;
}

export function parseNutritionTable(html: string): IcaNutrition {
  const parseValue = (cell: string): number | null => {
    const match = cell.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  const basisMatch = html.match(/<th>\s*Näringsvärde\s*<\/th>\s*<th>(.*?)<\/th>/i);
  const rows = new Map<string, string>();
  for (const m of html.matchAll(/<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/gi)) {
    rows.set(m[1]!.trim().toLowerCase(), m[2]!.trim());
  }
  const value = (label: string): number | null => {
    const cell = rows.get(label);
    return cell === undefined ? null : parseValue(cell);
  };

  return {
    basis: basisMatch ? basisMatch[1]!.trim() : null,
    kcal: value("energi (kcal)"),
    protein: value("protein"),
    fat: value("fett"),
    carbs: value("kolhydrat"),
  };
}

async function icaFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ICA returned HTTP ${res.status}`);
  return res.json();
}

interface SearchResponse {
  productGroups?: Array<{
    decoratedProducts?: Array<{
      retailerProductId?: string;
      name?: string;
      brand?: string;
      packSizeDescription?: string;
      price?: { amount?: string };
      available?: boolean;
    }>;
  }>;
}

export async function searchIca(storeId: string, term: string, limit = 8): Promise<IcaSearchHit[]> {
  const url =
    `${BASE}/${storeId}/api/webproductpagews/v6/product-pages/search` +
    `?includeAdditionalPageInfo=false&maxPageSize=${limit}&maxProductsToDecorate=${limit}` +
    `&q=${encodeURIComponent(term)}&tag=web`;
  const data = (await icaFetch(url)) as SearchResponse;
  const products = (data.productGroups ?? []).flatMap((g) => g.decoratedProducts ?? []);
  return products
    .filter((p) => p.retailerProductId && p.name)
    .slice(0, limit)
    .map((p) => ({
      retailer_product_id: p.retailerProductId!,
      name: p.name!,
      brand: p.brand ?? null,
      pack_size: p.packSizeDescription ?? null,
      price_sek: p.price?.amount ?? null,
      available: p.available ?? false,
    }));
}

interface BopResponse {
  bopData?: { fields?: Array<{ title?: string; content?: string }> };
}

const detailCache = new Map<string, { fetchedAt: number; detail: IcaDetail }>();

export async function getIcaDetail(storeId: string, retailerProductId: string): Promise<IcaDetail> {
  const cacheKey = `${storeId}/${retailerProductId}`;
  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < DETAIL_CACHE_TTL_MS) return cached.detail;

  const url = `${BASE}/${storeId}/api/webproductpagews/v5/products/bop?retailerProductId=${encodeURIComponent(retailerProductId)}`;
  const data = (await icaFetch(url)) as BopResponse;
  const fields = new Map(
    (data.bopData?.fields ?? []).map((f) => [f.title ?? "", f.content ?? ""]),
  );
  const detail: IcaDetail = {
    nutrition: parseNutritionTable(fields.get("nutritionalData") ?? ""),
    ingredients: fields.get("ingredients") ?? null,
  };
  detailCache.set(cacheKey, { fetchedAt: Date.now(), detail });
  return detail;
}
