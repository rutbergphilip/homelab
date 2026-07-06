import type { Database } from "bun:sqlite";

// Ordered migrations tracked via PRAGMA user_version. Append-only; no down
// migrations (single user — restore from backup instead).
const MIGRATIONS: string[] = [
  // 1: initial schema + seeds
  `
  CREATE TABLE products (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    brand        TEXT,
    kcal_100g    REAL, protein_100g REAL, fat_100g REAL, carbs_100g REAL,
    notes        TEXT,
    verified     INTEGER NOT NULL DEFAULT 1,
    source       TEXT NOT NULL DEFAULT 'manual',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE product_aliases (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias      TEXT NOT NULL COLLATE NOCASE
  );
  CREATE INDEX idx_aliases_product ON product_aliases(product_id);

  CREATE TABLE product_portions (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       TEXT NOT NULL COLLATE NOCASE,
    grams      REAL,
    kcal REAL, protein REAL, fat REAL, carbs REAL
  );
  CREATE INDEX idx_portions_product ON product_portions(product_id);

  CREATE VIRTUAL TABLE products_fts USING fts5(
    name, brand, aliases, notes,
    tokenize = "unicode61 remove_diacritics 2"
  );

  CREATE TABLE days (
    date     TEXT PRIMARY KEY,
    day_type TEXT NOT NULL DEFAULT 'vilodag'
             CHECK (day_type IN ('vilodag','gymdag','flexdag')),
    note     TEXT
  );

  CREATE TABLE day_targets (
    day_type    TEXT PRIMARY KEY CHECK (day_type IN ('vilodag','gymdag','flexdag')),
    kcal        INTEGER NOT NULL,
    protein_min REAL NOT NULL,
    fat_min     REAL NOT NULL,
    carbs       REAL
  );

  CREATE TABLE meals (
    id             INTEGER PRIMARY KEY,
    day_date       TEXT NOT NULL REFERENCES days(date),
    name           TEXT NOT NULL,
    post_gym_shake INTEGER NOT NULL DEFAULT 0,
    logged_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_meals_day ON meals(day_date);

  CREATE TABLE meal_items (
    id           INTEGER PRIMARY KEY,
    meal_id      INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description  TEXT NOT NULL,
    grams        REAL, quantity REAL, portion_name TEXT,
    kcal REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, carbs REAL NOT NULL
  );
  CREATE INDEX idx_items_meal ON meal_items(meal_id);

  CREATE TABLE preferences (
    id         INTEGER PRIMARY KEY,
    category   TEXT NOT NULL DEFAULT 'regel',
    content    TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    active     INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Placeholder targets; Philip corrects them via set_targets.
  INSERT INTO day_targets (day_type, kcal, protein_min, fat_min, carbs) VALUES
    ('vilodag', 2000, 180, 60, NULL),
    ('gymdag',  2400, 180, 60, NULL),
    ('flexdag', 2600, 160, 50, NULL);

  INSERT INTO preferences (category, content, sort_order) VALUES
    ('stil',  'Svara alltid på svenska', 10),
    ('stil',  'Använd aldrig tankstreck', 20),
    ('stil',  'Svara kort och sifferdrivet', 30),
    ('stil',  'Vid varje loggad måltid: visa alla fyra makron (kcal, protein, fett, kolhydrater), betyg 1-10 med kort motivering, och löpande dagssumma mot dagens mål', 40),
    ('regel', 'Räkna högt: avrunda kcal, fett och kolhydrater uppåt vid osäkerhet, protein nedåt', 50),
    ('regel', 'Osäkra eller uppskattade produktvärden markeras som overifierade', 60),
    ('regel', 'Ingen kompensation dagen efter en flexdag', 70),
    ('regel', 'Post-gym-shaken listas alltid sist i dagslistan', 80);
  `,
];

export function migrate(db: Database): void {
  const current = db.query<{ user_version: number }, []>("PRAGMA user_version").get()!
    .user_version;
  for (let version = current + 1; version <= MIGRATIONS.length; version++) {
    const sql = MIGRATIONS[version - 1]!;
    db.transaction(() => {
      db.run(sql);
      db.run(`PRAGMA user_version = ${version}`);
    })();
  }
}
