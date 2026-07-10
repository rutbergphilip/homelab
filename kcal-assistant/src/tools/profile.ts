import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { setProfile } from "../db/profile";
import { buildForecast } from "../db/forecast";
import { dateSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

export function registerProfileTools(server: McpServer, db: Database): void {
  server.registerTool(
    "set_profile",
    {
      description:
        "Set or update the physiological profile and goals used by get_forecast (PARTIAL: omitted fields keep their values; explicit null clears goal_weight_kg or goal_date). First call must include birth_date, sex, height_cm and activity_factor. Activity factor guide: 1.2 stillasittande, 1.375 lätt aktiv, 1.55 måttligt aktiv, 1.725 mycket aktiv, 1.9 extremt aktiv.",
      inputSchema: {
        birth_date: dateSchema.optional(),
        sex: z.enum(["man", "kvinna"]).optional(),
        height_cm: z.number().positive().optional(),
        activity_factor: z.number().min(1.2).max(2.5).optional(),
        goal_weight_kg: z.number().positive().nullable().optional().describe("Målvikt i kg; null rensar"),
        goal_date: dateSchema.nullable().optional().describe("Datum då målet ska vara nått; null rensar"),
      },
    },
    wrap((input) => jsonResult(setProfile(db, input))),
  );

  server.registerTool(
    "get_forecast",
    {
      description:
        "Weight forecast from profile + weight log. Simulates day by day: Mifflin-St Jeor BMR on the moving weight × activity factor, calibrated against the measured backwards-TDEE when reliable. Returns predicted weight at target_date and at the profile's goal_date, the date the goal weight is reached (goal.eta), an uncertainty band (datadrivet ±band, se assumptions.band_kcal) with goal.eta_range, and weekly curve points. intake_source: 'targets' (default; day targets weighted by the recent day-type mix) or 'recent' (actual 28-day average); intake_kcal overrides both. Present the numbers as-is, never recompute.",
      inputSchema: {
        target_date: dateSchema.optional().describe("Datum att förutsäga vikten för"),
        goal_weight: z.number().positive().optional().describe("Överskuggar profilens målvikt"),
        intake_kcal: z.number().positive().optional(),
        intake_source: z.enum(["targets", "recent"]).optional(),
      },
    },
    wrap((input) => {
      const view = buildForecast(db, input);
      if (!view.forecast) return jsonResult(view);
      // Token-lean for the chat: weekly points, and no ghost curve.
      const { curve, ...rest } = view.forecast;
      const weekly = curve.filter((_, i) => i % 7 === 0 || i === curve.length - 1);
      return jsonResult({
        forecast: { ...rest, curve: weekly },
        ...(view.accuracy && { accuracy: view.accuracy }),
      });
    }),
  );
}
