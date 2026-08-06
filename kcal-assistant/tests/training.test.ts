import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  clearTrainingCache,
  getTrainingProgress,
  getTrainingSummary,
} from "../src/services/training";

const SUMMARY = {
  status: "ok",
  configured: true,
  last_synced: "2026-08-06T05:00:00.000Z",
  last_error: null,
  workout_count: 42,
  this_week: { workouts: 2, volume_kg: 8000, sets: 40 },
  weekly: [],
  recent_workouts: [],
  top_exercises: [],
};

let summaryHits = 0;
const server = Bun.serve({
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/internal/lyfta/summary") {
      summaryHits++;
      return Response.json(SUMMARY);
    }
    if (url.pathname === "/internal/lyfta/progress") {
      return Response.json({
        status: "ok",
        exercise: { id: Number(url.searchParams.get("exercise_id")), name: "Bench", equipment: null, body_part: null },
        days: Number(url.searchParams.get("days")),
        points: [],
      });
    }
    return new Response("nope", { status: 404 });
  },
});
const base = `http://localhost:${server.port}`;

afterAll(() => server.stop(true));
beforeEach(() => clearTrainingCache());

describe("training service", () => {
  test("summary happy path + 60s cache", async () => {
    summaryHits = 0;
    const first = await getTrainingSummary(base);
    expect(first.available).toBe(true);
    if (first.available) expect(first.workout_count).toBe(42);
    await getTrainingSummary(base);
    expect(summaryHits).toBe(1); // second call served from cache
  });

  test("progress passes exercise_id and days through", async () => {
    const res = await getTrainingProgress(192, 90, base);
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.exercise!.id).toBe(192);
      expect(res.days).toBe(90);
    }
  });

  test("unreachable claude-db degrades instead of throwing", async () => {
    const res = await getTrainingSummary("http://127.0.0.1:1");
    expect(res.available).toBe(false);
    if (!res.available) expect(res.reason).toBeTruthy();
  });
});
