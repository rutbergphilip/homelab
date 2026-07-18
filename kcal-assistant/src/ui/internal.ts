import type { Database } from "bun:sqlite";
import { readDay } from "../db/meals";
import { getPlanWeek } from "../db/plan";
import { todayStockholm } from "../lib/dates";
import { getTrend, listWeights } from "../db/weights";
import { buildForecast } from "../db/forecast";
import { getProfile } from "../db/profile";

export interface InternalSummaryMeal {
  name: string;
  kcal: number;
}

export interface InternalSummaryWeightPoint {
  date: string;
  kg: number;
}

export interface InternalSummaryForecast {
  goal_kg: number;
  eta: string | null;
  eta_early: string | null;
  eta_late: string | null;
  on_track: boolean;
}

export interface InternalSummary {
  status: "ok";
  date: string;
  kcal: number;
  kcal_target: number;
  protein_g: number;
  protein_target_g: number;
  meals: InternalSummaryMeal[];
  current_kg: number;
  weight_trend: InternalSummaryWeightPoint[];
  forecast: InternalSummaryForecast | null;
}

const r1 = (x: number): number => Math.round(x * 10) / 10;

export interface InternalPlannerDay {
  date: string;
  weekday: string;
  day_type: string;
  confirmed: boolean;
  meals: Array<{
    slot: string;
    name: string;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    logged: boolean;
  }>;
  total_kcal: number;
  target_kcal: number;
  protein_ok: boolean;
  kcal_ok: boolean;
}

export interface InternalPlanner {
  status: "ok";
  week_start: string;
  today: string;
  confirmed_days: number;
  days: InternalPlannerDay[];
}

// Read-only week-plan projection for the wall-hub planner page (no auth —
// cluster-only listener, see server.ts). Same read functions as the UI.
export function buildInternalPlanner(db: Database): InternalPlanner {
  const week = getPlanWeek(db);
  return {
    status: "ok",
    week_start: week.start_date,
    today: todayStockholm(),
    confirmed_days: week.week.confirmed_days,
    days: week.days.map((d) => ({
      date: d.date,
      weekday: d.weekday,
      day_type: d.day_type,
      confirmed: d.confirmed,
      meals: d.meals.map((m) => ({
        slot: m.slot,
        name: m.name,
        kcal: Math.round(m.kcal),
        protein: r1(m.protein),
        fat: r1(m.fat),
        carbs: r1(m.carbs),
        logged: m.logged,
      })),
      total_kcal: Math.round(d.totals.kcal),
      target_kcal: Math.round(d.targets.kcal),
      protein_ok: d.checks.protein_floor_ok,
      kcal_ok: d.checks.kcal_ok,
    })),
  };
}

// Read-only projection for the in-cluster wall-hub poller (no auth — see
// server.ts). Reuses the same read functions as ui/api.ts's overview/forecast
// cases; never throws — a forecast failure (no profile, no weights, no goal)
// degrades to forecast: null rather than a 500.
export function buildInternalSummary(db: Database): InternalSummary {
  const day = readDay(db);
  const trend = getTrend(db, 28);

  let forecast: InternalSummaryForecast | null = null;
  try {
    const goal = buildForecast(db, { intake_source: "targets" }).forecast?.goal;
    if (goal) {
      // on_track respects an explicit goal_date deadline: an ETA past the
      // deadline is not "on track" even though the goal is still reachable.
      const goalDate = getProfile(db)?.goal_date ?? null;
      const onTrack = goal.reached
        ? true
        : goal.eta === null
          ? false
          : goalDate === null
            ? true
            : goal.eta <= goalDate;
      forecast = {
        goal_kg: goal.weight_kg,
        eta: goal.eta,
        eta_early: goal.eta_range.earliest,
        eta_late: goal.eta_range.latest,
        on_track: onTrack,
      };
    }
  } catch (e) {
    console.error("internal summary forecast:", e instanceof Error ? e.message : e);
  }

  // weight_trend follows the product's own trend concept (the Vikt page
  // draws the EWMA line; raw weigh-ins are only dots) — trend_kg per date,
  // falling back to the raw value for a date the trend map somehow misses.
  const trendByDate = new Map(listWeights(db).map((w) => [w.date, w.trend_kg]));

  return {
    status: "ok",
    date: day.date,
    kcal: Math.round(day.totals.kcal),
    kcal_target: Math.round(day.targets.kcal),
    protein_g: r1(day.totals.protein),
    protein_target_g: r1(day.targets.protein_min),
    meals: day.meals.map((m) => ({ name: m.name, kcal: Math.round(m.kcal) })),
    current_kg: trend.latest ? r1(trend.latest.weight_kg) : 0,
    weight_trend: trend.weights.map((w) => ({ date: w.date, kg: r1(trendByDate.get(w.date) ?? w.weight_kg) })),
    forecast,
  };
}
