import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { logMeal, setDayType, getWeek } from "../src/db/meals";
import { setTargets } from "../src/db/preferences";

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

describe("getWeek", () => {
  test("covers 7 days ending at end_date, oldest first", () => {
    const week = getWeek(db, "2026-07-06");
    expect(week.days).toHaveLength(7);
    expect(week.days[0]!.date).toBe("2026-06-30");
    expect(week.days[6]!.date).toBe("2026-07-06");
    expect(week.days_logged).toBe(0);
    expect(week.avg_logged).toBeNull();
  });

  test("averages only over days that have meals, targets averaged over all 7", () => {
    logMeal(db, { name: "Lunch", date: "2026-07-04", items: [{ product_id: productId, grams: 1000 }] });
    logMeal(db, { name: "Middag", date: "2026-07-05", items: [{ product_id: productId, grams: 500 }] });
    setDayType(db, "gymdag", "2026-07-05");

    const week = getWeek(db, "2026-07-06");
    expect(week.days_logged).toBe(2);
    // (1000 + 500) kcal over 2 logged days
    expect(week.avg_logged!.kcal).toBe(750);
    expect(week.avg_logged!.protein).toBe(75);
    // 6 vilodagar à 1400 + 1 gymdag à 1600
    expect(week.avg_target_kcal).toBe(Math.round((6 * 1400 + 1600) / 7));
    const gymDay = week.days.find((d) => d.date === "2026-07-05")!;
    expect(gymDay.day_type).toBe("gymdag");
    expect(gymDay.totals.kcal).toBe(500);
    expect(gymDay.target_kcal).toBe(1600);
  });

  test("defaults to today as end date", () => {
    const week = getWeek(db);
    expect(week.days).toHaveLength(7);
    expect(week.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
