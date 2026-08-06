import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { jsonResult, wrap } from "../../core/tool-util";
import type { LyftaClient, TemplateExerciseInput, TemplateSetInput } from "./client";
import {
  findPerformedExercises,
  getExercise,
  getSyncState,
  getWorkout,
  listWorkouts,
} from "./db";
import { syncLyfta } from "./sync";
import {
  buildLyftaProgress,
  buildWeekly,
  recentRecords,
  topExercises,
  workoutDetail,
} from "./stats";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

function requireClient(client: LyftaClient | null): LyftaClient {
  if (!client) throw new Error("LYFTA_API_KEY is not configured — synced data still works, live Lyfta calls don't");
  return client;
}

export function registerLyftaTools(server: McpServer, db: Database, client: LyftaClient | null): void {
  server.registerTool(
    "lyfta_sync",
    {
      description:
        "Pull Philip's workouts from the Lyfta API into the local database. Runs automatically every hour, " +
        "so only call this when he just finished a workout and wants it reflected now. `full` re-walks the " +
        "entire history (first sync does this implicitly); default is incremental.",
      inputSchema: { full: z.boolean().optional() },
    },
    wrap(async ({ full }) => jsonResult(await syncLyfta(db, requireClient(client), { full }))),
  );

  server.registerTool(
    "lyfta_status",
    {
      description: "Lyfta sync health: API key configured?, last sync time, last error, workout/exercise counts.",
      inputSchema: {},
    },
    wrap(() =>
      jsonResult({
        configured: client !== null,
        last_synced: getSyncState(db, "last_synced"),
        last_error: getSyncState(db, "last_error"),
        workouts: db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM lyfta_workouts").get()!.n,
        exercises: db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM lyfta_exercises").get()!.n,
      }),
    ),
  );

  server.registerTool(
    "lyfta_workouts",
    {
      description:
        "List synced workouts newest first (one line each: date, title, duration, volume). " +
        "Use lyfta_workout for the full set-by-set detail.",
      inputSchema: {
        from: dateSchema.optional(),
        to: dateSchema.optional(),
        limit: z.number().int().min(1).max(200).optional().describe("Default 30"),
        offset: z.number().int().min(0).optional(),
      },
    },
    wrap((opts) => jsonResult(listWorkouts(db, opts))),
  );

  server.registerTool(
    "lyfta_workout",
    {
      description: "Full detail for one workout — every exercise with every set (weight, reps, RIR, PRs). Reference by id or date (latest workout that day).",
      inputSchema: { workout_id: z.number().int().optional(), date: dateSchema.optional() },
    },
    wrap(({ workout_id, date }) => {
      if (workout_id === undefined && date === undefined) throw new Error("provide workout_id or date");
      const workout = getWorkout(db, { id: workout_id, date });
      if (!workout) throw new Error("workout not found");
      return jsonResult(workoutDetail(db, workout));
    }),
  );

  server.registerTool(
    "lyfta_progress",
    {
      description:
        "Strength progression for one exercise: per-session best set, estimated 1RM (Epley) and volume. " +
        "Resolve by `exercise` name search (e.g. \"bench\") or exact exercise_id. Ambiguous names return the " +
        "candidates so you can pick.",
      inputSchema: {
        exercise: z.string().optional().describe("Name search among performed exercises"),
        exercise_id: z.number().int().optional(),
        days: z.number().int().min(7).max(3650).optional().describe("Default 365"),
      },
    },
    wrap(({ exercise, exercise_id, days }) => {
      let id = exercise_id;
      if (id === undefined) {
        if (!exercise) throw new Error("provide exercise or exercise_id");
        const matches = findPerformedExercises(db, exercise);
        if (matches.length === 0) throw new Error(`no performed exercise matches "${exercise}"`);
        if (matches.length > 1 && matches[1]!.sessions === matches[0]!.sessions) {
          return jsonResult({ ambiguous: true, candidates: matches });
        }
        id = matches[0]!.exercise_id;
      }
      return jsonResult(buildLyftaProgress(db, id, days ?? 365));
    }),
  );

  server.registerTool(
    "lyfta_stats",
    {
      description:
        "Training overview: weekly volume/frequency for the last N weeks, most-trained exercises with best " +
        "and latest e1RM, and recent PRs. The place to start for \"how is training going\".",
      inputSchema: { weeks: z.number().int().min(1).max(104).optional().describe("Default 12") },
    },
    wrap(({ weeks }) =>
      jsonResult({
        weekly: buildWeekly(db, weeks ?? 12),
        top_exercises: topExercises(db, { days: 180, limit: 10 }),
        recent_records: recentRecords(db, 15),
      }),
    ),
  );

  server.registerTool(
    "lyfta_search_library",
    {
      description:
        "Search Lyfta's exercise catalog (live API). Needed before lyfta_push_program: templates must echo the " +
        "catalog's exact id, name, type and image for each exercise.",
      inputSchema: {
        search: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional().describe("Default 10"),
        offset: z.number().int().min(0).optional(),
      },
    },
    wrap(async ({ search, limit, offset }) => {
      const res = await requireClient(client).searchLibrary(search, limit ?? 10, offset ?? 0);
      return jsonResult(res.data ?? { results: [] });
    }),
  );

  const setSchema = z.object({
    reps: z.string().optional(),
    from_reps: z.string().optional().describe("Rep-range lower bound (use with to_reps instead of reps)"),
    to_reps: z.string().optional(),
    weight: z.string().optional(),
    rir: z.string().optional(),
    duration: z.string().optional(),
    distance: z.string().optional(),
  });

  const exerciseSchema = z.object({
    exercise_id: z.number().int(),
    name: z.string().optional().describe("Catalog name; falls back to the locally synced exercise"),
    exercise_type: z.string().optional(),
    image: z.string().optional(),
    note: z.string().optional(),
    rest_time_s: z.number().int().optional(),
    superset_id: z.number().int().optional().describe("Same id groups exercises into a superset; 0/absent = none"),
    sets: z.array(setSchema).min(1),
  });

  server.registerTool(
    "lyfta_push_program",
    {
      description:
        "Create a training program IN Philip's Lyfta app: one collection plus one template per workout. " +
        "Exercises are validated against the catalog — pass ids from lyfta_search_library or from already-synced " +
        "exercises (name/type/image auto-fill from the local copy when omitted). Confirm the program with Philip " +
        "before pushing; deleting it must be done in the app.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        goal: z.string().optional(),
        workouts: z
          .array(z.object({ title: z.string().min(1), note: z.string().optional(), exercises: z.array(exerciseSchema).min(1) }))
          .min(1),
      },
    },
    wrap(async ({ title, description, goal, workouts }) => {
      const live = requireClient(client);
      // Resolve every exercise BEFORE creating anything — a half-pushed
      // program in the app is worse than a clean error here.
      const resolved = workouts.map((w) => ({
        title: w.title,
        note: w.note,
        exercises: w.exercises.map((ex): TemplateExerciseInput => {
          const local = getExercise(db, ex.exercise_id);
          const name = ex.name ?? local?.name;
          const type = ex.exercise_type ?? local?.exercise_type ?? "weight_reps";
          const image = ex.image ?? local?.image;
          if (!name || !image) {
            throw new Error(
              `exercise ${ex.exercise_id}: name/image unknown — pass them from lyfta_search_library results`,
            );
          }
          return {
            exercise_id: ex.exercise_id,
            excercise_name: name,
            exercise_type: type,
            exercise_image: image,
            ...(ex.note && { exercise_note: ex.note }),
            ...(ex.rest_time_s !== undefined && { exercise_rest_time: ex.rest_time_s }),
            ...(ex.superset_id !== undefined && { exercise_superset_id: ex.superset_id }),
            sets: ex.sets.map((s): TemplateSetInput => ({
              ...(s.reps !== undefined && { reps: s.reps }),
              ...(s.from_reps !== undefined && { from_reps: s.from_reps }),
              ...(s.to_reps !== undefined && { to_reps: s.to_reps }),
              ...(s.weight !== undefined && { weight: s.weight }),
              ...(s.rir !== undefined && { rir: s.rir }),
              ...(s.duration !== undefined && { duration: s.duration }),
              ...(s.distance !== undefined && { distance: s.distance }),
            })),
          };
        }),
      }));

      const collection = await live.createCollection({ title, ...(description && { description }), ...(goal && { goal }) });
      const templates: Array<{ id: number; title: string }> = [];
      for (const w of resolved) {
        const t = await live.createTemplate({
          collectionId: collection.id,
          workout: { title: w.title, ...(w.note && { note: w.note }), exercises: w.exercises },
        });
        templates.push({ id: t.id, title: w.title });
      }
      return jsonResult({ collection_id: collection.id, title, templates });
    }),
  );
}
