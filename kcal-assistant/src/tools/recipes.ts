import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { saveRecipe, getRecipe, findRecipes, deleteRecipe } from "../db/recipes";
import { mealItemSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

export function registerRecipeTools(server: McpServer, db: Database): void {
  server.registerTool(
    "save_recipe",
    {
      description:
        "Create a recipe, or update by id (PARTIAL: omitted fields keep their values; empty string clears text; explicit null clears servings or unlinks product_id; ingredients replace wholesale). Ingredients use the same format as log_meal and resolve LIVE at every read, so product corrections propagate into the recipe automatically. After computing a batch with compute_batch (save:true), link it here via product_id.",
      inputSchema: {
        id: z.number().int().optional(),
        name: z.string().min(1),
        instructions: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional().describe("Free text, e.g. 'mealprep,airfryer'"),
        servings: z.number().positive().nullable().optional().describe("Portions the recipe yields; null clears"),
        product_id: z.number().int().nullable().optional().describe("Linked batch product; null unlinks"),
        ingredients: z.array(mealItemSchema).min(1).optional(),
      },
    },
    wrap((input) => jsonResult(saveRecipe(db, input))),
  );

  server.registerTool(
    "get_recipe",
    {
      description:
        "Full recipe with LIVE-computed macros (current product values), totals and per_serving. To LOG one serving: use the returned per_serving macros as an ad-hoc log_meal item, or the linked batch product's portion. Ingredients marked unresolved (with a reason) are excluded from totals.",
      inputSchema: { id: z.number().int() },
    },
    wrap(({ id }) => {
      const recipe = getRecipe(db, id);
      if (!recipe) throw new Error(`Recipe ${id} not found`);
      return jsonResult(recipe);
    }),
  );

  server.registerTool(
    "find_recipes",
    {
      description:
        "List/search recipes by name or tag ('vad kan jag laga?'). Returns summaries with kcal per serving; incomplete:true means an ingredient no longer resolves.",
      inputSchema: { query: z.string().optional() },
    },
    wrap(({ query }) => jsonResult({ recipes: findRecipes(db, query) })),
  );

  server.registerTool(
    "delete_recipe",
    {
      description: "Delete a recipe by id. Past meal logs are unaffected.",
      inputSchema: { id: z.number().int() },
    },
    wrap(({ id }) => {
      deleteRecipe(db, id);
      return jsonResult({ deleted: id });
    }),
  );
}
