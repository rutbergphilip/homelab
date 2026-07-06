# kcal-assistant

Personal MCP server for Philip's calorie tracking, used as a custom connector in the Claude app. Holds the product database, meal log, standing preferences/rules, and an Open Food Facts lookup. Runs on the homelab cluster at `https://kcal.rutberg.dev/mcp/<token>`.

The server owns all arithmetic: item macros, day totals and remaining vs targets are computed here with the "räkna högt" rules (kcal/fat/carbs rounded up, protein rounded down) so the LLM never does math.

## Run locally

```bash
bun install
MCP_TOKEN=dev DB_PATH=./dev.db bun run src/index.ts
curl localhost:3000/healthz
npx @modelcontextprotocol/inspector   # connect Streamable HTTP to http://localhost:3000/mcp/dev
```

## Test

```bash
bun test          # unit + integration (real MCP client over HTTP)
bunx tsc --noEmit
```

## Environment

| Var | Required | Default | Purpose |
|---|---|---|---|
| `MCP_TOKEN` | yes | - | Secret URL path segment; requests to `/mcp/<MCP_TOKEN>` are served, all else 404s |
| `DB_PATH` | no | `./kcal.db` | SQLite file (NFS-mounted in the cluster) |
| `PORT` | no | `3000` | HTTP port |

## Seed products

```bash
bun scripts/seed.ts --url https://kcal.rutberg.dev/mcp/<token> --file seed/products.json
```

`seed/products.json` is gitignored; see `seed/products.example.json` for the shape.

## Deployment

Manifests live in `kubernetes/apps/home-automation/kcal-assistant/`. Image is built by `.github/workflows/kcal-assistant.yaml` on pushes to `main` touching this directory, tagged `docker.io/rutbergphilip/kcal-assistant:v<package.json version>`.

Release: bump `version` in `package.json`, bump the image tag in `deployment.yaml`, merge, `task reconcile`.

The Deployment must keep `replicas: 1` and `strategy: Recreate` — SQLite on NFS tolerates exactly one writer process.

## Rotate the token

1. `openssl rand -hex 32`
2. Update `MCP_TOKEN` in `kubernetes/apps/home-automation/kcal-assistant/secret.sops.yaml` (decrypt, edit, `sops --encrypt --in-place`)
3. Merge + `task reconcile`, wait for the pod to restart
4. Update the connector URL in claude.ai → Settings → Connectors

Note: the token is part of the URL. Don't paste the full connector URL into chats or logs.

## Claude Project instructions (paste into the project using this connector)

> Du är min kalorilogg-assistent. Vid start av varje konversation: anropa `get_context` och följ reglerna och målen som returneras.
>
> När jag nämner mat: sök först med `search_products`. Om produkten saknas, använd `lookup_nutrition`, visa förslaget för mig, och spara sedan med `save_product` (avrunda uppåt, markera osäkra värden som overifierade).
>
> Logga måltider med `log_meal` och använd ALLTID serverns siffror, räkna aldrig själv. Vid rättelser: `edit_meal` respektive `save_product`.
>
> Svar per loggad måltid: alla fyra makron, betyg 1-10 med kort motivering, löpande dagstotal och kvar mot dagens mål. Svenska. Inga tankstreck. Nya stående regler sparas med `save_preference`.
