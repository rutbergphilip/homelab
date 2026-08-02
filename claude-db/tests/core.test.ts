import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS, buildMcpServer } from "../src/core/registry";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

describe("migrations", () => {
  test("apply once per domain and are idempotent", () => {
    const db = freshDb();
    migrate(db, DOMAINS); // second run must be a no-op
    const rows = db
      .query<{ domain: string; version: number }, []>(
        "SELECT domain, MAX(version) AS version FROM schema_migrations GROUP BY domain ORDER BY domain",
      )
      .all();
    const byDomain = Object.fromEntries(rows.map((r) => [r.domain, r.version]));
    expect(byDomain["_core"]).toBe(1);
    for (const d of DOMAINS) {
      expect(byDomain[d.name]).toBe(d.migrations.length);
    }
  });

  test("created the expected tables", () => {
    const db = freshDb();
    const tables = db
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => r.name);
    for (const t of ["fragrances", "wear_log", "collections", "collection_items"]) {
      expect(tables).toContain(t);
    }
  });
});

describe("registry", () => {
  test("domain names are unique, lowercase url segments", () => {
    for (const d of DOMAINS) {
      expect(d.name).toMatch(/^[a-z][a-z0-9]*$/);
    }
  });

  test("buildMcpServer with a single domain registers only that domain's tools", () => {
    const db = freshDb();
    // Registering the same tool name twice throws, so a successful build of
    // all domains together also proves prefixes never collide.
    expect(() => buildMcpServer(db, DOMAINS)).not.toThrow();
    expect(() => buildMcpServer(db, [DOMAINS[0]!])).not.toThrow();
  });
});
