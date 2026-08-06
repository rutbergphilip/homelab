import { config } from "../config";

// Training data lives in claude-db (the lyfta domain syncs it hourly from the
// Lyfta API). kcal-assistant is a pure consumer: it reads claude-db's
// cluster-internal projection and never talks to the vendor cloud itself —
// same principle as Withings/Oura, where HA is the only vendor client.

export interface TrainingWeeklyPoint {
  week_start: string;
  workouts: number;
  volume_kg: number;
  sets: number;
  duration_min: number | null;
}

export interface TrainingWorkout {
  id: number;
  date: string;
  title: string | null;
  duration_min: number | null;
  volume_kg: number;
  sets: number;
  exercises: number;
}

export interface TrainingTopExercise {
  exercise_id: number;
  name: string;
  sessions: number;
  last_performed: string;
  best_weight_kg: number | null;
  best_e1rm_kg: number | null;
  latest_e1rm_kg: number | null;
}

export interface TrainingSummary {
  status: "ok";
  configured: boolean;
  last_synced: string | null;
  last_error: string | null;
  workout_count: number;
  this_week: { workouts: number; volume_kg: number; sets: number };
  weekly: TrainingWeeklyPoint[];
  recent_workouts: TrainingWorkout[];
  top_exercises: TrainingTopExercise[];
}

export interface TrainingProgressPoint {
  date: string;
  best_weight_kg: number | null;
  best_reps: number | null;
  e1rm_kg: number | null;
  volume_kg: number;
  sets: number;
}

export interface TrainingProgress {
  status: "ok";
  exercise: { id: number; name: string; equipment: string | null; body_part: string | null } | null;
  days: number;
  points: TrainingProgressPoint[];
}

export type TrainingView =
  | ({ available: true } & TrainingSummary)
  | { available: false; reason: string };

export type TrainingProgressView =
  | ({ available: true } & TrainingProgress)
  | { available: false; reason: string };

const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 3_000;

interface CacheEntry {
  at: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

async function fetchInternal<T>(path: string, baseUrl?: string): Promise<T> {
  const base = (baseUrl ?? config.claudeDbUrl).replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`claude-db HTTP ${res.status}`);
  return (await res.json()) as T;
}

// 60 s cache: the UI polls per navigation and chat may call repeatedly in one
// conversation; the data only changes when claude-db's hourly sync runs.
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  const data = await load();
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 50) cache.delete(cache.keys().next().value!);
  return data;
}

export function clearTrainingCache(): void {
  cache.clear();
}

// Degrades instead of throwing: claude-db being down must never break the
// kcal UI or a chat turn — training is context, not core.
export async function getTrainingSummary(baseUrl?: string): Promise<TrainingView> {
  try {
    const summary = await cached(`summary:${baseUrl ?? ""}`, () =>
      fetchInternal<TrainingSummary>("/internal/lyfta/summary", baseUrl),
    );
    return { available: true, ...summary };
  } catch (e) {
    console.error("training summary:", e instanceof Error ? e.message : e);
    return { available: false, reason: "claude-db svarar inte" };
  }
}

export async function getTrainingProgress(
  exerciseId: number,
  days: number,
  baseUrl?: string,
): Promise<TrainingProgressView> {
  try {
    const progress = await cached(`progress:${exerciseId}:${days}:${baseUrl ?? ""}`, () =>
      fetchInternal<TrainingProgress>(`/internal/lyfta/progress?exercise_id=${exerciseId}&days=${days}`, baseUrl),
    );
    return { available: true, ...progress };
  } catch (e) {
    console.error("training progress:", e instanceof Error ? e.message : e);
    return { available: false, reason: "claude-db svarar inte" };
  }
}
