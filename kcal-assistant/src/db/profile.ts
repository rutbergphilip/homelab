import type { Database } from "bun:sqlite";
import { isValidDate } from "../lib/dates";

export interface Profile {
  birth_date: string;
  sex: "man" | "kvinna";
  height_cm: number;
  activity_factor: number;
  goal_weight_kg: number | null;
  goal_date: string | null;
  updated_at: string;
}

export interface ProfileInput {
  birth_date?: string;
  sex?: "man" | "kvinna";
  height_cm?: number;
  activity_factor?: number;
  goal_weight_kg?: number | null;
  goal_date?: string | null;
}

export function getProfile(db: Database): Profile | null {
  return (
    db
      .query<Profile, []>(
        "SELECT birth_date, sex, height_cm, activity_factor, goal_weight_kg, goal_date, updated_at FROM profile WHERE id = 1",
      )
      .get() ?? null
  );
}

// Partial upsert: omitted fields keep their values; explicit null clears the
// goal fields. The four physiological fields are required on first insert.
export function setProfile(db: Database, input: ProfileInput): Profile {
  for (const [field, value] of [
    ["birth_date", input.birth_date],
    ["goal_date", input.goal_date],
  ] as const) {
    if (typeof value === "string" && !isValidDate(value)) {
      throw new Error(`Ogiltigt datum för ${field}: ${value} (YYYY-MM-DD)`);
    }
  }
  if (input.sex !== undefined && input.sex !== "man" && input.sex !== "kvinna") {
    throw new Error(`Ogiltigt kön: ${input.sex} (man eller kvinna)`);
  }
  if (input.height_cm !== undefined && !(input.height_cm > 0)) {
    throw new Error(`Orimlig längd: ${input.height_cm} cm`);
  }
  if (
    input.activity_factor !== undefined &&
    !(input.activity_factor >= 1.2 && input.activity_factor <= 2.5)
  ) {
    throw new Error(`Orimlig aktivitetsfaktor: ${input.activity_factor} (1.2–2.5)`);
  }
  if (
    typeof input.goal_weight_kg === "number" &&
    !(input.goal_weight_kg > 0)
  ) {
    throw new Error(`Orimlig målvikt: ${input.goal_weight_kg} kg`);
  }
  const existing = getProfile(db);
  if (!existing) {
    if (
      input.birth_date === undefined ||
      input.sex === undefined ||
      input.height_cm === undefined ||
      input.activity_factor === undefined
    ) {
      throw new Error("Första anropet kräver birth_date, sex, height_cm och activity_factor");
    }
    db.run(
      "INSERT INTO profile (id, birth_date, sex, height_cm, activity_factor, goal_weight_kg, goal_date) VALUES (1, ?, ?, ?, ?, ?, ?)",
      [
        input.birth_date,
        input.sex,
        input.height_cm,
        input.activity_factor,
        input.goal_weight_kg ?? null,
        input.goal_date ?? null,
      ],
    );
  } else {
    db.run(
      `UPDATE profile SET
         birth_date = ?, sex = ?, height_cm = ?, activity_factor = ?,
         goal_weight_kg = ?, goal_date = ?, updated_at = datetime('now')
       WHERE id = 1`,
      [
        input.birth_date ?? existing.birth_date,
        input.sex ?? existing.sex,
        input.height_cm ?? existing.height_cm,
        input.activity_factor ?? existing.activity_factor,
        input.goal_weight_kg === undefined ? existing.goal_weight_kg : input.goal_weight_kg,
        input.goal_date === undefined ? existing.goal_date : input.goal_date,
      ],
    );
  }
  return getProfile(db)!;
}
