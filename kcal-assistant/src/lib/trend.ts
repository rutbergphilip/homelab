import { toEpochDays, epochDaysToDate, todayStockholm } from "./dates";

// Backwards-computed TDEE from weight change + logged intake:
//   TDEE = snittintag + (viktförändring kg × 7700 ÷ antal dagar)
// Weights are noisy (water, woosh), so both endpoints are means over the
// first/second half of the window, and intake is averaged over exactly the
// span between those two mean dates — never over days outside the delta.

export interface WeightEntry {
  date: string;
  weight_kg: number;
}

export interface Trend {
  delta_kg: number; // positive = loss
  span_days: number;
  rate_kg_week: number;
  avg_intake: number | null;
  intake_days: number;
  span_total_days: number;
  est_tdee: number | null;
  uncertain: boolean; // < 50% of span days have logged intake
}

export interface TrendResult {
  latest: WeightEntry | null;
  window_days: number;
  stale: boolean; // latest weighing older than 7 days
  trend: Trend | null;
  reason?: string;
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

export function computeTrend(input: {
  weights: WeightEntry[];
  intakeByDate: Map<string, number>;
  windowDays?: number;
  today?: string;
}): TrendResult {
  const windowDays = input.windowDays ?? 28;
  const sorted = [...input.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = sorted.at(-1) ?? null;
  if (!latest) {
    return { latest: null, window_days: windowDays, stale: false, trend: null, reason: "inga viktloggar" };
  }

  const today = input.today ?? todayStockholm();
  const stale = toEpochDays(today) - toEpochDays(latest.date) > 7;

  const latestEpoch = toEpochDays(latest.date);
  const windowStart = latestEpoch - (windowDays - 1);
  const midpoint = windowStart + windowDays / 2;
  const inWindow = sorted.filter((w) => toEpochDays(w.date) >= windowStart);
  const firstHalf = inWindow.filter((w) => toEpochDays(w.date) < midpoint);
  const secondHalf = inWindow.filter((w) => toEpochDays(w.date) >= midpoint);

  const base = { latest, window_days: windowDays, stale };
  if (firstHalf.length < 2 || secondHalf.length < 2) {
    return { ...base, trend: null, reason: "för få viktloggar i fönstret (minst 2 i varje halva behövs)" };
  }

  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const anchorWeight = mean(firstHalf.map((w) => w.weight_kg));
  const endWeight = mean(secondHalf.map((w) => w.weight_kg));
  const anchorDate = mean(firstHalf.map((w) => toEpochDays(w.date)));
  const endDate = mean(secondHalf.map((w) => toEpochDays(w.date)));
  const span = endDate - anchorDate;
  if (span < 7) {
    return { ...base, trend: null, reason: "för kort mätspann mellan vägningsgrupperna" };
  }

  const delta = anchorWeight - endWeight; // positive = loss

  // Intake over exactly the delta span (integer days between the mean dates).
  const spanStart = Math.ceil(anchorDate);
  const spanEnd = Math.floor(endDate);
  const spanTotalDays = spanEnd - spanStart + 1;
  let intakeSum = 0;
  let intakeDays = 0;
  for (let epoch = spanStart; epoch <= spanEnd; epoch++) {
    const kcal = input.intakeByDate.get(epochDaysToDate(epoch));
    if (kcal !== undefined) {
      intakeSum += kcal;
      intakeDays++;
    }
  }
  const avgIntake = intakeDays > 0 ? Math.round(intakeSum / intakeDays) : null;
  const estTdee =
    avgIntake === null ? null : Math.round((avgIntake + (delta * 7700) / span) / 10) * 10;

  return {
    ...base,
    trend: {
      delta_kg: round2(delta),
      span_days: round2(span),
      rate_kg_week: round2((delta / span) * 7),
      avg_intake: avgIntake,
      intake_days: intakeDays,
      span_total_days: spanTotalDays,
      est_tdee: estTdee,
      uncertain: intakeDays / spanTotalDays < 0.5,
    },
  };
}
