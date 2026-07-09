# kcal-assistant

Personal MCP server for Philip's calorie tracking, used as a custom connector in the Claude app. Holds the product database, meal log, standing preferences/rules, an Open Food Facts lookup, live discovery against his ICA store (Maxi ICA Stormarknad Nynäshamn via handlaprivatkund.ica.se, `search_store`), week summaries (`get_week`), a weight log with backwards-computed TDEE (`log_weight`/`get_trend`), a mealprep batch calculator (`compute_batch`), and dry-run day planning (`preview_day`), and executable recipes (`save_recipe`/`get_recipe`/`find_recipes`/`delete_recipe`) whose ingredients resolve against current product data at every read. Runs on the homelab cluster at `https://kcal.rutberg.dev/mcp/<token>`.

The server owns ALL nutrition math: item/meal/day computation at logging, plan previews, batch per-100g derivation, and the TDEE trend (`TDEE = snittintag + Δkg × 7700 ÷ dagar`, intake averaged over the same span as the weight delta, with staleness and uncertainty flags). Weight data lives only in the SQLite database, never in this repo.

Note on ICA: the endpoints are the store site's own web API (no auth). Its WAF requires a browser User-Agent. Nutrition per 100g/100ml is parsed from the product pages' näringsvärde table; details are cached in-memory for 7 days.

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
| `ICA_STORE_ID` | no | `1003421` | Store for `search_store` (Maxi ICA Stormarknad Nynäshamn) |

## Seed products

```bash
bun scripts/seed.ts --url https://kcal.rutberg.dev/mcp/<token> --file seed/products.json
```

`seed/products.json` is gitignored; see `seed/products.example.json` for the shape.

## Deployment

Manifests live in `kubernetes/apps/home-automation/kcal-assistant/`. Image is built by `.github/workflows/kcal-assistant.yaml` on pushes to `main` touching this directory, tagged `docker.io/rutbergphilip/kcal-assistant:v<package.json version>`.

Release: bump `version` in `package.json`, bump the image tag in `deployment.yaml`, merge, `task reconcile`.

The Deployment must keep `replicas: 1` and `strategy: Recreate` — SQLite on NFS tolerates exactly one writer process.

## Web UI (`/ui`)

Read-only database browser (KCAL·DB) at `https://kcal.rutberg.dev/ui`: dagar, måltider, produkter, recept, vikt/TDEE, regler. Editing stays in chat via MCP — the UI has zero mutation endpoints.

**Security model (defense in depth):** `/ui` is gated by self-hosted **Authentik**
forward-auth (single-application pattern — the whole handshake runs on
kcal.rutberg.dev so the session cookie and auth check share one host).
`/outpost.goauthentik.io/*` is proxied to the Authentik embedded outpost via an
ExternalName service; the `/ui` ingress carries the forward-auth annotations. The
server re-verifies the forwarded `X-authentik-email == AUTHENTIK_ALLOWED_EMAIL`,
and a CiliumNetworkPolicy limits the pod to the ingress controller + node so the
header can't be forged in-cluster. `/mcp/<token>` and `/healthz` are on a separate
open ingress and are NEVER gated (claude.ai can't do interactive login). Unset
auth env → `/ui` fails closed (503). A legacy Cloudflare Access mode
(`CF_ACCESS_*`, JWT verification) is still supported in code but not used.

See `docs/kcal-and-sso-status.md` for the full Authentik setup and the recreate
steps for the API-created provider/application/outpost config.

Local dev: `UI_DEV_NO_AUTH=1 bun run src/index.ts` (refused when NODE_ENV=production).

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
