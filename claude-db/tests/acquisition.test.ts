import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import {
  addFragrance,
  buildAcquisitionContext,
  deletePreference,
  getFragranceDetail,
  listPreferences,
  logWear,
  resolveFragrance,
  saveOffer,
  savePreference,
  saveSnapshot,
} from "../src/domains/fragrance/db";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

const SNAPSHOT = JSON.stringify({
  rating: 4.5,
  accords: [{ name: "vanilla", strength: 100 }, { name: "sweet", strength: 80 }],
  seasons: { winter: 100, summer: 10 },
});

describe("preferences", () => {
  test("save, list active only, deactivate", () => {
    const db = freshDb();
    const p = savePreference(db, "gillar", "boozy vanilj på vintern");
    savePreference(db, "budget", "max ~2500 kr");
    expect(listPreferences(db)).toHaveLength(2);
    deletePreference(db, p.id);
    expect(listPreferences(db)).toHaveLength(1);
    expect(() => deletePreference(db, p.id)).toThrow(/not found/);
  });

  test("invalid category rejected by CHECK", () => {
    const db = freshDb();
    expect(() => savePreference(db, "nonsense", "x")).toThrow();
  });
});

describe("offers", () => {
  test("save + appear in detail, retailer normalized", () => {
    const db = freshDb();
    const f = addFragrance(db, { house: "Creed", name: "Aventus", status: "wishlist" });
    saveOffer(db, { fragrance_id: f.id, retailer: " Kicks ", price_sek: 2625, size_ml: 50, url: "https://kicks.se/x" });
    const detail = getFragranceDetail(db, resolveFragrance(db, { id: f.id }));
    const offers = detail["offers"] as Array<{ retailer: string; price_sek: number }>;
    expect(offers).toHaveLength(1);
    expect(offers[0]!.retailer).toBe("kicks");
    expect(offers[0]!.price_sek).toBe(2625);
  });

  test("cascade with fragrance delete", () => {
    const db = freshDb();
    const f = addFragrance(db, { house: "X", name: "Y", status: "wishlist" });
    saveOffer(db, { fragrance_id: f.id, retailer: "notino", price_sek: 999 });
    db.run("DELETE FROM fragrances WHERE id = ?", [f.id]);
    expect(db.query<{ n: number }, []>("SELECT COUNT(*) n FROM fragrance_offers").get()!.n).toBe(0);
  });
});

describe("acquisition context", () => {
  test("combines preferences, coverage, wishlist offers, wear stats", () => {
    const db = freshDb();
    savePreference(db, "gillar", "vanilj");
    const owned = addFragrance(db, { house: "JPG", name: "Le Male Elixir" });
    saveSnapshot(db, owned.id, SNAPSHOT);
    logWear(db, { fragrance_id: owned.id, worn_on: "2026-07-01", rating: 9 });
    const wish = addFragrance(db, { house: "Creed", name: "Aventus", status: "wishlist" });
    saveSnapshot(db, wish.id, SNAPSHOT);
    saveOffer(db, { fragrance_id: wish.id, retailer: "kicks", price_sek: 2625, size_ml: 50 });

    const ctx = buildAcquisitionContext(db, "2026-08-02");
    expect((ctx["preferences"] as unknown[]).length).toBe(1);
    const coverage = ctx["accord_coverage"] as Record<string, number>;
    expect(coverage["vanilla"]).toBe(1); // owned only — wishlist doesn't count as coverage
    const collection = ctx["collection"] as Array<Record<string, unknown>>;
    expect(collection).toHaveLength(1);
    expect((collection[0]!["wear_stats"] as { avg_rating: number }).avg_rating).toBe(9);
    const wishlist = ctx["wishlist"] as Array<{ offers: Array<{ retailer: string }> }>;
    expect(wishlist).toHaveLength(1);
    expect(wishlist[0]!.offers[0]!.retailer).toBe("kicks");
  });
});
