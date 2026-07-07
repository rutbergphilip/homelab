import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { logMeal, editMeal, setDayType, previewDay } from "../db/meals";
import { setTargets } from "../db/preferences";
import { dateSchema, dayTypeSchema, mealItemSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

export function registerMealTools(server: McpServer, db: Database): void {
  server.registerTool(
    "log_meal",
    {
      description:
        "Log a meal. The server computes all macros (item, meal, day totals, remaining vs targets) with the 'räkna högt' rounding rules; ALWAYS present the returned numbers as-is. Items reference known products (product_id + grams, or product_id + portion_name + quantity) or are ad-hoc (description + macros). Set post_gym_shake:true for the post-gym shake so it sorts last.",
      inputSchema: {
        name: z.string().min(1).describe("Meal name, e.g. 'Frukost', 'Lunch'"),
        items: z.array(mealItemSchema).min(1),
        date: dateSchema.optional(),
        post_gym_shake: z.boolean().optional(),
      },
    },
    wrap((input) => jsonResult(logMeal(db, input))),
  );

  server.registerTool(
    "edit_meal",
    {
      description:
        "Correct or remove a logged meal. action 'update' can rename, toggle post_gym_shake, and replace ALL items when items is provided; action 'delete' removes the meal. Returns the recomputed day.",
      inputSchema: {
        meal_id: z.number().int(),
        action: z.enum(["update", "delete"]),
        name: z.string().optional(),
        post_gym_shake: z.boolean().optional(),
        items: z.array(mealItemSchema).optional(),
      },
    },
    wrap((input) => jsonResult(editMeal(db, input))),
  );

  server.registerTool(
    "preview_day",
    {
      description:
        "Dry-run a day plan with EXACT server math — use this for ALL day planning instead of computing macros yourself. Saves nothing. Returns logged meals (already eaten today) separately from planned meals, combined totals, remaining vs targets, and floor checks. If a planned meal duplicates a logged one, drop it from the plan or set include_logged false.",
      inputSchema: {
        date: dateSchema.optional(),
        meals: z
          .array(
            z.object({
              name: z.string().min(1),
              items: z.array(mealItemSchema).min(1),
              post_gym_shake: z.boolean().optional(),
            }),
          )
          .min(1),
        include_logged: z
          .boolean()
          .optional()
          .describe("Default true: today's logged meals count toward the totals"),
      },
    },
    wrap((input) => jsonResult(previewDay(db, input))),
  );

  server.registerTool(
    "set_day_type",
    {
      description:
        "Set or change a day's type (vilodag/gymdag/flexdag), also mid-day when Philip decides how he feels. Returns the day with the new targets and remaining.",
      inputSchema: { day_type: dayTypeSchema, date: dateSchema.optional() },
    },
    wrap(({ day_type, date }) => jsonResult(setDayType(db, day_type, date))),
  );

  server.registerTool(
    "set_targets",
    {
      description:
        "Adjust the standing targets for one day type: kcal budget, protein_min (proteingolv), fat_min (fettgolv), optional carbs. Only provided fields change.",
      inputSchema: {
        day_type: dayTypeSchema,
        kcal: z.number().int().positive().optional(),
        protein_min: z.number().positive().optional(),
        fat_min: z.number().positive().optional(),
        carbs: z.number().positive().optional(),
      },
    },
    wrap((input) => jsonResult({ all_targets: setTargets(db, input) })),
  );
}
