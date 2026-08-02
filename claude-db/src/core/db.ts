import { Database } from "bun:sqlite";
import type { Domain } from "./domain";

// Core's own migrations live under a reserved domain name that can never
// collide with a real Domain (registry rejects names starting with "_").
const CORE_DOMAIN = "_core";
const CORE_MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     domain     TEXT NOT NULL,
     version    INTEGER NOT NULL,
     applied_at TEXT NOT NULL DEFAULT (datetime('now')),
     PRIMARY KEY (domain, version)
   );`,
];

function appliedVersion(db: Database, domain: string): number {
  const row = db
    .query<{ v: number | null }, [string]>(
      "SELECT MAX(version) AS v FROM schema_migrations WHERE domain = ?",
    )
    .get(domain);
  return row?.v ?? 0;
}

function apply(db: Database, domain: string, migrations: string[]): void {
  const current = appliedVersion(db, domain);
  for (let i = current; i < migrations.length; i++) {
    const version = i + 1;
    db.transaction(() => {
      db.run(migrations[i]!);
      db.run("INSERT INTO schema_migrations (domain, version) VALUES (?, ?)", [domain, version]);
    })();
  }
}

export function migrate(db: Database, domains: Domain[]): void {
  // Bootstrap: schema_migrations must exist before we can track anything,
  // hence IF NOT EXISTS on the table itself plus INSERT OR IGNORE bookkeeping.
  db.run(CORE_MIGRATIONS[0]!);
  db.run("INSERT OR IGNORE INTO schema_migrations (domain, version) VALUES (?, 1)", [CORE_DOMAIN]);
  for (const domain of domains) {
    apply(db, domain.name, domain.migrations);
  }
}

export function openDb(path: string, domains: Domain[]): Database {
  const db = new Database(path, { create: true });
  // SQLite-on-NFS safety (same as kcal-assistant): TRUNCATE journal (WAL
  // needs shared mmap, unsafe on NFS) + FULL sync. Single k8s replica with
  // strategy Recreate guarantees one writer process.
  db.run("PRAGMA journal_mode = TRUNCATE");
  db.run("PRAGMA synchronous = FULL");
  db.run("PRAGMA busy_timeout = 5000");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, domains);
  return db;
}
