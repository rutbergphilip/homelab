import { Database } from "bun:sqlite";
import { migrate } from "./migrations";
import { config } from "../config";

export function openDb(path: string): Database {
  const db = new Database(path, { create: true });
  // SQLite-on-NFS safety: TRUNCATE journal (WAL needs shared mmap, unsafe on
  // NFS) + FULL sync. Single k8s replica with strategy Recreate guarantees
  // one writer process.
  db.run("PRAGMA journal_mode = TRUNCATE");
  db.run("PRAGMA synchronous = FULL");
  db.run("PRAGMA busy_timeout = 5000");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

let singleton: Database | undefined;

export function getDb(): Database {
  singleton ??= openDb(config.dbPath);
  return singleton;
}
