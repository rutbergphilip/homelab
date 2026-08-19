# Jokes Domain + UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `jokes` domain (personal joke repertoire with delivery notes, risk/context verdicts, trigger descriptions, telling log) to claude-db, with MCP tools and an Authentik-gated Swedish web UI at claude.rutberg.dev/ui/jokes.

**Architecture:** New domain folder `src/domains/jokes/` + registry line (established claude-db pattern). UI is a single self-contained HTML file served by the same bun process via a new `src/ui/` module, backed by two JSON API routes reading the same SQLite. Auth is nginx-ingress forward-auth to Authentik (kcal single-application pattern cloned onto claude.rutberg.dev), with a server-side `X-authentik-username` header check as defense in depth.

**Tech Stack:** Bun, bun:sqlite, @modelcontextprotocol/sdk, zod, vanilla HTML/CSS/JS (no build step), Flux/kustomize, Authentik blueprints.

**Spec:** `docs/superpowers/specs/2026-08-19-jokes-domain-design.md`

## Global Constraints

- Migrations are append-only, versioned per domain; index 0 is version 1.
- Domain name `jokes` (lowercase, no separators); tool prefix `joke_`.
- Server's global raw-URL reject of `..`, `%`, `\`, `//` stays unchanged — API uses no encoded query strings, writes are JSON POST bodies.
- UI page fully self-contained: inline CSS/JS, no CDNs, no external fonts.
- UI copy in Swedish.
- `/mcp` and `/healthz` remain un-gated; only `/ui` and `/api` get forward-auth.
- Outpost `providers` list in forward-auth.yaml is a full replacement — the claude provider must be appended in the same commit that adds it.
- All commits to `main`, conventional-commit style matching repo history.
- Version bump: package.json + registry.ts McpServer version → 0.5.0.

---

### Task 1: Jokes domain db layer

**Files:**
- Create: `claude-db/src/domains/jokes/db.ts`
- Test: `claude-db/tests/jokes.test.ts`

**Interfaces (Produces):**
- `JOKES_MIGRATIONS: string[]` — schema exactly as in spec §Data model, plus seeded contexts `puben, jobbfika, familjemiddag, gruppchatt` in migration 1.
- `normalizeAudience(names: string[]): string[]` — trim, lowercase, drop empties, dedupe, preserve order.
- `addJoke(db, input)` where input = `{ text, translation?, activation: 'active'|'trigger', type?, risk: number, delivery, notes?, triggers?: string[], context_ratings?: Record<string,'safe'|'risky'|'never'> }` → full joke view. Unknown context names are created (`ensureContext`).
- `updateJoke(db, id, patch)` — same fields optional; `triggers`/`context_ratings` replace wholesale when present → joke view.
- `setRetired(db, id, retired: boolean)` → joke view.
- `getJoke(db, id)` → joke view + `tellings: TellingView[]` (newest first).
- `findJokes(db, opts: { context?: string, audience?: string[], include_retired?: boolean })` → array of joke views; when `context` given, jokes with verdict `never` for it are EXCLUDED and each view gains `context_verdict`; when `audience` given each view gains `heard_by: string[]` (subset of audience present in any telling's audience).
- `logTelling(db, input: { joke_id, told_on: string, context?: string, audience?: string[], rating?: number, note?: string })` → telling view. Audience normalized. Context resolved via `ensureContext`.
- `listContexts(db)` → `[{id, name}]`; `knownAudienceTags(db)` → `string[]` (distinct tags across all tellings, sorted).
- `jokeStats(db)` → `{ by_rating: [...], most_told: [...], never_told: [...], per_context: [...], heard_by: Record<tag, jokeIds[]> }`.
- Joke view shape: `{ id, text, translation, activation, type, risk, delivery, notes, retired: boolean, created_at, updated_at, triggers: string[], context_ratings: Record<string, verdict>, stats: { times_told, last_told: string|null, avg_rating: number|null } }`.

**Steps:**

- [x] Write failing tests in `tests/jokes.test.ts` (freshDb pattern from collections.test.ts): add-with-triggers-and-ratings roundtrip; unknown context auto-created; update replaces triggers wholesale; findJokes excludes `never` for given context and excludes retired by default; heard_by logic; normalizeAudience; logTelling + stats math (avg rating, times told); knownAudienceTags dedupe.
- [x] Run `bun test tests/jokes.test.ts` — fails (module missing).
- [x] Implement `db.ts` (schema + functions above, following collections/db.ts idioms: `db.query<Row, Params>(...).get/.all`, RETURNING *).
- [x] `bun test` — all green (existing suites too).
- [x] Commit `feat(claude-db): jokes domain db layer`.

### Task 2: MCP tools + registry

**Files:**
- Create: `claude-db/src/domains/jokes/tools.ts`, `claude-db/src/domains/jokes/index.ts`
- Modify: `claude-db/src/core/registry.ts` (import + DOMAINS entry)
- Test: extend `claude-db/tests/jokes.test.ts` (tool registration smoke via server.test.ts pattern is already covered by `/healthz` domains assertion; add tool-list check in `tests/server.test.ts` only if trivial)

**Interfaces (Produces):** MCP tools `joke_add`, `joke_update`, `joke_retire`, `joke_unretire`, `joke_get`, `joke_find`, `joke_log_telling`, `joke_stats` — thin zod-validated wrappers over Task 1 functions via `wrap`/`jsonResult`. `joke_find` description carries the retrieval instructions (semantic trigger matching, exclude trigger-jokes from generic asks, respect `never`, flag repeats). `joke_log_telling` response includes `known_audience_tags` + `contexts`. `told_on` defaults to `todayStockholm()`, validated by `isValidDate`.

**Steps:**

- [x] Implement tools.ts + index.ts (`jokesDomain: Domain`), register in registry.
- [x] `bun test` green; `/healthz` in server.test.ts now lists `jokes` (update its expected domains array).
- [x] Commit `feat(claude-db): jokes MCP tools`.

### Task 3: /api/jokes routes + auth header check

**Files:**
- Create: `claude-db/src/ui/routes.ts`
- Modify: `claude-db/src/server.ts` (dispatch `/ui` + `/api` to routes module before final 404)
- Test: `claude-db/tests/ui.test.ts`

**Interfaces (Produces):**
- `handleUiRequest(req, res, db, pathname): Promise<boolean>` — returns true when the path was handled (`/ui/...` or `/api/...`), false otherwise. 403 `{error:"forbidden"}` when `x-authentik-username` header missing. Routes:
  - `GET /api/jokes` → `{ jokes: (JokeView & { tellings: TellingView[] })[], contexts: [{id,name}], audience_tags: string[] }` (includes retired; UI filters client-side).
  - `POST /api/jokes/<id>/tellings` — body `{ told_on?, context?, audience?, rating?, note? }` → `201` telling view; `400` on invalid body/rating/date; `404` unknown joke.
  - `GET /ui/jokes` → the HTML file (Task 4), `content-type: text/html; charset=utf-8`, `cache-control: no-store`.

**Steps:**

- [x] Write failing tests: 403 without header on all three routes; payload shape with header; POST happy path persists (visible in subsequent GET); 400/404 paths; GET /ui/jokes returns HTML containing `<!doctype html>`.
- [x] Implement routes.ts + server.ts dispatch (after token/mcp block, before 404; only when pathname starts with `/ui` or `/api`).
- [x] `bun test` green. Commit `feat(claude-db): jokes UI API routes behind authentik header check`.

### Task 4: The UI page

**Files:**
- Create: `claude-db/src/ui/jokes.html` (single file, inline CSS/JS)

**Interfaces (Consumes):** `GET /api/jokes`, `POST /api/jokes/<id>/tellings` exactly as Task 3.

**Requirements (acceptance criteria — frontend-design skill applies):**
- Swedish copy. Title "Skämtbanken". Views: Lista (default), Detalj, Statistik; bottom nav or header tabs; "Berättad!" modal reachable from card and detail.
- Lista: search box (client-side substring over text+triggers+type), filter chips: context (shows per-card verdict badge safe/risky/never for selected context), risk, activation (Aktiv/Trigger), visa pensionerade toggle. Trigger jokes visually distinct (badge/border).
- Detalj: line rendered large; delivery notes prominent; triggers list; context verdict grid; telling history with ratings.
- Berättad!: context picker (from payload), audience tag input with suggestions from `audience_tags`, 1–5 rating tap row, optional note, POST + optimistic refresh.
- Statistik: computed client-side from tellings — bäst/sämst (avg rating, min 1 telling), mest berättade, aldrig berättade, vem har hört vad.
- Dark-first design, thumb-reachable on phone, no external assets, distinctive (not generic AI gradient slop). Must also be legible in bright light (pub at 23:00 AND fika).
- Handles empty DB gracefully.

**Steps:**

- [x] Load frontend-design skill; design + write jokes.html.
- [x] Manual verification: run server locally with a seeded temp DB, load page with header-injecting curl/browser proxy, exercise all views. (Automated: ui.test.ts already asserts the file serves.)
- [x] Commit `feat(claude-db): jokes UI (Skämtbanken)`.

### Task 5: Kubernetes + Authentik manifests

**Files:**
- Create: `kubernetes/apps/default/claude-db/ingress-ui.yaml`, `ingress-outpost.yaml`, `service-outpost.yaml`
- Modify: `kubernetes/apps/default/claude-db/kustomization.yaml`, `kubernetes/apps/security/authentik/app/blueprints/forward-auth.yaml`

**Content:** Clone kcal-assistant's three files with host `claude.rutberg.dev`, service `claude-db:3000`, paths `/ui` AND `/api` on ingress-ui. Blueprint: `claude-provider` proxyprovider (forward_single, external_host `https://claude.rutberg.dev`, same flows/validity/property_mappings as kcal) + `claude-app` application (slug `claude`, name `Claude DB`) + append `!KeyOf claude-provider` to outpost providers.

**Steps:**

- [x] Write manifests + blueprint entries.
- [x] Validate: `kubectl kustomize kubernetes/apps/default/claude-db` renders; yaml parses.
- [x] Commit `feat(claude-db): authentik-gated UI ingress + blueprint`.

### Task 6: Seed data + version bump + deploy

**Files:**
- Create: `claude-db/seed/jokes/{01-trojan,02-arsringarna,03-ipren}.json`, `claude-db/scripts/seed-jokes.ts`
- Modify: `claude-db/package.json` (0.5.0), `claude-db/src/core/registry.ts` (version string), `kubernetes/apps/default/claude-db/deployment.yaml` (image tag), `.claude/CLAUDE.md` project docs (jokes domain line), memory file.

**Steps:**

- [x] Seed JSONs with the three jokes' full text/translation/activation/type/risk/delivery/notes/triggers/context verdicts from the spec's source summary; seed-jokes.ts follows scripts/seed.ts (idempotent: skip when joke text already exists — add via joke_find scan first).
- [x] Version bumps; `bun test` green.
- [x] `docker build --platform linux/amd64 -t rutbergphilip/claude-db:v0.5.0 claude-db/ && docker push rutbergphilip/claude-db:v0.5.0`.
- [x] Bump deployment.yaml tag; commit all `feat(claude-db): jokes domain — v0.5.0`; push; `task reconcile`.
- [x] Verify live: `/healthz` lists jokes; MCP `tools/list` on `/mcp/<token>/jokes` shows 8 tools; `curl -I https://claude.rutberg.dev/ui/jokes` → 302 to outpost; run seed-jokes.ts; GET /api/jokes via authenticated session or check via MCP `joke_find` that 3 jokes exist.
- [x] Update CLAUDE.md claude-db section + memory. Final commit.

## Self-review

- Spec coverage: data model→T1, tools→T2, API/auth→T3, UI→T4, k8s/authentik→T5, seed/deploy/verify→T6. Out-of-scope items have no tasks (correct).
- No placeholders: interfaces carry exact shapes; YAML/HTML content defined by explicit cloning source + acceptance criteria.
- Type consistency: joke view / telling view shapes defined once in T1, consumed by T2/T3/T4.
