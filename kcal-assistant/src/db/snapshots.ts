import type { Database } from "bun:sqlite";
import { weeklyCurve, type ForecastPoint, type ForecastResult } from "../lib/forecast";

export interface SnapshotRow {
  date: string;
  start_date: string;
  start_kg: number;
  intake_kcal: number;
  intake_source: string;
  tdee_start: number;
  calibration_offset: number;
  band_kcal: number;
  curve: ForecastPoint[];
}

export function saveSnapshot(db: Database, forecast: ForecastResult, today: string): void {
  db.run(
    `INSERT INTO forecast_snapshots
       (date, start_date, start_kg, intake_kcal, intake_source,
        tdee_start, calibration_offset, band_kcal, curve_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       created_at = datetime('now'),
       start_date = excluded.start_date, start_kg = excluded.start_kg,
       intake_kcal = excluded.intake_kcal, intake_source = excluded.intake_source,
       tdee_start = excluded.tdee_start, calibration_offset = excluded.calibration_offset,
       band_kcal = excluded.band_kcal, curve_json = excluded.curve_json`,
    [
      today, forecast.start.date, forecast.start.weight_kg,
      forecast.assumptions.intake_kcal, forecast.assumptions.intake_source,
      forecast.assumptions.tdee_start, forecast.assumptions.calibration_offset,
      forecast.assumptions.band_kcal, JSON.stringify(weeklyCurve(forecast.curve)),
    ],
  );
}

export function listSnapshots(db: Database): SnapshotRow[] {
  return db
    .query<Omit<SnapshotRow, "curve"> & { curve_json: string }, []>(
      `SELECT date, start_date, start_kg, intake_kcal, intake_source,
              tdee_start, calibration_offset, band_kcal, curve_json
       FROM forecast_snapshots ORDER BY date`,
    )
    .all()
    .map(({ curve_json, ...row }) => ({ ...row, curve: JSON.parse(curve_json) as ForecastPoint[] }));
}
