import type { Database } from "bun:sqlite";
import { readDay, listDays, getWeek } from "../db/meals";
import { listProducts } from "../db/products";
import { findRecipes, getRecipe } from "../db/recipes";
import { getTrend, listWeights } from "../db/weights";
import { listPreferences, getTargets } from "../db/preferences";
import { buildForecast, type IntakeSource } from "../db/forecast";
import { getProfile, setProfile, type ProfileInput } from "../db/profile";
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
        const raw = search.get("source");
        if (raw !== null && raw !== "targets" && raw !== "recent") {
          return { status: 400, body: { error: "ogiltig källa" } };
        }
        // raw is typed string|null — literal comparisons don't narrow it,
        // so pick the union value explicitly.
        const source: IntakeSource = raw === "recent" ? "recent" : "targets";
        return { status: 200, body: buildForecast(db, { intake_source: source }) };
      }
      case "profile": {
        if (param !== undefined) return NOT_FOUND;
        if (req.method === "GET") return { status: 200, body: { profile: getProfile(db) } };
        if (req.method === "PUT") {
          if (req.secFetchSite !== "same-origin") {
            return { status: 403, body: { error: "otillåten källa" } };
          }
          if (!req.contentType?.includes("application/json")) {
            return { status: 403, body: { error: "fel innehållstyp" } };
          }
          if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
            return { status: 400, body: { error: "ogiltig JSON" } };
          }
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
