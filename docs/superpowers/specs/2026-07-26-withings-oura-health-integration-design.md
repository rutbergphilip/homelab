# Withings + Oura Health Integration — Design Spec

**Date:** 2026-07-26
**Status:** **Implemented 2026-07-26.** All phases shipped and verified against live data.

Deltas from the design, each with its reason:

- **Migrations 8 and 9, not a single migration 8.** Editing an applied migration is unsafe once a database has stamped `user_version`.
- **`oura_burn` object instead of a bare `oura_tdee_avg` number** — carries `avg_kcal`, `days`, `from`, `to`, so the assistant can state the period and how many days actually had data. `lib/trend.ts` gained `span_from`/`span_to` to make the two TDEE figures cover the identical span.
- **One `hub-health-popup` with a `section` property, not four popup components.** All four sections are the same key/value shape; four shells would have been duplication.
- **Kropp's headline weight comes from kcal-assistant, not the scale** (§7.4 said live). Caught in visual review: the scale read 79.747 while the recorded morning weight was 79.91, so the page contradicted the Kcal page. Body composition is still live.
- **Kropp's trend footer states the change, not the EWMA endpoint** — the endpoint (81.1) legitimately lags the headline (79.9) and printing both read as a bug.
- **Oura history IS reachable** (§8, reversing the original "no backfill" decision); the deferred entity/unit unknowns are resolved (§6.3).
- **Two nap artifacts rejected during backfill** (§5.6) — a discovery, not a planned feature.
- **Unplanned fix: HA memory raised 800Mi → 1536Mi and CPU 500m → 2** after an OOMKill (exit 137). 71 new entities plus a statistics import on an instance already restarting daily left no headroom. Also added a `recorder: exclude` block for the five Oura heart-rate entities that change every poll — deliberately *not* the eight the backfill reads from statistics.

Verified end-to-end: 79.91 kg auto-logged with `source='withings'`, a later weigh-in correctly declined, 70 days seeded (spot-checks match §9), `est_tdee` 2490 vs `oura_burn` 3108 over the identical span, and all four popup sections populated on the wall panel in kiosk mode.
**Scope:** Automatic weight logging from the Withings scale into the kcal database (retiring manual `log_weight` through chat), a new **Hälsa** page on the wall hub covering body composition and Oura recovery/activity, and Oura daily metrics stored in the kcal DB as TDEE cross-check and day context. Apple Health is explicitly out of scope — see §2.

---

## 1. Goals

- **Never log weight through chat again.** Stepping on the Withings scale in the morning is the only action required; the day's weight lands in `weights` with no further input.
- Manual `log_weight` remains the **correction path** and always wins over an automatic value.
- The wall hub gains a **Hälsa** page: sleep, beredskap (readiness), kropp (body composition), aktivitet — glanceable, with 14-day trends so a single day's score isn't read as signal.
- The kcal assistant gains **day context** (sleep, readiness) and a **TDEE cross-check** (Oura's total burn) so it can reason about "dålig sömn → överåt" and sanity-check its own TDEE estimate.
- No new credentials in the cluster; no new vendor-cloud egress from `kcal-assistant`.

### Non-goals

- Oura's burn does **not** feed the forecast model. The backwards-computed TDEE (intake + weight change over the trend window) stays authoritative; Oura is displayed beside it as a comparison only.
- Body composition is **not** stored in the kcal DB (user decision). It is read live from HA and shown only on the Hälsa page.
- Oura history **is** backfilled (~70 days), via HA long-term statistics (§8).

---

## 2. Why Apple Health is out of scope

Oura writes into Apple Health, and there is no Apple Watch. Therefore HealthKit contains: (a) Oura's data, which the Oura API serves directly and in better structured form, and (b) iPhone pedometer data, which HA already receives natively from the companion app (`sensor.philip_s_iphone_steps`, `_distance`, `_floors_ascended`, `_average_active_pace`). Bridging HealthKit would add a paid iOS app, a webhook or REST push path, and a documented constraint that HealthKit is unreadable while the phone is locked — in exchange for no data we don't already have.

Should an Apple Watch arrive later, the bridge becomes worthwhile; the `POST /internal/daily` endpoint defined in §5 is source-agnostic and would accept it.

---

## 3. Current state (verified 2026-07-26)

**Withings** — integration live. Config entry carries a `webhook_id`, and `external_url` is `https://home.rutberg.dev`, so Withings POSTs to `/api/webhook/<id>` and sensors update within seconds of a weigh-in (confirmed: all body sensors updated together at 08:25 UTC / 10:25 local). Entities: `sensor.withings_vikt`, `_fettforhallande`, `_fettmassa`, `_fettfri_massa`, `_muskelmassa`, `_benmassa`, `_hjartpuls`, `_batteri`, last-workout sensors (`_typ_pa_senaste_traningspasset`, `_forbranda_kalorier_...`, `_langd_tid_...`, `_tillryggalagd_stracka_...`), and `calendar.withings_traningspass`. No steps or sleep sensors (no ScanWatch, no Sleep mat).

**Oura** — installed in phase 0 (2026-07-26). No core integration exists as of 2026; the route taken was `louispires/Oura-Home-Assistant-Integration` v2.8.3 (HACS default repository, OAuth2 via HA application credentials). Installed *through* HACS — via its `hacs/repository/download` WebSocket command rather than by copying files into the PVC — so HACS continues to manage updates. Result: **71 entities** (`sensor.oura_ring_*`, two binary sensors, one update entity) on an Oura Ring 4. The integration declares `application_credentials` and `recorder` as dependencies and has no Python requirements, so it needs no pip step at startup; it requests exactly 11 OAuth scopes (`email`, `personal`, `daily`, `heartrate`, `workout`, `session`, `tag`, `spo2`, `ring_configuration`, `stress`, `heart_health`).

The integration and HACS both live on the HA PVC, outside git — pre-existing drift (`hacs`, `hasl3`) rather than new, but it means Flux will not restore them. Documented in phase 5.

**Critical constraint:** Oura **deprecated personal access tokens in December 2025** — new ones cannot be created. Any direct Oura client in the cluster would need its own OAuth2 app registration plus refresh-token storage and rotation. This is what rules out `kcal-assistant` polling Oura itself.

**kcal-assistant** — `weights` is `(date TEXT PRIMARY KEY, weight_kg REAL, note TEXT, created_at TEXT)`, upserted by date. A cluster-internal listener on :3001 already serves `GET /internal/summary`, `GET /internal/planner` and accepts `POST /internal/planner/confirm`, network-gated by a `CiliumNetworkPolicy` that L7-pins method+path to the `host`/`remote-node` identities (HA runs `hostNetwork: true` for mDNS). The write path is driven by an HA `rest_command`. This is the pattern the whole design reuses.

---

## 4. Architecture

**Principle: Home Assistant is the sole client of both vendor clouds. `kcal-assistant` is a sink that never egresses to a vendor.** This mirrors how Tibber and SL are already handled, keeps all OAuth state in one place, and adds zero credentials to the cluster.

```
Withings scale ──webhook──▶ sensor.withings_vikt ──state trigger──▶ rest_command
                                                     (03:00–12:00)        │
                                                                          ▼
                                                         POST /internal/weight
                                                         → weights (first-wins)

Oura cloud ──10 min poll──▶ ~60 sensors ──nightly 23:50──▶ rest_command
                                                                  │
                                                                  ▼
                                                      POST /internal/daily
                                                      → daily_metrics (upsert)

                            sensor.kcal_halsa ◀── GET /internal/health (14 d)
                                    │
                                    ▼
                        Hälsa page sparklines (glass-cards)
```

Two flows, deliberately different because their triggers differ:

- **Weight is event-driven.** The trigger is literally "Philip stepped on the scale". Withings' webhook makes this near-instant, so `now()` in Stockholm is a sound date.
- **Oura is nightly.** Its numbers settle over the course of a day: sleep and readiness are fixed by morning, steps and burn only by late evening. A single 23:50 push captures every field for that date in one payload, avoiding a two-automation split.

**The loop back to the dashboard** is the non-obvious part: a Lovelace card cannot read history, so an isolated "sleep score 84" is unanchored. Because `daily_metrics` is already accumulating, `kcal-assistant` doubles as the dashboard's history store — `GET /internal/health` serves the last 14 days, surfaced as `sensor.kcal_halsa` in the same mould as `sensor.kcal_idag`.

Consequently the Hälsa page splits its sources on purpose: **today's values come live from the Oura/Withings entities** (no 5-minute REST lag on a wall panel), **trends come from the kcal REST sensors** — `sensor.kcal_halsa` for the 14-day Oura series, and the existing `sensor.kcal_viktprognos` for the 28-day weight trend it already carries.

---

## 5. kcal-assistant changes (v0.13.0)

### 5.1 Migration 8

Appended to the `MIGRATIONS` array in `src/db/migrations.ts` (append-only, tracked by `PRAGMA user_version`):

```sql
ALTER TABLE weights ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

CREATE TABLE daily_metrics (
  date               TEXT PRIMARY KEY,
  oura_total_kcal    REAL,
  oura_active_kcal   REAL,
  oura_steps         INTEGER,
  sleep_score        INTEGER,
  sleep_duration_min INTEGER,
  readiness_score    INTEGER,
  hrv_ms             REAL,
  resting_hr         REAL,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Existing weight rows correctly default to `source='manual'` — every one of them was chat-logged. Every `daily_metrics` metric column is nullable: a sensor can be `unavailable`, and Oura's readiness/stress metrics are documented as needing baseline data before they populate.

### 5.2 The conflict rule lives in SQL

`logWeight(db, input, source)` in `src/db/weights.ts`:

- `source='manual'` — keeps today's unconditional `ON CONFLICT(date) DO UPDATE`, and sets `source='manual'`.
- `source='withings'` — `ON CONFLICT(date) DO NOTHING`.

That single change makes both invariants properties of the database rather than of a YAML automation:

1. **First weigh-in of the day wins** — a double-step on the scale, or a second weigh-in later in the window, cannot move the day's value.
2. **Manual always wins** — a chat `log_weight` overwrites an automatic value, and a subsequent automatic push cannot overwrite the correction back.

The valuable second-order effect: **the HA automation becomes dumb and idempotent.** It may fire twice for one weigh-in, or re-fire after an HA restart re-populates the sensor from `unknown`, and the outcome is unchanged. It therefore needs no template condition asking whether today is already logged.

`logWeight` returns whether the write was applied so the endpoint can report it.

**Division of responsibility:** the server enforces *first-wins / manual-wins* and stays time-agnostic; the automation enforces the *03:00–12:00 morning window*. Keeping the window out of the server is what allows `scripts/backfill-health.ts` to post arbitrary historical dates.

### 5.3 New `src/db/daily.ts`

- `upsertDailyMetrics(db, { date, ...metrics })` — upsert by date using `COALESCE(excluded.col, daily_metrics.col)` per column, so a partial payload (or a sensor that was `unavailable` that night) never erases a value already stored.
- `getDailyMetrics(db, date)` — one day, or `null`.
- `listDailyMetrics(db, { from, to })` — ascending range, for the 14-day projection and for `get_week`.

### 5.4 Endpoints on the :3001 internal listener

All three live in `createInternalServer` in `src/server.ts`, beside `/internal/planner/confirm`, and reuse its `readBody` cap and validation style.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/internal/weight` | `{ weight_kg: number, date?: string }` | `200 { ok: true, applied: boolean, date }` |
| POST | `/internal/daily` | `{ date?: string, oura_total_kcal?, oura_active_kcal?, oura_steps?, sleep_score?, sleep_duration_min?, readiness_score?, hrv_ms?, resting_hr? }` | `200 { ok: true, date }` |
| GET | `/internal/health` | — | `200 { status: 'ok', latest: {...} \| null, days: [...] }` (last 14 days ascending) |

`date` defaults to `todayStockholm()` on both writes. Invalid dates and out-of-range weights return `400`.

**A duplicate weigh-in returns `200 { applied: false }`, never an error.** HA's `rest_command` surfaces non-2xx as a failed action in the automation trace, so an idempotent no-op must not look like a failure — otherwise normal operation would fill the trace log with noise.

`buildInternalHealth(db)` joins `daily_metrics` over the last 14 days; like `buildInternalSummary` it must never throw, degrading to `days: []`.

`GET /internal/summary` additionally gains `latest_weight_date` and `weight_source`, so the Kcal page's weight card can show "senast vägd 26 juli" from the record the model actually uses rather than from a sensor timestamp.

### 5.5 MCP surface — no new tools

Adding a tool for this would fragment the assistant's mental model; the data belongs on the calls it already makes.

- **`get_trend`** gains `oura_tdee_avg`: the mean of `oura_total_kcal` across the same window as the computed TDEE, plus the day count it averaged over. Its description gains an explicit instruction that the backwards-computed TDEE is authoritative and Oura is a sanity check, never an input — the intake-plus-weight-change derivation is strictly better evidence than a ring's estimate.
- **`get_day`** and **`get_context`** gain that date's `daily_metrics` row (sleep, readiness, burn, steps) so the assistant has recovery context without a second call. `get_context` is documented as the start-of-conversation call, which makes it the natural carrier.
- **`get_week`** gains the row per day — this is what makes correlation possible ("sömn 61 på onsdagen, och du åt 600 över").
- **`log_weight`** description gains: weight is auto-logged from the Withings scale each morning; calling this is the override and it wins.

### 5.6 `scripts/backfill-health.ts`

Reads HA **long-term statistics** over the WebSocket API (`recorder/statistics_during_period`, `period: 'day'`) using the token at `.claude/ha-token`, and POSTs each day to `/internal/daily`. Run from the laptop; not deployed. Serves two purposes: the **initial seed** of ~70 days (§8) and later **gap repair** for any day a nightly push missed.

Field selection depends on the sensor's `state_class`, verified in phase 0:

- `total` / `total_increasing` (`total_calories`, `active_calories`, `steps`, `total_sleep_duration`) → take **`state`**, the day's final value. `mean` is null for these.
- `measurement` (`sleep_score`, `readiness_score`, `average_sleep_hrv`, `lowest_sleep_heart_rate`) → take **`mean`**, rounded to the column's precision. Only `mean` is populated, and it equals the true value exactly because each of these holds one constant value for the whole day.

Day periods align to Stockholm midnight, so a period's `start` maps directly to the `date` primary key with no timezone arithmetic.

The one caveat worth stating: `mean` is exact *only* while a measurement sensor stays constant across the day. If Oura ever revises a score mid-day (a recorded nap, a late sync), the mean blends the two values. The blend is small and self-corrects the next night, and the nightly push — which reads the live state, not statistics — is unaffected.

### 5.7 Tests (`bun test`)

- First-wins: two `withings` writes for one date → second returns `applied: false`, value unchanged.
- Manual-wins: `withings` then `manual` → manual value stored, `source='manual'`; a following `withings` write does not revert it.
- `manual` upsert still overwrites `manual` (existing correction behaviour preserved).
- `upsertDailyMetrics` partial payload preserves untouched columns.
- `buildInternalHealth` with an empty table returns `days: []` and does not throw.
- `get_trend` reports `oura_tdee_avg: null` when no Oura data covers the window.

---

## 6. Cluster and Home Assistant configuration

### 6.1 CiliumNetworkPolicy

Three L7 rules appended to the existing port-3001 block in `kubernetes/apps/home-automation/kcal-assistant/networkpolicy.yaml`:

```yaml
- method: "POST"
  path: "/internal/weight"
- method: "POST"
  path: "/internal/daily"
- method: "GET"
  path: "/internal/health"
```

No deployment change. The comment block at the top of the file is updated to reflect the widened internal surface.

### 6.2 Oura integration (requires Philip's hands)

1. Register an application at `cloud.ouraring.com` → `client_id` + `client_secret`.
2. HA → Settings → Devices & Services → Application Credentials → add for the Oura integration.
3. Install `louispires/Oura-Home-Assistant-Integration` via HACS, restart HA, complete the OAuth flow.
4. Polling interval **10 minutes** — sleep and readiness change once a day; only steps and burn move continuously, and the wall panel does not need them to the minute.
5. Historical load: accept the 3-month default. It populates HA long-term statistics (useful in HA's own history UI) even though §8 explains why it cannot seed `daily_metrics`.
6. Record the resulting entity IDs — **every subsequent step depends on knowing them**.

~60 new entities enter the recorder. If database growth becomes noticeable, exclude the high-cardinality ones (`heart_rate` variants) via `recorder.exclude`. Not pre-emptively configured.

Oura is **not** exposed to HomeKit: the bridge keeps a curated allowlist (vacuum, CO₂) and health data has no HomeKit accessory that would represent it usefully.

### 6.3 `rest_command`

Appended to the existing `rest_command:` key in `configuration.yaml`:

```yaml
kcal_log_weight:
  url: http://kcal-assistant.home-automation.svc.cluster.local:3001/internal/weight
  method: POST
  content_type: application/json
  payload: '{"weight_kg": {{ weight }}}'

kcal_log_daily:
  url: http://kcal-assistant.home-automation.svc.cluster.local:3001/internal/daily
  method: POST
  content_type: application/json
  payload: >-
    {"date": "{{ now().strftime('%Y-%m-%d') }}",
     "oura_total_kcal": <total calories>, "oura_active_kcal": <active calories>,
     "oura_steps": <steps>, "sleep_score": <sleep score>,
     "sleep_duration_min": <total sleep duration>, "readiness_score": <readiness score>,
     "hrv_ms": <average sleep HRV>, "resting_hr": <lowest sleep heart rate>}
```

**Resolved in phase 0** — the eight metric fields map to these verified entities:

| Column | Entity | Notes |
|---|---|---|
| `oura_total_kcal` | `sensor.oura_ring_total_calories` | TDEE incl. BMR; complete days observed 2437–3738 kcal |
| `oura_active_kcal` | `sensor.oura_ring_active_calories` | |
| `oura_steps` | `sensor.oura_ring_steps` | `total_increasing`, resets daily |
| `sleep_score` | `sensor.oura_ring_sleep_score` | |
| `sleep_duration_min` | `sensor.oura_ring_total_sleep_duration` | **unit is hours** → `× 60`, round |
| `readiness_score` | `sensor.oura_ring_readiness_score` | |
| `hrv_ms` | `sensor.oura_ring_average_sleep_hrv` | |
| `resting_hr` | `sensor.oura_ring_lowest_sleep_heart_rate` | Oura's resting-HR concept is the sleep minimum, not `average_sleep_heart_rate` |

Two template requirements:

- **Emit JSON `null`, not the string `"unknown"`,** for any sensor that is `unknown`/`unavailable`, so a missing metric arrives as null and `COALESCE` preserves whatever was already stored. This is not hypothetical: at phase-0 time `vo2_max`, `stress_day_summary`, `optimal_bedtime_*` and `tags_today` were all `unavailable`, and Oura documents that several metrics need baseline data before they populate.
- **Convert sleep duration to whole minutes** in the template — the sensor reports **hours** (`8.44166…`), verified in phase 0. `sleep_duration_min` is minutes by definition, so the conversion belongs in the automation and the column needs no unit metadata.

**Why 23:50 is the right capture time, confirmed empirically:** `total_calories` read 1907 kcal at 11:15 while `active_calories` was 2 — the sensor front-loads a full day's BMR, so it is *not* a "so far today" figure and cannot be sampled early. Daily statistics for complete days (3035, 3052, 3672 kcal) sit in a plausible TDEE range, so a late-evening sample is sound.

### 6.4 Automations

**`Withings vikt till kcal`**

- Trigger: state of `sensor.withings_vikt`, with `not_from: [unknown, unavailable]` so an HA restart re-populating the sensor cannot log a stale value.
- Conditions: `numeric_state` 30–300 (rejects garbage), and `time` after `03:00` before `12:00`.
- Action: `rest_command.kcal_log_weight` with `weight: {{ states('sensor.withings_vikt') }}`.

A weigh-in outside the window is silently not logged — chat `log_weight` covers that case, and a notification would be noise on a rare event.

**`Oura dagsdata till kcal`**

- Trigger: `time` at `23:50:00`.
- Action: `rest_command.kcal_log_daily`.

### 6.5 `sensor.kcal_halsa`

A new entry in the existing `rest:` list, alongside the `/internal/summary` and `/internal/planner` sensors:

```yaml
- resource: http://kcal-assistant.home-automation.svc.cluster.local:3001/internal/health
  scan_interval: 900
  timeout: 10
  sensor:
    - name: "Kcal hälsa"
      unique_id: kcal_halsa
      value_template: "{{ value_json.days | length }}"
      availability: "{{ value_json is defined and value_json.status == 'ok' }}"
      json_attributes:
        - days
        - latest
```

15-minute polling: this sensor carries only history, which changes once a night.

### 6.6 Mirrors

Per the established convention, HA-side config is mirrored into the repo for review and disaster recovery: a new `.claude/ha-health.yaml` holds the two automations, and `.claude/ha-rest-sensors.yaml` is extended with `sensor.kcal_halsa` and both `rest_command`s.

---

## 7. Wall hub changes (glass-cards, round 7)

### 7.1 Page registration

`src/hub/glass-hub.ts`: `'halsa'` appended to `DEFAULT_PAGES` (7 pages), `PAGE_TITLES.halsa = 'Hälsa'`, an import, and a branch in the render chain. Swipe, dot nav, and the 2-minute idle-return to Hem need no changes — all three derive from `pages.length`.

### 7.2 No new accent colour

`HubChipTone` is a closed union and the hub deliberately runs five domain hues. Hälsa shares **lavender** with Kcal — the same domain, kropp och kost. Scores instead use **semantic** tones: green ≥ 85, amber 70–84, coral < 70. For a scored metric this is more informative than a domain colour, and it stops the palette from drifting.

### 7.3 Hem chip

`hub-home-page.ts` already exposes a `_chips` getter over a `ChipDescriptor` type supporting `goto`. The recovery chip is ~10 lines appended there: label `"84 redo · 7h12m"`, tone from the readiness score, `goto: 'halsa'`. It joins the existing chips row beside the clock — the established home for this component and its visual language — rather than the new bottom row of the original mockup.

### 7.4 The four cards

Each is tappable to a popup, following the hub's existing pattern (car, vacuum, calendar, todo, transit, weather, room, light).

| Card | Live from HA entities | Trend from `sensor.kcal_halsa` | Popup |
|---|---|---|---|
| **Sömn** | duration, score, stage split | 14 d score | stages, sänggående/uppstigning, effektivitet, latens |
| **Beredskap** | score, HRV, vilopuls | 14 d score | contributors: temperaturavvikelse, HRV-balans, sömnregularitet, vilopulspoäng |
| **Kropp** | vikt, fett %, muskelmassa | 28 d weight, from the existing `sensor.kcal_viktprognos` attributes | fettmassa, fettfri massa, benmassa, puls vid vägning, prognos, senast vägd |
| **Aktivitet** | steg, aktiv + total kcal vs mål | 14 d steg | MET-minuter hög/medel/låg, senaste träningspass — Oura's or Withings', whichever is fresher |

Body composition appears only here, read live from HA, never stored in the kcal DB.

### 7.5 `src/hub/health-model.ts`

Pure, browser-free logic, testable under vitest like `energy-model.ts` and `planner-model.ts`: score → tone, minutes → `"7h12m"`, parsing the `days` attribute into `SparkPoint[]`, target progress ratios, and "freshest workout" selection between the two sources. Cards stay presentational.

### 7.6 Config block

`HubConfig` gains an optional `health` block naming the Oura and Withings entities, filled in `scripts/hub-config.mjs`. It follows the `volvo` / `vacuum_controls` precedent: which entities feed the page is configuration, not code.

### 7.7 Files

New: `pages/hub-health-page.ts`; `widgets/hub-sleep-card.ts`, `hub-readiness-card.ts`, `hub-body-card.ts`, `hub-activity-card.ts`; the four matching popups; `health-model.ts`; `tests/health-model.test.ts`.
Modified: `glass-hub.ts`, `hub-config.ts`, `pages/hub-home-page.ts`, `scripts/hub-config.mjs`, `CLAUDE.md`.

Deploy as usual: `npm test`, `npm run build`, `./scripts/upload.sh`, `node scripts/deploy.mjs hub`. HA's service worker can serve a stale bundle after deploy — unregister it or bypass cache when verifying.

---

## 8. Oura backfill — reversed after phase 0

**The original design accepted "no backfill" on the assumption that statistics only yield hourly means. Phase 0 disproved this, so the decision is reversed.** Querying `recorder/statistics_during_period` with `period: 'day'` returns one row per day carrying a real daily value, and the integration's historical import has already populated it.

Verified 2026-07-26 across all eight source sensors:

- **70 days available**, back to **2026-05-18** (69 for the sleep-derived ones, starting 2026-05-19). Less than the 3 months configured — the import reaches back only as far as the account's data — but far more than nothing.
- Day periods align to **Stockholm midnight**, matching the `date` primary key exactly.
- Every sensor yields a usable value via the state/mean rule in §5.6, with plausible ranges throughout (total_calories 3035–3672, sleep 7.27–8.44 h, sleep scores 71–88).

Consequences, all improvements over the original plan:

- `daily_metrics` is **seeded with ~70 days** before the first nightly push.
- The Hälsa page's 14-day sparklines are **fully populated on first render** — no two-week cold start.
- `get_week` correlation and the `get_trend` Oura cross-check are useful **immediately**, with ten weeks of history to calibrate against rather than accruing from zero.

Cards must still render correctly with zero, one, and few points — the seed can fail, a fresh install has none, and the empty state is cheap to test. That remains an explicit test case.

The recorder's own 10-day `purge_keep_days` is now irrelevant to backfill: statistics are not purged on that schedule, which is precisely why this works.

---

## 9. Sequencing

One hard dependency drove the order: **the Oura entity IDs had to exist before any config, automation, or card naming them could be written**, and obtaining them needed Philip's hands for the OAuth flow. That is now done.

| Phase | Work | Blocked by |
|---|---|---|
| 0 | ~~Oura dev app, application credentials, HACS install, OAuth, record entity IDs~~ | **Complete 2026-07-26** |
| 1 | kcal-assistant v0.13.0: migration, weights source, `daily.ts`, three endpoints, tool outputs, tests. Deploy. | — |
| 2 | Cilium policy, `rest_command`s, two automations, `sensor.kcal_halsa`, mirrors | 1 |
| 2b | **Seed `daily_metrics` with ~70 days** via `scripts/backfill-health.ts` | 1 |
| 3 | Hälsa page: config block, page, four cards, Hem chip, `health-model.ts` + tests | 2, 2b |
| 4 | The four popups | 3 |
| 5 | `CLAUDE.md`, `.claude` mirrors (incl. the out-of-git HACS integrations), memory update | all |

Phase 2b is deliberately separate from 2: the seed only needs phase 1's endpoint, not the automations, so it can land as soon as the endpoint is deployed — and it should, because phase 3's sparklines are far easier to judge visually against real history than against an empty series.

### Verification

- **Phase 1:** `bun test` covers the upsert invariants; `curl` the three endpoints from inside the cluster.
- **Phase 2:** call `rest_command.kcal_log_weight` manually from HA Developer Tools → Actions and confirm the row appears with `source='withings'`; then confirm the idempotency path returns `applied: false`. **The real acceptance test is the next morning's weigh-in appearing in the DB with nothing typed.**
- **Phase 2b:** row count ≈ 70; spot-check three dates against the statistics values already recorded in this spec (2026-07-24 → 3052 kcal, 2026-07-25 → 3672 kcal, sleep score 80 and 85 respectively).
- **Phase 3:** `npm test` for `health-model`; visual verification of the page in both themes at wall-panel size, including the empty-sparkline state.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| An HA restart re-populates `sensor.withings_vikt` and re-logs a stale value | `not_from: [unknown, unavailable]` on the trigger, plus SQL first-wins making a duplicate a no-op |
| An evening weigh-in becomes the day's data point and drags the EWMA trend | 03:00–12:00 window condition in the automation |
| HA down at 23:50 loses a day of Oura metrics | Nullable columns, `COALESCE` upsert, and `backfill-health.ts` re-run to repair from statistics — which are not purged, so the repair window is the full history |
| Oura sensors `unavailable` early on (documented baseline requirement) | Every metric column nullable; cards render a dash, not a crash. Observed already: `vo2_max`, `stress_day_summary`, `optimal_bedtime_*`, `tags_today` |
| 71 new recorder entities grow the HA database | Measure first; `recorder.exclude` for the heart-rate variants if needed |
| A `measurement` sensor changes mid-day, blending its statistics `mean` during backfill | Small, self-correcting next night, and the nightly push reads live state rather than statistics (§5.6) |
| Oura changes OAuth terms again, or the custom integration is abandoned | Nothing in the cluster depends on Oura being present: `daily_metrics` columns are nullable and the Hälsa page degrades card by card |

---

## 11. Sources

- [louispires/Oura-Home-Assistant-Integration](https://github.com/louispires/Oura-Home-Assistant-Integration)
- [Oura Ring v2 custom integration — HA community thread](https://community.home-assistant.io/t/oura-ring-v2-custom-integration-track-your-sleep-readiness-activity-in-home-assistant/944424)
- [Oura API authentication](https://cloud.ouraring.com/docs/authentication) — PAT deprecation, OAuth2 requirement
- [Health Auto Export → Home Assistant](https://help.healthyapps.dev/en/health-auto-export/automations/home-assistant/) — the Apple Health route rejected in §2
- [HealthSync HA](https://github.com/WeaveHubHQ/healthsync-ha) — alternative Apple Health bridge, also rejected
