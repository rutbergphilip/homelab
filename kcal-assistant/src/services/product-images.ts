import type { Database } from "bun:sqlite";
import { config } from "../config";
import { fetchIcaImage, searchIca, type IcaSearchHit } from "./ica";
import { pickBestMatch, rankCandidates, shortQuery, type ImageMatch } from "../lib/image-match";
import { productsNeedingImage, saveProductImage } from "../db/product-images";

// ICA's WAF already forced a browser User-Agent on us; volume discipline is
// the other half of staying welcome. One request per second, serially — a
// full 121-product backfill is therefore ~4 minutes of background trickle,
// which nobody is waiting on.
const REQUEST_INTERVAL_MS = 1_000;
const CANDIDATES_PER_QUERY = 5;

// Injectable so tests never touch the network.
export interface ImageDeps {
  search: (query: string, limit: number) => Promise<IcaSearchHit[]>;
  fetchImage: (imagePath: string) => Promise<{ bytes: Uint8Array; contentType: string } | null>;
  delay: (ms: number) => Promise<void>;
}

export const liveDeps: ImageDeps = {
  search: (query, limit) => searchIca(config.icaStoreId, query, limit),
  fetchImage: (imagePath) => fetchIcaImage(imagePath),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export interface BackfillResult {
  attempted: number;
  saved: number;
  rejected: number;
}

/**
 * Resolves one product to a photo. Writes a row either way: bytes on success,
 * a NULL-bytes negative row on failure so we do not re-query ICA for the same
 * unknowable product on every restart.
 */
async function resolveOne(
  db: Database,
  product: { id: number; name: string; brand: string | null },
  deps: ImageDeps,
): Promise<boolean> {
  // Two attempts: the full name, then its first two tokens. ICA's search
  // appears to AND its terms, so a long name with qualifiers ICA does not use
  // returns nothing at all — see shortQuery's note. Both attempts feed the
  // same threshold, so the wider net cannot lower precision.
  const queries = [product.name];
  const short = shortQuery(product.name);
  if (short !== null) queries.push(short);

  let best: ReturnType<typeof pickBestMatch<IcaSearchHit>> = null;
  for (const query of queries) {
    let hits: IcaSearchHit[];
    try {
      hits = await deps.search(query, CANDIDATES_PER_QUERY);
    } catch (e) {
      // A transient ICA failure must not be cached as "no such product" —
      // leave the row absent so the next run tries again.
      console.error(`bildsök misslyckades för ${product.name}:`, e instanceof Error ? e.message : e);
      return false;
    }
    best = pickBestMatch(product.name, product.brand, hits.filter((h) => h.image_path !== null));
    if (best !== null) break;
    if (query !== queries[queries.length - 1]) await deps.delay(REQUEST_INTERVAL_MS);
  }

  if (best === null) {
    saveProductImage(db, { product_id: product.id, bytes: null });
    return false;
  }

  const image = await deps.fetchImage(best.candidate.image_path!);
  if (image === null) {
    saveProductImage(db, { product_id: product.id, bytes: null });
    return false;
  }

  saveProductImage(db, {
    product_id: product.id,
    bytes: image.bytes,
    content_type: image.contentType,
    source_ref: best.candidate.retailer_product_id,
    matched_name: best.candidate.name,
    score: best.score,
  });
  return true;
}

let running = false;

/**
 * Fills in every missing photo. Guarded against overlapping runs: startup and
 * a save_product landing together must not double the request rate.
 */
export async function runBackfill(db: Database, deps: ImageDeps = liveDeps): Promise<BackfillResult> {
  const result: BackfillResult = { attempted: 0, saved: 0, rejected: 0 };
  if (running) return result;
  running = true;
  try {
    const pending = productsNeedingImage(db);
    if (pending.length === 0) return result;
    console.log(`produktbilder: ${pending.length} att hämta`);
    for (const [index, product] of pending.entries()) {
      if (index > 0) await deps.delay(REQUEST_INTERVAL_MS);
      result.attempted += 1;
      const ok = await resolveOne(db, product, deps);
      if (ok) result.saved += 1;
      else result.rejected += 1;
    }
    console.log(`produktbilder: ${result.saved} sparade, ${result.rejected} utan träff`);
    return result;
  } finally {
    running = false;
  }
}

/** Fire-and-forget wrapper for callers that must not await (startup, save_product). */
export function scheduleBackfill(db: Database, delayMs = 0, deps: ImageDeps = liveDeps): void {
  setTimeout(() => {
    void runBackfill(db, deps).catch((e) =>
      console.error("bild-backfill:", e instanceof Error ? e.message : e),
    );
  }, delayMs).unref();
}

/** Scored ICA candidates for a product — the review step of set_product_image. */
export async function findImageCandidates(
  name: string,
  brand: string | null,
  query?: string,
  deps: ImageDeps = liveDeps,
): Promise<ImageMatch<IcaSearchHit>[]> {
  const hits = await deps.search(query ?? name, CANDIDATES_PER_QUERY);
  const usable = hits.filter((h) => h.image_path !== null);
  // Same shortening fallback the backfill uses — otherwise the review step
  // would report "inga träffar" for exactly the products it exists to fix.
  if (usable.length === 0 && query === undefined) {
    const short = shortQuery(name);
    if (short !== null) {
      const retry = await deps.search(short, CANDIDATES_PER_QUERY);
      return rankCandidates(name, brand, retry.filter((h) => h.image_path !== null));
    }
  }
  return rankCandidates(name, brand, usable);
}

/** Fetches and stores a specific ICA hit as a locked (hand-picked) photo. */
export async function setImageFromCandidate(
  db: Database,
  productId: number,
  candidate: IcaSearchHit,
  score: number,
  deps: ImageDeps = liveDeps,
): Promise<boolean> {
  if (candidate.image_path === null) return false;
  const image = await deps.fetchImage(candidate.image_path);
  if (image === null) return false;
  saveProductImage(db, {
    product_id: productId,
    bytes: image.bytes,
    content_type: image.contentType,
    source_ref: candidate.retailer_product_id,
    matched_name: candidate.name,
    score,
    locked: true,
  });
  return true;
}
