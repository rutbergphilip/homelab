import type { Database } from "bun:sqlite";
import { readDay } from "../db/meals";
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
