import type { Database } from "bun:sqlite";
import type { ApiExercise, ApiWorkout } from "./client";
import { bodyPartNames, equipmentNames, muscleNames } from "./metadata";

export const LYFTA_MIGRATIONS: string[] = [
  // 1: initial schema. Weights are stored in the account's unit (kg for
  // Philip); `raw` keeps the full API workout JSON for future re-processing.
  `
  CREATE TABLE lyfta_workouts (
    id              INTEGER PRIMARY KEY,
    title           TEXT,
    perform_date    TEXT NOT NULL,
    performed_at    TEXT,
    duration_s      INTEGER,
    total_volume_kg REAL,
    body_weight_kg  REAL,
    raw             TEXT NOT NULL,
    synced_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_lyfta_workouts_date ON lyfta_workouts(perform_date);

  CREATE TABLE lyfta_sets (
    id                INTEGER PRIMARY KEY,
    workout_id        INTEGER NOT NULL REFERENCES lyfta_workouts(id) ON DELETE CASCADE,
    exercise_id       INTEGER NOT NULL,
    exercise_name     TEXT NOT NULL,
    exercise_position INTEGER NOT NULL,
    set_index         INTEGER NOT NULL,
    weight_kg         REAL,
    reps              INTEGER,
    rir               REAL,
    duration_s        REAL,
    distance          REAL,
    set_type          TEXT,
    is_completed      INTEGER NOT NULL DEFAULT 1,
    record_type       TEXT,
    record_level      TEXT,
    record_value      TEXT
  );
  CREATE INDEX idx_lyfta_sets_workout ON lyfta_sets(workout_id);
  CREATE INDEX idx_lyfta_sets_exercise ON lyfta_sets(exercise_id);

  CREATE TABLE lyfta_exercises (
    id                INTEGER PRIMARY KEY,
    name              TEXT NOT NULL,
    image             TEXT,
    exercise_type     TEXT,
    equipment         TEXT,
    body_part         TEXT,
    target_muscles    TEXT,
    synergist_muscles TEXT
  );

  CREATE TABLE lyfta_sync_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// "2025-07-15 06:42:09" → "2025-07-15" (+ full timestamp preserved separately).
export function normalizeDate(raw: unknown): { date: string; at: string | null } | null {
  if (typeof raw !== "string") return null;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return { date: iso[1]!, at: raw };
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return { date: parsed.toISOString().slice(0, 10), at: raw };
}

// "01:06:25" | "66:25" | "3985" → seconds.
export function parseDuration(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : null;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const s = raw.trim();
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return null;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return null;
}

const SET_TYPES: Record<number, string> = { 0: "normal" };

// Insert-or-replace one workout with its sets. Sets are delete + reinsert:
// Lyfta lets you edit a past workout, and diffing sets buys nothing.
export function upsertWorkout(db: Database, w: ApiWorkout): { inserted: boolean } | null {
  const id = num(w.id);
  const when = normalizeDate(w.workout_perform_date);
  if (id === null || when === null) return null; // unusable row; skip, keep syncing
  const existed =
    db.query<{ id: number }, [number]>("SELECT id FROM lyfta_workouts WHERE id = ?").get(id) !== null;
  db.transaction(() => {
    db.run(
      `INSERT INTO lyfta_workouts (id, title, perform_date, performed_at, duration_s, total_volume_kg, body_weight_kg, raw, synced_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, perform_date = excluded.perform_date,
         performed_at = excluded.performed_at, total_volume_kg = excluded.total_volume_kg,
         body_weight_kg = excluded.body_weight_kg, raw = excluded.raw,
         synced_at = excluded.synced_at`,
      [id, w.title ?? null, when.date, when.at, num(w.total_volume), num(w.body_weight), JSON.stringify(w)],
    );
    db.run("DELETE FROM lyfta_sets WHERE workout_id = ?", [id]);
    const insertSet = db.prepare(
      `INSERT INTO lyfta_sets (workout_id, exercise_id, exercise_name, exercise_position, set_index,
         weight_kg, reps, rir, duration_s, distance, set_type, is_completed,
         record_type, record_level, record_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    (w.exercises ?? []).forEach((ex, exIdx) => {
      const exerciseId = num(ex.exercise_id);
      if (exerciseId === null) return;
      (ex.sets ?? []).forEach((set, setIdx) => {
        const typeId = num(set.set_type_id);
        insertSet.run(
          id,
          exerciseId,
          ex.excercise_name ?? `exercise ${exerciseId}`,
          exIdx,
          setIdx,
          num(set.weight),
          num(set.reps),
          num(set.rir),
          num(set.duration),
          num(set.distance),
          typeId === null ? null : (SET_TYPES[typeId] ?? String(typeId)),
          set.is_completed === false || set.is_completed === 0 ? 0 : 1,
          set.record_type ?? null,
          set.record_level ?? null,
          set.record_value ?? null,
        );
      });
    });
  })();
  return { inserted: !existed };
}

export function setWorkoutDuration(db: Database, id: number, durationS: number): void {
  db.run("UPDATE lyfta_workouts SET duration_s = ? WHERE id = ?", [durationS, id]);
}

export function upsertExercise(db: Database, e: ApiExercise): void {
  const id = num(e.id);
  if (id === null || !e.name) return;
  db.run(
    `INSERT INTO lyfta_exercises (id, name, image, exercise_type, equipment, body_part, target_muscles, synergist_muscles)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, image = excluded.image, exercise_type = excluded.exercise_type,
       equipment = excluded.equipment, body_part = excluded.body_part,
       target_muscles = excluded.target_muscles, synergist_muscles = excluded.synergist_muscles`,
    [
      id,
      e.name,
      e.image_name ?? null,
      e.exercise_type ?? null,
      equipmentNames(e.equipment_id),
      bodyPartNames(e.body_part_id),
      muscleNames(e.Target_muscles_id),
      muscleNames(e.Synergist_muscles_id),
    ],
  );
}

export function knownWorkoutIds(db: Database): Set<number> {
  return new Set(db.query<{ id: number }, []>("SELECT id FROM lyfta_workouts").all().map((r) => r.id));
}

export function getSyncState(db: Database, key: string): string | null {
  return db.query<{ value: string }, [string]>("SELECT value FROM lyfta_sync_state WHERE key = ?").get(key)?.value ?? null;
}

export function setSyncState(db: Database, key: string, value: string): void {
  db.run(
    "INSERT INTO lyfta_sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

export function clearSyncState(db: Database, key: string): void {
  db.run("DELETE FROM lyfta_sync_state WHERE key = ?", [key]);
}

export interface WorkoutRow {
  id: number;
  title: string | null;
  perform_date: string;
  performed_at: string | null;
  duration_s: number | null;
  total_volume_kg: number | null;
  body_weight_kg: number | null;
}

export interface SetRow {
  workout_id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_position: number;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  duration_s: number | null;
  distance: number | null;
  set_type: string | null;
  is_completed: number;
  record_type: string | null;
  record_level: string | null;
  record_value: string | null;
}

const WORKOUT_COLS = "id, title, perform_date, performed_at, duration_s, total_volume_kg, body_weight_kg";

export function listWorkouts(
  db: Database,
  opts: { from?: string; to?: string; limit?: number; offset?: number } = {},
): { total: number; workouts: WorkoutRow[] } {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};
  if (opts.from) {
    conditions.push("perform_date >= $from");
    params["$from"] = opts.from;
  }
  if (opts.to) {
    conditions.push("perform_date <= $to");
    params["$to"] = opts.to;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = db
    .query<{ n: number }, Record<string, string | number>>(`SELECT COUNT(*) AS n FROM lyfta_workouts ${where}`)
    .get(params)!.n;
  const workouts = db
    .query<WorkoutRow, Record<string, string | number>>(
      `SELECT ${WORKOUT_COLS} FROM lyfta_workouts ${where}
       ORDER BY perform_date DESC, id DESC LIMIT $limit OFFSET $offset`,
    )
    .all({ ...params, $limit: opts.limit ?? 30, $offset: opts.offset ?? 0 });
  return { total, workouts };
}

export function getWorkout(db: Database, ref: { id?: number; date?: string }): WorkoutRow | null {
  if (ref.id !== undefined) {
    return (
      db.query<WorkoutRow, [number]>(`SELECT ${WORKOUT_COLS} FROM lyfta_workouts WHERE id = ?`).get(ref.id) ?? null
    );
  }
  if (ref.date !== undefined) {
    return (
      db
        .query<WorkoutRow, [string]>(
          `SELECT ${WORKOUT_COLS} FROM lyfta_workouts WHERE perform_date = ? ORDER BY id DESC`,
        )
        .get(ref.date) ?? null
    );
  }
  return null;
}

export function setsForWorkout(db: Database, workoutId: number): SetRow[] {
  return db
    .query<SetRow, [number]>(
      "SELECT * FROM lyfta_sets WHERE workout_id = ? ORDER BY exercise_position, set_index",
    )
    .all(workoutId);
}

export interface ExerciseRow {
  id: number;
  name: string;
  image: string | null;
  exercise_type: string | null;
  equipment: string | null;
  body_part: string | null;
  target_muscles: string | null;
  synergist_muscles: string | null;
}

export function getExercise(db: Database, id: number): ExerciseRow | null {
  return db.query<ExerciseRow, [number]>("SELECT * FROM lyfta_exercises WHERE id = ?").get(id) ?? null;
}

// Resolve an exercise by name against what has actually been performed, most
// trained first — "bench" should hit the bench press done weekly, not a
// variation tried once.
export function findPerformedExercises(db: Database, search: string): Array<{ exercise_id: number; name: string; sessions: number }> {
  return db
    .query<{ exercise_id: number; name: string; sessions: number }, [string]>(
      `SELECT s.exercise_id, MAX(s.exercise_name) AS name, COUNT(DISTINCT s.workout_id) AS sessions
       FROM lyfta_sets s
       WHERE s.exercise_name LIKE '%' || ? || '%' COLLATE NOCASE
       GROUP BY s.exercise_id ORDER BY sessions DESC LIMIT 10`,
    )
    .all(search);
}
