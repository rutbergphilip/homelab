import { describe, it, expect } from 'vitest';
import { bleedGradient } from '../src/hub/ambient-color';

describe('bleedGradient', () => {
  it('builds a night gradient at 0.22 opacity from the rgb triple', () => {
    const g = bleedGradient([100, 50, 200], 'natt');
    expect(g).toContain('rgba(100, 50, 200, 0.22)');
    expect(g).toContain('radial-gradient(80% 60% at 30% 20%');
    expect(g).toContain('transparent 70%');
  });

  it('uses 0.12 opacity for the day theme', () => {
    const g = bleedGradient([100, 50, 200], 'dag');
    expect(g).toContain('rgba(100, 50, 200, 0.12)');
    expect(g).not.toContain('0.22');
  });

  it('returns "none" when there is no colour', () => {
    expect(bleedGradient(null, 'natt')).toBe('none');
    expect(bleedGradient(null, 'dag')).toBe('none');
  });
});
