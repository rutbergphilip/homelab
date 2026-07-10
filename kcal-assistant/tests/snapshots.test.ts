import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveSnapshot, listSnapshots } from "../src/db/snapshots";
import { computeForecast, type ForecastProfile } from "../src/lib/forecast";
import { buildForecast } from "../src/db/forecast";
import { setProfile } from "../src/db/profile";
import { logWeight } from "../src/db/weights";
import { addDays } from "../src/lib/dates";

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

describe("canonical snapshot wiring", () => {
  let db: Database;
  beforeEach(() => {
    db = openDb(":memory:");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    logWeight(db, { weight_kg: 82, date: "2026-07-08" });
  });

  test("canonical buildForecast writes a snapshot", () => {
    buildForecast(db, { today: "2026-07-09" });
    expect(listSnapshots(db).map((s) => s.date)).toEqual(["2026-07-09"]);
  });

  test("preview calls never write", () => {
    buildForecast(db, { today: "2026-07-09", intake_kcal: 1600 });
    buildForecast(db, { today: "2026-07-09", intake_source: "recent" });
    buildForecast(db, { today: "2026-07-09", activity_factor: 1.2 });
    expect(listSnapshots(db)).toHaveLength(0);
  });

  test("snapshot failure never breaks the forecast", () => {
    db.run("DROP TABLE forecast_snapshots");
    const view = buildForecast(db, { today: "2026-07-09" });
    expect(view.forecast).not.toBeNull();
  });

  test("no profile → no snapshot, no crash", () => {
    const bare = openDb(":memory:");
    logWeight(bare, { weight_kg: 82, date: "2026-07-08" });
    expect(buildForecast(bare, { today: "2026-07-09" }).forecast).toBeNull();
    expect(listSnapshots(bare)).toHaveLength(0);
  });
});

describe("aged snapshots", () => {
  test("surface accuracy and ghost in the view", () => {
    const db = openDb(":memory:");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    // Three backdated canonical snapshots, weights logged in date order.
    for (const off of [-30, -29, -28]) {
      const day = addDays("2026-07-09", off);
      logWeight(db, { weight_kg: 82, date: day });
      buildForecast(db, { today: day });
    }
    // Weigh-ins near each accuracy target (snap+7/14/28 within ±3 days).
    for (const off of [-23, -16, -9, -2]) {
      logWeight(db, { weight_kg: 82, date: addDays("2026-07-09", off) });
    }
    const view = buildForecast(db, { today: "2026-07-09" });
    expect(view.forecast).not.toBeNull();
    expect(view.accuracy).toBeDefined();
    expect(view.accuracy!.per_age.find((b) => b.days === 7)!.n).toBe(3);
    expect(view.ghost).toBeDefined();
    expect(view.ghost!.snapshot_date).toBe(addDays("2026-07-09", -28)); // age 28 exactly
  });
});
