import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { logWeight, getTrend } from "../db/weights";
import { buildForecast } from "../db/forecast";
import { dateSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

export function registerWeightTools(server: McpServer, db: Database): void {
  server.registerTool(
    "log_weight",
    {
      description:
        "Log a morning weight ('82.1 idag'). Upserts by date, so a correction is just re-logging the same date. Returns the computed trend: rate kg/week and backwards-computed TDEE (snittintag + viktförändring × 7700 / dagar, averaged over the same period as the weight delta). Present the trend numbers as-is, never recompute.",
      inputSchema: {
        weight_kg: z.number().positive().lt(500),
        date: dateSchema.optional(),
        note: z.string().optional().describe("E.g. 'efter flexhelg', 'kreatinladdning'"),
      },
    },
    wrap((input) => {
      const view = logWeight(db, input);
      try {
        buildForecast(db); // canonical → snapshot; best-effort by construction
      } catch (e) {
        console.error("snapshot after log_weight:", e instanceof Error ? e.message : e);
      }
      return jsonResult(view);
    }),
  );

  server.registerTool(
    "get_trend",
    {
      description:
        "Weight trend and real TDEE over a window ENDING AT THE LATEST WEIGHING (not today; stale:true means the latest weighing is over a week old). trend is null with a reason when data is too sparse; uncertain:true means under half the span days have logged intake. Use for 'hur går det?' and for calibrating targets.",
      inputSchema: {
        window_days: z.number().int().min(14).max(365).optional().describe("Default 28"),
      },
    },
    wrap(({ window_days }) => jsonResult(getTrend(db, window_days ?? 28))),
  );
}
