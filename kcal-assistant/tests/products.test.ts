import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct, getProduct, searchProducts } from "../src/db/products";

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("migrations", () => {
  test("applies all migrations and records user_version", () => {
    const { user_version } = db
      .query<{ user_version: number }, []>("PRAGMA user_version")
      .get()!;
    expect(user_version).toBeGreaterThanOrEqual(1);
  });

  test("FTS5 table exists and is queryable", () => {
    const row = db.query<{ n: number }, []>("SELECT count(*) AS n FROM products_fts").get()!;
    expect(row.n).toBe(0);
  });

  test("opening the same db twice is idempotent", () => {
    // migrations already applied; re-running against a file path must not throw.
    // :memory: gives a fresh db each open, so simulate by applying to a temp file.
    const tmp = `/tmp/kcal-test-${process.pid}.db`;
    openDb(tmp).close();
    expect(() => openDb(tmp).close()).not.toThrow();
  });
});

describe("saveProduct / getProduct", () => {
  test("creates a product with aliases, portions and notes", () => {
    const p = saveProduct(db, {
      name: "Kycklingkebab",
      brand: "Eldorado",
      per_100g: { kcal: 113, protein: 9.7, fat: 3.3, carbs: 11.1 },
      aliases: ["kebab", "den där kycklingkebaben"],
      portions: [{ name: "påse", grams: 500 }],
      notes: "Väg fryst",
      verified: true,
    });
    expect(p.id).toBeGreaterThan(0);
    const fetched = getProduct(db, p.id)!;
    expect(fetched.name).toBe("Kycklingkebab");
    expect(fetched.aliases).toEqual(["kebab", "den där kycklingkebaben"]);
    expect(fetched.portions).toHaveLength(1);
    expect(fetched.portions[0]!.grams).toBe(500);
    expect(fetched.notes).toBe("Väg fryst");
    expect(fetched.verified).toBe(true);
  });

  test("update by id replaces aliases and portions wholesale", () => {
    const p = saveProduct(db, {
      name: "ProPud",
      per_100g: { kcal: 63, protein: 11, fat: 0.5, carbs: 3.5 },
      aliases: ["propud"],
      portions: [{ name: "flaska", grams: 330 }],
    });
    const updated = saveProduct(db, {
      id: p.id,
      name: "ProPud Chokladboll",
      per_100g: { kcal: 60, protein: 11, fat: 0.4, carbs: 3.1 },
      aliases: ["propud", "proteinpudding"],
      portions: [{ name: "flaska", kcal: 198, protein: 36.3, fat: 1.4, carbs: 10.3 }],
      notes: "ProPud betyder flaskan",
    });
    expect(updated.id).toBe(p.id);
    expect(updated.name).toBe("ProPud Chokladboll");
    expect(updated.aliases).toEqual(["propud", "proteinpudding"]);
    expect(updated.portions).toHaveLength(1);
    expect(updated.portions[0]!.kcal).toBe(198);
    expect(updated.portions[0]!.grams).toBeNull();
  });

  test("update by id is PARTIAL: omitted fields are preserved", () => {
    const p = saveProduct(db, {
      name: "Kycklingspett",
      brand: "Lönneberga",
      per_100g: { kcal: 100, protein: 21, fat: 1.3, carbs: 1 },
      aliases: ["spett"],
      portions: [{ name: "spett", grams: 120 }],
      notes: "Ursprunglig regel",
      verified: false,
      source: "estimate",
    });
    // The LLM's typical "just update the note" call must not destroy anything else
    const updated = saveProduct(db, { id: p.id, name: "Kycklingspett", notes: "Räknas styckvis" });
    expect(updated.notes).toBe("Räknas styckvis");
    expect(updated.per_100g).toEqual({ kcal: 100, protein: 21, fat: 1.3, carbs: 1 });
    expect(updated.brand).toBe("Lönneberga");
    expect(updated.aliases).toEqual(["spett"]);
    expect(updated.portions).toHaveLength(1);
    expect(updated.verified).toBe(false);
    expect(updated.source).toBe("estimate");
  });

  test("explicit empty string clears notes; explicit values still replace", () => {
    const p = saveProduct(db, {
      name: "X",
      per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 2 },
      notes: "gammal",
      verified: false,
    });
    const updated = saveProduct(db, { id: p.id, name: "X", notes: "", verified: true });
    expect(updated.notes).toBeNull();
    expect(updated.verified).toBe(true);
    expect(updated.per_100g!.kcal).toBe(100);
  });

  test("unverified estimate keeps its source marker", () => {
    const p = saveProduct(db, {
      name: "Okänd sås",
      per_100g: { kcal: 200, protein: 1, fat: 20, carbs: 4 },
      verified: false,
      source: "estimate",
    });
    expect(getProduct(db, p.id)!.verified).toBe(false);
    expect(getProduct(db, p.id)!.source).toBe("estimate");
  });
});

describe("searchProducts", () => {
  beforeEach(() => {
    saveProduct(db, {
      name: "Kycklingkebab",
      aliases: ["kebab"],
      per_100g: { kcal: 113, protein: 9.7, fat: 3.3, carbs: 11.1 },
    });
    saveProduct(db, {
      name: "Vitlökssås",
      aliases: ["min vitlökssås"],
      per_100g: { kcal: 250, protein: 1, fat: 25, carbs: 5 },
    });
    saveProduct(db, {
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
    });
  });

  test("finds by exact-ish name token", () => {
    const hits = searchProducts(db, "vitlökssås");
    expect(hits.map((h) => h.name)).toContain("Vitlökssås");
  });

  test("tolerates missing diacritics (vitlokssas hits Vitlökssås)", () => {
    const hits = searchProducts(db, "vitlokssas");
    expect(hits.map((h) => h.name)).toContain("Vitlökssås");
  });

  test("finds compound-word product from vague definite-form phrase", () => {
    const hits = searchProducts(db, "den där kycklingkebaben");
    expect(hits.map((h) => h.name)).toContain("Kycklingkebab");
  });

  test("substring token matches inside compound words", () => {
    const hits = searchProducts(db, "kyckling");
    const names = hits.map((h) => h.name);
    expect(names).toContain("Kycklingkebab");
    expect(names).toContain("Kycklingfilé");
  });

  test("respects limit", () => {
    expect(searchProducts(db, "kyckling", 1)).toHaveLength(1);
  });

  test("returns empty for nonsense", () => {
    expect(searchProducts(db, "zzzqqqxxx")).toHaveLength(0);
  });
});
