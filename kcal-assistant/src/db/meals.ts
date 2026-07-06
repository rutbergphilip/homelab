import type { Database } from "bun:sqlite";
import { type Macros, roundMacros, scaleMacros, scalePer100g, sumMacros } from "../lib/macros";
import { getProduct } from "./products";
import { getTargetsFor, type DayTargets } from "./preferences";
import { todayStockholm, isValidDate } from "../lib/dates";

export interface MealItemInput {
  product_id?: number;
  description?: string;
  grams?: number;
  portion_name?: string;
  quantity?: number;
  macros?: Macros;
}

export interface MealItemView extends Macros {
  id: number;
  product_id: number | null;
  description: string;
  grams: number | null;
  quantity: number | null;
  portion_name: string | null;
}

export interface MealView extends Macros {
  id: number;
  name: string;
  post_gym_shake: boolean;
  logged_at: string;
  items: MealItemView[];
}

export interface DayView {
  date: string;
  day_type: string;
  targets: DayTargets;
  meals: MealView[];
  totals: Macros;
  remaining: { kcal: number; protein_to_min: number; fat_to_min: number; carbs: number | null };
}

function resolveDate(date?: string): string {
  if (date === undefined) return todayStockholm();
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date} (expected YYYY-MM-DD)`);
  return date;
}

function ensureDay(db: Database, date: string): void {
  db.run("INSERT OR IGNORE INTO days (date) VALUES (?)", [date]);
}

interface ResolvedItem {
  product_id: number | null;
  description: string;
  grams: number | null;
  quantity: number | null;
  portion_name: string | null;
  macros: Macros;
}

function resolveItem(db: Database, item: MealItemInput): ResolvedItem {
  if (item.macros) {
    const description =
      item.description ?? (item.product_id ? getProduct(db, item.product_id)?.name : undefined);
    if (!description) throw new Error("Ad-hoc item needs a description");
    return {
      product_id: item.product_id ?? null,
      description,
      grams: item.grams ?? null,
      quantity: item.quantity ?? null,
      portion_name: null,
      macros: roundMacros(item.macros),
    };
  }

  if (!item.product_id) throw new Error("Item needs product_id or explicit macros");
  const product = getProduct(db, item.product_id);
  if (!product) throw new Error(`Product ${item.product_id} not found`);

  if (item.portion_name !== undefined) {
    const portion = product.portions.find(
      (p) => p.name.toLowerCase() === item.portion_name!.toLowerCase(),
    );
    if (!portion) {
      const known = product.portions.map((p) => p.name).join(", ") || "inga";
      throw new Error(`"${product.name}" has no portion "${item.portion_name}" (known: ${known})`);
    }
    const quantity = item.quantity ?? 1;
    let macros: Macros;
    if (
      portion.kcal !== null &&
      portion.protein !== null &&
      portion.fat !== null &&
      portion.carbs !== null
    ) {
      macros = scaleMacros(
        { kcal: portion.kcal, protein: portion.protein, fat: portion.fat, carbs: portion.carbs },
        quantity,
      );
    } else if (portion.grams !== null) {
      if (!product.per_100g)
        throw new Error(`"${product.name}" lacks per-100g values for gram-based portion`);
      macros = scalePer100g(product.per_100g, portion.grams * quantity);
    } else {
      throw new Error(`Portion "${portion.name}" on "${product.name}" has neither grams nor macros`);
    }
    return {
      product_id: product.id,
      description: item.description ?? product.name,
      grams: portion.grams !== null ? portion.grams * quantity : null,
      quantity,
      portion_name: portion.name,
      macros,
    };
  }

  if (item.grams !== undefined) {
    if (!product.per_100g) throw new Error(`"${product.name}" lacks per-100g values`);
    return {
      product_id: product.id,
      description: item.description ?? product.name,
      grams: item.grams,
      quantity: null,
      portion_name: null,
      macros: scalePer100g(product.per_100g, item.grams),
    };
  }

  throw new Error(`Item for "${product.name}" needs grams, portion_name or explicit macros`);
}

function insertItems(db: Database, mealId: number, items: MealItemInput[]): void {
  if (items.length === 0) throw new Error("A meal needs at least one item");
  for (const input of items) {
    const r = resolveItem(db, input);
    db.run(
      `INSERT INTO meal_items (meal_id, product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mealId,
        r.product_id,
        r.description,
        r.grams,
        r.quantity,
        r.portion_name,
        r.macros.kcal,
        r.macros.protein,
        r.macros.fat,
        r.macros.carbs,
      ],
    );
  }
}

export function getDay(db: Database, date?: string): DayView {
  const resolved = resolveDate(date);
  ensureDay(db, resolved);
  const day = db
    .query<{ date: string; day_type: string }, [string]>(
      "SELECT date, day_type FROM days WHERE date = ?",
    )
    .get(resolved)!;
  const targets = getTargetsFor(db, day.day_type);

  const mealRows = db
    .query<{ id: number; name: string; post_gym_shake: number; logged_at: string }, [string]>(
      "SELECT id, name, post_gym_shake, logged_at FROM meals WHERE day_date = ? ORDER BY post_gym_shake ASC, logged_at ASC, id ASC",
    )
    .all(resolved);

  const meals: MealView[] = mealRows.map((m) => {
    const items = db
      .query<MealItemView, [number]>(
        "SELECT id, product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs FROM meal_items WHERE meal_id = ? ORDER BY id",
      )
      .all(m.id);
    const mealMacros = sumMacros(items);
    return {
      id: m.id,
      name: m.name,
      post_gym_shake: m.post_gym_shake === 1,
      logged_at: m.logged_at,
      items,
      ...mealMacros,
    };
  });

  const totals = sumMacros(meals);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    date: resolved,
    day_type: day.day_type,
    targets,
    meals,
    totals,
    remaining: {
      kcal: targets.kcal - totals.kcal,
      protein_to_min: Math.max(0, r1(targets.protein_min - totals.protein)),
      fat_to_min: Math.max(0, r1(targets.fat_min - totals.fat)),
      carbs: targets.carbs === null ? null : r1(targets.carbs - totals.carbs),
    },
  };
}

export function logMeal(
  db: Database,
  input: { name: string; date?: string; post_gym_shake?: boolean; items: MealItemInput[] },
): { meal_id: number; day: DayView } {
  const date = resolveDate(input.date);
  const mealId = db.transaction(() => {
    ensureDay(db, date);
    const result = db.run("INSERT INTO meals (day_date, name, post_gym_shake) VALUES (?, ?, ?)", [
      date,
      input.name,
      input.post_gym_shake ? 1 : 0,
    ]);
    const id = Number(result.lastInsertRowid);
    insertItems(db, id, input.items);
    return id;
  })();
  return { meal_id: mealId, day: getDay(db, date) };
}

export function editMeal(
  db: Database,
  input: {
    meal_id: number;
    action: "update" | "delete";
    name?: string;
    post_gym_shake?: boolean;
    items?: MealItemInput[];
  },
): DayView {
  const meal = db
    .query<{ day_date: string }, [number]>("SELECT day_date FROM meals WHERE id = ?")
    .get(input.meal_id);
  if (!meal) throw new Error(`Meal ${input.meal_id} not found`);

  db.transaction(() => {
    if (input.action === "delete") {
      db.run("DELETE FROM meals WHERE id = ?", [input.meal_id]);
      return;
    }
    db.run(
      "UPDATE meals SET name = coalesce(?, name), post_gym_shake = coalesce(?, post_gym_shake) WHERE id = ?",
      [input.name ?? null, input.post_gym_shake === undefined ? null : input.post_gym_shake ? 1 : 0, input.meal_id],
    );
    if (input.items !== undefined) {
      db.run("DELETE FROM meal_items WHERE meal_id = ?", [input.meal_id]);
      insertItems(db, input.meal_id, input.items);
    }
  })();

  return getDay(db, meal.day_date);
}

export interface WeekView {
  start_date: string;
  end_date: string;
  days: Array<{
    date: string;
    day_type: string;
    has_meals: boolean;
    totals: Macros;
    target_kcal: number;
  }>;
  days_logged: number;
  avg_logged: Macros | null; // averages over days that have meals
  avg_target_kcal: number; // average target across all 7 days by their day type
}

export function getWeek(db: Database, endDate?: string): WeekView {
  const end = resolveDate(endDate);
  const [y, m, d] = end.split("-").map(Number) as [number, number, number];
  const dates: string[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dt = new Date(Date.UTC(y, m - 1, d - offset));
    dates.push(dt.toISOString().slice(0, 10));
  }

  const days = dates.map((date) => {
    const day = getDay(db, date);
    return {
      date,
      day_type: day.day_type,
      has_meals: day.meals.length > 0,
      totals: day.totals,
      target_kcal: day.targets.kcal,
    };
  });

  const logged = days.filter((day) => day.has_meals);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const avgLogged =
    logged.length === 0
      ? null
      : {
          kcal: Math.round(logged.reduce((a, day) => a + day.totals.kcal, 0) / logged.length),
          protein: r1(logged.reduce((a, day) => a + day.totals.protein, 0) / logged.length),
          fat: r1(logged.reduce((a, day) => a + day.totals.fat, 0) / logged.length),
          carbs: r1(logged.reduce((a, day) => a + day.totals.carbs, 0) / logged.length),
        };

  return {
    start_date: dates[0]!,
    end_date: end,
    days,
    days_logged: logged.length,
    avg_logged: avgLogged,
    avg_target_kcal: Math.round(days.reduce((a, day) => a + day.target_kcal, 0) / days.length),
  };
}

export function setDayType(db: Database, dayType: string, date?: string): DayView {
  getTargetsFor(db, dayType); // validates the type
  const resolved = resolveDate(date);
  ensureDay(db, resolved);
  db.run("UPDATE days SET day_type = ? WHERE date = ?", [dayType, resolved]);
  return getDay(db, resolved);
}
