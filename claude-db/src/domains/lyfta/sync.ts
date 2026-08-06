import type { Database } from "bun:sqlite";
import type { LyftaClient } from "./client";
import {
  clearSyncState,
  knownWorkoutIds,
  num,
  parseDuration,
  setSyncState,
  setWorkoutDuration,
  upsertExercise,
  upsertWorkout,
} from "./db";

export interface SyncResult {
  upserted_workouts: number;
  new_workouts: number;
  total_workouts: number;
  exercises: number;
  last_synced: string;
}

const PAGE_LIMIT = 100;
const SUMMARY_LIMIT = 1000;
const MAX_PAGES = 200; // 20k workouts — a runaway-pagination backstop, not a real cap

// Workouts arrive newest-first, so incremental mode can stop after the first
// page whose ids are all already stored. That page is still upserted — recent
// edits to a logged workout land without a full walk.
export async function syncLyfta(
  db: Database,
  client: LyftaClient,
  opts: { full?: boolean } = {},
): Promise<SyncResult> {
  const known = knownWorkoutIds(db);
  let upserted = 0;
  let created = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await client.workouts(page, PAGE_LIMIT);
    const workouts = res.workouts ?? [];
    if (workouts.length === 0) break;
    let sawNew = false;
    for (const w of workouts) {
      const result = upsertWorkout(db, w);
      if (!result) continue;
      upserted++;
      if (result.inserted) {
        created++;
        sawNew = true;
      } else if (!known.has(Number(w.id))) {
        sawNew = true;
      }
    }
    const lastPage = res.total_pages !== undefined && page >= res.total_pages;
    if (lastPage) break;
    if (!opts.full && !sawNew) break;
  }

  // The detail endpoint has no duration; the summary endpoint does.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await client.workoutsSummary(page, SUMMARY_LIMIT);
    const summaries = res.workouts ?? [];
    for (const s of summaries) {
      const id = num(s.id);
      const duration = parseDuration(s.workout_duration);
      if (id !== null && duration !== null) setWorkoutDuration(db, id, duration);
    }
    if (summaries.length < SUMMARY_LIMIT) break;
    if (res.total_pages !== undefined && page >= res.total_pages) break;
  }

  let exercises = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await client.exercises(page, PAGE_LIMIT);
    const list = res.exercises ?? [];
    for (const e of list) {
      upsertExercise(db, e);
      exercises++;
    }
    if (list.length < PAGE_LIMIT) break;
  }

  const lastSynced = new Date().toISOString();
  const total = db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM lyfta_workouts").get()!.n;
  setSyncState(db, "last_synced", lastSynced);
  clearSyncState(db, "last_error");

  return {
    upserted_workouts: upserted,
    new_workouts: created,
    total_workouts: total,
    exercises,
    last_synced: lastSynced,
  };
}

// Shared by the startup/interval scheduler and nothing else: one in-flight
// sync at a time, failures recorded in sync_state instead of thrown.
export function makeAutoSync(db: Database, client: LyftaClient): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      const result = await syncLyfta(db, client);
      console.log(
        `lyfta sync: ${result.new_workouts} new, ${result.upserted_workouts} upserted, ${result.total_workouts} total`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("lyfta sync failed:", message);
      try {
        setSyncState(db, "last_error", `${new Date().toISOString()} ${message}`);
      } catch {
        /* db closed during shutdown — nothing to record */
      }
    } finally {
      running = false;
    }
  };
}
