import type { Database } from "bun:sqlite";
import { type Macros, sumMacros } from "../lib/macros";
import { resolveItem, type MealItemInput } from "./meals";

export interface RecipeInput {
  id?: number;
  name: string;
  instructions?: string;
  notes?: string;
  tags?: string;
  servings?: number | null;
  active_minutes?: number | null;
  total_minutes?: number | null;
  product_id?: number | null;
  ingredients?: MealItemInput[];
}

export interface RecipeIngredientView {
  product_id: number | null;
  description: string;
  grams: number | null;
  quantity: number | null;
  portion_name: string | null;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  unresolved?: true;
  reason?: string;
}

export interface RecipeView {
  id: number;
  name: string;
  instructions: string | null;
  notes: string | null;
  tags: string | null;
  servings: number | null;
  active_minutes: number | null;
  total_minutes: number | null;
  product_id: number | null;
  updated_at: string;
  ingredients: RecipeIngredientView[];
  totals: Macros;
  totals_incomplete?: true;
  per_serving: Macros | null;
}

export interface RecipeSummary {
  id: number;
  name: string;
  tags: string | null;
  servings: number | null;
  total_minutes: number | null;
  kcal_per_serving: number | null;
  incomplete?: true;
}

interface RecipeRow {
  id: number;
  name: string;
  instructions: string | null;
  notes: string | null;
  tags: string | null;
  servings: number | null;
  active_minutes: number | null;
  total_minutes: number | null;
  product_id: number | null;
  updated_at: string;
}

interface IngredientRow {
  product_id: number | null;
  description: string;
  grams: number | null;
  quantity: number | null;
  portion_name: string | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

// Stored rows are raw INPUT. Reconstruction is unambiguous: all-four macros
// non-null => ad-hoc (description IS input); else portion_name => portion item;
// else grams item. Product rows get NO description — live resolution supplies
// the current product name, so renames propagate.
function reconstructInput(row: IngredientRow): MealItemInput {
  if (row.kcal !== null && row.protein !== null && row.fat !== null && row.carbs !== null) {
    return {
      description: row.description,
      grams: row.grams ?? undefined,
      quantity: row.quantity ?? undefined,
      macros: { kcal: row.kcal, protein: row.protein, fat: row.fat, carbs: row.carbs },
    };
  }
  const input: MealItemInput = { product_id: row.product_id ?? undefined };
  if (row.portion_name !== null) {
    input.portion_name = row.portion_name;
    if (row.quantity !== null) input.quantity = row.quantity;
  } else if (row.grams !== null) {
    input.grams = row.grams;
  }
  return input;
}

function displayBase(row: IngredientRow): RecipeIngredientView {
  return {
    product_id: row.product_id,
    description: row.description,
    grams: row.grams,
    quantity: row.quantity,
    portion_name: row.portion_name,
  };
}

const round1 = (x: number): number => Math.round(x * 10) / 10;
const round2 = (x: number): number => Math.round(x * 100) / 100;

export function getRecipe(db: Database, id: number): RecipeView | null {
  const row = db.query<RecipeRow, [number]>("SELECT * FROM recipes WHERE id = ?").get(id);
  if (!row) return null;

  const ingredientRows = db
    .query<IngredientRow, [number]>(
      "SELECT product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position, id",
    )
    .all(id);

  const ingredients: RecipeIngredientView[] = [];
  const resolved: Macros[] = [];
  let incomplete = false;

  for (const ing of ingredientRows) {
    const isAdhoc = ing.kcal !== null;
    if (!isAdhoc && ing.product_id === null) {
      ingredients.push({ ...displayBase(ing), unresolved: true, reason: "produkten har tagits bort" });
      incomplete = true;
      continue;
    }
    try {
      const r = resolveItem(db, reconstructInput(ing));
      ingredients.push({
        product_id: r.product_id,
        description: r.description,
        grams: r.grams,
        quantity: r.quantity,
        portion_name: r.portion_name,
        ...r.macros,
      });
      resolved.push(r.macros);
    } catch (e) {
      ingredients.push({
        ...displayBase(ing),
        unresolved: true,
        reason: e instanceof Error ? e.message : String(e),
      });
      incomplete = true;
    }
  }

  const totals = sumMacros(resolved);
  // Plain rounding: the LLM copies per_serving into log_meal as explicit
  // macros, where the directional "räkna högt" rounding applies exactly once.
  const per_serving =
    row.servings !== null && row.servings > 0
      ? {
          kcal: round1(totals.kcal / row.servings),
          protein: round2(totals.protein / row.servings),
          fat: round2(totals.fat / row.servings),
          carbs: round2(totals.carbs / row.servings),
        }
      : null;

  return {
    id: row.id,
    name: row.name,
    instructions: row.instructions,
    notes: row.notes,
    tags: row.tags,
    servings: row.servings,
    active_minutes: row.active_minutes,
    total_minutes: row.total_minutes,
    product_id: row.product_id,
    updated_at: row.updated_at,
    ingredients,
    totals,
    ...(incomplete && { totals_incomplete: true as const }),
    per_serving,
  };
}

function validateTimes(active: number | null, total: number | null): void {
  for (const [label, v] of [
    ["active_minutes", active],
    ["total_minutes", total],
  ] as const) {
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      throw new Error(`${label} måste vara ett positivt heltal (minuter)`);
    }
  }
  if (active !== null && total !== null && total < active) {
    throw new Error("total_minutes kan inte vara mindre än active_minutes");
  }
}

export function saveRecipe(db: Database, input: RecipeInput): RecipeView {
  const save = db.transaction(() => {
    let id = input.id;
    const clearable = (value: string | undefined, current: string | null) =>
      value === undefined ? current : value === "" ? null : value;

    if (id) {
      const existing = db.query<RecipeRow, [number]>("SELECT * FROM recipes WHERE id = ?").get(id);
      if (!existing) throw new Error(`Recipe ${id} not found`);
      const active =
        input.active_minutes === undefined ? existing.active_minutes : input.active_minutes;
      const total =
        input.total_minutes === undefined ? existing.total_minutes : input.total_minutes;
      validateTimes(active, total);
      db.run(
        `UPDATE recipes SET
           name = ?, instructions = ?, notes = ?, tags = ?, servings = ?, product_id = ?,
           active_minutes = ?, total_minutes = ?,
           updated_at = datetime('now')
         WHERE id = ?`,
        [
          input.name,
          clearable(input.instructions, existing.instructions),
          clearable(input.notes, existing.notes),
          clearable(input.tags, existing.tags),
          input.servings === undefined ? existing.servings : input.servings,
          input.product_id === undefined ? existing.product_id : input.product_id,
          active,
          total,
          id,
        ],
      );
    } else {
      if (!input.ingredients || input.ingredients.length === 0) {
        throw new Error("Ett recept behöver minst en ingrediens");
      }
      const active = input.active_minutes ?? null;
      const total = input.total_minutes ?? null;
      validateTimes(active, total);
      const result = db.run(
        "INSERT INTO recipes (name, instructions, notes, tags, servings, product_id, active_minutes, total_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          input.name,
          input.instructions ?? null,
          input.notes ?? null,
          input.tags ?? null,
          input.servings ?? null,
          input.product_id ?? null,
          active,
          total,
        ],
      );
      id = Number(result.lastInsertRowid);
    }

    if (input.ingredients !== undefined) {
      if (input.ingredients.length === 0) {
        throw new Error("Ett recept behöver minst en ingrediens");
      }
      db.run("DELETE FROM recipe_ingredients WHERE recipe_id = ?", [id]);
      input.ingredients.forEach((ing, position) => {
        const resolvedItem = resolveItem(db, ing); // fail-early validation + name snapshot
        const isAdhoc = ing.macros !== undefined;
        db.run(
          `INSERT INTO recipe_ingredients
             (recipe_id, position, product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id!,
            position,
            ing.product_id ?? null,
            resolvedItem.description,
            // verbatim input: portion items keep grams NULL
            isAdhoc || ing.portion_name === undefined ? ing.grams ?? null : null,
            ing.quantity ?? null,
            isAdhoc ? null : ing.portion_name ?? null,
            ing.macros?.kcal ?? null,
            ing.macros?.protein ?? null,
            ing.macros?.fat ?? null,
            ing.macros?.carbs ?? null,
          ],
        );
      });
    }
    return id!;
  });

  return getRecipe(db, save())!;
}

export function findRecipes(db: Database, query?: string): RecipeSummary[] {
  const rows = query
    ? db
        .query<RecipeRow, [string]>(
          "SELECT * FROM recipes WHERE name LIKE ?1 COLLATE NOCASE OR tags LIKE ?1 COLLATE NOCASE ORDER BY name",
        )
        .all(`%${query}%`)
    : db.query<RecipeRow, []>("SELECT * FROM recipes ORDER BY name").all();

  return rows.map((row) => {
    const full = getRecipe(db, row.id)!;
    return {
      id: row.id,
      name: row.name,
      tags: row.tags,
      servings: row.servings,
      total_minutes: row.total_minutes,
      kcal_per_serving: full.per_serving?.kcal ?? null,
      ...(full.totals_incomplete && { incomplete: true as const }),
    };
  });
}

export function deleteRecipe(db: Database, id: number): void {
  const exists = db.query("SELECT 1 FROM recipes WHERE id = ?").get(id);
  if (!exists) throw new Error(`Recipe ${id} not found`);
  db.run("DELETE FROM recipes WHERE id = ?", [id]);
}
