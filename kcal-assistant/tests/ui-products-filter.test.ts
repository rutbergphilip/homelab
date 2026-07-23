import { describe, expect, test } from "bun:test";
import { CATEGORY_ALL, CATEGORY_UNCATEGORIZED, filterProducts } from "../src/ui/app/lib/products";
import type { Product } from "../src/ui/app/api";

function product(overrides: Partial<Product>): Product {
  return {
    id: 1,
    name: "Kycklingfilé",
    brand: null,
    per_100g: null,
    portions: [],
    aliases: [],
    notes: null,
    verified: true,
    source: "manual",
    category: null,
    ...overrides,
  };
}

describe("filterProducts", () => {
  const products: Product[] = [
    product({ id: 1, name: "Kycklingfilé", brand: "Kronfågel", aliases: ["kyckling"], category: "kött/fisk" }),
    product({ id: 2, name: "Chokladboll", aliases: ["godis"], category: "godis" }),
    product({ id: 3, name: "Ägg", category: null }),
  ];

  test("no filters returns everything", () => {
    expect(filterProducts(products, "", CATEGORY_ALL).map((p) => p.id)).toEqual([1, 2, 3]);
  });

  test("text search matches name, brand, and alias case-insensitively", () => {
    expect(filterProducts(products, "kronfågel", CATEGORY_ALL).map((p) => p.id)).toEqual([1]);
    expect(filterProducts(products, "GODIS", CATEGORY_ALL).map((p) => p.id)).toEqual([2]);
  });

  test("category filter matches exact category", () => {
    expect(filterProducts(products, "", "godis").map((p) => p.id)).toEqual([2]);
  });

  test("uncategorized sentinel matches only null category", () => {
    expect(filterProducts(products, "", CATEGORY_UNCATEGORIZED).map((p) => p.id)).toEqual([3]);
  });

  test("text search and category compose with AND", () => {
    expect(filterProducts(products, "kyckling", "kött/fisk").map((p) => p.id)).toEqual([1]);
    expect(filterProducts(products, "kyckling", "godis")).toEqual([]);
  });
});
