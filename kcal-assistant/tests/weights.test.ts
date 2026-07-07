import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { logWeight, getTrend } from "../src/db/weights";
import { saveProduct } from "../src/db/products";
import { logMeal } from "../src/db/meals";
import { addDays } from "../src/lib/dates";

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("logWeight", () => {
  test("saves and upserts by date, preserving note when re-logged without one", () => {
    logWeight(db, { weight_kg: 100.0, date: "2026-06-01", note: "efter semester" });
    logWeight(db, { weight_kg: 99.8, date: "2026-06-01" }); // correction, no note
    const row = db
      .query<{ weight_kg: number; note: string | null }, [string]>(
        "SELECT weight_kg, note FROM weights WHERE date = ?",
      )
      .get("2026-06-01")!;
    expect(row.weight_kg).toBe(99.8);
    expect(row.note).toBe("efter semester");
  });

  test("rejects nonsense weights with a clean error, not an SQLite exception", () => {
    expect(() => logWeight(db, { weight_kg: 0, date: "2026-06-01" })).toThrow(/vikt/i);
    expect(() => logWeight(db, { weight_kg: 600, date: "2026-06-01" })).toThrow(/vikt/i);
  });

  test("returns the trend object", () => {
    const result = logWeight(db, { weight_kg: 100, date: "2026-06-01" });
    expect(result.latest!.weight_kg).toBe(100);
    expect(result.trend).toBeNull(); // single weighing
  });
});

describe("getTrend (integration with meal intake)", () => {
  test("joins logged intake into TDEE over the weight-delta span", () => {
    const pid = saveProduct(db, {
      name: "Testmat",
      per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 },
    }).id;
    const base = "2026-06-01";
    // synthetic: 100.0 -> 98.0 over 4 weeks, 1500 kcal/day logged on every span day
    for (const [offset, kg] of [[0, 100.0], [3, 99.6], [7, 99.2], [21, 98.2], [24, 98.0], [27, 97.8]] as const) {
      logWeight(db, { weight_kg: kg, date: addDays(base, offset) });
    }
    for (let d = 4; d <= 24; d++) {
      logMeal(db, { name: "Mat", date: addDays(base, d), items: [{ product_id: pid, grams: 1500 }] });
    }
    const result = getTrend(db, 28);
    expect(result.trend!.avg_intake).toBe(1500);
    expect(result.trend!.est_tdee).toBe(2100);
    expect(result.weights.length).toBe(6);
  });

  test("empty state", () => {
    const result = getTrend(db, 28);
    expect(result.latest).toBeNull();
    expect(result.weights).toHaveLength(0);
    expect(result.trend).toBeNull();
  });
});
