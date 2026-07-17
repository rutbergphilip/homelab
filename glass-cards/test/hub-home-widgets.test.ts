import { describe, it, expect } from 'vitest';
import { pickPlayer, mediaProgress } from '../src/hub/widgets/hub-now-playing';
import { kcalPct, proteinSubtitle } from '../src/hub/widgets/hub-kcal-ring';
import type { HassEntity } from '../src/types';

const mk = (state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id: 'media_player.x',
  state,
  attributes,
  last_changed: '',
  last_updated: '',
  context: { id: '', parent_id: null, user_id: null },
});

describe('pickPlayer', () => {
  const players = [
    { entity: 'a', name: 'A' },
    { entity: 'b', name: 'B' },
  ];

  it('prefers a playing player over a paused one', () => {
    const states = { a: mk('paused'), b: mk('playing') };
    expect(pickPlayer(states, players)?.name).toBe('B');
  });

  it('falls back to the first non-off player', () => {
    const states = { a: mk('off'), b: mk('paused') };
    expect(pickPlayer(states, players)?.name).toBe('B');
  });

  it('returns null when everything is off/idle/unavailable', () => {
    const states = { a: mk('off'), b: mk('idle') };
    expect(pickPlayer(states, players)).toBeNull();
  });
});

describe('mediaProgress', () => {
  it('is 0 without a duration', () => {
    expect(mediaProgress(mk('playing'), Date.now())).toBe(0);
  });

  it('advances client-side while playing', () => {
    const base = Date.parse('2026-07-16T12:00:00.000Z');
    const e = mk('playing', {
      media_duration: 100,
      media_position: 10,
      media_position_updated_at: '2026-07-16T12:00:00.000Z',
    });
    expect(mediaProgress(e, base + 20000)).toBeCloseTo(30, 1);
  });

  it('does not advance when paused', () => {
    const e = mk('paused', {
      media_duration: 100,
      media_position: 25,
      media_position_updated_at: '2026-07-16T12:00:00.000Z',
    });
    expect(mediaProgress(e, Date.now())).toBe(25);
  });

  it('clamps to 100', () => {
    expect(mediaProgress(mk('paused', { media_duration: 100, media_position: 150 }), 0)).toBe(100);
  });
});

describe('kcalPct', () => {
  it('is 0 without a target', () => {
    expect(kcalPct(1000, 0)).toBe(0);
  });

  it('is the consumed/target ratio', () => {
    expect(kcalPct(1100, 2200)).toBe(50);
  });

  it('clamps to 100 over target', () => {
    expect(kcalPct(3000, 2200)).toBe(100);
  });
});

describe('proteinSubtitle', () => {
  it('reads the real protein_g attribute, rounded', () => {
    expect(proteinSubtitle({ protein_g: 58.1, protein_target_g: 150 })).toBe('58 g protein');
  });

  it('is empty when protein_g is absent', () => {
    expect(proteinSubtitle({ kcal_target: 1600 })).toBe('');
  });

  it('does not read the old (non-existent) `protein` attribute name', () => {
    // Guards the fixed bug: the sensor never exposes `protein`, only `protein_g`.
    expect(proteinSubtitle({ protein: 58 })).toBe('');
  });
});
