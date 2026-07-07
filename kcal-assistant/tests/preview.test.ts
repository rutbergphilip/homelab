import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { logMeal, previewDay } from "../src/db/meals";
import { setTargets } from "../src/db/preferences";

const DATE = "2026-07-08";
let db: Database;
let chickenId: number;

beforeEach(() => {
  db = openDb(":memory:");
  chickenId = saveProduct(db, {
    name: "Kycklingfilé",
    per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
  }).id;
  setTargets(db, { day_type: "vilodag", kcal: 1400, protein_min: 150, fat_min: 50 });
});

describe("previewDay", () => {
  test("computes planned meals and totals without writing anything", () => {
    const preview = previewDay(db, {
      date: DATE,
      meals: [
        { name: "Lunch", items: [{ product_id: chickenId, grams: 300 }] },
        { name: "Middag", items: [{ product_id: chickenId, grams: 200 }] },
      ],
    });
    expect(preview.planned_meals).toHaveLength(2);
    expect(preview.planned_meals[0]!.kcal).toBe(318);
    expect(preview.totals.kcal).toBe(530);
    expect(preview.remaining.kcal).toBe(1400 - 530);
    // nothing persisted — not even a days row
    expect(db.query("SELECT 1 FROM meals").get()).toBeNull();
    expect(db.query("SELECT 1 FROM days WHERE date = ?").get(DATE)).toBeNull();
  });

  test("lists logged meals separately and includes them in totals", () => {
    logMeal(db, { name: "Frukost", date: DATE, items: [{ product_id: chickenId, grams: 100 }] });
    const preview = previewDay(db, {
      date: DATE,
      meals: [{ name: "Lunch", items: [{ product_id: chickenId, grams: 300 }] }],
    });
    expect(preview.logged_meals).toHaveLength(1);
    expect(preview.logged_meals[0]!.name).toBe("Frukost");
    expect(preview.totals.kcal).toBe(106 + 318);
  });

  test("include_logged: false plans a clean slate", () => {
    logMeal(db, { name: "Frukost", date: DATE, items: [{ product_id: chickenId, grams: 100 }] });
    const preview = previewDay(db, {
      date: DATE,
      meals: [{ name: "Lunch", items: [{ product_id: chickenId, grams: 300 }] }],
      include_logged: false,
    });
    expect(preview.logged_meals).toHaveLength(0);
    expect(preview.totals.kcal).toBe(318);
  });

  test("floor checks: protein exactly at the floor passes", () => {
    // 652.2g chicken = 150.0 protein exactly (23 * 6.522) — use grams that land exactly
    const preview = previewDay(db, {
      date: DATE,
      meals: [{ name: "Protein", items: [{ description: "Exakt", macros: { kcal: 700, protein: 150, fat: 50, carbs: 0 } }] }],
    });
    expect(preview.checks.protein_floor_ok).toBe(true);
    expect(preview.checks.fat_floor_ok).toBe(true);
  });

  test("floor checks fail below the floors", () => {
    const preview = previewDay(db, {
      date: DATE,
      meals: [{ name: "Magert", items: [{ description: "Lite", macros: { kcal: 500, protein: 100, fat: 20, carbs: 10 } }] }],
    });
    expect(preview.checks.protein_floor_ok).toBe(false);
    expect(preview.checks.fat_floor_ok).toBe(false);
  });

  test("unknown product id throws (surfaces as tool isError)", () => {
    expect(() =>
      previewDay(db, { date: DATE, meals: [{ name: "Fel", items: [{ product_id: 99999, grams: 100 }] }] }),
    ).toThrow(/not found/);
  });
});
