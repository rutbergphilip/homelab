import type { Database } from "bun:sqlite";
import { type Macros, scaleMacros, sumMacros } from "../lib/macros";
import { resolveItem, type MealItemInput, type DayView, getDay } from "./meals";
import { getRecipe, reconstructInput, type IngredientRow } from "./recipes";
import { getTargetsFor, type DayTargets } from "./preferences";
import { todayStockholm, isValidDate, toEpochDays, epochDaysToDate, addDays } from "../lib/dates";

export type PlanSlot = "frukost" | "lunch" | "middag" | "mellis";

export const PLAN_SLOTS: readonly PlanSlot[] = ["frukost", "lunch", "middag", "mellis"];

const WEEKDAYS = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"] as const;

export interface PlannedMealInput {
  slot: PlanSlot;
  name: string;
  recipe_id?: number;
  recipe_servings?: number;
  items?: MealItemInput[];
  post_gym_shake?: boolean;
  note?: string;
}

export interface PlanDayInput {
  date: string;
  day_type?: string;
  clear_slots?: PlanSlot[];
  meals?: PlannedMealInput[];
}

export interface PlannedItemView {
  product_id: number | null;
  description: string;
  grams: number | null;
  quantity: number | null;
  portion_name: string | null;
  /** Raw ad-hoc input macros (only on ad-hoc rows) — lets the UI rebuild slots losslessly. */
  macros?: Macros;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  unresolved?: true;
  reason?: string;
}

export interface PlannedMealView extends Macros {
  id: number;
  slot: PlanSlot;
  position: number;
  name: string;
  recipe_id: number | null;
  recipe_servings: number | null;
  post_gym_shake: boolean;
  note: string | null;
  logged: boolean;
  totals_incomplete?: true;
  items?: PlannedItemView[];
}

export interface PlanDayView {
  date: string;
  weekday: string;
  day_type: string;
  targets: DayTargets;
  confirmed: boolean;
  confirmed_at: string | null;
  meals: PlannedMealView[];
  totals: Macros;
  remaining: { kcal: number; protein_to_min: number; fat_to_min: number; carbs: number | null };
  checks: { kcal_ok: boolean; protein_floor_ok: boolean; fat_floor_ok: boolean };
  warning?: string;
}

export interface PlanWeekView {
  start_date: string;
  end_date: string;
  days: PlanDayView[];
  week: {
    planned_days: number;
    confirmed_days: number;
    avg_planned_kcal: number | null;
    avg_target_kcal: number;
  };
}

/** Monday of the week containing `date`. Epoch day 0 (1970-01-01) was a Thursday. */
export function mondayOf(date: string): string {
  const days = toEpochDays(date);
  const weekdayIndex = (((days + 3) % 7) + 7) % 7; // 0 = Monday
  return epochDaysToDate(days - weekdayIndex);
}

export function weekdayName(date: string): string {
  const index = (((toEpochDays(date) + 3) % 7) + 7) % 7;
  return WEEKDAYS[index]!;
}

function assertSlot(slot: string): asserts slot is PlanSlot {
  if (!PLAN_SLOTS.includes(slot as PlanSlot)) {
    throw new Error(`Ogiltig måltidslucka: ${slot} (giltiga: ${PLAN_SLOTS.join(", ")})`);
  }
}

interface PlannedMealRow {
  id: number;
  day_date: string;
  slot: PlanSlot;
  position: number;
  name: string;
  recipe_id: number | null;
  recipe_servings: number | null;
  post_gym_shake: number;
  logged_meal_id: number | null;
  note: string | null;
}

interface PlannedItemRow extends IngredientRow {
  id: number;
}

interface ResolvedPlannedMeal {
  macros: Macros;
  incomplete: boolean;
  items: PlannedItemView[];
  /** For confirm: the meal_items to insert (explicit macros — rounding already applied once). */
  loggableItems: MealItemInput[];
  incompleteReasons: string[];
}

// Live resolution, mirroring getRecipe: product edits propagate into the plan;
// unresolvable rows are flagged and contribute nothing to the totals.
function resolvePlannedMeal(db: Database, meal: PlannedMealRow): ResolvedPlannedMeal {
  if (meal.recipe_id !== null || meal.recipe_servings !== null) {
    const servings = meal.recipe_servings ?? 1;
    const recipe = meal.recipe_id !== null ? getRecipe(db, meal.recipe_id) : null;
    if (!recipe) {
      return {
        macros: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
        incomplete: true,
        items: [],
        loggableItems: [],
        incompleteReasons: ["receptet har tagits bort"],
      };
    }
    const base = recipe.servings !== null && recipe.servings > 0 ? recipe.per_serving! : recipe.totals;
    const macros = scaleMacros(base, servings);
    const unit = recipe.servings !== null && recipe.servings > 0 ? "port" : "sats";
    const description = `${recipe.name} (${servings} ${unit})`;
    return {
      macros,
      incomplete: recipe.totals_incomplete === true,
      items: [],
      loggableItems: [{ description, macros }],
      incompleteReasons: recipe.totals_incomplete ? [`receptet "${recipe.name}" har olösta ingredienser`] : [],
    };
  }

  const rows = db
    .query<PlannedItemRow, [number]>(
      "SELECT id, product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs FROM planned_meal_items WHERE planned_meal_id = ? ORDER BY position, id",
    )
    .all(meal.id);

  const items: PlannedItemView[] = [];
  const loggableItems: MealItemInput[] = [];
  const resolved: Macros[] = [];
  const incompleteReasons: string[] = [];

  for (const row of rows) {
    const isAdhoc = row.kcal !== null;
    const base: PlannedItemView = {
      product_id: row.product_id,
      description: row.description,
      grams: row.grams,
      quantity: row.quantity,
      portion_name: row.portion_name,
    };
    if (isAdhoc) {
      base.macros = { kcal: row.kcal!, protein: row.protein!, fat: row.fat!, carbs: row.carbs! };
    }
    if (!isAdhoc && row.product_id === null) {
      items.push({ ...base, unresolved: true, reason: "produkten har tagits bort" });
      incompleteReasons.push(`${row.description}: produkten har tagits bort`);
      continue;
    }
    try {
      const r = resolveItem(db, reconstructInput(row));
      items.push({ ...base, description: r.description, ...r.macros });
      resolved.push(r.macros);
      loggableItems.push({
        description: r.description,
        grams: r.grams ?? undefined,
        quantity: r.quantity ?? undefined,
        product_id: r.product_id ?? undefined,
        macros: r.macros,
      });
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      items.push({ ...base, unresolved: true, reason });
      incompleteReasons.push(`${row.description}: ${reason}`);
    }
  }

  return {
    macros: sumMacros(resolved),
    incomplete: incompleteReasons.length > 0,
    items,
    loggableItems,
    incompleteReasons,
  };
}

function readPlannedMealRows(db: Database, date: string): PlannedMealRow[] {
  return db
    .query<PlannedMealRow, [string]>(
      `SELECT id, day_date, slot, position, name, recipe_id, recipe_servings, post_gym_shake, logged_meal_id, note
       FROM planned_meals WHERE day_date = ?
       ORDER BY CASE slot WHEN 'frukost' THEN 0 WHEN 'lunch' THEN 1 WHEN 'middag' THEN 2 ELSE 3 END, position, id`,
    )
    .all(date);
}

// Read-only (no ensureDay) — the UI/internal read guarantee depends on this.
export function readPlanDay(db: Database, date: string, includeItems = false): PlanDayView {
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date} (expected YYYY-MM-DD)`);
  const dayRow = db
    .query<{ day_type: string; plan_confirmed_at: string | null }, [string]>(
      "SELECT day_type, plan_confirmed_at FROM days WHERE date = ?",
    )
    .get(date);
  const dayType = dayRow?.day_type ?? "vilodag";
  const targets = getTargetsFor(db, dayType);
  const confirmedAt = dayRow?.plan_confirmed_at ?? null;

  const meals: PlannedMealView[] = readPlannedMealRows(db, date).map((row) => {
    const r = resolvePlannedMeal(db, row);
    return {
      id: row.id,
      slot: row.slot,
      position: row.position,
      name: row.name,
      recipe_id: row.recipe_id,
      recipe_servings: row.recipe_servings,
      post_gym_shake: row.post_gym_shake === 1,
      note: row.note,
      logged: row.logged_meal_id !== null,
      ...(r.incomplete && { totals_incomplete: true as const }),
      ...(includeItems && { items: r.items }),
      ...r.macros,
    };
  });

  const totals = sumMacros(meals);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    date,
    weekday: weekdayName(date),
    day_type: dayType,
    targets,
    confirmed: confirmedAt !== null,
    confirmed_at: confirmedAt,
    meals,
    totals,
    remaining: {
      kcal: targets.kcal - totals.kcal,
      protein_to_min: Math.max(0, r1(targets.protein_min - totals.protein)),
      fat_to_min: Math.max(0, r1(targets.fat_min - totals.fat)),
      carbs: targets.carbs === null ? null : r1(targets.carbs - totals.carbs),
    },
    checks: {
      kcal_ok: totals.kcal <= targets.kcal,
      protein_floor_ok: totals.protein >= targets.protein_min,
      fat_floor_ok: totals.fat >= targets.fat_min,
    },
  };
}

function validatePlannedMeal(db: Database, meal: PlannedMealInput): void {
  assertSlot(meal.slot);
  if (!meal.name || meal.name.trim() === "") throw new Error("En planerad måltid behöver ett namn");
  const hasRecipe = meal.recipe_id !== undefined;
  const hasItems = meal.items !== undefined;
  if (hasRecipe === hasItems) {
    throw new Error(`"${meal.name}": ange antingen recipe_id + recipe_servings ELLER items`);
  }
  if (hasRecipe) {
    if (meal.recipe_servings === undefined || !(meal.recipe_servings > 0)) {
      throw new Error(`"${meal.name}": recipe_servings måste vara ett positivt tal`);
    }
    if (!getRecipe(db, meal.recipe_id!)) throw new Error(`Recept ${meal.recipe_id} finns inte`);
  } else {
    if (meal.items!.length === 0) throw new Error(`"${meal.name}" behöver minst en item`);
    for (const item of meal.items!) resolveItem(db, item); // fail-early validation
  }
}

function insertPlannedMeal(db: Database, date: string, meal: PlannedMealInput): void {
  const next = db
    .query<{ p: number | null }, [string, string]>(
      "SELECT max(position) AS p FROM planned_meals WHERE day_date = ? AND slot = ?",
    )
    .get(date, meal.slot);
  const position = (next?.p ?? -1) + 1;
  const result = db.run(
    `INSERT INTO planned_meals (day_date, slot, position, name, recipe_id, recipe_servings, post_gym_shake, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      meal.slot,
      position,
      meal.name,
      meal.recipe_id ?? null,
      meal.recipe_id !== undefined ? (meal.recipe_servings ?? null) : null,
      meal.post_gym_shake ? 1 : 0,
      meal.note ?? null,
    ],
  );
  const mealId = Number(result.lastInsertRowid);
  for (const [position, ing] of (meal.items ?? []).entries()) {
    const resolved = resolveItem(db, ing);
    const isAdhoc = ing.macros !== undefined;
    db.run(
      `INSERT INTO planned_meal_items
         (planned_meal_id, position, product_id, description, grams, quantity, portion_name, kcal, protein, fat, carbs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mealId,
        position,
        ing.product_id ?? null,
        resolved.description,
        // verbatim input: portion items keep grams NULL (recipe_ingredients convention)
        isAdhoc || ing.portion_name === undefined ? (ing.grams ?? null) : null,
        ing.quantity ?? null,
        isAdhoc ? null : (ing.portion_name ?? null),
        ing.macros?.kcal ?? null,
        ing.macros?.protein ?? null,
        ing.macros?.fat ?? null,
        ing.macros?.carbs ?? null,
      ],
    );
  }
}

// Batch upsert — THE write path shared by the plan_week MCP tool and the UI.
// replace=true (default): slots mentioned in `meals` are replaced wholesale.
// Soft lock: editing a confirmed day works but the returned view carries a
// varning — the log is only changed via confirm/unconfirm/edit_meal.
// NOTE: replacing/clearing planned meals that were already logged severs
// their logged_meal_id link, so a later unconfirm won't remove those logged
// meals — deliberate (the warning tells Philip the log is unaffected).
export function upsertPlanDays(db: Database, days: PlanDayInput[], replace = true): PlanDayView[] {
  if (days.length === 0) throw new Error("Inga dagar angivna");
  db.transaction(() => {
    for (const day of days) {
      if (!isValidDate(day.date)) throw new Error(`Invalid date: ${day.date} (expected YYYY-MM-DD)`);
      db.run("INSERT OR IGNORE INTO days (date) VALUES (?)", [day.date]);
      if (day.day_type !== undefined) {
        getTargetsFor(db, day.day_type); // validates the type
        db.run("UPDATE days SET day_type = ? WHERE date = ?", [day.day_type, day.date]);
      }
      for (const slot of day.clear_slots ?? []) {
        assertSlot(slot);
        db.run("DELETE FROM planned_meals WHERE day_date = ? AND slot = ?", [day.date, slot]);
      }
      const meals = day.meals ?? [];
      for (const meal of meals) validatePlannedMeal(db, meal);
      if (replace) {
        for (const slot of new Set(meals.map((m) => m.slot))) {
          db.run("DELETE FROM planned_meals WHERE day_date = ? AND slot = ?", [day.date, slot]);
        }
      }
      for (const meal of meals) insertPlannedMeal(db, day.date, meal);
    }
  })();

  return days.map((day) => {
    const view = readPlanDay(db, day.date);
    if (view.confirmed) {
      view.warning = "dagen är redan bekräftad — ändringar påverkar inte loggen";
    }
    return view;
  });
}

export function getPlanWeek(
  db: Database,
  opts: { start?: string; weeks?: number; include_items?: boolean } = {},
): PlanWeekView {
  const anchor = opts.start ?? todayStockholm();
  if (!isValidDate(anchor)) throw new Error(`Invalid date: ${anchor} (expected YYYY-MM-DD)`);
  const start = mondayOf(anchor);
  const weeks = Math.min(4, Math.max(1, Math.trunc(opts.weeks ?? 1)));
  const total = weeks * 7;

  const days: PlanDayView[] = [];
  for (let i = 0; i < total; i++) {
    days.push(readPlanDay(db, addDays(start, i), opts.include_items ?? false));
  }

  const planned = days.filter((d) => d.meals.length > 0);
  return {
    start_date: start,
    end_date: addDays(start, total - 1),
    days,
    week: {
      planned_days: planned.length,
      confirmed_days: days.filter((d) => d.confirmed).length,
      avg_planned_kcal:
        planned.length === 0
          ? null
          : Math.round(planned.reduce((a, d) => a + d.totals.kcal, 0) / planned.length),
      avg_target_kcal: Math.round(days.reduce((a, d) => a + d.targets.kcal, 0) / days.length),
    },
  };
}
