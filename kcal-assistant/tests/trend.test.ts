import { describe, expect, test } from "bun:test";
import { computeTrend } from "../src/lib/trend";
import { toEpochDays, addDays } from "../src/lib/dates";

// All fixtures use obviously synthetic weights (100 kg range) — public repo.

function intakeRange(start: string, end: string, kcal: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let d = start; d <= end; d = addDays(d, 1)) map.set(d, kcal);
  return map;
}

describe("date arithmetic", () => {
  test("toEpochDays is monotonic across DST transition (2026-03-29 Europe)", () => {
    expect(toEpochDays("2026-03-30") - toEpochDays("2026-03-29")).toBe(1);
    expect(toEpochDays("2026-03-29") - toEpochDays("2026-03-28")).toBe(1);
  });

  test("addDays crosses month and DST boundaries cleanly", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-07-06", -6)).toBe("2026-06-30");
  });
});

describe("computeTrend", () => {
  const BASE = "2026-06-01"; // window day 0
  const day = (n: number) => addDays(BASE, n);

  // Hand-computed reference case:
  // first half weights: day0 100.0, day3 99.6, day7 99.2 -> mean 99.6 at mean date 3.333
  // second half:       day21 98.2, day24 98.0, day27 97.8 -> mean 98.0 at mean date 24
  // span = 20.667 days, delta = 1.6 kg, rate = 0.54 kg/week
  // intake 1500 kcal on every span day (4..24) -> est_tdee = 1500 + 1.6*7700/20.667 = 2096 -> 2100
  const weights = [
    { date: day(0), weight_kg: 100.0 },
    { date: day(3), weight_kg: 99.6 },
    { date: day(7), weight_kg: 99.2 },
    { date: day(21), weight_kg: 98.2 },
    { date: day(24), weight_kg: 98.0 },
    { date: day(27), weight_kg: 97.8 },
  ];

  test("matches the hand-computed reference", () => {
    const result = computeTrend({
      weights,
      intakeByDate: intakeRange(day(4), day(24), 1500),
      windowDays: 28,
      today: day(27),
    });
    expect(result.latest).toEqual({ date: day(27), weight_kg: 97.8 });
    expect(result.stale).toBe(false);
    const t = result.trend!;
    expect(t.delta_kg).toBe(1.6);
    expect(t.rate_kg_week).toBe(0.54);
    expect(t.avg_intake).toBe(1500);
    expect(t.est_tdee).toBe(2100);
    expect(t.uncertain).toBe(false);
  });

  test("intake outside the weight-delta span is excluded", () => {
    const intake = intakeRange(day(4), day(24), 1500);
    intake.set(day(0), 9000); // flexday binge BEFORE the span must not contaminate TDEE
    intake.set(day(27), 9000); // nor after
    const t = computeTrend({ weights, intakeByDate: intake, windowDays: 28, today: day(27) }).trend!;
    expect(t.avg_intake).toBe(1500);
    expect(t.est_tdee).toBe(2100);
  });

  test("weight gain gives negative delta and TDEE below intake", () => {
    const gaining = weights.map((w, i) => ({ date: w.date, weight_kg: 100 + i * 0.2 }));
    const t = computeTrend({
      weights: gaining,
      intakeByDate: intakeRange(day(0), day(27), 2500),
      windowDays: 28,
      today: day(27),
    }).trend!;
    expect(t.delta_kg).toBeLessThan(0);
    expect(t.est_tdee!).toBeLessThan(2500);
  });

  test("returns null trend with reason when a half has fewer than 2 weighings", () => {
    const result = computeTrend({
      weights: weights.slice(3), // only second-half weights
      intakeByDate: new Map(),
      windowDays: 28,
      today: day(27),
    });
    expect(result.trend).toBeNull();
    expect(result.reason).toContain("viktlogg");
  });

  test("returns null trend when weighings cluster at the half boundary (span < 7, 14-day window)", () => {
    // 14-day window ending day13: first half [day0..day6], second [day7..day13].
    // Weights at 4,5 | 7,13 -> half mean-dates 4.5 and 10 -> span 5.5 < 7.
    const clustered = [
      { date: day(4), weight_kg: 100.0 },
      { date: day(5), weight_kg: 99.9 },
      { date: day(7), weight_kg: 99.8 },
      { date: day(13), weight_kg: 99.7 },
    ];
    const result = computeTrend({
      weights: clustered,
      intakeByDate: new Map(),
      windowDays: 14,
      today: day(13),
    });
    expect(result.trend).toBeNull();
    expect(result.reason).toContain("spann");
  });

  test("empty and single-weight inputs", () => {
    expect(computeTrend({ weights: [], intakeByDate: new Map(), today: day(0) }).latest).toBeNull();
    const one = computeTrend({
      weights: [{ date: day(0), weight_kg: 100 }],
      intakeByDate: new Map(),
      today: day(0),
    });
    expect(one.latest!.weight_kg).toBe(100);
    expect(one.trend).toBeNull();
  });

  test("no logged intake in span -> est_tdee null but rate still computed", () => {
    const t = computeTrend({ weights, intakeByDate: new Map(), windowDays: 28, today: day(27) }).trend!;
    expect(t.est_tdee).toBeNull();
    expect(t.rate_kg_week).toBe(0.54);
  });

  test("sparse intake logging in span sets uncertain", () => {
    const sparse = new Map<string, number>([[day(10), 1500], [day(11), 1500]]); // 2 of 21 span days
    const t = computeTrend({ weights, intakeByDate: sparse, windowDays: 28, today: day(27) }).trend!;
    expect(t.uncertain).toBe(true);
    expect(t.est_tdee).not.toBeNull();
  });

  test("stale when latest weighing is more than 7 days old", () => {
    const result = computeTrend({
      weights,
      intakeByDate: new Map(),
      windowDays: 28,
      today: addDays(day(27), 10),
    });
    expect(result.stale).toBe(true);
  });
});
