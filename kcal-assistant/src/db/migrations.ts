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
  // 2: weight log
  `
  CREATE TABLE weights (
    date       TEXT PRIMARY KEY,
    weight_kg  REAL NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
    note       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  // 3: recipes — ingredient rows store the raw INPUT (portion items keep
  // portion_name+quantity with grams NULL) so macros resolve live at read time
  `
  CREATE TABLE recipes (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    instructions TEXT,
    notes        TEXT,
    tags         TEXT,
    servings     REAL,
    product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE recipe_ingredients (
    id          INTEGER PRIMARY KEY,
    recipe_id   INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    grams REAL, quantity REAL, portion_name TEXT,
    kcal REAL, protein REAL, fat REAL, carbs REAL,
    CHECK ((kcal IS NULL) = (protein IS NULL) AND (kcal IS NULL) = (fat IS NULL) AND (kcal IS NULL) = (carbs IS NULL))
  );
  CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
  `,
  // 4: recipe cooking times (Claude estimates, server stores) + single-row
  // physiological profile used by the weight forecast
  `
  ALTER TABLE recipes ADD COLUMN active_minutes INTEGER;
  ALTER TABLE recipes ADD COLUMN total_minutes INTEGER;

  CREATE TABLE profile (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    birth_date      TEXT NOT NULL,
    sex             TEXT NOT NULL CHECK (sex IN ('man','kvinna')),
    height_cm       REAL NOT NULL CHECK (height_cm > 0),
    activity_factor REAL NOT NULL CHECK (activity_factor >= 1.2 AND activity_factor <= 2.5),
    goal_weight_kg  REAL CHECK (goal_weight_kg > 0),
    goal_date       TEXT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  // 5: canonical forecast snapshots — one per day, weekly curve as JSON.
  // Never pruned: the data is small and feeds accuracy tracking.
  `
  CREATE TABLE forecast_snapshots (
    date               TEXT PRIMARY KEY,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    start_date         TEXT NOT NULL,
    start_kg           REAL NOT NULL,
    intake_kcal        INTEGER NOT NULL,
    intake_source      TEXT NOT NULL,
    tdee_start         INTEGER NOT NULL,
    calibration_offset INTEGER NOT NULL,
    band_kcal          INTEGER NOT NULL,
    curve_json         TEXT NOT NULL
  );
  `,
  // 6: week meal planner — planned meals per date+slot, raw-input items
  // (recipe_ingredients shape, resolved live), day confirm state. Confirm
  // copies planned meals into `meals` and records the link in logged_meal_id.
  `
  CREATE TABLE planned_meals (
    id              INTEGER PRIMARY KEY,
    day_date        TEXT NOT NULL REFERENCES days(date),
    slot            TEXT NOT NULL CHECK (slot IN ('frukost','lunch','middag','mellis')),
    position        INTEGER NOT NULL DEFAULT 0,
    name            TEXT NOT NULL,
    recipe_id       INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    recipe_servings REAL,
    post_gym_shake  INTEGER NOT NULL DEFAULT 0,
    logged_meal_id  INTEGER REFERENCES meals(id) ON DELETE SET NULL,
    note            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_planned_meals_day ON planned_meals(day_date);

  CREATE TABLE planned_meal_items (
    id              INTEGER PRIMARY KEY,
    planned_meal_id INTEGER NOT NULL REFERENCES planned_meals(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL,
    product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description     TEXT NOT NULL,
    grams REAL, quantity REAL, portion_name TEXT,
    kcal REAL, protein REAL, fat REAL, carbs REAL,
    CHECK ((kcal IS NULL) = (protein IS NULL) AND (kcal IS NULL) = (fat IS NULL)
       AND (kcal IS NULL) = (carbs IS NULL))
  );
  CREATE INDEX idx_planned_items_meal ON planned_meal_items(planned_meal_id);

  ALTER TABLE days ADD COLUMN plan_confirmed_at TEXT;
  `,
  // 7: product categories — role the product plays for Philip (not a food
  // taxonomy). Vocabulary lives in src/lib/categories.ts.
  `
  ALTER TABLE products ADD COLUMN category TEXT;
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
