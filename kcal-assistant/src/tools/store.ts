import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config";
import { searchIca, getIcaDetail } from "../services/ica";
import { jsonResult, wrap } from "./util";

export function registerStoreTools(server: McpServer): void {
  server.registerTool(
    "search_store",
    {
      description:
        "Search Philip's actual ICA store (Maxi ICA Stormarknad Nynäshamn) for products with live price, availability and nutrition per 100g/100ml straight from ICA's product pages. Use for discovering NEW things to buy that fit the day's remaining macros. Filter respecting his standing rules (from get_context). Products without nutrition data are uncertain: räkna högt. To make a found product loggable, save it with save_product.",
      inputSchema: {
        query: z.string().min(1).describe("Search term, Swedish (e.g. 'kycklingspett', 'kvarg')"),
        limit: z.number().int().min(1).max(15).optional().describe("Max results, default 6"),
        min_protein_100: z.number().optional().describe("Only items with at least this protein per 100g/100ml"),
        max_kcal_100: z.number().optional().describe("Only items with at most this kcal per 100g/100ml"),
      },
    },
    wrap(async ({ query, limit, min_protein_100, max_kcal_100 }) => {
      const hits = await searchIca(config.icaStoreId, query, limit ?? 6);
      const enriched = await Promise.all(
        hits.map(async (hit) => {
          try {
            const detail = await getIcaDetail(config.icaStoreId, hit.retailer_product_id);
            return { ...hit, per_100: detail.nutrition, ingredients: detail.ingredients };
          } catch {
            return { ...hit, per_100: null, ingredients: null };
          }
        }),
      );
      const filtered = enriched.filter((item) => {
        if (min_protein_100 !== undefined && (item.per_100?.protein ?? -1) < min_protein_100)
          return false;
        if (max_kcal_100 !== undefined && (item.per_100?.kcal ?? Infinity) > max_kcal_100)
          return false;
        return true;
      });
      return jsonResult({ store: "Maxi ICA Stormarknad Nynäshamn", items: filtered });
    }),
  );
}
