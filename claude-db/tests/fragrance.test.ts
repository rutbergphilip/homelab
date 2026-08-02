import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import {
  addFragrance,
  buildContext,
  getFragranceDetail,
  listFragrances,
  logWear,
  removeFragrance,
  resolveFragrance,
  saveSnapshot,
  updateFragrance,
  wearHistory,
} from "../src/domains/fragrance/db";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

const SNAPSHOT = JSON.stringify({
  rating: 4.4,
  rating_count: 12345,
  accords: [{ name: "vanilla", strength: 100 }, { name: "aromatic", strength: 62 }],
  notes: { top: ["Lavender"], heart: ["Vanilla"], base: ["Benzoin"] },
  seasons: { winter: 92, spring: 40, summer: 12, fall: 78, day: 45, night: 95 },
  longevity: { "long lasting": 40, eternal: 20 },
  sillage: { enormous: 30 },
  gender_vote: { male: 80 },
  price_value: { "good value": 50 },
  description: "A bold gourmand.",
});

describe("fragrance crud", () => {
  test("add, list, update, remove", () => {
    const db = freshDb();
    const f = addFragrance(db, { house: "Jean Paul Gaultier", name: "Le Male Elixir" });
    expect(f.status).toBe("owned");
    expect(listFragrances(db, "owned")).toHaveLength(1);

    const updated = updateFragrance(db, f.id, { status: "finished", personal_notes: "vinterkung" });
    expect(updated.status).toBe("finished");
    expect(listFragrances(db, "owned")).toHaveLength(0);

    removeFragrance(db, f.id);
    expect(listFragrances(db)).toHaveLength(0);
    expect(() => removeFragrance(db, f.id)).toThrow(/not found/);
  });

  test("duplicate house+name rejected", () => {
    const db = freshDb();
    addFragrance(db, { house: "Prada", name: "Paradigme" });
    expect(() => addFragrance(db, { house: "Prada", name: "Paradigme" })).toThrow();
  });

  test("resolve by fuzzy name; ambiguous throws with candidates", () => {
    const db = freshDb();
    addFragrance(db, { house: "Creed", name: "Absolu Aventus" });
    addFragrance(db, { house: "Creed", name: "Aventus" });
    expect(resolveFragrance(db, { name: "absolu" }).name).toBe("Absolu Aventus");
    expect(() => resolveFragrance(db, { name: "aventus" })).toThrow(/ambiguous/);
    expect(() => resolveFragrance(db, { name: "sauvage" })).toThrow(/no fragrance/);
  });
});

describe("snapshot", () => {
  test("save + read back through detail", () => {
    const db = freshDb();
    const f = addFragrance(db, { house: "By Kilian", name: "Angels' Share" });
    const saved = saveSnapshot(db, f.id, SNAPSHOT);
    expect(saved.fragrantica_scraped_at).not.toBeNull();
    const detail = getFragranceDetail(db, resolveFragrance(db, { id: f.id }));
    expect((detail["fragrantica"] as { rating: number }).rating).toBe(4.4);
    expect(detail["fragrantica_json"]).toBeUndefined(); // raw blob not duplicated
  });
});

describe("wear journal", () => {
  test("log, history filters, aggregates", () => {
    const db = freshDb();
    const a = addFragrance(db, { house: "JPG", name: "Le Male Elixir" });
    const b = addFragrance(db, { house: "YSL", name: "Y EdP" });
    logWear(db, { fragrance_id: a.id, worn_on: "2026-01-10", occasion: "date night", rating: 9 });
    logWear(db, { fragrance_id: a.id, worn_on: "2026-02-14", occasion: "date night", rating: 10 });
    logWear(db, { fragrance_id: b.id, worn_on: "2026-03-01", occasion: "office", rating: 7 });

    const all = wearHistory(db, {});
    expect((all["wears"] as unknown[]).length).toBe(3);
    const dates = wearHistory(db, { occasion: "date" });
    expect((dates["wears"] as unknown[]).length).toBe(2);
    const since = wearHistory(db, { since: "2026-02-01" });
    expect((since["wears"] as unknown[]).length).toBe(2);

    const aggregates = all["aggregates"] as Array<{ fragrance_id: number; wear_count: number; avg_rating: number }>;
    const aAgg = aggregates.find((x) => x.fragrance_id === a.id)!;
    expect(aAgg.wear_count).toBe(2);
    expect(aAgg.avg_rating).toBe(9.5);
  });

  test("wear cascade on fragrance delete", () => {
    const db = freshDb();
    const f = addFragrance(db, { house: "X", name: "Y" });
    logWear(db, { fragrance_id: f.id, worn_on: "2026-01-01" });
    removeFragrance(db, f.id);
    expect((wearHistory(db, {})["wears"] as unknown[]).length).toBe(0);
  });
});

describe("context", () => {
  test("owned-only, includes snapshot essentials and wear stats", () => {
    const db = freshDb();
    const owned = addFragrance(db, { house: "Valentino", name: "Coral Fantasy" });
    saveSnapshot(db, owned.id, SNAPSHOT);
    addFragrance(db, { house: "Dior", name: "Sauvage", status: "wishlist" });
    logWear(db, { fragrance_id: owned.id, worn_on: "2026-07-30", occasion: "office", rating: 8 });

    const ctx = buildContext(db, "2026-08-02");
    expect(ctx["today"]).toBe("2026-08-02");
    const collection = ctx["collection"] as Array<Record<string, unknown>>;
    expect(collection).toHaveLength(1);
    const entry = collection[0]!;
    expect((entry["fragrantica"] as Record<string, unknown>)["seasons"]).toBeDefined();
    const stats = entry["wear_stats"] as Record<string, unknown>;
    expect(stats["wear_count"]).toBe(1);
    expect(stats["last_worn"]).toBe("2026-07-30");
  });
});
