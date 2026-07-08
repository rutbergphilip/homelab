import type { Database } from "bun:sqlite";
import type { Macros } from "../lib/macros";

export interface PortionInput {
  name: string;
  grams?: number | null;
  kcal?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
}

export interface ProductInput {
  id?: number;
  name: string;
  brand?: string | null;
  per_100g?: Macros | null;
  aliases?: string[];
  portions?: PortionInput[];
  notes?: string | null;
  verified?: boolean;
  source?: string;
}

export interface Portion {
  id: number;
  name: string;
  grams: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface Product {
  id: number;
  name: string;
  brand: string | null;
  per_100g: Macros | null;
  aliases: string[];
  portions: Portion[];
  notes: string | null;
  verified: boolean;
  source: string;
  updated_at: string;
}

interface ProductRow {
  id: number;
  name: string;
  brand: string | null;
  kcal_100g: number | null;
  protein_100g: number | null;
  fat_100g: number | null;
  carbs_100g: number | null;
  notes: string | null;
  verified: number;
  source: string;
  updated_at: string;
}

function hydrate(db: Database, row: ProductRow): Product {
  const aliases = db
    .query<{ alias: string }, [number]>(
      "SELECT alias FROM product_aliases WHERE product_id = ? ORDER BY id",
    )
    .all(row.id)
    .map((r) => r.alias);
  const portions = db
    .query<Portion, [number]>(
      "SELECT id, name, grams, kcal, protein, fat, carbs FROM product_portions WHERE product_id = ? ORDER BY id",
    )
    .all(row.id);
  const hasMacros =
    row.kcal_100g !== null &&
    row.protein_100g !== null &&
    row.fat_100g !== null &&
    row.carbs_100g !== null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    per_100g: hasMacros
      ? {
          kcal: row.kcal_100g!,
          protein: row.protein_100g!,
          fat: row.fat_100g!,
          carbs: row.carbs_100g!,
        }
      : null,
    aliases,
    portions,
    notes: row.notes,
    verified: row.verified === 1,
    source: row.source,
    updated_at: row.updated_at,
  };
}

export function getProduct(db: Database, id: number): Product | null {
  const row = db
    .query<ProductRow, [number]>("SELECT * FROM products WHERE id = ?")
    .get(id);
  return row ? hydrate(db, row) : null;
}

function rebuildFtsRow(db: Database, id: number): void {
  db.run("DELETE FROM products_fts WHERE rowid = ?", [id]);
  const row = db
    .query<ProductRow, [number]>("SELECT * FROM products WHERE id = ?")
    .get(id);
  if (!row) return;
  const aliases = db
    .query<{ alias: string }, [number]>("SELECT alias FROM product_aliases WHERE product_id = ?")
    .all(id)
    .map((r) => r.alias)
    .join(" ");
  db.run(
    "INSERT INTO products_fts (rowid, name, brand, aliases, notes) VALUES (?, ?, ?, ?, ?)",
    [id, row.name, row.brand ?? "", aliases, row.notes ?? ""],
  );
}

export function saveProduct(db: Database, input: ProductInput): Product {
  const save = db.transaction(() => {
    let id = input.id;
    const m = input.per_100g;
    if (id) {
      const existing = db
        .query<ProductRow, [number]>("SELECT * FROM products WHERE id = ?")
        .get(id);
      if (!existing) throw new Error(`Product ${id} not found`);
      // PARTIAL update: omitted fields keep their current values so a
      // "just update the note" call can never wipe macros. Empty string
      // explicitly clears a text field.
      const clearable = (value: string | null | undefined, current: string | null) =>
        value === undefined ? current : value === "" ? null : value;
      db.run(
        `UPDATE products SET
           name = ?, brand = ?, kcal_100g = ?, protein_100g = ?, fat_100g = ?, carbs_100g = ?,
           notes = ?, verified = ?, source = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          input.name,
          clearable(input.brand, existing.brand),
          m === undefined ? existing.kcal_100g : m?.kcal ?? null,
          m === undefined ? existing.protein_100g : m?.protein ?? null,
          m === undefined ? existing.fat_100g : m?.fat ?? null,
          m === undefined ? existing.carbs_100g : m?.carbs ?? null,
          clearable(input.notes, existing.notes),
          input.verified === undefined ? existing.verified : input.verified ? 1 : 0,
          input.source ?? existing.source,
          id,
        ],
      );
    } else {
      const result = db.run(
        `INSERT INTO products (name, brand, kcal_100g, protein_100g, fat_100g, carbs_100g, notes, verified, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.brand ?? null,
          m?.kcal ?? null,
          m?.protein ?? null,
          m?.fat ?? null,
          m?.carbs ?? null,
          input.notes ?? null,
          input.verified === false ? 0 : 1,
          input.source ?? "manual",
        ],
      );
      id = Number(result.lastInsertRowid);
    }

    // Aliases/portions replaced wholesale when provided — simplest correct
    // semantics for "rätta på ett ställe".
    if (input.aliases !== undefined) {
      db.run("DELETE FROM product_aliases WHERE product_id = ?", [id]);
      for (const alias of input.aliases) {
        db.run("INSERT INTO product_aliases (product_id, alias) VALUES (?, ?)", [id, alias]);
      }
    }
    if (input.portions !== undefined) {
      db.run("DELETE FROM product_portions WHERE product_id = ?", [id]);
      for (const p of input.portions) {
        db.run(
          "INSERT INTO product_portions (product_id, name, grams, kcal, protein, fat, carbs) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [id, p.name, p.grams ?? null, p.kcal ?? null, p.protein ?? null, p.fat ?? null, p.carbs ?? null],
        );
      }
    }

    rebuildFtsRow(db, id);
    return id;
  });

  const id = save();
  return getProduct(db, id)!;
}

export function searchProducts(db: Database, query: string, limit = 8): Product[] {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const ids: number[] = [];
  const seen = new Set<number>();

  // Pass 1: FTS5 prefix match over name/brand/aliases/notes, bm25-ranked.
  // remove_diacritics 2 makes "vitlokssas" hit "vitlökssås".
  const ftsQuery = tokens.map((t) => `"${t.replace(/"/g, '""')}"*`).join(" OR ");
  const ftsHits = db
    .query<{ rowid: number }, [string, number]>(
      "SELECT rowid FROM products_fts WHERE products_fts MATCH ? ORDER BY bm25(products_fts) LIMIT ?",
    )
    .all(ftsQuery, limit);
  for (const hit of ftsHits) {
    if (!seen.has(hit.rowid)) {
      seen.add(hit.rowid);
      ids.push(hit.rowid);
    }
  }

  // Pass 2: substring fallback for Swedish compound words ("kyckling" inside
  // "Kycklingkebab") and reverse containment for definite forms
  // ("kycklingkebaben" contains alias/name "kycklingkebab").
  if (ids.length < limit) {
    for (const token of tokens) {
      if (token.length < 3) continue;
      const like = `%${token}%`;
      const rows = db
        .query<{ id: number }, [string, string, string, string]>(
          `SELECT DISTINCT p.id FROM products p
           LEFT JOIN product_aliases a ON a.product_id = p.id
           WHERE p.name LIKE ?1 COLLATE NOCASE
              OR a.alias LIKE ?1 COLLATE NOCASE
              OR (length(p.name) >= 5 AND ?2 LIKE '%' || p.name || '%' COLLATE NOCASE)
              OR (length(a.alias) >= 4 AND ?2 LIKE '%' || a.alias || '%' COLLATE NOCASE)
           LIMIT ?3`,
        )
        // @ts-expect-error bun:sqlite positional params tuple typing
        .all(like, token, limit);
      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          ids.push(row.id);
        }
      }
      if (ids.length >= limit) break;
    }
  }

  return ids.slice(0, limit).map((id) => getProduct(db, id)!);
}
