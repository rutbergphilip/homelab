import { describe, it, expect } from 'vitest';
import { settlePage, isDrag, DRAG_THRESHOLD_PX } from '../src/hub/swipe';

describe('isDrag', () => {
  it('below threshold is a tap (both directions)', () => {
    expect(isDrag(5)).toBe(false);
    expect(isDrag(-5)).toBe(false);
  });
  it('exactly at threshold is still a tap', () => expect(isDrag(DRAG_THRESHOLD_PX)).toBe(false));
  it('past threshold is a drag (both directions)', () => {
    expect(isDrag(9)).toBe(true);
    expect(isDrag(-9)).toBe(true);
  });
  it('honors a custom threshold', () => {
    expect(isDrag(15, 20)).toBe(false);
    expect(isDrag(25, 20)).toBe(true);
  });
});

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
