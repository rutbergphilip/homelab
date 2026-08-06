import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTrainingProgress, getTrainingSummary } from "../services/training";
import { jsonResult, wrap } from "./util";

export function registerTrainingTools(server: McpServer): void {
  server.registerTool(
    "get_training",
    {
      description:
        "Philip's gym training (Lyfta, synced hourly via claude-db): no args → overview with this week's " +
        "volume/frequency, 12-week weekly series, recent workouts and most-trained exercises with best/latest " +
        "estimated 1RM. Pass exercise_id (from the overview) for per-session progression on one lift. Use it as " +
        "coaching context — training volume affects hunger, targets and day types. Read-only here: syncing and " +
        "program management live in the separate Claude-DB/Lyfta connector.",
      inputSchema: {
        exercise_id: z.number().int().optional(),
        days: z.number().int().min(7).max(3650).optional().describe("Progression window, default 365"),
      },
    },
    wrap(async ({ exercise_id, days }) =>
      jsonResult(
        exercise_id !== undefined
          ? await getTrainingProgress(exercise_id, days ?? 365)
          : await getTrainingSummary(),
      ),
    ),
  );
}
