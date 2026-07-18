# Meal Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Week meal planner (Mon–Sun, slot-based, kcal+macros) in kcal-assistant, editable via MCP + KCAL·DB UI, confirmable per day (logs to goals), displayed on the wall-hub as a new page + Hem chip.

**Architecture:** New plan tables (migration 6) with live `resolveItem` resolution; confirm copies planned meals into `meals` via the existing insert path. 3 new MCP tools; UI writes copy the `PUT /ui/api/profile` gate; wall panel reads/confirms through cluster-only `:3001` with Cilium L7 pinning.

**Tech Stack:** Bun + bun:sqlite + zod + MCP SDK; React 19 (KCAL·DB); Lit (glass-cards); HA REST sensors + rest_command; Cilium L7.

**Spec:** `docs/superpowers/specs/2026-07-18-meal-planner-design.md` — the authoritative behavior source. Every task implicitly includes it.

## Global Constraints

- Slots: `'frukost' | 'lunch' | 'middag' | 'mellis'` exactly.
- Day types unchanged: `vilodag | gymdag | flexdag`; targets read live via `getTargetsFor`.
- All macro math server-side; planned meals resolve LIVE (product edits propagate). Ad-hoc macros round via `roundMacros` at read (same as resolveItem does).
- Recipe-based meal scaling: `per_serving × recipe_servings` when recipe.servings set, else `totals × recipe_servings`.
- Reads never write (no `ensureDay` in read paths) — same guarantee as `readDay`.
- Swedish copy everywhere in UI/errors ("Bekräfta", "redan bekräftad", "inget planerat", "dagen är redan bekräftad — ändringar påverkar inte loggen").
- UI writes: `Sec-Fetch-Site: same-origin` + JSON content-type + strict shape coercion (mirror `coerceProfileBody`).
- kcal-assistant version → `0.11.0` (27 tools). glass-cards: pure logic in testable modules.
- Repo flow: feature branch + PR for kcal-assistant (CI builds image, Flux deploys).

---

### Task 1: db/plan.ts — schema, upsert, week read

**Files:**
- Modify: `kcal-assistant/src/db/migrations.ts` (append migration 6 — exact SQL in spec §Data model)
- Create: `kcal-assistant/src/db/plan.ts`
- Test: `kcal-assistant/tests/plan.test.ts`

**Interfaces (Produces):**
```ts
export type PlanSlot = "frukost" | "lunch" | "middag" | "mellis";
export interface PlannedMealInput {
  slot: PlanSlot; name: string;
  recipe_id?: number; recipe_servings?: number;   // recipe-based (items must be absent)
  items?: MealItemInput[];                        // item-based
  post_gym_shake?: boolean; note?: string;
}
export interface PlanDayInput {
  date: string; day_type?: string;
  clear_slots?: PlanSlot[];
  meals?: PlannedMealInput[];
}
export interface PlannedMealView extends Macros {
  id: number; slot: PlanSlot; position: number; name: string;
  recipe_id: number | null; recipe_servings: number | null;
  post_gym_shake: boolean; note: string | null;
  logged: boolean;                                 // logged_meal_id !== null
  totals_incomplete?: true;
  items?: PlannedItemView[];                       // when include_items
}
export interface PlanDayView {
  date: string; weekday: string;                   // "måndag" … (sv-SE)
  day_type: string; targets: DayTargets;
  confirmed: boolean; confirmed_at: string | null;
  meals: PlannedMealView[];                        // ordered slot (frukost,lunch,middag,mellis), position
  totals: Macros;                                  // planned totals (ALL planned meals)
  remaining: { kcal: number; protein_to_min: number; fat_to_min: number; carbs: number | null };
  checks: { kcal_ok: boolean; protein_floor_ok: boolean; fat_floor_ok: boolean };
  warning?: string;                                // set by upsert on confirmed days
}
export interface PlanWeekView {
  start_date: string; end_date: string; days: PlanDayView[]; // len 7×weeks
  week: { planned_days: number; confirmed_days: number; avg_planned_kcal: number | null; avg_target_kcal: number };
}
export function mondayOf(date: string): string;                    // toEpochDays-based; epochDay 0 = torsdag ⇒ ((d+3)%7+7)%7 offset
export function getPlanWeek(db, opts?: { start?: string; weeks?: number; include_items?: boolean }): PlanWeekView;
export function upsertPlanDays(db, days: PlanDayInput[], replace?: boolean): PlanDayView[]; // replace default true
```

Behavior details:
- `upsertPlanDays` in ONE transaction: per day → validate date, `ensureDay`, optional `setDayType`-equivalent (`UPDATE days SET day_type`; validate via `getTargetsFor`), delete `clear_slots` meals, then per input meal: validate (recipe XOR items; recipe must exist; `recipe_servings` required with `recipe_id`, positive; items validated by attempting `resolveItem` — throw on invalid input shape but NOT on unresolvable product for ad-hoc macro rows), `replace=true` ⇒ delete existing meals in each slot mentioned in `meals` (once per slot, before inserts), insert with next `position`. Day confirmed ⇒ still applies but view gets `warning`.
- `kcal_ok` = totals.kcal ≤ targets.kcal.
- Meal macro resolution (shared `resolvePlannedMeal`): recipe-based → `getRecipe` (missing recipe ⇒ `totals_incomplete` + zero macros, reason "receptet har tagits bort"); item-based → per-item `resolveItem` with try/catch like `getRecipe` does (unresolved ⇒ skip from totals, flag).
- `getPlanWeek` default start = `mondayOf(todayStockholm())`, weeks clamp 1–4.

- [ ] Write failing tests: monday snapping (Wed→Mon, Mon→same, Sun→prior Mon, across DST 2026-03-29 + year boundary), upsert insert/replace/append(replace:false)/clear_slots, day_type set + invalid day_type throws, recipe XOR items error, recipe scaling per-serving and batch fallback, unresolved item flagged + excluded from totals, ordering, week aggregates, read-only getPlanWeek (no day rows created — copy `week.test.ts` non-mutation assertion style)
- [ ] Run: `cd kcal-assistant && bun test tests/plan.test.ts` → FAIL (module missing)
- [ ] Implement migration 6 + db/plan.ts
- [ ] Run tests → PASS; run full `bun test` → no regressions (migration count assertions may need updating)
- [ ] Commit `feat(plan): schema + upsert + week read`

### Task 2: confirm / unconfirm

**Files:** Modify `kcal-assistant/src/db/plan.ts`; Test: `kcal-assistant/tests/plan-confirm.test.ts`

**Produces:**
```ts
export function confirmDay(db, date: string, slots?: PlanSlot[]): { day: DayView; plan: PlanDayView };
export function unconfirmDay(db, date: string): { day: DayView; plan: PlanDayView };
```
- confirm: transaction; scope = planned meals on date (filtered by slots) with `logged_meal_id IS NULL`; any `totals_incomplete` in scope ⇒ throw listing meal names ("kan inte bekräfta: olösta poster i …"). Insert meals rows: item-based → one meal_item per resolved item (via existing `insertItems`-equivalent using resolved macros as explicit `macros` input so rounding isn't double-applied — pass `{description, grams, quantity, macros}`), recipe-based → single item `{description: "«name» (N port)", macros: scaled}`. Carry `post_gym_shake`. Set `logged_meal_id`. If zero in scope: all already logged ⇒ throw "redan bekräftad"; none exist ⇒ throw "inget planerat". After: if no unlogged planned meals remain on date ⇒ `plan_confirmed_at = datetime('now')`.
- unconfirm: delete meals whose id ∈ date's `logged_meal_id`s; clear `plan_confirmed_at`; nothing logged ⇒ throw "inget att ångra".

- [ ] Failing tests: whole-day confirm creates meals + day totals match planned totals, plan_confirmed_at set, idempotency (second confirm throws "redan bekräftad"), partial slot confirm (middag only ⇒ not confirmed_at; then rest ⇒ confirmed), unresolved blocks, unconfirm removes ONLY plan meals (manually logged meal survives), edit_meal-delete of a plan-logged meal clears pointer (FK) and day no longer "confirmed"? (plan_confirmed_at stays — assert current design: stamp remains until unconfirm; meal shows logged:false) — actually assert: pointer cleared via `ON DELETE SET NULL`, confirm can re-log that meal
- [ ] Run → FAIL, implement, run → PASS, full suite, commit `feat(plan): confirm/unconfirm days`

### Task 3: shopping list

**Files:** Modify `kcal-assistant/src/db/plan.ts`; Test: `kcal-assistant/tests/plan-shopping.test.ts`

**Produces:**
```ts
export interface ShoppingLine { product_id: number | null; description: string; grams: number | null; quantity: number | null; portion_name: string | null; }
export function buildShoppingList(db, start: string, days: number): ShoppingLine[];
```
Aggregation over UNLOGGED planned meals in [start, start+days): recipe-based expand ingredients scaled by servings factor; group by product_id (sum grams; sum quantity only when same portion_name); ad-hoc/no-product lines listed individually by description. Sorted by description.

- [ ] Failing tests (aggregation across meals + recipe expansion + logged excluded) → implement → PASS → commit `feat(plan): shopping list aggregation`

### Task 4: MCP tools plan_week / get_plan / confirm_day

**Files:** Create `kcal-assistant/src/tools/plan.ts`; Modify `kcal-assistant/src/mcp.ts` (register), `kcal-assistant/tests/server.test.ts` (tool count 24→27 if asserted); Test: `kcal-assistant/tests/plan-tools.test.ts`

Zod inputs (reuse `dateSchema`, `dayTypeSchema`, `mealItemSchema`; `slotSchema = z.enum(["frukost","lunch","middag","mellis"])`):
- `plan_week`: `{ days: z.array(dayInput).min(1), replace: z.boolean().optional() }` where dayInput = `{ date: dateSchema, day_type: dayTypeSchema.optional(), clear_slots: z.array(slotSchema).optional(), meals: z.array(plannedMealSchema).optional() }`. Handler → `upsertPlanDays`, returns compact days (NO items).
- `get_plan`: `{ start: dateSchema.optional(), weeks: z.number().int().min(1).max(4).optional(), include_items: z.boolean().optional(), shopping_list: z.boolean().optional() }`.
- `confirm_day`: `{ date: dateSchema, action: z.enum(["confirm","unconfirm"]), slots: z.array(slotSchema).optional() }`.
Descriptions (Swedish-aware, mirroring existing tone) must tell Claude: plan_week is THE planning tool (batch a whole week in one call, day_type inline, replace semantics), get_plan before planning discussions, confirm_day = Philip's "lås dagen" → logs to goals.

- [ ] Failing tests (register via buildMcpServer, call handlers through server like existing tool tests do — follow `tests/server.test.ts` pattern) → implement → PASS → commit `feat(plan): MCP tools (27 total)`

### Task 5: UI API + server gate

**Files:** Modify `kcal-assistant/src/ui/api.ts`, `kcal-assistant/src/server.ts:125-128` (method gate); Test: `kcal-assistant/tests/ui-api-plan.test.ts`, extend `kcal-assistant/tests/ui-auth.test.ts` matrix

- `GET /ui/api/plan?start&weeks` → `getPlanWeek({include_items:true})` + `shopping_list` field (`buildShoppingList` over same range).
- `PUT /ui/api/plan/<date>` → CSRF gate (same-origin + JSON) → strict coercion `coercePlanDayBody` (unknown key ⇒ error; meals validated shape-wise, values validated in db layer) → `upsertPlanDays(db,[{date,...body}], body.replace)` → `{ day: PlanDayView }`.
- `PUT /ui/api/confirm/<date>` → CSRF gate → `{action, slots?}` → confirm/unconfirm → 200 `{day, plan}`; domain errors → 409 `{error}` ("redan bekräftad"/"inget planerat"/"inget att ångra"), other validation → 400.
- server.ts gate becomes: allow PUT when pathname is `/ui/api/profile` or `/ui/api/confirm/<date>` or `/ui/api/plan/<date>` (regex `/^\/ui\/api\/(plan|confirm)\/\d{4}-\d{2}-\d{2}$/`).

- [ ] Failing tests: happy paths, cross-site 403, wrong content-type 403, unknown field 400, bad date 400, GET plan snapping, 409s; auth matrix parity with profile → implement → PASS → commit `feat(plan): UI API writes`

### Task 6: /internal/planner + confirm POST

**Files:** Modify `kcal-assistant/src/ui/internal.ts` (add `buildInternalPlanner`), `kcal-assistant/src/server.ts` (internal server routes); Test: extend `kcal-assistant/tests/internal-summary.test.ts` or new `tests/internal-planner.test.ts` + security parity in `tests/server.test.ts` (404 on :3000 handler)

```ts
export interface InternalPlannerDay { date: string; weekday: string; day_type: string; confirmed: boolean;
  meals: Array<{ slot: string; name: string; kcal: number; protein: number; fat: number; carbs: number; logged: boolean }>;
  total_kcal: number; target_kcal: number; protein_ok: boolean; kcal_ok: boolean; }
export interface InternalPlanner { status: "ok"; week_start: string; today: string; confirmed_days: number; days: InternalPlannerDay[]; }
export function buildInternalPlanner(db): InternalPlanner;   // never throws; current week
```
- Internal server: `GET /internal/planner` → JSON no-store; `POST /internal/planner/confirm` body `{date}` (readBody 4KB, JSON, valid date) → `confirmDay(db, date)` → 200 `{ok:true, date}`; domain error → 409 `{error}`; invalid → 400. Main :3000 handler must NOT serve these (parity test).

- [ ] Failing tests → implement → PASS → commit `feat(plan): internal planner endpoints`

### Task 7: KCAL·DB Vecka view

**Files:** Create `kcal-assistant/src/ui/app/views/Vecka.tsx`, `kcal-assistant/src/ui/app/components/PlanMealDialog.tsx`; Modify `kcal-assistant/src/ui/app/index.tsx` (TABS + route `#/vecka`), `kcal-assistant/src/ui/app/api.ts` (fetch helpers `putJson` if absent), `kcal-assistant/src/ui/static/app.css` only if the app uses css files (check — v0.8.0 is React; styles co-located)

Behavior (spec §UI): week grid (7 cols desktop / stacked mobile via CSS grid auto-fit), header ‹ idag ›, per-day card: weekday+date, day-type `<select>` (PUT plan/<date> {day_type}), totals chip + floor warnings (⚠ when checks fail), slot sections, meal rows (name + kcal; expand → P/F/K + items), actions per meal: ta bort (PUT plan/<date> {clear via replace of slot minus meal — implement as meals rebuild: send slot's remaining meals with replace:true} — simpler: dedicated rebuild helper in view), flytta (day/slot pickers → two PUTs: remove + append with replace:false), portioner edit for recipe-based (rebuild slot), lägg till → dialog with tabs "Från recept" (recipes list via existing `/ui/api/recipes`, servings input) and "Snabb" (name + 4 macro inputs → ad-hoc item). Confirm button: dialog "Bekräfta måndag 20 juli? Måltiderna loggas." → PUT confirm; confirmed day: låst badge + "Ångra bekräftelse" (second dialog). Optimistic-free: refetch week after every write (small payload, simple). Shopping list: collapsible "Handlingslista" section below grid.
Slot rebuild semantics note: since PUT replaces whole slots, the view always sends the complete desired slot contents — planned items round-trip via `items` in PlanDayView (include_items:true gives raw input? NO — items are RESOLVED view). ⇒ **PlanDayView.items must include raw input fields** (product_id, grams, quantity, portion_name, plus ad-hoc macros when stored) exactly like RecipeIngredientView does — Task 1 must expose these so the UI can rebuild slots losslessly. Recipe-based meals rebuild from recipe_id + recipe_servings.

- [ ] Implement view + dialog; `bun run build:ui` (MUST use existing build script — `--production` gotcha) 
- [ ] `bun test` full suite green; manual dev-server sanity (`UI_DEV_NO_AUTH=1 bun run dev:ui`) — verify grid renders with seeded plan, confirm flow, add-from-recipe
- [ ] Commit `feat(plan): Vecka UI view`

### Task 8: infra + version

**Files:** Modify `kubernetes/apps/home-automation/kcal-assistant/networkpolicy.yaml` (add GET /internal/planner + POST /internal/planner/confirm to the :3001 L7 rules), `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml` (image tag v0.11.0), `kcal-assistant/package.json` (version 0.11.0), `.claude/ha-rest-sensors.yaml` (mirror: new sensor + rest_command block)

New HA config blocks (to apply in Task 10, mirrored now):
```yaml
# appended to the kcal rest resource's sensor list? NO — separate resource (different endpoint):
rest:
  - resource: http://kcal-assistant.home-automation.svc.cluster.local:3001/internal/planner
    scan_interval: 300
    timeout: 10
    sensor:
      - name: "Kcal veckoplan"
        unique_id: kcal_veckoplan
        value_template: "{{ value_json.confirmed_days }}"
        availability: "{{ value_json is defined and value_json.status == 'ok' }}"
        json_attributes: [week_start, today, days]
rest_command:
  kcal_confirm_day:
    url: http://kcal-assistant.home-automation.svc.cluster.local:3001/internal/planner/confirm
    method: POST
    content_type: application/json
    payload: '{"date": "{{ date }}"}'
```

- [ ] Edit files; `bun test` green; commit `feat(plan): netpol + v0.11.0 + HA config mirrors`

### Task 9: glass-cards planner page + Hem chip

**Files:** Create `glass-cards/src/hub/planner-model.ts` (pure parse/derive: payload→typed week, today index, next unlogged meal for chip, per-day display rows), `glass-cards/src/hub/pages/hub-planner-page.ts`; Modify `glass-cards/src/hub/glass-hub.ts` (register page "Vecka", nav), `glass-cards/src/hub/hub-config.ts` (kcal.planner_entity), `glass-cards/src/hub/pages/hub-home-page.ts` (chip), `glass-cards/scripts/hub-config.mjs` (planner_entity: sensor.kcal_veckoplan); Test: `glass-cards/test/planner-model.test.ts` (vitest, follow energy-model test pattern)

Page: 7 columns Mon–Sun, today highlighted (border accent), day-type letter chip (G amber-ish? NO — spec: reuse existing accents, kcal domain lavender; day-type chip: G=green/V=dim/F=teal per available tokens — pick in code from tokens.ts), confirmed ✓ badge, meals grouped by slot with kcal, total vs target footer, coral ⚠ on floor miss. Tap day → existing popup pattern (hub-room-popup style) with macro table + Bekräfta button → `hass.callService('rest_command','kcal_confirm_day',{date})` then `hass.callService('homeassistant','update_entity',{entity_id: plannerEntity})` after ~1.5s; button hidden when confirmed or day has no meals; offline state like kcal page. Hem chip: next unlogged planned meal today ("Middag · Lax · 720 kcal"), hidden when none; tap → navigate to planner page (same mechanism nav bar uses).

- [ ] Failing vitest for planner-model → implement model → PASS
- [ ] Implement page/chip/config/nav; `npm test` + `npm run build` green
- [ ] Commit `feat(hub): Vecka planner page + Hem chip`

### Task 10: deploy server + HA config

- [ ] Push branch, open PR (kcal changes + k8s + docs), verify CI green, merge (Philip pre-approved; use gh; if merge blocked by auto-mode classifier, note and proceed via allowed path)
- [ ] Wait for CI image + Flux (`cluster-apps` Kustomization lag ~min; pods label `app=kcal-assistant`); verify: pod tag v0.11.0, `/healthz` 200, MCP tools/list = 27, `kubectl exec` curl `GET :3001/internal/planner` → status ok, POST confirm on an empty day → 409 "inget planerat", routes 404 on :3000
- [ ] Apply HA config: read current `/config/configuration.yaml` from HA pod, append blocks (idempotent check first), restart HA (Recreate; wait), verify `sensor.kcal_veckoplan` exists via API
- [ ] Commit any doc deltas

### Task 11: deploy hub + end-to-end verify

- [ ] `npm run build && ./scripts/upload.sh && node scripts/deploy.mjs hub`
- [ ] Seed a real plan for the current week via direct MCP call or bun script against prod? NO writes outside product paths — use the MCP endpoint with the prod token (it IS the product path) to plan a plausible week for verification, or leave seeding to Philip's chat. Minimal: plan today+tomorrow via MCP HTTP call so the panel shows content.
- [ ] Claude-in-Chrome walk: wall-hub → Vecka page renders week, chip on Hem, popup + Bekräfta (verify sensor refresh), KCAL·DB /ui#/vecka (needs Philip's Authentik session — if absent, verify via dev-mode screenshots instead and note)
- [ ] Update memory files (kcal-assistant-project.md, wall-hub-dashboard-project.md), final report

## Self-review

- Spec coverage: schema/upsert (T1), confirm (T2), shopping (T3), MCP (T4), UI API (T5), internal (T6), Vecka UI (T7), netpol/HA mirrors/version (T8), hub (T9), deploy+verify (T10-11). Future-ideas section untouched — correct.
- Raw-input round-trip for UI slot rebuilds surfaced in T7 and fed back into T1's PlannedMealView items requirement (items expose raw input + resolved macros, RecipeIngredientView-style).
- Type names consistent: PlanSlot/PlanDayInput/PlanDayView/PlanWeekView/confirmDay/unconfirmDay/buildShoppingList/buildInternalPlanner used identically across tasks.
