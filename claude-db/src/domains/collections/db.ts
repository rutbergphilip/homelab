import type { Database } from "bun:sqlite";

export const COLLECTIONS_MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE collections (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT,
    item_hint   TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE collection_items (
    id            INTEGER PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    data          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_items_collection ON collection_items(collection_id);
  `,
];

interface CollectionRow {
  id: number;
  name: string;
  description: string | null;
  item_hint: string | null;
  created_at: string;
}

interface ItemRow {
  id: number;
  collection_id: number;
  data: string;
  created_at: string;
  updated_at: string;
}

export function createCollection(
  db: Database,
  input: { name: string; description?: string; item_hint?: Record<string, string> },
): CollectionRow {
  const row = db
    .query<CollectionRow, [string, string | null, string | null]>(
      "INSERT INTO collections (name, description, item_hint) VALUES (?, ?, ?) RETURNING *",
    )
    .get(input.name.trim(), input.description ?? null, input.item_hint ? JSON.stringify(input.item_hint) : null);
  if (!row) throw new Error("insert failed");
  return row;
}

export function listCollections(db: Database): Array<Record<string, unknown>> {
  return db
    .query<CollectionRow & { item_count: number }, []>(
      `SELECT c.*, COUNT(i.id) AS item_count
       FROM collections c LEFT JOIN collection_items i ON i.collection_id = c.id
       GROUP BY c.id ORDER BY c.name`,
    )
    .all()
    .map((r) => ({ ...r, item_hint: r.item_hint ? JSON.parse(r.item_hint) : null }));
}

export function resolveCollection(db: Database, ref: { id?: number; name?: string }): CollectionRow {
  if (ref.id !== undefined) {
    const row = db.query<CollectionRow, [number]>("SELECT * FROM collections WHERE id = ?").get(ref.id);
    if (!row) throw new Error(`collection ${ref.id} not found`);
    return row;
  }
  if (!ref.name) throw new Error("provide id or name");
  const row = db
    .query<CollectionRow, [string]>("SELECT * FROM collections WHERE name = ? COLLATE NOCASE")
    .get(ref.name.trim());
  if (!row) throw new Error(`collection "${ref.name}" not found`);
  return row;
}

export function deleteCollection(db: Database, id: number): void {
  const changes = db.run("DELETE FROM collections WHERE id = ?", [id]).changes;
  if (changes === 0) throw new Error(`collection ${id} not found`);
}

function itemView(row: ItemRow): Record<string, unknown> {
  return { id: row.id, data: JSON.parse(row.data), created_at: row.created_at, updated_at: row.updated_at };
}

export function addItem(db: Database, collectionId: number, data: Record<string, unknown>): Record<string, unknown> {
  const row = db
    .query<ItemRow, [number, string]>(
      "INSERT INTO collection_items (collection_id, data) VALUES (?, ?) RETURNING *",
    )
    .get(collectionId, JSON.stringify(data));
  if (!row) throw new Error("insert failed");
  return itemView(row);
}

// Shallow merge patch; a null value deletes that key.
export function updateItem(db: Database, itemId: number, patch: Record<string, unknown>): Record<string, unknown> {
  const existing = db.query<ItemRow, [number]>("SELECT * FROM collection_items WHERE id = ?").get(itemId);
  if (!existing) throw new Error(`item ${itemId} not found`);
  const data = JSON.parse(existing.data) as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete data[key];
    else data[key] = value;
  }
  const row = db
    .query<ItemRow, [string, number]>(
      "UPDATE collection_items SET data = ?, updated_at = datetime('now') WHERE id = ? RETURNING *",
    )
    .get(JSON.stringify(data), itemId);
  return itemView(row!);
}

export function deleteItem(db: Database, itemId: number): void {
  const changes = db.run("DELETE FROM collection_items WHERE id = ?", [itemId]).changes;
  if (changes === 0) throw new Error(`item ${itemId} not found`);
}

export function queryItems(
  db: Database,
  collectionId: number,
  opts: { where?: Record<string, unknown>; search?: string; limit?: number; offset?: number },
): Record<string, unknown> {
  type SqlParams = Record<string, string | number | boolean | null>;
  const conditions: string[] = ["collection_id = $cid"];
  const params: SqlParams = { $cid: collectionId };
  let i = 0;
  for (const [key, value] of Object.entries(opts.where ?? {})) {
    // json_extract path comes from the key; guard it to a safe charset since
    // it cannot be a bound parameter inside the path string.
    if (!/^[A-Za-z0-9_ .-]+$/.test(key)) throw new Error(`invalid field name: ${key}`);
    conditions.push(`json_extract(data, '$.${key}') = $w${i}`);
    params[`$w${i}`] = value as string | number | boolean | null;
    i++;
  }
  if (opts.search) {
    conditions.push("data LIKE '%' || $search || '%' COLLATE NOCASE");
    params["$search"] = opts.search;
  }
  const rows = db
    .query<ItemRow, SqlParams>(
      `SELECT * FROM collection_items WHERE ${conditions.join(" AND ")}
       ORDER BY id DESC LIMIT $limit OFFSET $offset`,
    )
    .all({ ...params, $limit: opts.limit ?? 50, $offset: opts.offset ?? 0 });
  const total = db
    .query<{ n: number }, SqlParams>(
      `SELECT COUNT(*) AS n FROM collection_items WHERE ${conditions.join(" AND ")}`,
    )
    .get(params)!.n;
  return { total, items: rows.map(itemView) };
}
