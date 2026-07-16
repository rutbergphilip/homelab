import { describe, it, expect } from 'vitest';
import { roomLightSummary, totalLightsOn } from '../src/hub/pages/hub-lights-page';
import type { HubConfig, HubRoom } from '../src/hub/hub-config';
import type { HassEntity } from '../src/types';

const mk = (state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id: 'light.x',
  state,
  attributes,
  last_changed: '',
  last_updated: '',
  context: { id: '', parent_id: null, user_id: null },
});

const room = (lights: { entity: string; name: string }[]): HubRoom => ({
  id: 'r',
  name: 'R',
  icon: 'door',
  main_entity: lights[0]?.entity ?? '',
  lights,
});

describe('roomLightSummary', () => {
  const r = room([
    { entity: 'light.a', name: 'A' },
    { entity: 'light.b', name: 'B' },
    { entity: 'light.c', name: 'C' },
  ]);

  it('reads Släckt when nothing is on', () => {
    const states = { 'light.a': mk('off'), 'light.b': mk('off') };
    expect(roomLightSummary(r, states)).toEqual({ onCount: 0, pct: null, label: 'Släckt' });
  });

  it('averages brightness of the on-lights into a percent', () => {
    const states = {
      'light.a': mk('on', { brightness: 255 }), // 100%
      'light.b': mk('on', { brightness: 128 }), // ~50%
      'light.c': mk('off'),
    };
    const s = roomLightSummary(r, states);
    expect(s.onCount).toBe(2);
    expect(s.pct).toBe(75);
    expect(s.label).toBe('2 lampor · 75 %');
  });

  it('uses the singular form for one lamp', () => {
    const states = { 'light.a': mk('on', { brightness: 255 }) };
    expect(roomLightSummary(r, states).label).toBe('1 lampa · 100 %');
  });

  it('omits the percent when brightness is unknown', () => {
    const states = { 'light.a': mk('on') };
    expect(roomLightSummary(r, states)).toMatchObject({ onCount: 1, pct: null, label: '1 lampa' });
  });
});

describe('totalLightsOn', () => {
  const cfg = {
    rooms: [
      room([
        { entity: 'light.a', name: 'A' },
        { entity: 'light.b', name: 'B' },
      ]),
      room([
        { entity: 'light.c', name: 'C' },
        { entity: 'light.missing', name: 'Missing' },
      ]),
    ],
  } as unknown as HubConfig;

  it('counts on-lights and excludes unavailable/missing from the total', () => {
    const states = {
      'light.a': mk('on'),
      'light.b': mk('off'),
      'light.c': mk('unavailable'),
      // light.missing absent from states entirely
    };
    // a on; b off (live); c unavailable (skip); missing absent (skip)
    expect(totalLightsOn(cfg, states)).toEqual({ on: 1, total: 2 });
  });
});
