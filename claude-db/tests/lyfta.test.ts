import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import type {
  ApiExercisesPage,
  ApiLibraryResult,
  ApiSummaryPage,
  ApiWorkout,
  ApiWorkoutsPage,
  LyftaClient,
} from "../src/domains/lyfta/client";
import {
  findPerformedExercises,
  getSyncState,
  getWorkout,
  listWorkouts,
  normalizeDate,
  parseDuration,
  setsForWorkout,
  upsertWorkout,
} from "../src/domains/lyfta/db";
import { syncLyfta } from "../src/domains/lyfta/sync";
import {
  buildLyftaProgress,
  buildLyftaSummary,
  buildWeekly,
  epley1RM,
  exerciseProgress,
  recentWorkouts,
  topExercises,
  weekStartMonday,
  workoutDetail,
} from "../src/domains/lyfta/stats";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

// Numbers as strings on purpose: that is how the Lyfta API ships them.
function sampleWorkout(id: number, date: string, weight = "80"): ApiWorkout {
  return {
    id,
    title: `Pass ${id}`,
    body_weight: "79.9",
    workout_perform_date: `${date} 06:42:09`,
    total_volume: "1234",
    exercises: [
      {
        exercise_id: "192",
        excercise_name: "Barbell Bench Press",
        exercise_type: "weight_reps",
        exercise_image: "bench.png",
        sets: [
          { id: "a", weight, reps: "8", rir: "2", set_type_id: "0", is_completed: true },
          { id: "b", weight, reps: "6", set_type_id: "0", is_completed: true, record_type: "weight", record_level: "gold", record_value: weight },
          { id: "c", weight: "", reps: "", is_completed: false },
        ],
      },
      {
        exercise_id: 411,
        excercise_name: "Plank",
        exercise_type: "duration",
        sets: [{ duration: "60", is_completed: true }],
      },
    ],
  };
}

describe("lyfta parsing", () => {
  test("normalizeDate handles the API's 'YYYY-MM-DD HH:MM:SS'", () => {
    expect(normalizeDate("2025-07-15 06:42:09")).toEqual({ date: "2025-07-15", at: "2025-07-15 06:42:09" });
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate("not a date")).toBeNull();
  });

  test("parseDuration handles hh:mm:ss, mm:ss and plain seconds", () => {
    expect(parseDuration("01:06:25")).toBe(3985);
    expect(parseDuration("06:25")).toBe(385);
    expect(parseDuration("90")).toBe(90);
    expect(parseDuration("")).toBeNull();
    expect(parseDuration(null)).toBeNull();
  });

  test("epley: 1 rep is the weight itself, 10 reps ≈ +33%", () => {
    expect(epley1RM(100, 1)).toBe(100);
    expect(Math.round(epley1RM(100, 10))).toBe(133);
  });

  test("weekStartMonday", () => {
    expect(weekStartMonday("2026-08-06")).toBe("2026-08-03"); // Thu → Mon
    expect(weekStartMonday("2026-08-03")).toBe("2026-08-03");
    expect(weekStartMonday("2026-08-09")).toBe("2026-08-03"); // Sun stays in week
  });
});

describe("lyfta workouts", () => {
  test("upsert stores workout + sets with numeric coercion; re-upsert replaces sets", () => {
    const db = freshDb();
    expect(upsertWorkout(db, sampleWorkout(1, "2026-08-03"))).toEqual({ inserted: true });
    const w = getWorkout(db, { id: 1 })!;
    expect(w.perform_date).toBe("2026-08-03");
    expect(w.body_weight_kg).toBe(79.9);
    let sets = setsForWorkout(db, 1);
    expect(sets).toHaveLength(4);
    expect(sets[0]!.weight_kg).toBe(80);
    expect(sets[0]!.reps).toBe(8);
    expect(sets[2]!.is_completed).toBe(0);
    expect(sets[3]!.exercise_name).toBe("Plank");

    // Edited in the app: one set removed → replaced, not appended.
    const edited = sampleWorkout(1, "2026-08-03");
    edited.exercises![0]!.sets = edited.exercises![0]!.sets!.slice(0, 1);
    expect(upsertWorkout(db, edited)).toEqual({ inserted: false });
    sets = setsForWorkout(db, 1);
    expect(sets).toHaveLength(2);
  });

  test("unusable rows are skipped without breaking sync", () => {
    const db = freshDb();
    expect(upsertWorkout(db, { id: "x" as unknown as number, workout_perform_date: "2026-01-01 10:00:00" })).toBeNull();
    expect(upsertWorkout(db, { id: 5, workout_perform_date: null })).toBeNull();
  });

  test("listWorkouts filters by range and paginates; getWorkout by date", () => {
    const db = freshDb();
    upsertWorkout(db, sampleWorkout(1, "2026-07-01"));
    upsertWorkout(db, sampleWorkout(2, "2026-07-15"));
    upsertWorkout(db, sampleWorkout(3, "2026-08-01"));
    expect(listWorkouts(db).workouts.map((w) => w.id)).toEqual([3, 2, 1]);
    expect(listWorkouts(db, { from: "2026-07-10", to: "2026-07-31" }).total).toBe(1);
    expect(listWorkouts(db, { limit: 1, offset: 1 }).workouts[0]!.id).toBe(2);
    expect(getWorkout(db, { date: "2026-07-15" })!.id).toBe(2);
  });
});

function fakeClient(pages: ApiWorkout[][], opts: { durations?: Record<number, string> } = {}) {
  const calls = { workouts: 0, summary: 0, exercises: 0 };
  const client: LyftaClient = {
    workouts: (page): Promise<ApiWorkoutsPage> => {
      calls.workouts++;
      return Promise.resolve({ status: true, total_pages: pages.length, workouts: pages[page - 1] ?? [] });
    },
    workoutsSummary: (): Promise<ApiSummaryPage> => {
      calls.summary++;
      return Promise.resolve({
        status: true,
        workouts: Object.entries(opts.durations ?? {}).map(([id, d]) => ({ id: Number(id), workout_duration: d })),
      });
    },
    exercises: (): Promise<ApiExercisesPage> => {
      calls.exercises++;
      return Promise.resolve({
        status: true,
        exercises: [
          { id: "192", name: "Barbell Bench Press", image_name: "bench.png", exercise_type: "weight_reps", equipment_id: '["1"]', body_part_id: '["2"]', Target_muscles_id: '["25"]' },
        ],
      });
    },
    searchLibrary: (): Promise<ApiLibraryResult> => Promise.resolve({ status: true, data: { results: [] } }),
    createCollection: () => Promise.resolve({ id: 1 }),
    createTemplate: () => Promise.resolve({ id: 1 }),
  };
  return { client, calls };
}

describe("lyfta sync", () => {
  test("full walk, duration backfill, exercise metadata mapping, incremental stop", async () => {
    const db = freshDb();
    const pageOne = [sampleWorkout(3, "2026-08-03"), sampleWorkout(2, "2026-07-30")];
    const pageTwo = [sampleWorkout(1, "2026-07-01")];
    const first = fakeClient([pageOne, pageTwo], { durations: { 3: "01:00:00" } });
    const result = await syncLyfta(db, first.client);
    expect(result.new_workouts).toBe(3);
    expect(result.total_workouts).toBe(3);
    expect(first.calls.workouts).toBe(2);
    expect(getWorkout(db, { id: 3 })!.duration_s).toBe(3600);
    expect(getSyncState(db, "last_synced")).not.toBeNull();
    const ex = db.query<{ equipment: string; body_part: string; target_muscles: string }, []>(
      "SELECT equipment, body_part, target_muscles FROM lyfta_exercises WHERE id = 192",
    ).get()!;
    expect(ex.equipment).toBe("Barbell");
    expect(ex.body_part).toBe("Chest");
    expect(ex.target_muscles).toBe("Pectoralis Major Sternal Head");

    // Nothing new → page 1 upserted (edits land) but page 2 never fetched.
    const second = fakeClient([pageOne, pageTwo]);
    const incremental = await syncLyfta(db, second.client);
    expect(incremental.new_workouts).toBe(0);
    expect(second.calls.workouts).toBe(1);
  });

  // The real API (observed 2026-08-07): endpoints ignore the requested limit
  // (exercises come 20/page no matter what) and paging past the end throws
  // "Requested page is too deep" instead of returning an empty page.
  test("fixed page size + 'page is too deep' terminate loops instead of failing", async () => {
    const db = freshDb();
    const exercisePages = [0, 1, 2].map((p) =>
      Array.from({ length: 20 }, (_, i) => ({
        id: String(1000 + p * 20 + i),
        name: `Övning ${p * 20 + i}`,
        image_name: "x.png",
      })),
    );
    let workoutCalls = 0;
    const client: LyftaClient = {
      workouts: (page) => {
        workoutCalls++;
        if (page > 1) return Promise.reject(new Error("Lyfta API error: Requested page is too deep"));
        // total_pages omitted — termination must come from the error path
        return Promise.resolve({ status: true, workouts: [sampleWorkout(1, "2026-08-01")] });
      },
      workoutsSummary: (page) =>
        page > 1
          ? Promise.reject(new Error("Lyfta API error: Requested page is too deep"))
          : Promise.resolve({ status: true, workouts: [{ id: 1, workout_duration: "00:45:00" }] }),
      exercises: (page) =>
        page > 3
          ? Promise.reject(new Error("Lyfta API error: Requested page is too deep"))
          : Promise.resolve({ status: true, exercises: exercisePages[page - 1]! }),
      searchLibrary: () => Promise.resolve({ status: true }),
      createCollection: () => Promise.resolve({ id: 1 }),
      createTemplate: () => Promise.resolve({ id: 1 }),
    };
    const result = await syncLyfta(db, client, { full: true });
    expect(result.total_workouts).toBe(1);
    expect(result.exercises).toBe(60);
    expect(result.last_synced).not.toBeNull();
    expect(getSyncState(db, "last_error")).toBeNull();
    expect(getWorkout(db, { id: 1 })!.duration_s).toBe(2700);
    expect(workoutCalls).toBe(2); // page 2 attempted once, error absorbed
  });

  test("a repeating page (API ignoring `page`) stops the loop", async () => {
    const db = freshDb();
    let calls = 0;
    const samePage = [sampleWorkout(1, "2026-08-01"), sampleWorkout(2, "2026-08-02")];
    const client: LyftaClient = {
      workouts: () => {
        calls++;
        return Promise.resolve({ status: true, workouts: samePage }); // no total_pages, same ids forever
      },
      workoutsSummary: () => Promise.resolve({ status: true, workouts: [] }),
      exercises: () => Promise.resolve({ status: true, exercises: [] }),
      searchLibrary: () => Promise.resolve({ status: true }),
      createCollection: () => Promise.resolve({ id: 1 }),
      createTemplate: () => Promise.resolve({ id: 1 }),
    };
    const result = await syncLyfta(db, client, { full: true });
    expect(result.total_workouts).toBe(2);
    expect(calls).toBe(2); // page 2 detected as a repeat, loop stopped
  });
});

describe("lyfta stats", () => {
  function seed(db: Database): void {
    // Two sessions this week + one last week, bench progressing 80 → 85.
    upsertWorkout(db, sampleWorkout(1, weekStartMonday(today) === today ? today : weekStartMonday(today), "80"));
    upsertWorkout(db, sampleWorkout(2, today, "85"));
    const lastWeek = new Date(`${today}T12:00:00Z`);
    lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
    upsertWorkout(db, sampleWorkout(3, lastWeek.toISOString().slice(0, 10), "77.5"));
  }

  test("weekly grouping fills gap weeks and sums volume", () => {
    const db = freshDb();
    seed(db);
    const weekly = buildWeekly(db, 4);
    expect(weekly).toHaveLength(4);
    expect(weekly.at(-1)!.workouts).toBe(2);
    expect(weekly.at(-2)!.workouts).toBe(1);
    expect(weekly[0]!.workouts).toBe(0);
    // volume for 85 kg session: 85×8 + 85×6 = 1190; plus 80 kg session 1120.
    expect(weekly.at(-1)!.volume_kg).toBe(2310);
  });

  test("progression, name resolution, top exercises", () => {
    const db = freshDb();
    seed(db);
    const matches = findPerformedExercises(db, "bench");
    expect(matches[0]!.exercise_id).toBe(192);
    const points = exerciseProgress(db, 192, 365);
    // On a Monday the two this-week sessions share a date and merge to one point.
    const expectedPoints = weekStartMonday(today) === today ? 2 : 3;
    expect(points).toHaveLength(expectedPoints);
    expect(points.at(-1)!.best_weight_kg).toBe(85);
    expect(points.at(-1)!.best_reps).toBe(8);
    expect(points.at(-1)!.e1rm_kg).toBeCloseTo(85 * (1 + 8 / 30), 1);

    const top = topExercises(db, { days: 30, limit: 5 });
    expect(top[0]!.exercise_id).toBe(192);
    expect(top[0]!.sessions).toBe(3);
    expect(top[0]!.best_weight_kg).toBe(85);

    const progress = buildLyftaProgress(db, 192, 365);
    expect(progress.exercise!.name).toBe("Barbell Bench Press");
    expect(progress.points).toHaveLength(expectedPoints);
  });

  test("summary projection works and degrades on empty db", () => {
    const db = freshDb();
    seed(db);
    const summary = buildLyftaSummary(db, true);
    expect(summary.configured).toBe(true);
    expect(summary.workout_count).toBe(3);
    expect(summary.this_week.workouts).toBe(2);
    expect(summary.weekly).toHaveLength(12);
    expect(summary.recent_workouts[0]!.sets).toBe(4);
    expect(summary.top_exercises[0]!.name).toBe("Barbell Bench Press");

    const empty = buildLyftaSummary(freshDb(), false);
    expect(empty.workout_count).toBe(0);
    expect(empty.configured).toBe(false);
    expect(empty.weekly).toHaveLength(12);
  });

  test("workout detail groups sets under exercises with records", () => {
    const db = freshDb();
    upsertWorkout(db, sampleWorkout(1, "2026-08-03"));
    const detail = workoutDetail(db, getWorkout(db, { id: 1 })!);
    const exercises = detail["exercises"] as Array<{ name: string; sets: Array<Record<string, unknown>> }>;
    expect(exercises).toHaveLength(2);
    expect(exercises[0]!.sets[1]!["record"]).toEqual({ type: "weight", level: "gold", value: "80" });
    expect(recentWorkouts(db, 5)[0]!.exercises).toBe(2);
  });
});
