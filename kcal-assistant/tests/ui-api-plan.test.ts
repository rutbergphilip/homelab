import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { createHttpServer } from "../src/server";
import { saveProduct } from "../src/db/products";

let httpServer: Server;
let db: Database;
let base: string;
let productId: number;

beforeAll(async () => {
  db = openDb(":memory:");
  productId = saveProduct(db, { name: "Planmat", per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 } }).id;
  httpServer = createHttpServer({ token: "t", db, uiAuth: { mode: "dev-bypass" } });
  await new Promise<void>((r) => httpServer.listen(0, r));
  base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => httpServer.close(r));
});

const get = (path: string) => fetch(`${base}${path}`);
const put = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", ...headers },
    body: JSON.stringify(body),
  });

describe("PUT /ui/api/plan/<date>", () => {
  test("upserts a day and returns the plan day view", async () => {
    const res = await put("/ui/api/plan/2026-07-20", {
      day_type: "gymdag",
      meals: [
        { slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 500 }] },
        { slot: "mellis", name: "Snabb", items: [{ description: "Snabb", macros: { kcal: 200, protein: 20, fat: 5, carbs: 15 } }] },
      ],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.day.day_type).toBe("gymdag");
    expect(body.day.totals.kcal).toBe(700);
    expect(body.day.meals).toHaveLength(2);
  });

  test("CSRF gates: cross-site and wrong content-type are 403", async () => {
    const cross = await put("/ui/api/plan/2026-07-20", {}, { "sec-fetch-site": "cross-site" });
    expect(cross.status).toBe(403);
    const wrongType = await fetch(`${base}/ui/api/plan/2026-07-20`, {
      method: "PUT",
      headers: { "content-type": "text/plain", "sec-fetch-site": "same-origin" },
      body: "{}",
    });
    expect(wrongType.status).toBe(403);
  });

  test("unknown fields and invalid shapes are 400", async () => {
    expect((await put("/ui/api/plan/2026-07-20", { surprise: 1 })).status).toBe(400);
    expect((await put("/ui/api/plan/2026-07-20", { meals: [{ slot: "brunch", name: "Nej", items: [] }] })).status).toBe(400);
    expect((await put("/ui/api/plan/2026-13-40", { day_type: "vilodag" })).status).toBe(400);
  });
});

describe("PUT /ui/api/confirm/<date>", () => {
  test("confirm and unconfirm round-trip; domain errors are 409", async () => {
    await put("/ui/api/plan/2026-07-21", {
      meals: [{ slot: "middag", name: "Kyckling", items: [{ product_id: productId, grams: 400 }] }],
    });
    const confirmed = await put("/ui/api/confirm/2026-07-21", { action: "confirm" });
    expect(confirmed.status).toBe(200);
    const cBody = await confirmed.json();
    expect(cBody.plan.confirmed).toBe(true);
    expect(cBody.day.totals.kcal).toBe(400);

    expect((await put("/ui/api/confirm/2026-07-21", { action: "confirm" })).status).toBe(409);

    const undone = await put("/ui/api/confirm/2026-07-21", { action: "unconfirm" });
    expect(undone.status).toBe(200);
    expect((await undone.json()).plan.confirmed).toBe(false);

    expect((await put("/ui/api/confirm/2026-07-22", { action: "confirm" })).status).toBe(409); // inget planerat
    expect((await put("/ui/api/confirm/2026-07-21", { action: "festa" })).status).toBe(400);
  });
});

describe("GET /ui/api/plan", () => {
  test("returns a monday-aligned week with items and shopping list", async () => {
    const res = await get("/ui/api/plan?start=2026-07-22");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.start_date).toBe("2026-07-20");
    expect(body.days).toHaveLength(7);
    expect(body.days[0].meals[0].items).toBeDefined();
    expect(Array.isArray(body.shopping_list)).toBe(true);
  });

  test("invalid params are 400", async () => {
    expect((await get("/ui/api/plan?start=2026-13-40")).status).toBe(400);
    expect((await get("/ui/api/plan?weeks=9")).status).toBe(400);
  });
});
