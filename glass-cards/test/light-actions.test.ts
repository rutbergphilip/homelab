import { describe, it, expect } from 'vitest';
import { roomTapPlan } from '../src/hub/light-actions';
import type { HubRoom } from '../src/hub/hub-config';
import type { HassEntity } from '../src/types';

const room = (over: Partial<HubRoom> = {}): HubRoom => ({
  id: 'sovrum', name: 'Sovrum', icon: 'bed', main_entity: 'light.sovrum',
  lights: [
    { entity: 'light.sovrum', name: 'Taklampa' },
    { entity: 'light.lightstrip', name: 'Lightstrip' },
    { entity: 'light.spot_1', name: 'Spot 1' },
  ],
  ...over,
});

const st = (state: string): HassEntity =>
  ({ entity_id: 'x', state, attributes: {} } as unknown as HassEntity);

describe('roomTapPlan', () => {
  it('turns off ALL room lights when any light is on', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('on'), 'light.spot_1': st('off') };
    expect(roomTapPlan(room(), states)).toEqual({
      service: 'turn_off',
      entities: ['light.sovrum', 'light.lightstrip', 'light.spot_1'],
    });
  });

  it('turns on default_lights when the room is dark', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('off'), 'light.spot_1': st('off') };
    const r = room({ default_lights: ['light.sovrum', 'light.spot_1'] });
    expect(roomTapPlan(r, states)).toEqual({
      service: 'turn_on',
      entities: ['light.sovrum', 'light.spot_1'],
    });
  });

  it('falls back to main_entity when default_lights is missing or empty', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('off'), 'light.spot_1': st('off') };
    expect(roomTapPlan(room(), states).entities).toEqual(['light.sovrum']);
    expect(roomTapPlan(room({ default_lights: [] }), states).entities).toEqual(['light.sovrum']);
  });

  it('treats unavailable/unknown lights as off', () => {
    const states = { 'light.sovrum': st('unavailable'), 'light.lightstrip': st('unknown') };
    expect(roomTapPlan(room(), states).service).toBe('turn_on');
  });
});
