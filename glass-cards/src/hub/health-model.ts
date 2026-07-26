// Pure logic behind the Hälsa page — kept out of the cards so it is testable
// without a browser, the same split as energy-model / planner-model.
//
// Two data sources, deliberately different:
//   live entities (sensor.oura_ring_*, sensor.withings_*) → today's values, so
//     the wall panel is never a poll interval behind reality;
//   sensor.kcal_halsa `days` → 14-day trends, because a Lovelace card cannot
//     read history and kcal-assistant is the history store.

import type { SparkPoint } from './widgets/hub-sparkline.js';

export type ScoreTone = 'green' | 'amber' | 'coral' | 'neutral';

/**
 * Oura's own score bands, so the panel agrees with the ring's app instead of
 * inventing a second opinion: 85+ optimal, 70–84 good, below 70 pay attention.
 * A missing score is neutral — absence must never read as "bad".
 */
export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score === null || score === undefined || Number.isNaN(score)) return 'neutral';
  if (score >= 85) return 'green';
  if (score >= 70) return 'amber';
  return 'coral';
}

/** 507 → "8h 27m". Minutes are zero-padded so the value never changes width. */
export function formatSleepDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes) || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * An entity state as a number, or null. HA's absence markers must not collapse
 * to 0 — a missing step count is unknown, not a day spent motionless.
 */
export function numericState(state: string | null | undefined): number | null {
  if (state === null || state === undefined || state === '') return null;
  if (state === 'unavailable' || state === 'unknown' || state === 'none') return null;
  const n = Number(state);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pull one metric out of the kcal_halsa `days` attribute as sparkline points.
 * Days missing the metric are skipped rather than plotted as zero: the backfill
 * deliberately stores null where a value was implausible, and a zero would draw
 * a cliff that never happened.
 */
export function metricSeries(days: unknown, key: string): SparkPoint[] {
  if (!Array.isArray(days)) return [];
  const points: SparkPoint[] = [];
  for (const day of days) {
    if (typeof day !== 'object' || day === null) continue;
    const row = day as Record<string, unknown>;
    const date = row.date;
    const value = row[key];
    if (typeof date !== 'string' || typeof value !== 'number' || !Number.isFinite(value)) continue;
    points.push({ date, value });
  }
  return points;
}

/** Mean of a series, for reading one day against its own recent baseline. */
export function seriesAverage(points: SparkPoint[]): number | null {
  if (points.length === 0) return null;
  return points.reduce((sum, p) => sum + p.value, 0) / points.length;
}

/**
 * Change across a series (last − first), or null with fewer than two points.
 * The Kropp card states this rather than the EWMA line's endpoint: that endpoint
 * lags the scale by design, and printing it beside the headline weight would put
 * two different weights on one card.
 */
export function seriesDelta(points: SparkPoint[]): number | null {
  if (points.length < 2) return null;
  return points[points.length - 1].value - points[0].value;
}

export interface WorkoutSummary {
  source: string;
  type: string;
  kcal: number | null;
  minutes: number | null;
  at: string;
}

/**
 * Oura and Withings both report "last workout" and both are fed partly by Apple
 * Health, so they routinely disagree about which one that was. Show whichever
 * reported most recently; an unparseable timestamp loses rather than winning by
 * accident.
 */
export function freshestWorkout(
  a: WorkoutSummary | null,
  b: WorkoutSummary | null,
): WorkoutSummary | null {
  const time = (w: WorkoutSummary | null): number => {
    if (!w) return Number.NEGATIVE_INFINITY;
    const t = Date.parse(w.at);
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  };
  const ta = time(a);
  const tb = time(b);
  if (ta === Number.NEGATIVE_INFINITY && tb === Number.NEGATIVE_INFINITY) {
    // Neither has a usable timestamp: fall back to whichever exists at all.
    return a ?? b ?? null;
  }
  return ta >= tb ? a : b;
}
