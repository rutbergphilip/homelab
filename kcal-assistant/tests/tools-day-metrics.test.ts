import { describe, expect, test, beforeEach, afterAll, beforeAll } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Database } from "bun:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHttpServer } from "../src/server";
import { openDb } from "../src/db/index";
import { upsertDailyMetrics } from "../src/db/daily";
import { todayStockholm, addDays } from "../src/lib/dates";

// Recovery context is attached to the calls the assistant already makes, rather
// than a new tool — that is what makes "dålig sömn på onsdagen, och du åt 600
// över" possible without teaching it another step.

const TOKEN = "test-token-123";
let server: Server;
let db: Database;
let baseUrl: string;

beforeAll(async () => {
  db = openDb(":memory:");
  server = createHttpServer({ token: TOKEN, db, uiAuth: { mode: "unconfigured" } });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function call(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp/${TOKEN}`)));
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as Array<{ type: string; text: string }>;
  await client.close();
  return JSON.parse(content[0]!.text);
}

const TODAY = todayStockholm();

beforeEach(() => {
  db.run("DELETE FROM daily_metrics");
});

describe("get_day", () => {
  test("carries that date's recovery metrics", async () => {
    upsertDailyMetrics(db, {
      date: TODAY,
      sleep_score: 86,
      readiness_score: 84,
      sleep_duration_min: 506,
      oura_total_kcal: 3040,
    });

    const day = await call("get_day");
    expect(day.metrics).toMatchObject({
      sleep_score: 86,
      readiness_score: 84,
      sleep_duration_min: 506,
    });
  });

  test("metrics is null on a day Oura has no data for", async () => {
    expect((await call("get_day", { date: "2026-01-05" })).metrics).toBeNull();
  });
});

describe("get_context", () => {
  test("includes today's recovery metrics, so the opening call already has them", async () => {
    upsertDailyMetrics(db, { date: TODAY, sleep_score: 71, readiness_score: 62 });

    const ctx = await call("get_context");
    expect(ctx.metrics).toMatchObject({ sleep_score: 71, readiness_score: 62 });
  });
});

describe("get_week", () => {
  test("attaches metrics per day, which is what makes correlation possible", async () => {
    upsertDailyMetrics(db, { date: TODAY, sleep_score: 86 });
    upsertDailyMetrics(db, { date: addDays(TODAY, -2), sleep_score: 61 });

    const week = await call("get_week");
    const byDate = new Map<string, any>(week.days.map((d: any) => [d.date, d]));

    expect(byDate.get(TODAY)!.metrics).toMatchObject({ sleep_score: 86 });
    expect(byDate.get(addDays(TODAY, -2))!.metrics).toMatchObject({ sleep_score: 61 });
    expect(byDate.get(addDays(TODAY, -1))!.metrics).toBeNull();
  });
});

describe("get_trend", () => {
  test("exposes the Oura burn cross-check field even when empty", async () => {
    expect(await call("get_trend")).toHaveProperty("oura_burn");
  });
});
