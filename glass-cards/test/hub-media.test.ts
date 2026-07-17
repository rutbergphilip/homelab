import { describe, it, expect } from 'vitest';
import { isGrouped } from '../src/hub/widgets/hub-volume-row';
import { clock, groupMaster } from '../src/hub/pages/hub-media-page';
import type { HassEntity } from '../src/types';

function player(entity: string, state: string): HassEntity {
  return {
    entity_id: entity,
    state,
    attributes: {},
    last_changed: '',
    last_updated: '',
    context: { id: '', parent_id: null, user_id: null },
  };
}

describe('isGrouped', () => {
  it('is true only when the master lists the player', () => {
    expect(isGrouped(['media_player.kitchen'], 'media_player.kitchen')).toBe(true);
    expect(isGrouped(['media_player.arc_sub'], 'media_player.kitchen')).toBe(false);
  });

  it('tolerates a missing or non-array attribute', () => {
    expect(isGrouped(undefined, 'media_player.kitchen')).toBe(false);
    expect(isGrouped(null, 'media_player.kitchen')).toBe(false);
  });
});

describe('groupMaster', () => {
  const players = [
    { entity: 'media_player.arc_sub', name: 'Vardagsrum (Arc)' },
    { entity: 'media_player.kitchen', name: 'Kök' },
    { entity: 'media_player.bedroom', name: 'Sovrum' },
  ];

  it('picks the first playing speaker', () => {
    const states = {
      'media_player.arc_sub': player('media_player.arc_sub', 'paused'),
      'media_player.kitchen': player('media_player.kitchen', 'playing'),
    };
    expect(groupMaster(states, players)).toBe('media_player.kitchen');
  });

  it('falls back to the first configured speaker when nothing plays', () => {
    const states = {
      'media_player.arc_sub': player('media_player.arc_sub', 'idle'),
    };
    expect(groupMaster(states, players)).toBe('media_player.arc_sub');
  });

  it('returns null with no players', () => {
    expect(groupMaster({}, [])).toBeNull();
  });
});

describe('clock', () => {
  it('formats seconds as m:ss', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(9)).toBe('0:09');
    expect(clock(75)).toBe('1:15');
    expect(clock(605)).toBe('10:05');
  });

  it('clamps invalid input to 0:00', () => {
    expect(clock(-5)).toBe('0:00');
    expect(clock(NaN)).toBe('0:00');
  });
});
