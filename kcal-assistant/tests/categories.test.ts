import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { migrate } from "../src/db/migrations";
import { saveProduct, searchProducts } from "../src/db/products";

let db: Database;

beforeEach(() => {
  db = openDb(":memory:");
});

describe("migration 7: product category column", () => {
  test("category column exists on products", () => {
    const columns = db
      .query<{ name: string }, []>("PRAGMA table_info(products)")
      .all()
      .map((c) => c.name);
    expect(columns).toContain("category");
  });

  test("re-running migrations is a no-op", () => {
    const before = db.query<{ user_version: number }, []>("PRAGMA user_version").get()!
      .user_version;
    expect(() => migrate(db)).not.toThrow();
    const after = db.query<{ user_version: number }, []>("PRAGMA user_version").get()!
      .user_version;
    expect(after).toBe(before);
  });
});

describe("saveProduct: category persistence", () => {
  test("saving a product with category persists it", () => {
    const product = saveProduct(db, {
      name: "Chokladboll",
      per_100g: { kcal: 400, protein: 5, fat: 20, carbs: 45 },
      category: "godis",
    });
    expect(product.category).toBe("godis");
  });

  test("update omitting category preserves it", () => {
    const created = saveProduct(db, {
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "kött/fisk",
    });
    const updated = saveProduct(db, {
      id: created.id,
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
    });
    expect(updated.category).toBe("kött/fisk");
  });

  test("update with empty string clears category to NULL", () => {
    const created = saveProduct(db, {
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "kött/fisk",
    });
    const updated = saveProduct(db, {
      id: created.id,
      name: "Kycklingfilé",
      per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
      category: "",
    });
    expect(updated.category).toBeNull();
  });
});

describe("searchProducts: category filter", () => {
  beforeEach(() => {
    saveProduct(db, {
      name: "Chokladboll",
      per_100g: { kcal: 400, protein: 5, fat: 20, carbs: 45 },
      category: "godis",
    });
    saveProduct(db, {
      name: "Chokladmusli",
      per_100g: { kcal: 380, protein: 8, fat: 10, carbs: 60 },
      category: "frukost",
    });
  });

  test("filter returns only matching category", () => {
    const results = searchProducts(db, "choklad", 8, "godis");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Chokladboll");
  });

  test("filter with no matches returns empty array", () => {
    const results = searchProducts(db, "choklad", 8, "dryck");
    expect(results).toEqual([]);
  });
});
