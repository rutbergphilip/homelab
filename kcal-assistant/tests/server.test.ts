import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHttpServer } from "../src/server";
import { openDb } from "../src/db/index";

const TOKEN = "test-token-123";
let httpServer: Server;
let db: Database;
let baseUrl: string;

beforeAll(async () => {
  db = openDb(":memory:");
  httpServer = createHttpServer({ token: TOKEN, db });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

async function connect(): Promise<Client> {
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp/${TOKEN}`)));
  return client;
}

function parseResult(result: Awaited<ReturnType<Client["callTool"]>>): any {
  const content = result.content as Array<{ type: string; text: string }>;
  return JSON.parse(content[0]!.text);
}

describe("http routing", () => {
  test("healthz returns 200", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("wrong token returns 404", async () => {
    const res = await fetch(`${baseUrl}/mcp/wrong-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(404);
  });

  test("oauth discovery probes return 404", async () => {
    const res = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    expect(res.status).toBe(404);
  });

  test("GET on mcp endpoint returns 405", async () => {
    const res = await fetch(`${baseUrl}/mcp/${TOKEN}`);
    expect(res.status).toBe(405);
  });
});

describe("mcp over streamable http", () => {
  test("lists all 12 tools", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "get_context",
        "search_products",
        "get_product",
        "save_product",
        "lookup_nutrition",
        "log_meal",
        "edit_meal",
        "get_day",
        "set_day_type",
        "set_targets",
        "save_preference",
        "delete_preference",
      ].sort(),
    );
    await client.close();
  });

  test("get_context returns preferences and today's day", async () => {
    const client = await connect();
    const ctx = parseResult(await client.callTool({ name: "get_context", arguments: {} }));
    expect(ctx.preferences.stil.length).toBeGreaterThan(0);
    expect(ctx.day.day_type).toBe("vilodag");
    expect(ctx.day.targets.kcal).toBeGreaterThan(0);
    await client.close();
  });

  test("full logging flow: save_product -> search -> log_meal -> totals", async () => {
    const client = await connect();
    const saved = parseResult(
      await client.callTool({
        name: "save_product",
        arguments: {
          name: "Testkyckling",
          per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
          aliases: ["testkycklingen"],
        },
      }),
    );
    expect(saved.id).toBeGreaterThan(0);

    const hits = parseResult(
      await client.callTool({ name: "search_products", arguments: { query: "testkyckling" } }),
    );
    expect(hits.candidates.map((c: any) => c.id)).toContain(saved.id);

    const logged = parseResult(
      await client.callTool({
        name: "log_meal",
        arguments: {
          name: "Testlunch",
          date: "2026-07-06",
          items: [{ product_id: saved.id, grams: 200 }],
        },
      }),
    );
    expect(logged.day.totals.kcal).toBe(212);
    expect(logged.day.remaining.kcal).toBe(logged.day.targets.kcal - 212);
    await client.close();
  });

  test("tool errors come back as isError with a message", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "log_meal",
      arguments: { name: "Trasig", items: [{ product_id: 99999, grams: 100 }] },
    });
    expect(result.isError).toBe(true);
    await client.close();
  });
});
