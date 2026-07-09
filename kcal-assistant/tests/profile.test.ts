import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { getProfile, setProfile } from "../src/db/profile";

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("profile", () => {
  test("getProfile is null before first set", () => {
    expect(getProfile(db)).toBeNull();
  });

  test("first set requires the physiological fields", () => {
    expect(() => setProfile(db, { goal_weight_kg: 80 })).toThrow(/birth_date/);
  });

  test("insert, partial update, clear goals", () => {
    const p = setProfile(db, {
      birth_date: "2000-01-15",
      sex: "man",
      height_cm: 180,
      activity_factor: 1.5,
      goal_weight_kg: 80,
      goal_date: "2026-10-01",
    });
    expect(p.goal_weight_kg).toBe(80);
    const upd = setProfile(db, { activity_factor: 1.6 });
    expect(upd.activity_factor).toBe(1.6);
    expect(upd.birth_date).toBe("2000-01-15");
    expect(upd.goal_date).toBe("2026-10-01");
    const cleared = setProfile(db, { goal_weight_kg: null, goal_date: null });
    expect(cleared.goal_weight_kg).toBeNull();
    expect(cleared.goal_date).toBeNull();
  });

  test("rejects malformed dates", () => {
    expect(() =>
      setProfile(db, { birth_date: "15/01/2000", sex: "man", height_cm: 180, activity_factor: 1.5 }),
    ).toThrow(/datum/i);
  });
});
