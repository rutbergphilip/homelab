import { describe, it, expect } from 'vitest';
import {
  scoreTone,
  formatSleepDuration,
  metricSeries,
  numericState,
  seriesAverage,
  seriesDelta,
  freshestWorkout,
} from '../src/hub/health-model';

describe('scoreTone', () => {
  // Oura's own bands, so the wall panel agrees with the ring's app rather than
  // inventing a second opinion: 85+ optimal, 70-84 good, under 70 pay attention.
  it('maps a score to its semantic band', () => {
    expect(scoreTone(92)).toBe('green');
    expect(scoreTone(85)).toBe('green');
    expect(scoreTone(84)).toBe('amber');
    expect(scoreTone(70)).toBe('amber');
    expect(scoreTone(69)).toBe('coral');
    expect(scoreTone(0)).toBe('coral');
  });

  it('is neutral when there is no score, so a missing value never reads as bad', () => {
    expect(scoreTone(null)).toBe('neutral');
    expect(scoreTone(undefined)).toBe('neutral');
    expect(scoreTone(Number.NaN)).toBe('neutral');
  });
});

describe('formatSleepDuration', () => {
  it('renders minutes as hours and minutes', () => {
    expect(formatSleepDuration(507)).toBe('8h 27m');
    expect(formatSleepDuration(479)).toBe('7h 59m');
    expect(formatSleepDuration(60)).toBe('1h 00m');
  });

  it('pads minutes so the number does not jump width between renders', () => {
    expect(formatSleepDuration(485)).toBe('8h 05m');
  });

  it('falls back to a dash rather than showing 0h 00m for missing data', () => {
    expect(formatSleepDuration(null)).toBe('—');
    expect(formatSleepDuration(undefined)).toBe('—');
    expect(formatSleepDuration(0)).toBe('—');
  });
});

describe('numericState', () => {
  it('parses a numeric entity state', () => {
    expect(numericState('79.91')).toBe(79.91);
    expect(numericState('0')).toBe(0);
  });

  it('treats HA absence markers as no value, never as zero', () => {
    expect(numericState('unavailable')).toBeNull();
    expect(numericState('unknown')).toBeNull();
    expect(numericState('')).toBeNull();
    expect(numericState(undefined)).toBeNull();
    expect(numericState('walking')).toBeNull();
  });
});

describe('metricSeries', () => {
  const days = [
    { date: '2026-07-24', sleep_score: 80, oura_steps: 5059 },
    { date: '2026-07-25', sleep_score: 85, oura_steps: 16687 },
    { date: '2026-07-26', sleep_score: 86, oura_steps: 42 },
  ];

  it('extracts one metric as sparkline points in order', () => {
    expect(metricSeries(days, 'sleep_score')).toEqual([
      { date: '2026-07-24', value: 80 },
      { date: '2026-07-25', value: 85 },
      { date: '2026-07-26', value: 86 },
    ]);
  });

  it('skips days missing that metric instead of plotting them as zero', () => {
    // 2026-05-21 and 2026-06-18 have a null sleep_duration_min in the real DB —
    // nap artifacts the backfill declined to store. A zero would draw a cliff.
    const withGap = [
      { date: '2026-07-24', sleep_duration_min: 447 },
      { date: '2026-07-25', sleep_duration_min: null },
      { date: '2026-07-26', sleep_duration_min: 507 },
    ];
    expect(metricSeries(withGap, 'sleep_duration_min')).toEqual([
      { date: '2026-07-24', value: 447 },
      { date: '2026-07-26', value: 507 },
    ]);
  });

  it('survives an unavailable or malformed sensor attribute', () => {
    expect(metricSeries(undefined, 'sleep_score')).toEqual([]);
    expect(metricSeries('unavailable', 'sleep_score')).toEqual([]);
    expect(metricSeries([{ nope: 1 }], 'sleep_score')).toEqual([]);
    expect(metricSeries([{ date: 'x', sleep_score: 'åtta' }], 'sleep_score')).toEqual([]);
  });
});

describe('seriesAverage', () => {
  it('averages the series so a single day can be read against its own baseline', () => {
    expect(
      seriesAverage([
        { date: 'a', value: 80 },
        { date: 'b', value: 90 },
      ]),
    ).toBe(85);
  });

  it('is null for an empty series', () => {
    expect(seriesAverage([])).toBeNull();
  });
});

describe('seriesDelta', () => {
  // The Kropp card must not print the EWMA line's endpoint next to the headline
  // weight: the EWMA legitimately lags (81,1 vs 79,9 on 2026-07-26), and two
  // different weights on one card read as a bug. State the change instead.
  it('reports the change across the series', () => {
    expect(
      seriesDelta([
        { date: 'a', value: 82.3 },
        { date: 'b', value: 81.1 },
      ]),
    ).toBeCloseTo(-1.2, 5);
  });

  it('is null when there is nothing to compare', () => {
    expect(seriesDelta([{ date: 'a', value: 80 }])).toBeNull();
    expect(seriesDelta([])).toBeNull();
  });
});

describe('freshestWorkout', () => {
  const oura = { source: 'Oura', type: 'walking', kcal: 120, minutes: 37, at: '2026-07-26T07:04:15+00:00' };
  const withings = { source: 'Withings', type: 'walk', kcal: 260, minutes: 37, at: '2026-07-25T18:00:00+00:00' };

  it('prefers whichever source reported most recently', () => {
    expect(freshestWorkout(oura, withings)!.source).toBe('Oura');
    expect(freshestWorkout(withings, oura)!.source).toBe('Oura');
  });

  it('falls back to the only source that has data', () => {
    expect(freshestWorkout(oura, null)!.source).toBe('Oura');
    expect(freshestWorkout(null, withings)!.source).toBe('Withings');
    expect(freshestWorkout(null, null)).toBeNull();
  });

  it('ignores an entry with an unparseable timestamp rather than ranking it first', () => {
    const broken = { ...withings, at: 'unavailable' };
    expect(freshestWorkout(broken, oura)!.source).toBe('Oura');
  });
});
