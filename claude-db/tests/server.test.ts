import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import { createHttpServer } from "../src/server";

const TOKEN = "a".repeat(64);
let server: Server;
let base: string;

beforeAll(async () => {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  server = createHttpServer({ token: TOKEN, db });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (addr === null || typeof addr === "string") throw new Error("no port");
  base = `http://127.0.0.1:${addr.port}`;
});

afterAll(() => {
  server.close();
});

function mcpCall(path: string, body: unknown): Promise<Response> {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
  });
}

const LIST_TOOLS = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };

async function toolNames(path: string): Promise<string[]> {
  const res = await mcpCall(path, LIST_TOOLS);
  expect(res.status).toBe(200);
  const json = (await res.json()) as { result: { tools: Array<{ name: string }> } };
  return json.result.tools.map((t) => t.name).sort();
}

describe("http server", () => {
  test("healthz lists domains", async () => {
    const res = await fetch(`${base}/healthz`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; domains: string[] };
    expect(json.ok).toBe(true);
    expect(json.domains).toEqual(["fragrance", "collections"]);
  });

  test("wrong token → 404, correct token → tools", async () => {
    const bad = await mcpCall(`/mcp/${"b".repeat(64)}`, LIST_TOOLS);
    expect(bad.status).toBe(404);

    const names = await toolNames(`/mcp/${TOKEN}`);
    expect(names).toContain("fragrance_context");
    expect(names).toContain("collection_query");
  });

  test("per-domain mount exposes only that domain", async () => {
    const names = await toolNames(`/mcp/${TOKEN}/fragrance`);
    expect(names).toHaveLength(9);
    expect(names.every((n) => n.startsWith("fragrance_"))).toBe(true);

    const collNames = await toolNames(`/mcp/${TOKEN}/collections`);
    expect(collNames).toHaveLength(7);
    expect(collNames.every((n) => n.startsWith("collection_"))).toBe(true);
  });

  test("unknown domain → 404 even with valid token", async () => {
    const res = await mcpCall(`/mcp/${TOKEN}/nope`, LIST_TOOLS);
    expect(res.status).toBe(404);
  });

  test("raw-path hardening", async () => {
    for (const path of [`/mcp/${TOKEN}/../x`, "/mcp/%2e%2e", `/mcp//${TOKEN}`]) {
      const res = await fetch(`${base}${path}`, { method: "POST" });
      expect(res.status).toBe(404);
    }
  });

  test("tool round-trip: add fragrance then see it in context", async () => {
    const call = (name: string, args: unknown, id: number) =>
      mcpCall(`/mcp/${TOKEN}/fragrance`, {
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: { name, arguments: args },
      });
    const added = await call("fragrance_add", { house: "Prada", name: "Paradigme" }, 2);
    expect(added.status).toBe(200);
    const ctxRes = await call("fragrance_context", {}, 3);
    const ctxJson = (await ctxRes.json()) as { result: { content: Array<{ text: string }> } };
    const ctx = JSON.parse(ctxJson.result.content[0]!.text) as { collection: Array<{ name: string }> };
    expect(ctx.collection.some((f) => f.name === "Paradigme")).toBe(true);
  });
});
