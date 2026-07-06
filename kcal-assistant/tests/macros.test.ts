import { describe, expect, test } from "bun:test";
import {
  roundMacros,
  scalePer100g,
  scaleMacros,
  sumMacros,
  type Macros,
} from "../src/lib/macros";
import { todayStockholm, isValidDate } from "../src/lib/dates";

describe("roundMacros (räkna högt)", () => {
  test("rounds kcal up to whole number", () => {
    expect(roundMacros({ kcal: 123.2, protein: 10, fat: 5, carbs: 2 }).kcal).toBe(124);
    expect(roundMacros({ kcal: 123, protein: 10, fat: 5, carbs: 2 }).kcal).toBe(123);
  });

  test("rounds fat and carbs up to 1 decimal", () => {
    const r = roundMacros({ kcal: 100, protein: 10, fat: 10.11, carbs: 3.401 });
    expect(r.fat).toBe(10.2);
    expect(r.carbs).toBe(3.5);
  });

  test("rounds protein DOWN to 1 decimal (never overstate vs proteingolv)", () => {
    expect(roundMacros({ kcal: 100, protein: 30.29, fat: 5, carbs: 2 }).protein).toBe(30.2);
    expect(roundMacros({ kcal: 100, protein: 30.2, fat: 5, carbs: 2 }).protein).toBe(30.2);
  });

  test("is immune to float noise (0.1 + 0.2 stays 0.3, not 0.4)", () => {
    const r = roundMacros({ kcal: 100, protein: 0.1 + 0.2, fat: 0.1 + 0.2, carbs: 29.9 });
    expect(r.fat).toBe(0.3);
    expect(r.protein).toBe(0.3);
    expect(r.carbs).toBe(29.9);
  });
});

describe("scalePer100g", () => {
  test("scales per-100g values by grams and rounds", () => {
    const per100: Macros = { kcal: 100, protein: 10, fat: 5, carbs: 2 };
    expect(scalePer100g(per100, 250)).toEqual({ kcal: 250, protein: 25, fat: 12.5, carbs: 5 });
  });

  test("rounds high on fractional results", () => {
    const per100: Macros = { kcal: 113, protein: 9.7, fat: 3.3, carbs: 11.1 };
    const r = scalePer100g(per100, 85);
    expect(r.kcal).toBe(97); // 96.05 -> up
    expect(r.protein).toBe(8.2); // 8.245 -> down
    expect(r.fat).toBe(2.9); // 2.805 -> up
    expect(r.carbs).toBe(9.5); // 9.435 -> up
  });
});

describe("scaleMacros", () => {
  test("multiplies portion macros by quantity and rounds", () => {
    const portion: Macros = { kcal: 210, protein: 20, fat: 5, carbs: 15 };
    expect(scaleMacros(portion, 2)).toEqual({ kcal: 420, protein: 40, fat: 10, carbs: 30 });
  });
});

describe("sumMacros", () => {
  test("sums item snapshots and rounds once at the end", () => {
    const items: Macros[] = [
      { kcal: 97, protein: 8.2, fat: 2.9, carbs: 9.5 },
      { kcal: 250, protein: 25, fat: 12.5, carbs: 5 },
      { kcal: 420, protein: 8.2, fat: 10, carbs: 30 },
    ];
    const r = sumMacros(items);
    expect(r).toEqual({ kcal: 767, protein: 41.4, fat: 25.4, carbs: 44.5 });
  });

  test("empty list sums to zero", () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
  });
});

describe("dates", () => {
  test("todayStockholm returns YYYY-MM-DD", () => {
    expect(todayStockholm()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("isValidDate accepts real dates and rejects garbage", () => {
    expect(isValidDate("2026-07-06")).toBe(true);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("igår")).toBe(false);
    expect(isValidDate("2026-7-6")).toBe(false);
  });
});
