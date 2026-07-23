import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { getDay, getWeek } from "../db/meals";
import { getTrend } from "../db/weights";
import { listPreferences, getTargets, type Preference } from "../db/preferences";
import { getProfile } from "../db/profile";
import { PRODUCT_CATEGORIES } from "../lib/categories";
import { dateSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

function groupPreferences(prefs: Preference[]): Record<string, Array<{ id: number; content: string }>> {
  const grouped: Record<string, Array<{ id: number; content: string }>> = {};
  for (const p of prefs) {
    (grouped[p.category] ??= []).push({ id: p.id, content: p.content });
  }
  return grouped;
}

export function registerContextTools(server: McpServer, db: Database): void {
  server.registerTool(
    "get_context",
    {
      description:
        "Call this at the START of every conversation. Returns Philip's standing rules and style preferences (follow them exactly; user-facing text is Swedish), all day-type targets, and today's log with totals and remaining vs targets. Always use the server's numbers, never compute macros yourself.",
      inputSchema: { date: dateSchema.optional() },
    },
    wrap(({ date }) => {
      const trend = getTrend(db);
      const profile = getProfile(db);
      return jsonResult({
        preferences: groupPreferences(listPreferences(db)),
        product_categories: `Produktkategorier: ${PRODUCT_CATEGORIES.join(", ")}`,
        all_targets: getTargets(db),
        ...(profile && { profile }),
        day: getDay(db, date),
        ...(trend.latest && {
          weight: {
            latest: trend.latest,
            rate_kg_week: trend.trend?.rate_kg_week ?? null,
            est_tdee: trend.trend?.est_tdee ?? null,
            uncertain: trend.trend?.uncertain ?? null,
            stale: trend.stale,
          },
        }),
      });
    }),
  );

  server.registerTool(
    "get_day",
    {
      description:
        "Get the meal log for a day (default today): day type, targets, meals in display order (post-gym shake last), per-meal macros, totals and remaining.",
      inputSchema: { date: dateSchema.optional() },
    },
    wrap(({ date }) => jsonResult(getDay(db, date))),
  );

  server.registerTool(
    "get_week",
    {
      description:
        "Week summary (veckosnitt) for the 7 days ending at end_date (default today): per-day totals and day types, averages over logged days, and the average kcal target. Use to evaluate kalori-cykling — the weekly average is what counts.",
      inputSchema: { end_date: dateSchema.optional() },
    },
    wrap(({ end_date }) => jsonResult(getWeek(db, end_date))),
  );
}
