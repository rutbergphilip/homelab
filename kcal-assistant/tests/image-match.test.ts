import { describe, expect, test } from "bun:test";
import {
  MATCH_THRESHOLD,
  monogram,
  pickBestMatch,
  rankCandidates,
  scoreName,
  shortQuery,
  tokenize,
} from "../src/lib/image-match";

const c = (name: string, brand: string | null = null, id = "1") => ({
  retailer_product_id: id,
  name,
  brand,
});

describe("tokenize", () => {
  test("drops pack sizes, grading noise and trademark marks", () => {
    expect(tokenize("Stora skalade räkor 400g ICA")).toEqual(["stora", "skalade", "räkor", "ica"]);
    // "3-pack" splits into "3" (a pack size) and "pack" (noise) — both go.
    expect(tokenize("Ätmogen Avokado 3-pack Klass 1 ICA")).toEqual(["ätmogen", "avokado", "ica"]);
  });

  test("keeps percentages — they separate 0% from 10% yoghurt", () => {
    expect(tokenize("Arla Grekisk Yoghurt 0%")).toContain("0%");
  });

  test("normalises decimal comma so 0,2% and 0.2% agree", () => {
    expect(tokenize("Kvarg 0,2%")).toContain("0.2%");
  });
});

// The cases below are real: measured against the live product list and the
// live ICA store on 2026-07-26. They are the reason the gate exists.
describe("scoreName — measured cases", () => {
  test("branded product with reordered words and pack size", () => {
    expect(scoreName("Arla Mild Kvarg Blåbär", "Arla", "Kvarg Mild Blåbär Laktosfri 0,2% 1000g Arla®", "Arla")).toBe(1);
  });

  test("bare produce inside a longer ICA name", () => {
    expect(scoreName("Avokado", null, "Ätmogen Avokado 3-pack Klass 1 ICA", "ICA")).toBe(1);
    expect(scoreName("Rödlök", null, "Rödlök 1kg Klass 1 ICA", "ICA")).toBe(1);
  });

  test("Swedish compound splits across our two words", () => {
    // "baby" + "plommontomater" only appear glued together on ICA's side.
    const score = scoreName("Baby plommontomater", null, "Röda babyplommontomater 250g Klass 1 ICA", "ICA");
    expect(score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test("rejects ICA's noise hit for Knäckebröd", () => {
    expect(scoreName("Knäckebröd", null, "Svart & vit knäckesticks Ekologisk 120g Vilmas", "Vilmas")).toBeLessThan(MATCH_THRESHOLD);
    expect(scoreName("Knäckebröd", null, "Breoliv Mild 91% 200g Zeta", "Zeta")).toBeLessThan(MATCH_THRESHOLD);
  });

  test("short tokens require an exact match, not a substring", () => {
    // "ägg" (3 chars) must not match by living inside another word.
    expect(scoreName("Ägg", null, "Ägg M/L KRAV 12-p ICA I love eco", "ICA")).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(scoreName("Ris", null, "Krispiga pommes 750g Felix", "Felix")).toBeLessThan(MATCH_THRESHOLD);
  });

  test("brand bonus lifts a partial name match", () => {
    const withBrand = scoreName("Tyngre Vassle", "Tyngre", "Proteinpulver Vassle kladdkaka 900g Tyngre", "Tyngre");
    expect(withBrand).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test("empty our-name scores zero rather than dividing by zero", () => {
    expect(scoreName("", null, "vad som helst", null)).toBe(0);
  });
});

describe("pickBestMatch", () => {
  test("picks the best candidate, not ICA's first", () => {
    const best = pickBestMatch("Knäckebröd", null, [
      c("Svart & vit knäckesticks Ekologisk 120g Vilmas", "Vilmas", "a"),
      c("Knäckebröd Rågsurdeg 200g Leksands", "Leksands", "b"),
    ]);
    expect(best?.candidate.retailer_product_id).toBe("b");
  });

  test("returns null when everything is below the threshold", () => {
    expect(
      pickBestMatch("Gin & Tonic", null, [c("Breoliv Mild 91% 200g Zeta", "Zeta")]),
    ).toBeNull();
  });

  test("returns null for no candidates at all", () => {
    expect(pickBestMatch("Starköl 33 cl", null, [])).toBeNull();
  });
});

describe("rankCandidates", () => {
  test("orders by score descending and keeps every candidate", () => {
    const ranked = rankCandidates("Kungsörnen Idealmakaroner", "Kungsörnen", [
      c("Breoliv Mild 91% 200g Zeta", "Zeta", "a"),
      c("Gammaldags Idealmakaroner 750g Kungsörnen", "Kungsörnen", "b"),
    ]);
    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.candidate.retailer_product_id).toBe("b");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});

describe("shortQuery", () => {
  test("keeps the first two significant tokens", () => {
    // ICA returns zero hits for the full names below; two tokens find them.
    expect(shortQuery("Estrella Ugnsbakade Chips Sourcream & Onion")).toBe("estrella ugnsbakade");
    expect(shortQuery("Findus Oxpytt Originalet")).toBe("findus oxpytt");
  });

  test("drops pack sizes before counting tokens", () => {
    expect(shortQuery("Arla Ko Färsk Lättmjölk 0,5%")).toBe("arla ko");
  });

  test("returns null when there is nothing to shorten", () => {
    expect(shortQuery("Avokado")).toBeNull();
    expect(shortQuery("Findus Oxpytt")).toBeNull();
  });
});

describe("monogram", () => {
  test("uses brand initials when a brand exists", () => {
    expect(monogram("Grekisk Yoghurt 0%", "Arla Köket")).toBe("AK");
  });

  test("falls back to the name's own words", () => {
    expect(monogram("Gin & Tonic", null)).toBe("GT");
  });

  test("single word gives two letters", () => {
    expect(monogram("Avokado", null)).toBe("AV");
  });

  test("nothing usable gives an em dash", () => {
    expect(monogram("123 500g", null)).toBe("—");
  });
});
