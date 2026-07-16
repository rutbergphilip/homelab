import { describe, it, expect } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveProduct } from "../src/db/products";
import { logMeal } from "../src/db/meals";
import { logWeight, listWeights } from "../src/db/weights";
import { setProfile } from "../src/db/profile";
import { buildInternalSummary } from "../src/ui/internal";
import { addDays, todayStockholm } from "../src/lib/dates";

function seededDb(): Database {
  const db = openDb(":memory:");
  const p = saveProduct(db, { name: "Kycklingbowl", per_100g: { kcal: 160, protein: 14, fat: 4, carbs: 12 } });
  logMeal(db, { name: "Lunch — kycklingbowl", date: todayStockholm(), items: [{ product_id: p.id, grams: 400 }] });
  logWeight(db, { weight_kg: 82.1, date: addDays(todayStockholm(), -14) });
  logWeight(db, { weight_kg: 81.4, date: todayStockholm() });
  return db;
}

describe("buildInternalSummary", () => {
  it("returns the full summary shape", () => {
    const db = seededDb();
    const s = buildInternalSummary(db);
    expect(s.status).toBe("ok");
    expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof s.kcal).toBe("number");
    expect(typeof s.kcal_target).toBe("number");
    expect(Array.isArray(s.meals)).toBe(true);
    expect(s.meals[0]).toEqual({ name: "Lunch — kycklingbowl", kcal: 640 });
    expect(Array.isArray(s.weight_trend)).toBe(true);
    expect(s.weight_trend.length).toBe(2);
    expect(typeof s.current_kg).toBe("number");
    expect(s.forecast === null || typeof s.forecast!.goal_kg === "number").toBe(true);
  });

  it("empty db → zeros, not errors", () => {
    const emptyDb = openDb(":memory:");
    const s = buildInternalSummary(emptyDb);
    expect(s.status).toBe("ok");
    expect(s.kcal).toBe(0);
    expect(s.meals).toEqual([]);
    expect(s.weight_trend).toEqual([]);
    expect(s.current_kg).toBe(0);
    expect(s.forecast).toBeNull();
  });

  it("rounds kcal to integers and other numbers to 1 decimal", () => {
    const db = seededDb();
    const s = buildInternalSummary(db);
    expect(Number.isInteger(s.kcal)).toBe(true);
    expect(Number.isInteger(s.kcal_target)).toBe(true);
    expect(Number.isInteger(s.meals[0]!.kcal)).toBe(true);
    expect(s.protein_g).toBe(Math.round(s.protein_g * 10) / 10);
    expect(s.current_kg).toBe(Math.round(s.current_kg * 10) / 10);
  });

  it("forecast is null when no profile is set, even with weight logs", () => {
    const db = seededDb();
    const s = buildInternalSummary(db);
    expect(s.forecast).toBeNull();
  });

  it("returns a populated forecast with goal_kg/eta fields when profile + goal are set", () => {
    const db = seededDb();
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 78 });
    const s = buildInternalSummary(db);
    expect(s.forecast).not.toBeNull();
    expect(s.forecast!.goal_kg).toBe(78);
    expect(typeof s.forecast!.on_track).toBe("boolean");
    expect(s.forecast!.eta === null || typeof s.forecast!.eta === "string").toBe(true);
    expect(s.forecast!.eta_early === null || typeof s.forecast!.eta_early === "string").toBe(true);
    expect(s.forecast!.eta_late === null || typeof s.forecast!.eta_late === "string").toBe(true);
  });

  it("forecast is null when profile is set but has no goal weight", () => {
    const db = seededDb();
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: null });
    const s = buildInternalSummary(db);
    expect(s.forecast).toBeNull();
  });

  it("weight_trend uses the EWMA-smoothed trend_kg, not the raw weight_kg", () => {
    const db = seededDb();
    const s = buildInternalSummary(db);
    // The 14-day gap between weigh-ins (82.1 -> 81.4) makes trend_kg diverge
    // from the raw log on the latest point — the fixture is deliberately
    // chosen so raw and trend disagree, pinning that smoothing is applied.
    const trendByDate = new Map(listWeights(db).map((w) => [w.date, Math.round(w.trend_kg * 10) / 10]));
    for (const point of s.weight_trend) {
      expect(point.kg).toBe(trendByDate.get(point.date)!);
    }
    const rawByDate = new Map([
      [addDays(todayStockholm(), -14), 82.1],
      [todayStockholm(), 81.4],
    ]);
    const diverges = s.weight_trend.some((p) => p.kg !== rawByDate.get(p.date));
    expect(diverges).toBe(true);
    // current_kg stays raw (unchanged by this fix) — sanity-check it still
    // matches the last logged weight, not the smoothed trend.
    expect(s.current_kg).toBe(81.4);
  });

  describe("on_track", () => {
    function dbWithProfile(goalWeightKg: number, goalDate: string | null = null): Database {
      const db = seededDb();
      setProfile(db, {
        birth_date: "2000-01-15",
        sex: "man",
        height_cm: 180,
        activity_factor: 1.5,
        goal_weight_kg: goalWeightKg,
        goal_date: goalDate,
      });
      return db;
    }

    it("goal already reached → true", () => {
      const probe = seededDb();
      const latestTrendKg = listWeights(probe)[0]!.trend_kg; // listWeights: DESC by date, [0] = today
      const db = dbWithProfile(latestTrendKg);
      const s = buildInternalSummary(db);
      expect(s.forecast!.on_track).toBe(true);
    });

    it("no reachable eta within the horizon → false", () => {
      const probe = seededDb();
      const latestTrendKg = listWeights(probe)[0]!.trend_kg;
      // On a default vilodag target (2000 kcal, well under this profile's
      // TDEE) the simulated trajectory loses weight — a goal ABOVE current
      // weight is moved away from, so eta stays null.
      const db = dbWithProfile(latestTrendKg + 20);
      const s = buildInternalSummary(db);
      expect(s.forecast!.eta).toBeNull();
      expect(s.forecast!.on_track).toBe(false);
    });

    it("no goal_date set, eta reachable → true", () => {
      const probe = seededDb();
      const latestTrendKg = listWeights(probe)[0]!.trend_kg;
      const db = dbWithProfile(latestTrendKg - 5);
      const s = buildInternalSummary(db);
      expect(s.forecast!.eta).not.toBeNull();
      expect(s.forecast!.on_track).toBe(true);
    });

    it("goal_date set, eta on or before the deadline → true", () => {
      const probe = seededDb();
      const latestTrendKg = listWeights(probe)[0]!.trend_kg;
      const farGoalDate = addDays(todayStockholm(), 300);
      const db = dbWithProfile(latestTrendKg - 5, farGoalDate);
      const s = buildInternalSummary(db);
      expect(s.forecast!.eta).not.toBeNull();
      expect(s.forecast!.eta! <= farGoalDate).toBe(true);
      expect(s.forecast!.on_track).toBe(true);
    });

    it("goal_date set, eta after the deadline → false", () => {
      const probe = seededDb();
      const latestTrendKg = listWeights(probe)[0]!.trend_kg;
      const soonGoalDate = addDays(todayStockholm(), 5);
      const db = dbWithProfile(latestTrendKg - 5, soonGoalDate);
      const s = buildInternalSummary(db);
      expect(s.forecast!.eta).not.toBeNull();
      expect(s.forecast!.eta! > soonGoalDate).toBe(true);
      expect(s.forecast!.on_track).toBe(false);
    });
  });
});
