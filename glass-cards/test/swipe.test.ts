import { describe, it, expect } from 'vitest';
import { settlePage, isDrag, isHorizontalDrag, DRAG_THRESHOLD_PX } from '../src/hub/swipe';

describe('isHorizontalDrag', () => {
  it('horizontal-dominant is a deck swipe', () => {
    expect(isHorizontalDrag(20, 5)).toBe(true);
    expect(isHorizontalDrag(-20, 5)).toBe(true);
  });
  it('vertical-dominant is a scroll, not a swipe', () => {
    expect(isHorizontalDrag(5, 20)).toBe(false);
    expect(isHorizontalDrag(5, -20)).toBe(false);
  });
  it('a tie is treated as scroll (vertical wins)', () => expect(isHorizontalDrag(10, 10)).toBe(false));
  it('pure-axis gestures resolve correctly', () => {
    expect(isHorizontalDrag(15, 0)).toBe(true);
    expect(isHorizontalDrag(0, 15)).toBe(false);
  });
});

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
