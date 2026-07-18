import { describe, expect, it } from 'vitest';
import { buildPlannerModel, nextMeal, dayTypeLetter } from '../src/hub/planner-model';

const day = (date: string, overrides: Record<string, unknown> = {}) => ({
  date,
  weekday: 'måndag',
  day_type: 'vilodag',
  confirmed: false,
  meals: [],
  total_kcal: 0,
  target_kcal: 2000,
  protein_ok: false,
  kcal_ok: true,
  ...overrides,
});

const meal = (slot: string, name: string, overrides: Record<string, unknown> = {}) => ({
  slot,
  name,
  kcal: 500,
  protein: 40,
  fat: 15,
  carbs: 45,
  logged: false,
  ...overrides,
});

describe('buildPlannerModel', () => {
  it('parses a valid payload and counts confirmed days', () => {
    const model = buildPlannerModel({
      week_start: '2026-07-13',
      today: '2026-07-15',
      days: [
        day('2026-07-13', { confirmed: true }),
        day('2026-07-14'),
        day('2026-07-15', { meals: [meal('middag', 'Lax')] }),
      ],
    });
    expect(model).not.toBeNull();
    expect(model!.weekStart).toBe('2026-07-13');
    expect(model!.today).toBe('2026-07-15');
    expect(model!.confirmedDays).toBe(1);
    expect(model!.days[2].meals[0].name).toBe('Lax');
  });

  it('rejects malformed payloads', () => {
    expect(buildPlannerModel(undefined)).toBeNull();
    expect(buildPlannerModel({})).toBeNull();
    expect(buildPlannerModel({ week_start: 'nyss', days: [] })).toBeNull();
    expect(buildPlannerModel({ week_start: '2026-07-13', days: 'nej' })).toBeNull();
    expect(buildPlannerModel({ week_start: '2026-07-13', days: [{ date: 'trasig' }] })).toBeNull();
  });

  it('drops broken meals but keeps the day', () => {
    const model = buildPlannerModel({
      week_start: '2026-07-13',
      today: '2026-07-13',
      days: [day('2026-07-13', { meals: [meal('middag', 'Hel'), { slot: 'brunch', name: 'Fel' }, null] })],
    });
    expect(model!.days[0].meals).toHaveLength(1);
  });
});

describe('nextMeal', () => {
  it('returns the first unlogged meal today in slot order', () => {
    const model = buildPlannerModel({
      week_start: '2026-07-13',
      today: '2026-07-13',
      days: [
        day('2026-07-13', {
          meals: [
            meal('middag', 'Lax'),
            meal('frukost', 'Gröt', { logged: true }),
            meal('lunch', 'Sallad'),
          ],
        }),
      ],
    })!;
    expect(nextMeal(model)!.meal.name).toBe('Sallad');
  });

  it('returns null when everything is logged or today is missing', () => {
    const allLogged = buildPlannerModel({
      week_start: '2026-07-13',
      today: '2026-07-13',
      days: [day('2026-07-13', { meals: [meal('middag', 'Lax', { logged: true })] })],
    })!;
    expect(nextMeal(allLogged)).toBeNull();

    const otherWeek = buildPlannerModel({
      week_start: '2026-07-13',
      today: '2026-07-20',
      days: [day('2026-07-13', { meals: [meal('middag', 'Lax')] })],
    })!;
    expect(nextMeal(otherWeek)).toBeNull();
  });
});

describe('dayTypeLetter', () => {
  it('maps the three day types and falls back to a dot', () => {
    expect(dayTypeLetter('gymdag')).toBe('G');
    expect(dayTypeLetter('vilodag')).toBe('V');
    expect(dayTypeLetter('flexdag')).toBe('F');
    expect(dayTypeLetter('festdag')).toBe('·');
  });
});
