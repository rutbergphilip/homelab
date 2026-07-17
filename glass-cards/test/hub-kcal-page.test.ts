import { describe, it, expect } from 'vitest';
import { formatShortDate, forecastLine, trendDaySpan } from '../src/hub/pages/hub-kcal-page';

describe('formatShortDate', () => {
  it('formats an ISO date as Swedish short, without a trailing dot', () => {
    expect(formatShortDate('2026-09-29')).toBe('29 sep');
    expect(formatShortDate('2026-11-02')).toBe('2 nov');
  });

  it('keeps months that have no abbreviation dot intact', () => {
    expect(formatShortDate('2026-05-04')).toBe('4 maj');
  });

  it('is timezone-stable at the date boundary', () => {
    // Parsed as UTC + formatted as UTC → never drifts to the previous day.
    expect(formatShortDate('2026-01-01')).toBe('1 jan');
  });

  it('returns empty for missing or invalid input', () => {
    expect(formatShortDate('')).toBe('');
    expect(formatShortDate('not-a-date')).toBe('');
  });
});

describe('forecastLine', () => {
  it('builds the full goal + ETA + range line', () => {
    expect(
      forecastLine({
        goal_kg: 71,
        eta: '2026-09-29',
        eta_early: '2026-09-11',
        eta_late: '2026-11-02',
        on_track: true,
      }),
    ).toBe('Mål 71 kg · ETA 29 sep (11 sep–2 nov)');
  });

  it('drops the range when the early/late bounds are missing', () => {
    expect(forecastLine({ goal_kg: 71, eta: '2026-09-29' })).toBe('Mål 71 kg · ETA 29 sep');
  });

  it('shows only the goal when there is no ETA', () => {
    expect(forecastLine({ goal_kg: 78 })).toBe('Mål 78 kg');
  });

  it('returns empty when there is nothing to say', () => {
    expect(forecastLine({})).toBe('');
  });
});

describe('trendDaySpan', () => {
  it('measures elapsed calendar days, not the number of points', () => {
    // 3 weigh-ins, but ~27 days elapsed — count and span diverge on purpose.
    const points = [{ date: '2026-06-20' }, { date: '2026-07-01' }, { date: '2026-07-17' }];
    expect(points.length).toBe(3);
    expect(trendDaySpan(points)).toBe(27);
  });

  it('spans a full 28-point daily series as 27 days', () => {
    const points = Array.from({ length: 28 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 5, 19) + i * 86_400_000).toISOString().slice(0, 10),
    }));
    expect(trendDaySpan(points)).toBe(27);
  });

  it('is 0 for two points on the same day', () => {
    expect(trendDaySpan([{ date: '2026-07-17' }, { date: '2026-07-17' }])).toBe(0);
  });

  it('returns null for 0- or 1-point series and unparseable dates', () => {
    expect(trendDaySpan([])).toBeNull();
    expect(trendDaySpan([{ date: '2026-07-17' }])).toBeNull();
    expect(trendDaySpan([{ date: 'nope' }, { date: '2026-07-17' }])).toBeNull();
  });
});
