# Kcal Recipe Rating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decimal recipe ratings (1.0–10.0) stored in kcal-assistant, settable from chat (`rate_recipe`) and the KCAL·DB UI, filterable in `find_recipes` and visible/sortable in the UI.

**Architecture:** Migration 11 adds `recipes.rating REAL`. One shared validation/write function in `db/recipes.ts` serves both the new MCP tool and a new `PUT /ui/api/recipes/:id` endpoint (body `{ rating }`, behind the existing `writeGate`). UI shows a badge + sort on the list, a tile + slider editor on the detail page.

**Tech Stack:** Bun + bun:sqlite, zod (MCP tools), React 19 UI, bun test.

## Global Constraints

- Scale 1.0–10.0, ONE decimal (server rounds via `Math.round(r*10)/10`), `null` = cleared/unrated.
- Swedish error copy: `"betyg måste vara mellan 1 och 10"`.
- `save_recipe` must NOT gain a rating field.
- Routing: `API_ROUTE` allows only `/ui/api/<resource>/<param>` — the UI write is `PUT /ui/api/recipes/:id` with strict single-key body `{ rating: number|null }`. (Spec amended from `/rating` sub-path.)
- Bump: package.json `0.15.0` + deployment.yaml `v0.15.0` in the SAME commit/PR.
- All work in `kcal-assistant/` (tests via `cd kcal-assistant && bun test`).

---

### Task 1: DB layer — migration + rateRecipe + summaries/filter

**Files:**
- Modify: `kcal-assistant/src/db/migrations.ts` (append migration 11)
- Modify: `kcal-assistant/src/db/recipes.ts`
- Test: `kcal-assistant/tests/recipes.test.ts` (new describe block)

**Interfaces:**
- Produces: `rateRecipe(db, id: number, rating: number | null): RecipeView` (throws on unknown id / invalid rating); `RecipeView.rating: number | null`; `RecipeSummary.rating: number | null`; `findRecipes(db, query?, minRating?: number)`.

- [x] **Step 1: Write failing tests** — new `describe("rateRecipe / rating")` block: set rating returns rounded value; 8.55 → 8.6; update overwrites; null clears; 0.9 / 10.1 / NaN throw with Swedish message; unknown id throws; `getRecipe` + `findRecipes` summaries carry rating; `findRecipes(db, undefined, 8)` returns only recipes with rating >= 8 (unrated excluded).
- [x] **Step 2: Run to verify failure** (`bun test tests/recipes.test.ts`)
- [x] **Step 3: Implement** — migration 11 `ALTER TABLE recipes ADD COLUMN rating REAL;`; `RecipeRow.rating`; RecipeView/RecipeSummary rating; `rateRecipe` (validate finite + 1..10, round, UPDATE with `updated_at = datetime('now')`, return `getRecipe`); `findRecipes` optional `minRating` (`rating IS NOT NULL AND rating >= ?`).
- [x] **Step 4: Tests pass**
- [x] **Step 5: Commit**

### Task 2: MCP surface — rate_recipe tool + find_recipes min_rating

**Files:**
- Modify: `kcal-assistant/src/tools/recipes.ts`

**Interfaces:**
- Consumes: `rateRecipe`, `findRecipes` from Task 1.
- Produces: tool `rate_recipe` `{ id: int, rating: number|null }`; `find_recipes` gains `min_rating: number optional`.

- [x] Register `rate_recipe` (description: decimal 1–10, null clears, confirm saved rounded value back to Philip); add `min_rating` to `find_recipes` schema + pass through. Typecheck + full test run. Commit.

### Task 3: UI API — PUT /ui/api/recipes/:id + rating in GET

**Files:**
- Modify: `kcal-assistant/src/ui/api.ts` (recipes case: method branch, strict body coercion `{rating}` only)
- Test: `kcal-assistant/tests/ui-api.test.ts` (or existing pattern file) — PUT matrix

- [x] Failing tests: PUT ok (200, body.rating), clear (null → 200), cross-site 403, wrong content-type 403, invalid rating 400, unknown field 400, unknown id 404, GET list carries rating. Implement: recipes case handles GET (unchanged) + PUT param path via `writeGate` + strict shape (`rating` number|null only) + `rateRecipe` in try/catch (unknown id → 404, validation → 400). Tests green. Commit.

### Task 4: UI — list badge/sort + detail editor

**Files:**
- Modify: `kcal-assistant/src/ui/app/api.ts` (RecipeSummary/RecipeView + rating)
- Modify: `kcal-assistant/src/ui/app/views/Recept.tsx` (badge `★ 8,5`; sort select Namn/Betyg — betyg desc, unrated last)
- Modify: `kcal-assistant/src/ui/app/views/ReceptDetalj.tsx` (Betyg tile; `<details>`-style inline editor: range 1–10 step 0.1 + value + Spara/Rensa via `putJson`, then `reload()`)
- Modify: `kcal-assistant/src/ui/static/app.css` if a small style is needed (follow kvitto aesthetic)

- [x] Implement, `bun run typecheck` (or tsc equivalent), `bun run build:ui` succeeds, full `bun test` green. Commit.

### Task 5: Docs + release bump

**Files:**
- Modify: `kcal-assistant/README.md` (UI read-only invariant: profil, plan, receptbetyg; tool count 29)
- Modify: `kcal-assistant/package.json` (`0.15.0`)
- Modify: `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml` (`v0.15.0`)

- [x] Update, full test suite green, commit (bump files staged TOGETHER).

### Task 6: Ship — PR, merge, CI, Flux, verify

- [x] Branch → push → PR → merge (Philip pre-approved autonomous deploy) → CI green → Flux reconcile → pod runs v0.15.0 → healthz 200 → MCP tools/list = 29 → UI spot-check (list badge + detail editor) via browser if feasible, else curl the JSON APIs live.

## Self-Review

- Spec coverage: scale/rounding (T1), storage (T1), rate_recipe + min_rating + get_recipe (T1/T2), no save_recipe change (constraint), UI badge/sort/editor (T4), writeGate matrix (T3), README invariant (T5), release flow (T5/T6). Spec's `/rating` sub-path amended to `PUT /ui/api/recipes/:id` (routing regex constraint) — spec updated in same commit.
- No placeholders; types consistent (`rating: number | null` everywhere).
