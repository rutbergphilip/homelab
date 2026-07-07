import type { Database } from "bun:sqlite";
import { type Macros, scalePer100g, sumMacros } from "../lib/macros";
import { resolveItem, type MealItemInput } from "./meals";
import { saveProduct, type Product } from "./products";

export interface BatchInput {
  name: string;
  product_id?: number;
  ingredients: MealItemInput[];
  cooked_weight_g?: number;
  portion?: { name: string; grams?: number; count?: number };
  aliases?: string[];
  notes?: string;
  save?: boolean;
}

export interface BatchResult {
  total: Macros;
  cooked_weight_g: number;
  per_100g: Macros;
  portion: ({ name: string; grams: number } & Macros) | null;
  saved_product?: Product;
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

export function computeBatch(db: Database, input: BatchInput): BatchResult {
  const resolved = input.ingredients.map((ingredient) => resolveItem(db, ingredient));

  let cooked = input.cooked_weight_g;
  if (cooked === undefined) {
    if (resolved.some((r) => r.grams === null)) {
      throw new Error("cooked_weight_g krävs när någon ingrediens saknar gram");
    }
    cooked = resolved.reduce((sum, r) => sum + r.grams!, 0);
  }
  if (!(cooked > 0)) throw new Error("cooked_weight_g måste vara större än 0");

  const total = sumMacros(resolved.map((r) => r.macros));
  // Plain nearest rounding: ingredients are already directionally rounded once;
  // "räkna högt" applies to uncertainty, not to derived arithmetic — logging a
  // portion applies the directional rounding exactly once.
  const per100g: Macros = {
    kcal: round2((total.kcal * 100) / cooked),
    protein: round2((total.protein * 100) / cooked),
    fat: round2((total.fat * 100) / cooked),
    carbs: round2((total.carbs * 100) / cooked),
  };

  let portion: BatchResult["portion"] = null;
  if (input.portion) {
    const grams =
      input.portion.grams ??
      (input.portion.count !== undefined && input.portion.count > 0
        ? Math.round((cooked / input.portion.count) * 10) / 10
        : null);
    if (grams === null) throw new Error("portion behöver grams eller count");
    portion = { name: input.portion.name, grams, ...scalePer100g(per100g, grams) };
  }

  const result: BatchResult = { total, cooked_weight_g: cooked, per_100g: per100g, portion };
  if (input.save) {
    result.saved_product = saveProduct(db, {
      id: input.product_id,
      name: input.name,
      per_100g: per100g,
      aliases: input.aliases,
      portions: portion ? [{ name: portion.name, grams: portion.grams }] : undefined,
      notes: input.notes,
      source: "manual",
    });
  }
  return result;
}
