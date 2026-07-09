import { describe, expect, test } from "bun:test";
import { computeForecast, type ForecastProfile } from "../src/lib/forecast";
import { addDays } from "../src/lib/dates";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { setProfile } from "../src/db/profile";
import { logWeight } from "../src/db/weights";
import { logMeal } from "../src/db/meals";
import { buildForecast } from "../src/db/forecast";

// Synthetic fixtures only — public repo.
//
// Reference profile chosen so TDEE(w) = 15w + 1500 exactly:
//   BMR = 10w + 6.25·180 − 5·26 + 5 = 10w + 1000 (man, 180 cm, age 26)
//   × activity 1.5 → 15w + 1500.
// With intake 1500 the daily deficit is exactly 15w, so the discrete curve is
//   w_n = 82·(1 − 15/7700)^n
// which is hand-checkable: w_1 = 81.84026, w_12 = 80.10 > 80, w_13 = 79.95 ≤ 80.
const PROFILE: ForecastProfile = {
  birth_date: "2000-01-15",
  sex: "man",
  height_cm: 180,
  activity_factor: 1.5,
  goal_weight_kg: 80,
  goal_date: null,
};
const TODAY = "2026-07-09";
const W = (date: string, kg: number) => ({ date, weight_kg: kg });

function run(overrides: object = {}) {
  return computeForecast({
    profile: PROFILE,
    weights: [W(TODAY, 82)],
    intake_kcal: 1500,
    intake_source: "explicit",
    measured_tdee: null,
    today: TODAY,
    ...overrides,
  });
}

describe("computeForecast", () => {
  test("first step and adaptive flattening match the hand calculation", () => {
    const f = run();
    expect(f.curve[0]).toMatchObject({ date: TODAY, kg: 82 });
    expect(f.curve[1]!.kg).toBe(81.84); // 82 − (2730−1500)/7700
    expect(f.assumptions.tdee_start).toBe(2730);
    expect(f.assumptions.calibration).toBe("formel");
    const early = f.curve[1]!.kg - f.curve[31]!.kg;
    const late = f.curve[301]!.kg - f.curve[331]!.kg;
    expect(early).toBeGreaterThan(late); // deficit shrinks as weight falls
  });

  test("goal 80 kg is reached on day 13", () => {
    const f = run();
    expect(f.goal!.weight_kg).toBe(80);
    expect(f.goal!.reached).toBe(false);
    expect(f.goal!.eta).toBe(addDays(TODAY, 13));
  });

  test("calibration offsets the TDEE and clamps at ±500", () => {
    const f = run({ measured_tdee: 2500 });
    expect(f.assumptions.calibration).toBe("mätdata");
    expect(f.assumptions.calibration_offset).toBe(-230);
    expect(f.assumptions.tdee_start).toBe(2500);
    expect(f.curve[1]!.kg).toBe(81.87); // 82 − 1000/7700
    const clamped = run({ measured_tdee: 3500 });
    expect(clamped.assumptions.calibration_offset).toBe(500);
    expect(clamped.notes.join(" ")).toContain("±500");
  });

  test("band brackets the main curve", () => {
    const f = run();
    expect(f.curve[10]!.low).toBeLessThan(f.curve[10]!.kg);
    expect(f.curve[10]!.high).toBeGreaterThan(f.curve[10]!.kg);
  });

  test("start smooths weigh-ins within 7 days of the latest", () => {
    const f = run({ weights: [W("2026-07-02", 82.4), W("2026-07-06", 82.0), W(TODAY, 81.6)] });
    expect(f.start.weight_kg).toBe(82);
    expect(f.start.weighins_smoothed).toBe(3);
  });

  test("a stale log starts the simulation at the weigh-in date", () => {
    const f = run({ weights: [W("2026-06-29", 82)], target_date: "2026-07-20" });
    expect(f.start.stale).toBe(true);
    expect(f.curve[0]!.date).toBe("2026-06-29");
    expect(f.weight_at_target!.date).toBe("2026-07-20");
  });

  test("target date validation and horizon clamping", () => {
    expect(() => run({ target_date: "2026-07-01" })).toThrow(/passerat/);
    const f = run({ target_date: addDays(TODAY, 400) });
    expect(f.weight_at_target!.date).toBe(addDays(TODAY, 365));
    expect(f.notes.join(" ")).toContain("horisonten");
  });

  test("moving away from the goal yields no eta and a reason", () => {
    const f = run({ intake_kcal: 2800 }); // above TDEE 2730 → gaining
    expect(f.goal!.eta).toBeNull();
    expect(f.goal!.reason).toContain("bort");
  });

  test("a passed goal_date is ignored with a note", () => {
    const f = run({ profile: { ...PROFILE, goal_date: "2026-07-01" } });
    expect(f.weight_at_goal_date).toBeNull();
    expect(f.notes.join(" ")).toContain("passerat");
  });

  test("sanity floor stops the curve at 40 kg", () => {
    const f = run({
      weights: [W(TODAY, 41)],
      intake_kcal: 500,
      profile: { ...PROFILE, goal_weight_kg: null },
    });
    expect(f.goal).toBeNull();
    expect(f.curve.at(-1)!.kg).toBeGreaterThanOrEqual(40);
    expect(f.curve.length).toBeLessThan(365);
    expect(f.notes.join(" ")).toContain("40 kg");
  });
});

describe("buildForecast", () => {
  const TODAY = "2026-07-09";

  function seededDb(): Database {
    const db = openDb(":memory:");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5 });
    logWeight(db, { weight_kg: 82, date: TODAY });
    return db;
  }

  test("missing profile and missing weights give reasons", () => {
    const db = openDb(":memory:");
    expect(buildForecast(db, { today: TODAY }).reason).toContain("profil");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5 });
    expect(buildForecast(db, { today: TODAY }).reason).toContain("viktloggar");
  });

  test("targets mix weights the day targets by observed day types", () => {
    const db = seededDb();
    for (let i = 0; i < 14; i++) {
      db.run("INSERT OR IGNORE INTO days (date, day_type) VALUES (?, ?)", [
        addDays(TODAY, -i),
        i % 2 === 0 ? "vilodag" : "gymdag",
      ]);
    }
    const f = buildForecast(db, { today: TODAY }).forecast!;
    expect(f.assumptions.intake_source).toBe("targets");
    expect(f.assumptions.intake_kcal).toBe(2200); // (7·2000 + 7·2400) / 14, seeded targets
  });

  test("targets mix falls back to vilodag under 7 logged days", () => {
    const f = buildForecast(seededDb(), { today: TODAY }).forecast!;
    expect(f.assumptions.intake_kcal).toBe(2000); // seeded vilodag target
    expect(f.notes.join(" ")).toContain("vilodag");
  });

  test("recent averages logged kcal and falls back to targets when empty", () => {
    const db = seededDb();
    const item = (kcal: number) => [{ description: "x", macros: { kcal, protein: 100, fat: 50, carbs: 100 } }];
    logMeal(db, { name: "A", date: addDays(TODAY, -1), items: item(1600) });
    logMeal(db, { name: "B", date: addDays(TODAY, -2), items: item(2000) });
    const f = buildForecast(db, { today: TODAY, intake_source: "recent" }).forecast!;
    expect(f.assumptions.intake_source).toBe("recent");
    expect(f.assumptions.intake_kcal).toBe(1800);

    const empty = seededDb();
    const g = buildForecast(empty, { today: TODAY, intake_source: "recent" }).forecast!;
    expect(g.assumptions.intake_source).toBe("targets");
    expect(g.notes.join(" ")).toContain("intagsdata");
  });

  test("explicit intake wins over any source", () => {
    const f = buildForecast(seededDb(), { today: TODAY, intake_kcal: 1234, intake_source: "recent" }).forecast!;
    expect(f.assumptions.intake_source).toBe("explicit");
    expect(f.assumptions.intake_kcal).toBe(1234);
  });
});
