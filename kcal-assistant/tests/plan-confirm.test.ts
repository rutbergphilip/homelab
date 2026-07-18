import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { saveRecipe } from "../src/db/recipes";
import { setTargets } from "../src/db/preferences";
import { getDay, logMeal, editMeal } from "../src/db/meals";
import { upsertPlanDays, confirmDay, unconfirmDay, readPlanDay } from "../src/db/plan";

let db: Database;
let productId: number;

const DATE = "2026-07-20";

beforeEach(() => {
  db = openDb(":memory:");
  productId = saveProduct(db, {
    name: "Testmat",
    per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 },
  }).id;
  setTargets(db, { day_type: "vilodag", kcal: 1400, protein_min: 150, fat_min: 50 });
});

function planBasicDay(): void {
  upsertPlanDays(db, [
    {
      date: DATE,
      meals: [
        { slot: "frukost", name: "Gröt", items: [{ product_id: productId, grams: 300 }] },
        { slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 500 }] },
        { slot: "mellis", name: "Shake", post_gym_shake: true, items: [{ description: "Shake", macros: { kcal: 200, protein: 30, fat: 3, carbs: 10 } }] },
      ],
    },
  ]);
}

describe("confirmDay", () => {
  test("logs all planned meals and stamps the day confirmed", () => {
    planBasicDay();
    const { day, plan } = confirmDay(db, DATE);
    expect(day.meals).toHaveLength(3);
    expect(day.totals.kcal).toBe(1000); // 300 + 500 + 200
    expect(plan.confirmed).toBe(true);
    expect(plan.meals.every((m) => m.logged)).toBe(true);
    const shake = day.meals.find((m) => m.name === "Shake")!;
    expect(shake.post_gym_shake).toBe(true);
  });

  test("second confirm throws 'redan bekräftad'", () => {
    planBasicDay();
    confirmDay(db, DATE);
    expect(() => confirmDay(db, DATE)).toThrow(/redan bekräftad/);
  });

  test("empty day throws 'inget planerat'", () => {
    expect(() => confirmDay(db, DATE)).toThrow(/inget planerat/);
  });

  test("partial slot confirm logs only that slot; rest completes later", () => {
    planBasicDay();
    const first = confirmDay(db, DATE, ["middag"]);
    expect(first.day.meals).toHaveLength(1);
    expect(first.plan.confirmed).toBe(false);
    expect(first.plan.meals.find((m) => m.slot === "middag")!.logged).toBe(true);
    const rest = confirmDay(db, DATE);
    expect(rest.day.meals).toHaveLength(3);
    expect(rest.plan.confirmed).toBe(true);
  });

  test("recipe-based meal logs one aggregate item", () => {
    const recipe = saveRecipe(db, {
      name: "Köttfärssås",
      servings: 4,
      ingredients: [{ product_id: productId, grams: 1000 }],
    });
    upsertPlanDays(db, [
      { date: DATE, meals: [{ slot: "middag", name: "Köttfärssås", recipe_id: recipe.id, recipe_servings: 2 }] },
    ]);
    const { day } = confirmDay(db, DATE);
    expect(day.meals).toHaveLength(1);
    expect(day.meals[0]!.items).toHaveLength(1);
    expect(day.meals[0]!.items[0]!.description).toBe("Köttfärssås (2 port)");
    expect(day.meals[0]!.kcal).toBe(500);
  });

  test("unresolved items block confirm with meal name in the error", () => {
    const doomed = saveProduct(db, { name: "Snart borta", per_100g: { kcal: 200, protein: 1, fat: 1, carbs: 1 } }).id;
    upsertPlanDays(db, [
      { date: DATE, meals: [{ slot: "lunch", name: "Trasig lunch", items: [{ product_id: doomed, grams: 100 }] }] },
    ]);
    db.run("DELETE FROM products WHERE id = ?", [doomed]);
    expect(() => confirmDay(db, DATE)).toThrow(/Trasig lunch/);
  });

  test("deleting a plan-logged meal via edit_meal clears the link so confirm can re-log it", () => {
    planBasicDay();
    confirmDay(db, DATE);
    const day = getDay(db, DATE);
    const grot = day.meals.find((m) => m.name === "Gröt")!;
    editMeal(db, { meal_id: grot.id, action: "delete" });
    const plan = readPlanDay(db, DATE);
    expect(plan.meals.find((m) => m.name === "Gröt")!.logged).toBe(false);
    const again = confirmDay(db, DATE); // re-logs only Gröt
    expect(again.day.meals).toHaveLength(3);
  });
});

describe("unconfirmDay", () => {
  test("removes only plan-originated meals and clears the stamp", () => {
    planBasicDay();
    logMeal(db, { name: "Extra kaka", date: DATE, items: [{ description: "Kaka", macros: { kcal: 150, protein: 2, fat: 7, carbs: 20 } }] });
    confirmDay(db, DATE);
    expect(getDay(db, DATE).meals).toHaveLength(4);

    const { day, plan } = unconfirmDay(db, DATE);
    expect(day.meals).toHaveLength(1);
    expect(day.meals[0]!.name).toBe("Extra kaka");
    expect(plan.confirmed).toBe(false);
    expect(plan.meals.every((m) => !m.logged)).toBe(true);
  });

  test("nothing logged throws 'inget att ångra'", () => {
    planBasicDay();
    expect(() => unconfirmDay(db, DATE)).toThrow(/inget att ångra/);
  });
});
