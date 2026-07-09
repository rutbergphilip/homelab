import type { Database } from "bun:sqlite";
import { computeTrend, type TrendResult, type WeightEntry } from "../lib/trend";
import { todayStockholm, isValidDate, toEpochDays } from "../lib/dates";

export interface WeightTrendView extends TrendResult {
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

export function listWeights(db: Database): Array<WeightEntry & { note: string | null }> {
  return db
    .query<WeightEntry & { note: string | null }, []>(
      "SELECT date, weight_kg, note FROM weights ORDER BY date DESC",
    )
    .all();
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
  return { ...result, weights };
}
