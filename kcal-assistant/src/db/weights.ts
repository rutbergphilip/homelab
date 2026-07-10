import type { Database } from "bun:sqlite";
import { computeTrend, computeTrendWeight, type TrendResult, type WeightEntry } from "../lib/trend";
import { todayStockholm, isValidDate, toEpochDays } from "../lib/dates";

export interface WeightTrendView extends Omit<TrendResult, "latest"> {
  latest: (WeightEntry & { trend_kg: number }) | null;
  weights: WeightEntry[]; // weighings inside the window, ascending
}

export function logWeight(
  db: Database,
  input: { weight_kg: number; date?: string; note?: string },
): WeightTrendView {
  if (!(input.weight_kg > 0 && input.weight_kg < 500)) {
    throw new Error(`Orimlig vikt: ${input.weight_kg} kg`);
  }
  let date = input.date ?? todayStockholm();
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date} (expected YYYY-MM-DD)`);
  db.run(
    `INSERT INTO weights (date, weight_kg, note) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       weight_kg = excluded.weight_kg,
       note = coalesce(excluded.note, weights.note)`,
    [date, input.weight_kg, input.note ?? null],
  );
  return getTrend(db);
}

export function listWeights(db: Database): Array<WeightEntry & { note: string | null; trend_kg: number }> {
  const rows = db
    .query<WeightEntry & { note: string | null }, []>(
      "SELECT date, weight_kg, note FROM weights ORDER BY date DESC",
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
  };
}
