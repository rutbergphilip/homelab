import { useEffect, useRef, useState } from "react";

export const sv = (n: number | null | undefined, dec = 1): string =>
  n === null || n === undefined
    ? "—"
    : Number(n).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: dec });

// CF/Authentik session expiry: fetch follows the login redirect and gets
// HTML — a full reload lets the top-level navigation re-trigger login.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers ?? {}) },
  });
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    location.reload();
    throw new Error("session expired");
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body as T;
}

// Aborts superseded requests (replaces the v0.7 seq guard). keepPrevious
// retains the last good data during refetch/failure (chart keep-last-good).
export function useApi<T>(path: string | null, keepPrevious = false) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const dataRef = useRef<T | null>(null);
  useEffect(() => {
    if (path === null) return;
    const ctrl = new AbortController();
    setLoading(true);
    if (!keepPrevious) {
      setData(null);
      dataRef.current = null;
    }
    setError(null);
    api<T>(path, { signal: ctrl.signal })
      .then((d) => {
        if (ctrl.signal.aborted) return;
        dataRef.current = d;
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (ctrl.signal.aborted || e.message === "session expired") return;
        setError(e.message);
        setLoading(false);
        if (keepPrevious && dataRef.current !== null) setData(dataRef.current);
      });
    return () => ctrl.abort();
  }, [path, tick, keepPrevious]);
  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}

export interface Macros { kcal: number; protein: number; fat: number; carbs: number }
export interface MealItem { description: string; grams: number | null; quantity: number | null; kcal: number }
export interface Meal extends Macros { id: number; name: string; post_gym_shake: number; items: MealItem[] }
export interface DayTargets { kcal: number; protein_min: number; fat_min: number; carbs: number | null }
export interface DayView { date: string; day_type: string; targets: DayTargets; meals: Meal[]; totals: Macros; remaining: Macros }
export interface DaySummary { date: string; day_type: string; meal_count: number; totals: Macros }
export interface WeightEntry { date: string; weight_kg: number }
export interface TrendView { latest: (WeightEntry & { trend_kg: number }) | null; stale: boolean; reason?: string;
  trend: { delta_kg: number; span_days: number; rate_kg_week: number; est_tdee: number | null; uncertain: boolean; intake_days: number } | null;
  weights: WeightEntry[] }
export interface WeekView { days_logged: number; start_date: string; end_date: string; avg_logged: Macros | null; avg_target_kcal: number }
export interface Portion { name: string; grams: number | null; kcal: number | null; protein: number | null; fat: number | null; carbs: number | null }
export interface Product { id: number; name: string; brand: string | null; per_100g: Macros | null; portions: Portion[]; aliases: string[]; notes: string | null; verified: number | boolean; source: string; category: string | null }
export interface RecipeSummary { id: number; name: string; tags: string | null; servings: number | null; kcal_per_serving: number | null; total_minutes: number | null; incomplete?: true }
export interface RecipeIngredient { description: string; grams: number | null; quantity: number | null; kcal?: number; unresolved?: true; reason?: string }
export interface RecipeView { id: number; name: string; instructions: string | null; notes: string | null; tags: string | null; servings: number | null; active_minutes: number | null; total_minutes: number | null; ingredients: RecipeIngredient[]; totals: Macros; totals_incomplete?: true; per_serving: Macros | null }
export interface Weight { date: string; weight_kg: number; trend_kg: number; note: string | null }
export interface ForecastPoint { date: string; kg: number; low: number; high: number }
export interface AccuracyBucket { days: number; n: number; mae_kg: number; bias_kg: number }
export interface Forecast { start: { date: string; weight_kg: number; stale: boolean };
  assumptions: { intake_kcal: number; intake_source: string; tdee_start: number; calibration: string; band_kcal: number };
  curve: ForecastPoint[]; weight_at_target: ForecastPoint | null; weight_at_goal_date: ForecastPoint | null;
  goal: { weight_kg: number; eta: string | null; eta_range: { earliest: string | null; latest: string | null }; reached: boolean; reason?: string } | null; notes: string[] }
export interface ForecastView { forecast: Forecast | null; reason?: string;
  accuracy?: { per_age: AccuracyBucket[] }; ghost?: { snapshot_date: string; curve: ForecastPoint[] } }
export interface Profile { birth_date: string; sex: "man" | "kvinna"; height_cm: number; activity_factor: number; goal_weight_kg: number | null; goal_date: string | null }
export interface Preference { id: number; category: string; content: string }
export interface OverviewView { day: DayView; trend: TrendView; week: WeekView; counts: { products: number; recipes: number } }
export type PlanSlot = "frukost" | "lunch" | "middag" | "mellis";
export interface PlanItem { product_id: number | null; description: string; grams: number | null; quantity: number | null; portion_name: string | null; macros?: Macros; kcal?: number; protein?: number; fat?: number; carbs?: number; unresolved?: true; reason?: string }
export interface PlanMeal extends Macros { id: number; slot: PlanSlot; position: number; name: string; recipe_id: number | null; recipe_servings: number | null; post_gym_shake: boolean; note: string | null; logged: boolean; totals_incomplete?: true; items?: PlanItem[] }
export interface PlanDay { date: string; weekday: string; day_type: string; targets: DayTargets; confirmed: boolean; confirmed_at: string | null; meals: PlanMeal[]; totals: Macros; remaining: { kcal: number; protein_to_min: number; fat_to_min: number; carbs: number | null }; checks: { kcal_ok: boolean; protein_floor_ok: boolean; fat_floor_ok: boolean }; warning?: string }
export interface ShoppingLine { product_id: number | null; description: string; grams: number | null; quantity: number | null; portion_name: string | null }
export interface PlanWeek { start_date: string; end_date: string; days: PlanDay[]; week: { planned_days: number; confirmed_days: number; avg_planned_kcal: number | null; avg_target_kcal: number }; shopping_list: ShoppingLine[] }

export const putJson = <T,>(path: string, body: unknown): Promise<T> =>
  api<T>(path, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
