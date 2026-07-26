import type { Database } from "bun:sqlite";

// Negative rows (bytes IS NULL) are retried after this long: ICA's range does
// change, and a product we could not place in July may exist in October.
const NEGATIVE_TTL_DAYS = 30;

export interface StoredImage {
  bytes: Uint8Array;
  content_type: string;
  fetched_at: string;
}

export interface ImageStatus {
  product_id: number;
  has_image: boolean;
  source_ref: string | null;
  matched_name: string | null;
  score: number | null;
  locked: boolean;
  fetched_at: string;
}

interface ImageRow {
  product_id: number;
  bytes: Uint8Array | null;
  content_type: string | null;
  source_ref: string | null;
  matched_name: string | null;
  score: number | null;
  locked: number;
  fetched_at: string;
}

export function getProductImage(db: Database, productId: number): StoredImage | null {
  const row = db
    .query<Pick<ImageRow, "bytes" | "content_type" | "fetched_at">, [number]>(
      "SELECT bytes, content_type, fetched_at FROM product_images WHERE product_id = ?",
    )
    .get(productId);
  if (!row || row.bytes === null) return null;
  return {
    bytes: row.bytes,
    content_type: row.content_type ?? "application/octet-stream",
    fetched_at: row.fetched_at,
  };
}

export function getImageStatus(db: Database, productId: number): ImageStatus | null {
  const row = db
    .query<ImageRow, [number]>("SELECT * FROM product_images WHERE product_id = ?")
    .get(productId);
  if (!row) return null;
  return {
    product_id: row.product_id,
    has_image: row.bytes !== null,
    source_ref: row.source_ref,
    matched_name: row.matched_name,
    score: row.score,
    locked: row.locked === 1,
    fetched_at: row.fetched_at,
  };
}

/** Product ids that currently have bytes — one query, so the list endpoint stays O(1) in round trips. */
export function productIdsWithImage(db: Database): Set<number> {
  const rows = db
    .query<{ product_id: number }, []>("SELECT product_id FROM product_images WHERE bytes IS NOT NULL")
    .all();
  return new Set(rows.map((r) => r.product_id));
}

/**
 * Products the backfill should try, oldest-named first. Skips anything with
 * bytes, anything locked, and negative rows still inside their TTL.
 */
export function productsNeedingImage(db: Database, limit = 500): Array<{ id: number; name: string; brand: string | null }> {
  return db
    .query<{ id: number; name: string; brand: string | null }, [number]>(
      `SELECT p.id, p.name, p.brand
         FROM products p
         LEFT JOIN product_images i ON i.product_id = p.id
        WHERE i.product_id IS NULL
           OR (i.bytes IS NULL AND i.locked = 0
               AND i.fetched_at < datetime('now', '-${NEGATIVE_TTL_DAYS} days'))
        ORDER BY p.name COLLATE NOCASE
        LIMIT ?`,
    )
    .all(limit);
}

export function isLocked(db: Database, productId: number): boolean {
  const row = db
    .query<{ locked: number }, [number]>("SELECT locked FROM product_images WHERE product_id = ?")
    .get(productId);
  return row?.locked === 1;
}

export interface SaveImageInput {
  product_id: number;
  bytes: Uint8Array | null;
  content_type?: string | null;
  source_ref?: string | null;
  matched_name?: string | null;
  score?: number | null;
  locked?: boolean;
}

export function saveProductImage(db: Database, input: SaveImageInput): void {
  db.run(
    `INSERT INTO product_images (product_id, bytes, content_type, source, source_ref, matched_name, score, fetched_at, locked)
     VALUES (?, ?, ?, 'ica', ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(product_id) DO UPDATE SET
       bytes = excluded.bytes,
       content_type = excluded.content_type,
       source_ref = excluded.source_ref,
       matched_name = excluded.matched_name,
       score = excluded.score,
       fetched_at = excluded.fetched_at,
       locked = excluded.locked`,
    [
      input.product_id,
      input.bytes ?? null,
      input.content_type ?? null,
      input.source_ref ?? null,
      input.matched_name ?? null,
      input.score ?? null,
      input.locked ? 1 : 0,
    ],
  );
}

export function clearProductImage(db: Database, productId: number): void {
  db.run("DELETE FROM product_images WHERE product_id = ?", [productId]);
}
