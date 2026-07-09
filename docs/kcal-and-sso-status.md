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

**Status: LIVE and protecting kcal `/ui`.** Login verified end-to-end.

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

> **Robustness gap:** the Authentik provider / application / outpost config for
> kcal was created via the API and lives ONLY in the postgres DB (PVC-persistent),
> NOT in git. It survives restarts and normal deploys. If the DB is ever lost,
> recreate: proxy provider `kcal` (mode forward_single, external_host
> `https://kcal.rutberg.dev`, authz flow default-provider-authorization-implicit-consent,
> invalidation default-provider-invalidation-flow), application slug `kcal`,
> assign to the embedded outpost, and set the outpost `authentik_host` +
> `authentik_host_browser` to `https://auth.rutberg.dev`. The GitOps-correct
> fix is to capture this as Authentik **blueprints** in git (see "What's left").

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

- **Authentik config as blueprints in git** — closes the "config only in DB" gap;
  makes the kcal provider/app/outpost reproducible via GitOps.
- **Personal Authentik user** instead of `akadmin` (then update `AUTHENTIK_ALLOWED_EMAIL`);
  optionally bind the kcal Application to an only-Philip policy.
- **Expand SSO** to other home-automation apps (each needs its own Authentik proxy
  provider + application + a local /outpost path, same pattern as kcal). Grafana
  OIDC (its `[auth.generic_oauth]` block + re-enable).
- **kcal get_week UX / preview_meal** and other product ideas as they come up.
- **Move Authentik off the pinned 2025.12.4** when convenient (Renovate PRs exist).

## Known minor issues

- `authentik-worker` readiness probe flaps (0/1) due to the pid-file startup-probe
  timing; the worker is functionally healthy (processes tasks, `ak healthcheck`
  passes) and nothing routes to it via a Service, so it's cosmetic.
- Pre-existing unrelated drift: a red `observability/prometheus` Kustomization
  points at a repo path that doesn't exist (observability is disabled).

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
