import type { Database } from "bun:sqlite";
import { computeTrend, computeTrendWeight, type TrendResult, type WeightEntry } from "../lib/trend";
import { todayStockholm, isValidDate, toEpochDays } from "../lib/dates";
import { listDailyMetrics } from "./daily";

/**
 * Oura's measured energy expenditure over the same span the backwards-computed
 * TDEE covers. A cross-check for presentation only — `trend.est_tdee` stays
 * authoritative, because intake plus weight change is stronger evidence than a
 * ring's estimate.
 */
export interface OuraBurn {
  avg_kcal: number;
  days: number; // days in the span that actually carry a burn value
  from: string;
  to: string;
}

export interface WeightTrendView extends Omit<TrendResult, "latest"> {
  latest: (WeightEntry & { trend_kg: number }) | null;
  weights: WeightEntry[]; // weighings inside the window, ascending
  oura_burn: OuraBurn | null;
}

/** 'manual' = logged through chat; 'withings' = pushed by the scale via HA. */
export type WeightSource = "manual" | "withings";

export interface LogWeightResult extends WeightTrendView {
  /** False when an automatic weigh-in was declined because the date was taken. */
  applied: boolean;
}

export function logWeight(
  db: Database,
  input: { weight_kg: number; date?: string; note?: string; source?: WeightSource },
): LogWeightResult {
  if (!(input.weight_kg > 0 && input.weight_kg < 500)) {
    throw new Error(`Orimlig vikt: ${input.weight_kg} kg`);
  }
  let date = input.date ?? todayStockholm();
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date} (expected YYYY-MM-DD)`);
  const source: WeightSource = input.source ?? "manual";
  // Two conflict rules, both enforced here rather than by the caller so the HA
  // automation can stay dumb and idempotent (re-firing changes nothing):
  //   manual   — always takes the date, and claims it (a later automatic
  //              weigh-in can no longer overwrite the correction).
  //   withings — first weigh-in of the day wins; a double-step on the scale or
  //              a second weigh-in later in the morning is a no-op.
  const result =
    source === "manual"
      ? db.run(
          `INSERT INTO weights (date, weight_kg, note, source) VALUES (?, ?, ?, 'manual')
           ON CONFLICT(date) DO UPDATE SET
             weight_kg = excluded.weight_kg,
             note = coalesce(excluded.note, weights.note),
             source = 'manual'`,
          [date, input.weight_kg, input.note ?? null],
        )
      : db.run(
          `INSERT INTO weights (date, weight_kg, note, source) VALUES (?, ?, ?, ?)
           ON CONFLICT(date) DO NOTHING`,
          [date, input.weight_kg, input.note ?? null, source],
        );
  return { ...getTrend(db), applied: result.changes > 0 };
}

export function listWeights(
  db: Database,
): Array<WeightEntry & { note: string | null; source: WeightSource; trend_kg: number }> {
  const rows = db
    .query<WeightEntry & { note: string | null; source: WeightSource }, []>(
      "SELECT date, weight_kg, note, source FROM weights ORDER BY date DESC",
    )
    .all();
  const trendByDate = new Map(computeTrendWeight(rows).map((p) => [p.date, p.trend_kg]));
  return rows.map((r) => ({ ...r, trend_kg: trendByDate.get(r.date)! }));
}

export function getTrend(db: Database, windowDays = 28): WeightTrendView {
  const allWeights = db
    .query<WeightEntry, []>("SELECT date, weight_kg FROM weights ORDER BY date")
    .all();
  const intakeRows = db
    .query<{ date: string; kcal: number }, []>(
      "SELECT m.day_date AS date, SUM(mi.kcal) AS kcal FROM meals m JOIN meal_items mi ON mi.meal_id = m.id GROUP BY m.day_date",
    )
    .all();
  const result = computeTrend({
    weights: allWeights,
    intakeByDate: new Map(intakeRows.map((r) => [r.date, r.kcal])),
    windowDays,
  });
  const weights = result.latest
    ? allWeights.filter(
        (w) => toEpochDays(w.date) >= toEpochDays(result.latest!.date) - (windowDays - 1),
      )
    : [];
  const trendByDate = new Map(computeTrendWeight(allWeights).map((p) => [p.date, p.trend_kg]));
  return {
    ...result,
    latest: result.latest ? { ...result.latest, trend_kg: trendByDate.get(result.latest.date)! } : null,
    weights,
    oura_burn: ouraBurn(db, result),
  };
}

// Averaged over exactly the trend's delta span — the same days intake is
// averaged over — so the two TDEE figures are comparable rather than merely
// overlapping. Null whenever there is no trend to compare against, or no day
// in the span carries a burn value (a day present with only sleep data must
// not be counted as a zero).
function ouraBurn(db: Database, result: TrendResult): OuraBurn | null {
  if (!result.trend) return null;
  const { span_from, span_to } = result.trend;
  const values = listDailyMetrics(db, { from: span_from, to: span_to })
    .map((r) => r.oura_total_kcal)
    .filter((kcal): kcal is number => kcal !== null);
  if (values.length === 0) return null;
  return {
    avg_kcal: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    days: values.length,
    from: span_from,
    to: span_to,
  };
}
