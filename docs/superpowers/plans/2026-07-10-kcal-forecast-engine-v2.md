# kcal-assistant v0.9.0 — Prognosmotor v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trend-weight smoothing (EWMA), a data-driven uncertainty band with goal-ETA ranges, persisted forecast snapshots with accuracy tracking, and pinned scenario comparison on the Vikt page.

**Architecture:** All math is pure functions in `kcal-assistant/src/lib/` (fixture-tested, no db). `db/forecast.ts` orchestrates: resolves intake, snapshots canonical forecasts (migration 5 table), attaches accuracy/ghost to the view. The React UI (bun-bundled) renders trend line + dots, träffsäkerhet tiles, a ghost overlay, and up to two pinned what-if scenarios.

**Tech Stack:** Bun + TypeScript, bun:sqlite, `bun test`, MCP SDK (zod schemas), React 19 + Radix bundled via `bun build --production`.

**Spec:** `docs/superpowers/specs/2026-07-10-kcal-forecast-engine-v2-design.md` (approved). Branch: `kcal-forecast-engine-v2`.

## Global Constraints

- All commands run from `kcal-assistant/` unless stated; repo root is `homelab/`.
- Swedish user-facing copy (UI text, error strings, forecast notes). Code/comments in English.
- No new MCP tools (count stays 24); no input-schema changes. Exactly ONE description string changes: `get_forecast`'s "±150 kcal/dag" wording (spec scope note).
- Test fixtures must be obviously synthetic (100 kg range etc.) — public repo, no real weights.
- Migrations are append-only, tracked via `PRAGMA user_version` (this release adds #5).
- UI bundle: `bun run build:ui` (has `--production`; NEVER build without it — dev jsx runtime breaks prod React silently).
- Commit style: `feat(kcal-assistant): …` / `test(kcal-assistant): …`; end commit bodies with the Claude-Session trailer used on this branch.
- Full suite `bun test` must pass at every commit.

---

### Task 1: EWMA trend weight (`computeTrendWeight`)

**Files:**
- Modify: `kcal-assistant/src/lib/trend.ts`
- Test: `kcal-assistant/tests/trend.test.ts`

**Interfaces:**
- Consumes: existing `WeightEntry { date, weight_kg }`, `toEpochDays` from `lib/dates`.
- Produces: `export interface TrendWeightPoint { date: string; weight_kg: number; trend_kg: number }` and `export function computeTrendWeight(weights: WeightEntry[]): TrendWeightPoint[]` — Tasks 2, 7, 8, 9 import these exact names.

- [ ] **Step 1: Write the failing tests** — append to `tests/trend.test.ts`:

```ts
import { computeTrendWeight } from "../src/lib/trend";

describe("computeTrendWeight", () => {
  test("single weigh-in: trend equals the weight", () => {
    expect(computeTrendWeight([{ date: "2026-06-01", weight_kg: 100 }])).toEqual([
      { date: "2026-06-01", weight_kg: 100, trend_kg: 100 },
    ]);
  });

  test("1-day gap uses alpha 0.1", () => {
    const out = computeTrendWeight([
      { date: "2026-06-01", weight_kg: 100 },
      { date: "2026-06-02", weight_kg: 99 },
    ]);
    expect(out[1]!.trend_kg).toBe(99.9); // 100 + 0.1·(99−100)
  });

  test("7-day gap uses alpha 1−0.9^7", () => {
    const out = computeTrendWeight([
      { date: "2026-06-01", weight_kg: 100 },
      { date: "2026-06-08", weight_kg: 99 },
    ]);
    expect(out[1]!.trend_kg).toBe(99.48); // 100 − (1−0.4782969) = 99.4782969
  });

  test("trend lags a falling series (stays above raw)", () => {
    const weights = [0, 1, 2, 3, 4].map((i) => ({
      date: addDays("2026-06-01", i), weight_kg: 100 - i * 0.5,
    }));
    const out = computeTrendWeight(weights);
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.trend_kg).toBeGreaterThan(out[i]!.weight_kg);
    }
  });

  test("unsorted input is sorted by date", () => {
    const out = computeTrendWeight([
      { date: "2026-06-02", weight_kg: 99 },
      { date: "2026-06-01", weight_kg: 100 },
    ]);
    expect(out.map((p) => p.date)).toEqual(["2026-06-01", "2026-06-02"]);
    expect(out[1]!.trend_kg).toBe(99.9);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/trend.test.ts`
Expected: FAIL — `computeTrendWeight` is not exported.

- [ ] **Step 3: Implement** — append to `src/lib/trend.ts`:

```ts
// Hacker's Diet-style exponential smoothing for irregular weigh-ins:
//   trend += α_eff · (weight − trend),  α_eff = 1 − 0.9^gap_days (α = 0.10/day).
// The running trend is kept unrounded; only the output is rounded.
const ALPHA_DAILY = 0.1;

export interface TrendWeightPoint {
  date: string;
  weight_kg: number;
  trend_kg: number;
}

export function computeTrendWeight(weights: WeightEntry[]): TrendWeightPoint[] {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const out: TrendWeightPoint[] = [];
  let trend: number | null = null;
  let prevEpoch = 0;
  for (const w of sorted) {
    const epoch = toEpochDays(w.date);
    if (trend === null) {
      trend = w.weight_kg;
    } else {
      const alphaEff = 1 - Math.pow(1 - ALPHA_DAILY, Math.max(1, epoch - prevEpoch));
      trend += alphaEff * (w.weight_kg - trend);
    }
    prevEpoch = epoch;
    out.push({ date: w.date, weight_kg: w.weight_kg, trend_kg: round2(trend) });
  }
  return out;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun test tests/trend.test.ts`
Expected: PASS (all, including pre-existing).

- [ ] **Step 5: Commit**

```bash
git add src/lib/trend.ts tests/trend.test.ts
git commit -m "feat(kcal-assistant): EWMA trendvikt (computeTrendWeight)"
```

---

### Task 2: Forecast starts from the trend weight

**Files:**
- Modify: `kcal-assistant/src/lib/forecast.ts` (start computation, `ForecastResult.start`)
- Test: `kcal-assistant/tests/forecast.test.ts`

**Interfaces:**
- Consumes: `computeTrendWeight` from Task 1.
- Produces: `ForecastResult.start` becomes `{ date: string; weight_kg: number; stale: boolean }` — `weighins_smoothed` is REMOVED. Later tasks and the UI type (Task 9) rely on this exact shape.

- [ ] **Step 1: Update the existing start test** — in `tests/forecast.test.ts`, replace the test `"start smooths weigh-ins within 7 days of the latest"` (and its `weighins_smoothed` assertion) with:

```ts
  test("start is the EWMA trend weight at the latest weigh-in", () => {
    const f = run({ weights: [W("2026-07-02", 82.4), W("2026-07-06", 82.0), W(TODAY, 81.6)] });
    // trend: 82.4 → +0.3439·(82−82.4)=82.26244 → +0.271·(81.6−82.26244)=82.08292
    expect(f.start.weight_kg).toBe(82.08);
    expect(f.start.date).toBe(TODAY);
    expect("weighins_smoothed" in f.start).toBe(false);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/forecast.test.ts`
Expected: FAIL — start.weight_kg is 82 (7-day mean), `weighins_smoothed` still present.

- [ ] **Step 3: Implement** — in `src/lib/forecast.ts`:
  - Add import: `import { computeTrendWeight } from "./trend";`
  - Change `start` in the `ForecastResult` interface to `start: { date: string; weight_kg: number; stale: boolean };`
  - Replace the start computation block (the `recent`/`startKg` lines) with:

```ts
  // Start = EWMA trend weight at the latest weigh-in (lib/trend.ts); the
  // simulation still starts at the latest weigh-in DATE so a stale log gets
  // its elapsed days simulated too.
  const startKg = computeTrendWeight(sorted).at(-1)!.trend_kg;
  const stale = toEpochDays(input.today) - toEpochDays(latest.date) > 7;
  if (stale) notes.push("senaste vägningen är över en vecka gammal");
```

  - In the returned object, `start` becomes `{ date: latest.date, weight_kg: round2(startKg), stale }`.
  - Update the module header comment's "±150 kcal/day" sentence later in Task 3 (leave for now).

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS. (`ui-api.test.ts` and others never asserted `weighins_smoothed`; only the test updated in Step 1 did.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecast.ts tests/forecast.test.ts
git commit -m "feat(kcal-assistant): prognosstart från trendvikt i stället för 7-dagarssnitt"
```

---

### Task 3: Data-driven uncertainty band (`computeBand`)

**Files:**
- Modify: `kcal-assistant/src/lib/forecast.ts`
- Test: `kcal-assistant/tests/forecast.test.ts`

**Interfaces:**
- Produces:
  - `export interface BandInput { calibration: "mätdata" | "formel"; intake_source: "targets" | "recent" | "explicit"; weighins_last_28d: number }`
  - `export function computeBand(input: BandInput): { kcal: number; reasons: string[] }`
  - `ForecastResult.assumptions` gains `band_kcal: number`.
- Consumed by: Task 5 (snapshot stores `band_kcal`), Task 9 (UI type).

- [ ] **Step 1: Write failing tests** — append to `tests/forecast.test.ts`:

```ts
import { computeBand } from "../src/lib/forecast";

describe("computeBand", () => {
  test("best case: mätdata + recent + tät vägning = 175", () => {
    const b = computeBand({ calibration: "mätdata", intake_source: "recent", weighins_last_28d: 20 });
    expect(b.kcal).toBe(175); // 100 + 50 + 25
  });

  test("mätdata + targets = 225", () => {
    expect(computeBand({ calibration: "mätdata", intake_source: "targets", weighins_last_28d: 20 }).kcal).toBe(225);
  });

  test("formel + targets + glest = 425 clamps to 400 and explains why", () => {
    const b = computeBand({ calibration: "formel", intake_source: "targets", weighins_last_28d: 3 });
    expect(b.kcal).toBe(400);
    expect(b.reasons.join(" ")).toContain("formelkalibrering");
    expect(b.reasons.join(" ")).toContain("glesa vägningar");
  });

  test("explicit intake counts as plan adherence (+75)", () => {
    expect(computeBand({ calibration: "formel", intake_source: "explicit", weighins_last_28d: 20 }).kcal).toBe(375);
  });
});

describe("band integration", () => {
  test("assumptions.band_kcal reflects the budget and a note explains it", () => {
    const f = run(); // explicit + formel + 1 weigh-in → 100+200+75+50 = 425 → 400
    expect(f.assumptions.band_kcal).toBe(400);
    expect(f.notes.join(" ")).toContain("±400");
  });

  test("band width drives the envelope", () => {
    const wide = run(); // band 400
    // 10 weigh-ins 2026-06-21 … 2026-07-07 (step 2) + TODAY = 11 within 28 d, no duplicate dates.
    const dense = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((i) =>
      W(addDays("2026-06-21", i), 82));
    const narrow = run({ weights: [...dense, W(TODAY, 82)], measured_tdee: 2500 }); // band 100+50+75 = 225
    expect(narrow.assumptions.band_kcal).toBe(225);
    expect(wide.curve[30]!.high - wide.curve[30]!.low)
      .toBeGreaterThan(narrow.curve[30]!.high - narrow.curve[30]!.low);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/forecast.test.ts`
Expected: FAIL — `computeBand` not exported.

- [ ] **Step 3: Implement** — in `src/lib/forecast.ts`:
  - Replace `const BAND_KCAL = 150;` with:

```ts
// Error budget for the uncertainty band: named kcal contributions summed and
// clamped. The single place a future empirical calibration (from
// forecast_snapshots history) would slot in.
const BAND_MIN = 125;
const BAND_MAX = 400;

export interface BandInput {
  calibration: "mätdata" | "formel";
  intake_source: "targets" | "recent" | "explicit";
  weighins_last_28d: number;
}

export function computeBand(input: BandInput): { kcal: number; reasons: string[] } {
  let kcal = 100;
  const reasons: string[] = ["grundosäkerhet"];
  if (input.calibration === "mätdata") {
    kcal += 50;
    reasons.push("mätdatakalibrerad");
  } else {
    kcal += 200;
    reasons.push("formelkalibrering (ingen tillförlitlig mätdata)");
  }
  if (input.intake_source === "recent") {
    kcal += 25;
    reasons.push("intag från uppmätt beteende");
  } else {
    kcal += 75;
    reasons.push("intag antar framtida följsamhet");
  }
  if (input.weighins_last_28d < 10) {
    kcal += 50;
    reasons.push("glesa vägningar (<10 på 28 d)");
  }
  return { kcal: Math.min(BAND_MAX, Math.max(BAND_MIN, kcal)), reasons };
}
```

  - In `computeForecast`, after the calibration block, add:

```ts
  const weighinsLast28 = sorted.filter(
    (w) => toEpochDays(latest.date) - toEpochDays(w.date) <= 27,
  ).length;
  const band = computeBand({
    calibration,
    intake_source: input.intake_source,
    weighins_last_28d: weighinsLast28,
  });
  notes.push(`osäkerhet ±${band.kcal} kcal/dag: ${band.reasons.join(", ")}`);
```

  - Change the low/high sims to use `band.kcal` instead of `BAND_KCAL`.
  - Add `band_kcal: band.kcal,` to `assumptions` in both the interface (`band_kcal: number;`) and the returned object.
  - Update the module header comment: "A ±150 kcal/day re-run" → "A ±band re-run (data-driven error budget, computeBand)".

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS. If any pre-existing test asserted on `notes` being empty or exact, update it to accommodate the new band note (check `forecast.test.ts` and `ui-api.test.ts` output assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecast.ts tests/forecast.test.ts
git commit -m "feat(kcal-assistant): datadrivet osäkerhetsband (error budget) i prognosen"
```

---

### Task 4: Goal-ETA range from the envelope curves

**Files:**
- Modify: `kcal-assistant/src/lib/forecast.ts`
- Test: `kcal-assistant/tests/forecast.test.ts`

**Interfaces:**
- Produces: `ForecastResult.goal` gains `eta_range: { earliest: string | null; latest: string | null }` — present whenever `goal` is non-null. Task 9's UI type and Task 11's tiles rely on this exact shape.

- [ ] **Step 1: Write failing tests** — append inside the existing `describe("computeForecast", ...)`:

```ts
  test("eta_range brackets the point ETA", () => {
    const f = run(); // goal 80, eta day 13, band 400
    const r = f.goal!.eta_range;
    expect(r.earliest).not.toBeNull();
    expect(r.latest).not.toBeNull();
    expect(r.earliest! < f.goal!.eta!).toBe(true); // ISO strings compare correctly
    expect(f.goal!.eta! < r.latest!).toBe(true);
  });

  test("latest is null when the high curve misses the horizon", () => {
    const f = run({ horizon_days: 14 }); // main hits day 13, low ~day 10, high ~day 19
    expect(f.goal!.eta).not.toBeNull();
    expect(f.goal!.eta_range.earliest).not.toBeNull();
    expect(f.goal!.eta_range.latest).toBeNull();
  });

  test("moving away from the goal gives an all-null range", () => {
    const f = run({ intake_kcal: 4000 }); // surplus, goal below start
    expect(f.goal!.eta).toBeNull();
    expect(f.goal!.eta_range).toEqual({ earliest: null, latest: null });
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/forecast.test.ts`
Expected: FAIL — `eta_range` undefined.

- [ ] **Step 3: Implement** — in `src/lib/forecast.ts`:
  - In the `goal` type inside `ForecastResult`, change to:

```ts
  goal: {
    weight_kg: number;
    eta: string | null;
    eta_range: { earliest: string | null; latest: string | null };
    reached: boolean;
    reason?: string;
  } | null;
```

  - In the goal block, extend the non-reached branch (the raw `lowSim`/`highSim` arrays are in scope; their kg values are unrounded, which is fine for threshold scanning):

```ts
      const etaOn = (pts: Array<{ date: string; kg: number }>): string | null =>
        movingToward ? (pts.find((p) => hit(p.kg))?.date ?? null) : null;
      const etaLow = etaOn(lowSim);
      const etaHigh = etaOn(highSim);
      const eta_range =
        etaLow !== null && etaHigh !== null
          ? etaLow <= etaHigh
            ? { earliest: etaLow, latest: etaHigh }
            : { earliest: etaHigh, latest: etaLow }
          : { earliest: etaLow ?? etaHigh, latest: null };
```

    and include `eta_range` in the returned goal object. The `reached` branch returns `eta_range: { earliest: null, latest: null }`.

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecast.ts tests/forecast.test.ts
git commit -m "feat(kcal-assistant): mål-ETA som intervall från osäkerhetskurvorna"
```

---

### Task 5: Migration 5 + snapshot storage

**Files:**
- Modify: `kcal-assistant/src/db/migrations.ts`
- Create: `kcal-assistant/src/db/snapshots.ts`
- Test: `kcal-assistant/tests/snapshots.test.ts` (new)

**Interfaces:**
- Produces (Tasks 6–8 import these exact names):
  - `export interface SnapshotRow { date: string; start_date: string; start_kg: number; intake_kcal: number; intake_source: string; tdee_start: number; calibration_offset: number; band_kcal: number; curve: ForecastPoint[] }`
  - `export function saveSnapshot(db: Database, forecast: ForecastResult, today: string): void`
  - `export function listSnapshots(db: Database): SnapshotRow[]` (ascending by date)

- [ ] **Step 1: Write failing tests** — create `tests/snapshots.test.ts`:

```ts
import { describe, expect, test, beforeEach } from "bun:test";
import type { Database } from "bun:sqlite";
import { openDb } from "../src/db/index";
import { saveSnapshot, listSnapshots } from "../src/db/snapshots";
import { computeForecast, type ForecastProfile } from "../src/lib/forecast";

// Synthetic fixtures only — public repo.
const PROFILE: ForecastProfile = {
  birth_date: "2000-01-15", sex: "man", height_cm: 180,
  activity_factor: 1.5, goal_weight_kg: 80, goal_date: null,
};

function makeForecast(intake: number) {
  return computeForecast({
    profile: PROFILE,
    weights: [{ date: "2026-07-09", weight_kg: 82 }],
    intake_kcal: intake, intake_source: "explicit",
    measured_tdee: null, today: "2026-07-09",
  });
}

describe("forecast snapshots", () => {
  let db: Database;
  beforeEach(() => { db = openDb(":memory:"); });

  test("save + list roundtrips with a weekly curve", () => {
    saveSnapshot(db, makeForecast(1500), "2026-07-09");
    const rows = listSnapshots(db);
    expect(rows).toHaveLength(1);
    const s = rows[0]!;
    expect(s.date).toBe("2026-07-09");
    expect(s.start_kg).toBe(82);
    expect(s.intake_kcal).toBe(1500);
    expect(s.band_kcal).toBe(400);
    expect(s.curve.length).toBeLessThan(60); // weekly, not daily (365)
    expect(s.curve[0]).toMatchObject({ date: "2026-07-09", kg: 82 });
  });

  test("same-day save upserts (last write wins)", () => {
    saveSnapshot(db, makeForecast(1500), "2026-07-09");
    saveSnapshot(db, makeForecast(1600), "2026-07-09");
    const rows = listSnapshots(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.intake_kcal).toBe(1600);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/snapshots.test.ts`
Expected: FAIL — module `../src/db/snapshots` not found.

- [ ] **Step 3: Implement**
  - Append migration 5 to the `MIGRATIONS` array in `src/db/migrations.ts`:

```ts
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
```

  - Create `src/db/snapshots.ts`:

```ts
import type { Database } from "bun:sqlite";
import type { ForecastPoint, ForecastResult } from "../lib/forecast";

export interface SnapshotRow {
  date: string;
  start_date: string;
  start_kg: number;
  intake_kcal: number;
  intake_source: string;
  tdee_start: number;
  calibration_offset: number;
  band_kcal: number;
  curve: ForecastPoint[];
}

// Weekly sampling mirrors get_forecast's token-lean curve.
const weekly = (curve: ForecastPoint[]): ForecastPoint[] =>
  curve.filter((_, i) => i % 7 === 0 || i === curve.length - 1);

export function saveSnapshot(db: Database, forecast: ForecastResult, today: string): void {
  db.run(
    `INSERT INTO forecast_snapshots
       (date, start_date, start_kg, intake_kcal, intake_source,
        tdee_start, calibration_offset, band_kcal, curve_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       created_at = datetime('now'),
       start_date = excluded.start_date, start_kg = excluded.start_kg,
       intake_kcal = excluded.intake_kcal, intake_source = excluded.intake_source,
       tdee_start = excluded.tdee_start, calibration_offset = excluded.calibration_offset,
       band_kcal = excluded.band_kcal, curve_json = excluded.curve_json`,
    [
      today, forecast.start.date, forecast.start.weight_kg,
      forecast.assumptions.intake_kcal, forecast.assumptions.intake_source,
      forecast.assumptions.tdee_start, forecast.assumptions.calibration_offset,
      forecast.assumptions.band_kcal, JSON.stringify(weekly(forecast.curve)),
    ],
  );
}

export function listSnapshots(db: Database): SnapshotRow[] {
  return db
    .query<Omit<SnapshotRow, "curve"> & { curve_json: string }, []>(
      `SELECT date, start_date, start_kg, intake_kcal, intake_source,
              tdee_start, calibration_offset, band_kcal, curve_json
       FROM forecast_snapshots ORDER BY date`,
    )
    .all()
    .map(({ curve_json, ...row }) => ({ ...row, curve: JSON.parse(curve_json) as ForecastPoint[] }));
}
```

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS (migration 5 applies in every test db via `openDb`).

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations.ts src/db/snapshots.ts tests/snapshots.test.ts
git commit -m "feat(kcal-assistant): migration 5 + forecast_snapshots-lagring"
```

---

### Task 6: Canonical snapshot wiring (buildForecast + log_weight)

**Files:**
- Modify: `kcal-assistant/src/db/forecast.ts`, `kcal-assistant/src/tools/weights.ts`
- Test: `kcal-assistant/tests/snapshots.test.ts`

**Interfaces:**
- Consumes: `saveSnapshot` (Task 5).
- Produces: `buildForecast` snapshots canonical calls as a side effect. Canonical = no `target_date`/`goal_weight`/`intake_kcal`/`activity_factor`/`goal_date` override AND `intake_source` targets-or-absent. The `today` opt is allowed (dates the snapshot; tests use it).

- [ ] **Step 1: Write failing tests** — append to `tests/snapshots.test.ts` (add imports `buildForecast` from `../src/db/forecast`, `setProfile` from `../src/db/profile`, `logWeight` from `../src/db/weights`):

```ts
describe("canonical snapshot wiring", () => {
  let db: Database;
  beforeEach(() => {
    db = openDb(":memory:");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    logWeight(db, { weight_kg: 82, date: "2026-07-08" });
  });

  test("canonical buildForecast writes a snapshot", () => {
    buildForecast(db, { today: "2026-07-09" });
    expect(listSnapshots(db).map((s) => s.date)).toEqual(["2026-07-09"]);
  });

  test("preview calls never write", () => {
    buildForecast(db, { today: "2026-07-09", intake_kcal: 1600 });
    buildForecast(db, { today: "2026-07-09", intake_source: "recent" });
    buildForecast(db, { today: "2026-07-09", activity_factor: 1.2 });
    expect(listSnapshots(db)).toHaveLength(0);
  });

  test("snapshot failure never breaks the forecast", () => {
    db.run("DROP TABLE forecast_snapshots");
    const view = buildForecast(db, { today: "2026-07-09" });
    expect(view.forecast).not.toBeNull();
  });

  test("no profile → no snapshot, no crash", () => {
    const bare = openDb(":memory:");
    logWeight(bare, { weight_kg: 82, date: "2026-07-08" });
    expect(buildForecast(bare, { today: "2026-07-09" }).forecast).toBeNull();
    expect(listSnapshots(bare)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/snapshots.test.ts`
Expected: FAIL — no snapshot written by `buildForecast`.

- [ ] **Step 3: Implement**
  - In `src/db/forecast.ts`, import `saveSnapshot` from `./snapshots`; before `return { forecast };` add:

```ts
  // Canonical (no what-ifs, plan-based intake) forecasts are snapshotted for
  // accuracy tracking — best-effort: a snapshot failure must never break the
  // forecast (or a log_weight that triggered it).
  const canonical =
    opts.target_date === undefined &&
    opts.goal_weight === undefined &&
    opts.intake_kcal === undefined &&
    opts.activity_factor === undefined &&
    opts.goal_date === undefined &&
    (opts.intake_source ?? "targets") === "targets";
  if (canonical) {
    try {
      saveSnapshot(db, forecast, today);
    } catch (e) {
      console.error("snapshot:", e instanceof Error ? e.message : e);
    }
  }
```

  - In `src/tools/weights.ts`, the `log_weight` handler triggers a canonical forecast so history accumulates from weigh-ins alone (import `buildForecast` from `../db/forecast` — tools layer, so no db-module import cycle):

```ts
    wrap((input) => {
      const view = logWeight(db, input);
      try {
        buildForecast(db); // canonical → snapshot; best-effort by construction
      } catch (e) {
        console.error("snapshot after log_weight:", e instanceof Error ? e.message : e);
      }
      return jsonResult(view);
    }),
```

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS. Note: `ui-api.test.ts` and `forecast.test.ts` call `buildForecast` canonically in places — they will now also write snapshot rows; that must not break any row-count assertions (the `TABLES` list in `ui-api.test.ts` doesn't include `forecast_snapshots`). If a test asserts exact `notes`, update for the band note.

- [ ] **Step 5: Commit**

```bash
git add src/db/forecast.ts src/tools/weights.ts tests/snapshots.test.ts
git commit -m "feat(kcal-assistant): kanoniska prognoser snapshotas (även vid log_weight)"
```

---

### Task 7: Accuracy math (`lib/accuracy.ts`)

**Files:**
- Create: `kcal-assistant/src/lib/accuracy.ts`
- Test: `kcal-assistant/tests/accuracy.test.ts` (new)

**Interfaces:**
- Produces (Task 8 imports these exact names):
  - `export interface AccuracyBucket { days: number; n: number; mae_kg: number; bias_kg: number }`
  - `export function computeForecastAccuracy(input: { snapshots: Array<{ date: string; curve: Array<{ date: string; kg: number }> }>; trendWeights: Array<{ date: string; trend_kg: number }>; today: string }): { per_age: AccuracyBucket[] } | null`
  - `export function pickGhost<T extends { date: string }>(snapshots: T[], today: string): T | null`

- [ ] **Step 1: Write failing tests** — create `tests/accuracy.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { computeForecastAccuracy, pickGhost } from "../src/lib/accuracy";
import { addDays } from "../src/lib/dates";

// Synthetic fixtures only — public repo.
// Snapshot curve: linear 100 → falling 0.1 kg/day, weekly points over 8 weeks.
function snapshotAt(date: string, startKg: number, lossPerDay = 0.1) {
  const curve = [0, 7, 14, 21, 28, 35, 42, 49, 56].map((d) => ({
    date: addDays(date, d), kg: startKg - d * lossPerDay,
  }));
  return { date, curve };
}
// Daily trend weights matching that exact line.
function trendLine(start: string, days: number, startKg: number, lossPerDay = 0.1) {
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i), trend_kg: startKg - i * lossPerDay,
  }));
}
const T0 = "2026-05-01";

describe("computeForecastAccuracy", () => {
  test("perfect forecasts give zero error", () => {
    const snapshots = [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1));
    const acc = computeForecastAccuracy({
      snapshots, trendWeights: trendLine(T0, 40, 100), today: addDays(T0, 39),
    })!;
    const d7 = acc.per_age.find((b) => b.days === 7)!;
    expect(d7.n).toBe(3);
    expect(d7.mae_kg).toBe(0);
    expect(d7.bias_kg).toBe(0);
  });

  test("optimistic forecasts show negative bias, mae positive", () => {
    // Forecast says −0.2/day but reality is −0.1/day → predicted BELOW actual.
    const snapshots = [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1, 0.2));
    const acc = computeForecastAccuracy({
      snapshots, trendWeights: trendLine(T0, 40, 100), today: addDays(T0, 39),
    })!;
    const d7 = acc.per_age.find((b) => b.days === 7)!;
    expect(d7.bias_kg).toBeLessThan(0);
    expect(d7.mae_kg).toBe(Math.abs(d7.bias_kg));
  });

  test("interpolates between weekly points (age 14+3 lands mid-week)", () => {
    // A single snapshot, weigh-in exactly 17 days later only.
    const acc = computeForecastAccuracy({
      snapshots: [snapshotAt(T0, 100), snapshotAt(addDays(T0, 1), 99.9), snapshotAt(addDays(T0, 2), 99.8)],
      trendWeights: [14, 15, 16, 17, 18].map((d) => ({ date: addDays(T0, d), trend_kg: 100 - d * 0.1 })),
      today: addDays(T0, 30),
    });
    expect(acc).not.toBeNull();
    expect(acc!.per_age.find((b) => b.days === 14)!.mae_kg).toBe(0);
  });

  test("no weigh-in within ±3 days → sample skipped; n<3 → bucket dropped; none → null", () => {
    expect(computeForecastAccuracy({
      snapshots: [snapshotAt(T0, 100)],
      trendWeights: [{ date: addDays(T0, 20), trend_kg: 98 }],
      today: addDays(T0, 60),
    })).toBeNull(); // n=1 for 14/28... never ≥3 with one snapshot
  });

  test("future ages are excluded", () => {
    const acc = computeForecastAccuracy({
      snapshots: [0, 1, 2].map((i) => snapshotAt(addDays(T0, i), 100 - i * 0.1)),
      trendWeights: trendLine(T0, 12, 100),
      today: addDays(T0, 11),
    })!;
    expect(acc.per_age.map((b) => b.days)).toEqual([7]); // 14/28/56 not aged yet
  });
});

describe("pickGhost", () => {
  const s = (d: string) => ({ date: d });
  test("picks the snapshot nearest 28 days old, requiring ≥21", () => {
    const today = "2026-06-30";
    expect(pickGhost([s("2026-06-25"), s("2026-06-05"), s("2026-05-20")], today))
      .toEqual(s("2026-06-05")); // ages: 5 (too young), 25, 41 → 25 nearest 28
  });
  test("null when nothing is old enough", () => {
    expect(pickGhost([s("2026-06-25")], "2026-06-30")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/accuracy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — create `src/lib/accuracy.ts`:

```ts
import { toEpochDays, addDays } from "./dates";

// Measures how past forecast snapshots aged: for standard ages, the snapshot
// curve (weekly points, linearly interpolated) is compared against the EWMA
// trend weight nearest that date (±3 days). bias > 0 = forecasts ran heavy.

export interface AccuracyBucket {
  days: number;
  n: number;
  mae_kg: number;
  bias_kg: number;
}

const AGES = [7, 14, 28, 56];
const MATCH_TOLERANCE_DAYS = 3;
const MIN_SAMPLES = 3;

const round2 = (x: number): number => Math.round(x * 100) / 100;

export function computeForecastAccuracy(input: {
  snapshots: Array<{ date: string; curve: Array<{ date: string; kg: number }> }>;
  trendWeights: Array<{ date: string; trend_kg: number }>;
  today: string;
}): { per_age: AccuracyBucket[] } | null {
  const per_age: AccuracyBucket[] = [];
  for (const days of AGES) {
    const errors: number[] = [];
    for (const s of input.snapshots) {
      const target = addDays(s.date, days);
      if (target > input.today) continue;
      const predicted = interpolate(s.curve, target);
      if (predicted === null) continue;
      const actual = nearestTrend(input.trendWeights, target);
      if (actual === null) continue;
      errors.push(predicted - actual);
    }
    if (errors.length >= MIN_SAMPLES) {
      const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
      per_age.push({
        days,
        n: errors.length,
        mae_kg: round2(mean(errors.map(Math.abs))),
        bias_kg: round2(mean(errors)),
      });
    }
  }
  return per_age.length ? { per_age } : null;
}

function interpolate(curve: Array<{ date: string; kg: number }>, date: string): number | null {
  const t = toEpochDays(date);
  for (let i = 0; i < curve.length - 1; i++) {
    const a = toEpochDays(curve[i]!.date);
    const b = toEpochDays(curve[i + 1]!.date);
    if (t >= a && t <= b) {
      return a === b ? curve[i]!.kg : curve[i]!.kg + ((t - a) / (b - a)) * (curve[i + 1]!.kg - curve[i]!.kg);
    }
  }
  return null; // outside the stored curve (e.g. sim stopped early)
}

function nearestTrend(
  tw: Array<{ date: string; trend_kg: number }>,
  date: string,
): number | null {
  const t = toEpochDays(date);
  let best: number | null = null;
  let bestD = Infinity;
  for (const w of tw) {
    const d = Math.abs(toEpochDays(w.date) - t);
    if (d < bestD) {
      bestD = d;
      best = w.trend_kg;
    }
  }
  return bestD <= MATCH_TOLERANCE_DAYS ? best : null;
}

// Ghost overlay candidate: the snapshot nearest 28 days old, at least 21.
// Ascending input order means ties keep the older snapshot.
export function pickGhost<T extends { date: string }>(snapshots: T[], today: string): T | null {
  const t = toEpochDays(today);
  let best: T | null = null;
  let bestD = Infinity;
  for (const s of snapshots) {
    const age = t - toEpochDays(s.date);
    if (age < 21) continue;
    const d = Math.abs(age - 28);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bun test tests/accuracy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/accuracy.ts tests/accuracy.test.ts
git commit -m "feat(kcal-assistant): träffsäkerhetsmatematik (accuracy + ghost-val)"
```

---

### Task 8: Surface accuracy + ghost + trend_kg through db and APIs

**Files:**
- Modify: `kcal-assistant/src/db/forecast.ts`, `kcal-assistant/src/db/weights.ts`, `kcal-assistant/src/tools/profile.ts`
- Test: `kcal-assistant/tests/ui-api.test.ts`, `kcal-assistant/tests/weights.test.ts`

**Interfaces:**
- Produces:
  - `ForecastView` (in `db/forecast.ts`) gains `accuracy?: { per_age: AccuracyBucket[] }` and `ghost?: { snapshot_date: string; curve: ForecastPoint[] }` — attached on every call (canonical or preview) when data qualifies, omitted otherwise.
  - `db/weights.listWeights` rows gain `trend_kg: number`; `WeightTrendView.latest` gains `trend_kg: number`.
  - `get_forecast` (MCP) passes `accuracy` through but **strips `ghost`** (token economy — chat never needs a second curve); its description's "±150 kcal/dag" becomes "datadrivet ±band, se assumptions.band_kcal".

- [ ] **Step 1: Write failing tests**
  - Create `tests/ui-api-forecast.test.ts` — its OWN db + server (copy the `beforeAll` server-boot pattern from `tests/ui-api.test.ts` verbatim: `openDb(":memory:")`, `createHttpServer({ token: "test-token", db, uiAuth: { mode: "dev-bypass" } })`, port 0, `base` from `AddressInfo`). Isolated on purpose: `ui-api.test.ts` has profile-lifecycle tests that must not inherit a pre-seeded profile. Seed in `beforeAll` after boot:

```ts
setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
logWeight(db, { weight_kg: 100, date: "2026-07-08" });
```

    Tests:

```ts
  test("weights payload includes trend_kg on rows and latest", async () => {
    const res = await fetch(`${base}/ui/api/weights`, { headers: { accept: "application/json" } });
    const body = await res.json();
    expect(body.weights[0].trend_kg).toBeTypeOf("number");
    expect(body.trend.latest.trend_kg).toBeTypeOf("number");
  });

  test("forecast payload omits accuracy/ghost when no aged snapshots exist", async () => {
    const res = await fetch(`${base}/ui/api/forecast`, { headers: { accept: "application/json" } });
    const body = await res.json();
    expect(body.forecast).not.toBeNull();
    expect(body.forecast.assumptions.band_kcal).toBeTypeOf("number");
    expect(body.forecast.goal.eta_range).toBeDefined();
    expect("accuracy" in body).toBe(false); // only today's own snapshot exists (age 0)
    expect("ghost" in body).toBe(false);
  });
```

  - Append to `tests/snapshots.test.ts` a NEW top-level describe with a FRESH db and strictly chronological weigh-ins (the wiring describe's `beforeEach` logs a 2026-07-08 weight, which would sit AFTER the backdated snapshot dates and corrupt their curves):

```ts
describe("aged snapshots", () => {
  test("surface accuracy and ghost in the view", () => {
    const db = openDb(":memory:");
    setProfile(db, { birth_date: "2000-01-15", sex: "man", height_cm: 180, activity_factor: 1.5, goal_weight_kg: 80 });
    // Three backdated canonical snapshots, weights logged in date order.
    for (const off of [-30, -29, -28]) {
      const day = addDays("2026-07-09", off);
      logWeight(db, { weight_kg: 82, date: day });
      buildForecast(db, { today: day });
    }
    // Weigh-ins near each accuracy target (snap+7/14/28 within ±3 days).
    for (const off of [-23, -16, -9, -2]) {
      logWeight(db, { weight_kg: 82, date: addDays("2026-07-09", off) });
    }
    const view = buildForecast(db, { today: "2026-07-09" });
    expect(view.forecast).not.toBeNull();
    expect(view.accuracy).toBeDefined();
    expect(view.accuracy!.per_age.find((b) => b.days === 7)!.n).toBe(3);
    expect(view.ghost).toBeDefined();
    expect(view.ghost!.snapshot_date).toBe(addDays("2026-07-09", -28)); // age 28 exactly
  });
});
```

    (add `import { addDays } from "../src/lib/dates";` to the test file)

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/ui-api.test.ts tests/snapshots.test.ts`
Expected: FAIL — `trend_kg` missing; `accuracy`/`ghost` missing.

- [ ] **Step 3: Implement**
  - `src/db/weights.ts`: import `computeTrendWeight`; change `WeightTrendView` and both functions:

```ts
export interface WeightTrendView extends Omit<TrendResult, "latest"> {
  latest: (WeightEntry & { trend_kg: number }) | null;
  weights: WeightEntry[]; // weighings inside the window, ascending
}
```

    In `listWeights`, compute `const trendByDate = new Map(computeTrendWeight(rows).map((p) => [p.date, p.trend_kg]));` from the fetched rows and return `rows.map((r) => ({ ...r, trend_kg: trendByDate.get(r.date)! }))` (return type `Array<WeightEntry & { trend_kg: number; note: string | null }>`).
    In `getTrend`, build the same map from `allWeights` and return `latest` as `result.latest ? { ...result.latest, trend_kg: trendByDate.get(result.latest.date)! } : null`.
  - `src/db/forecast.ts`: import `computeTrendWeight` from `../lib/trend`, `computeForecastAccuracy, pickGhost, type AccuracyBucket` from `../lib/accuracy`, `listSnapshots` from `./snapshots`. Extend the view type:

```ts
export interface ForecastView {
  forecast: ForecastResult | null;
  reason?: string;
  accuracy?: { per_age: AccuracyBucket[] };
  ghost?: { snapshot_date: string; curve: ForecastResult["curve"] };
}
```

    Replace `return { forecast };` (after the canonical-snapshot block from Task 6, so today's snapshot exists before we read — its age 0 excludes it from ghost/accuracy anyway):

```ts
  // Accuracy + ghost ride on every response (previews too — same read cost),
  // omitted entirely when no snapshot has aged enough.
  const snapshots = listSnapshots(db);
  const accuracy = computeForecastAccuracy({
    snapshots, trendWeights: computeTrendWeight(weights), today,
  });
  const ghostSnap = pickGhost(snapshots, today);
  return {
    forecast,
    ...(accuracy !== null && { accuracy }),
    ...(ghostSnap !== null && { ghost: { snapshot_date: ghostSnap.date, curve: ghostSnap.curve } }),
  };
```

  - `src/tools/profile.ts` — `get_forecast` handler keeps `accuracy`, strips `ghost`, and the description swaps "an uncertainty band (±150 kcal/dag)" for "an uncertainty band (datadrivet ±band, se assumptions.band_kcal) with goal.eta_range":

```ts
    wrap((input) => {
      const view = buildForecast(db, input);
      if (!view.forecast) return jsonResult(view);
      // Token-lean for the chat: weekly points, and no ghost curve.
      const { curve, ...rest } = view.forecast;
      const weekly = curve.filter((_, i) => i % 7 === 0 || i === curve.length - 1);
      return jsonResult({
        forecast: { ...rest, curve: weekly },
        ...(view.accuracy && { accuracy: view.accuracy }),
      });
    }),
```

- [ ] **Step 4: Run the full suite**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/forecast.ts src/db/weights.ts src/tools/profile.ts tests/ui-api.test.ts tests/snapshots.test.ts
git commit -m "feat(kcal-assistant): accuracy/ghost i prognossvaret + trend_kg i viktdata"
```

---

### Task 9: UI foundation — types, trend line + dots, hover with both values

**Files:**
- Modify: `kcal-assistant/src/ui/app/api.ts`, `kcal-assistant/src/ui/app/lib/chart.ts`, `kcal-assistant/src/ui/app/components/WeightChart.tsx`, `kcal-assistant/src/ui/static/app.css`
- Test: `kcal-assistant/tests/chart.test.ts`

**Interfaces:**
- Consumes: server payloads from Task 8.
- Produces (Tasks 10–11 rely on these):
  - `api.ts`: `Weight` gains `trend_kg: number`; `Forecast.assumptions` gains `band_kcal: number`; `Forecast.goal` gains `eta_range: { earliest: string | null; latest: string | null }`; `Forecast.start` loses nothing (already minimal); new `AccuracyBucket`; `ForecastView` gains `accuracy?/ghost?`.
  - `chart.ts`: `ActualPt` becomes `{ t: number; kg: number; trend: number }`; `HoverHit` actual variant gains `trend: number`.
  - `WeightChart` props: `{ series: Weight[]; forecast: Forecast | null; ghost?: { snapshot_date: string; curve: ForecastPoint[] } | null; scenarios?: Array<{ slot: 0 | 1; curve: ForecastPoint[] }> }`.

- [ ] **Step 1: Update chart helper test** — in `tests/chart.test.ts`, update every `ActualPt`-shaped literal (`{ t, kg }`) passed to `nearestHit` to include `trend` (e.g. `{ t: 1, kg: 100, trend: 100.2 }`) and assert the actual-hit result carries `trend`:

```ts
  test("actual hit carries the trend value", () => {
    const hit = nearestHit(1, [{ t: 1, kg: 100, trend: 100.2 }], []);
    expect(hit).toEqual({ kind: "actual", t: 1, kg: 100, trend: 100.2 });
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/chart.test.ts`
Expected: FAIL — type error / missing `trend` in result.

- [ ] **Step 3: Implement**
  - `src/ui/app/lib/chart.ts`:

```ts
export interface ActualPt { t: number; kg: number; trend: number }
export type HoverHit =
  | { kind: "actual"; t: number; kg: number; trend: number }
  | { kind: "prognos"; t: number; kg: number; low: number; high: number };
```

    and in `nearestHit`'s actual loop: `best = { kind: "actual", t: p.t, kg: p.kg, trend: p.trend };`
  - `src/ui/app/api.ts` type updates (exact shapes):

```ts
export interface Weight { date: string; weight_kg: number; trend_kg: number; note: string | null }
export interface AccuracyBucket { days: number; n: number; mae_kg: number; bias_kg: number }
export interface Forecast { start: { date: string; weight_kg: number; stale: boolean };
  assumptions: { intake_kcal: number; intake_source: string; tdee_start: number; calibration: string; band_kcal: number };
  curve: ForecastPoint[]; weight_at_target: ForecastPoint | null; weight_at_goal_date: ForecastPoint | null;
  goal: { weight_kg: number; eta: string | null; eta_range: { earliest: string | null; latest: string | null }; reached: boolean; reason?: string } | null; notes: string[] }
export interface ForecastView { forecast: Forecast | null; reason?: string;
  accuracy?: { per_age: AccuracyBucket[] }; ghost?: { snapshot_date: string; curve: ForecastPoint[] } }
```

    `TrendView.latest` becomes `(WeightEntry & { trend_kg: number }) | null`.
  - `src/ui/app/components/WeightChart.tsx`:
    - Props: `{ series, forecast, ghost = null, scenarios = [] }` per the Interfaces block.
    - `actual` mapping becomes `series.map((w) => ({ t: Date.parse(w.date), kg: w.weight_kg, trend: w.trend_kg }))`.
    - Compute `ghostPts` and clipped scenario point arrays INSIDE the `useMemo` (where `actual` and `horizon` are in scope), return them from it, and add `ghost` + `scenarios` to the useMemo dependency array. Include their extents in the domain: `allT` also spreads their `t` values, `allKg` their kg values.
    - Ghost points: `const ghostPts = ghost ? ghost.curve.map((p) => ({ t: Date.parse(p.date), kg: p.kg })).filter((p) => p.t <= lastActualT) : [];` where `lastActualT = actual.at(-1)?.t ?? 0` — the ghost never draws into the future.
    - Scenario points: clip each scenario curve to the main chart horizon (`p.t <= horizon` with the existing `horizon` value).
    - The main line path (`actualD`) now goes through `Y(p.trend)` instead of `Y(p.kg)` (the drawn line IS the trend); dots stay at raw `kg`. The `point-label` after the last dot shows raw weight as before.
    - New paths rendered between the band and the main lines:

```tsx
        {ghostPts.length >= 2 ? (
          <path className="ghost-line" d={ghostPts.map((p, i) =>
            `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("")} />
        ) : null}
        {scenarios.map((s) => {
          const pts = s.curve.map((p) => ({ t: Date.parse(p.date), kg: p.kg })).filter((p) => p.t <= horizon);
          return pts.length >= 2 ? (
            <path key={s.slot} className={`scenario-line s${s.slot}`} d={pts.map((p, i) =>
              `${i === 0 ? "M" : "L"}${X(p.t).toFixed(1)},${Y(p.kg).toFixed(1)}`).join("")} />
          ) : null;
        })}
```

      (this requires `horizon` to be returned from the `useMemo` — add it to the returned object.)
    - Hover tooltip for `kind === "actual"` gains a third line (reuse the 34-height box): date, `${sv(hover.kg)} kg`, and `trend ${sv(hover.trend)}` in the `hover-tip-band` style. When scenarios are visible, append one tooltip line per scenario with the nearest scenario kg at `hover.t` (helper below in the component):

```ts
  const kgAt = (curve: ForecastPoint[], t: number): number | null => {
    let best: number | null = null, bestD = 4 * DAY;
    for (const p of curve) {
      const d = Math.abs(Date.parse(p.date) - t);
      if (d < bestD) { bestD = d; best = p.kg; }
    }
    return best;
  };
```

      Render scenario lines in the tooltip as `S1 ≈ x kg` / `S2 ≈ y kg` (grow the tip rect height by 10 per visible scenario line).
  - `src/ui/static/app.css` — add (respecting the existing kvitto variables; Okabe-Ito colors read on both themes):

```css
.ghost-line { fill: none; stroke: var(--ink, currentColor); stroke-width: 1; stroke-dasharray: 3 4; opacity: 0.35; }
.scenario-line { fill: none; stroke-width: 1.5; }
.scenario-line.s0 { stroke: #0072b2; }
.scenario-line.s1 { stroke: #e69f00; }
```

- [ ] **Step 4: Verify** — `bun test tests/chart.test.ts` → PASS, then typecheck the bundle path:

Run: `bun run build:ui`
Expected: builds without errors. (`Vikt.tsx` still compiles because the new `WeightChart` props are optional.)

- [ ] **Step 5: Commit**

```bash
git add src/ui/app/api.ts src/ui/app/lib/chart.ts src/ui/app/components/WeightChart.tsx src/ui/static/app.css tests/chart.test.ts
git commit -m "feat(kcal-assistant): trendlinje + prickar, ghost/scenario-lager i viktdiagrammet"
```

---

### Task 10: UI — Träffsäkerhet section, ghost toggle, ETA range tile

**Files:**
- Modify: `kcal-assistant/src/ui/app/views/Vikt.tsx`

**Interfaces:**
- Consumes: `fc.data.accuracy` / `fc.data.ghost` (Task 8 payload), `WeightChart` `ghost` prop (Task 9), `goal.eta_range` (Task 4).

- [ ] **Step 1: Implement** — in `ViktInner`:
  - Update the local `TrendData` interface: `latest: { date: string; weight_kg: number; trend_kg: number } | null`.
  - Add `const [showGhost, setShowGhost] = useState(false);` and `const ghostData = fc.data?.ghost ?? null;` (the const gives TS a stable narrowing for the JSX below).
  - Pass ghost to the chart: `<WeightChart series={series} forecast={forecast} ghost={showGhost ? ghostData : null} />`
  - "Senast" tile sub gains the trend: `sub={`${t.latest.date}${t.stale ? " · gammal" : ""} · trend ${sv(t.latest.trend_kg)}`}`
  - Ghost toggle chip directly under the chart (only when a ghost exists):

```tsx
      {ghostData ? (
        <div className="chip-row">
          <button className={`chip${showGhost ? " accent" : ""}`} onClick={() => setShowGhost((v) => !v)}>
            prognos för {Math.round((Date.now() - Date.parse(ghostData.snapshot_date)) / 86_400_000)} d sedan
          </button>
        </div>
      ) : null}
```

  - Träffsäkerhet section after `PrognosResult` (entirely absent without data):

```tsx
      {fc.data?.accuracy ? (
        <>
          <h2>Träffsäkerhet</h2>
          <div className="tiles">
            {fc.data.accuracy.per_age.map((b) => (
              <Tile key={b.days} label={`${b.days} d`} value={`±${sv(b.mae_kg)} kg`}
                    sub={`bias ${b.bias_kg > 0 ? "+" : ""}${sv(b.bias_kg)} kg · ${b.n} prognoser`} />
            ))}
          </div>
          <div className="note">Hur tidigare prognoser träffat trendvikten i efterhand. Positiv bias = prognosen låg för högt.</div>
        </>
      ) : null}
```

  - In `PrognosResult`, the Målvikt tile's sub uses the range when available:

```tsx
        {f.goal ? <Tile label="Målvikt" value={`${sv(f.goal.weight_kg)} kg`}
          sub={f.goal.reached ? "uppnådd"
            : f.goal.eta
              ? `nås ≈ ${f.goal.eta}${f.goal.eta_range.earliest ? ` (${f.goal.eta_range.earliest} – ${f.goal.eta_range.latest ?? "senare"})` : ""}`
              : f.goal.reason ?? null} /> : null}
```

- [ ] **Step 2: Verify build**

Run: `bun run build:ui`
Expected: builds clean.

- [ ] **Step 3: Commit**

```bash
git add src/ui/app/views/Vikt.tsx
git commit -m "feat(kcal-assistant): träffsäkerhet, ghost-kurva och ETA-intervall på Vikt-sidan"
```

---

### Task 11: UI — scenario pinning with localStorage

**Files:**
- Modify: `kcal-assistant/src/ui/app/views/Vikt.tsx`, `kcal-assistant/src/ui/app/components/PrognosPanel.tsx`, `kcal-assistant/src/ui/static/app.css`

**Interfaces:**
- Consumes: `forecastQuery(params)` and `PrognosParams` (existing exports of `PrognosPanel.tsx`); `WeightChart` `scenarios` prop (Task 9).
- Produces: `PrognosPanel` props gain `onPin: () => void` and `canPin: boolean`.

- [ ] **Step 1: Implement pin storage in `ViktInner`:**

```tsx
const STORAGE_KEY = "kcal.scenarios";

function loadPinned(): PrognosParams[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is PrognosParams =>
      p && (p.source === "targets" || p.source === "recent") && typeof p.overrides === "object" && p.overrides !== null,
    ).slice(0, 2);
  } catch {
    return [];
  }
}
```

  In `ViktInner`:

```tsx
  const [pinned, setPinned] = useState<PrognosParams[]>(loadPinned);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned)); }, [pinned]);
  const pin = () => setPinned((prev) => [...prev, params].slice(-2)); // third pin replaces the oldest
  const unpin = (i: number) => setPinned((prev) => prev.filter((_, idx) => idx !== i));
  const s0 = useApi<ForecastView>(pinned[0] ? `/ui/api/forecast?${forecastQuery(pinned[0])}` : null, true);
  const s1 = useApi<ForecastView>(pinned[1] ? `/ui/api/forecast?${forecastQuery(pinned[1])}` : null, true);
  const scenarios = [
    ...(pinned[0] && s0.data?.forecast ? [{ slot: 0 as const, curve: s0.data.forecast.curve }] : []),
    ...(pinned[1] && s1.data?.forecast ? [{ slot: 1 as const, curve: s1.data.forecast.curve }] : []),
  ];
```

  Pass `scenarios={scenarios}` to `WeightChart`. `canPin` is true when the current params differ from canonical: `params.source !== "targets" || Object.values(params.overrides).some((v) => v !== undefined && v !== "")`. No cap check — the third pin replaces the oldest.
  Scenario chips row (under the preview chip row, before the error banner):

```tsx
      {pinned.length ? (
        <div className="chip-row">
          {pinned.map((p, i) => {
            const res = i === 0 ? s0 : s1;
            const eta = res.data?.forecast?.goal?.eta;
            return (
              <span key={i} className={`chip scenario-chip s${i}`}>
                {scenarioLabel(p)}{eta ? ` · mål ≈ ${eta}` : ""}
                <button className="chip-x" aria-label="ta bort scenario" onClick={() => unpin(i)}>×</button>
              </span>
            );
          })}
        </div>
      ) : null}
```

  with:

```tsx
function scenarioLabel(p: PrognosParams): string {
  const parts: string[] = [];
  const o = p.overrides;
  if (o.intake) parts.push(`intag ${o.intake}`);
  if (o.activity) parts.push(`aktivitet ${o.activity.replace(".", ",")}`);
  if (o.goal) parts.push(`mål ${o.goal}`);
  if (o.goal_date) parts.push(`till ${o.goal_date}`);
  if (p.source === "recent") parts.push("senaste 28 d");
  return parts.length ? parts.join(" · ") : "planmål";
}
```

- [ ] **Step 2: Add the pin button to `PrognosPanel`** — props gain `onPin: () => void; canPin: boolean`; render next to the source chips:

```tsx
        <button className="chip" disabled={!canPin} onClick={onPin} title="fäst nuvarande förhandsvisning som jämförelse">
          fäst scenario
        </button>
```

  Vikt passes `onPin={pin} canPin={...}` per Step 1.

- [ ] **Step 3: CSS** — append to `app.css`:

```css
.scenario-chip .chip-x { background: none; border: none; cursor: pointer; margin-left: 4px; font-size: 12px; color: inherit; }
.scenario-chip.s0 { border-color: #0072b2; }
.scenario-chip.s1 { border-color: #e69f00; }
```

- [ ] **Step 4: Verify build + full suite**

Run: `bun run build:ui && bun test`
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add src/ui/app/views/Vikt.tsx src/ui/app/components/PrognosPanel.tsx src/ui/static/app.css
git commit -m "feat(kcal-assistant): fästa what-if-scenarier med localStorage på Vikt-sidan"
```

---

### Task 12: Browser verification, version bump, PR

**Files:**
- Modify: `kcal-assistant/package.json` (version), `kubernetes/apps/home-automation/kcal-assistant/app/deployment.yaml` (image tag)

- [ ] **Step 1: Manual browser walk** (dev server, seeded db):

```bash
cd kcal-assistant && bun run build:ui && \
  UI_DEV_NO_AUTH=1 MCP_TOKEN=dev DB_PATH=/tmp/kcal-dev.db PORT=3999 bun run start
```

Open `http://localhost:3999/ui` in a real browser (or via the Playwright plugin) and verify:
1. Vikt chart draws a smooth trend line with raw weigh-in dots around it; hover shows both values.
2. Forecast notes include the "osäkerhet ±… kcal/dag: …" line; Målvikt tile shows the ETA range when a goal is set.
3. Träffsäkerhet section is ABSENT (fresh db, no aged snapshots) — no empty shell.
4. No ghost chip appears (no old snapshots).
5. Pin a what-if (change intag → "fäst scenario") → colored thin line + chip with ETA; pin a second; a third replaces the oldest; reload the page → pins survive; × removes.
6. Console shows no new CSP violations beyond the 6 known Radix inline-style ones.

- [ ] **Step 2: Version bump + manifest**

- `kcal-assistant/package.json`: `"version": "0.9.0"`.
- `kubernetes/apps/home-automation/kcal-assistant/app/deployment.yaml`: image `docker.io/rutbergphilip/kcal-assistant:v0.9.0`.

- [ ] **Step 3: Full suite + production build one last time**

Run: `bun test && bun run build:ui`
Expected: all green.

- [ ] **Step 4: Commit + PR**

```bash
git add package.json ../kubernetes/apps/home-automation/kcal-assistant/app/deployment.yaml
git commit -m "feat(kcal-assistant): v0.9.0 — prognosmotor v2"
git push -u origin kcal-forecast-engine-v2
gh pr create --title "feat(kcal-assistant): v0.9.0 — prognosmotor v2" --body "$(cat <<'EOF'
Prognosmotor v2 per spec docs/superpowers/specs/2026-07-10-kcal-forecast-engine-v2-design.md:

- **Trendvikt**: EWMA-utjämning (α 0,10/dag, gap-justerad) — diagrammets linje, prognosens startvikt och get_trend/vikt-API:t använder trenden; rådata blir prickar.
- **Ärlig osäkerhet**: ±150 kcal ersatt av datadriven felbudget (kalibrering, intagskälla, vägningstäthet; 125–400 kcal) + mål-ETA som intervall (eta_range).
- **Träffsäkerhet**: migration 5, forecast_snapshots (kanoniska prognoser, upsert per dag, triggas bl.a. av log_weight), accuracy per ålder (7/14/28/56 d, MAE + bias) + ghost-kurva i UI.
- **Scenariojämförelse**: upp till 2 fästa what-if-kurvor på Vikt-sidan, localStorage-persistens. UI-only.

MCP: 24 verktyg, inga input-schemaändringar (get_forecast-beskrivningens bandformulering korrigerad). Ingen ny chatt behövs.

Plan: docs/superpowers/plans/2026-07-10-kcal-forecast-engine-v2.md

https://claude.ai/code/session_018bdcBb7HJ6UUj8LXCt18qD
EOF
)"
```

After merge: CI builds/pushes the image, Flux (`cluster-apps`) deploys within ~2 min; verify pod image v0.9.0, healthz 200, `tools/list` = 24, and the Vikt page live behind Authentik. No new chat needed (input schemas unchanged). Träffsäkerhet populates after ~a week of weigh-ins.
