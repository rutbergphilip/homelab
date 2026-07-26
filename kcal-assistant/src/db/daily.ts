import type { Database } from "bun:sqlite";
import { isValidDate, todayStockholm } from "../lib/dates";

/**
 * Per-day metrics sourced from Oura via Home Assistant. Read-only context for
 * the assistant and the wall hub — `oura_total_kcal` is a cross-check against
 * the backwards-computed TDEE in lib/trend.ts, never an input to it.
 */
export interface DailyMetrics {
  date: string;
  oura_total_kcal: number | null;
  oura_active_kcal: number | null;
  oura_steps: number | null;
  sleep_score: number | null;
  sleep_duration_min: number | null;
  readiness_score: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
}

const METRICS = [
  "oura_total_kcal",
  "oura_active_kcal",
  "oura_steps",
  "sleep_score",
  "sleep_duration_min",
  "readiness_score",
  "hrv_ms",
  "resting_hr",
] as const;

export type DailyMetricsInput = { date?: string } & {
  [K in (typeof METRICS)[number]]?: number | null;
};

const COLUMNS = METRICS.join(", ");
const SELECT = `SELECT date, ${COLUMNS} FROM daily_metrics`;

/**
 * Upsert a day, merging rather than replacing: a null (absent, or a sensor that
 * was `unavailable`) leaves whatever is already stored intact. That makes the
 * nightly push and the backfill safe to re-run in any order.
 */
export function upsertDailyMetrics(db: Database, input: DailyMetricsInput): DailyMetrics {
  const date = input.date ?? todayStockholm();
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date} (expected YYYY-MM-DD)`);
  db.run(
    `INSERT INTO daily_metrics (date, ${COLUMNS})
     VALUES (?, ${METRICS.map(() => "?").join(", ")})
     ON CONFLICT(date) DO UPDATE SET
       ${METRICS.map((c) => `${c} = coalesce(excluded.${c}, daily_metrics.${c})`).join(",\n       ")},
       updated_at = datetime('now')`,
    [date, ...METRICS.map((c) => input[c] ?? null)],
  );
  return getDailyMetrics(db, date)!;
}

export function getDailyMetrics(db: Database, date?: string): DailyMetrics | null {
  return db
    .query<DailyMetrics, [string]>(`${SELECT} WHERE date = ?`)
    .get(date ?? todayStockholm());
}

/** Inclusive range, ascending by date. */
export function listDailyMetrics(
  db: Database,
  opts: { from: string; to: string },
): DailyMetrics[] {
  return db
    .query<DailyMetrics, [string, string]>(`${SELECT} WHERE date BETWEEN ? AND ? ORDER BY date`)
    .all(opts.from, opts.to);
}
