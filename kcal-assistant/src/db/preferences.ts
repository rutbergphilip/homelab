import type { Database } from "bun:sqlite";

export interface Preference {
  id: number;
  category: string;
  content: string;
  sort_order: number;
}

export interface DayTargets {
  day_type: string;
  kcal: number;
  protein_min: number;
  fat_min: number;
  carbs: number | null;
}

export function listPreferences(db: Database): Preference[] {
  return db
    .query<Preference, []>(
      "SELECT id, category, content, sort_order FROM preferences WHERE active = 1 ORDER BY category, sort_order, id",
    )
    .all();
}

export function savePreference(
  db: Database,
  input: { id?: number; content: string; category?: string; sort_order?: number },
): Preference[] {
  if (input.id) {
    const exists = db.query("SELECT 1 FROM preferences WHERE id = ?").get(input.id);
    if (!exists) throw new Error(`Preference ${input.id} not found`);
    db.run(
      `UPDATE preferences SET
         content = ?,
         category = coalesce(?, category),
         sort_order = coalesce(?, sort_order),
         active = 1,
         updated_at = datetime('now')
       WHERE id = ?`,
      [input.content, input.category ?? null, input.sort_order ?? null, input.id],
    );
  } else {
    db.run("INSERT INTO preferences (category, content, sort_order) VALUES (?, ?, ?)", [
      input.category ?? "regel",
      input.content,
      input.sort_order ?? 100,
    ]);
  }
  return listPreferences(db);
}

export function deletePreference(db: Database, id: number): Preference[] {
  db.run("UPDATE preferences SET active = 0, updated_at = datetime('now') WHERE id = ?", [id]);
  return listPreferences(db);
}

export function getTargets(db: Database): DayTargets[] {
  return db
    .query<DayTargets, []>(
      "SELECT day_type, kcal, protein_min, fat_min, carbs FROM day_targets ORDER BY day_type",
    )
    .all();
}

export function getTargetsFor(db: Database, dayType: string): DayTargets {
  const row = db
    .query<DayTargets, [string]>(
      "SELECT day_type, kcal, protein_min, fat_min, carbs FROM day_targets WHERE day_type = ?",
    )
    .get(dayType);
  if (!row) throw new Error(`Unknown day type: ${dayType}`);
  return row;
}

export function setTargets(
  db: Database,
  input: {
    day_type: string;
    kcal?: number;
    protein_min?: number;
    fat_min?: number;
    carbs?: number | null;
  },
): DayTargets[] {
  const exists = db.query("SELECT 1 FROM day_targets WHERE day_type = ?").get(input.day_type);
  if (!exists) throw new Error(`Unknown day type: ${input.day_type}`);
  db.run(
    `UPDATE day_targets SET
       kcal = coalesce(?, kcal),
       protein_min = coalesce(?, protein_min),
       fat_min = coalesce(?, fat_min),
       carbs = coalesce(?, carbs)
     WHERE day_type = ?`,
    [input.kcal ?? null, input.protein_min ?? null, input.fat_min ?? null, input.carbs ?? null, input.day_type],
  );
  return getTargets(db);
}
