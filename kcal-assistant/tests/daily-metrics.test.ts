import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { upsertDailyMetrics, getDailyMetrics, listDailyMetrics } from "../src/db/daily";

// Per-day Oura metrics: the TDEE cross-check (oura_total_kcal) plus recovery
// context (sleep, readiness). Written nightly by an HA automation and in bulk
// by scripts/backfill-health.ts. Every column is nullable because Oura
// documents several metrics as needing baseline data before they populate.

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("upsertDailyMetrics", () => {
  test("stores a full night's payload", () => {
    const row = upsertDailyMetrics(db, {
      date: "2026-07-25",
      oura_total_kcal: 3672,
      oura_active_kcal: 812,
      oura_steps: 11_204,
      sleep_score: 85,
      sleep_duration_min: 479,
      readiness_score: 86,
      hrv_ms: 93,
      resting_hr: 50,
    });

    expect(row).toMatchObject({
      date: "2026-07-25",
      oura_total_kcal: 3672,
      sleep_score: 85,
      sleep_duration_min: 479,
      resting_hr: 50,
    });
  });

  test("a metric Oura has not populated yet is stored as null, not zero", () => {
    const row = upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: 85 });
    expect(row.sleep_score).toBe(85);
    expect(row.readiness_score).toBeNull();
    expect(row.oura_total_kcal).toBeNull();
  });

  test("re-running with a partial payload preserves columns it does not mention", () => {
    upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: 85, oura_total_kcal: 3672 });
    // The nightly push runs again after an `unavailable` blip: steps arrive,
    // sleep_score is absent. The earlier value must survive.
    upsertDailyMetrics(db, { date: "2026-07-25", oura_steps: 11_204 });

    expect(getDailyMetrics(db, "2026-07-25")).toMatchObject({
      sleep_score: 85,
      oura_total_kcal: 3672,
      oura_steps: 11_204,
    });
  });

  test("an explicit null does not erase a value already stored", () => {
    upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: 85 });
    upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: null, oura_steps: 11_204 });

    expect(getDailyMetrics(db, "2026-07-25")).toMatchObject({ sleep_score: 85, oura_steps: 11_204 });
  });

  test("a real correction still overwrites", () => {
    upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: 85 });
    upsertDailyMetrics(db, { date: "2026-07-25", sleep_score: 71 });

    expect(getDailyMetrics(db, "2026-07-25")!.sleep_score).toBe(71);
  });

  test("rejects a malformed date rather than creating a junk primary key", () => {
    expect(() => upsertDailyMetrics(db, { date: "26 juli", sleep_score: 85 })).toThrow(/date/i);
    expect(db.query("SELECT count(*) AS n FROM daily_metrics").get()).toMatchObject({ n: 0 });
  });
});

describe("getDailyMetrics", () => {
  test("returns null for a day with no data", () => {
    expect(getDailyMetrics(db, "2026-07-25")).toBeNull();
  });
});

describe("listDailyMetrics", () => {
  beforeEach(() => {
    for (const [date, kcal] of [
      ["2026-07-23", 3035],
      ["2026-07-24", 3052],
      ["2026-07-25", 3672],
      ["2026-07-26", 1907],
    ] as const) {
      upsertDailyMetrics(db, { date, oura_total_kcal: kcal });
    }
  });

  test("returns the inclusive range ascending by date", () => {
    const rows = listDailyMetrics(db, { from: "2026-07-24", to: "2026-07-25" });
    expect(rows.map((r) => r.date)).toEqual(["2026-07-24", "2026-07-25"]);
    expect(rows.map((r) => r.oura_total_kcal)).toEqual([3052, 3672]);
  });

  test("a range with no data is an empty array, not null", () => {
    expect(listDailyMetrics(db, { from: "2026-01-01", to: "2026-01-31" })).toEqual([]);
  });
});
