import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchNutrition, lookupBarcode } from "../services/openfoodfacts";
import { jsonResult, wrap } from "./util";

export function registerNutritionTools(server: McpServer): void {
  server.registerTool(
    "lookup_nutrition",
    {
      description:
        "Look up nutrition data for a NEW product in Open Food Facts (read-only, saves nothing). Use when search_products finds nothing. Show the candidate to Philip before saving; then call save_product with source:'off', verified:false unless confirmed from packaging, and round kcal/fat/carbs UP, protein DOWN. 'partial' confidence means some macros are missing.",
      inputSchema: {
        query: z.string().optional().describe("Product name, ideally with brand"),
        barcode: z.string().optional().describe("EAN barcode for an exact match"),
      },
    },
    wrap(async ({ query, barcode }) => {
      if (barcode) {
        const candidate = await lookupBarcode(barcode);
        return jsonResult({ candidates: candidate ? [candidate] : [] });
      }
      if (!query) throw new Error("Provide query or barcode");
      return jsonResult({ candidates: await searchNutrition(query) });
    }),
  );
}
