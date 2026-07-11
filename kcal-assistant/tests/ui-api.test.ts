import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import net, { type AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { createHttpServer } from "../src/server";
import { saveProduct } from "../src/db/products";
import { logMeal } from "../src/db/meals";
import { logWeight } from "../src/db/weights";
import { saveRecipe } from "../src/db/recipes";
import { setProfile } from "../src/db/profile";
import { addDays, todayStockholm } from "../src/lib/dates";

const TOKEN = "test-token";
let httpServer: Server;
let db: Database;
let base: string;

const TABLES = ["products", "meals", "meal_items", "weights", "recipes", "recipe_ingredients", "preferences", "days"];
function rowCounts(): Record<string, number> {
  return Object.fromEntries(
    TABLES.map((t) => [t, (db.query<{ n: number }, []>(`SELECT count(*) AS n FROM ${t}`).get()!).n]),
  );
}

beforeAll(async () => {
  db = openDb(":memory:");
  const p = saveProduct(db, { name: "Uiprodukt", per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 } });
  logMeal(db, { name: "Uilunch", date: "2026-07-08", items: [{ product_id: p.id, grams: 200 }] });
  logWeight(db, { weight_kg: 100, date: "2026-07-08" });
  saveRecipe(db, { name: "Uirecept", servings: 2, ingredients: [{ product_id: p.id, grams: 400 }] });
  // dev-bypass auth state: pure API-shape tests (auth matrix lives in ui-auth.test.ts)
  httpServer = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "dev-bypass" } });
  await new Promise<void>((r) => httpServer.listen(0, r));
  base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => httpServer.close(r));
});

const get = (path: string) => fetch(`${base}${path}`);

// fetch() normalizes ".." and percent-encodes non-ASCII before sending, so
// raw-path attacks must go over a raw socket exactly as an attacker would.
function rawStatus(path: string, method = "GET"): Promise<number> {
  const { port } = httpServer.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(`${method} ${path} HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n`);
    });
    let buf = "";
    socket.on("data", (chunk) => (buf += chunk.toString()));
    socket.on("end", () => resolve(Number(buf.split(" ")[1])));
    socket.on("error", reject);
  });
}

describe("read-only UI API", () => {
  test("overview returns today, trend, week, targets and counts", async () => {
    const res = await get("/ui/api/overview");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.day.day_type).toBeDefined();
    expect(body.trend.latest.weight_kg).toBe(100);
    expect(body.week.days).toHaveLength(7);
    expect(body.counts.products).toBe(1);
    expect(body.counts.recipes).toBe(1);
  });

  test("days list and day detail", async () => {
    const list = await (await get("/ui/api/days?limit=10&offset=0")).json();
    expect(list.total).toBe(1);
    expect(list.days[0]!.date).toBe("2026-07-08");
    expect(list.days[0]!.totals.kcal).toBe(200);
    const day = await (await get("/ui/api/days/2026-07-08")).json();
    expect(day.meals).toHaveLength(1);
  });

  test("products, recipes, weights, preferences endpoints", async () => {
    const products = await (await get("/ui/api/products")).json();
    expect(products.products.map((p: any) => p.name)).toContain("Uiprodukt");
    const recipes = await (await get("/ui/api/recipes")).json();
    expect(recipes.recipes).toHaveLength(1);
    const recipe = await (await get(`/ui/api/recipes/${recipes.recipes[0].id}`)).json();
    expect(recipe.totals.kcal).toBe(400);
    const weights = await (await get("/ui/api/weights")).json();
    expect(weights.weights).toHaveLength(1);
    const prefs = await (await get("/ui/api/preferences")).json();
    expect(prefs.preferences.length).toBeGreaterThan(3);
    expect(prefs.targets).toHaveLength(3);
  });

  test("static routes serve with security headers", async () => {
    const res = await get("/ui");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toBe("default-src 'self'; img-src 'self' data:");
    expect((await get("/ui/static/app.js")).headers.get("content-type")).toContain("javascript");
    expect((await get("/ui/static/app.css")).headers.get("content-type")).toContain("text/css");
    expect((await get("/ui/static/theme.js")).headers.get("content-type")).toContain("javascript");
  });

  test("invalid date 400 with fixed message; unknown API path 404; unknown recipe 404", async () => {
    const bad = await get("/ui/api/days/2026-13-45");
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toBe("ogiltigt datum");
    expect((await get("/ui/api/nonsense")).status).toBe(404);
    expect((await get("/ui/api/recipes/9999")).status).toBe(404);
  });

  test("non-GET methods rejected with Allow: GET", async () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const res = await fetch(`${base}/ui/api/products`, { method });
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("GET");
    }
  });

  test("path tricks die safely (raw request-targets, no client normalization)", async () => {
    expect(await rawStatus(`/ui/../mcp/${TOKEN}`, "POST")).toBe(404);
    expect(await rawStatus("/UI")).toBe(404);
    expect(await rawStatus("//ui")).toBe(404);
    expect(await rawStatus("/ui%2fapi/products")).toBe(404);
    expect(await rawStatus("/ui/static/../auth.ts")).toBe(404);
    expect(await rawStatus("/ui/static/app.js.map")).toBe(404);
    expect(await rawStatus("/ui/api/days/ig%C3%A5r")).toBe(404); // encoded non-ASCII dies at the % reject
  });

  test("NO endpoint mutates ANY table, including days", async () => {
    const before = rowCounts();
    await get("/ui/api/overview");
    await get("/ui/api/days?limit=10&offset=0");
    await get("/ui/api/days/2099-01-01"); // unlogged future date must NOT create a row
    await get("/ui/api/products");
    await get("/ui/api/recipes");
    await get("/ui/api/weights");
    await get("/ui/api/preferences");
    expect(rowCounts()).toEqual(before);
  });

  test("unconfigured auth fails closed with 503", async () => {
    const closed = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "unconfigured" } });
    await new Promise<void>((r) => closed.listen(0, r));
    const port = (closed.address() as AddressInfo).port;
    expect((await fetch(`http://127.0.0.1:${port}/ui`)).status).toBe(503);
    expect((await fetch(`http://127.0.0.1:${port}/ui/api/overview`)).status).toBe(503);
    // MCP and healthz unaffected
    expect((await fetch(`http://127.0.0.1:${port}/healthz`)).status).toBe(200);
    await new Promise((r) => closed.close(r));
  });

  test("forecast without profile returns a reason", async () => {
    const body = await (await get("/ui/api/forecast")).json();
    expect(body.forecast).toBeNull();
    expect(body.reason).toContain("profil");
  });

  test("forecast with profile returns the full daily curve", async () => {
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    const res = await get("/ui/api/forecast?source=targets");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.forecast.curve.length).toBeGreaterThan(300);
    expect(body.forecast.assumptions.intake_source).toBe("targets");
    expect(body.forecast.goal.weight_kg).toBe(80);
  });

  test("forecast rejects an unknown source", async () => {
    expect((await get("/ui/api/forecast?source=x")).status).toBe(400);
  });

  test("forecast override params shape the preview", async () => {
    const base = (await (await get("/ui/api/forecast")).json()).forecast;
    const boosted = (await (await get("/ui/api/forecast?activity=2.5")).json()).forecast;
    expect(boosted.assumptions.tdee_start).toBeGreaterThan(base.assumptions.tdee_start);
    const explicit = (await (await get("/ui/api/forecast?intake=1234")).json()).forecast;
    expect(explicit.assumptions.intake_kcal).toBe(1234);
    expect(explicit.assumptions.intake_source).toBe("explicit");
    // relative date: the endpoint uses the real today, so an absolute date
    // would rot once the calendar passes it
    const gd = addDays(todayStockholm(), 100);
    const goal = (await (await get(`/ui/api/forecast?goal=90&goal_date=${gd}`)).json()).forecast;
    expect(goal.goal.weight_kg).toBe(90);
    expect(goal.weight_at_goal_date.date).toBe(gd);
  });

  test("forecast override params are validated", async () => {
    expect((await get("/ui/api/forecast?activity=9")).status).toBe(400);
    expect((await get("/ui/api/forecast?intake=abc")).status).toBe(400);
    expect((await get("/ui/api/forecast?goal=-5")).status).toBe(400);
    expect((await get("/ui/api/forecast?goal_date=2026-13-99")).status).toBe(400);
  });
});

describe("profile api", () => {
  let srv: Server;
  let pdb: Database;
  let pbase: string;

  beforeAll(async () => {
    pdb = openDb(":memory:");
    srv = createHttpServer({ token: "t2", db: pdb, uiAuth: { mode: "dev-bypass" } });
    await new Promise<void>((r) => srv.listen(0, r));
    pbase = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => srv.close(r));
  });

  test("GET returns null before any profile exists", async () => {
    const res = await fetch(`${pbase}/ui/api/profile`);
    expect(res.status).toBe(200);
    expect((await res.json()).profile).toBeNull();
  });

  const put = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${pbase}/ui/api/profile`, {
      method: "PUT",
      headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", ...headers },
      body: JSON.stringify(body),
    });

  test("PUT without a same-origin signal is rejected", async () => {
    const res = await fetch(`${pbase}/ui/api/profile`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ height_cm: 180 }),
    });
    expect(res.status).toBe(403);
    expect((await put({ height_cm: 180 }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
  });

  test("PUT with the wrong content type is rejected", async () => {
    const res = await fetch(`${pbase}/ui/api/profile`, {
      method: "PUT",
      headers: { "content-type": "text/plain", "sec-fetch-site": "same-origin" },
      body: JSON.stringify({ height_cm: 180 }),
    });
    expect(res.status).toBe(403);
  });

  test("first PUT requires the physiological fields (Swedish 400)", async () => {
    const res = await put({ goal_weight_kg: 80 });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("birth_date");
  });

  test("PUT creates, partially updates and clears goals", async () => {
    const created = await put({ birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    expect(created.status).toBe(200);
    expect((await created.json()).profile.goal_weight_kg).toBe(80);
    const updated = await put({ activity_factor: 1.6 });
    expect((await updated.json()).profile.activity_factor).toBe(1.6);
    expect((await put({})).status).toBe(200); // empty partial update is a no-op
    const cleared = await put({ goal_weight_kg: null });
    expect((await cleared.json()).profile.goal_weight_kg).toBeNull();
  });

  test("PUT rejects unknown fields and wrong types with 400", async () => {
    expect((await put({ hacker: true })).status).toBe(400);
    expect((await put({ height_cm: "tall" })).status).toBe(400);
    expect((await put({ sex: "yes" })).status).toBe(400);
    expect((await put({ activity_factor: 9 })).status).toBe(400); // range via setProfile
  });

  test("malformed JSON 400, oversized 413, other methods 405", async () => {
    const bad = await fetch(`${pbase}/ui/api/profile`, {
      method: "PUT",
      headers: { "content-type": "application/json", "sec-fetch-site": "same-origin" },
      body: "{nope",
    });
    expect(bad.status).toBe(400);
    const big = await put({ birth_date: "x".repeat(20000) });
    expect(big.status).toBe(413);
    expect((await fetch(`${pbase}/ui/api/profile`, { method: "POST" })).status).toBe(405);
    expect((await fetch(`${pbase}/ui/api/weights`, { method: "PUT" })).status).toBe(405);
  });
});
