import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "../src/core/db";
import { DOMAINS } from "../src/core/registry";
import {
  addJoke,
  findJokes,
  getJoke,
  jokeStats,
  knownAudienceTags,
  listContexts,
  logTelling,
  normalizeAudience,
  setRetired,
  updateJoke,
} from "../src/domains/jokes/db";

function freshDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, DOMAINS);
  return db;
}

const IPREN = {
  text: "Jag ser ut som en Ipren bredvid dig",
  translation: "I look like an Ipren next to you",
  activation: "active" as const,
  type: "one-liner",
  risk: 1,
  delivery: "Håll upp armen bredvid deras, säg det utan att le.",
  triggers: ["någon är nybränd eller solbränd efter semester", "någon kommenterar hur blek du är"],
  context_ratings: { puben: "safe", jobbfika: "safe", familjemiddag: "safe" } as Record<
    string,
    "safe" | "risky" | "never"
  >,
};

describe("jokes: normalizeAudience", () => {
  test("trims, lowercases, dedupes, drops empties, preserves order", () => {
    expect(normalizeAudience([" Erik ", "ANNA", "erik", "", "  "])).toEqual(["erik", "anna"]);
  });
});

describe("jokes: authoring", () => {
  test("add with triggers + context ratings roundtrips; seeded contexts exist", () => {
    const db = freshDb();
    const names = listContexts(db).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["puben", "jobbfika", "familjemiddag", "gruppchatt"]));

    const joke = addJoke(db, IPREN);
    expect(joke.id).toBeGreaterThan(0);
    expect(joke.triggers).toHaveLength(2);
    expect(joke.context_ratings["puben"]).toBe("safe");
    expect(joke.retired).toBe(false);
    expect(joke.stats.times_told).toBe(0);
    expect(joke.stats.avg_rating).toBeNull();
  });

  test("unknown context name in ratings is auto-created", () => {
    const db = freshDb();
    const joke = addJoke(db, { ...IPREN, context_ratings: { "krogen med jobbet": "risky" } });
    expect(joke.context_ratings["krogen med jobbet"]).toBe("risky");
    expect(listContexts(db).map((c) => c.name)).toContain("krogen med jobbet");
  });

  test("update patches fields; triggers and context_ratings replace wholesale", () => {
    const db = freshDb();
    const joke = addJoke(db, IPREN);
    const updated = updateJoke(db, joke.id, {
      risk: 2,
      triggers: ["endast en trigger nu"],
      context_ratings: { gruppchatt: "never" },
    });
    expect(updated.risk).toBe(2);
    expect(updated.triggers).toEqual(["endast en trigger nu"]);
    expect(updated.context_ratings).toEqual({ gruppchatt: "never" });
    // untouched fields survive
    expect(updated.delivery).toBe(IPREN.delivery);
  });

  test("validation: bad activation, bad risk, bad verdict throw", () => {
    const db = freshDb();
    expect(() => addJoke(db, { ...IPREN, risk: 6 })).toThrow();
    expect(() => addJoke(db, { ...IPREN, activation: "sometimes" as never })).toThrow();
    expect(() => addJoke(db, { ...IPREN, context_ratings: { puben: "maybe" as never } })).toThrow();
  });
});

describe("jokes: find + retire", () => {
  test("find excludes retired by default, includes with flag", () => {
    const db = freshDb();
    const a = addJoke(db, IPREN);
    addJoke(db, { ...IPREN, text: "Annat skämt" });
    setRetired(db, a.id, true);
    expect(findJokes(db, {}).map((j) => j.text)).toEqual(["Annat skämt"]);
    expect(findJokes(db, { include_retired: true })).toHaveLength(2);
  });

  test("context filter excludes 'never' verdicts and annotates context_verdict", () => {
    const db = freshDb();
    addJoke(db, { ...IPREN, text: "Säkert på puben", context_ratings: { puben: "safe" } });
    addJoke(db, { ...IPREN, text: "Aldrig på puben", context_ratings: { puben: "never" } });
    addJoke(db, { ...IPREN, text: "Obetygsatt", context_ratings: {} });
    const found = findJokes(db, { context: "puben" });
    const texts = found.map((j) => j.text);
    expect(texts).toContain("Säkert på puben");
    expect(texts).toContain("Obetygsatt"); // unrated ≠ never
    expect(texts).not.toContain("Aldrig på puben");
    expect(found.find((j) => j.text === "Säkert på puben")!.context_verdict).toBe("safe");
    expect(found.find((j) => j.text === "Obetygsatt")!.context_verdict).toBeNull();
  });

  test("audience filter reports heard_by from telling history", () => {
    const db = freshDb();
    const joke = addJoke(db, IPREN);
    logTelling(db, { joke_id: joke.id, told_on: "2026-08-01", audience: ["Erik", "Anna"], rating: 4 });
    const found = findJokes(db, { audience: ["erik", "Lisa"] });
    expect(found[0]!.heard_by).toEqual(["erik"]);
  });
});

describe("jokes: tellings + stats", () => {
  test("logTelling normalizes audience, resolves context, updates stats", () => {
    const db = freshDb();
    const joke = addJoke(db, IPREN);
    logTelling(db, { joke_id: joke.id, told_on: "2026-08-01", context: "puben", audience: [" Erik "], rating: 5 });
    logTelling(db, { joke_id: joke.id, told_on: "2026-08-10", context: "Jobbfika", audience: ["anna"], rating: 3 });

    const full = getJoke(db, joke.id);
    expect(full.tellings).toHaveLength(2);
    expect(full.tellings[0]!.told_on).toBe("2026-08-10"); // newest first
    expect(full.tellings[1]!.audience).toEqual(["erik"]);
    expect(full.stats.times_told).toBe(2);
    expect(full.stats.avg_rating).toBe(4);
    expect(full.stats.last_told).toBe("2026-08-10");
  });

  test("logTelling rejects unknown joke and bad rating/date", () => {
    const db = freshDb();
    const joke = addJoke(db, IPREN);
    expect(() => logTelling(db, { joke_id: 999, told_on: "2026-08-01" })).toThrow(/not found/);
    expect(() => logTelling(db, { joke_id: joke.id, told_on: "2026-08-01", rating: 9 })).toThrow();
    expect(() => logTelling(db, { joke_id: joke.id, told_on: "banan" })).toThrow(/date/i);
  });

  test("knownAudienceTags is distinct + sorted; stats aggregates", () => {
    const db = freshDb();
    const a = addJoke(db, IPREN);
    const b = addJoke(db, { ...IPREN, text: "Trädringarna", risk: 3 });
    addJoke(db, { ...IPREN, text: "Aldrig berättad" });
    logTelling(db, { joke_id: a.id, told_on: "2026-08-01", audience: ["erik", "anna"], rating: 5 });
    logTelling(db, { joke_id: a.id, told_on: "2026-08-02", audience: ["erik"], rating: 4 });
    logTelling(db, { joke_id: b.id, told_on: "2026-08-03", audience: ["anna"], rating: 2 });

    expect(knownAudienceTags(db)).toEqual(["anna", "erik"]);

    const stats = jokeStats(db);
    expect(stats.most_told[0]!.text).toBe(IPREN.text);
    expect(stats.most_told[0]!.times_told).toBe(2);
    expect(stats.never_told.map((j) => j.text)).toEqual(["Aldrig berättad"]);
    expect(stats.by_rating[0]!.avg_rating).toBe(4.5);
    expect(stats.heard_by["erik"]).toEqual([a.id]);
    expect(stats.heard_by["anna"]!.sort()).toEqual([a.id, b.id].sort());
  });
});
