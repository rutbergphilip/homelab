import { toEpochDays, addDays } from "./dates";

// Measures how past forecast snapshots aged: for standard ages, the snapshot
// curve (weekly points, linearly interpolated) is compared against the EWMA
// trend weight nearest that date (±3 days). bias > 0 = forecasts ran heavy.

export interface AccuracyBucket {
  days: number;
  n: number;
  mae_kg: number;
  bias_kg: number;
}

const AGES = [7, 14, 28, 56];
const MATCH_TOLERANCE_DAYS = 3;
const MIN_SAMPLES = 3;

const round2 = (x: number): number => Math.round(x * 100) / 100;

export function computeForecastAccuracy(input: {
  snapshots: Array<{ date: string; curve: Array<{ date: string; kg: number }> }>;
  trendWeights: Array<{ date: string; trend_kg: number }>;
  today: string;
}): { per_age: AccuracyBucket[] } | null {
  const per_age: AccuracyBucket[] = [];
  for (const days of AGES) {
    const errors: number[] = [];
    for (const s of input.snapshots) {
      const target = addDays(s.date, days);
      if (target > input.today) continue;
      const predicted = interpolate(s.curve, target);
      if (predicted === null) continue;
      const actual = nearestTrend(input.trendWeights, target);
      if (actual === null) continue;
      errors.push(predicted - actual);
    }
    if (errors.length >= MIN_SAMPLES) {
      const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      per_age.push({
        days,
        n: errors.length,
        mae_kg: round2(mean(errors.map(Math.abs))),
        bias_kg: round2(mean(errors)),
      });
    }
  }
  return per_age.length ? { per_age } : null;
}

function interpolate(curve: Array<{ date: string; kg: number }>, date: string): number | null {
  const t = toEpochDays(date);
  for (let i = 0; i < curve.length - 1; i++) {
    const a = toEpochDays(curve[i]!.date);
    const b = toEpochDays(curve[i + 1]!.date);
    if (t >= a && t <= b) {
      return a === b ? curve[i]!.kg : curve[i]!.kg + ((t - a) / (b - a)) * (curve[i + 1]!.kg - curve[i]!.kg);
    }
  }
  return null; // outside the stored curve (e.g. sim stopped early)
}

function nearestTrend(
  tw: Array<{ date: string; trend_kg: number }>,
  date: string,
): number | null {
  const t = toEpochDays(date);
  let best: number | null = null;
  let bestD = Infinity;
  for (const w of tw) {
    const d = Math.abs(toEpochDays(w.date) - t);
    if (d < bestD) {
      bestD = d;
      best = w.trend_kg;
    }
  }
  return bestD <= MATCH_TOLERANCE_DAYS ? best : null;
}

// Ghost overlay candidate: the snapshot nearest 28 days old, at least 21.
// Ascending input order means ties keep the older snapshot.
export function pickGhost<T extends { date: string }>(snapshots: T[], today: string): T | null {
  const t = toEpochDays(today);
  let best: T | null = null;
  let bestD = Infinity;
  for (const s of snapshots) {
    const age = t - toEpochDays(s.date);
    if (age < 21) continue;
    const d = Math.abs(age - 28);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
