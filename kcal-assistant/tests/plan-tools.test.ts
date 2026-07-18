import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHttpServer } from "../src/server";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";

const TOKEN = "test-token-plan";
let httpServer: Server;
let db: Database;
let baseUrl: string;
let productId: number;

beforeAll(async () => {
  db = openDb(":memory:");
  productId = saveProduct(db, {
    name: "Testmat",
    per_100g: { kcal: 100, protein: 10, fat: 5, carbs: 8 },
  }).id;
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

describe("plan tools over MCP", () => {
  test("plan_week -> get_plan -> confirm_day round-trip", async () => {
    const client = await connect();

    const planned = parseResult(
      await client.callTool({
        name: "plan_week",
        arguments: {
          days: [
            {
              date: "2026-07-20",
              day_type: "gymdag",
              meals: [
                { slot: "frukost", name: "Gröt", items: [{ product_id: productId, grams: 300 }] },
                { slot: "middag", name: "Lax", items: [{ product_id: productId, grams: 500 }] },
              ],
            },
            {
              date: "2026-07-21",
              meals: [{ slot: "lunch", name: "Rester", items: [{ product_id: productId, grams: 400 }] }],
            },
          ],
        },
      }),
    );
    expect(planned.days).toHaveLength(2);
    expect(planned.days[0].day_type).toBe("gymdag");
    expect(planned.days[0].totals.kcal).toBe(800);
    expect(planned.days[0].meals[0].items).toBeUndefined(); // compact

    const plan = parseResult(
      await client.callTool({
        name: "get_plan",
        arguments: { start: "2026-07-22", shopping_list: true },
      }),
    );
    expect(plan.start_date).toBe("2026-07-20");
    expect(plan.week.planned_days).toBe(2);
    expect(plan.shopping_list).toHaveLength(1);
    expect(plan.shopping_list[0].grams).toBe(1200);

    const confirmed = parseResult(
      await client.callTool({
        name: "confirm_day",
        arguments: { date: "2026-07-20", action: "confirm" },
      }),
    );
    expect(confirmed.day.totals.kcal).toBe(800);
    expect(confirmed.plan.confirmed).toBe(true);

    const undone = parseResult(
      await client.callTool({
        name: "confirm_day",
        arguments: { date: "2026-07-20", action: "unconfirm" },
      }),
    );
    expect(undone.day.meals).toHaveLength(0);
    expect(undone.plan.confirmed).toBe(false);

    await client.close();
  });

  test("domain errors surface as isError payloads", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "confirm_day",
      arguments: { date: "2026-07-25", action: "confirm" },
    });
    expect(result.isError).toBe(true);
    expect(parseResult(result).error).toMatch(/inget planerat/);
    await client.close();
  });
});
