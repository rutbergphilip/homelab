import type { Database } from "bun:sqlite";
import { readDay, listDays, getWeek } from "../db/meals";
import { listProducts } from "../db/products";
import { findRecipes, getRecipe } from "../db/recipes";
import { getTrend, listWeights } from "../db/weights";
import { listPreferences, getTargets } from "../db/preferences";
import { buildForecast, type IntakeSource } from "../db/forecast";
import { getProfile, setProfile, type ProfileInput } from "../db/profile";
import {
  getPlanWeek,
  upsertPlanDays,
  confirmDay,
  unconfirmDay,
  buildShoppingList,
  PLAN_SLOTS,
  type PlanDayInput,
  type PlannedMealInput,
  type PlanSlot,
} from "../db/plan";
import type { MealItemInput } from "../db/meals";
import { isValidDate } from "../lib/dates";

export interface UiApiResponse {
  status: number;
  body: unknown;
}

export interface UiApiRequest {
  method: string;
  pathname: string;
  search: URLSearchParams;
  contentType?: string;
  secFetchSite?: string;
  body?: unknown;
}

const NOT_FOUND: UiApiResponse = { status: 404, body: { error: "finns inte" } };

// Read-only by construction — with ONE exception: PUT /ui/api/profile
// (CSRF-hardened, single user, shares setProfile's validation with the MCP
// path). Every other handler calls only read functions. Errors never echo
// internals — generic message, details go to the log.
export function handleUiApi(db: Database, req: UiApiRequest): UiApiResponse {
  try {
    const { search } = req;
    const segments = req.pathname.split("/").filter(Boolean); // ["ui","api",resource,param?]
    const resource = segments[2];
    const param = segments[3];

    switch (resource) {
      case "overview": {
        if (param !== undefined) return NOT_FOUND;
        const counts = {
          products: count(db, "products"),
          recipes: count(db, "recipes"),
          days_logged: db.query<{ n: number }, []>("SELECT count(DISTINCT day_date) AS n FROM meals").get()!.n,
          meals: count(db, "meals"),
          weights: count(db, "weights"),
        };
        return {
          status: 200,
          body: {
            day: readDay(db),
            trend: getTrend(db, 28),
            week: getWeek(db),
            targets: getTargets(db),
            counts,
          },
        };
      }
      case "days": {
        if (param !== undefined) {
          if (!isValidDate(param)) return { status: 400, body: { error: "ogiltigt datum" } };
          return { status: 200, body: readDay(db, param) };
        }
        const limit = clampInt(search.get("limit"), 1, 200, 60);
        const offset = clampInt(search.get("offset"), 0, 100_000, 0);
        return { status: 200, body: listDays(db, limit, offset) };
      }
      case "products": {
        if (param !== undefined) return NOT_FOUND;
        return { status: 200, body: { products: listProducts(db) } };
      }
      case "recipes": {
        if (param !== undefined) {
          const id = Number(param);
          if (!Number.isInteger(id)) return { status: 400, body: { error: "ogiltigt id" } };
          const recipe = getRecipe(db, id);
          return recipe ? { status: 200, body: recipe } : NOT_FOUND;
        }
        return { status: 200, body: { recipes: findRecipes(db) } };
      }
      case "weights": {
        if (param !== undefined) return NOT_FOUND;
        return { status: 200, body: { weights: listWeights(db), trend: getTrend(db, 28) } };
      }
      case "forecast": {
        if (param !== undefined) return NOT_FOUND;
        const rawSource = search.get("source");
        if (rawSource !== null && rawSource !== "targets" && rawSource !== "recent") {
          return { status: 400, body: { error: "ogiltig källa" } };
        }
        // raw is typed string|null — literal comparisons don't narrow it,
        // so pick the union value explicitly.
        const source: IntakeSource = rawSource === "recent" ? "recent" : "targets";
        const intake = numParam(search, "intake", 1, 20000);
        if (intake === "invalid") return { status: 400, body: { error: "ogiltig intake" } };
        const activity = numParam(search, "activity", 1.2, 2.5);
        if (activity === "invalid") return { status: 400, body: { error: "ogiltig activity" } };
        const goal = numParam(search, "goal", 1, 500);
        if (goal === "invalid") return { status: 400, body: { error: "ogiltig goal" } };
        const goalDateRaw = search.get("goal_date");
        if (goalDateRaw !== null && goalDateRaw !== "" && !isValidDate(goalDateRaw)) {
          return { status: 400, body: { error: "ogiltig goal_date" } };
        }
        return {
          status: 200,
          body: buildForecast(db, {
            intake_source: source,
            ...(intake !== undefined && { intake_kcal: intake }),
            ...(activity !== undefined && { activity_factor: activity }),
            ...(goal !== undefined && { goal_weight: goal }),
            ...(goalDateRaw !== null && { goal_date: goalDateRaw === "" ? null : goalDateRaw }),
          }),
        };
      }
      case "plan": {
        if (req.method === "GET") {
          if (param !== undefined) return NOT_FOUND;
          const start = search.get("start");
          if (start !== null && !isValidDate(start)) {
            return { status: 400, body: { error: "ogiltigt datum" } };
          }
          const weeksRaw = search.get("weeks");
          const weeks = weeksRaw === null ? 1 : Number(weeksRaw);
          if (!Number.isInteger(weeks) || weeks < 1 || weeks > 4) {
            return { status: 400, body: { error: "ogiltig weeks" } };
          }
          const week = getPlanWeek(db, { start: start ?? undefined, weeks, include_items: true });
          return {
            status: 200,
            body: { ...week, shopping_list: buildShoppingList(db, week.start_date, weeks * 7) },
          };
        }
        if (req.method === "PUT") {
          if (param === undefined) return NOT_FOUND;
          if (!isValidDate(param)) return { status: 400, body: { error: "ogiltigt datum" } };
          const gate = writeGate(req);
          if (gate) return gate;
          const coerced = coercePlanDayBody(req.body as Record<string, unknown>);
          if ("error" in coerced) return { status: 400, body: { error: coerced.error } };
          try {
            const days = upsertPlanDays(db, [{ date: param, ...coerced.input }], coerced.replace);
            return { status: 200, body: { day: days[0] } };
          } catch (e) {
            return { status: 400, body: { error: e instanceof Error ? e.message : "ogiltig plan" } };
          }
        }
        return { status: 405, body: { error: "metod stöds inte" } };
      }
      case "confirm": {
        if (req.method !== "PUT") return { status: 405, body: { error: "metod stöds inte" } };
        if (param === undefined) return NOT_FOUND;
        if (!isValidDate(param)) return { status: 400, body: { error: "ogiltigt datum" } };
        const gate = writeGate(req);
        if (gate) return gate;
        const body = req.body;
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
          return { status: 400, body: { error: "ogiltig JSON" } };
        }
        const { action, slots, ...rest } = body as Record<string, unknown>;
        if (Object.keys(rest).length > 0) {
          return { status: 400, body: { error: `okänt fält: ${Object.keys(rest)[0]}` } };
        }
        if (action !== "confirm" && action !== "unconfirm") {
          return { status: 400, body: { error: "ogiltigt värde för action" } };
        }
        let slotList: PlanSlot[] | undefined;
        if (slots !== undefined) {
          if (!Array.isArray(slots) || slots.some((s) => !PLAN_SLOTS.includes(s as PlanSlot))) {
            return { status: 400, body: { error: "ogiltigt värde för slots" } };
          }
          slotList = slots as PlanSlot[];
        }
        try {
          const result =
            action === "confirm" ? confirmDay(db, param, slotList) : unconfirmDay(db, param);
          return { status: 200, body: result };
        } catch (e) {
          const message = e instanceof Error ? e.message : "fel";
          const conflict = /redan bekräftad|inget planerat|inget att ångra/.test(message);
          return { status: conflict ? 409 : 400, body: { error: message } };
        }
      }
      case "profile": {
        if (param !== undefined) return NOT_FOUND;
        if (req.method === "GET") return { status: 200, body: { profile: getProfile(db) } };
        if (req.method === "PUT") {
          const gate = writeGate(req);
          if (gate) return gate;
          const coerced = coerceProfileBody(req.body as Record<string, unknown>);
          if ("error" in coerced) return { status: 400, body: { error: coerced.error } };
          try {
            return { status: 200, body: { profile: setProfile(db, coerced.input) } };
          } catch (e) {
            return { status: 400, body: { error: e instanceof Error ? e.message : "ogiltig profil" } };
          }
        }
        return { status: 405, body: { error: "metod stöds inte" } };
      }
      case "preferences": {
        if (param !== undefined) return NOT_FOUND;
        return { status: 200, body: { preferences: listPreferences(db), targets: getTargets(db) } };
      }
      default:
        return NOT_FOUND;
    }
  } catch (e) {
    console.error("ui api error:", e instanceof Error ? e.message : e);
    return { status: 500, body: { error: "internal" } };
  }
}

// Shared gate for every UI write: CSRF signals (403) + JSON object body (400).
// Auth itself happened upstream (Authentik at the edge + server verification).
function writeGate(req: UiApiRequest): UiApiResponse | null {
  if (req.secFetchSite !== "same-origin") {
    return { status: 403, body: { error: "otillåten källa" } };
  }
  if (!req.contentType?.includes("application/json")) {
    return { status: 403, body: { error: "fel innehållstyp" } };
  }
  if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
    return { status: 400, body: { error: "ogiltig JSON" } };
  }
  return null;
}

function coerceMealItem(raw: unknown): { item: MealItemInput } | { error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: "ogiltig item" };
  }
  const item: MealItemInput = {};
  for (const key of Object.keys(raw)) {
    const value = (raw as Record<string, unknown>)[key];
    switch (key) {
      case "product_id":
        if (typeof value !== "number") return { error: "ogiltigt värde för product_id" };
        item.product_id = value;
        break;
      case "description":
        if (typeof value !== "string") return { error: "ogiltigt värde för description" };
        item.description = value;
        break;
      case "grams":
        if (typeof value !== "number") return { error: "ogiltigt värde för grams" };
        item.grams = value;
        break;
      case "quantity":
        if (typeof value !== "number") return { error: "ogiltigt värde för quantity" };
        item.quantity = value;
        break;
      case "portion_name":
        if (typeof value !== "string") return { error: "ogiltigt värde för portion_name" };
        item.portion_name = value;
        break;
      case "macros": {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          return { error: "ogiltigt värde för macros" };
        }
        const m = value as Record<string, unknown>;
        const keys = Object.keys(m).sort();
        if (
          keys.join(",") !== "carbs,fat,kcal,protein" ||
          keys.some((k) => typeof m[k] !== "number")
        ) {
          return { error: "macros måste ha exakt kcal, protein, fat, carbs (tal)" };
        }
        item.macros = { kcal: m.kcal as number, protein: m.protein as number, fat: m.fat as number, carbs: m.carbs as number };
        break;
      }
      default:
        return { error: `okänt fält i item: ${key}` };
    }
  }
  return { item };
}

function coercePlannedMeal(raw: unknown): { meal: PlannedMealInput } | { error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: "ogiltig måltid" };
  }
  const record = raw as Record<string, unknown>;
  const meal = {} as PlannedMealInput;
  for (const key of Object.keys(record)) {
    const value = record[key];
    switch (key) {
      case "slot":
        if (typeof value !== "string" || !PLAN_SLOTS.includes(value as PlanSlot)) {
          return { error: "ogiltigt värde för slot" };
        }
        meal.slot = value as PlanSlot;
        break;
      case "name":
        if (typeof value !== "string" || value.trim() === "") return { error: "ogiltigt värde för name" };
        meal.name = value;
        break;
      case "recipe_id":
        if (typeof value !== "number") return { error: "ogiltigt värde för recipe_id" };
        meal.recipe_id = value;
        break;
      case "recipe_servings":
        if (typeof value !== "number") return { error: "ogiltigt värde för recipe_servings" };
        meal.recipe_servings = value;
        break;
      case "items": {
        if (!Array.isArray(value)) return { error: "ogiltigt värde för items" };
        const items: MealItemInput[] = [];
        for (const rawItem of value) {
          const coerced = coerceMealItem(rawItem);
          if ("error" in coerced) return coerced;
          items.push(coerced.item);
        }
        meal.items = items;
        break;
      }
      case "post_gym_shake":
        if (typeof value !== "boolean") return { error: "ogiltigt värde för post_gym_shake" };
        meal.post_gym_shake = value;
        break;
      case "note":
        if (typeof value !== "string") return { error: "ogiltigt värde för note" };
        meal.note = value;
        break;
      default:
        return { error: `okänt fält i måltid: ${key}` };
    }
  }
  if (!meal.slot || !meal.name) return { error: "måltid behöver slot och name" };
  return { meal };
}

function coercePlanDayBody(
  body: Record<string, unknown>,
): { input: Omit<PlanDayInput, "date">; replace?: boolean } | { error: string } {
  const input: Omit<PlanDayInput, "date"> = {};
  let replace: boolean | undefined;
  for (const key of Object.keys(body)) {
    const value = body[key];
    switch (key) {
      case "day_type":
        if (typeof value !== "string") return { error: "ogiltigt värde för day_type" };
        input.day_type = value;
        break;
      case "clear_slots":
        if (!Array.isArray(value) || value.some((s) => !PLAN_SLOTS.includes(s as PlanSlot))) {
          return { error: "ogiltigt värde för clear_slots" };
        }
        input.clear_slots = value as PlanSlot[];
        break;
      case "meals": {
        if (!Array.isArray(value)) return { error: "ogiltigt värde för meals" };
        const meals: PlannedMealInput[] = [];
        for (const rawMeal of value) {
          const coerced = coercePlannedMeal(rawMeal);
          if ("error" in coerced) return coerced;
          meals.push(coerced.meal);
        }
        input.meals = meals;
        break;
      }
      case "replace":
        if (typeof value !== "boolean") return { error: "ogiltigt värde för replace" };
        replace = value;
        break;
      default:
        return { error: `okänt fält: ${key}` };
    }
  }
  return { input, ...(replace !== undefined && { replace }) };
}

function count(db: Database, table: "products" | "recipes" | "meals" | "weights"): number {
  return db.query<{ n: number }, []>(`SELECT count(*) AS n FROM ${table}`).get()!.n;
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Strict shape check for the single write endpoint: unknown keys and wrong
// JSON types are rejected here; value semantics (ranges, dates, first-insert
// requirements) live in setProfile so the MCP and UI paths share one truth.
function coerceProfileBody(body: Record<string, unknown>): { input: ProfileInput } | { error: string } {
  const input: ProfileInput = {};
  for (const key of Object.keys(body)) {
    const value = body[key];
    switch (key) {
      case "birth_date":
        if (typeof value !== "string") return { error: "ogiltigt värde för birth_date" };
        input.birth_date = value;
        break;
      case "sex":
        if (value !== "man" && value !== "kvinna") return { error: "ogiltigt värde för sex" };
        input.sex = value;
        break;
      case "height_cm":
        if (typeof value !== "number") return { error: "ogiltigt värde för height_cm" };
        input.height_cm = value;
        break;
      case "activity_factor":
        if (typeof value !== "number") return { error: "ogiltigt värde för activity_factor" };
        input.activity_factor = value;
        break;
      case "goal_weight_kg":
        if (value !== null && typeof value !== "number") return { error: "ogiltigt värde för goal_weight_kg" };
        input.goal_weight_kg = value;
        break;
      case "goal_date":
        if (value !== null && typeof value !== "string") return { error: "ogiltigt värde för goal_date" };
        input.goal_date = value;
        break;
      default:
        return { error: `okänt fält: ${key}` };
    }
  }
  return { input };
}

function numParam(
  search: URLSearchParams,
  name: string,
  min: number,
  max: number,
): number | undefined | "invalid" {
  const raw = search.get(name);
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return "invalid";
  return n;
}
