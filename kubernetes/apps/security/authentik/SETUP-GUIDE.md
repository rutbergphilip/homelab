# Authentik Setup & Forward-Auth Guide

Authentik provides SSO for homelab apps at `https://auth.rutberg.dev` (namespace
`security`). Protected apps use **nginx forward-auth against the embedded
outpost** with a per-app "single-application" pattern (proven on
kcal.rutberg.dev — see `kubernetes/apps/home-automation/kcal-assistant/`).

> **Source of truth:** Authentik providers/applications/outpost-assignments are
> managed as **blueprints in git** (`app/blueprints/forward-auth.yaml`), mounted
> via the chart's `blueprints.configMaps`. Do NOT create or edit these objects
> in the UI/API — the blueprint re-applies (~hourly and on file change) and
> overwrites drift. Users, passwords and tokens stay in the DB (UI-managed).

## Architecture

- **Chart:** goauthentik `authentik` (pinned in `app/helmrelease.yaml`).
  Secrets are injected via `global.env` with `valueFrom.secretKeyRef` — the
  chart does NOT support `valueFrom` under `authentik.*` (it flattens to
  literal strings).
- **Postgres/Redis:** raw manifests (`app/postgres.yaml`, `app/redis.yaml`) on
  `local-path-provisioner`; postgres runs as uid 70.
- **Secrets:** `app/secrets.sops.yaml` (SOPS + Age). Keys: `secret-key`,
  `postgres-password`, `redis-password`, `bootstrap-password` (akadmin login),
  `bootstrap-token` (API token — split from the password on purpose).
- **Admin login:** `akadmin` + the `bootstrap-password` value
  (`SOPS_AGE_KEY_FILE=age.key sops -d app/secrets.sops.yaml`).
- **Worker probes:** `ak healthcheck` is slow; probe timeouts are raised in the
  HelmRelease `worker:` block. Don't remove those overrides.

## The single-application forward-auth pattern

The entire auth handshake runs on the app's own host, so the session cookie
and the auth check share one origin (cross-subdomain cookies loop — learned
the hard way). Per protected app there are TWO halves:

### 1. Authentik half — blueprint entries (git)

Append to `app/blueprints/forward-auth.yaml`, in one commit:

- `authentik_providers_proxy.proxyprovider` — identifiers `{name: <app>}`;
  attrs: `mode: forward_single`, `external_host: https://<host>`,
  authorization flow `default-provider-authorization-implicit-consent` and
  invalidation flow `default-provider-invalidation-flow` via `!Find`.
- `authentik_core.application` — identifiers `{slug: <app>}`,
  `provider: !KeyOf <app>-provider`.
- **Append `!KeyOf <app>-provider` to the embedded outpost's `providers:`
  list.** That list (and the outpost `config:` dict) is a FULL REPLACEMENT on
  every apply — dropping an entry unassigns it live.

Verify after merge: Admin UI → Customization → Blueprints → the instance must
show **Successful**. A duplicate provider/app in the UI means an identifier
mismatch — fix the identifiers and delete the duplicate.

### 2. Kubernetes half — per-app manifests (mirror kcal-assistant)

- `authentik-embedded-outpost` **ExternalName Service** →
  `authentik-server.security.svc.cluster.local:80` (namespace-scoped — one per
  namespace that hosts protected apps; exists in `home-automation`).
- **Outpost ingress** (no auth annotations): path `/outpost.goauthentik.io`
  (Prefix) on the app's host → `authentik-embedded-outpost:80`, with
  `nginx.ingress.kubernetes.io/upstream-vhost: "<host>"`.
- **Auth annotations on the app's ingress:**

  ```yaml
  nginx.ingress.kubernetes.io/auth-url: "http://authentik-server.security.svc.cluster.local/outpost.goauthentik.io/auth/nginx"
  nginx.ingress.kubernetes.io/auth-signin: "https://<host>/outpost.goauthentik.io/start?rd=$scheme://$host$request_uri"
  nginx.ingress.kubernetes.io/auth-response-headers: "Set-Cookie,X-authentik-username,X-authentik-groups,X-authentik-email,X-authentik-name,X-authentik-uid"
  nginx.ingress.kubernetes.io/auth-snippet: |
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  ```

- **CiliumNetworkPolicy** (defense in depth, only for real in-cluster pods):
  allow ingress only from external-ingress-nginx + host/remote-node entities,
  so in-cluster pods can't bypass nginx and forge `X-authentik-*` headers.
  Skip for NAS-backed Services (no pod to select) and for pihole (its Service
  is the LAN DNS LoadBalancer — a policy there breaks home DNS).

### Verification (every rollout)

1. `flux-local test --enable-helm --all-namespaces --path kubernetes/flux/cluster`
2. `curl -sI https://<host>/` → 302 to `/outpost.goauthentik.io/start?...`
3. The start URL → 302 toward `auth.rutberg.dev` (a 404 here = provider not
   assigned to the outpost).
4. **Browser test in a fresh private window** — full login round-trip. curl
   follows one hop and has hidden every real auth bug so far (redirect loop,
   `0.0.0.0:9000`, Cloudflare Access conflict).
5. Regression: kcal.rutberg.dev/ui still logs in.

## Disaster recovery

If the Authentik DB is lost: redeploy via Flux, log in as akadmin
(bootstrap-password), and the mounted blueprint recreates all providers/
applications/outpost config automatically. Recreate personal users manually.

Database backup:
```bash
kubectl exec -n security authentik-postgresql-0 -- pg_dump -U authentik authentik > authentik-backup.sql
```
Take a dump BEFORE any chart major-version upgrade — authentik does not
support migration downgrades; the dump is the rollback.

## Troubleshooting

- **502 on auth URLs:** check `authentik-server` pods and nginx ingress logs.
- **Redirect loop:** almost always a host mismatch — the session cookie must be
  set on the SAME host the auth check runs for (that's why the whole handshake
  lives on the app's host). Check the provider's `external_host` and the
  outpost's `authentik_host`/`authentik_host_browser` (`https://auth.rutberg.dev`).
- **"Not Found" from the outpost:** provider not assigned to the embedded
  outpost (check the blueprint's outpost `providers:` list).
- **Blueprint not applying:** worker logs
  (`kubectl logs -n security deploy/authentik-worker | grep -i blueprint`) and
  the Blueprints page. A file error fails atomically — live state is safe but
  new changes are blocked until fixed.
