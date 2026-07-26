import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { logWeight } from "../src/db/weights";

// The automatic Withings weigh-in path (see the 2026-07-26 health integration
// spec, §5.2). These invariants live in SQL rather than in the HA automation,
// which is what lets the automation be dumb and idempotent — it may fire twice
// for one weigh-in, or re-fire after an HA restart, with no effect.

let db: Database;
beforeEach(() => {
  db = openDb(":memory:");
});

const DATE = "2026-07-26";

function storedRow(date: string): { weight_kg: number; source: string; note: string | null } {
  return db
    .query<{ weight_kg: number; source: string; note: string | null }, [string]>(
      "SELECT weight_kg, source, note FROM weights WHERE date = ?",
    )
    .get(date)!;
}

describe("weights.source", () => {
  test("a chat-logged weight is recorded as manual", () => {
    logWeight(db, { weight_kg: 79.9, date: DATE });
    expect(storedRow(DATE).source).toBe("manual");
  });

  test("a Withings weigh-in is recorded as withings and reports applied", () => {
    const result = logWeight(db, { weight_kg: 79.91, date: DATE, source: "withings" });
    expect(storedRow(DATE)).toMatchObject({ weight_kg: 79.91, source: "withings" });
    expect(result.applied).toBe(true);
  });
});

describe("first weigh-in of the day wins", () => {
  test("a second Withings weigh-in the same day does not move the stored value", () => {
    logWeight(db, { weight_kg: 79.91, date: DATE, source: "withings" });
    const second = logWeight(db, { weight_kg: 80.4, date: DATE, source: "withings" });

    expect(storedRow(DATE).weight_kg).toBe(79.91);
    expect(second.applied).toBe(false);
  });
});

describe("manual always wins", () => {
  test("a chat correction overwrites an automatic value and takes ownership of the date", () => {
    logWeight(db, { weight_kg: 79.91, date: DATE, source: "withings" });
    const correction = logWeight(db, { weight_kg: 79.5, date: DATE, note: "efter flexhelg" });

    expect(storedRow(DATE)).toMatchObject({
      weight_kg: 79.5,
      source: "manual",
      note: "efter flexhelg",
    });
    expect(correction.applied).toBe(true);
  });

  test("a later Withings weigh-in cannot revert a chat correction", () => {
    logWeight(db, { weight_kg: 79.91, date: DATE, source: "withings" });
    logWeight(db, { weight_kg: 79.5, date: DATE });
    const auto = logWeight(db, { weight_kg: 80.4, date: DATE, source: "withings" });

    expect(storedRow(DATE)).toMatchObject({ weight_kg: 79.5, source: "manual" });
    expect(auto.applied).toBe(false);
  });

  test("manual still overwrites manual — the existing correction path is preserved", () => {
    logWeight(db, { weight_kg: 79.9, date: DATE, note: "morgon" });
    logWeight(db, { weight_kg: 79.7, date: DATE });

    // Re-logging without a note keeps the old note (pre-existing behaviour).
    expect(storedRow(DATE)).toMatchObject({ weight_kg: 79.7, source: "manual", note: "morgon" });
  });
});

describe("validation applies to the automatic path too", () => {
  test("an implausible scale reading is rejected rather than stored", () => {
    expect(() => logWeight(db, { weight_kg: 0, date: DATE, source: "withings" })).toThrow(/vikt/i);
    expect(() => logWeight(db, { weight_kg: 600, date: DATE, source: "withings" })).toThrow(/vikt/i);
    expect(db.query("SELECT count(*) AS n FROM weights").get()).toMatchObject({ n: 0 });
  });
});
