# claude-db — Personal MCP Data Platform (claude.rutberg.dev)

**Date:** 2026-08-02
**Status:** Approved (user delegated design approval; extensibility/MCP-shape/Fragrantica/wear-journal decisions confirmed via Q&A)

## Purpose

A single, expandable MCP server at `https://claude.rutberg.dev` that acts as Philip's
general-purpose personal database for Claude chat. Multiple *domains* (fragrances,
future: dating notes, etc.) live inside one server, one SQLite database, one deployment —
each domain contributing its own tables and tools. Successor pattern to kcal-assistant,
generalized.

V1 ships: platform core + **fragrance** domain (collection, Fragrantica knowledge
snapshots, wear journal) + **collections** domain (generic ad-hoc lists Claude can create
from chat without a deploy). No UI in v1.

## Decisions (from user Q&A)

1. **Hybrid extensibility** — real domains are typed code modules; plus a generic
   `collections` domain for ad-hoc data created directly from chat.
2. **Per-domain MCP paths** — `/mcp/<token>` exposes all domains;
   `/mcp/<token>/<domain>` exposes one. Same server, choose per Claude connector.
3. **Fragrantica = snapshot ingest** — pages are scraped via browser (by Claude, not the
   server), stored as a JSON snapshot per fragrance. Refresh = re-scrape + save tool.
   The server never calls Fragrantica (their anti-bot blocks server-side fetches).
4. **Wear journal included** in fragrance v1.
5. **Storage: SQLite on the existing NFS PVC** (`homelab-nfs-pvc`, subPath
   `claude-db/data`). No Postgres/Mongo on the NAS — single-user write volume doesn't
   justify a DB server; kcal has proven SQLite-on-NFS stable. If a domain ever outgrows
   this, the escape hatch is CloudNativePG in-cluster, not NAS containers.

## Architecture

Bun + TypeScript + `@modelcontextprotocol/sdk` + zod + `bun:sqlite`, mirroring
kcal-assistant's proven runtime choices. Project lives at `homelab/claude-db/`
(tracked in the homelab repo, like kcal-assistant).

```
claude-db/
├── src/
│   ├── index.ts            # startup, shutdown (SIGTERM-safe)
│   ├── config.ts           # MCP_TOKEN, DB_PATH, PORT
│   ├── server.ts           # HTTP routing, token auth, per-domain MCP mounting
│   ├── core/
│   │   ├── domain.ts       # Domain interface + registry
│   │   ├── db.ts           # open DB (TRUNCATE journal, FULL sync, FK on), migrate
│   │   └── tool-util.ts    # wrap(), jsonResult() — shared tool helpers
│   └── domains/
│       ├── fragrance/
│       │   ├── index.ts    # Domain export: name, description, migrations, register
│       │   ├── db.ts       # data access (fragrances, snapshots, wear log)
│       │   └── tools.ts    # MCP tool registrations
│       └── collections/
│           ├── index.ts
│           ├── db.ts
│           └── tools.ts
├── tests/                  # bun test, in-memory SQLite
├── seed/fragrances/        # scraped Fragrantica JSON for the initial 6
├── scripts/seed.ts         # loads seed JSON via the live MCP endpoint
├── Dockerfile              # oven/bun:1-alpine, USER bun
└── package.json
```

### Domain interface (the extensibility contract)

```ts
export interface Domain {
  name: string;                 // URL segment + tool prefix, e.g. "fragrance"
  description: string;
  migrations: string[];         // append-only SQL, versioned per domain
  register(server: McpServer, db: Database): void;
}
export const DOMAINS: Domain[] = [fragranceDomain, collectionsDomain];
```

Adding a domain = one folder + one entry in `DOMAINS`. Nothing else changes.

**Migrations:** a `schema_migrations(domain TEXT, version INTEGER, applied_at TEXT,
PRIMARY KEY(domain, version))` table instead of kcal's global `PRAGMA user_version`,
so each domain versions independently and domains can be added/evolved without
coordinating a global counter. Core owns this table (domain `_core`, version 1).

### HTTP surface

| Route | Method | Auth | Behavior |
|---|---|---|---|
| `/healthz` | GET | none | `{ok, version, domains:[...]}` |
| `/mcp/<token>` | POST | token in path (timing-safe compare) | MCP, all domains' tools |
| `/mcp/<token>/<domain>` | POST | same | MCP, that domain's tools only |
| anything else | * | — | 404, never echoes the URL (may contain a mistyped token) |

Token-in-path (not bearer header) because claude.ai custom connectors are configured
by URL only — same as kcal. Token is 32-byte hex (URL-safe), stored as SOPS secret.
Same raw-path hardening as kcal: reject `..`, `%`, `\\`, `//` before parsing.
Stateless Streamable HTTP: fresh `McpServer` + transport per request, JSON responses
(no SSE) so nginx buffering is a non-issue. Unknown `<domain>` segment → 404.

All tools are prefixed with their domain name (`fragrance_*`, `collection_*`) so the
combined mount never collides and transcripts stay self-describing.

## Fragrance domain

### Tables

```sql
fragrances (
  id INTEGER PRIMARY KEY,
  house TEXT NOT NULL,             -- "Jean Paul Gaultier"
  name TEXT NOT NULL,              -- "Le Male Elixir"
  status TEXT NOT NULL DEFAULT 'owned'
         CHECK (status IN ('owned','wishlist','finished','sold')),
  concentration TEXT,              -- EdP, Parfum, ...
  size_ml REAL,
  year INTEGER,
  perfumer TEXT,
  fragrantica_url TEXT UNIQUE,
  personal_notes TEXT,             -- Philip's own take
  fragrantica_json TEXT,           -- full snapshot blob (see shape below)
  fragrantica_scraped_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (house, name) ON CONFLICT ABORT
);

wear_log (
  id INTEGER PRIMARY KEY,
  fragrance_id INTEGER NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  worn_on TEXT NOT NULL,           -- YYYY-MM-DD
  occasion TEXT,                   -- free text: "date night", "office", ...
  weather TEXT,                    -- free text: "kallt, -5°C", "sommarkväll"
  sprays INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),   -- how well it worked
  compliments TEXT,                -- who/what was said, free text
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_wear_fragrance ON wear_log(fragrance_id);
CREATE INDEX idx_wear_date ON wear_log(worn_on);
```

**Snapshot as one JSON blob, deliberately.** The collection is small (tens of rows),
tools return whole snapshots, and Claude does the reasoning — first-class columns for
seasons/accords would add schema churn every time Fragrantica's page changes, for zero
query benefit at this scale. The blob is validated by zod on save:

```ts
{
  rating: number|null, rating_count: number|null,
  accords: [{name: string, strength: number|null}],   // strength 0-100 if visible
  notes: { top: string[], heart: string[], base: string[] } | { uncategorized: string[] },
  seasons: { winter,spring,summer,fall,day,night: number|null },  // vote bar %
  longevity: Record<string,number> | null,   // {"eternal": 12, "long lasting": 40, ...}
  sillage: Record<string,number> | null,
  gender_vote: Record<string,number> | null,
  price_value: Record<string,number> | null,
  description: string|null                   // Fragrantica's editorial paragraph
}
```

### Tools (9)

| Tool | Purpose |
|---|---|
| `fragrance_add` | Add fragrance (house, name, url, size, concentration, status, personal notes; optional snapshot inline) |
| `fragrance_update` | Patch metadata/status/personal notes by id |
| `fragrance_remove` | Hard delete (cascades wear log); description tells Claude to prefer `status` changes for finished/sold bottles |
| `fragrance_list` | Compact list, optional status filter (default owned) |
| `fragrance_get` | Full detail: metadata + snapshot + last 10 wears |
| `fragrance_save_snapshot` | Save/refresh the Fragrantica blob for a fragrance; stamps `scraped_at`. Description documents the blob shape so any Claude with browsing can refresh it |
| `fragrance_log_wear` | Log a wear (by id or fuzzy name match; date defaults today Europe/Stockholm) |
| `fragrance_wear_history` | Wears with filters (fragrance, occasion substring, since); includes per-fragrance aggregates (count, last worn, avg rating) |
| `fragrance_context` | **The one-call "what should I wear" tool**: whole owned collection with accords/seasons/ratings compacted + wear stats (last worn, wears per occasion, avg rating) + current date/season. Description tells Claude to combine this with weather/occasion from conversation |

## Collections domain (generic, chat-creatable)

```sql
collections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT,
  item_hint TEXT,        -- optional JSON: suggested item fields, purely advisory
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
collection_items (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  data TEXT NOT NULL,    -- arbitrary JSON object
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_items_collection ON collection_items(collection_id);
```

Tools (7): `collection_create`, `collection_list` (names + counts + hints),
`collection_delete` (requires `confirm: true`), `collection_add_item`,
`collection_update_item` (shallow merge patch; `null` deletes a key),
`collection_delete_item`, `collection_query` (by collection; optional field
equals-filter via `json_extract`, optional case-insensitive substring search across the
JSON text, limit/offset, newest first).

This is the pressure valve: "Claude, start keeping a list of X" works instantly from
chat. If an ad-hoc collection grows serious, it graduates into a typed domain module.

## Fragrantica ingestion flow

1. Claude (Code or chat, with browser access) opens the fragrance page and extracts the
   snapshot shape above from the DOM.
2. Calls `fragrance_add` (or `fragrance_save_snapshot` for refresh) on the live MCP.
3. For v1, Claude Code scrapes the 6 owned fragrances now via claude-in-chrome, saves
   each as `seed/fragrances/<slug>.json` (committed, so re-seeding never needs
   re-scraping), and `scripts/seed.ts` pushes them to the live endpoint after deploy —
   which doubles as the end-to-end smoke test.

## Deployment (Kubernetes, GitOps)

Mirrors kcal-assistant, minus UI/outpost/internal-port complexity:

- **Namespace:** `default` (general service, not home-automation).
- **Manifests:** `kubernetes/apps/default/claude-db/`: `deployment.yaml` (1 replica,
  `strategy: Recreate` — SQLite single writer; fsGroup 1000; NFS PVC subPath
  `claude-db/data`; requests 50m/128Mi, limits 250m/256Mi; liveness+readiness on
  `/healthz`), `service.yaml`, `ingress.yaml` (host `claude.rutberg.dev`, class
  `external`, external-dns target `external.rutberg.dev`, cert-manager
  letsencrypt-production), `secret.sops.yaml` (`MCP_TOKEN`), `backup-cronjob.yaml`
  (nightly 03:15 Europe/Stockholm, adapted from kcal's backup.ts: sqlite-safe copy to
  subPath `claude-db/backups`, 14-day retention), `kustomization.yaml`.
- **Image:** `rutbergphilip/claude-db:vX.Y.Z` on Docker Hub, built locally
  (same flow as kcal).
- No NetworkPolicy needed in v1 (no unauthenticated internal port exists).

## Error handling & security

- All tool handlers wrapped (kcal's `wrap()` pattern): thrown errors become MCP tool
  errors with the message, never a 500.
- Timing-safe token compare; 404 for wrong token; URL never echoed.
- Zod validates every tool input and the snapshot blob; SQL is parameterized throughout.
- Body size cap on MCP requests (SDK default) — no other write surface exists.
- DB opened with `journal_mode=TRUNCATE`, `synchronous=FULL`, `foreign_keys=ON`,
  `busy_timeout=5000` (NFS-safe, same as kcal).

## Testing

`bun test` with in-memory SQLite:

- core: migrations apply idempotently per domain; registry mounts expected tool sets
  for all-domains vs single-domain.
- fragrance: add/update/list/get, snapshot validation (accept/reject), wear log +
  aggregates, context payload shape.
- server: auth (bad token 404, good token reaches MCP), `/healthz`, path hardening —
  via real HTTP against an ephemeral port.

## Success criteria

1. `https://claude.rutberg.dev/healthz` returns ok with both domains listed.
2. Adding `https://claude.rutberg.dev/mcp/<token>/fragrance` as a claude.ai custom
   connector exposes exactly the 9 fragrance tools.
3. All 6 owned fragrances are in the DB with full Fragrantica snapshots.
4. `fragrance_context` returns everything needed to answer "what should I wear to a
   winter date night?" in one call.
5. A new ad-hoc collection can be created and queried purely from chat.
6. Nightly backup lands in `claude-db/backups` on the NAS.

## Out of scope (v1)

UI, Authentik gating (no UI to gate), tinder domain (future module), automatic
Fragrantica refresh (manual/on-demand via any browsing Claude), multi-user anything.
