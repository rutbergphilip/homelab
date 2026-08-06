# Lyfta Training Integration — claude-db domain + kcal-assistant surface

**Date:** 2026-08-06
**Status:** Implementing
**Repos touched:** `claude-db/`, `kcal-assistant/`, `kubernetes/apps/default/claude-db/`, `kubernetes/apps/home-automation/kcal-assistant/`

## Goal

Philip tracks gym workouts in Lyfta (lyfta.app) and has generated a personal API key.
Bring that data into the personal data platform so that:

1. **Chat** can browse workouts, exercise progression (e1RM, volume), and push training
   programs *into* the Lyfta app — via a new `lyfta` domain on claude.rutberg.dev.
2. **kcal-assistant** shows training progress over time in its UI (new Träning tab) and
   exposes it to kcal chats (new `get_training` tool), because training volume and
   calorie planning belong in the same conversation.

## Why a claude-db domain (not a kcal feature)

Lyfta is a general personal-data source, exactly what claude-db was built for
(domain = folder + registry line). kcal-assistant stays a *consumer*: it never talks to
a vendor cloud (same principle as the Withings/Oura integration, where HA is the only
vendor client). Here claude-db is the only Lyfta client; kcal reads a cluster-internal
projection.

## Lyfta API (researched 2026-08-06, https://my.lyfta.app/community/api)

- Base `https://my.lyfta.app`, auth `Authorization: Bearer <API_KEY>`.
- Limits: 60 req/min, 5 000 req/day, max 100 workouts/page (summary: 1000).
- Reads: `GET /api/v1/workouts` (full detail incl. exercises+sets),
  `GET /api/v1/workouts/summary` (adds `workout_duration`),
  `GET /api/v1/exercises` (performed exercises w/ equipment/body-part/muscle id arrays),
  `GET /api/v1/exercises/library?search=` (catalog search),
  `GET /api/v1/exercises/progress?exercise_id=&duration=` (not used — we compute locally).
- Writes: `POST /api/v1/collections` (program folder),
  `POST /api/v1/templates` (workout template into a collection; exercises must echo
  catalog `exercise_id`/`excercise_name`/`exercise_type`/`exercise_image`).
- Set fields are strings; `record_type/level/value` mark PRs. Metadata ids
  (equipment/body part/muscles) are JSON-encoded string arrays mapping to static tables
  published in the docs (mirrored in `metadata.ts`).

## claude-db: `lyfta` domain (v0.3.0)

`src/domains/lyfta/` + one registry line. Sync-into-SQLite model (like fragrance
snapshots): the API is the source, SQLite is the query surface — progress queries never
hit the network, survive Lyfta outages, and stay within rate limits.

### Files

- `client.ts` — thin fetch client, `LyftaClient` interface so tests inject a fake.
  Distinct errors for missing key / 401 / 429.
- `metadata.ts` — static id→name tables (equipment, body parts, muscles) from the docs.
- `db.ts` — migrations + row mappers + upserts.
- `sync.ts` — `syncLyfta(db, client, { full })`.
- `stats.ts` — pure aggregation: Epley e1RM (`w × (1 + reps/30)`), weekly volume,
  per-exercise progression, PR list, summary/progress projections. All vitest-style
  bun tests live here.
- `tools.ts`, `index.ts` — MCP registration, domain export.

### Schema (migration v1)

```sql
lyfta_workouts(id INTEGER PK,            -- Lyfta's id
  title TEXT, perform_date TEXT NOT NULL, duration_s INTEGER,
  total_volume_kg REAL, body_weight_kg REAL,
  raw TEXT NOT NULL,                     -- full API JSON, future-proofing
  synced_at TEXT NOT NULL);
lyfta_sets(workout_id → lyfta_workouts ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL, exercise_name TEXT NOT NULL,
  exercise_position INTEGER, set_index INTEGER,
  weight_kg REAL, reps INTEGER, rir REAL, duration_s REAL, distance REAL,
  set_type TEXT, is_completed INTEGER,
  record_type TEXT, record_level TEXT, record_value TEXT);
lyfta_exercises(id INTEGER PK, name TEXT, image TEXT, exercise_type TEXT,
  equipment TEXT, body_part TEXT, target_muscles TEXT, synergist_muscles TEXT);
lyfta_sync_state(key TEXT PK, value TEXT);   -- last_synced, last_error, …
```

Weights are stored as numbers in the account's unit (Philip = kg; the API's
`weight_unit` is recorded in sync_state and surfaced, never converted).

### Sync semantics

- Page `/workouts` newest-first, upsert workout + delete/reinsert its sets.
  Incremental mode stops after the first page whose ids are all already stored (that
  page is still upserted, so recent edits land). `full: true` walks everything.
- `/workouts/summary` backfills `duration_s` (detail endpoint lacks it).
- `/exercises` refreshes exercise metadata, ids mapped to names via `metadata.ts`.
- **Auto-sync**: `index.ts` runs an incremental sync at startup and every
  `LYFTA_SYNC_INTERVAL_MIN` (default 60) when `LYFTA_API_KEY` is set. Overlap-guarded,
  errors recorded in `lyfta_sync_state.last_error`, never crash the server. This keeps
  kcal's projection fresh without kcal being able to trigger writes.

### Tools

| Tool | Kind | Notes |
|---|---|---|
| `lyfta_sync` | live | `{full?}` — manual refresh; reports new/updated counts |
| `lyfta_status` | local | key configured?, last sync, last error, counts |
| `lyfta_workouts` | local | date range + pagination, one line per workout |
| `lyfta_workout` | local | full detail by id or date (exercises + sets + PRs) |
| `lyfta_progress` | local | per exercise (id or name search): per-session best set, e1RM, volume series |
| `lyfta_stats` | local | weekly volume/frequency, top exercises, recent PRs |
| `lyfta_search_library` | live | catalog search — needed before `lyfta_push_program` |
| `lyfta_push_program` | live | create collection + templates in the Lyfta app; exercises must come from `lyfta_search_library`/local `lyfta_exercises` (API validates catalog echo) |

Local tools work without the API key (they read what's synced); live tools return a
clear "LYFTA_API_KEY är inte konfigurerad" error until the key is applied.

### Internal listener (new, mirrors kcal's pattern)

claude-db gets a second, cluster-internal-only listener on `:3001`
(`INTERNAL_PORT`), because the `:3000` server is ingress-reachable and everything on it
must stay token-gated:

- `GET /internal/lyfta/summary` — configured?, last_synced, this-week totals, 12-week
  volume/frequency series, ~10 recent workouts, top exercises with best/latest e1RM.
- `GET /internal/lyfta/progress?exercise_id=&days=` — per-exercise point series.
- `GET /healthz`.

Read-only projections, never throw (degrade to empty), no auth — gated by a new
CiliumNetworkPolicy instead (below).

## kcal-assistant (v0.16.0)

- `src/services/training.ts` — fetch from
  `CLAUDE_DB_INTERNAL_URL` (default `http://claude-db.default.svc.cluster.local:3001`),
  3 s timeout, 60 s in-memory cache, degrade to `{available:false}` on any failure.
- **MCP tool `get_training`** — no args → summary; `{exercise_id, days?}` → progression.
  Description positions it as coaching context (volume trend, e1RM), notes the hourly
  sync and that deep operations (sync, program push) live in the Claude-DB connector.
- **UI: new Träning tab** (`#/traning`, wide): this-week tiles, 12-week volume bar
  chart, recent workouts list, top-exercise table with an e1RM progression chart on
  select. Swedish copy; empty state explains Lyfta isn't connected yet.
- Server: `/ui/api/training` and `/ui/api/training/<exercise_id>` handled as an async
  branch in `server.ts` (handleUiApi is synchronous by design; same precedent as the
  product-image route).

## Kubernetes

- `claude-db/deployment.yaml`: `INTERNAL_PORT=3001`, containerPort `internal`,
  `LYFTA_API_KEY` from `claude-db-secrets` with `optional: true` — the pod runs (and
  local tools work) before the key exists.
- `claude-db/service.yaml`: expose 3001 as `internal` (ClusterIP only; ingress still
  routes only :3000).
- **New `claude-db/networkpolicy.yaml`** (claude-db previously had none): nginx → 3000;
  host/remote-node → 3000 `GET /healthz` (kubelet probes); kcal-assistant pod
  (home-automation ns) → 3001 L7-limited to `GET /internal/lyfta/*` + `/healthz`.
- kcal deployment: explicit `CLAUDE_DB_INTERNAL_URL` env (documents the coupling).

## Applying the API key (Philip, post-merge)

```bash
cd ~/Development/homelab
SOPS_AGE_KEY_FILE=age.key sops set kubernetes/apps/default/claude-db/secret.sops.yaml \
  '["stringData"]["LYFTA_API_KEY"]' '"<key from Lyfta app>"'
git add kubernetes/apps/default/claude-db/secret.sops.yaml && git commit -m "chore(claude-db): add Lyfta API key" && git push
task reconcile   # then: kubectl -n default rollout restart deploy/claude-db
```

First sync runs automatically ~5 s after the pod starts.

## Out of scope (deliberate)

- No wall-hub page yet (queued as an idea; the internal endpoints make it trivial later).
- No write path from kcal to Lyfta; program pushes are chat-only via the lyfta domain.
- No unit conversion; account unit is recorded and echoed.
