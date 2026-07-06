// Open Food Facts lookup — read-only; the LLM reviews candidates before
// anything is saved (with verified:false and values rounded up).

const USER_AGENT = "kcal-assistant/0.1 (personal homelab use)";
const TIMEOUT_MS = 8_000;
const FIELDS = "code,product_name,brands,quantity,serving_size,nutriments";

export interface NutritionCandidate {
  name: string;
  brand: string | null;
  barcode: string | null;
  per_100g: {
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  serving_size: string | null;
  package_quantity: string | null;
  confidence: "complete" | "partial";
  url: string;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string>;
}

function toCandidate(p: OffProduct): NutritionCandidate | null {
  const n = p.nutriments ?? {};
  const num = (key: string): number | null => {
    const v = n[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const per100g = {
    kcal: num("energy-kcal_100g"),
    protein: num("proteins_100g"),
    fat: num("fat_100g"),
    carbs: num("carbohydrates_100g"),
  };
  const name = p.product_name?.trim();
  if (!name) return null;
  const complete = Object.values(per100g).every((v) => v !== null);
  return {
    name,
    brand: p.brands?.trim() || null,
    barcode: p.code ?? null,
    per_100g: per100g,
    serving_size: p.serving_size?.trim() || null,
    package_quantity: p.quantity?.trim() || null,
    confidence: complete ? "complete" : "partial",
    url: p.code ? `https://world.openfoodfacts.org/product/${p.code}` : "",
  };
}

async function offFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Food Facts returned HTTP ${res.status}`);
  return res.json();
}

export async function searchNutrition(query: string, limit = 6): Promise<NutritionCandidate[]> {
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1" +
    `&search_terms=${encodeURIComponent(query)}` +
    "&tagtype_0=countries&tag_contains_0=contains&tag_0=sweden" +
    `&page_size=${limit}&fields=${FIELDS}&lc=sv`;
  const data = (await offFetch(url)) as { products?: OffProduct[] };
  return (data.products ?? []).map(toCandidate).filter((c): c is NutritionCandidate => c !== null);
}

export async function lookupBarcode(barcode: string): Promise<NutritionCandidate | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  try {
    const data = (await offFetch(url)) as { status?: number; product?: OffProduct };
    if (data.status !== 1 || !data.product) return null;
    return toCandidate(data.product);
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) return null;
    throw e;
  }
}
