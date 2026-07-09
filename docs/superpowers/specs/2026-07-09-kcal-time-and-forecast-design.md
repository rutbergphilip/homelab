# kcal-assistant v0.6.0 — Tillagningstid + Viktprognos

Date: 2026-07-09
Status: design approved in brainstorming with Philip; this document is the spec for the implementation plan.
Scope: one release (one PR), migration 4, two new MCP tools (22 → 24), UI additions to KCAL·DB.

## Feature 1: Recipe cooking time (Tillagningstid)

The "smart calculation" is done by Claude in the chat and stored by the server. The server
performs no culinary text parsing — consistent with the existing architecture split
(Claude = intelligence, server = storage + arithmetic).

### Schema (part of migration 4)

Two nullable integer columns on `recipes`:

- `active_minutes` — hands-on time.
- `total_minutes` — start to done, including passive time (oven, simmer).

### Tool changes

- `save_recipe`: new optional integer params `active_minutes` and `total_minutes`.
  - Tool description instructs Claude: *always estimate both times from the ingredients and
    instructions when the user does not state them* (the "smart kalkyl").
  - Partial-update semantics identical to `servings`: omitted = preserved, `null` = cleared.
  - Validation: positive integers; when both are set, `total_minutes >= active_minutes`.
- `get_recipe`: returns both fields.
- `find_recipes`: summaries include `total_minutes` (for list display).

### UI

- Recipe list: `~45 min` next to each recipe (from `total_minutes`; hidden when null).
- Recipe detail: `Tid: 45 min totalt · 15 min aktiv` (each part hidden when null).

### Backfill

No server code. Philip asks Claude in a chat to loop existing recipes
(`find_recipes` → `get_recipe` → `save_recipe` with estimated times).

## Feature 2: Weight forecast (Viktprognos)

### Profile storage (prerequisite)

Single-row `profile` table (part of migration 4):

```sql
CREATE TABLE profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  birth_date      TEXT NOT NULL,          -- age auto-updates; computed per simulated day
  sex             TEXT NOT NULL CHECK (sex IN ('man','kvinna')),
  height_cm       REAL NOT NULL CHECK (height_cm > 0),
  activity_factor REAL NOT NULL CHECK (activity_factor >= 1.2 AND activity_factor <= 2.5),
  goal_weight_kg  REAL CHECK (goal_weight_kg > 0),
  goal_date       TEXT,                   -- "when I want to be done"
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- New MCP tool `set_profile`: partial upsert (omitted = preserved; `null` clears
  `goal_weight_kg`/`goal_date`; the four physiological fields are required on first insert,
  never clearable afterwards). Tool description carries activity-factor guidance:
  1.2 stillasittande, 1.375 lätt aktiv, 1.55 måttligt aktiv, 1.725 mycket aktiv, 1.9 extremt aktiv.
- `get_context` gains a `profile` block (all fields) when a profile exists.
- The UI stays read-only: profile and goals are edited via the chat, like everything else.

### Model (`src/lib/forecast.ts`, pure function, unit-tested — same pattern as `trend.ts`)

Calibrated adaptive simulation:

1. **BMR** (Mifflin-St Jeor): `10·kg + 6.25·height_cm − 5·age + 5` (man) / `− 161` (kvinna).
   Age computed from `birth_date` at each simulated date.
2. **Formula TDEE**(weight) = BMR(weight) × `activity_factor`.
3. **Calibration**: reuse the 28-day backwards-TDEE from `computeTrend`. When it yields
   `est_tdee` with `uncertain: false`, apply
   `offset = est_tdee − formulaTDEE(start_weight)`, clamped to ±500 kcal, held constant
   through the simulation. Otherwise `offset = 0`. Report `calibration: "mätdata" | "formel"`.
4. **Start point**: mean of all weigh-ins within 7 days of the latest weigh-in;
   simulation starts at the latest weigh-in's date (so if the log is stale, the elapsed days
   are simulated too). `stale: true` in assumptions when the latest weigh-in is > 7 days old.
5. **Daily step (Euler)**: `w[i+1] = w[i] − (formulaTDEE(w[i]) + offset − intake) / 7700`.
   7700 kcal per kg. The curve flattens naturally as weight drops.
6. **Horizon**: 365 days from today. Sanity floor: stop the curve if weight would go below 40 kg.
7. **Uncertainty band**: the same simulation run at intake ±150 kcal/day produces
   `low`/`high` envelope curves.

**Intake sources** (selectable, `intake_source` param):

- `targets` (default — "if I stick to my kcals"): weighted average of `day_targets.kcal` by the
  observed `day_type` distribution in the `days` table over the last 28 days.
  Fewer than 7 day rows in that window → fall back to the `vilodag` target and flag it in
  assumptions.
- `recent`: average logged kcal over the last 28 days that have logged meals.
- Explicit `intake_kcal` override (wins over both).

**Outputs** (one result object):

- `curve`: daily points `{date, kg}` plus `low`/`high` band values.
- `weight_at`: predicted weight at a requested `target_date` (direct lookup in the daily curve;
  also computed for the profile's `goal_date` when set).
- `goal_eta`: first date the goal weight is crossed. Already at/past goal → `"uppnått"` today.
  Not reachable within the horizon (or moving away from goal with current intake) →
  `null` + reason `"nås inte inom 365 dagar med nuvarande intag"`.
- `assumptions`: start weight/date, intake used + source, TDEE at start, calibration,
  stale flag, kcal-per-kg constant.
- Display rounding: weights to 0.1 kg; ETAs are dates.

### Exposure

- **MCP tool `get_forecast`** `{ target_date?, goal_weight?, intake_kcal?, intake_source? }`
  (overrides fall back to profile values). Token-lean output: assumptions, `weight_at`,
  `goal_eta`, and weekly (not daily) curve points — enough for the chat to answer
  "vad väger jag 1 september?" and "när når jag 80?".
- **UI API** `GET /ui/api/forecast?source=targets|recent` — computed read, writes nothing
  (fits the read-only contract). Returns the full daily curve + band so the client can answer
  any date instantly without re-fetching.

### UI (Vikt page)

The frontend-design skill is used when implementing this section.

- **Goals & tiles**: goal weight, goal date, `goal_eta` ("når 80 kg ≈ 12 okt"), predicted weight
  at goal date, TDEE used + calibration label (`kalibrerad mot mätdata` / `formel`).
- **Real-time date picker**: pick any date within the horizon → predicted weight, read
  client-side from the fetched daily curve (instant; no network churn). Source toggle
  (`plan` / `senaste 28 d`) triggers one re-fetch.
- **Chart**: one SVG extending the existing trend chart — actual weigh-ins at full opacity,
  projected line dashed at low opacity (the "estimate" visual language Philip asked for),
  uncertainty band as a translucent area, horizontal marker at goal weight, vertical markers
  at goal date and `goal_eta`.

### Failure modes

- No profile → forecast unavailable, `reason: "ingen profil — sätt via set_profile i chatten"`.
- No weigh-ins → reason string (same style as trend).
- `target_date` in the past → 400 / tool error.
- `target_date` beyond the 365-day horizon → clamped, noted in assumptions.
- `goal_date` in the past → ignored with a note.

## Tests

- `tests/forecast.test.ts` (pure function): curve flattening, calibration offset + clamp,
  goal ETA (reached / already reached / unreachable), band, intake-source weighting +
  fallback, stale start, past/beyond-horizon dates, sanity floor.
- Recipe tests: time fields save/partial-update/clear/validation, summary field.
- `ui-api` tests: forecast endpoint (happy path, no profile, source param).

## Release

Single PR to the homelab repo: migration 4 (recipe columns + profile table), tools 23–24,
`lib/forecast.ts`, UI API + Vikt page work, tests, version bump v0.5.0 → v0.6.0 in
`package.json` + image tag in `deployment.yaml`. Same CI flow (merge → build → Flux).
After deploy Philip starts a **new chat** so the connector sees the new tools, then:
set profile once, backfill recipe times, log on.

## Out of scope (deliberate)

- Server-side text-parsing time heuristics.
- NIH/Hall body-composition model, adaptive-thermogenesis terms, body-fat % input
  (profile schema can grow later — "we can add more later").
- Editing profile/goals from the UI (UI stays read-only).
