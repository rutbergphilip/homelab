// Transforms the kcal-veckoplan REST sensor (kcal-assistant /internal/planner)
// into the shape the Vecka page and the Hem chip render. The sensor exposes
// `week_start` / `today` / `days`; day/meal shapes mirror InternalPlannerDay
// on the server. Malformed or unavailable data → null (page shows offline).

export type PlannerSlot = 'frukost' | 'lunch' | 'middag' | 'mellis';

export interface PlannerMeal {
  slot: PlannerSlot;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  logged: boolean;
}

export interface PlannerDay {
  date: string;
  weekday: string;
  day_type: string;
  confirmed: boolean;
  meals: PlannerMeal[];
  total_kcal: number;
  target_kcal: number;
  protein_ok: boolean;
  kcal_ok: boolean;
}

export interface PlannerModel {
  weekStart: string;
  today: string;
  confirmedDays: number;
  days: PlannerDay[];
}

export const SLOT_LABELS: Record<PlannerSlot, string> = {
  frukost: 'Frukost',
  lunch: 'Lunch',
  middag: 'Middag',
  mellis: 'Mellis',
};

export const SLOT_ORDER: readonly PlannerSlot[] = ['frukost', 'lunch', 'middag', 'mellis'];

const DAY_TYPE_LETTER: Record<string, string> = { gymdag: 'G', vilodag: 'V', flexdag: 'F' };

export function dayTypeLetter(dayType: string): string {
  return DAY_TYPE_LETTER[dayType] ?? '·';
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isSlot(value: unknown): value is PlannerSlot {
  return value === 'frukost' || value === 'lunch' || value === 'middag' || value === 'mellis';
}

function parseMeal(raw: unknown): PlannerMeal | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (!isSlot(m.slot) || typeof m.name !== 'string' || m.name === '') return null;
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    slot: m.slot,
    name: m.name,
    kcal: num(m.kcal),
    protein: num(m.protein),
    fat: num(m.fat),
    carbs: num(m.carbs),
    logged: m.logged === true,
  };
}

function parseDay(raw: unknown): PlannerDay | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.date !== 'string' || !DATE_RE.test(d.date)) return null;
  const meals = Array.isArray(d.meals)
    ? d.meals.map(parseMeal).filter((m): m is PlannerMeal => m !== null)
    : [];
  return {
    date: d.date,
    weekday: typeof d.weekday === 'string' ? d.weekday : '',
    day_type: typeof d.day_type === 'string' ? d.day_type : 'vilodag',
    confirmed: d.confirmed === true,
    meals,
    total_kcal: typeof d.total_kcal === 'number' ? d.total_kcal : 0,
    target_kcal: typeof d.target_kcal === 'number' ? d.target_kcal : 0,
    protein_ok: d.protein_ok === true,
    kcal_ok: d.kcal_ok !== false,
  };
}

export function buildPlannerModel(attributes: Record<string, unknown> | undefined): PlannerModel | null {
  if (!attributes) return null;
  const { week_start, today, days } = attributes;
  if (typeof week_start !== 'string' || !DATE_RE.test(week_start)) return null;
  if (!Array.isArray(days)) return null;
  const parsed = days.map(parseDay).filter((d): d is PlannerDay => d !== null);
  if (parsed.length === 0) return null;
  return {
    weekStart: week_start,
    today: typeof today === 'string' && DATE_RE.test(today) ? today : week_start,
    confirmedDays: parsed.filter((d) => d.confirmed).length,
    days: parsed,
  };
}

/** The Hem chip: today's first unlogged planned meal, or null (chip hidden). */
export function nextMeal(model: PlannerModel): { day: PlannerDay; meal: PlannerMeal } | null {
  const day = model.days.find((d) => d.date === model.today);
  if (!day) return null;
  for (const slot of SLOT_ORDER) {
    const meal = day.meals.find((m) => m.slot === slot && !m.logged);
    if (meal) return { day, meal };
  }
  return null;
}

function addDaysIso(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export interface UpcomingMeals {
  dayLabel: 'Idag' | 'Imorgon';
  day: PlannerDay;
  meals: PlannerMeal[]; // slot order, unlogged only
}

/**
 * The Hem card's content: today's unlogged planned meals, else tomorrow's
 * (when it exists in the payload — Sunday evening's "tomorrow" is next week
 * and simply yields null). Meals come back in slot order.
 */
export function upcomingMeals(model: PlannerModel): UpcomingMeals | null {
  const inSlotOrder = (day: PlannerDay): PlannerMeal[] =>
    SLOT_ORDER.flatMap((slot) => day.meals.filter((m) => m.slot === slot && !m.logged));

  const today = model.days.find((d) => d.date === model.today);
  if (today) {
    const meals = inSlotOrder(today);
    if (meals.length > 0) return { dayLabel: 'Idag', day: today, meals };
  }
  const tomorrow = model.days.find((d) => d.date === addDaysIso(model.today, 1));
  if (tomorrow) {
    const meals = inSlotOrder(tomorrow);
    if (meals.length > 0) return { dayLabel: 'Imorgon', day: tomorrow, meals };
  }
  return null;
}
