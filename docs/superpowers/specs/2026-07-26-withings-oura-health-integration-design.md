# Withings + Oura Health Integration — Design Spec

**Date:** 2026-07-26
**Status:** Approved, not yet implemented.
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
- No Oura history backfill in v1 (§8).

---

## 2. Why Apple Health is out of scope

Oura writes into Apple Health, and there is no Apple Watch. Therefore HealthKit contains: (a) Oura's data, which the Oura API serves directly and in better structured form, and (b) iPhone pedometer data, which HA already receives natively from the companion app (`sensor.philip_s_iphone_steps`, `_distance`, `_floors_ascended`, `_average_active_pace`). Bridging HealthKit would add a paid iOS app, a webhook or REST push path, and a documented constraint that HealthKit is unreadable while the phone is locked — in exchange for no data we don't already have.

Should an Apple Watch arrive later, the bridge becomes worthwhile; the `POST /internal/daily` endpoint defined in §5 is source-agnostic and would accept it.

---

## 3. Current state (verified 2026-07-26)

**Withings** — integration live. Config entry carries a `webhook_id`, and `external_url` is `https://home.rutberg.dev`, so Withings POSTs to `/api/webhook/<id>` and sensors update within seconds of a weigh-in (confirmed: all body sensors updated together at 08:25 UTC / 10:25 local). Entities: `sensor.withings_vikt`, `_fettforhallande`, `_fettmassa`, `_fettfri_massa`, `_muskelmassa`, `_benmassa`, `_hjartpuls`, `_batteri`, last-workout sensors (`_typ_pa_senaste_traningspasset`, `_forbranda_kalorier_...`, `_langd_tid_...`, `_tillryggalagd_stracka_...`), and `calendar.withings_traningspass`. No steps or sleep sensors (no ScanWatch, no Sleep mat).

**Oura** — not yet installed. No core integration exists as of 2026. Route: `louispires/Oura-Home-Assistant-Integration` (HACS default repository, OAuth2 via HA application credentials, ~60 sensors + 2 binary sensors, configurable 1–60 min polling). HACS is already present in this cluster via the `install-hacs` init container (`hasl3` installed the same way).

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

Reads HA's `/api/history/period` for the Oura sensors using the token at `.claude/ha-token`, rolls values up per Stockholm day, and POSTs each day to `/internal/daily`. Run from the laptop; not deployed. Purpose is **gap repair** (a day lost to an HA restart or a failed automation), bounded by the recorder's retention — see §8.

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

The eight metric fields are exactly the `daily_metrics` columns. The entity IDs behind each placeholder are filled in during phase 2, once phase 0 has established what the Oura integration actually names them — writing them earlier would be guesswork.

Two template requirements:

- **Emit JSON `null`, not the string `"unknown"`,** for any sensor that is `unknown`/`unavailable`, so a missing metric arrives as null and `COALESCE` preserves whatever was already stored. In practice: `{{ states('sensor.x') | float(default='null') }}`-style guards, verified per field against the real entity.
- **Convert sleep duration to whole minutes** in the template. The integration exposes total sleep duration as a duration sensor whose unit must be confirmed in phase 0 (hours vs minutes vs seconds); `sleep_duration_min` is minutes by definition, and the conversion belongs in the automation so the stored column needs no unit metadata.

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

## 8. Accepted limitation: no Oura backfill

The HACS integration's 3-month historical load writes **HA long-term statistics**, which the REST `history` API does not serve, and the recorder keeps only 10 days by default. Reaching that data would require a WebSocket `recorder/statistics_during_period` client, and it would return hourly means rather than the daily values `daily_metrics` is shaped for.

That is disproportionate for the payoff. The value of sleep/readiness in the kcal DB is correlation over time, which accrues from day one going forward. So:

- `daily_metrics` starts empty and fills nightly.
- The Hälsa page's 14-day sparklines start empty and fill over two weeks. Cards must render correctly with zero, one, and few points — an explicit test case, not an afterthought.
- `scripts/backfill-health.ts` repairs gaps within the recorder's retention window.
- If a longer repair window is ever wanted, `recorder.purge_keep_days` is the lever.

---

## 9. Sequencing

One hard dependency drives the order: **the Oura entity IDs must exist before any config, automation, or card that names them can be written**, and obtaining them needs Philip's hands for the OAuth flow.

| Phase | Work | Blocked by |
|---|---|---|
| 0 | Oura dev app, application credentials, HACS install, OAuth, record entity IDs | Philip |
| 1 | kcal-assistant v0.13.0: migration, weights source, `daily.ts`, three endpoints, tool outputs, tests. Deploy. | — (schema is Oura-agnostic; can run parallel to phase 0) |
| 2 | Cilium policy, `rest_command`s, two automations, `sensor.kcal_halsa`, mirrors | 0 and 1 |
| 3 | Hälsa page: config block, page, four cards, Hem chip, `health-model.ts` + tests | 0; sparklines need 2 |
| 4 | The four popups | 3 |
| 5 | `CLAUDE.md`, `.claude` mirrors, memory update | all |

### Verification

- **Phase 1:** `bun test` covers the upsert invariants; `curl` the three endpoints from inside the cluster.
- **Phase 2:** call `rest_command.kcal_log_weight` manually from HA Developer Tools → Actions and confirm the row appears with `source='withings'`; then confirm the idempotency path returns `applied: false`. **The real acceptance test is the next morning's weigh-in appearing in the DB with nothing typed.**
- **Phase 3:** `npm test` for `health-model`; visual verification of the page in both themes at wall-panel size, including the empty-sparkline state.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| An HA restart re-populates `sensor.withings_vikt` and re-logs a stale value | `not_from: [unknown, unavailable]` on the trigger, plus SQL first-wins making a duplicate a no-op |
| An evening weigh-in becomes the day's data point and drags the EWMA trend | 03:00–12:00 window condition in the automation |
| HA down at 23:50 loses a day of Oura metrics | Nullable columns, `COALESCE` upsert, and `backfill-health.ts` for repair within the recorder window |
| Oura sensors `unavailable` early on (documented baseline requirement) | Every metric column nullable; cards render a dash, not a crash |
| ~60 new recorder entities grow the HA database | Measure first; `recorder.exclude` for the heart-rate variants if needed |
| Oura changes OAuth terms again, or the custom integration is abandoned | Nothing in the cluster depends on Oura being present: `daily_metrics` columns are nullable and the Hälsa page degrades card by card |

---

## 11. Sources

- [louispires/Oura-Home-Assistant-Integration](https://github.com/louispires/Oura-Home-Assistant-Integration)
- [Oura Ring v2 custom integration — HA community thread](https://community.home-assistant.io/t/oura-ring-v2-custom-integration-track-your-sleep-readiness-activity-in-home-assistant/944424)
- [Oura API authentication](https://cloud.ouraring.com/docs/authentication) — PAT deprecation, OAuth2 requirement
- [Health Auto Export → Home Assistant](https://help.healthyapps.dev/en/health-auto-export/automations/home-assistant/) — the Apple Health route rejected in §2
- [HealthSync HA](https://github.com/WeaveHubHQ/healthsync-ha) — alternative Apple Health bridge, also rejected
