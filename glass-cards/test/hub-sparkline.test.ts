import { describe, it, expect } from 'vitest';
import { sparklineCoords, type SparkPoint } from '../src/hub/widgets/hub-sparkline';

const pts = (...vals: number[]): SparkPoint[] =>
  vals.map((value, i) => ({ date: `2026-07-${String(i + 1).padStart(2, '0')}`, value }));

describe('sparklineCoords', () => {
  it('returns nothing for an empty series', () => {
    expect(sparklineCoords([], 100, 100)).toEqual([]);
  });

  it('places a lone point at the right edge, vertically centred', () => {
    expect(sparklineCoords(pts(80), 100, 100)).toEqual([{ x: 100, y: 50 }]);
  });

  it('spreads x evenly from 0 to width', () => {
    const c = sparklineCoords(pts(1, 2, 3, 4, 5), 100, 100);
    expect(c.map((p) => p.x)).toEqual([0, 25, 50, 75, 100]);
  });

  it('inverts y so the max sits high and the min sits low, with a 10% pad', () => {
    const c = sparklineCoords(pts(0, 10), 100, 100);
    // pad 0.1 → domain span 1.2; min maps to 100*(1 - 0.1/1.2), max to 100*(1 - 1.1/1.2)
    expect(c[0].y).toBeCloseTo(91.667, 2); // value 0 (min) → low on screen
    expect(c[1].y).toBeCloseTo(8.333, 2); // value 10 (max) → high on screen
  });

  it('flattens a constant series to the vertical centre', () => {
    const c = sparklineCoords(pts(72, 72, 72), 100, 100);
    expect(c.map((p) => p.y)).toEqual([50, 50, 50]);
  });

  it('scales to the requested width and height', () => {
    const c = sparklineCoords(pts(0, 10), 560, 130);
    expect(c[0].x).toBe(0);
    expect(c[1].x).toBe(560);
    expect(c[1].y).toBeCloseTo(130 * (1 - 1.1 / 1.2), 2);
  });
});
