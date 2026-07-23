import { z } from "zod";
import { PRODUCT_CATEGORIES } from "../lib/categories";

export const macrosSchema = z.object({
  kcal: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date as YYYY-MM-DD (Europe/Stockholm). Omit for today.");

export const dayTypeSchema = z
  .enum(["vilodag", "gymdag", "flexdag"])
  .describe("Day type controlling the targets");

export const mealItemSchema = z
  .object({
    product_id: z.number().optional().describe("Known product id from search_products"),
    description: z.string().optional().describe("Item text; required for ad-hoc items"),
    grams: z.number().positive().optional().describe("Weight in grams (per-100g products)"),
    portion_name: z.string().optional().describe("Named portion, e.g. 'flaska'"),
    quantity: z.number().positive().optional().describe("Portion count, default 1"),
    macros: macrosSchema.optional().describe("Explicit macros for ad-hoc items"),
  })
  .describe("One meal item: product_id+grams, product_id+portion_name, or description+macros");

export const categorySchema = z
  .string()
  .describe(
    `Product category from a closed vocabulary — governs suggestion behavior, not free text: ${PRODUCT_CATEGORIES.join(", ")}. On update, empty string clears it (bypasses vocabulary check); any other non-vocabulary value is rejected.`,
  );

export const portionSchema = z.object({
  name: z.string().describe("Portion name, e.g. 'flaska', 'påse', 'portion'"),
  grams: z.number().positive().optional().describe("Portion weight; macros derived from per-100g"),
  kcal: z.number().optional(),
  protein: z.number().optional(),
  fat: z.number().optional(),
  carbs: z.number().optional(),
});
