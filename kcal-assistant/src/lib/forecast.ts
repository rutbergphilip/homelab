import { toEpochDays, addDays } from "./dates";
import { computeTrendWeight } from "./trend";

// Forward weight simulation ("riktig formel"):
//   BMR (Mifflin-St Jeor) is recomputed every simulated day on the simulated
//   weight, TDEE = BMR × activity factor + a constant calibration offset
//   against the measured backwards-TDEE (lib/trend.ts) when that is reliable.
//   Daily Euler step: w −= (TDEE(w) − intake) / 7700.
// The curve therefore flattens naturally as weight drops. A ±band re-run
// (data-driven error budget, computeBand) gives an honest low/high envelope
// instead of fake precision.

export interface ForecastProfile {
  birth_date: string;
  sex: "man" | "kvinna";
  height_cm: number;
  activity_factor: number;
  goal_weight_kg: number | null;
  goal_date: string | null;
}

export interface ForecastWeightEntry {
  date: string;
  weight_kg: number;
}

export interface ForecastInput {
  profile: ForecastProfile;
  weights: ForecastWeightEntry[];
  intake_kcal: number;
  intake_source: "targets" | "recent" | "explicit";
  measured_tdee: number | null;
  today: string;
  target_date?: string;
  goal_weight_override?: number;
  horizon_days?: number;
  calibration_activity_factor?: number; // activity factor the measured TDEE was observed under; defaults to profile.activity_factor
}

export interface ForecastPoint {
  date: string;
  kg: number;
  low: number;
  high: number;
}

export interface ForecastResult {
  start: { date: string; weight_kg: number; stale: boolean };
  assumptions: {
    intake_kcal: number;
    intake_source: "targets" | "recent" | "explicit";
    tdee_start: number;
    calibration: "mätdata" | "formel";
    calibration_offset: number;
    kcal_per_kg: number;
    band_kcal: number;
  };
  curve: ForecastPoint[];
  weight_at_target: ForecastPoint | null;
  weight_at_goal_date: ForecastPoint | null;
  goal: {
    weight_kg: number;
    eta: string | null;
    eta_range: { earliest: string | null; latest: string | null };
    reached: boolean;
    reason?: string;
  } | null;
  notes: string[];
}

const KCAL_PER_KG = 7700;
const OFFSET_CLAMP = 500;
const FLOOR_KG = 40;

// Error budget for the uncertainty band: named kcal contributions summed and
// clamped. The single place a future empirical calibration (from
// forecast_snapshots history) would slot in.
const BAND_MIN = 125;
const BAND_MAX = 400;

export interface BandInput {
  calibration: "mätdata" | "formel";
  intake_source: "targets" | "recent" | "explicit";
  weighins_last_28d: number;
}

export function computeBand(input: BandInput): { kcal: number; reasons: string[] } {
  let kcal = 100;
  const reasons: string[] = ["grundosäkerhet"];
  if (input.calibration === "mätdata") {
    kcal += 50;
    reasons.push("mätdatakalibrerad");
  } else {
    kcal += 200;
    reasons.push("formelkalibrering (ingen tillförlitlig mätdata)");
  }
  if (input.intake_source === "recent") {
    kcal += 25;
    reasons.push("intag från uppmätt beteende");
  } else {
    kcal += 75;
    reasons.push("intag antar framtida följsamhet");
  }
  if (input.weighins_last_28d < 10) {
    kcal += 50;
    reasons.push("glesa vägningar (<10 på 28 d)");
  }
  return { kcal: Math.min(BAND_MAX, Math.max(BAND_MIN, kcal)), reasons };
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

function ageAt(birthDate: string, date: string): number {
  return Math.floor((toEpochDays(date) - toEpochDays(birthDate)) / 365.25);
}

function bmr(profile: ForecastProfile, weightKg: number, date: string): number {
  const base = 10 * weightKg + 6.25 * profile.height_cm - 5 * ageAt(profile.birth_date, date);
  return base + (profile.sex === "man" ? 5 : -161);
}

function simulate(
  profile: ForecastProfile,
  startDate: string,
  startKg: number,
  intake: number,
  offset: number,
  horizonEnd: string,
): Array<{ date: string; kg: number }> {
  const points = [{ date: startDate, kg: startKg }];
  let w = startKg;
  let date = startDate;
  const end = toEpochDays(horizonEnd);
  while (toEpochDays(date) < end) {
    const tdee = bmr(profile, w, date) * profile.activity_factor + offset;
    w -= (tdee - intake) / KCAL_PER_KG;
    date = addDays(date, 1);
    if (w < FLOOR_KG) break;
    points.push({ date, kg: w });
  }
  return points;
}

export function computeForecast(input: ForecastInput): ForecastResult {
  const notes: string[] = [];
  const sorted = [...input.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = sorted.at(-1);
  if (!latest) throw new Error("inga viktloggar");

  const horizonDays = input.horizon_days ?? 365;
  const horizonEnd = addDays(input.today, horizonDays);

  // Start = EWMA trend weight at the latest weigh-in (lib/trend.ts); the
  // simulation still starts at the latest weigh-in DATE so a stale log gets
  // its elapsed days simulated too.
  const startKg = computeTrendWeight(sorted).at(-1)!.trend_kg;
  const stale = toEpochDays(input.today) - toEpochDays(latest.date) > 7;
  if (stale) notes.push("senaste vägningen är över en vecka gammal");

  const formulaTdeeStart = bmr(input.profile, startKg, latest.date) * input.profile.activity_factor;
  // Calibration is anchored to the activity factor the measured TDEE was
  // observed under — otherwise an activity what-if cancels out of the offset.
  const calibrationTdee =
    bmr(input.profile, startKg, latest.date) * (input.calibration_activity_factor ?? input.profile.activity_factor);
  let offset = 0;
  let calibration: "mätdata" | "formel" = "formel";
  if (input.measured_tdee !== null) {
    const raw = input.measured_tdee - calibrationTdee;
    offset = Math.max(-OFFSET_CLAMP, Math.min(OFFSET_CLAMP, raw));
    calibration = "mätdata";
    if (Math.abs(raw) > OFFSET_CLAMP) notes.push("kalibreringen begränsades till ±500 kcal");
  }
  const tdeeStart = formulaTdeeStart + offset;

  const weighinsLast28 = sorted.filter(
    (w) => toEpochDays(latest.date) - toEpochDays(w.date) <= 27,
  ).length;
  const band = computeBand({
    calibration,
    intake_source: input.intake_source,
    weighins_last_28d: weighinsLast28,
  });
  notes.push(`osäkerhet ±${band.kcal} kcal/dag: ${band.reasons.join(", ")}`);

  const main = simulate(input.profile, latest.date, startKg, input.intake_kcal, offset, horizonEnd);
  const lowSim = simulate(input.profile, latest.date, startKg, input.intake_kcal - band.kcal, offset, horizonEnd);
  const highSim = simulate(input.profile, latest.date, startKg, input.intake_kcal + band.kcal, offset, horizonEnd);
  if (main.at(-1)!.date !== horizonEnd) notes.push("kurvan stoppades vid 40 kg (orimliga antaganden)");

  const curve: ForecastPoint[] = main.map((p, i) => ({
    date: p.date,
    kg: round2(p.kg),
    low: round2((lowSim[i] ?? lowSim.at(-1)!).kg),
    high: round2((highSim[i] ?? highSim.at(-1)!).kg),
  }));
  const byDate = new Map(curve.map((p) => [p.date, p]));

  let weightAtTarget: ForecastPoint | null = null;
  if (input.target_date !== undefined) {
    if (toEpochDays(input.target_date) <= toEpochDays(input.today)) {
      throw new Error(`target_date ${input.target_date} har redan passerat`);
    }
    let t = input.target_date;
    if (toEpochDays(t) > toEpochDays(horizonEnd)) {
      t = horizonEnd;
      notes.push(`target_date ligger bortom horisonten och klipptes till ${horizonEnd}`);
    }
    weightAtTarget = byDate.get(t) ?? null;
  }

  let weightAtGoalDate: ForecastPoint | null = null;
  if (input.profile.goal_date !== null) {
    if (toEpochDays(input.profile.goal_date) <= toEpochDays(input.today)) {
      notes.push("goal_date har passerat och ignorerades");
    } else {
      weightAtGoalDate = byDate.get(input.profile.goal_date) ?? null;
      if (!weightAtGoalDate) notes.push("goal_date ligger bortom horisonten");
    }
  }

  // Goal ETA: direction of travel comes from the energy balance, not from the
  // goal's position — so an overshoot or a surplus reads as "moving away".
  const losing = input.intake_kcal < tdeeStart;
  const goalWeight = input.goal_weight_override ?? input.profile.goal_weight_kg;
  let goal: ForecastResult["goal"] = null;
  if (goalWeight !== null && goalWeight !== undefined) {
    const delta = goalWeight - startKg;
    if (Math.abs(delta) < 0.05) {
      goal = { weight_kg: goalWeight, eta: null, eta_range: { earliest: null, latest: null }, reached: true };
    } else {
      const movingToward = delta < 0 ? losing : !losing;
      const hit = (kg: number): boolean => (delta < 0 ? kg <= goalWeight : kg >= goalWeight);
      const eta = movingToward ? (curve.find((p) => hit(p.kg))?.date ?? null) : null;
      const etaOn = (pts: Array<{ date: string; kg: number }>): string | null =>
        movingToward ? (pts.find((p) => hit(p.kg))?.date ?? null) : null;
      const etaLow = etaOn(lowSim);
      const etaHigh = etaOn(highSim);
      const eta_range =
        etaLow !== null && etaHigh !== null
          ? etaLow <= etaHigh
            ? { earliest: etaLow, latest: etaHigh }
            : { earliest: etaHigh, latest: etaLow }
          : { earliest: etaLow ?? etaHigh, latest: null };
      goal = {
        weight_kg: goalWeight,
        eta,
        eta_range,
        reached: false,
        ...(eta === null && {
          reason: movingToward
            ? `nås inte inom ${horizonDays} dagar med nuvarande intag`
            : "med nuvarande intag rör sig vikten bort från målet",
        }),
      };
    }
  }

  return {
    start: {
      date: latest.date,
      weight_kg: round2(startKg),
      stale,
    },
    assumptions: {
      intake_kcal: input.intake_kcal,
      intake_source: input.intake_source,
      tdee_start: Math.round(tdeeStart / 10) * 10,
      calibration,
      calibration_offset: Math.round(offset),
      kcal_per_kg: KCAL_PER_KG,
      band_kcal: band.kcal,
    },
    curve,
    weight_at_target: weightAtTarget,
    weight_at_goal_date: weightAtGoalDate,
    goal,
    notes,
  };
}
