import type { Database } from "bun:sqlite";
import { getExercise, getSyncState, setsForWorkout, type SetRow, type WorkoutRow } from "./db";

const r1 = (x: number): number => Math.round(x * 10) / 10;

// Epley estimate; for a 1-rep set it IS the lifted weight. Only meaningful
// for weight×reps sets — callers must skip duration/distance work.
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function weekStartMonday(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayStockholm(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
}

interface WorkoutAggRow extends WorkoutRow {
  set_count: number;
  set_volume_kg: number;
  exercise_count: number;
}

// Volume = Σ weight×reps over completed sets; the API's own total_volume is
// the fallback for workouts whose sets carry no weights (rare, but real).
function workoutVolume(row: WorkoutAggRow): number {
  return row.set_volume_kg > 0 ? row.set_volume_kg : (row.total_volume_kg ?? 0);
}

function workoutAggregates(db: Database, opts: { from?: string; limit?: number } = {}): WorkoutAggRow[] {
  const params: Record<string, string | number> = {};
  let where = "";
  if (opts.from) {
    where = "WHERE w.perform_date >= $from";
    params["$from"] = opts.from;
  }
  return db
    .query<WorkoutAggRow, Record<string, string | number>>(
      `SELECT w.*, COUNT(s.rowid) AS set_count,
              COALESCE(SUM(CASE WHEN s.is_completed = 1 THEN COALESCE(s.weight_kg, 0) * COALESCE(s.reps, 0) END), 0) AS set_volume_kg,
              COUNT(DISTINCT s.exercise_id) AS exercise_count
       FROM lyfta_workouts w LEFT JOIN lyfta_sets s ON s.workout_id = w.id
       ${where}
       GROUP BY w.id ORDER BY w.perform_date DESC, w.id DESC
       ${opts.limit !== undefined ? "LIMIT $limit" : ""}`,
    )
    .all(opts.limit !== undefined ? { ...params, $limit: opts.limit } : params);
}

export interface WeeklyPoint {
  week_start: string;
  workouts: number;
  volume_kg: number;
  sets: number;
  duration_min: number | null;
}

// One point per calendar week (Monday-start), oldest→newest, gaps filled with
// zero weeks so charts show rest weeks instead of compressing them away.
export function buildWeekly(db: Database, weeks: number): WeeklyPoint[] {
  const currentWeek = weekStartMonday(todayStockholm());
  const firstWeek = addDays(currentWeek, -7 * (weeks - 1));
  const rows = workoutAggregates(db, { from: firstWeek });
  const byWeek = new Map<string, WeeklyPoint>();
  for (const row of rows) {
    const week = weekStartMonday(row.perform_date);
    const point = byWeek.get(week) ?? { week_start: week, workouts: 0, volume_kg: 0, sets: 0, duration_min: null };
    point.workouts++;
    point.volume_kg = r1(point.volume_kg + workoutVolume(row));
    point.sets += row.set_count;
    if (row.duration_s !== null) point.duration_min = Math.round((point.duration_min ?? 0) + row.duration_s / 60);
    byWeek.set(week, point);
  }
  const points: WeeklyPoint[] = [];
  for (let i = 0; i < weeks; i++) {
    const week = addDays(firstWeek, 7 * i);
    points.push(byWeek.get(week) ?? { week_start: week, workouts: 0, volume_kg: 0, sets: 0, duration_min: null });
  }
  return points;
}

export interface WorkoutSummary {
  id: number;
  date: string;
  title: string | null;
  duration_min: number | null;
  volume_kg: number;
  sets: number;
  exercises: number;
}

export function recentWorkouts(db: Database, limit: number): WorkoutSummary[] {
  return workoutAggregates(db, { limit }).map((row) => ({
    id: row.id,
    date: row.perform_date,
    title: row.title,
    duration_min: row.duration_s !== null ? Math.round(row.duration_s / 60) : null,
    volume_kg: r1(workoutVolume(row)),
    sets: row.set_count,
    exercises: row.exercise_count,
  }));
}

export interface TopExercise {
  exercise_id: number;
  name: string;
  sessions: number;
  last_performed: string;
  best_weight_kg: number | null;
  best_e1rm_kg: number | null;
  latest_e1rm_kg: number | null;
}

interface ExerciseSetRow extends SetRow {
  perform_date: string;
}

function exerciseSets(db: Database, exerciseId: number, from?: string): ExerciseSetRow[] {
  const params: Record<string, string | number> = { $eid: exerciseId };
  let dateCond = "";
  if (from) {
    dateCond = "AND w.perform_date >= $from";
    params["$from"] = from;
  }
  return db
    .query<ExerciseSetRow, Record<string, string | number>>(
      `SELECT s.*, w.perform_date FROM lyfta_sets s
       JOIN lyfta_workouts w ON w.id = s.workout_id
       WHERE s.exercise_id = $eid AND s.is_completed = 1 ${dateCond}
       ORDER BY w.perform_date, w.id, s.set_index`,
    )
    .all(params);
}

function bestOfSets(sets: ExerciseSetRow[]): { weight: number | null; e1rm: number | null } {
  let weight: number | null = null;
  let e1rm: number | null = null;
  for (const s of sets) {
    if (s.weight_kg === null || s.reps === null || s.reps < 1) continue;
    if (weight === null || s.weight_kg > weight) weight = s.weight_kg;
    const est = epley1RM(s.weight_kg, s.reps);
    if (e1rm === null || est > e1rm) e1rm = est;
  }
  return { weight, e1rm: e1rm !== null ? r1(e1rm) : null };
}

export function topExercises(db: Database, opts: { days: number; limit: number }): TopExercise[] {
  const from = addDays(todayStockholm(), -opts.days);
  const heads = db
    .query<{ exercise_id: number; name: string; sessions: number; last_performed: string }, [string, number]>(
      `SELECT s.exercise_id, MAX(s.exercise_name) AS name,
              COUNT(DISTINCT s.workout_id) AS sessions, MAX(w.perform_date) AS last_performed
       FROM lyfta_sets s JOIN lyfta_workouts w ON w.id = s.workout_id
       WHERE w.perform_date >= ? AND s.is_completed = 1
       GROUP BY s.exercise_id ORDER BY sessions DESC, last_performed DESC LIMIT ?`,
    )
    .all(from, opts.limit);
  return heads.map((h) => {
    const all = exerciseSets(db, h.exercise_id); // all-time, for true bests
    const best = bestOfSets(all);
    const lastDate = all.at(-1)?.perform_date;
    const latest = bestOfSets(all.filter((s) => s.perform_date === lastDate));
    return {
      exercise_id: h.exercise_id,
      name: h.name,
      sessions: h.sessions,
      last_performed: h.last_performed,
      best_weight_kg: best.weight,
      best_e1rm_kg: best.e1rm,
      latest_e1rm_kg: latest.e1rm,
    };
  });
}

export interface ProgressPoint {
  date: string;
  best_weight_kg: number | null;
  best_reps: number | null;
  e1rm_kg: number | null;
  volume_kg: number;
  sets: number;
}

// Per-session progression: for each date the heaviest completed set, the best
// Epley estimate, and total volume. This is what "am I getting stronger"
// reads from — computed locally, never from the network.
export function exerciseProgress(db: Database, exerciseId: number, days: number): ProgressPoint[] {
  const from = addDays(todayStockholm(), -days);
  const sets = exerciseSets(db, exerciseId, from);
  const byDate = new Map<string, ExerciseSetRow[]>();
  for (const s of sets) {
    const list = byDate.get(s.perform_date) ?? [];
    list.push(s);
    byDate.set(s.perform_date, list);
  }
  return [...byDate.entries()].map(([date, daySets]) => {
    let bestWeight: number | null = null;
    let bestReps: number | null = null;
    let bestE1rm: number | null = null;
    let volume = 0;
    for (const s of daySets) {
      if (s.weight_kg !== null && s.reps !== null) volume += s.weight_kg * s.reps;
      if (s.weight_kg === null || s.reps === null || s.reps < 1) continue;
      const est = epley1RM(s.weight_kg, s.reps);
      if (bestE1rm === null || est > bestE1rm) bestE1rm = est;
      if (bestWeight === null || s.weight_kg > bestWeight || (s.weight_kg === bestWeight && s.reps > (bestReps ?? 0))) {
        bestWeight = s.weight_kg;
        bestReps = s.reps;
      }
    }
    return {
      date,
      best_weight_kg: bestWeight,
      best_reps: bestReps,
      e1rm_kg: bestE1rm !== null ? r1(bestE1rm) : null,
      volume_kg: r1(volume),
      sets: daySets.length,
    };
  });
}

export interface RecordEntry {
  date: string;
  workout_id: number;
  exercise_name: string;
  record_type: string;
  record_level: string | null;
  record_value: string | null;
  weight_kg: number | null;
  reps: number | null;
}

export function recentRecords(db: Database, limit: number): RecordEntry[] {
  return db
    .query<RecordEntry, [number]>(
      `SELECT w.perform_date AS date, s.workout_id, s.exercise_name, s.record_type,
              s.record_level, s.record_value, s.weight_kg, s.reps
       FROM lyfta_sets s JOIN lyfta_workouts w ON w.id = s.workout_id
       WHERE s.record_type IS NOT NULL AND s.record_type != ''
       ORDER BY w.perform_date DESC, s.rowid DESC LIMIT ?`,
    )
    .all(limit);
}

export interface LyftaSummary {
  status: "ok";
  configured: boolean;
  last_synced: string | null;
  last_error: string | null;
  workout_count: number;
  this_week: { workouts: number; volume_kg: number; sets: number };
  weekly: WeeklyPoint[];
  recent_workouts: WorkoutSummary[];
  top_exercises: TopExercise[];
}

// The kcal-facing projection (internal listener + get_training). Never throws:
// an empty database is a valid "not synced yet" answer, not a 500.
export function buildLyftaSummary(db: Database, configured: boolean): LyftaSummary {
  try {
    const weekly = buildWeekly(db, 12);
    const thisWeek = weekly.at(-1)!;
    return {
      status: "ok",
      configured,
      last_synced: getSyncState(db, "last_synced"),
      last_error: getSyncState(db, "last_error"),
      workout_count: db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM lyfta_workouts").get()!.n,
      this_week: { workouts: thisWeek.workouts, volume_kg: thisWeek.volume_kg, sets: thisWeek.sets },
      weekly,
      recent_workouts: recentWorkouts(db, 10),
      top_exercises: topExercises(db, { days: 180, limit: 8 }),
    };
  } catch (e) {
    console.error("lyfta summary:", e instanceof Error ? e.message : e);
    return {
      status: "ok",
      configured,
      last_synced: null,
      last_error: "summary failed",
      workout_count: 0,
      this_week: { workouts: 0, volume_kg: 0, sets: 0 },
      weekly: [],
      recent_workouts: [],
      top_exercises: [],
    };
  }
}

export interface LyftaProgress {
  status: "ok";
  exercise: { id: number; name: string; equipment: string | null; body_part: string | null } | null;
  days: number;
  points: ProgressPoint[];
}

export function buildLyftaProgress(db: Database, exerciseId: number, days: number): LyftaProgress {
  try {
    const meta = getExercise(db, exerciseId);
    const nameRow = db
      .query<{ name: string }, [number]>("SELECT exercise_name AS name FROM lyfta_sets WHERE exercise_id = ? LIMIT 1")
      .get(exerciseId);
    const name = meta?.name ?? nameRow?.name ?? null;
    return {
      status: "ok",
      exercise:
        name === null
          ? null
          : { id: exerciseId, name, equipment: meta?.equipment ?? null, body_part: meta?.body_part ?? null },
      days,
      points: exerciseProgress(db, exerciseId, days),
    };
  } catch (e) {
    console.error("lyfta progress:", e instanceof Error ? e.message : e);
    return { status: "ok", exercise: null, days, points: [] };
  }
}

export function workoutDetail(db: Database, workout: WorkoutRow): Record<string, unknown> {
  const sets = setsForWorkout(db, workout.id);
  const exercises: Array<{ exercise_id: number; name: string; sets: Array<Record<string, unknown>> }> = [];
  for (const s of sets) {
    let ex = exercises.at(-1);
    if (!ex || ex.exercise_id !== s.exercise_id) {
      ex = { exercise_id: s.exercise_id, name: s.exercise_name, sets: [] };
      exercises.push(ex);
    }
    ex.sets.push({
      weight_kg: s.weight_kg,
      reps: s.reps,
      ...(s.rir !== null && { rir: s.rir }),
      ...(s.duration_s !== null && { duration_s: s.duration_s }),
      ...(s.distance !== null && { distance: s.distance }),
      ...(s.set_type !== null && s.set_type !== "normal" && { set_type: s.set_type }),
      ...(s.is_completed === 0 && { completed: false }),
      ...(s.record_type && { record: { type: s.record_type, level: s.record_level, value: s.record_value } }),
    });
  }
  return {
    id: workout.id,
    date: workout.perform_date,
    title: workout.title,
    duration_min: workout.duration_s !== null ? Math.round(workout.duration_s / 60) : null,
    body_weight_kg: workout.body_weight_kg,
    exercises,
  };
}
