import type { Database } from "bun:sqlite";
import { computeForecast, type ForecastResult } from "../lib/forecast";
import { computeTrendWeight } from "../lib/trend";
import { computeForecastAccuracy, pickGhost, type AccuracyBucket } from "../lib/accuracy";
import { getProfile } from "./profile";
import { getTrend } from "./weights";
import { getTargetsFor } from "./preferences";
import { todayStockholm, addDays } from "../lib/dates";
import { saveSnapshot, listSnapshots } from "./snapshots";

export type IntakeSource = "targets" | "recent";

export interface ForecastView {
  forecast: ForecastResult | null;
  reason?: string;
  accuracy?: { per_age: AccuracyBucket[] };
  ghost?: { snapshot_date: string; curve: ForecastResult["curve"] };
}

// Resolves the daily intake assumption:
//   targets — day targets weighted by the observed day-type mix (28 days)
//   recent  — actual logged average (28 days), falling back to targets
// An explicit intake_kcal in buildForecast bypasses this entirely.
function resolveIntake(
  db: Database,
  source: IntakeSource,
  today: string,
): { kcal: number; source: "targets" | "recent"; notes: string[] } {
  const notes: string[] = [];
  const since = addDays(today, -27);

  if (source === "recent") {
    const row = db
      .query<{ avg_kcal: number | null; n: number }, [string, string]>(
        `SELECT AVG(day_kcal) AS avg_kcal, COUNT(*) AS n FROM (
           SELECT m.day_date, SUM(mi.kcal) AS day_kcal
           FROM meals m JOIN meal_items mi ON mi.meal_id = m.id
           WHERE m.day_date >= ? AND m.day_date <= ?
           GROUP BY m.day_date)`,
      )
      .get(since, today)!;
    if (row.n > 0 && row.avg_kcal !== null) {
      return { kcal: Math.round(row.avg_kcal), source: "recent", notes };
    }
    notes.push("ingen intagsdata senaste 28 dagarna — planmålen användes i stället");
  }

  const mix = db
    .query<{ day_type: string; n: number }, [string, string]>(
      "SELECT day_type, COUNT(*) AS n FROM days WHERE date >= ? AND date <= ? GROUP BY day_type",
    )
    .all(since, today);
  const total = mix.reduce((s, r) => s + r.n, 0);
  if (total < 7) {
    notes.push("för få loggade dagar för dagstypsmix — vilodagsmålet användes");
    return { kcal: getTargetsFor(db, "vilodag").kcal, source: "targets", notes };
  }
  const weighted = mix.reduce((s, r) => s + getTargetsFor(db, r.day_type).kcal * r.n, 0) / total;
  return { kcal: Math.round(weighted), source: "targets", notes };
}

export function buildForecast(
  db: Database,
  opts: {
    target_date?: string;
    goal_weight?: number;
    intake_kcal?: number;
    intake_source?: IntakeSource;
    today?: string;
    activity_factor?: number;
    goal_date?: string | null;
  } = {},
): ForecastView {
  const profile = getProfile(db);
  if (!profile) return { forecast: null, reason: "ingen profil — sätt via set_profile i chatten" };

  // Preview overrides: applied on top of the stored profile, never persisted.
  const effectiveProfile = {
    ...profile,
    ...(opts.activity_factor !== undefined && { activity_factor: opts.activity_factor }),
    ...(opts.goal_date !== undefined && { goal_date: opts.goal_date }),
  };

  const weights = db
    .query<{ date: string; weight_kg: number }, []>(
      "SELECT date, weight_kg FROM weights ORDER BY date",
    )
    .all();
  if (weights.length === 0) return { forecast: null, reason: "inga viktloggar ännu" };

  const today = opts.today ?? todayStockholm();
  const resolved =
    opts.intake_kcal !== undefined
      ? { kcal: opts.intake_kcal, source: "explicit" as const, notes: [] }
      : resolveIntake(db, opts.intake_source ?? "targets", today);

  const trend = getTrend(db, 28);
  const measured = trend.trend && !trend.trend.uncertain ? trend.trend.est_tdee : null;

  const forecast = computeForecast({
    profile: effectiveProfile,
    weights,
    intake_kcal: resolved.kcal,
    intake_source: resolved.source,
    measured_tdee: measured,
    today,
    target_date: opts.target_date,
    goal_weight_override: opts.goal_weight,
    calibration_activity_factor: profile.activity_factor,
  });
  forecast.notes.unshift(...resolved.notes);
  // Preview/persist disclosure: under measured calibration, the preview
  // anchors the offset to the STORED activity factor — but after saving a
  // new factor the canonical forecast re-anchors to it, absorbing most of
  // the what-if effect. Say so instead of letting the chart "jump" on save.
  if (
    opts.activity_factor !== undefined &&
    opts.activity_factor !== profile.activity_factor &&
    measured !== null
  ) {
    forecast.notes.push(
      "kalibrerad mot mätdata — den sparade prognosen påverkas mindre av ändrad aktivitetsfaktor",
    );
  }

  // Canonical (no what-ifs, plan-based intake) forecasts are snapshotted for
  // accuracy tracking — best-effort: a snapshot failure must never break the
  // forecast (or a log_weight that triggered it).
  const canonical =
    opts.target_date === undefined &&
    opts.goal_weight === undefined &&
    opts.intake_kcal === undefined &&
    opts.activity_factor === undefined &&
    opts.goal_date === undefined &&
    (opts.intake_source ?? "targets") === "targets";
  if (canonical) {
    try {
      saveSnapshot(db, forecast, today);
    } catch (e) {
      console.error("snapshot:", e instanceof Error ? e.message : e);
    }
  }

  // Accuracy + ghost ride on every response (previews too — same read cost),
  // omitted entirely when no snapshot has aged enough — or, same best-effort
  // contract as the save above, when the read itself fails.
  return { forecast, ...readAccuracyAndGhost(db, weights, today) };
}

function readAccuracyAndGhost(
  db: Database,
  weights: Array<{ date: string; weight_kg: number }>,
  today: string,
): Pick<ForecastView, "accuracy" | "ghost"> {
  try {
    const snapshots = listSnapshots(db);
    const accuracy = computeForecastAccuracy({ snapshots, trendWeights: computeTrendWeight(weights), today });
    const ghostSnap = pickGhost(snapshots, today);
    return {
      ...(accuracy !== null && { accuracy }),
      ...(ghostSnap !== null && { ghost: { snapshot_date: ghostSnap.date, curve: ghostSnap.curve } }),
    };
  } catch (e) {
    console.error("snapshot:", e instanceof Error ? e.message : e);
    return {};
  }
}
