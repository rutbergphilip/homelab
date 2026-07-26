import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { upsertDailyMetrics } from "../src/db/daily";
import { logWeight } from "../src/db/weights";
import { setProfile } from "../src/db/profile";
import { buildInternalHealth } from "../src/ui/internal";
import { createInternalServer } from "../src/server";
import { addDays, todayStockholm } from "../src/lib/dates";

// GET /internal/health backs sensor.kcal_halsa, which is what gives the wall
// hub's Hälsa page its 14-day sparklines (a Lovelace card cannot read history,
// so kcal-assistant is the history store — see spec §4).

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

const TODAY = todayStockholm();

describe("buildInternalHealth", () => {
  test("an empty table degrades to no days rather than throwing", () => {
    const view = buildInternalHealth(db);
    expect(view.status).toBe("ok");
    expect(view.days).toEqual([]);
    expect(view.latest).toBeNull();
  });

  test("returns a 14-day window ending today", () => {
    for (let i = 0; i < 20; i++) {
      upsertDailyMetrics(db, { date: addDays(TODAY, -i), oura_total_kcal: 3000 + i });
    }
    const view = buildInternalHealth(db);

    expect(view.days).toHaveLength(14);
    expect(view.days[0]!.date).toBe(addDays(TODAY, -13));
    expect(view.days[13]!.date).toBe(TODAY);
  });

  test("latest is the newest day in the window", () => {
    upsertDailyMetrics(db, { date: addDays(TODAY, -3), sleep_score: 71 });
    upsertDailyMetrics(db, { date: addDays(TODAY, -1), sleep_score: 85 });

    expect(buildInternalHealth(db).latest).toMatchObject({
      date: addDays(TODAY, -1),
      sleep_score: 85,
    });
  });

  test("days older than the window are excluded", () => {
    upsertDailyMetrics(db, { date: addDays(TODAY, -40), sleep_score: 60 });
    const view = buildInternalHealth(db);
    expect(view.days).toEqual([]);
    expect(view.latest).toBeNull();
  });
});

describe("internal listener — health and write endpoints", () => {
  let server: Server;
  let base: string;
  let serverDb: Database;

  beforeEach(async () => {
    serverDb = openDb(":memory:");
    server = createInternalServer({ db: serverDb });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const postWeight = (body: unknown): Promise<Response> =>
    fetch(`${base}/internal/weight`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  const postDaily = (body: unknown): Promise<Response> =>
    fetch(`${base}/internal/daily`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  describe("POST /internal/weight", () => {
    test("stores a weigh-in as an automatic entry", async () => {
      const res = await postWeight({ weight_kg: 79.91, date: "2026-07-26" });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, applied: true, date: "2026-07-26" });

      expect(
        serverDb.query("SELECT weight_kg, source FROM weights WHERE date = '2026-07-26'").get(),
      ).toMatchObject({ weight_kg: 79.91, source: "withings" });
    });

    test("a duplicate weigh-in is a 200 no-op, never an error", async () => {
      // rest_command surfaces any non-2xx as a failed action in the automation
      // trace, so normal idempotent operation must not look like a failure.
      await postWeight({ weight_kg: 79.91, date: "2026-07-26" });
      const res = await postWeight({ weight_kg: 80.4, date: "2026-07-26" });

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, applied: false });
    });

    test("defaults to today when no date is given", async () => {
      const res = await postWeight({ weight_kg: 79.91 });
      expect(await res.json()).toMatchObject({ date: TODAY, applied: true });
    });

    test("rejects an implausible weight", async () => {
      const res = await postWeight({ weight_kg: 600 });
      expect(res.status).toBe(400);
      expect(serverDb.query("SELECT count(*) AS n FROM weights").get()).toMatchObject({ n: 0 });
    });

    test("rejects a missing weight", async () => {
      expect((await postWeight({})).status).toBe(400);
    });

    test("rejects a malformed date", async () => {
      expect((await postWeight({ weight_kg: 79.9, date: "26/07" })).status).toBe(400);
    });

    test("rejects a non-POST method", async () => {
      expect((await fetch(`${base}/internal/weight`)).status).toBe(405);
    });

    test("refreshes the forecast snapshot, as the chat tool does", async () => {
      // log_weight rebuilds the canonical snapshot after writing. The automatic
      // path must too, or accuracy tracking silently stops covering the weights
      // Philip no longer logs by hand — which is now most of them.
      setProfile(serverDb, {
        birth_date: "2000-01-15",
        sex: "man",
        height_cm: 180,
        activity_factor: 1.5,
        goal_weight_kg: 75,
      });
      logWeight(serverDb, { weight_kg: 80.6, date: addDays(TODAY, -7) });
      serverDb.run("DELETE FROM forecast_snapshots");

      await postWeight({ weight_kg: 79.91, date: TODAY });

      expect(
        serverDb.query<{ n: number }, []>("SELECT count(*) AS n FROM forecast_snapshots").get()!.n,
      ).toBeGreaterThan(0);
    });
  });

  describe("POST /internal/daily", () => {
    test("stores a night's metrics", async () => {
      const res = await postDaily({
        date: "2026-07-25",
        oura_total_kcal: 3672,
        sleep_score: 85,
        sleep_duration_min: 479,
        readiness_score: 86,
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, date: "2026-07-25" });

      expect(
        serverDb.query("SELECT sleep_score, oura_total_kcal FROM daily_metrics WHERE date = '2026-07-25'").get(),
      ).toMatchObject({ sleep_score: 85, oura_total_kcal: 3672 });
    });

    test("a null metric leaves an existing value intact", async () => {
      await postDaily({ date: "2026-07-25", sleep_score: 85 });
      await postDaily({ date: "2026-07-25", sleep_score: null, oura_steps: 11204 });

      expect(
        serverDb.query("SELECT sleep_score, oura_steps FROM daily_metrics WHERE date = '2026-07-25'").get(),
      ).toMatchObject({ sleep_score: 85, oura_steps: 11204 });
    });

    test("rejects a malformed date", async () => {
      expect((await postDaily({ date: "igår", sleep_score: 85 })).status).toBe(400);
    });

    test("rejects a non-POST method", async () => {
      expect((await fetch(`${base}/internal/daily`)).status).toBe(405);
    });
  });

  describe("GET /internal/health", () => {
    test("serves the window as JSON", async () => {
      upsertDailyMetrics(serverDb, { date: TODAY, sleep_score: 86, oura_total_kcal: 1907 });
      const res = await fetch(`${base}/internal/health`);

      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const body = (await res.json()) as any;
      expect(body.status).toBe("ok");
      expect(body.days).toHaveLength(1);
      expect(body.latest).toMatchObject({ sleep_score: 86 });
    });

    test("rejects a non-GET method", async () => {
      expect((await fetch(`${base}/internal/health`, { method: "POST" })).status).toBe(405);
    });
  });
});
