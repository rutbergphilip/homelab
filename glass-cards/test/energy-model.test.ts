import { describe, it, expect } from 'vitest';
import { buildEnergyModel, next12Hours } from '../src/hub/energy-model';
import fixture from './fixtures/tibber-price.json';

// A "now" pinned to an hour boundary that exists in the fixture (today = 2026-07-16,
// +02:00). At 15:00 the current hour is today[15] (0.8283 SEK/kWh).
const NOW = new Date('2026-07-16T15:00:00.000+02:00');

// The fixture stores prices in SEK/kWh; the model exposes öre (×100).
const attrs = fixture.attributes as Record<string, unknown>;
const state = String(fixture.state);

describe('buildEnergyModel', () => {
  const m = buildEnergyModel(attrs, state, NOW);

  it('parses the current hour price in öre', () => {
    expect(m.now).not.toBeNull();
    expect(m.now!.ore).toBeCloseTo(82.83, 2); // today[15].total 0.8283 × 100
    expect(Math.round(m.now!.ore)).toBe(83);
  });

  it('anchors the current hour to the matching series entry', () => {
    expect(m.now!.start.getTime()).toBe(
      new Date('2026-07-16T15:00:00.000+02:00').getTime(),
    );
  });

  it('has 24 hours today', () => {
    expect(m.today.length).toBe(24);
    expect(m.today[0].ore).toBeCloseTo(148.94, 2); // today[0].total 1.4894
  });

  it('has 24 hours tomorrow (published in the fixture)', () => {
    expect(m.tomorrow.length).toBe(24);
  });

  it('classifies the current hour as låg (well below today average)', () => {
    // today average ≈ 123.1 öre; 82.83 / 123.1 ≈ 0.67 < 0.85
    expect(m.level).toBe('låg');
  });

  it('finds the cheapest contiguous 3h window in the future (today 15–18)', () => {
    expect(m.cheapestWindow).not.toBeNull();
    const { start, end } = m.cheapestWindow!;
    expect(start.getTime()).toBe(new Date('2026-07-16T15:00:00.000+02:00').getTime());
    expect(end.getTime()).toBe(new Date('2026-07-16T18:00:00.000+02:00').getTime());
    // exactly three hours wide
    expect(end.getTime() - start.getTime()).toBe(3 * 3_600_000);
    // and it starts at or after now
    expect(start.getTime()).toBeGreaterThanOrEqual(NOW.getTime());
  });
});

describe('buildEnergyModel — level thresholds', () => {
  it('classifies an expensive hour as hög', () => {
    const m = buildEnergyModel(attrs, state, new Date('2026-07-16T20:00:00.000+02:00'));
    // today[20].total 1.4981 → 149.81 öre, ratio ≈ 1.22 > 1.15
    expect(m.now!.ore).toBeCloseTo(149.81, 2);
    expect(m.level).toBe('hög');
  });

  it('classifies a near-average hour as normal', () => {
    const m = buildEnergyModel(attrs, state, new Date('2026-07-16T18:00:00.000+02:00'));
    // today[18].total 1.2596 → 125.96 öre; today average ≈ 123.11 → ratio ≈ 1.023,
    // squarely inside the 0.85–1.15 band.
    expect(m.now!.ore).toBeCloseTo(125.96, 2);
    expect(m.level).toBe('normal');
  });
});

describe('next12Hours', () => {
  const m = buildEnergyModel(attrs, state, NOW); // 2026-07-16T15:00 +02:00

  it('returns 12 forward slots starting at the current hour', () => {
    const hours = next12Hours(m, NOW);
    expect(hours.length).toBe(12);
    expect(hours[0].start.getTime()).toBe(NOW.getTime());
    expect(hours[0].current).toBe(true);
    // strictly ascending, one hour apart
    for (let i = 1; i < hours.length; i++) {
      expect(hours[i].start.getTime() - hours[i - 1].start.getTime()).toBe(3_600_000);
    }
  });

  it('marks exactly one current hour', () => {
    const hours = next12Hours(m, NOW);
    expect(hours.filter((h) => h.current).length).toBe(1);
  });

  it('flags the cheapest-window hours (today 15–18)', () => {
    const hours = next12Hours(m, NOW);
    const cheap = hours.filter((h) => h.cheap);
    expect(cheap.length).toBe(3);
    expect(cheap[0].start.getHours()).toBe(15);
    expect(cheap[2].start.getHours()).toBe(17);
  });

  it('carries öre through from the model, matching the current hour', () => {
    const hours = next12Hours(m, NOW);
    expect(Math.round(hours[0].ore)).toBe(83); // today[15] 0.8283 × 100
  });

  it('mid-evening spans across the day boundary into tomorrow', () => {
    const late = new Date('2026-07-16T20:00:00.000+02:00');
    const model = buildEnergyModel(attrs, state, late);
    const hours = next12Hours(model, late);
    expect(hours.length).toBe(12); // 20–23 today (4) + 00–07 tomorrow (8)
    expect(hours[0].start.getHours()).toBe(20);
    expect(hours.some((h) => h.start.getHours() === 0)).toBe(true);
  });

  it('returns fewer than 12 when only today remains and no tomorrow', () => {
    const late = new Date('2026-07-16T20:00:00.000+02:00');
    const model = buildEnergyModel({ today: attrs.today }, state, late);
    const hours = next12Hours(model, late);
    expect(hours.length).toBe(4); // 20, 21, 22, 23
    expect(hours[hours.length - 1].start.getHours()).toBe(23);
  });

  it('is empty for an unavailable series', () => {
    const model = buildEnergyModel(attrs, 'unavailable', NOW);
    expect(next12Hours(model, NOW)).toEqual([]);
  });
});

describe('buildEnergyModel — degraded inputs', () => {
  it('returns an empty model when the series is unavailable', () => {
    const m = buildEnergyModel(attrs, 'unavailable', NOW);
    expect(m.now).toBeNull();
    expect(m.today).toEqual([]);
    expect(m.tomorrow).toEqual([]);
    expect(m.cheapestWindow).toBeNull();
    expect(m.level).toBe('normal');
  });

  it('tolerates a missing tomorrow array', () => {
    const m = buildEnergyModel({ today: attrs.today }, state, NOW);
    expect(m.today.length).toBe(24);
    expect(Array.isArray(m.tomorrow)).toBe(true);
    expect(m.tomorrow.length).toBe(0);
    // cheapest window still resolvable from today's remainder
    expect(m.cheapestWindow).not.toBeNull();
  });

  it('returns an empty model when there is no series data at all', () => {
    const m = buildEnergyModel({}, state, NOW);
    expect(m.now).toBeNull();
    expect(m.cheapestWindow).toBeNull();
    expect(m.level).toBe('normal');
  });

  it('yields no cheapest window when fewer than 3 future hours remain', () => {
    // now at 22:00 today with tomorrow stripped → only 22:00, 23:00 remain
    const m = buildEnergyModel(
      { today: attrs.today },
      state,
      new Date('2026-07-16T22:00:00.000+02:00'),
    );
    expect(m.cheapestWindow).toBeNull();
  });
});
