import type { Database } from "bun:sqlite";

type SqlParams = Record<string, string | number | boolean | null>;

export const FRAGRANCE_MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE fragrances (
    id                     INTEGER PRIMARY KEY,
    house                  TEXT NOT NULL,
    name                   TEXT NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'owned'
                           CHECK (status IN ('owned','wishlist','finished','sold')),
    concentration          TEXT,
    size_ml                REAL,
    year                   INTEGER,
    perfumer               TEXT,
    fragrantica_url        TEXT UNIQUE,
    personal_notes         TEXT,
    fragrantica_json       TEXT,
    fragrantica_scraped_at TEXT,
    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (house, name)
  );

  CREATE TABLE wear_log (
    id           INTEGER PRIMARY KEY,
    fragrance_id INTEGER NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    worn_on      TEXT NOT NULL,
    occasion     TEXT,
    weather      TEXT,
    sprays       INTEGER,
    rating       INTEGER CHECK (rating BETWEEN 1 AND 10),
    compliments  TEXT,
    notes        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_wear_fragrance ON wear_log(fragrance_id);
  CREATE INDEX idx_wear_date ON wear_log(worn_on);
  `,
  // 2: acquisition advisor — taste preferences + retail offers
  `
  CREATE TABLE fragrance_preferences (
    id         INTEGER PRIMARY KEY,
    category   TEXT NOT NULL CHECK (category IN ('gillar','ogillar','regel','budget')),
    content    TEXT NOT NULL,
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE fragrance_offers (
    id           INTEGER PRIMARY KEY,
    fragrance_id INTEGER NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    retailer     TEXT NOT NULL,
    url          TEXT,
    price_sek    REAL,
    size_ml      REAL,
    note         TEXT,
    found_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_offers_fragrance ON fragrance_offers(fragrance_id);
  `,
];

export interface FragranceRow {
  id: number;
  house: string;
  name: string;
  status: string;
  concentration: string | null;
  size_ml: number | null;
  year: number | null;
  perfumer: string | null;
  fragrantica_url: string | null;
  personal_notes: string | null;
  fragrantica_json: string | null;
  fragrantica_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WearRow {
  id: number;
  fragrance_id: number;
  worn_on: string;
  occasion: string | null;
  weather: string | null;
  sprays: number | null;
  rating: number | null;
  compliments: string | null;
  notes: string | null;
}

export interface FragranceInput {
  house: string;
  name: string;
  status?: string;
  concentration?: string;
  size_ml?: number;
  year?: number;
  perfumer?: string;
  fragrantica_url?: string;
  personal_notes?: string;
}

function parseSnapshot(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function addFragrance(db: Database, input: FragranceInput, snapshotJson?: string): FragranceRow {
  const row = db
    .query<FragranceRow, SqlParams>(
      `INSERT INTO fragrances (house, name, status, concentration, size_ml, year, perfumer,
                               fragrantica_url, personal_notes, fragrantica_json, fragrantica_scraped_at)
       VALUES ($house, $name, $status, $concentration, $size_ml, $year, $perfumer,
               $url, $personal_notes, $snapshot, CASE WHEN $snapshot IS NULL THEN NULL ELSE datetime('now') END)
       RETURNING *`,
    )
    .get({
      $house: input.house.trim(),
      $name: input.name.trim(),
      $status: input.status ?? "owned",
      $concentration: input.concentration ?? null,
      $size_ml: input.size_ml ?? null,
      $year: input.year ?? null,
      $perfumer: input.perfumer ?? null,
      $url: input.fragrantica_url ?? null,
      $personal_notes: input.personal_notes ?? null,
      $snapshot: snapshotJson ?? null,
    });
  if (!row) throw new Error("insert failed");
  return row;
}

const PATCHABLE = [
  "house",
  "name",
  "status",
  "concentration",
  "size_ml",
  "year",
  "perfumer",
  "fragrantica_url",
  "personal_notes",
] as const;

export function updateFragrance(
  db: Database,
  id: number,
  patch: Partial<Record<(typeof PATCHABLE)[number], unknown>>,
): FragranceRow {
  const sets: string[] = [];
  const params: SqlParams = { $id: id };
  for (const key of PATCHABLE) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = $${key}`);
      params[`$${key}`] = patch[key] as string | number | null;
    }
  }
  if (sets.length === 0) throw new Error("nothing to update");
  sets.push("updated_at = datetime('now')");
  const row = db
    .query<FragranceRow, SqlParams>(
      `UPDATE fragrances SET ${sets.join(", ")} WHERE id = $id RETURNING *`,
    )
    .get(params);
  if (!row) throw new Error(`fragrance ${id} not found`);
  return row;
}

export function removeFragrance(db: Database, id: number): void {
  const changes = db.run("DELETE FROM fragrances WHERE id = ?", [id]).changes;
  if (changes === 0) throw new Error(`fragrance ${id} not found`);
}

export function listFragrances(db: Database, status?: string): Array<Record<string, unknown>> {
  const rows = status
    ? db.query<FragranceRow, [string]>("SELECT * FROM fragrances WHERE status = ? ORDER BY house, name").all(status)
    : db.query<FragranceRow, []>("SELECT * FROM fragrances ORDER BY status, house, name").all();
  return rows.map((r) => ({
    id: r.id,
    house: r.house,
    name: r.name,
    status: r.status,
    concentration: r.concentration,
    size_ml: r.size_ml,
    has_fragrantica_data: r.fragrantica_json !== null,
  }));
}

// Resolve by id, or by case-insensitive substring against "house name".
// Throws with candidates when ambiguous so the LLM can disambiguate.
export function resolveFragrance(db: Database, ref: { id?: number; name?: string }): FragranceRow {
  if (ref.id !== undefined) {
    const row = db.query<FragranceRow, [number]>("SELECT * FROM fragrances WHERE id = ?").get(ref.id);
    if (!row) throw new Error(`fragrance ${ref.id} not found`);
    return row;
  }
  if (!ref.name) throw new Error("provide id or name");
  const matches = db
    .query<FragranceRow, [string]>(
      "SELECT * FROM fragrances WHERE (house || ' ' || name) LIKE '%' || ? || '%' COLLATE NOCASE ORDER BY id",
    )
    .all(ref.name.trim());
  if (matches.length === 1) return matches[0]!;
  if (matches.length === 0) throw new Error(`no fragrance matching "${ref.name}"`);
  throw new Error(
    `ambiguous "${ref.name}": ${matches.map((m) => `${m.id}=${m.house} ${m.name}`).join(", ")}`,
  );
}

export function saveSnapshot(db: Database, id: number, snapshotJson: string): FragranceRow {
  const row = db
    .query<FragranceRow, [string, number]>(
      `UPDATE fragrances
       SET fragrantica_json = ?, fragrantica_scraped_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ? RETURNING *`,
    )
    .get(snapshotJson, id);
  if (!row) throw new Error(`fragrance ${id} not found`);
  return row;
}

export function getFragranceDetail(db: Database, row: FragranceRow): Record<string, unknown> {
  const wears = db
    .query<WearRow, [number]>(
      "SELECT * FROM wear_log WHERE fragrance_id = ? ORDER BY worn_on DESC, id DESC LIMIT 10",
    )
    .all(row.id);
  const offers = db
    .query<OfferRow, [number]>(
      "SELECT * FROM fragrance_offers WHERE fragrance_id = ? ORDER BY found_at DESC, id DESC LIMIT 10",
    )
    .all(row.id);
  const { fragrantica_json, ...rest } = row;
  return { ...rest, fragrantica: parseSnapshot(fragrantica_json), recent_wears: wears, offers };
}

export interface PreferenceRow {
  id: number;
  category: string;
  content: string;
  active: number;
  created_at: string;
}

export function savePreference(db: Database, category: string, content: string): PreferenceRow {
  const row = db
    .query<PreferenceRow, [string, string]>(
      "INSERT INTO fragrance_preferences (category, content) VALUES (?, ?) RETURNING *",
    )
    .get(category, content);
  if (!row) throw new Error("insert failed");
  return row;
}

export function listPreferences(db: Database): PreferenceRow[] {
  return db
    .query<PreferenceRow, []>("SELECT * FROM fragrance_preferences WHERE active = 1 ORDER BY category, id")
    .all();
}

export function deletePreference(db: Database, id: number): void {
  const changes = db.run("UPDATE fragrance_preferences SET active = 0 WHERE id = ? AND active = 1", [id]).changes;
  if (changes === 0) throw new Error(`preference ${id} not found`);
}

export interface OfferRow {
  id: number;
  fragrance_id: number;
  retailer: string;
  url: string | null;
  price_sek: number | null;
  size_ml: number | null;
  note: string | null;
  found_at: string;
}

export interface OfferInput {
  fragrance_id: number;
  retailer: string;
  url?: string;
  price_sek?: number;
  size_ml?: number;
  note?: string;
}

export function saveOffer(db: Database, input: OfferInput): OfferRow {
  const row = db
    .query<OfferRow, SqlParams>(
      `INSERT INTO fragrance_offers (fragrance_id, retailer, url, price_sek, size_ml, note)
       VALUES ($fid, $retailer, $url, $price, $size, $note) RETURNING *`,
    )
    .get({
      $fid: input.fragrance_id,
      $retailer: input.retailer.toLowerCase().trim(),
      $url: input.url ?? null,
      $price: input.price_sek ?? null,
      $size: input.size_ml ?? null,
      $note: input.note ?? null,
    });
  if (!row) throw new Error("insert failed");
  return row;
}

// Advisor payload: taste + collection profile + wishlist w/ offers, one call.
export function buildAcquisitionContext(db: Database, today: string): Record<string, unknown> {
  const preferences = listPreferences(db).map((p) => ({ id: p.id, category: p.category, content: p.content }));

  const owned = db
    .query<FragranceRow, []>("SELECT * FROM fragrances WHERE status = 'owned' ORDER BY house, name")
    .all();
  const wearStats = new Map<number, { wear_count: number; last_worn: string; avg_rating: number | null }>();
  for (const s of db
    .query<{ fragrance_id: number; wear_count: number; last_worn: string; avg_rating: number | null }, []>(
      "SELECT fragrance_id, COUNT(*) AS wear_count, MAX(worn_on) AS last_worn, ROUND(AVG(rating),1) AS avg_rating FROM wear_log GROUP BY fragrance_id",
    )
    .all()) {
    wearStats.set(s.fragrance_id, s);
  }

  const accordCoverage: Record<string, number> = {};
  const collection = owned.map((r) => {
    const snapshot = parseSnapshot(r.fragrantica_json) as {
      accords?: Array<{ name: string; strength: number | null }>;
      seasons?: Record<string, number | null>;
      rating?: number;
    } | null;
    for (const a of snapshot?.accords ?? []) {
      accordCoverage[a.name] = (accordCoverage[a.name] ?? 0) + 1;
    }
    return {
      id: r.id,
      house: r.house,
      name: r.name,
      personal_notes: r.personal_notes,
      rating: snapshot?.rating ?? null,
      accords: (snapshot?.accords ?? []).slice(0, 5).map((a) => a.name),
      seasons: snapshot?.seasons ?? null,
      wear_stats: wearStats.get(r.id) ?? null,
    };
  });

  const wishlist = db
    .query<FragranceRow, []>("SELECT * FROM fragrances WHERE status = 'wishlist' ORDER BY house, name")
    .all()
    .map((r) => {
      const snapshot = parseSnapshot(r.fragrantica_json) as { rating?: number; accords?: Array<{ name: string }> } | null;
      const offers = db
        .query<OfferRow, [number]>(
          "SELECT * FROM fragrance_offers WHERE fragrance_id = ? ORDER BY found_at DESC, id DESC LIMIT 5",
        )
        .all(r.id)
        .map((o) => ({ retailer: o.retailer, price_sek: o.price_sek, size_ml: o.size_ml, url: o.url, found_at: o.found_at, note: o.note }));
      return {
        id: r.id,
        house: r.house,
        name: r.name,
        personal_notes: r.personal_notes,
        rating: snapshot?.rating ?? null,
        accords: (snapshot?.accords ?? []).slice(0, 5).map((a) => a.name),
        offers,
      };
    });

  return { today, preferences, collection, accord_coverage: accordCoverage, wishlist };
}

export interface WearInput {
  fragrance_id: number;
  worn_on: string;
  occasion?: string;
  weather?: string;
  sprays?: number;
  rating?: number;
  compliments?: string;
  notes?: string;
}

export function logWear(db: Database, input: WearInput): WearRow {
  const row = db
    .query<WearRow, SqlParams>(
      `INSERT INTO wear_log (fragrance_id, worn_on, occasion, weather, sprays, rating, compliments, notes)
       VALUES ($fid, $worn_on, $occasion, $weather, $sprays, $rating, $compliments, $notes)
       RETURNING *`,
    )
    .get({
      $fid: input.fragrance_id,
      $worn_on: input.worn_on,
      $occasion: input.occasion ?? null,
      $weather: input.weather ?? null,
      $sprays: input.sprays ?? null,
      $rating: input.rating ?? null,
      $compliments: input.compliments ?? null,
      $notes: input.notes ?? null,
    });
  if (!row) throw new Error("insert failed");
  return row;
}

export function wearHistory(
  db: Database,
  filters: { fragrance_id?: number; occasion?: string; since?: string; limit?: number },
): Record<string, unknown> {
  const where: string[] = [];
  const params: SqlParams = {};
  if (filters.fragrance_id !== undefined) {
    where.push("w.fragrance_id = $fid");
    params["$fid"] = filters.fragrance_id;
  }
  if (filters.occasion) {
    where.push("w.occasion LIKE '%' || $occasion || '%' COLLATE NOCASE");
    params["$occasion"] = filters.occasion;
  }
  if (filters.since) {
    where.push("w.worn_on >= $since");
    params["$since"] = filters.since;
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const wears = db
    .query<WearRow & { house: string; fragrance_name: string }, SqlParams>(
      `SELECT w.*, f.house, f.name AS fragrance_name
       FROM wear_log w JOIN fragrances f ON f.id = w.fragrance_id
       ${whereSql}
       ORDER BY w.worn_on DESC, w.id DESC
       LIMIT $limit`,
    )
    .all({ ...params, $limit: filters.limit ?? 50 });
  const aggregates = db
    .query<
      { fragrance_id: number; house: string; name: string; wear_count: number; last_worn: string; avg_rating: number | null },
      []
    >(
      `SELECT f.id AS fragrance_id, f.house, f.name,
              COUNT(w.id) AS wear_count, MAX(w.worn_on) AS last_worn, ROUND(AVG(w.rating), 1) AS avg_rating
       FROM fragrances f JOIN wear_log w ON w.fragrance_id = f.id
       GROUP BY f.id ORDER BY wear_count DESC`,
    )
    .all();
  return { wears, aggregates };
}

// One-call payload for "what should I wear?": the whole owned collection with
// snapshot essentials + per-fragrance wear stats. Small collection, so
// returning everything beats making the LLM page through tools.
export function buildContext(db: Database, today: string): Record<string, unknown> {
  const rows = db
    .query<FragranceRow, []>("SELECT * FROM fragrances WHERE status = 'owned' ORDER BY house, name")
    .all();
  const stats = new Map<number, { wear_count: number; last_worn: string; avg_rating: number | null; occasions: string }>();
  for (const s of db
    .query<
      { fragrance_id: number; wear_count: number; last_worn: string; avg_rating: number | null; occasions: string },
      []
    >(
      `SELECT fragrance_id, COUNT(*) AS wear_count, MAX(worn_on) AS last_worn,
              ROUND(AVG(rating), 1) AS avg_rating,
              GROUP_CONCAT(DISTINCT occasion) AS occasions
       FROM wear_log GROUP BY fragrance_id`,
    )
    .all()) {
    stats.set(s.fragrance_id, s);
  }
  const collection = rows.map((r) => {
    const snapshot = parseSnapshot(r.fragrantica_json) as Record<string, unknown> | null;
    const s = stats.get(r.id);
    return {
      id: r.id,
      house: r.house,
      name: r.name,
      concentration: r.concentration,
      personal_notes: r.personal_notes,
      fragrantica: snapshot
        ? {
            rating: snapshot["rating"],
            accords: snapshot["accords"],
            notes: snapshot["notes"],
            seasons: snapshot["seasons"],
            longevity: snapshot["longevity"],
            sillage: snapshot["sillage"],
          }
        : null,
      wear_stats: s
        ? { wear_count: s.wear_count, last_worn: s.last_worn, avg_rating: s.avg_rating, occasions: s.occasions }
        : { wear_count: 0, last_worn: null, avg_rating: null, occasions: null },
    };
  });
  return { today, collection };
}
