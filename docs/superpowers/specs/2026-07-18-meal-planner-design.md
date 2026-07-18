# Meal Planner — kcal-assistant + wall-hub (2026-07-18)

Interactive week meal planner for kcal-assistant, editable from Claude chat (MCP, primary)
and the KCAL·DB UI, displayed on the wall-hub panel as a dedicated fullscreen page plus a
Hem chip. Per-day confirm/lock logs the planned meals onto that date's goals.

Philip pre-approved all design decisions (away from computer); this spec records the
autonomous brainstorm outcome.

## Goals

- Week calendar Mon–Sun with frukost / lunch / middag / mellis per day, each meal specced
  with kcal + protein/fat/carbs computed by the server (same math as logging).
- Day types (gymdag/vilodag/flexdag) planned ahead, changeable any time; plan checks
  (kcal budget, protein/fat floors) recompute live against the day's targets.
- Per-day **Bekräfta/lås**: copies the planned meals into the real log for that date
  (feeding day totals, veckosnitt, and the weight forecast's "recent" intake), marks the
  day confirmed. Undoable (unconfirm removes only plan-originated meals).
- Editable via MCP (most common), KCAL·DB UI (manual), and confirmable from the wall panel.

## Non-goals (v1)

- Forecast "plan" intake source (future idea; targets/recent/explicit stay as-is).
- Full item-level meal composer in the UI (product search composition stays in chat).
- Unconfirm from the wall panel (destructive; chat/UI only).
- Notifications/reminders.

## Data model (migration 6)

Chosen over (a) reusing `meals` with a planned flag — would force every totals/forecast/
summary reader to filter and risks double counting; (b) JSON blob per day — no live
product resolution, weak integrity.

```sql
CREATE TABLE planned_meals (
  id             INTEGER PRIMARY KEY,
  day_date       TEXT NOT NULL REFERENCES days(date),
  slot           TEXT NOT NULL CHECK (slot IN ('frukost','lunch','middag','mellis')),
  position       INTEGER NOT NULL DEFAULT 0,
  name           TEXT NOT NULL,
  recipe_id      INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_servings REAL,
  post_gym_shake INTEGER NOT NULL DEFAULT 0,
  logged_meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_planned_meals_day ON planned_meals(day_date);

CREATE TABLE planned_meal_items (      -- raw INPUT, shape = recipe_ingredients
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
```

Semantics:

- A planned meal is **recipe-based** (`recipe_id` + `recipe_servings`, no items) or
  **item-based** (items resolved live via `resolveItem`, exactly like recipe
  ingredients). Providing both is an error.
- Recipe scaling: `per_serving × recipe_servings` when the recipe defines servings,
  else `totals × recipe_servings` (batches). Recipe edits/product corrections propagate
  into the plan automatically (live resolution).
- Unresolvable items (deleted product, missing per-100g) → per-item `unresolved` reason
  + `totals_incomplete` on the meal; **confirm of that day is blocked** with a clear error.
- Multiple meals per slot allowed (e.g. two mellis), ordered by `position`.
- Day lock state = `days.plan_confirmed_at`. Locking is soft: plan edits on a confirmed
  day succeed but return a varning ("dagen är redan bekräftad — ändringar påverkar inte
  loggen"); the log is corrected via `edit_meal`/unconfirm as usual.

### Confirm / unconfirm (db/plan.ts)

- `confirmDay(date, slots?)`: transaction; for each planned meal in scope with
  `logged_meal_id IS NULL` → resolve → insert a `meals` row (name, `post_gym_shake`
  carried; recipe-based meals log ONE aggregate item "«Receptnamn» (N port)" with scaled
  macros) via the existing `insertItems`/rounding path → set `logged_meal_id`. When no
  unlogged planned meals remain for the date, stamp `plan_confirmed_at`. Idempotent:
  already-logged meals are skipped; a fully confirmed day errors "redan bekräftad".
  No planned meals at all → error "inget planerat".
- `unconfirmDay(date)`: delete `meals` rows referenced by the date's
  `logged_meal_id`s (cascade removes their items; FK SET NULL clears pointers), clear
  `plan_confirmed_at`. Meals logged outside the plan are untouched. Deleting a
  plan-logged meal manually via `edit_meal` also clears its pointer (FK), so the plan
  shows it as un-logged again.

### Week reads

`getPlanWeek(db, startDate)` snaps to the Monday of `startDate`'s week (Stockholm
"today" as default) and returns 7 days: date, day_type, targets, confirmed state,
planned meals with slot/name/macros (+ items on request), logged-status per meal,
day totals vs targets with floor checks, plus week aggregates (planned avg kcal vs
avg target — kalori-cykling view). Read-only (no ensureDay), same guarantee as `readDay`.

**Shopping list**: aggregation over the range's UNLOGGED planned meals — recipe-based
meals expand ingredients × scale; totals grouped per product (summed grams/quantities),
ad-hoc items listed by description. Exposed via `get_plan` flag and the UI.

## MCP surface (24 → 27 tools)

- `plan_week` — THE planning tool, batch upsert:
  `{ days: [{ date, day_type?, clear_slots?, meals?: [{ slot, name, recipe_id?,
  recipe_servings?, items?, post_gym_shake?, note? }] }], replace? }`.
  `replace` default true: slots present in `meals` are replaced wholesale; false
  appends. `clear_slots` empties slots. `day_type` set inline while planning. Returns
  compact per-day summaries (totals, remaining, floor checks, varning on confirmed
  days) so Claude sees immediately whether the week hits targets in ONE call.
- `get_plan` — `{ start?, weeks? (1–4, default 1), include_items?, shopping_list? }`,
  weeks snap to Mon–Sun. Compact by default (token economy).
- `confirm_day` — `{ date, action: 'confirm' | 'unconfirm', slots? }` (slots only for
  confirm). Returns the updated DayView + plan state.

Existing `set_day_type` stays (mid-week changes); `log_meal`/`edit_meal` untouched.

## UI API + Vecka view (KCAL·DB)

Writes copy the proven `PUT /ui/api/profile` gate exactly: Authentik at edge +
server-verified, `Sec-Fetch-Site: same-origin`, JSON content-type, 16 KB cap, strict
shape coercion, shared validation with the MCP path (one truth in db/plan.ts).

- `GET  /ui/api/plan?start=YYYY-MM-DD&weeks=1|2` — full detail incl. items + shopping list.
- `PUT  /ui/api/plan/<date>` — body = one `plan_week` day (`day_type?/clear_slots?/meals?/replace?`).
- `PUT  /ui/api/confirm/<date>` — body `{ action: 'confirm' | 'unconfirm', slots? }`.

(Paths fit the existing `API_ROUTE` regex; `server.ts` method gate extended to allow
these PUTs.)

**Vecka view** (new nav entry): 7-column week grid (vertical day list on mobile), week
nav ‹ idag ›. Per day: weekday + date header, day-type select (G/V/F color badge),
totals chip (kcal + P) with warning icons when floors/budget miss, slot sections with
meal rows (name, kcal, macros on expand), and the **Bekräfta 🔒** button (dialog;
confirmed days render locked with "loggad" state and an Ångra bekräftelse action).
Meal actions: delete, move (day/slot), edit recipe servings, add via
**Från recept** (picker + servings) or **Snabb** (name + 4 macros). Full item
composition deliberately stays in chat.

## Wall-hub integration

Data path (read): new cluster-only `GET /internal/planner` on :3001 → current week
Mon–Sun, per day: date, day_type, confirmed, meals `{slot, name, kcal, protein, fat,
carbs, logged}`, totals, target_kcal, checks. New REST sensor `sensor.kcal_veckoplan`
(state = confirmed-days count "n/7"; attributes = days), scan 300 s, mirrored in
`.claude/ha-rest-sensors.yaml`.

Write path (panel confirm): hub calls
`rest_command.kcal_confirm_day` (`POST /internal/planner/confirm` body `{date}`) then
`homeassistant.update_entity` on the sensor for instant feedback. Cilium L7 policy
gains exactly `GET /internal/planner` + `POST /internal/planner/confirm` for the host
identity; HA remains the only non-nginx principal that can reach the pod. Risk accepted:
anyone with HA UI access can confirm a day (single household; unconfirm not exposed).

Hub UI:

- **New 6th page "Vecka"** (fullscreen mode): 7 columns Mon–Sun, today highlighted,
  day-type letter chip, confirmed ✓, meals by slot with kcal, day total vs target.
  Tap a day → popup with macro detail + Bekräfta button (hidden when confirmed;
  double-tap safe — server confirm is idempotent).
- **Hem chip "Idag/Ikväll"**: next unlogged planned meal (e.g. "Middag · Lax 720");
  tap navigates to Vecka. Kept to one chip so Hem's native-height fit is preserved.
- Colors follow the hub system (kcal domain = lavender; day-type chips reuse existing
  domain accents; coral only for floor-miss warnings).

## Testing

- Server (bun test): plan upsert/replace/append/clear; recipe scaling (per-serving +
  batch fallback); unresolved-item flag + confirm block; confirm idempotency, partial
  slot confirm, unconfirm removes only plan meals, FK pointer clearing; Monday snap
  (Sunday + DST edges); shopping-list aggregation; tools (plan_week batch shape,
  get_plan compactness); ui-api auth matrix for the new PUTs (cross-origin/
  content-type/405) mirroring profile's tests; internal planner GET/POST + security parity
  (routes absent on :3000).
- glass-cards (vitest): planner payload parsing / week-model pure logic
  (`planner-model.ts`, same pattern as energy-model).
- Browser walk on the deployed hub via Claude-in-Chrome.

## Deployment

1. kcal-assistant PR: migration 6 + db/tools/api/internal + Vecka UI + tests;
   version → **v0.11.0** + deployment.yaml image tag; networkpolicy.yaml L7 additions.
   Merge → CI builds → Flux deploys.
2. HA config: append REST sensor + `rest_command` to `/config/configuration.yaml`
   (kubectl exec), mirror in `.claude/ha-rest-sensors.yaml`, reload/restart HA.
3. glass-cards: `hub-planner-page` + Hem chip + `kcal.planner_entity` config;
   `npm run build && ./scripts/upload.sh && node scripts/deploy.mjs hub`.
4. Verify: 27 tools on /mcp, /internal/planner via exec, sensors populated, panel walk.
5. Philip must **start a new Claude chat** to see the 3 new tools (connector caching).

## Future ideas (explicitly deferred)

Forecast intake source "plan"; copy-week UI button (chat covers it); planned-vs-actual
deviation stats; panel unconfirm; item-level UI composer.
