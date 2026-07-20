import { describe, it, expect } from 'vitest';
import { filterBusDepartures, shapeDeviations, type SlDeparture } from '../src/hub/transit-model';
import fixture from './fixtures/sl-kullstaplan.json';

const real = (fixture.departures as unknown) as SlDeparture[];

// Synthetic 861 departures — the line doesn't run in the captured fixture
// (weekday rush only), so the Stockholm-bound behaviour is only exercisable here.
const bound = (over: Partial<SlDeparture>): SlDeparture => ({
  destination: 'Slakthuset',
  display: '8 min',
  state: 'EXPECTED',
  expected: '2026-07-17T07:20:00',
  scheduled: '2026-07-17T07:20:00',
  line: { designation: '861' },
  ...over,
});

describe('filterBusDepartures', () => {
  it('keeps only the requested line', () => {
    const deps = [
      bound({ expected: '2026-07-17T07:10:00' }),
      { ...bound({}), line: { designation: '848' } },
    ];
    const out = filterBusDepartures(deps, '861', 'nynäs');
    expect(out).toHaveLength(1);
    expect(out[0].line?.designation).toBe('861');
  });

  it('excludes departures whose destination matches the exclude pattern (case-insensitive)', () => {
    const deps = [
      bound({ destination: 'Nynäshamns station', display: '2 min', expected: '2026-07-17T07:12:00' }),
      bound({ destination: 'Slakthuset', display: '8 min', expected: '2026-07-17T07:18:00' }),
    ];
    const out = filterBusDepartures(deps, '861', 'nynäs');
    expect(out).toHaveLength(1);
    expect(out[0].destination).toBe('Slakthuset');
  });

  it('sorts the survivors by expected time ascending', () => {
    const deps = [
      bound({ display: '18 min', expected: '2026-07-17T07:30:00' }),
      bound({ display: '4 min', expected: '2026-07-17T07:16:00' }),
      bound({ display: '11 min', expected: '2026-07-17T07:23:00' }),
    ];
    const out = filterBusDepartures(deps, '861', 'nynäs');
    expect(out.map((d) => d.display)).toEqual(['4 min', '11 min', '18 min']);
  });

  it('retains a delayed (non-EXPECTED) Stockholm-bound departure', () => {
    const deps = [
      bound({ destination: 'Slakthuset', state: 'ATRISK', display: '6 min' }),
      bound({ destination: 'Nynäshamn', state: 'EXPECTED', display: '3 min' }),
    ];
    const out = filterBusDepartures(deps, '861', 'nynäs');
    expect(out).toHaveLength(1);
    expect(out[0].state).toBe('ATRISK');
  });

  it('returns an empty array against the real fixture (861 not running)', () => {
    expect(filterBusDepartures(real, '861', 'nynäs')).toEqual([]);
  });

  it('is robust to missing line, destination and timestamps', () => {
    const deps: SlDeparture[] = [
      { display: 'Nu' }, // no line at all
      { line: {}, display: '5 min' }, // line without designation
      bound({ destination: undefined, expected: undefined, display: 'Nu' }), // keep, sorts last
      bound({ expected: '2026-07-17T07:05:00', display: '1 min' }),
    ];
    const out = filterBusDepartures(deps, '861', 'nynäs');
    expect(out.map((d) => d.display)).toEqual(['1 min', 'Nu']);
  });

  it('returns an empty array for non-array input', () => {
    expect(filterBusDepartures(undefined, '861', 'nynäs')).toEqual([]);
    expect(filterBusDepartures(null as never, '861', 'nynäs')).toEqual([]);
  });
});

describe('shapeDeviations', () => {
  const dev = (over: Record<string, unknown> = {}) => ({
    header: 'Försenad trafik',
    priority: 30,
    lines: [{ designation: '19', transport_mode: 'METRO' }],
    ...over,
  });

  it('maps deviations to badge + header rows', () => {
    expect(shapeDeviations([dev()])).toEqual([{ badges: ['19'], header: 'Försenad trafik' }]);
  });

  it('dedupes identical headers and merges badges', () => {
    const out = shapeDeviations([
      dev({ lines: [{ designation: '18', transport_mode: 'METRO' }] }),
      dev({ lines: [{ designation: '19', transport_mode: 'METRO' }] }),
    ]);
    expect(out).toEqual([{ badges: ['18', '19'], header: 'Försenad trafik' }]);
  });

  it('sorts by priority descending', () => {
    const out = shapeDeviations([
      dev({ header: 'Mindre', priority: 10, lines: [{ designation: '861', transport_mode: 'BUS' }] }),
      dev({ header: 'Stopp', priority: 40, lines: [{ designation: '43', transport_mode: 'TRAIN' }] }),
    ]);
    expect(out.map((d) => d.header)).toEqual(['Stopp', 'Mindre']);
  });

  it('drops malformed entries and caps at 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => dev({ header: `Störning ${i}` }));
    expect(shapeDeviations(many)).toHaveLength(5);
    expect(shapeDeviations([{ lines: [] }, null, 'x'])).toEqual([]);
    expect(shapeDeviations(undefined)).toEqual([]);
    expect(shapeDeviations('not-an-array')).toEqual([]);
  });
});

describe('shapeDeviations details/scope passthrough', () => {
  const dev = (over: Record<string, unknown> = {}) => ({
    header: 'Försenad trafik',
    priority: 30,
    lines: [{ designation: '19', transport_mode: 'METRO' }],
    ...over,
  });

  it('passes details and scope through', () => {
    const out = shapeDeviations([
      dev({ details: 'Signalfel vid Gullmarsplan.', scope: 'Gröna linjen mot Hagsätra' }),
    ]);
    expect(out).toEqual([
      {
        badges: ['19'],
        header: 'Försenad trafik',
        details: 'Signalfel vid Gullmarsplan.',
        scope: 'Gröna linjen mot Hagsätra',
      },
    ]);
  });

  it('omits details/scope when absent or not strings', () => {
    const out = shapeDeviations([dev({ details: 42, scope: null })]);
    expect(out[0].details).toBeUndefined();
    expect(out[0].scope).toBeUndefined();
  });

  it('merge keeps the first non-empty details/scope', () => {
    const out = shapeDeviations([
      dev({ details: '', scope: undefined }),
      dev({ details: 'Först.', scope: 'Nynäsgård' }),
      dev({ details: 'Sen.', scope: 'Ösmo' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].details).toBe('Först.');
    expect(out[0].scope).toBe('Nynäsgård');
  });
});
