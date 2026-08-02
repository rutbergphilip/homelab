# claude-db

Personal MCP data platform at `https://claude.rutberg.dev` — one server, one SQLite
database, multiple *domains* (fragrance collection, generic collections, and whatever
comes next). Design spec: `docs/superpowers/specs/2026-08-02-claude-db-mcp-platform-design.md`.

## Endpoints

- `POST /mcp/<token>` — MCP, all domains
- `POST /mcp/<token>/<domain>` — MCP, one domain (use per-domain connectors in claude.ai
  to keep tool lists small): `/fragrance`, `/collections`
- `GET /healthz`

## Commands

```bash
bun install
bun test
bun run src/index.ts          # needs MCP_TOKEN; DB_PATH defaults to ./claude.db
MCP_URL=https://claude.rutberg.dev/mcp/<token> bun run scripts/seed.ts
```

## Adding a domain

1. `src/domains/<name>/` with `db.ts` (migrations + data access), `tools.ts`, `index.ts`
   exporting a `Domain`.
2. Add it to `DOMAINS` in `src/core/registry.ts`.
3. Tools must be prefixed `<name>_`. Migrations are append-only, tracked per domain in
   `schema_migrations`.

## Deploy

Image `rutbergphilip/claude-db` on Docker Hub; manifests in
`kubernetes/apps/default/claude-db/` (Flux). Data on the NFS PVC subPath
`claude-db/data`, nightly backups to `claude-db/backups`.

```bash
docker build --platform linux/amd64 -t rutbergphilip/claude-db:vX.Y.Z .
docker push rutbergphilip/claude-db:vX.Y.Z
# bump tag in kubernetes/apps/default/claude-db/deployment.yaml, commit, push
task reconcile
```
