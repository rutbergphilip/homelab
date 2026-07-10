import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveSnapshot, listSnapshots } from "../src/db/snapshots";
import { computeForecast, type ForecastProfile } from "../src/lib/forecast";

// Synthetic fixtures only — public repo.
const PROFILE: ForecastProfile = {
  birth_date: "2000-01-15", sex: "man", height_cm: 180,
  activity_factor: 1.5, goal_weight_kg: 80, goal_date: null,
};

function makeForecast(intake: number) {
  return computeForecast({
    profile: PROFILE,
    weights: [{ date: "2026-07-09", weight_kg: 82 }],
    intake_kcal: intake, intake_source: "explicit",
    measured_tdee: null, today: "2026-07-09",
  });
}

describe("forecast snapshots", () => {
  let db: Database;
  beforeEach(() => { db = openDb(":memory:"); });

  test("save + list roundtrips with a weekly curve", () => {
    saveSnapshot(db, makeForecast(1500), "2026-07-09");
    const rows = listSnapshots(db);
    expect(rows).toHaveLength(1);
    const s = rows[0]!;
    expect(s.date).toBe("2026-07-09");
    expect(s.start_kg).toBe(82);
    expect(s.intake_kcal).toBe(1500);
    expect(s.band_kcal).toBe(400);
    expect(s.curve.length).toBeLessThan(60); // weekly, not daily (365)
    expect(s.curve[0]).toMatchObject({ date: "2026-07-09", kg: 82 });
  });

  test("same-day save upserts (last write wins)", () => {
    saveSnapshot(db, makeForecast(1500), "2026-07-09");
    saveSnapshot(db, makeForecast(1600), "2026-07-09");
    const rows = listSnapshots(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.intake_kcal).toBe(1600);
  });
});
