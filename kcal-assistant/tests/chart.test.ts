import { describe, expect, test } from "bun:test";
import { makeScale, invertScale, tickDates, nearestHit } from "../src/ui/app/lib/chart";

const DAY = 86_400_000;

describe("makeScale/invertScale", () => {
  test("maps domain to range linearly and inverts", () => {
    const X = makeScale(0, 10, 100, 200);
    expect(X(0)).toBe(100);
    expect(X(10)).toBe(200);
    expect(X(5)).toBe(150);
    const inv = invertScale(0, 10, 100, 200);
    expect(inv(150)).toBe(5);
  });

  test("degenerate domain does not divide by zero", () => {
    const X = makeScale(7, 7, 100, 200);
    expect(X(7)).toBe(100);
  });
});

describe("tickDates", () => {
  test("n evenly spaced ticks including both endpoints", () => {
    const t0 = Date.parse("2026-06-01");
    const t1 = Date.parse("2026-06-29"); // 28 days
    const ticks = tickDates(t0, t1, 5);
    expect(ticks).toHaveLength(5);
    expect(ticks[0]).toBe(t0);
    expect(ticks[4]).toBe(t1);
    expect(ticks[1]! - ticks[0]!).toBe(7 * DAY);
  });

  test("n<2 collapses to the start", () => {
    expect(tickDates(0, 100, 1)).toEqual([0]);
  });
});

describe("nearestHit", () => {
  const actual = [{ t: 0, kg: 100, trend: 100.3 }, { t: 10, kg: 99, trend: 99.1 }];
  const proj = [{ t: 20, kg: 98, low: 97, high: 99 }, { t: 30, kg: 97.5, low: 96, high: 99 }];

  test("picks nearest actual point", () => {
    expect(nearestHit(2, actual, proj)).toEqual({ kind: "actual", t: 0, kg: 100, trend: 100.3 });
  });

  test("picks nearest projection point with band", () => {
    expect(nearestHit(28, actual, proj)).toEqual({ kind: "prognos", t: 30, kg: 97.5, low: 96, high: 99 });
  });

  test("actual wins exact ties and empty input gives null", () => {
    expect(nearestHit(15, actual, proj)).toEqual({ kind: "actual", t: 10, kg: 99, trend: 99.1 });
    expect(nearestHit(5, [], [])).toBeNull();
  });

  test("actual hit carries the trend value", () => {
    const hit = nearestHit(1, [{ t: 1, kg: 100, trend: 100.2 }], []);
    expect(hit).toEqual({ kind: "actual", t: 1, kg: 100, trend: 100.2 });
  });
});
