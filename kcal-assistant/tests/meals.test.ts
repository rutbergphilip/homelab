import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { logMeal, editMeal, getDay, setDayType } from "../src/db/meals";
import {
  listPreferences,
  savePreference,
  deletePreference,
  getTargets,
  setTargets,
} from "../src/db/preferences";

const DATE = "2026-07-06";
let db: Database;
let chickenId: number;
let propudId: number;

beforeEach(() => {
  db = openDb(":memory:");
  chickenId = saveProduct(db, {
    name: "Kycklingfilé",
    per_100g: { kcal: 106, protein: 23, fat: 1.5, carbs: 0 },
  }).id;
  propudId = saveProduct(db, {
    name: "ProPud",
    per_100g: { kcal: 60, protein: 11, fat: 0.4, carbs: 3.1 },
    portions: [{ name: "flaska", kcal: 198, protein: 36.3, fat: 1.4, carbs: 10.3 }],
  }).id;
});

describe("logMeal", () => {
  test("per-100g item: server computes rounded snapshot and day totals", () => {
    const { day } = logMeal(db, {
      name: "Lunch",
      date: DATE,
      items: [{ product_id: chickenId, grams: 250 }],
    });
    expect(day.meals).toHaveLength(1);
    const meal = day.meals[0]!;
    expect(meal.items[0]!.description).toBe("Kycklingfilé");
    expect(meal.kcal).toBe(265); // 106*2.5
    expect(meal.protein).toBe(57.5);
    expect(day.totals.kcal).toBe(265);
    expect(day.remaining.kcal).toBe(day.targets.kcal - 265);
  });

  test("portion item with explicit macros times quantity", () => {
    const { day } = logMeal(db, {
      name: "Kvällsmål",
      date: DATE,
      items: [{ product_id: propudId, portion_name: "flaska", quantity: 2 }],
    });
    expect(day.totals.kcal).toBe(396);
    expect(day.totals.protein).toBe(72.6);
  });

  test("ad-hoc item with direct macros", () => {
    const { day } = logMeal(db, {
      name: "Restaurang",
      date: DATE,
      items: [{ description: "Kebabtallrik ute", macros: { kcal: 1100.2, protein: 45.05, fat: 55, carbs: 90 } }],
    });
    expect(day.totals.kcal).toBe(1101); // ceil
    expect(day.totals.protein).toBe(45); // floor to 1 decimal
  });

  test("post-gym shake always sorts last regardless of log order", () => {
    logMeal(db, {
      name: "Post-gym shake",
      date: DATE,
      post_gym_shake: true,
      items: [{ product_id: propudId, portion_name: "flaska" }],
    });
    logMeal(db, { name: "Middag", date: DATE, items: [{ product_id: chickenId, grams: 200 }] });
    const day = getDay(db, DATE);
    expect(day.meals.map((m) => m.name)).toEqual(["Middag", "Post-gym shake"]);
  });

  test("rejects product item without grams or portion", () => {
    expect(() =>
      logMeal(db, { name: "Fel", date: DATE, items: [{ product_id: chickenId }] }),
    ).toThrow();
  });

  test("rejects unknown portion name", () => {
    expect(() =>
      logMeal(db, {
        name: "Fel",
        date: DATE,
        items: [{ product_id: chickenId, portion_name: "flaska" }],
      }),
    ).toThrow();
  });
});

describe("day handling", () => {
  test("day defaults to vilodag and can switch type mid-day", () => {
    logMeal(db, { name: "Frukost", date: DATE, items: [{ product_id: chickenId, grams: 100 }] });
    expect(getDay(db, DATE).day_type).toBe("vilodag");
    const day = setDayType(db, "gymdag", DATE);
    expect(day.day_type).toBe("gymdag");
    const gymTargets = getTargets(db).find((t) => t.day_type === "gymdag")!;
    expect(day.targets.kcal).toBe(gymTargets.kcal);
    expect(day.remaining.kcal).toBe(gymTargets.kcal - day.totals.kcal);
  });

  test("getDay for a date with no meals returns empty day", () => {
    const day = getDay(db, "2026-01-01");
    expect(day.meals).toHaveLength(0);
    expect(day.totals.kcal).toBe(0);
  });

  test("days are independent", () => {
    logMeal(db, { name: "Lunch", date: DATE, items: [{ product_id: chickenId, grams: 100 }] });
    expect(getDay(db, "2026-07-05").totals.kcal).toBe(0);
    expect(getDay(db, DATE).totals.kcal).toBe(106);
  });
});

describe("editMeal", () => {
  test("update replaces items and recomputes totals", () => {
    const { meal_id } = logMeal(db, {
      name: "Lunch",
      date: DATE,
      items: [{ product_id: chickenId, grams: 250 }],
    });
    const day = editMeal(db, {
      meal_id,
      action: "update",
      items: [{ product_id: chickenId, grams: 150 }],
    });
    expect(day.totals.kcal).toBe(159);
  });

  test("delete removes the meal", () => {
    const { meal_id } = logMeal(db, {
      name: "Fel måltid",
      date: DATE,
      items: [{ product_id: chickenId, grams: 100 }],
    });
    const day = editMeal(db, { meal_id, action: "delete" });
    expect(day.meals).toHaveLength(0);
    expect(day.totals.kcal).toBe(0);
  });
});

describe("preferences and targets", () => {
  test("style rules are seeded", () => {
    const prefs = listPreferences(db);
    expect(prefs.length).toBeGreaterThan(3);
    expect(prefs.some((p) => p.content.includes("svenska"))).toBe(true);
  });

  test("savePreference adds and upserts", () => {
    const before = listPreferences(db).length;
    const after = savePreference(db, { content: "ProPud betyder alltid flaskan", category: "regel" });
    expect(after.length).toBe(before + 1);
    const added = after.find((p) => p.content.includes("ProPud"))!;
    const updated = savePreference(db, { id: added.id, content: "ProPud betyder flaskan, aldrig burken" });
    expect(updated.length).toBe(before + 1);
    expect(updated.find((p) => p.id === added.id)!.content).toContain("aldrig burken");
  });

  test("deletePreference retires a rule", () => {
    const prefs = savePreference(db, { content: "Tillfällig regel" });
    const id = prefs.find((p) => p.content === "Tillfällig regel")!.id;
    const after = deletePreference(db, id);
    expect(after.some((p) => p.id === id)).toBe(false);
  });

  test("setTargets updates one day type", () => {
    const rows = setTargets(db, { day_type: "gymdag", kcal: 2600, protein_min: 190 });
    const gym = rows.find((t) => t.day_type === "gymdag")!;
    expect(gym.kcal).toBe(2600);
    expect(gym.protein_min).toBe(190);
    // other types untouched
    expect(rows.filter((t) => t.day_type !== "gymdag")).toHaveLength(2);
  });
});
