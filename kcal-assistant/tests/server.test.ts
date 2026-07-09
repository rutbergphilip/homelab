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
  httpServer = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "unconfigured" } });
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
  test("lists all 24 tools", async () => {
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
        "get_week",
        "set_day_type",
        "set_targets",
        "save_preference",
        "delete_preference",
        "search_store",
        "log_weight",
        "get_trend",
        "compute_batch",
        "preview_day",
        "save_recipe",
        "get_recipe",
        "find_recipes",
        "delete_recipe",
        "set_profile",
        "get_forecast",
      ].sort(),
    );
    await client.close();
  });

  test("save_recipe -> get_recipe round-trips through the MCP client", async () => {
    const client = await connect();
    const saved = parseResult(
      await client.callTool({
        name: "save_recipe",
        arguments: {
          name: "Testrecept",
          servings: 2,
          ingredients: [
            { description: "Testbas", macros: { kcal: 400, protein: 40, fat: 10, carbs: 20 } },
          ],
        },
      }),
    );
    expect(saved.id).toBeGreaterThan(0);
    const fetched = parseResult(await client.callTool({ name: "get_recipe", arguments: { id: saved.id } }));
    expect(fetched.per_serving.kcal).toBe(200);
    await client.close();
  });

  test("preview_day round-trips through the MCP client", async () => {
    const client = await connect();
    const preview = parseResult(
      await client.callTool({
        name: "preview_day",
        arguments: {
          date: "2026-07-08",
          meals: [
            {
              name: "Planerad lunch",
              items: [{ description: "Testrätt", macros: { kcal: 700, protein: 190, fat: 65, carbs: 30 } }],
            },
          ],
        },
      }),
    );
    expect(preview.planned_meals).toHaveLength(1);
    expect(preview.totals.kcal).toBe(700);
    expect(preview.checks.protein_floor_ok).toBe(true);
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

  test("set_profile -> get_forecast round-trips", async () => {
    const client = await connect();
    await client.callTool({
      name: "set_profile",
      arguments: { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 },
    });
    await client.callTool({ name: "log_weight", arguments: { weight_kg: 82 } });
    const res = await client.callTool({ name: "get_forecast", arguments: {} });
    const body = JSON.parse((res.content as Array<{ text: string }>)[0]!.text);
    expect(body.forecast.goal.weight_kg).toBe(80);
    expect(body.forecast.curve.length).toBeGreaterThan(40); // weekly points over 365 days
    expect(body.forecast.curve.length).toBeLessThan(60);
    await client.close();
  });
});
