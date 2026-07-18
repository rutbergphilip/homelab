import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { createHttpServer, createInternalServer } from "../src/server";
import { saveProduct } from "../src/db/products";
import { upsertPlanDays, mondayOf } from "../src/db/plan";
import { todayStockholm } from "../src/lib/dates";

let internalServer: Server;
let mainServer: Server;
let db: Database;
let base: string;
let mainBase: string;
let productId: number;

beforeAll(async () => {
  db = openDb(":memory:");
  productId = saveProduct(db, { name: "Planmat", per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 } }).id;
  internalServer = createInternalServer({ db });
  mainServer = createHttpServer({ token: "t", db, uiAuth: { mode: "unconfigured" } });
  await new Promise<void>((r) => internalServer.listen(0, r));
  await new Promise<void>((r) => mainServer.listen(0, r));
  base = `http://127.0.0.1:${(internalServer.address() as AddressInfo).port}`;
  mainBase = `http://127.0.0.1:${(mainServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => internalServer.close(r));
  await new Promise((r) => mainServer.close(r));
});

describe("GET /internal/planner", () => {
  test("returns the current week with meals, checks and confirm state", async () => {
    const today = todayStockholm();
    upsertPlanDays(db, [
      { date: today, meals: [{ slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 500 }] }] },
    ]);
    const res = await fetch(`${base}/internal/planner`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.week_start).toBe(mondayOf(today));
    expect(body.today).toBe(today);
    expect(body.days).toHaveLength(7);
    const day = body.days.find((d: any) => d.date === today);
    expect(day.meals).toEqual([
      { slot: "middag", name: "Lax", kcal: 500, protein: 50, fat: 25, carbs: 40, logged: false },
    ]);
    expect(day.total_kcal).toBe(500);
    expect(day.target_kcal).toBeGreaterThan(0);
    expect(typeof day.kcal_ok).toBe("boolean");
  });
});

describe("POST /internal/planner/confirm", () => {
  test("confirms a planned day; conflicts are 409; bad input 400", async () => {
    const today = todayStockholm();
    const ok = await fetch(`${base}/internal/planner/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: today }),
    });
    expect(ok.status).toBe(200);
    expect((await ok.json()).ok).toBe(true);

    const again = await fetch(`${base}/internal/planner/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: today }),
    });
    expect(again.status).toBe(409);

    const bad = await fetch(`${base}/internal/planner/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: "not-a-date" }),
    });
    expect(bad.status).toBe(400);

    const wrongMethod = await fetch(`${base}/internal/planner/confirm`);
    expect(wrongMethod.status).toBe(405);
  });
});

// SECURITY PARITY: like /internal/summary, the planner routes must never be
// reachable through the ingress-facing server.
describe("planner routes are NOT on the main server", () => {
  test("GET and POST both 404", async () => {
    expect((await fetch(`${mainBase}/internal/planner`)).status).toBe(404);
    const post = await fetch(`${mainBase}/internal/planner/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(post.status).toBe(404);
  });
});
