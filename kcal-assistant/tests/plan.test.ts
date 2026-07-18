import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { saveRecipe } from "../src/db/recipes";
import { setTargets } from "../src/db/preferences";
import { mondayOf, getPlanWeek, upsertPlanDays } from "../src/db/plan";

let db: Database;
let productId: number;

beforeEach(() => {
  db = openDb(":memory:");
  productId = saveProduct(db, {
    name: "Testmat",
    per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 },
  }).id;
  setTargets(db, { day_type: "vilodag", kcal: 1400, protein_min: 150, fat_min: 50 });
  setTargets(db, { day_type: "gymdag", kcal: 1600, protein_min: 150, fat_min: 50 });
});

describe("mondayOf", () => {
  test("snaps every weekday to its Monday", () => {
    expect(mondayOf("2026-07-20")).toBe("2026-07-20"); // Monday stays
    expect(mondayOf("2026-07-22")).toBe("2026-07-20"); // Wednesday
    expect(mondayOf("2026-07-26")).toBe("2026-07-20"); // Sunday -> prior Monday
  });

  test("handles DST transition and year boundary", () => {
    expect(mondayOf("2026-03-29")).toBe("2026-03-23"); // DST Sunday
    expect(mondayOf("2026-01-01")).toBe("2025-12-29"); // year boundary Thursday
  });
});

describe("upsertPlanDays", () => {
  test("inserts planned meals and returns totals vs targets", () => {
    const days = upsertPlanDays(db, [
      {
        date: "2026-07-20",
        day_type: "gymdag",
        meals: [
          { slot: "frukost", name: "Gröt", items: [{ product_id: productId, grams: 300 }] },
          { slot: "middag", name: "Kyckling", items: [{ product_id: productId, grams: 500 }] },
        ],
      },
    ]);
    expect(days).toHaveLength(1);
    const day = days[0]!;
    expect(day.date).toBe("2026-07-20");
    expect(day.day_type).toBe("gymdag");
    expect(day.confirmed).toBe(false);
    expect(day.meals).toHaveLength(2);
    expect(day.totals.kcal).toBe(800);
    expect(day.targets.kcal).toBe(1600);
    expect(day.remaining.kcal).toBe(800);
    expect(day.checks.kcal_ok).toBe(true);
    expect(day.checks.protein_floor_ok).toBe(false); // 80 < 150
  });

  test("replace=true replaces only slots present in meals", () => {
    upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [
          { slot: "frukost", name: "Gröt", items: [{ product_id: productId, grams: 300 }] },
          { slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 400 }] },
        ],
      },
    ]);
    const days = upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [{ slot: "middag", name: "Kyckling", items: [{ product_id: productId, grams: 500 }] }],
      },
    ]);
    const meals = days[0]!.meals;
    expect(meals).toHaveLength(2);
    expect(meals.find((m) => m.slot === "frukost")!.name).toBe("Gröt");
    expect(meals.find((m) => m.slot === "middag")!.name).toBe("Kyckling");
  });

  test("replace=false appends within the slot", () => {
    upsertPlanDays(db, [
      { date: "2026-07-20", meals: [{ slot: "mellis", name: "Shake", items: [{ product_id: productId, grams: 100 }] }] },
    ]);
    const days = upsertPlanDays(
      db,
      [{ date: "2026-07-20", meals: [{ slot: "mellis", name: "Frukt", items: [{ product_id: productId, grams: 150 }] }] }],
      false,
    );
    const mellis = days[0]!.meals.filter((m) => m.slot === "mellis");
    expect(mellis.map((m) => m.name)).toEqual(["Shake", "Frukt"]);
  });

  test("clear_slots empties a slot", () => {
    upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [
          { slot: "lunch", name: "Sallad", items: [{ product_id: productId, grams: 200 }] },
          { slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 400 }] },
        ],
      },
    ]);
    const days = upsertPlanDays(db, [{ date: "2026-07-20", clear_slots: ["middag"] }]);
    expect(days[0]!.meals.map((m) => m.slot)).toEqual(["lunch"]);
  });

  test("rejects invalid day_type and invalid slot payloads", () => {
    expect(() => upsertPlanDays(db, [{ date: "2026-07-20", day_type: "festdag" }])).toThrow();
    expect(() =>
      upsertPlanDays(db, [
        {
          date: "2026-07-20",
          meals: [
            {
              slot: "middag",
              name: "Både och",
              recipe_id: 1,
              recipe_servings: 1,
              items: [{ product_id: productId, grams: 100 }],
            },
          ],
        },
      ]),
    ).toThrow(); // recipe XOR items
    expect(() =>
      upsertPlanDays(db, [{ date: "2026-07-20", meals: [{ slot: "middag", name: "Recept utan portioner", recipe_id: 999 }] }]),
    ).toThrow(); // recipe_servings required + recipe must exist
  });

  test("recipe-based meal scales per serving", () => {
    const recipe = saveRecipe(db, {
      name: "Köttfärssås",
      servings: 4,
      ingredients: [{ product_id: productId, grams: 1000 }], // 1000 kcal total, 250/serving
    });
    const days = upsertPlanDays(db, [
      { date: "2026-07-21", meals: [{ slot: "middag", name: "Köttfärssås", recipe_id: recipe.id, recipe_servings: 2 }] },
    ]);
    const meal = days[0]!.meals[0]!;
    expect(meal.kcal).toBe(500);
    expect(meal.recipe_id).toBe(recipe.id);
    expect(meal.recipe_servings).toBe(2);
  });

  test("recipe without servings scales as batches", () => {
    const recipe = saveRecipe(db, {
      name: "Sås",
      ingredients: [{ product_id: productId, grams: 200 }], // 200 kcal/batch
    });
    const days = upsertPlanDays(db, [
      { date: "2026-07-21", meals: [{ slot: "middag", name: "Sås", recipe_id: recipe.id, recipe_servings: 2 }] },
    ]);
    expect(days[0]!.meals[0]!.kcal).toBe(400);
  });

  test("deleted product flags the meal incomplete and excludes it from totals", () => {
    const doomed = saveProduct(db, { name: "Snart borta", per_100g: { kcal: 200, protein: 1, fat: 1, carbs: 1 } }).id;
    upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [
          { slot: "lunch", name: "Trasig", items: [{ product_id: doomed, grams: 100 }] },
          { slot: "middag", name: "Hel", items: [{ product_id: productId, grams: 100 }] },
        ],
      },
    ]);
    db.run("DELETE FROM products WHERE id = ?", [doomed]);
    const week = getPlanWeek(db, { start: "2026-07-20" });
    const day = week.days[0]!;
    const broken = day.meals.find((m) => m.name === "Trasig")!;
    expect(broken.totals_incomplete).toBe(true);
    expect(day.totals.kcal).toBe(100); // only the intact meal counts
  });
});

describe("getPlanWeek", () => {
  test("returns 7 monday-aligned days with weekday names and aggregates", () => {
    upsertPlanDays(db, [
      { date: "2026-07-22", day_type: "gymdag", meals: [{ slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 500 }] }] },
    ]);
    const week = getPlanWeek(db, { start: "2026-07-24" });
    expect(week.start_date).toBe("2026-07-20");
    expect(week.end_date).toBe("2026-07-26");
    expect(week.days).toHaveLength(7);
    expect(week.days[0]!.weekday).toBe("måndag");
    expect(week.days[2]!.meals).toHaveLength(1);
    expect(week.week.planned_days).toBe(1);
    expect(week.week.confirmed_days).toBe(0);
    expect(week.week.avg_planned_kcal).toBe(500);
    expect(week.week.avg_target_kcal).toBe(Math.round((6 * 1400 + 1600) / 7));
  });

  test("weeks=2 spans 14 days", () => {
    const week = getPlanWeek(db, { start: "2026-07-20", weeks: 2 });
    expect(week.days).toHaveLength(14);
    expect(week.end_date).toBe("2026-08-02");
  });

  test("does not create day rows (read-only)", () => {
    getPlanWeek(db, { start: "2026-07-20" });
    const count = db.query<{ n: number }, []>("SELECT count(*) AS n FROM days").get()!.n;
    expect(count).toBe(0);
  });

  test("include_items exposes raw input for lossless slot rebuilds", () => {
    upsertPlanDays(db, [
      {
        date: "2026-07-20",
        meals: [
          {
            slot: "middag",
            name: "Blandat",
            items: [
              { product_id: productId, grams: 150 },
              { description: "Okänd sås", macros: { kcal: 90, protein: 1, fat: 8, carbs: 3 } },
            ],
          },
        ],
      },
    ]);
    const week = getPlanWeek(db, { start: "2026-07-20", include_items: true });
    const items = week.days[0]!.meals[0]!.items!;
    expect(items).toHaveLength(2);
    expect(items[0]!.product_id).toBe(productId);
    expect(items[0]!.grams).toBe(150);
    expect(items[0]!.kcal).toBe(150);
    expect(items[1]!.description).toBe("Okänd sås");
    expect(items[1]!.macros).toEqual({ kcal: 90, protein: 1, fat: 8, carbs: 3 }); // raw ad-hoc input preserved
  });
});
