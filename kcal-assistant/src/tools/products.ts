import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Database } from "bun:sqlite";
import { z } from "zod";
import { getProduct, saveProduct, searchProducts, type Product } from "../db/products";
import { computeBatch } from "../db/batch";
import { clearProductImage, getImageStatus } from "../db/product-images";
import {
  findImageCandidates,
  scheduleBackfill,
  setImageFromCandidate,
} from "../services/product-images";
import { isValidCategory, categoryError } from "../lib/categories";
import { categorySchema, macrosSchema, mealItemSchema, portionSchema } from "./schemas";
import { jsonResult, wrap } from "./util";

const SUGGESTION_CONTRACT =
  "Kategori styr förslag: när Philip ber om snacks/kvällssnacks, föreslå ENDAST produkter med category 'snacks'; motsvarande för andra kategorier. Finns inga passande — säg det, ersätt aldrig från annan kategori.";

// Validates a category filter/value against the closed vocabulary. Empty
// string means "no filter" for search — never a validation target.
function validateCategoryFilter(category: string | undefined): string | undefined {
  if (category === undefined || category === "") return undefined;
  if (!isValidCategory(category)) throw new Error(categoryError());
  return category;
}

// Same vocabulary check for save_product, but with clear-vs-omit semantics:
// - undefined: leave untouched (db layer preserves on update, stores null on create)
// - "" on update: explicit clear, bypasses vocabulary validation (db's clearable())
// - "" on create: nothing to clear yet — normalize to undefined so the db
//   layer never persists a literal "" (it only normalizes "" on UPDATE)
// - anything else: must be in the vocabulary, else Swedish error
function resolveCategoryForSave(category: string | undefined, hasId: boolean): string | undefined {
  if (category === undefined) return undefined;
  if (category === "") return hasId ? "" : undefined;
  if (!isValidCategory(category)) throw new Error(categoryError());
  return category;
}

// set_product_image accepts an id or a name so the LLM does not have to run
// search_products first for the common "fixa bilden för knäckebrödet" phrasing.
function resolveProductRef(db: Database, ref: number | string): Product {
  if (typeof ref === "number") {
    const product = getProduct(db, ref);
    if (!product) throw new Error(`Product ${ref} not found`);
    return product;
  }
  const hits = searchProducts(db, ref, 2);
  if (hits.length === 0) throw new Error(`Hittade ingen produkt som matchar "${ref}"`);
  if (hits.length > 1) {
    throw new Error(
      `"${ref}" matchar flera produkter (${hits.map((h) => `${h.id}: ${h.name}`).join(", ")}) — ange id`,
    );
  }
  return hits[0]!;
}

export function registerProductTools(server: McpServer, db: Database): void {
  server.registerTool(
    "search_products",
    {
      description:
        `Fuzzy search the product database. Handles vague Swedish phrasing ('den där kycklingkebaben'), missing diacritics and compound words. Returns candidates; pick the right one or ask the user if ambiguous. Always search before logging or creating a product. ${SUGGESTION_CONTRACT}`,
      inputSchema: {
        query: z.string().min(1).describe("Free-text search, Swedish"),
        limit: z.number().int().min(1).max(20).optional(),
        category: categorySchema.optional(),
      },
    },
    wrap(({ query, limit, category }) => {
      const validCategory = validateCategoryFilter(category);
      return jsonResult({ candidates: searchProducts(db, query, limit ?? 8, validCategory) });
    }),
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
        `Create a product, or update one by passing id (THE single place to correct values when packaging/recipes change). Updates are PARTIAL: omitted fields keep their current values, so updating notes never touches macros. Empty string clears a text field; aliases and portions replace the existing lists wholesale when provided. For estimated values set verified:false and round kcal/fat/carbs UP, protein DOWN. Store product-specific rules in notes (e.g. 'väg fryst', 'räknas styckvis'). ${SUGGESTION_CONTRACT}`,
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
        category: categorySchema.optional(),
      },
    },
    wrap((input) => {
      const category = resolveCategoryForSave(input.category, input.id !== undefined);
      const product = saveProduct(db, { ...input, category });
      // A new product has no photo yet; nudge the backfill so the /ui grid
      // fills in within a minute instead of at the next restart.
      scheduleBackfill(db, 2_000);
      return jsonResult(product);
    }),
  );

  server.registerTool(
    "set_product_image",
    {
      description:
        "Correct or set the photo shown for a product in KCAL·DB's /ui grid. Photos are normally matched automatically against Philip's ICA store, but ICA's search is fuzzy — call this when a product shows the WRONG photo or none at all. Two steps: call with only `product` to see scored candidates, then call again with `retailer_product_id` from the chosen candidate to save it. A photo set this way is locked and the automatic backfill will never overwrite it. Use `clear:true` to remove a wrong photo and let automatic matching retry.",
      inputSchema: {
        product: z.union([z.number().int(), z.string()]).describe("Product id, or a name/alias to search for"),
        retailer_product_id: z
          .string()
          .optional()
          .describe("From a candidate returned by the first call — saves that photo"),
        query: z.string().optional().describe("Override the ICA search term when the product name finds nothing"),
        clear: z.boolean().optional().describe("Remove the stored photo instead of setting one"),
      },
    },
    wrap(async ({ product, retailer_product_id, query, clear }) => {
      const target = resolveProductRef(db, product);

      if (clear) {
        clearProductImage(db, target.id);
        return jsonResult({ product: { id: target.id, name: target.name }, cleared: true });
      }

      const candidates = await findImageCandidates(target.name, target.brand, query);

      if (retailer_product_id === undefined) {
        return jsonResult({
          product: { id: target.id, name: target.name, brand: target.brand },
          current: getImageStatus(db, target.id),
          candidates: candidates.map(({ candidate, score }) => ({
            retailer_product_id: candidate.retailer_product_id,
            name: candidate.name,
            brand: candidate.brand,
            score: Number(score.toFixed(2)),
          })),
          next_step:
            candidates.length === 0
              ? "Inga träffar med bild. Prova ett annat `query`."
              : "Anropa igen med retailer_product_id för den kandidat Philip väljer.",
        });
      }

      const chosen = candidates.find((c) => c.candidate.retailer_product_id === retailer_product_id);
      if (!chosen) {
        throw new Error(
          `retailer_product_id ${retailer_product_id} fanns inte bland kandidaterna — sök om utan retailer_product_id först`,
        );
      }
      const saved = await setImageFromCandidate(db, target.id, chosen.candidate, chosen.score);
      if (!saved) throw new Error("Kunde inte hämta bilden från ICA");
      return jsonResult({
        product: { id: target.id, name: target.name },
        saved: true,
        matched_name: chosen.candidate.name,
        locked: true,
      });
    }),
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
