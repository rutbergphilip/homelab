import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import {
  upsertPlanDays,
  getPlanWeek,
  confirmDay,
  unconfirmDay,
  buildShoppingList,
  mondayOf,
} from "../db/plan";
import { todayStockholm } from "../lib/dates";
import { dateSchema, dayTypeSchema, mealItemSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

const slotSchema = z
  .enum(["frukost", "lunch", "middag", "mellis"])
  .describe("Meal slot in the week plan");

const plannedMealSchema = z
  .object({
    slot: slotSchema,
    name: z.string().min(1).describe("Meal name shown in the plan, e.g. 'Köttfärssås'"),
    recipe_id: z.number().int().optional().describe("Plan a saved recipe (requires recipe_servings)"),
    recipe_servings: z
      .number()
      .positive()
      .optional()
      .describe("Servings of the recipe to plan (batches if the recipe lacks servings)"),
    items: z.array(mealItemSchema).min(1).optional().describe("Item-based meal (recipe_id XOR items)"),
    post_gym_shake: z.boolean().optional(),
    note: z.string().optional(),
  })
  .describe("One planned meal: recipe_id + recipe_servings OR items");

const planDaySchema = z.object({
  date: dateSchema,
  day_type: dayTypeSchema.optional().describe("Also set the day's type while planning"),
  clear_slots: z.array(slotSchema).optional().describe("Slots to empty on this day"),
  meals: z.array(plannedMealSchema).optional(),
});

export function registerPlanTools(server: McpServer, db: Database): void {
  server.registerTool(
    "plan_week",
    {
      description:
        "THE meal-planning tool: batch-upsert the week plan (Mon-Sun calendar with frukost/lunch/middag/mellis slots) — plan a whole week in ONE call. Per day you can set day_type (vilodag/gymdag/flexdag), clear slots, and add meals (saved recipe via recipe_id+recipe_servings, or explicit items). Default replace=true: slots you provide are replaced wholesale; replace=false appends. Server computes all macros live (product/recipe edits propagate) and returns per-day totals, remaining vs targets and floor checks so you see immediately whether the plan hits targets. Planning does NOT log anything — Philip confirms days with confirm_day ('lås dagen').",
      inputSchema: {
        days: z.array(planDaySchema).min(1),
        replace: z.boolean().optional().describe("Default true: provided slots are replaced"),
      },
    },
    wrap(({ days, replace }) => jsonResult({ days: upsertPlanDays(db, days, replace ?? true) })),
  );

  server.registerTool(
    "get_plan",
    {
      description:
        "Read the week meal plan (Mon-Sun, snapped to Monday). Call before planning discussions. Compact by default; include_items adds per-meal item detail; shopping_list adds an aggregated handlingslista (unlogged planned meals only, recipes expanded). weeks 1-4 extends the range.",
      inputSchema: {
        start: dateSchema.optional().describe("Any date in the desired week; defaults to today"),
        weeks: z.number().int().min(1).max(4).optional(),
        include_items: z.boolean().optional(),
        shopping_list: z.boolean().optional(),
      },
    },
    wrap(({ start, weeks, include_items, shopping_list }) => {
      const week = getPlanWeek(db, { start, weeks, include_items });
      if (!shopping_list) return jsonResult(week);
      const days = (weeks ?? 1) * 7;
      return jsonResult({
        ...week,
        shopping_list: buildShoppingList(db, mondayOf(start ?? todayStockholm()), days),
      });
    }),
  );

  server.registerTool(
    "confirm_day",
    {
      description:
        "Philip's 'lås dagen': action 'confirm' logs the day's planned meals into the real log (day totals, veckosnitt and forecast all pick them up) and locks the day; optional slots confirms only those slots (e.g. logga bara frukosten). Idempotent — already-logged meals are skipped. action 'unconfirm' undoes it: removes ONLY plan-originated logged meals and unlocks. Returns the updated day and plan state.",
      inputSchema: {
        date: dateSchema,
        action: z.enum(["confirm", "unconfirm"]),
        slots: z.array(slotSchema).optional().describe("confirm only: limit to these slots"),
      },
    },
    wrap(({ date, action, slots }) =>
      jsonResult(action === "confirm" ? confirmDay(db, date, slots) : unconfirmDay(db, date)),
    ),
  );
}
