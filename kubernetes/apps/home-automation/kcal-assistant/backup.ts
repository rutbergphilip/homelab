// Nightly SQLite backup: open read-only, serialize a consistent snapshot,
// write to /backups with weekday rotation (7 files, overwritten weekly).
import { Database } from "bun:sqlite";

const srcPath = process.env.SRC ?? "/data/kcal.db";
const src = new Database(srcPath, { readonly: true });
const snapshot = src.serialize();
src.close();

const weekday = new Date()
  .toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Stockholm" })
  .toLowerCase();
const dest = `/backups/kcal-${weekday}.db`;
await Bun.write(dest, snapshot);

// Restore check: the snapshot must open and contain the products table.
const check = new Database(dest, { readonly: true });
const row = check.query<{ n: number }, []>("SELECT count(*) AS n FROM products").get();
check.close();

console.log(`backup ok: ${dest} (${snapshot.byteLength} bytes, ${row?.n} products)`);
