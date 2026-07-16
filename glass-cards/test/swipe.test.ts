import { describe, it, expect } from 'vitest';
import { settlePage } from '../src/hub/swipe';

describe('settlePage', () => {
  const W = 1000;
  it('stays under threshold', () => expect(settlePage(-100, W, 0, 1, 5)).toBe(1));
  it('advances past 20% drag', () => expect(settlePage(-250, W, 0, 1, 5)).toBe(2));
  it('goes back past 20% drag', () => expect(settlePage(250, W, 0, 1, 5)).toBe(0));
  it('fast flick advances regardless of distance', () => expect(settlePage(-40, W, -0.8, 1, 5)).toBe(2));
  it('clamps at ends', () => {
    expect(settlePage(400, W, 0, 0, 5)).toBe(0);
    expect(settlePage(-400, W, 0, 4, 5)).toBe(4);
  });
});
