import { describe, expect, test } from "bun:test";
import { computeForecastAccuracy, pickGhost } from "../src/lib/accuracy";
import { addDays } from "../src/lib/dates";

// Synthetic fixtures only — public repo.
// Snapshot curve: linear 100 → falling 0.1 kg/day, weekly points over 8 weeks.
function snapshotAt(date: string, startKg: number, lossPerDay = 0.1) {
  const curve = [0, 7, 14, 21, 28, 35, 42, 49, 56].map((d) => ({
    date: addDays(date, d), kg: startKg - d * lossPerDay,
  }));
  return { date, curve };
}
// Daily trend weights matching that exact line.
function trendLine(start: string, days: number, startKg: number, lossPerDay = 0.1) {
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i), trend_kg: startKg - i * lossPerDay,
  }));
}
const T0 = "2026-05-01";

describe("computeForecastAccuracy", () => {
  test("perfect forecasts give zero error", () => {
    const snapshots = [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1));
    const acc = computeForecastAccuracy({
      snapshots, trendWeights: trendLine(T0, 40, 100), today: addDays(T0, 39),
    })!;
    const d7 = acc.per_age.find((b) => b.days === 7)!;
    expect(d7.n).toBe(3);
    expect(d7.mae_kg).toBe(0);
    expect(d7.bias_kg).toBe(0);
  });

  test("optimistic forecasts show negative bias, mae positive", () => {
    // Forecast says −0.2/day but reality is −0.1/day → predicted BELOW actual.
    const snapshots = [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1, 0.2));
    const acc = computeForecastAccuracy({
      snapshots, trendWeights: trendLine(T0, 40, 100), today: addDays(T0, 39),
    })!;
    const d7 = acc.per_age.find((b) => b.days === 7)!;
    expect(d7.bias_kg).toBeLessThan(0);
    expect(d7.mae_kg).toBe(Math.abs(d7.bias_kg));
  });

  test("interpolates between weekly points (age 14+3 lands mid-week)", () => {
    // A single snapshot, weigh-in exactly 17 days later only.
    const acc = computeForecastAccuracy({
      snapshots: [snapshotAt(T0, 100), snapshotAt(addDays(T0, 1), 99.9), snapshotAt(addDays(T0, 2), 99.8)],
      trendWeights: [14, 15, 16, 17, 18].map((d) => ({ date: addDays(T0, d), trend_kg: 100 - d * 0.1 })),
      today: addDays(T0, 30),
    });
    expect(acc).not.toBeNull();
    expect(acc!.per_age.find((b) => b.days === 14)!.mae_kg).toBe(0);
  });

  test("no weigh-in within ±3 days → sample skipped; n<3 → bucket dropped; none → null", () => {
    expect(computeForecastAccuracy({
      snapshots: [snapshotAt(T0, 100)],
      trendWeights: [{ date: addDays(T0, 20), trend_kg: 98 }],
      today: addDays(T0, 60),
    })).toBeNull(); // n=1 for 14/28... never ≥3 with one snapshot
  });

  test("future ages are excluded", () => {
    const acc = computeForecastAccuracy({
      snapshots: [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1)),
      trendWeights: trendLine(T0, 12, 100),
      today: addDays(T0, 11),
    })!;
    expect(acc.per_age.map((b) => b.days)).toEqual([7]); // 14/28/56 not aged yet
  });
});

describe("pickGhost", () => {
  const s = (d: string) => ({ date: d });
  test("picks the snapshot nearest 28 days old, requiring ≥21", () => {
    const today = "2026-06-30";
    expect(pickGhost([s("2026-06-25"), s("2026-06-05"), s("2026-05-20")], today))
      .toEqual(s("2026-06-05")); // ages: 5 (too young), 25, 41 → 25 nearest 28
  });
  test("null when nothing is old enough", () => {
    expect(pickGhost([s("2026-06-25")], "2026-06-30")).toBeNull();
  });
});
