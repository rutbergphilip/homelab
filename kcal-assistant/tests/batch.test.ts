import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { computeBatch } from "../src/db/batch";
import { saveProduct, getProduct } from "../src/db/products";
import { logMeal } from "../src/db/meals";

let db: Database;
let riceId: number;

beforeEach(() => {
  db = openDb(":memory:");
  riceId = saveProduct(db, {
    name: "Jasminris torrt",
    per_100g: { kcal: 360, protein: 7, fat: 1, carbs: 79 },
  }).id;
});

const MINCE = { description: "Stekt nötfärs avrunnen", grams: 800, macros: { kcal: 1600, protein: 160, fat: 96, carbs: 0 } };

describe("computeBatch", () => {
  test("computes totals, per-100g (plain 2-decimal rounding) and portion from count", () => {
    const result = computeBatch(db, {
      name: "Testbatch",
      ingredients: [MINCE, { product_id: riceId, grams: 210 }],
      cooked_weight_g: 1875,
      portion: { name: "låda", count: 7.5 },
    });
    // rice 210g: kcal 756, protein 14.7, fat 2.1, carbs 165.9 (directional per resolveItem)
    expect(result.total.kcal).toBe(2356);
    expect(result.cooked_weight_g).toBe(1875);
    // per-100g plain nearest, 2 decimals: 2356/18.75 = 125.65
    expect(result.per_100g.kcal).toBe(125.65);
    expect(result.portion!.grams).toBe(250);
    expect(result.portion!.name).toBe("låda");
    expect(result.saved_product).toBeUndefined(); // save defaults to false
  });

  test("cooked_weight_g defaults to ingredient gram sum", () => {
    const result = computeBatch(db, {
      name: "Testbatch",
      ingredients: [MINCE, { product_id: riceId, grams: 200 }],
    });
    expect(result.cooked_weight_g).toBe(1000);
  });

  test("requires cooked_weight_g when an ingredient lacks grams", () => {
    expect(() =>
      computeBatch(db, {
        name: "Testbatch",
        ingredients: [{ description: "Sås", macros: { kcal: 100, protein: 1, fat: 10, carbs: 2 } }],
      }),
    ).toThrow(/cooked_weight_g/);
  });

  test("save:true creates the product; end-to-end log lands within ±2 kcal of hand-computed", () => {
    const result = computeBatch(db, {
      name: "Testbatch",
      ingredients: [MINCE, { product_id: riceId, grams: 210 }],
      cooked_weight_g: 1875,
      portion: { name: "låda", count: 7.5 },
      save: true,
    });
    const saved = result.saved_product!;
    expect(getProduct(db, saved.id)!.portions[0]!.name).toBe("låda");

    const { day } = logMeal(db, {
      name: "Lunch",
      date: "2026-07-08",
      items: [{ product_id: saved.id, portion_name: "låda" }],
    });
    // hand-computed: total 2356 kcal / 1875g * 250g = 314.13 -> logged with one directional round
    expect(Math.abs(day.totals.kcal - 314)).toBeLessThanOrEqual(2);
  });

  test("save with product_id updates in place (the köttfärs correction flow)", () => {
    const first = computeBatch(db, {
      name: "Testbatch",
      ingredients: [MINCE],
      cooked_weight_g: 800,
      save: true,
    });
    const second = computeBatch(db, {
      name: "Testbatch v2",
      product_id: first.saved_product!.id,
      ingredients: [MINCE, { product_id: riceId, grams: 210 }],
      cooked_weight_g: 1875,
      save: true,
    });
    expect(second.saved_product!.id).toBe(first.saved_product!.id);
    expect(getProduct(db, first.saved_product!.id)!.name).toBe("Testbatch v2");
  });
});
