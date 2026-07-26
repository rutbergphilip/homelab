import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { logWeight, getTrend } from "../src/db/weights";
import { upsertDailyMetrics } from "../src/db/daily";
import { saveProduct } from "../src/db/products";
import { logMeal } from "../src/db/meals";
import { addDays } from "../src/lib/dates";

// Oura's measured burn as a SANITY CHECK against the backwards-computed TDEE.
// It is never an input to the model: intake + weight change is stronger
// evidence than a ring's estimate. Averaged over exactly the trend's delta
// span so the two numbers describe the same period.

let db: Database;
let productId: number;

// Synthetic 100 kg fixtures, mirroring trend.test.ts (public repo).
const BASE = "2026-06-01";
const day = (n: number): string => addDays(BASE, n);

const WEIGHTS: Array<[number, number]> = [
  [0, 100.0],
  [3, 99.6],
  [7, 99.2],
  [21, 98.2],
  [24, 98.0],
  [27, 97.8],
];

beforeEach(() => {
  db = openDb(":memory:");
  productId = saveProduct(db, {
    name: "Testmat",
    per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 },
  }).id;
  for (const [n, kg] of WEIGHTS) logWeight(db, { weight_kg: kg, date: day(n) });
  // 1500 kcal on every day of the delta span (day 4..24).
  for (let n = 4; n <= 24; n++) {
    logMeal(db, { date: day(n), name: "Mat", items: [{ product_id: productId, grams: 1500 }] });
  }
});

describe("getTrend — Oura burn cross-check", () => {
  test("is null when no Oura data covers the span", () => {
    expect(getTrend(db, 28).oura_burn).toBeNull();
  });

  test("averages Oura's total burn over exactly the delta span", () => {
    for (let n = 4; n <= 24; n++) {
      upsertDailyMetrics(db, { date: day(n), oura_total_kcal: 2600 });
    }
    const burn = getTrend(db, 28).oura_burn!;

    expect(burn.avg_kcal).toBe(2600);
    expect(burn.days).toBe(21);
    expect(burn.from).toBe(day(4));
    expect(burn.to).toBe(day(24));
  });

  test("ignores days outside the span, so a holiday before the window cannot skew it", () => {
    for (let n = 4; n <= 24; n++) {
      upsertDailyMetrics(db, { date: day(n), oura_total_kcal: 2600 });
    }
    upsertDailyMetrics(db, { date: day(0), oura_total_kcal: 9000 });
    upsertDailyMetrics(db, { date: day(27), oura_total_kcal: 9000 });

    expect(getTrend(db, 28).oura_burn!.avg_kcal).toBe(2600);
  });

  test("counts only days that actually have a burn value", () => {
    upsertDailyMetrics(db, { date: day(10), oura_total_kcal: 2400 });
    upsertDailyMetrics(db, { date: day(11), oura_total_kcal: 2800 });
    // A day present in the table but with no burn recorded must not count as 0.
    upsertDailyMetrics(db, { date: day(12), sleep_score: 85 });

    const burn = getTrend(db, 28).oura_burn!;
    expect(burn.days).toBe(2);
    expect(burn.avg_kcal).toBe(2600);
  });

  test("stays null when the trend itself could not be computed", () => {
    const sparse = openDb(":memory:");
    logWeight(sparse, { weight_kg: 100, date: day(0) });
    upsertDailyMetrics(sparse, { date: day(0), oura_total_kcal: 2600 });

    const view = getTrend(sparse, 28);
    expect(view.trend).toBeNull();
    expect(view.oura_burn).toBeNull();
  });
});
