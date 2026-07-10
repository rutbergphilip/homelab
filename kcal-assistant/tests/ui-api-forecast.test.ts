import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { createHttpServer } from "../src/server";
import { logWeight } from "../src/db/weights";
import { setProfile } from "../src/db/profile";

const TOKEN = "test-token";
let httpServer: Server;
let db: Database;
let base: string;

// Own db + server, isolated from ui-api.test.ts on purpose: that suite has
// profile-lifecycle tests that must not inherit a pre-seeded profile.
beforeAll(async () => {
  db = openDb(":memory:");
  setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
  logWeight(db, { weight_kg: 100, date: "2026-07-08" });
  httpServer = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "dev-bypass" } });
  await new Promise<void>((r) => httpServer.listen(0, r));
  base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => httpServer.close(r));
});

describe("forecast + weights UI API (accuracy/ghost/trend_kg)", () => {
  test("weights payload includes trend_kg on rows and latest", async () => {
    const res = await fetch(`${base}/ui/api/weights`, { headers: { accept: "application/json" } });
    const body = await res.json();
    expect(body.weights[0].trend_kg).toBeTypeOf("number");
    expect(body.trend.latest.trend_kg).toBeTypeOf("number");
  });

  test("forecast payload omits accuracy/ghost when no aged snapshots exist", async () => {
    const res = await fetch(`${base}/ui/api/forecast`, { headers: { accept: "application/json" } });
    const body = await res.json();
    expect(body.forecast).not.toBeNull();
    expect(body.forecast.assumptions.band_kcal).toBeTypeOf("number");
    expect(body.forecast.goal.eta_range).toBeDefined();
    expect("accuracy" in body).toBe(false); // only today's own snapshot exists (age 0)
    expect("ghost" in body).toBe(false);
  });
});
