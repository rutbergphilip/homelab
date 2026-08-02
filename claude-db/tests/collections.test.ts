import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import {
  addItem,
  createCollection,
  deleteCollection,
  deleteItem,
  listCollections,
  queryItems,
  resolveCollection,
  updateItem,
} from "../src/domains/collections/db";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

describe("collections", () => {
  test("create, list with counts, case-insensitive resolve", () => {
    const db = freshDb();
    const c = createCollection(db, { name: "Viner", description: "wines tried", item_hint: { name: "string", rating: "1-10" } });
    addItem(db, c.id, { name: "Barolo 2019", rating: 8 });
    const listed = listCollections(db);
    expect(listed).toHaveLength(1);
    expect(listed[0]!["item_count"]).toBe(1);
    expect((listed[0]!["item_hint"] as Record<string, string>)["rating"]).toBe("1-10");
    expect(resolveCollection(db, { name: "viner" }).id).toBe(c.id);
    expect(() => createCollection(db, { name: "VINER" })).toThrow(); // unique nocase
  });

  test("query: where on json field, substring search, pagination", () => {
    const db = freshDb();
    const c = createCollection(db, { name: "böcker" });
    addItem(db, c.id, { title: "Dune", genre: "scifi", rating: 9 });
    addItem(db, c.id, { title: "Project Hail Mary", genre: "scifi", rating: 10 });
    addItem(db, c.id, { title: "Shogun", genre: "historical", rating: 8 });

    const scifi = queryItems(db, c.id, { where: { genre: "scifi" } });
    expect(scifi["total"]).toBe(2);
    const hail = queryItems(db, c.id, { search: "hail" });
    expect(hail["total"]).toBe(1);
    const paged = queryItems(db, c.id, { limit: 2 });
    expect((paged["items"] as unknown[]).length).toBe(2);
    expect(paged["total"]).toBe(3);
    const byRating = queryItems(db, c.id, { where: { rating: 10 } });
    expect(byRating["total"]).toBe(1);
  });

  test("query rejects hostile field names", () => {
    const db = freshDb();
    const c = createCollection(db, { name: "x" });
    expect(() => queryItems(db, c.id, { where: { "a') OR 1=1 --": 1 } })).toThrow(/invalid field/);
  });

  test("update merge patch with null-deletes; delete item; cascade on collection delete", () => {
    const db = freshDb();
    const c = createCollection(db, { name: "gifts" });
    const item = addItem(db, c.id, { idea: "watch", for: "mamma", done: false });
    const patched = updateItem(db, item["id"] as number, { done: true, for: null });
    const data = patched["data"] as Record<string, unknown>;
    expect(data["done"]).toBe(true);
    expect("for" in data).toBe(false);

    const second = addItem(db, c.id, { idea: "wine" });
    deleteItem(db, second["id"] as number);
    expect(queryItems(db, c.id, {})["total"]).toBe(1);

    deleteCollection(db, c.id);
    expect(db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM collection_items").get()!.n).toBe(0);
  });
});
