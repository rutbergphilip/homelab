import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { getProduct, saveProduct, searchProducts } from "../db/products";
import { computeBatch } from "../db/batch";
import { macrosSchema, mealItemSchema, portionSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

export function registerProductTools(server: McpServer, db: Database): void {
  server.registerTool(
    "search_products",
    {
      description:
        "Fuzzy search the product database. Handles vague Swedish phrasing ('den där kycklingkebaben'), missing diacritics and compound words. Returns candidates; pick the right one or ask the user if ambiguous. Always search before logging or creating a product.",
      inputSchema: {
        query: z.string().min(1).describe("Free-text search, Swedish"),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    wrap(({ query, limit }) => jsonResult({ candidates: searchProducts(db, query, limit ?? 8) })),
  );

  server.registerTool(
    "get_product",
    {
      description: "Get full detail for one product by id: macros per 100g, aliases, portions, notes/rules.",
      inputSchema: { id: z.number().int() },
    },
    wrap(({ id }) => {
      const product = getProduct(db, id);
      if (!product) throw new Error(`Product ${id} not found`);
      return jsonResult(product);
    }),
  );

  server.registerTool(
    "save_product",
    {
      description:
        "Create a product, or update one by passing id (THE single place to correct values when packaging/recipes change). aliases and portions replace the existing lists wholesale when provided. For estimated values set verified:false and round kcal/fat/carbs UP, protein DOWN. Store product-specific rules in notes (e.g. 'väg fryst').",
      inputSchema: {
        id: z.number().int().optional().describe("Set to update an existing product"),
        name: z.string().min(1),
        brand: z.string().optional(),
        per_100g: macrosSchema.optional(),
        aliases: z.array(z.string()).optional().describe("Colloquial names Philip uses"),
        portions: z.array(portionSchema).optional(),
        notes: z.string().optional(),
        verified: z.boolean().optional().describe("false = estimated/uncertain values"),
        source: z.enum(["manual", "off", "estimate"]).optional(),
      },
    },
    wrap((input) => jsonResult(saveProduct(db, input))),
  );

  server.registerTool(
    "compute_batch",
    {
      description:
        "Recalculate a mealprep batch (e.g. köttfärsblandningen) with exact server math and optionally save it as a product. Enter ingredients AS THEY END UP IN THE BATCH (e.g. 'stekt färs efter fettavhällning' as its own entry with its macros). cooked_weight_g = weighed batch after cooking; defaults to the ingredient gram sum. save defaults to FALSE — set true (with product_id to update in place) once Philip confirms.",
      inputSchema: {
        name: z.string().min(1),
        product_id: z.number().int().optional().describe("Update this product instead of creating"),
        ingredients: z.array(mealItemSchema).min(1),
        cooked_weight_g: z.number().positive().optional(),
        portion: z
          .object({
            name: z.string().min(1).describe("E.g. 'låda'"),
            grams: z.number().positive().optional(),
            count: z.number().positive().optional().describe("Portions per batch, e.g. 7.5"),
          })
          .optional(),
        aliases: z.array(z.string()).optional(),
        notes: z.string().optional().describe("Recipe summary so it can be recomputed later"),
        save: z.boolean().optional(),
      },
    },
    wrap((input) => jsonResult(computeBatch(db, input))),
  );
}
