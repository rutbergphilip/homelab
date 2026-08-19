import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import { createHttpServer } from "../src/server";
import { addJoke } from "../src/domains/jokes/db";

const TOKEN = "a".repeat(64);
const AUTH = { "x-authentik-username": "rutbergphilip" };
let server: Server;
let base: string;
let db: Database;
let jokeId: number;

beforeAll(async () => {
  db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  jokeId = addJoke(db, {
    text: "Jag ser ut som en Ipren bredvid dig",
    activation: "active",
    risk: 1,
    delivery: "Håll upp armen, säg det utan att le.",
    triggers: ["någon är solbränd"],
    context_ratings: { puben: "safe" },
  }).id;
  server = createHttpServer({ token: TOKEN, db });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (addr === null || typeof addr === "string") throw new Error("no port");
  base = `http://127.0.0.1:${addr.port}`;
});

afterAll(() => {
  server.close();
});

describe("ui auth gate", () => {
  test("403 without X-authentik-username on all ui/api routes", async () => {
    for (const [method, path] of [
      ["GET", "/ui/jokes"],
      ["GET", "/api/jokes"],
      ["POST", `/api/jokes/${jokeId}/tellings`],
    ] as const) {
      const res = await fetch(`${base}${path}`, { method, body: method === "POST" ? "{}" : undefined });
      expect(res.status).toBe(403);
    }
  });
});

describe("api", () => {
  test("GET /api/jokes returns full payload", async () => {
    const res = await fetch(`${base}/api/jokes`, { headers: AUTH });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      jokes: Array<{ id: number; text: string; triggers: string[]; tellings: unknown[] }>;
      contexts: Array<{ id: number; name: string }>;
      audience_tags: string[];
    };
    expect(json.jokes).toHaveLength(1);
    expect(json.jokes[0]!.triggers).toEqual(["någon är solbränd"]);
    expect(json.jokes[0]!.tellings).toEqual([]);
    expect(json.contexts.map((c) => c.name)).toContain("puben");
    expect(json.audience_tags).toEqual([]);
  });

  test("POST telling persists and shows up in GET", async () => {
    const res = await fetch(`${base}/api/jokes/${jokeId}/tellings`, {
      method: "POST",
      headers: { ...AUTH, "content-type": "application/json" },
      body: JSON.stringify({ context: "puben", audience: ["Erik"], rating: 4, note: "landade" }),
    });
    expect(res.status).toBe(201);
    const telling = (await res.json()) as { audience: string[]; context: string; told_on: string };
    expect(telling.audience).toEqual(["erik"]);
    expect(telling.context).toBe("puben");

    const after = (await (await fetch(`${base}/api/jokes`, { headers: AUTH })).json()) as {
      jokes: Array<{ tellings: unknown[] }>;
      audience_tags: string[];
    };
    expect(after.jokes[0]!.tellings).toHaveLength(1);
    expect(after.audience_tags).toEqual(["erik"]);
  });

  test("POST validation: bad rating 400, unknown joke 404, bad json 400", async () => {
    const bad = await fetch(`${base}/api/jokes/${jokeId}/tellings`, {
      method: "POST",
      headers: { ...AUTH, "content-type": "application/json" },
      body: JSON.stringify({ rating: 11 }),
    });
    expect(bad.status).toBe(400);
    const missing = await fetch(`${base}/api/jokes/99999/tellings`, {
      method: "POST",
      headers: { ...AUTH, "content-type": "application/json" },
      body: "{}",
    });
    expect(missing.status).toBe(404);
    const garbage = await fetch(`${base}/api/jokes/${jokeId}/tellings`, {
      method: "POST",
      headers: { ...AUTH, "content-type": "application/json" },
      body: "not json",
    });
    expect(garbage.status).toBe(400);
  });

  test("unknown api path 404s", async () => {
    const res = await fetch(`${base}/api/nonsense`, { headers: AUTH });
    expect(res.status).toBe(404);
  });
});

describe("ui page", () => {
  test("GET /ui/jokes serves the app html", async () => {
    const res = await fetch(`${base}/ui/jokes`, { headers: AUTH });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html.toLowerCase()).toContain("<!doctype html>");
    expect(html).toContain("Skämtbanken");
  });
});
