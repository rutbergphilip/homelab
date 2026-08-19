import type { Database } from "bun:sqlite";
import { isValidDate } from "../../core/tool-util";

export const JOKES_MIGRATIONS: string[] = [
  // 1: initial schema + the four starting contexts
  `
  CREATE TABLE jokes (
    id          INTEGER PRIMARY KEY,
    text        TEXT NOT NULL,
    translation TEXT,
    activation  TEXT NOT NULL CHECK (activation IN ('active','trigger')),
    type        TEXT,
    risk        INTEGER NOT NULL CHECK (risk BETWEEN 1 AND 5),
    delivery    TEXT NOT NULL,
    notes       TEXT,
    retired     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE joke_triggers (
    id          INTEGER PRIMARY KEY,
    joke_id     INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
    description TEXT NOT NULL
  );
  CREATE INDEX idx_joke_triggers_joke ON joke_triggers(joke_id);

  CREATE TABLE joke_contexts (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  INSERT INTO joke_contexts (name) VALUES ('puben'), ('jobbfika'), ('familjemiddag'), ('gruppchatt');

  CREATE TABLE joke_context_ratings (
    joke_id    INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
    context_id INTEGER NOT NULL REFERENCES joke_contexts(id) ON DELETE CASCADE,
    verdict    TEXT NOT NULL CHECK (verdict IN ('safe','risky','never')),
    PRIMARY KEY (joke_id, context_id)
  );

  CREATE TABLE joke_tellings (
    id         INTEGER PRIMARY KEY,
    joke_id    INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
    told_on    TEXT NOT NULL,
    context_id INTEGER REFERENCES joke_contexts(id) ON DELETE SET NULL,
    audience   TEXT NOT NULL DEFAULT '[]',
    rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
    note       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_joke_tellings_joke ON joke_tellings(joke_id);
  `,
];

export type Activation = "active" | "trigger";
export type Verdict = "safe" | "risky" | "never";

interface JokeRow {
  id: number;
  text: string;
  translation: string | null;
  activation: Activation;
  type: string | null;
  risk: number;
  delivery: string;
  notes: string | null;
  retired: number;
  created_at: string;
  updated_at: string;
}

interface TellingRow {
  id: number;
  joke_id: number;
  told_on: string;
  context_id: number | null;
  audience: string;
  rating: number | null;
  note: string | null;
  created_at: string;
}

export interface JokeStats {
  times_told: number;
  last_told: string | null;
  avg_rating: number | null;
}

export interface JokeView {
  id: number;
  text: string;
  translation: string | null;
  activation: Activation;
  type: string | null;
  risk: number;
  delivery: string;
  notes: string | null;
  retired: boolean;
  created_at: string;
  updated_at: string;
  triggers: string[];
  context_ratings: Record<string, Verdict>;
  stats: JokeStats;
  context_verdict?: Verdict | null;
  heard_by?: string[];
}

export interface TellingView {
  id: number;
  told_on: string;
  context: string | null;
  audience: string[];
  rating: number | null;
  note: string | null;
}

export interface JokeInput {
  text: string;
  translation?: string;
  activation: Activation;
  type?: string;
  risk: number;
  delivery: string;
  notes?: string;
  triggers?: string[];
  context_ratings?: Record<string, Verdict>;
}

export function normalizeAudience(names: string[]): string[] {
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

export function listContexts(db: Database): Array<{ id: number; name: string }> {
  return db.query<{ id: number; name: string }, []>("SELECT id, name FROM joke_contexts ORDER BY id").all();
}

// Contexts are chat-creatable: referencing an unknown name creates it.
export function ensureContext(db: Database, name: string): number {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("context name is empty");
  const existing = db
    .query<{ id: number }, [string]>("SELECT id FROM joke_contexts WHERE name = ? COLLATE NOCASE")
    .get(trimmed);
  if (existing) return existing.id;
  return db.query<{ id: number }, [string]>("INSERT INTO joke_contexts (name) VALUES (?) RETURNING id").get(trimmed)!
    .id;
}

function statsFor(db: Database, jokeId: number): JokeStats {
  const row = db
    .query<{ n: number; last: string | null; avg: number | null }, [number]>(
      "SELECT COUNT(*) AS n, MAX(told_on) AS last, AVG(rating) AS avg FROM joke_tellings WHERE joke_id = ?",
    )
    .get(jokeId)!;
  return { times_told: row.n, last_told: row.last, avg_rating: row.avg === null ? null : Math.round(row.avg * 10) / 10 };
}

function jokeView(db: Database, row: JokeRow): JokeView {
  const triggers = db
    .query<{ description: string }, [number]>("SELECT description FROM joke_triggers WHERE joke_id = ? ORDER BY id")
    .all(row.id)
    .map((t) => t.description);
  const ratings = db
    .query<{ name: string; verdict: Verdict }, [number]>(
      `SELECT c.name, r.verdict FROM joke_context_ratings r
       JOIN joke_contexts c ON c.id = r.context_id WHERE r.joke_id = ? ORDER BY c.id`,
    )
    .all(row.id);
  return {
    ...row,
    retired: row.retired === 1,
    triggers,
    context_ratings: Object.fromEntries(ratings.map((r) => [r.name, r.verdict])),
    stats: statsFor(db, row.id),
  };
}

function getRow(db: Database, id: number): JokeRow {
  const row = db.query<JokeRow, [number]>("SELECT * FROM jokes WHERE id = ?").get(id);
  if (!row) throw new Error(`joke ${id} not found`);
  return row;
}

function replaceTriggers(db: Database, jokeId: number, triggers: string[]): void {
  db.run("DELETE FROM joke_triggers WHERE joke_id = ?", [jokeId]);
  const insert = db.prepare("INSERT INTO joke_triggers (joke_id, description) VALUES (?, ?)");
  for (const t of triggers) {
    const desc = t.trim();
    if (desc) insert.run(jokeId, desc);
  }
}

function replaceContextRatings(db: Database, jokeId: number, ratings: Record<string, Verdict>): void {
  db.run("DELETE FROM joke_context_ratings WHERE joke_id = ?", [jokeId]);
  const insert = db.prepare("INSERT INTO joke_context_ratings (joke_id, context_id, verdict) VALUES (?, ?, ?)");
  for (const [context, verdict] of Object.entries(ratings)) {
    insert.run(jokeId, ensureContext(db, context), verdict);
  }
}

export function addJoke(db: Database, input: JokeInput): JokeView {
  return db.transaction(() => {
    const row = db
      .query<JokeRow, [string, string | null, string, string | null, number, string, string | null]>(
        `INSERT INTO jokes (text, translation, activation, type, risk, delivery, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.text.trim(),
        input.translation ?? null,
        input.activation,
        input.type ?? null,
        input.risk,
        input.delivery.trim(),
        input.notes ?? null,
      );
    if (!row) throw new Error("insert failed");
    if (input.triggers) replaceTriggers(db, row.id, input.triggers);
    if (input.context_ratings) replaceContextRatings(db, row.id, input.context_ratings);
    return jokeView(db, getRow(db, row.id));
  })();
}

export function updateJoke(db: Database, id: number, patch: Partial<JokeInput>): JokeView {
  return db.transaction(() => {
    getRow(db, id); // existence check
    const fields: Array<[column: string, value: string | number | null]> = [];
    if (patch.text !== undefined) fields.push(["text", patch.text.trim()]);
    if (patch.translation !== undefined) fields.push(["translation", patch.translation]);
    if (patch.activation !== undefined) fields.push(["activation", patch.activation]);
    if (patch.type !== undefined) fields.push(["type", patch.type]);
    if (patch.risk !== undefined) fields.push(["risk", patch.risk]);
    if (patch.delivery !== undefined) fields.push(["delivery", patch.delivery.trim()]);
    if (patch.notes !== undefined) fields.push(["notes", patch.notes]);
    if (fields.length > 0) {
      const set = fields.map(([col]) => `${col} = ?`).join(", ");
      db.run(`UPDATE jokes SET ${set}, updated_at = datetime('now') WHERE id = ?`, [
        ...fields.map(([, v]) => v),
        id,
      ]);
    }
    if (patch.triggers) replaceTriggers(db, id, patch.triggers);
    if (patch.context_ratings) replaceContextRatings(db, id, patch.context_ratings);
    return jokeView(db, getRow(db, id));
  })();
}

export function setRetired(db: Database, id: number, retired: boolean): JokeView {
  getRow(db, id);
  db.run("UPDATE jokes SET retired = ?, updated_at = datetime('now') WHERE id = ?", [retired ? 1 : 0, id]);
  return jokeView(db, getRow(db, id));
}

function tellingView(db: Database, row: TellingRow): TellingView {
  const context =
    row.context_id === null
      ? null
      : (db.query<{ name: string }, [number]>("SELECT name FROM joke_contexts WHERE id = ?").get(row.context_id)
          ?.name ?? null);
  return {
    id: row.id,
    told_on: row.told_on,
    context,
    audience: JSON.parse(row.audience) as string[],
    rating: row.rating,
    note: row.note,
  };
}

export function getTellings(db: Database, jokeId: number): TellingView[] {
  return db
    .query<TellingRow, [number]>("SELECT * FROM joke_tellings WHERE joke_id = ? ORDER BY told_on DESC, id DESC")
    .all(jokeId)
    .map((row) => tellingView(db, row));
}

export function getJoke(db: Database, id: number): JokeView & { tellings: TellingView[] } {
  return { ...jokeView(db, getRow(db, id)), tellings: getTellings(db, id) };
}

export function findJokes(
  db: Database,
  opts: { context?: string; audience?: string[]; include_retired?: boolean },
): JokeView[] {
  const rows = db
    .query<JokeRow, []>(`SELECT * FROM jokes ${opts.include_retired ? "" : "WHERE retired = 0"} ORDER BY id`)
    .all();
  const audience = opts.audience ? normalizeAudience(opts.audience) : undefined;
  const views: JokeView[] = [];
  for (const row of rows) {
    const view = jokeView(db, row);
    if (opts.context) {
      // Context names are stored with original casing (UNIQUE NOCASE), so
      // match the ratings key case-insensitively.
      const wanted = opts.context.trim().toLowerCase();
      const key = Object.keys(view.context_ratings).find((k) => k.toLowerCase() === wanted);
      const verdict = key ? view.context_ratings[key]! : null;
      if (verdict === "never") continue;
      view.context_verdict = verdict;
    }
    if (audience) {
      const heard = new Set<string>();
      for (const telling of getTellings(db, row.id)) {
        for (const name of telling.audience) if (audience.includes(name)) heard.add(name);
      }
      view.heard_by = audience.filter((name) => heard.has(name));
    }
    views.push(view);
  }
  return views;
}

export function logTelling(
  db: Database,
  input: { joke_id: number; told_on: string; context?: string; audience?: string[]; rating?: number; note?: string },
): TellingView {
  getRow(db, input.joke_id); // throws "joke N not found"
  if (!isValidDate(input.told_on)) throw new Error(`invalid date: ${input.told_on} (expected YYYY-MM-DD)`);
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating))) {
    throw new Error("rating must be an integer 1-5");
  }
  const contextId = input.context ? ensureContext(db, input.context) : null;
  const audience = normalizeAudience(input.audience ?? []);
  const row = db
    .query<TellingRow, [number, string, number | null, string, number | null, string | null]>(
      `INSERT INTO joke_tellings (joke_id, told_on, context_id, audience, rating, note)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(input.joke_id, input.told_on, contextId, JSON.stringify(audience), input.rating ?? null, input.note ?? null);
  if (!row) throw new Error("insert failed");
  return tellingView(db, row);
}

export function knownAudienceTags(db: Database): string[] {
  const tags = new Set<string>();
  for (const row of db.query<{ audience: string }, []>("SELECT audience FROM joke_tellings").all()) {
    for (const name of JSON.parse(row.audience) as string[]) tags.add(name);
  }
  return [...tags].sort();
}

export interface StatsReport {
  by_rating: Array<{ id: number; text: string; times_told: number; avg_rating: number }>;
  most_told: Array<{ id: number; text: string; times_told: number; last_told: string }>;
  never_told: Array<{ id: number; text: string }>;
  per_context: Array<{ context: string; times_told: number; avg_rating: number | null }>;
  heard_by: Record<string, number[]>;
}

export function jokeStats(db: Database): StatsReport {
  const by_rating = db
    .query<{ id: number; text: string; times_told: number; avg_rating: number }, []>(
      `SELECT j.id, j.text, COUNT(t.id) AS times_told, ROUND(AVG(t.rating), 1) AS avg_rating
       FROM jokes j JOIN joke_tellings t ON t.joke_id = j.id
       WHERE t.rating IS NOT NULL GROUP BY j.id ORDER BY avg_rating DESC, times_told DESC`,
    )
    .all();
  const most_told = db
    .query<{ id: number; text: string; times_told: number; last_told: string }, []>(
      `SELECT j.id, j.text, COUNT(t.id) AS times_told, MAX(t.told_on) AS last_told
       FROM jokes j JOIN joke_tellings t ON t.joke_id = j.id
       GROUP BY j.id ORDER BY times_told DESC, last_told DESC`,
    )
    .all();
  const never_told = db
    .query<{ id: number; text: string }, []>(
      `SELECT id, text FROM jokes
       WHERE retired = 0 AND id NOT IN (SELECT DISTINCT joke_id FROM joke_tellings) ORDER BY id`,
    )
    .all();
  const per_context = db
    .query<{ context: string; times_told: number; avg_rating: number | null }, []>(
      `SELECT c.name AS context, COUNT(t.id) AS times_told, ROUND(AVG(t.rating), 1) AS avg_rating
       FROM joke_tellings t JOIN joke_contexts c ON c.id = t.context_id
       GROUP BY c.id ORDER BY times_told DESC`,
    )
    .all();
  const heard_by: Record<string, number[]> = {};
  for (const row of db.query<{ joke_id: number; audience: string }, []>(
    "SELECT joke_id, audience FROM joke_tellings",
  ).all()) {
    for (const name of JSON.parse(row.audience) as string[]) {
      heard_by[name] ??= [];
      if (!heard_by[name].includes(row.joke_id)) heard_by[name].push(row.joke_id);
    }
  }
  return { by_rating, most_told, never_told, per_context, heard_by };
}
