import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { saveRecipe } from "../src/db/recipes";
import { upsertPlanDays, confirmDay, buildShoppingList } from "../src/db/plan";

let db: Database;
let chicken: number;
let rice: number;

beforeEach(() => {
  db = openDb(":memory:");
  chicken = saveProduct(db, { name: "Kycklingfilé", per_100g: { kcal: 106, protein: 22, fat: 2, carbs: 0 } }).id;
  rice = saveProduct(db, { name: "Ris", per_100g: { kcal: 350, protein: 7, fat: 1, carbs: 77 } }).id;
});

describe("buildShoppingList", () => {
  test("aggregates grams per product across meals and expands recipes", () => {
    const recipe = saveRecipe(db, {
      name: "Kyckling & ris",
      servings: 4,
      ingredients: [
        { product_id: chicken, grams: 600 },
        { product_id: rice, grams: 400 },
      ],
    });
    upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [
          { slot: "lunch", name: "Kycklingwok", items: [{ product_id: chicken, grams: 200 }] },
          { slot: "middag", name: "Kyckling & ris", recipe_id: recipe.id, recipe_servings: 2 },
        ],
      },
      {
        date: "2026-07-21",
        meals: [
          { slot: "middag", name: "Mer kyckling", items: [{ product_id: chicken, grams: 300 }] },
          { slot: "mellis", name: "Godis", items: [{ description: "Lösgodis", macros: { kcal: 300, protein: 0, fat: 5, carbs: 60 } }] },
        ],
      },
    ]);

    const list = buildShoppingList(db, "2026-07-20", 7);
    // recipe at 2/4 servings => chicken 300g + rice 200g
    const chickenLine = list.find((l) => l.product_id === chicken)!;
    expect(chickenLine.grams).toBe(800); // 200 + 300 + 300
    const riceLine = list.find((l) => l.product_id === rice)!;
    expect(riceLine.grams).toBe(200);
    const adhoc = list.find((l) => l.description === "Lösgodis")!;
    expect(adhoc.product_id).toBeNull();
  });

  test("excludes logged meals and out-of-range dates", () => {
    upsertPlanDays(db, [
      { date: "2026-07-20", meals: [{ slot: "middag", name: "Loggad", items: [{ product_id: chicken, grams: 100 }] }] },
      { date: "2026-07-21", meals: [{ slot: "middag", name: "Kvar", items: [{ product_id: chicken, grams: 250 }] }] },
      { date: "2026-08-04", meals: [{ slot: "middag", name: "Utanför", items: [{ product_id: chicken, grams: 999 }] }] },
    ]);
    confirmDay(db, "2026-07-20");
    const list = buildShoppingList(db, "2026-07-20", 7);
    expect(list).toHaveLength(1);
    expect(list[0]!.grams).toBe(250);
  });
});
