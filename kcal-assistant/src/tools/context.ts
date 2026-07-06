import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { getDay } from "../db/meals";
import { listPreferences, getTargets, type Preference } from "../db/preferences";
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
    wrap(({ date }) =>
      jsonResult({
        preferences: groupPreferences(listPreferences(db)),
        all_targets: getTargets(db),
        day: getDay(db, date),
      }),
    ),
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
}
