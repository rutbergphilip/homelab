// Confidence gate for automatic product photos.
//
// ICA's search is fuzzy AND personalized: hit #1 for "Knäckebröd" is
// "Svart & vit knäckesticks 120g Vilmas", and hits #2-#3 are olive spread.
// Taking the top hit blindly would mount the wrong photo on the wrong
// product, which is worse than showing none. So every candidate is scored
// against our own name and the best one must clear a threshold.

export interface ImageCandidate {
  retailer_product_id: string;
  name: string;
  brand: string | null;
}

export interface ImageMatch<C extends ImageCandidate = ImageCandidate> {
  candidate: C;
  score: number;
}

export const MATCH_THRESHOLD = 0.6;

const BRAND_BONUS = 0.15;

// Substring matching is what makes Swedish compounds work ("baby" +
// "plommontomater" inside "babyplommontomater"), but on short tokens it
// matches by accident — "ris" is inside "krispiga". Long tokens only.
const MIN_SUBSTRING_LEN = 4;

// Pack sizes and grading words carry no identity: ICA writes them, we don't.
const PACK_SIZE = /^\d+(?:[.,]\d+)?(?:g|kg|mg|ml|cl|dl|l|p|pack|st)?$/;
const NOISE = new Set(["klass", "ca", "st", "pack", "styck", "ekologisk", "eko"]);

function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/[®™]/g, " ")
    .replace(/,/g, ".")
    .replace(/[^\p{L}\p{N}.%]+/gu, " ")
    .trim();
}

export function tokenize(name: string): string[] {
  return fold(name)
    .split(/\s+/)
    .filter((t) => t.length > 0 && !PACK_SIZE.test(t) && !NOISE.has(t));
}

/**
 * Containment of our tokens in theirs — not Jaccard. ICA names are longer
 * than ours ("Stora skalade räkor 400g ICA" vs "ICA Stora Skalade Räkor"),
 * so penalizing their extra words would reject correct matches.
 */
export function scoreName(ourName: string, ourBrand: string | null, theirName: string, theirBrand: string | null): number {
  const ours = tokenize(ourName);
  if (ours.length === 0) return 0;
  const theirs = tokenize(theirName);
  const theirSet = new Set(theirs);
  const theirJoined = theirs.join("");

  let hits = 0;
  for (const token of ours) {
    if (theirSet.has(token)) {
      hits += 1;
    } else if (token.length >= MIN_SUBSTRING_LEN && theirJoined.includes(token)) {
      hits += 1;
    }
  }
  let score = hits / ours.length;

  if (ourBrand) {
    const brandTokens = tokenize(ourBrand);
    const theirBrandJoined = tokenize(theirBrand ?? "").join("");
    const brandMatched =
      brandTokens.length > 0 &&
      brandTokens.every((t) => theirSet.has(t) || theirBrandJoined.includes(t) || theirJoined.includes(t));
    if (brandMatched) score += BRAND_BONUS;
  }

  return Math.min(1, Number(score.toFixed(4)));
}

/**
 * Best-scoring candidate above the threshold, or null. Deliberately scans
 * every candidate rather than trusting ICA's own ranking.
 */
export function pickBestMatch<C extends ImageCandidate>(
  ourName: string,
  ourBrand: string | null,
  candidates: C[],
  threshold = MATCH_THRESHOLD,
): ImageMatch<C> | null {
  let best: ImageMatch<C> | null = null;
  for (const candidate of candidates) {
    const score = scoreName(ourName, ourBrand, candidate.name, candidate.brand);
    if (best === null || score > best.score) best = { candidate, score };
  }
  if (best === null || best.score < threshold) return null;
  return best;
}

/** Every candidate scored, best first — for set_product_image's review step. */
export function rankCandidates<C extends ImageCandidate>(
  ourName: string,
  ourBrand: string | null,
  candidates: C[],
): ImageMatch<C>[] {
  return candidates
    .map((candidate) => ({ candidate, score: scoreName(ourName, ourBrand, candidate.name, candidate.brand) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * A shorter retry query for products ICA's search cannot handle at full
 * length. Measured 2026-07-26: "Estrella Ugnsbakade Chips Sourcream & Onion",
 * "Findus Oxpytt Originalet" and "Arla Protein Shake Chocolate" all return
 * ZERO hits, while their first two tokens return the right product. ICA's
 * engine appears to AND the terms, so every extra qualifier we carry that
 * their name does not is a chance to match nothing at all.
 *
 * This widens the net, never the acceptance: the retry's candidates go through
 * the same threshold, which is what keeps "FAGE Total" from mounting the
 * Listerine Total Care bottle it actually returns.
 *
 * Returns null when shortening would not change the query.
 */
export function shortQuery(name: string, tokens = 2): string | null {
  const parts = tokenize(name);
  if (parts.length <= tokens) return null;
  return parts.slice(0, tokens).join(" ");
}

/**
 * Monogram for the empty plate: brand initials when there is a brand,
 * otherwise the first letters of the name's own words. Max two characters —
 * three reads as a word, one reads as an accident.
 */
export function monogram(name: string, brand: string | null): string {
  const source = brand && brand.trim().length > 0 ? brand : name;
  const words = tokenize(source).filter((w) => /^\p{L}/u.test(w));
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}
