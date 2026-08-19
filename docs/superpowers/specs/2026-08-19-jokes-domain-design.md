# Jokes Domain + UI — Design Spec

**Date:** 2026-08-19
**Status:** Approved (design walked through in chat; full autonomous implementation authorized)
**Target:** claude-db v0.5.0

## Purpose

A private database of Philip's personal joke repertoire: the jokes he actually
tells, with delivery notes, risk ratings, per-context verdicts, trigger
descriptions, and a log of every telling. The core problem is retrieval under
pressure — describing a situation in plain language and getting back the jokes
that fit — plus, over time, an honest record of which jokes actually land.

Private by construction: MCP behind the existing token, UI behind Authentik.
The collection grows from logging real moments, never bulk imports.

## Architecture decisions (settled in brainstorming)

1. **Claude chat is the semantic matcher.** No embeddings, no vector search.
   The collection is deliberately small (tens of jokes); the `joke_find` MCP
   tool returns all active jokes with their trigger descriptions and Claude
   ranks them against the described situation. UI search is client-side
   text filtering for browsing, not situation matching.
2. **UI scope: browse + log tellings.** Authoring/editing stays in chat via
   MCP. The UI's one write action is "Berättad!" (log a telling) — the thing
   you'd do from a phone at the pub.
3. **Audience = free-text name tags**, normalized lowercase, stored as a JSON
   array on each telling. No persons table. Tools return known tags so Claude
   and the UI reuse them consistently.
4. **Everything lives in claude-db.** New `jokes` domain (folder + registry
   line), UI served by the same bun process, same SQLite file, same deploy.

## Data model (domain migrations, version 1)

```sql
CREATE TABLE jokes (
  id          INTEGER PRIMARY KEY,
  text        TEXT NOT NULL,                 -- the line, verbatim (Swedish)
  translation TEXT,                          -- optional English gloss
  activation  TEXT NOT NULL CHECK (activation IN ('active','trigger')),
  type        TEXT,                          -- free label: one-liner, prop, callback…
  risk        INTEGER NOT NULL CHECK (risk BETWEEN 1 AND 5),
  delivery    TEXT NOT NULL,                 -- delivery notes (timing, gesture, reply-vs-opener)
  notes       TEXT,                          -- provenance/background
  retired     INTEGER NOT NULL DEFAULT 0,    -- soft retire; history is never deleted
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE joke_triggers (
  id          INTEGER PRIMARY KEY,
  joke_id     INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
  description TEXT NOT NULL                  -- one situation per row; the corpus Claude matches
);

CREATE TABLE joke_contexts (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- seeded in migration 1: puben, jobbfika, familjemiddag, gruppchatt

CREATE TABLE joke_context_ratings (
  joke_id    INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
  context_id INTEGER NOT NULL REFERENCES joke_contexts(id) ON DELETE CASCADE,
  verdict    TEXT NOT NULL CHECK (verdict IN ('safe','risky','never')),
  PRIMARY KEY (joke_id, context_id)
);

CREATE TABLE joke_tellings (
  id         INTEGER PRIMARY KEY,
  joke_id    INTEGER NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
  told_on    TEXT NOT NULL,                  -- YYYY-MM-DD, Stockholm
  context_id INTEGER REFERENCES joke_contexts(id) ON DELETE SET NULL,
  audience   TEXT NOT NULL DEFAULT '[]',     -- JSON array of normalized name tags
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  note       TEXT,                           -- why it landed/bombed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_joke_triggers_joke ON joke_triggers(joke_id);
CREATE INDEX idx_joke_tellings_joke ON joke_tellings(joke_id);
```

Audience tags are normalized: trimmed, lowercased, deduped at write time.

## MCP tools (prefix `joke_`, connector `/mcp/<token>/jokes`)

- **`joke_add`** — full authoring in one call: text, translation, activation,
  type, risk, delivery, notes, triggers[], context_ratings
  ({context: verdict} map; unknown context names are created on the fly).
- **`joke_update`** — patch fields; `triggers` and `context_ratings`, when
  provided, replace wholesale (simplest correct semantics at this scale).
- **`joke_retire` / `joke_unretire`** — soft toggle.
- **`joke_find`** — the retrieval tool. Optional filters: `context` (name),
  `audience` (names), `include_retired`. Returns all matching jokes with
  triggers, delivery, risk, context verdicts, telling stats (times told, last
  told, avg rating) and — when `audience` is given — which of those people have
  already heard each joke. Tool description instructs Claude to: match the
  situation semantically against triggers; exclude `activation='trigger'`
  jokes from generic "tell me a joke" requests; never suggest jokes whose
  verdict for the given context is `never`; flag repeats for the audience.
- **`joke_get`** — one joke, full telling history.
- **`joke_log_telling`** — joke_id, told_on (default today Stockholm),
  context, audience[], rating, note. Response echoes known audience tags and
  contexts so Claude normalizes toward existing spellings.
- **`joke_stats`** — best/worst by avg rating, most told, never told,
  per-audience-tag heard lists, per-context performance.

## UI + API

**Routes (same bun server, new `src/ui/` module):**

- `GET /ui/jokes` → single self-contained HTML file (inline CSS/JS, no build
  step, no external assets). Swedish UI.
- `GET /api/jokes` → the entire dataset in one JSON payload: jokes (with
  triggers, context ratings, stats, recent tellings), contexts, known
  audience tags. All list filtering happens client-side.
- `POST /api/jokes/:id/tellings` → log a telling (JSON body).

**Why one fat GET:** `server.ts` globally rejects raw URLs containing `%`,
which would break encoded query strings (Swedish chars, spaces). With a
tiny dataset, shipping everything and filtering client-side sidesteps the
whole class of problems. Writes are JSON POST bodies — nothing encoded in
the path.

**Screens (one SPA, client-side view switching):**

1. **Lista** — joke cards; filter chips for context (card shows that
   context's verdict badge), risk, activation type; plain text search.
   Trigger jokes visually distinct from active ones.
2. **Detalj** — the line displayed big; delivery notes prominent (the part
   memory drops first); triggers, context verdicts, telling history.
3. **Berättad!** — from card or detail: pick context, tag audience
   (suggestions from known tags), rate 1–5, optional note. Three taps.
4. **Statistik** — what actually lands: top/bottom by rating, overused,
   untold, who's heard what.

Design quality bar: this is a personal tool Philip will open at 23:00 in a
pub — dark-friendly, thumb-reachable, fast, distinctive (frontend-design
skill applies at build time). No external fonts/CDNs (self-contained page).

**Auth model:** The `/ui` and `/api` paths are gated by Authentik
forward-auth at the ingress (see below). Defense in depth: the server
requires the `X-authentik-username` header on `/ui` and `/api` requests and
rejects with 403 when absent — nginx's `auth-response-headers` overwrite any
client-supplied value, so a request that reaches the pod through the gated
path always carries the authenticated identity, and a request that somehow
bypassed the gate carries none. `/mcp` and `/healthz` are untouched.

The `%`-reject guard in `server.ts` stays global and unchanged.

## Kubernetes + Authentik (single-application forward-auth pattern, cloned from kcal)

In `kubernetes/apps/default/claude-db/`:

- **`ingress-ui.yaml`** — same host `claude.rutberg.dev`, paths `/ui` and
  `/api` (Prefix), full kcal-style forward-auth annotation block with
  `auth-signin` on claude.rutberg.dev. nginx longest-prefix routing keeps
  `/mcp` + `/healthz` on the existing open ingress.
- **`ingress-outpost.yaml`** — `/outpost.goauthentik.io` → embedded outpost,
  `upstream-vhost: claude.rutberg.dev`, no auth annotations.
- **`service-outpost.yaml`** — ExternalName alias to
  `authentik-server.security.svc.cluster.local`.
- kustomization.yaml gains the three files.

In `kubernetes/apps/security/authentik/app/blueprints/forward-auth.yaml`:

- `claude-provider` (proxyprovider, `forward_single`,
  `external_host: https://claude.rutberg.dev`, same flows/validity/mappings
  as kcal) + `claude-app` (application, slug `claude`, name "Claude DB").
- **Append `!KeyOf claude-provider` to the embedded outpost `providers`
  list in the same commit** — that list is a full replacement on apply.

## Testing

- `tests/jokes.test.ts` — domain db functions against in-memory SQLite:
  CRUD, trigger/context-rating replacement semantics, audience
  normalization, heard-by logic, stats math, retire filtering.
- `tests/ui.test.ts` — API routes through the real HTTP server: 403 without
  the Authentik header, full payload shape with it, telling POST happy path
  + validation errors, `/ui/jokes` serves HTML.
- Existing tests must stay green; `bun test` is the gate.

## Deployment

1. Version bump to 0.5.0 (package.json, registry server version).
2. `docker build --platform linux/amd64 -t rutbergphilip/claude-db:v0.5.0 . && docker push …`
3. Bump tag in deployment.yaml; commit code + manifests + blueprint; push;
   `task reconcile`.
4. Verify: `/healthz` lists `jokes`; MCP `joke_find` responds; unauthenticated
   `/ui/jokes` → 302 to Authentik; authenticated flow works.
5. Seed the three starting jokes (the shirt, the tree rings, the Ipren) with
   their full delivery notes and context verdicts via MCP, from
   `seed/jokes/*.json` + a small seed script following `scripts/seed.ts`.

## Out of scope (deliberately)

- Embeddings / server-side semantic search (revisit only if the collection
  outgrows what a tool result can carry — hundreds of jokes).
- Joke authoring/editing in the UI.
- A persons table or any contact management.
- Public sharing of any kind.
