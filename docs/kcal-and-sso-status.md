# Kcal Assistant + Authentik SSO — Status & Handoff

Living status doc for two intertwined efforts on this cluster. No secrets here
(values live in SOPS-encrypted `*.sops.yaml` and the Authentik DB).

Last updated: 2026-07-09.

---

## 1. Kcal Assistant (personal calorie tracker)

A single-user MCP server used as a custom connector in the Claude app, plus a
read-only web UI. Source: `kcal-assistant/`. Deploy: `kubernetes/apps/home-automation/kcal-assistant/`.

**Live at** `https://kcal.rutberg.dev`:
- `/mcp/<token>` — the MCP endpoint claude.ai connects to (secret URL-path token, **never gated by SSO**).
- `/healthz` — open health probe.
- `/ui` — read-only database browser (KCAL·DB), gated by Authentik (see §2).

**Current version:** `v0.5.1` (image `docker.io/rutbergphilip/kcal-assistant`).

**Capabilities (22 MCP tools):** product DB with FTS5 fuzzy Swedish search;
meal logging with server-computed macros ("räkna högt" rounding); day types +
targets; preferences/rules; Open Food Facts lookup; live ICA store discovery
(`search_store`, Maxi ICA Nynäshamn, store 1003421); week summary (`get_week`);
weight log + backwards-computed TDEE (`log_weight`/`get_trend`); mealprep batch
calculator (`compute_batch`); dry-run day planning (`preview_day`); executable
recipes (`save_recipe`/`get_recipe`/`find_recipes`/`delete_recipe`) that resolve
against current product data at read time. The server owns ALL nutrition math.

**Data:** SQLite on the shared NFS PVC (`kcal-assistant/data` subPath), single
replica + `Recreate`. Nightly backup CronJob (03:00, weekday rotation) to
`kcal-assistant/backups`. Weight/meal data lives only in the DB, never in git.

**Release flow (fully automated):** bump `version` in `kcal-assistant/package.json`
+ the image tag in `deployment.yaml` in one PR → merge → CI (`kcal-assistant.yaml`
workflow) builds & pushes the image → Flux deploys. Requires the `DOCKERHUB_*`
repo secrets (set). To avoid /mcp downtime when the server code changes, split
into two PRs: app code first (CI builds the image), then the deployment tag bump.

**Claude side:** a Claude Project with short Swedish instructions (call
`get_context` at start, use server numbers, per-meal format rules). After any
server release, START A NEW CHAT — claude.ai caches a connector's tool list per
conversation.

---

## 2. Authentik SSO

Self-hosted SSO at `https://auth.rutberg.dev` (namespace `security`). Chosen over
Cloudflare Access. Resurrecting it also fixed the long-red flux-local CI.

**Status: LIVE and protecting kcal `/ui`, homarr (dashboard.rutberg.dev) and
pihole (pihole.rutberg.dev).** Login verified end-to-end. Provider/application/
outpost config now lives in git as a blueprint (see below) — the "config only
in DB" gap is closed.

**Scope decisions (2026-07-09):** jellyfin, plex, home-assistant, jellyseerr,
the arr-stack and qbittorrent get NO Authentik middleware (native auth,
NAS-backed, client apps break under forward-auth). trilium skipped for now
(Philip's call). market-monitor skipped (full native JWT+session auth).

**How kcal /ui is protected (single-application forward auth):**
- The whole auth handshake runs on `kcal.rutberg.dev` so the session cookie and
  the auth check share one host (cross-subdomain cookies loop — that was the bug).
- `/outpost.goauthentik.io/*` is served on kcal.rutberg.dev via an ExternalName
  service (`authentik-embedded-outpost` → `authentik-server.security.svc`,
  `upstream-vhost: kcal.rutberg.dev`) + a no-auth ingress.
- `kcal-assistant-ui` ingress (path `/ui`) has the forward-auth annotations;
  `auth-url` = the in-cluster outpost, `auth-signin` = kcal's own /outpost/start.
- The kcal server re-verifies the forwarded `X-authentik-email == AUTHENTIK_ALLOWED_EMAIL`
  (defense in depth), and a CiliumNetworkPolicy limits the pod to nginx + node
  (blocks in-cluster header forgery). `/mcp` is on a separate open ingress.
- Admin: `akadmin` / the `bootstrap-password` key in the authentik SOPS secret.
  (`bootstrap-token` is a separate API token.)

**Login credential injection:** the goauthentik chart does NOT support `valueFrom`
under `authentik.*` (it flattens to literal env). Secrets are injected via
`global.env` with real `valueFrom.secretKeyRef`. Postgres/Redis are raw manifests
on `local-path-provisioner`; postgres runs as uid 70.

> **Robustness gap CLOSED (2026-07-09, PR #376):** all forward-auth providers/
> applications and the embedded-outpost assignment are now a git blueprint at
> `kubernetes/apps/security/authentik/app/blueprints/forward-auth.yaml`,
> mounted via the chart's `blueprints.configMaps` and re-applied automatically.
> **Do NOT edit these objects in the UI/API** — the blueprint overwrites drift.
> To add an app: append provider+application entries AND the provider to the
> outpost's cumulative `providers:` list (full-replacement semantics), plus the
> per-app k8s manifests. Full recipe in `security/authentik/SETUP-GUIDE.md`.

---

## What's done

- kcal-assistant v0.1 → v0.5.1: full feature set above, CI-driven releases, backups.
- Authentik resurrected from 10 stacked latent bugs (never booted in 313 days):
  orphaned HelmRepository sources, dependsOn namespaces, StorageClass name, dead
  chart pin, broken secret injection, wrong Kustomization namespace, missing
  sops-age, postgres perms, ingress service name, Helm timeout. flux-local CI is
  green again; local-path storage healed.
- kcal /ui auth cut from Cloudflare Access to Authentik (CF Access app deleted).
- Defense in depth: forward-auth + server email check + NetworkPolicy + /mcp split.

## What's left (all optional / follow-ups)

- **Personal Authentik user** (email philiprutberg00@gmail.com): Philip creates
  it in the UI (Directory → Users), then a one-line PR updates
  `AUTHENTIK_ALLOWED_EMAIL` in kcal's deployment.yaml; optionally bind
  applications to an only-Philip group policy via blueprint.
- **trilium SSO** (skipped 2026-07-09) — if resurrected, pre-check desktop/
  mobile sync clients first (exempt /etapi + sync paths), and clean up its
  stale ingress-with-auth.yaml/ingress.yaml.backup in the same PR.
- **Grafana OIDC** — blocked on resurrecting the observability stack first
  (Grafana isn't deployed; orphaned `observability/prometheus` Kustomization).
- **kcal get_week UX / preview_meal** and other product ideas as they come up.
- **Move Authentik off the pinned 2025.12.4** (Renovate PR #257): only after
  blueprints have soaked; take a postgres pg_dump first (no migration
  downgrades — the dump IS the rollback), re-check worker probe overrides
  against upstream changes.

## Known minor issues

- ~~authentik-worker probe flap~~ **FIXED 2026-07-09 (PR #375):** `ak
  healthcheck` exceeded the chart-default 3s exec-probe timeout and liveness
  was killing the healthy worker (had escalated to CrashLoopBackOff);
  timeoutSeconds now 15 via HelmRelease worker probe overrides.
- Pre-existing unrelated drift: a red `observability/prometheus` Kustomization
  points at a repo path that doesn't exist (observability is disabled).
- If a future ingress-nginx upgrade tightens `annotations-risk-level`, snippet
  annotations (auth-snippet) break ALL forward-auth apps at once — browser-test
  kcal /ui after any ingress-nginx bump.

## Operational notes / gotchas learned

- Always **browser-test auth flows** — curl only follows one redirect hop and hid
  the loop, the "Not Found", the `0.0.0.0:9000`, and the Cloudflare Access conflict.
- `flux-local` green ≠ working — live reconcile revealed half the Authentik bugs.
  Run `uvx --python 3.12 flux-local==7.11.0 test --enable-helm --all-namespaces
  --path kubernetes/flux/cluster` locally before pushing.
- flux-local rendering is occasionally flaky (transient 2-failed); re-run to confirm.
- After a `Recreate` rollout, nginx/ingress endpoints take ~10-30s to settle before
  verifying.
- SOPS decrypt needs `SOPS_AGE_KEY_FILE=age.key`.
- The git PAT lacks `workflow` scope; pushing `.github/workflows/**` needs
  `env -u GITHUB_TOKEN git -c "credential.helper=!gh auth git-credential" push`.
