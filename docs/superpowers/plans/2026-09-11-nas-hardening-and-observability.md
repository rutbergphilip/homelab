# NAS hardening, backups and observability — implementation plan

> **For agentic workers:** executed inline in the originating session (browser session is shared). Steps use checkbox (`- [ ]`) syntax for tracking; tick them as they land.

**Goal:** Close the risks and gaps found after the 2026-09-07 NAS work: unbacked-up SSD volume, unbounded container logs, untracked NAS image versions, un-gated admin UIs, no NAS metrics/alerts, no notifications, no release-quality profiles — plus the leftover clean-ups.

**Architecture:** NAS side stays "UGOS compose projects mirrored in `nas/<project>/compose.yaml`" (secrets inline on the NAS copy only). Cluster side stays Flux + SOPS. Notifications reuse the one channel that already exists: Home Assistant → `notify.mobile_app_philip_s_iphone`, fed by HA webhooks (Seerr/arr webhooks and Alertmanager both post to HA). Metrics: kube-prometheus-stack + Grafana (manifests already in repo, disabled since 2025-05-05) scraping a `nas-metrics` compose project (node-exporter + cAdvisor) through Service/Endpoints + ServiceMonitor.

**Tech Stack:** UGOS Docker Projects (compose), Alpine + rsync, Renovate, ingress-nginx + Authentik forward-auth (blueprints), kube-prometheus-stack 73.2.0, Grafana, Recyclarr, Jellyfin 10.11 backup API, Home Assistant automations.

**Spec:** brainstorm in session 019RnYqegpX6rHeJZptJGzvt (2026-09-10/11); items listed in `nas/README-improvements` section of this plan. No separate spec — each task is bounded.

## Global constraints

- NAS = Ugreen 192.168.50.254, UGOS, no SSH. Files are edited via UGOS Project editor (Monaco: click inside editor, cmd+a, synthetic paste) and via the `nas-maint` container Terminal. Keep `nas-maint` stopped when idle.
- Never UGOS "Restart" on `torrent-vpn` (Stop → Enable, or Redeploy).
- All app config lives on `/volume2/nas-apps` (single M.2, no redundancy). Media on `/volume1/homelab/streaming` (RAID 5).
- Secrets: never in git. Inline on the NAS copy (torrent-vpn pattern) or SOPS in the cluster.
- Authentik objects are git blueprints only; the embedded-outpost `providers` list is a full replacement — append every new provider.
- Public hosts ride the Cloudflare tunnel (`external.rutberg.dev` → cfargotunnel); LAN clients hit 192.168.50.23 via Pi-hole split DNS.
- Cluster: 3 Talos nodes, ~7–8 GiB RAM each, already 55–63 % used on two nodes. Monitoring stack must be frugal (Prometheus ≤ 1 GiB limit, 7-day retention).
- Commit after each task with `Claude-Session: https://claude.ai/code/session_019RnYqegpX6rHeJZptJGzvt`.

---

### Task 1: Renovate tracks NAS compose images without auto-merging

**Files:** Modify `.renovaterc.json5` (packageRules).

Renovate's built-in `docker-compose` manager already matches `compose.yaml`, but the repo-wide rule auto-merges minor/patch on branch. NAS deploys are manual, so a merged bump would make git lie about what runs.

- [x] Add a packageRule: `matchFileNames: ["nas/**"]` → `automerge: false`, `addLabels: ["nas/manual-deploy"]`, `semanticCommitScope: "nas"`, `commitMessageSuffix: "(manual UGOS redeploy)"`.
- [x] Add label `nas/manual-deploy` to `.github/labels.yaml`.
- [x] Commit: `chore(renovate): track nas/ compose images, never automerge`.

### Task 2: Jellyfin built-in backup task (server side)

Jellyfin 10.11 ships a Backup/Restore API (`POST /Backup/Create`, `GET /Backup`) but no schedule of its own; only Task 4's nightly rsync copies the SQLite files live. A consistent app-level backup on top is cheap.

- [x] Via ApiClient in Chrome: `GET /Backup` to confirm the feature; `POST /Backup/Create` with `{Metadata:true, Trickplay:false, Subtitles:false, Database:true}` → file lands in `/config/backups/`.
- [x] Confirm the archive exists (via `GET /Backup`). Real path: `/config/data/backups/` = `/volume2/nas-apps/jellyfin/configurations/data/backups` — Task 4's prune must use that path.
- [x] Schedule: HA automation `jellyfin_nightly_backup` (02:30) → `rest_command.jellyfin_backup` → `POST http://192.168.50.254:38096/Backup/Create`; API key `ha-backup` stored in `input_text.jellyfin_backup_api_key` (moved browser → HA webhook → helper, never through chat). Verified: two archives created. Backups stored in `/config/backups/`, pruned to 7 by a `find -mtime +7 -delete` line in Task 4's script.
- [x] Document in `nas/jellyfin/README.md`.

### Task 3: Docker log rotation on all NAS projects (+ drop arr legacy mounts)

**Files:** Modify `nas/jellyfin/compose.yaml`, `nas/arr-stack/compose.yaml`, `nas/torrent-vpn/compose.yaml`, `nas/nas-maint/compose.yaml`.

- [x] Add to every service:
  ```yaml
  logging:
    driver: json-file
    options: { max-size: "10m", max-file: "3" }
  ```
  (use a shared `x-logging: &logging` anchor per file).
- [x] arr-stack only: verify in Sonarr `GET /api/v3/history?eventType=3` (downloadFolderImported) that imports since 2026-09-07 used `/data/...` paths, then delete the three legacy binds (`/series`, `/movies`, `/torrents`) from sonarr and radarr.
- [x] Apply on UGOS (Chrome): open each Project → Edit → replace compose text → Deploy. Order: nas-maint (stopped; deploy only), arr-stack, jellyfin (only when `GET /Sessions` shows no `NowPlayingItem`), torrent-vpn last (Redeploy recreates gluetun then qBittorrent; confirm `connection_status=connected` in qBittorrent afterwards).
- [x] Verify: `docker inspect` is not available, so check UGOS Project → container → Details shows LogConfig, or simply that containers are Running and healthy (Jellyfin `/health`, arr `/ping`, qBittorrent `/api/v2/app/version`).
- [x] Commit: `chore(nas): bounded json-file logging on every project; arr-stack drops legacy mounts`.

### Task 4: Nightly snapshot of /volume2/nas-apps to the RAID volume

**Files:** Create `nas/nas-backup/compose.yaml`, `nas/nas-backup/backup.sh`, `nas/nas-backup/README.md`.

Design: Alpine container with `rsync` + `crond`, runs `backup.sh` at 04:00. Snapshots at `/volume1/nas-apps-backup/daily/YYYY-MM-DD` using `rsync -a --delete --link-dest=<previous>` (hardlinked, so 7 days ≈ 1× size + deltas). Excludes: `**/cache/**`, `**/logs/**`, `**/MediaCover/**`, `jellyfin/cache`, `torrent-vpn/qbittorrent/qBittorrent/BT_backup/*.fastresume` (kept, small — do **not** exclude, needed to restore torrents), `**/*.log*`. Retention 7 dailies + prune Jellyfin `/backups` archives older than 7 days. Script is baked into the compose via a `configs:` block? UGOS compose supports `configs.content` (compose spec 2.23+) — unknown; safer: mount `/volume2/nas-apps/nas-backup/backup.sh` created through nas-maint terminal, mirrored in git.

- [x] Write `backup.sh` (POSIX sh, `set -eu`, logs to stdout, exit non-zero on rsync error ≥ 1 except 24 "vanished files"). Ends with `wget -q -O- --post-data ... http://192.168.50.23...`? No — HA is reachable at `https://home.rutberg.dev`, token would be a secret. Instead: write `/volume1/nas-apps-backup/daily/LAST_OK` with the timestamp; Task 8's node-exporter textfile collector exports `nas_backup_last_ok_seconds` from it → alert if > 36 h.
- [x] Write `compose.yaml`: `alpine:3.22`, `command: sh -c 'apk add --no-cache rsync && exec crond -f -l 2'`, cron line via `/etc/crontabs/root` mounted from... simpler: `command: sh -c 'apk add --no-cache rsync && echo "0 4 * * * /backup.sh" > /etc/crontabs/root && exec crond -f -l 2'`. Mounts: `/volume2/nas-apps:/src:ro`, `/volume1/nas-apps-backup:/dst`, `/volume2/nas-apps/nas-backup/backup.sh:/backup.sh:ro`. `mem_limit 256m`, logging block, `restart: unless-stopped`.
- [x] Create the script on the NAS: nas-maint terminal → `mkdir -p /nas-apps/nas-backup && cat > /nas-apps/nas-backup/backup.sh <<'EOF' … EOF && chmod +x`.
- [x] Create UGOS Project `nas-backup`, deploy, run once by hand: container Terminal → `/backup.sh`; check `/volume1/nas-apps-backup/daily/<today>` exists and size is plausible (nas-apps was 8.2 GB on 2026-09-07 before Jellyfin metadata grew).
- [ ] Stop nas-maint afterwards.
- [x] Commit: `feat(nas): nightly hardlinked snapshots of nas-apps to the RAID volume`.

### Task 5: Authentik forward-auth in front of Sonarr, Radarr, Prowlarr

**Files:** Modify `kubernetes/apps/security/authentik/app/blueprints/forward-auth.yaml`; rewrite `kubernetes/apps/home-automation/arr-stack/ingress.yaml`; create `kubernetes/apps/home-automation/arr-stack/ingress-outpost.yaml`; update `kustomization.yaml`.

Seerr (`jellyseerr.rutberg.dev`) is **not** gated: it is the user-facing request app (Paul has an account) and it authenticates against Jellyfin itself. Sonarr/Radarr/Prowlarr are admin-only; Seerr and Prowlarr reach them over the `starrs` docker network, never via these hosts, so gating is safe.

- [x] Blueprint: add `sonarr-provider`/`sonarr-app`, `radarr-…`, `prowlarr-…` (copy the qbittorrent block, change name/external_host/slug/app name) and append the three providers to the embedded-outpost `providers` list.
- [x] Ingress: keep `arr-stack-ingress` for jellyseerr only; new `arr-stack-admin` Ingress with the qbittorrent auth annotations (`auth-url`, `auth-signin` uses `$host` so one Ingress can serve all three hosts: `https://$host/outpost.goauthentik.io/start?rd=$scheme://$host$request_uri`), `auth-response-headers`, `auth-snippet`; rules for sonarr/radarr/prowlarr. Note: arr apps need `proxy-body-size` unlimited? No — default 1m fine except Prowlarr indexer import; set `proxy-body-size: "50m"`.
- [x] `ingress-outpost.yaml`: one Ingress, three hosts, path `/outpost.goauthentik.io` → `authentik-embedded-outpost:80`, `upstream-vhost: $host`? The annotation is a literal string, no variables → need **one outpost Ingress per host** (3 small Ingresses in the same file), each with `upstream-vhost: <host>`.
- [x] `flux-local`/`kubectl kustomize` the dir, commit, `task reconcile`, wait ~5 min for the outpost to pick up providers, then verify in Chrome: `https://sonarr.rutberg.dev` redirects to auth.rutberg.dev, after login lands on Sonarr's own login. Check `https://jellyseerr.rutberg.dev` still loads without Authentik.
- [x] Commit: `feat(security): authentik forward-auth for sonarr/radarr/prowlarr`.

### Task 6: Recyclarr (TRaSH quality profiles) in arr-stack

**Files:** Modify `nas/arr-stack/compose.yaml`; create `nas/arr-stack/recyclarr/recyclarr.yml` (git copy; API keys via `!env_var`, values inline on the NAS copy of the compose only).

- [x] Read API keys: nas-maint terminal `grep -o '<ApiKey>[^<]*' /nas-apps/sonarr/config/config.xml /nas-apps/radarr/config/config.xml`.
- [x] `recyclarr.yml`: sonarr instance `main` → `base_url: http://sonarr:8989`, `api_key: !env_var SONARR_API_KEY`; include templates `sonarr-quality-definition-series`, `sonarr-v4-quality-profile-web-1080p`, `sonarr-v4-custom-formats-web-1080p`. radarr `main` → `http://radarr:7878`; templates `radarr-quality-definition-movie`, `radarr-quality-profile-hd-bluray-web`, `radarr-custom-formats-hd-bluray-web`. `delete_old_custom_formats: false`, `replace_existing_custom_formats: false` — additive first run, **do not** reassign existing profiles on series/movies (that stays a Philip decision).
- [x] Compose service: `ghcr.io/recyclarr/recyclarr:7.5.2`, `container_name: recyclarr`, `user: "1000:1000"`, env `TZ`, `CRON_SCHEDULE: "0 5 * * *"`, `SONARR_API_KEY`, `RADARR_API_KEY` (`REPLACE_ME` in git), volume `/volume2/nas-apps/recyclarr:/config`, `networks: [starrs]`, logging block, `mem_limit 256m`.
- [ ] Create `/nas-apps/recyclarr/recyclarr.yml` via nas-maint terminal (heredoc). Redeploy arr-stack (with keys pasted in UGOS editor). Run once: container Terminal → `recyclarr sync`; expect "Completed" for both instances. Check Sonarr → Settings → Profiles shows `WEB-1080p` and custom formats exist.
- [x] Commit: `feat(nas): recyclarr syncs TRaSH profiles into sonarr/radarr` (+ README section).

### Task 7: Move stale app-config dirs out of nas-apps (reversible)

- [x] nas-maint terminal: `mkdir -p /nas-apps-backup/trash-2026-09-11 && cd /nas-apps && du -sh jellyseerr lidarr plex janitorr unpackerr whisparr qbittorrentvpn` then `mv jellyseerr lidarr plex janitorr unpackerr whisparr qbittorrentvpn /nas-apps-backup/trash-2026-09-11/`. Only move dirs that exist and are **not** referenced by any compose file (`grep -rn` over nas/*/compose.yaml first).
- [x] Note in `nas/README.md` (or nas-maint README) that `trash-2026-09-11` can be deleted by Philip after a month. Also Task 4's excludes must skip `trash-*` (they are on `/volume1` anyway, not in the source — fine).
- [x] Stop nas-maint. Commit docs.

### Task 8: Monitoring — kube-prometheus-stack + Grafana + NAS exporters + alerts to iPhone

**Files:** Modify `kubernetes/apps/observability/kustomization.yaml` (uncomment), `kube-prometheus-stack/app/helmrelease.yaml` (alertmanager on, retention, limits, persistence); create `kubernetes/apps/observability/kube-prometheus-stack/app/nas-targets.yaml` (Service+Endpoints+ServiceMonitor for node-exporter :39100 and cAdvisor :38081... use **39100** and **39080**), `nas-alerts.yaml` (PrometheusRule), `alertmanager-config.yaml` (AlertmanagerConfig → HA webhook), `alertmanager-secret.sops.yaml` (HA long-lived token for the webhook auth header); create `nas/nas-metrics/compose.yaml`; HA automation `alertmanager_to_phone` (webhook trigger → notify).

- [x] Check storage classes (`kubectl get sc`); persist Prometheus on 10Gi via `local-path`; decide after seeing the classes, `resources.limits.memory: 1Gi`.
- [x] Alertmanager enabled, `alertmanagerSpec.resources` small; route → receiver `ha-webhook` (`webhook_configs.url: https://home.rutberg.dev/api/webhook/alertmanager-<random>`; HA webhooks are unauthenticated-by-URL so use a long random id, no header needed → no SOPS secret required). `repeat_interval: 12h`.
- [x] Grafana: enable, keep OAuth (secret exists), add dashboards `cadvisor` (gnetId 14282) under `default`. Check `grafana.rutberg.dev` ingress host in the helmrelease is still wanted.
- [ ] `nas/nas-metrics/compose.yaml`: `quay.io/prometheus/node-exporter:v1.9.1` with `--path.rootfs=/host`, `--collector.textfile.directory=/textfile`, `network_mode: host`? UGOS: use published port `39100:9100` plus mounts `/:/host:ro,rslave` and `/volume1/nas-apps-backup/daily:/textfile:ro` (Task 4 writes `nas_backup.prom` there). `gcr.io/cadvisor/cadvisor:v0.52.1` → `39080:8080`, mounts `/:/rootfs:ro`, `/var/run:/var/run:ro`, `/sys:/sys:ro`, `/var/lib/docker:/var/lib/docker:ro`, `privileged: true`, `--docker_only=true --housekeeping_interval=30s --store_container_labels=false`. Both `mem_limit 256m`, logging block.
- [x] Task 4 script also writes `nas_backup.prom` (`nas_backup_last_ok_timestamp_seconds <epoch>`, `nas_backup_last_size_bytes`, `nas_backup_last_duration_seconds`) atomically (`tmp` + `mv`).
- [x] PrometheusRule `nas-alerts`: `NasNodeExporterDown` (up==0 5m), `NasRootFsFull` (>85 %), `NasVolume2Full` (>85 %, mountpoint /volume2), `NasBackupStale` (`time()-nas_backup_last_ok_timestamp_seconds > 36*3600`), `NasContainerNearMemLimit` (container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.9 for 10m), `NasContainerRestarting`? cAdvisor has no restart counter → skip. `JellyfinDown` via blackbox? Skip; `up` on cAdvisor container count instead: `absent(container_last_seen{name="jellyfin"})`.
- [x] HA automation: trigger `webhook` id `alertmanager-<same random>`, action `notify.mobile_app_philip_s_iphone` with title `{{ trigger.json.status | upper }}: {{ trigger.json.commonLabels.alertname }}` and message from `commonAnnotations.summary`. Add via `POST /api/config/automation/config/alertmanager_to_phone`, then `check_config`, reload automations. Mirror in `.claude/ha-alerts.yaml`.
- [ ] Deploy: UGOS project `nas-metrics` → verify `curl 192.168.50.254:39100/metrics` from the Mac; commit cluster files, `task reconcile`, wait for pods, check `up{job=~"nas-.*"}==1` in Prometheus, fire a test alert (`amtool`? not installed → temporarily lower a threshold? no: use Alertmanager API `POST /api/v2/alerts` via `kubectl port-forward`) and confirm the phone notification.
- [x] Commit: `feat(observability): enable kube-prometheus-stack + grafana; NAS exporters + alerts to iPhone`.

### Task 9: Seerr and arr notifications → iPhone via HA

- [ ] Seerr: read API key from `/nas-apps/seerr/settings.json` (`main.apiKey`) in nas-maint. `POST https://jellyseerr.rutberg.dev/api/v1/settings/notifications/webhook` (header `X-Api-Key`) with `{enabled:true, types: <MEDIA_AVAILABLE|MEDIA_FAILED|MEDIA_PENDING bitmask>, options:{webhookUrl:"https://home.rutberg.dev/api/webhook/seerr-<random>", jsonPayload: <template with subject/message/image>}}`. Test with `POST …/webhook/test`.
- [x] Sonarr/Radarr: `POST /api/v3/notification` with `implementation: Webhook`, fields `url: https://home.rutberg.dev/api/webhook/arr-<random>`, `method: 1 (POST)`, events `onHealthIssue`, `onHealthRestored`, `onDownload` (import), `onManualInteractionRequired`, `includeHealthWarnings: true`. Same webhook id for both; HA template branches on `trigger.json.eventType`.
- [x] HA automations `seerr_to_phone`, `arr_to_phone` (webhook triggers, local-only=false since Seerr posts from the NAS via the public hostname — actually the NAS resolves home.rutberg.dev via Pi-hole → LAN ingress, so `local_only: true` is fine if the NAS uses Pi-hole; verify with a test, fall back to false).
- [ ] Mirror in `.claude/ha-alerts.yaml`; document in `nas/arr-stack/README.md`. Commit docs.

### Task 10: Remote streaming path — investigate and recommend

- [ ] Confirm `jellyfin.rutberg.dev` public path = Cloudflare tunnel (dnsendpoint targets cfargotunnel.com). Check Cloudflare cache behaviour on `/Videos/*/stream*` (response headers `cf-cache-status`) from a non-LAN vantage (use the Mac on Tailscale? still LAN DNS). Use `curl --resolve jellyfin.rutberg.dev:443:<cf edge ip>`.
- [ ] Check whether Tailscale exists anywhere (NAS app, cluster subnet router): `tailscale status` on the Mac lists peers.
- [ ] Report: keep tunnel for the web UI/metadata; recommend the phone/TV clients outside the LAN use a Tailscale route to `192.168.50.254:38096` (or the LAN ingress via Tailscale subnet router + split DNS) if a NAS Tailscale node exists; otherwise present the two options for Philip. **No change applied autonomously.**

### Task 11: Items that need Philip at the keyboard (do last, one browser tab each)

- [ ] ASUS router 192.168.50.1 → LAN → DHCP Server → DNS Server 1 = 192.168.50.24, DNS Server 2 empty; Apply. (Ask Philip to log in, then drive.)
- [ ] Cloudflare dashboard → rutberg.dev → SSL/TLS → Edge Certificates → Encrypted ClientHello → Off. (Ask Philip to log in.)
- [ ] UGOS Files → Recycle Bin of `nas-apps-backup` and `nas-apps-v1` → Empty; then delete the empty `nas-apps-v1` share (Control Panel → Shared Folder). Permanent — confirm in chat before clicking.
- [ ] Open Subtitles login: Philip only (credentials).
- [ ] Jellyfin OSD back button in Zen: ask Philip to re-test after the CSS fix.

### Task 12: qBittorrent seeds forever (Philip, 2026-09-11)

- [ ] From the `torrent-vpn-qbittorrent` container Terminal (localhost auth bypass, no password needed): `curl -s -X POST http://127.0.0.1:8080/api/v2/app/setPreferences --data-urlencode 'json={"max_ratio_enabled":false,"max_seeding_time_enabled":false,"max_inactive_seeding_time_enabled":false,"max_ratio_act":0}'`.
- [ ] Per-torrent overrides back to "use global": `curl -s -X POST http://127.0.0.1:8080/api/v2/torrents/setShareLimits -d 'hashes=all&ratioLimit=-2&seedingTimeLimit=-2&inactiveSeedingTimeLimit=-2'`; resume anything paused/stopped by a hit limit: `torrents/start?hashes=all` (5.x) — only torrents in state `stoppedUP`.
- [ ] Verify: `app/preferences` shows the three flags false; `torrents/info?filter=stopped` shows none that stopped because of ratio (state `stoppedUP`).
- [ ] Document in `nas/torrent-vpn/README.md`.

### Task 13: single-point media removal (Philip, 2026-09-11)

Design: the arrs are the pivot. Deleting a movie/series in **Radarr/Sonarr** (or in Seerr's
Manage → "Remove from Radarr/Sonarr", which calls the same arr delete) fires a `MovieDelete` /
`SeriesDelete` / `EpisodeFileDelete` webhook. A tiny service `media-janitor` on the NAS,
running inside gluetun's network namespace (so it can use qBittorrent's localhost auth
bypass — no password anywhere), receives the webhook and: removes the matching torrent(s)
**with files** from qBittorrent (match by release/scene name and file size), deletes the
media record + requests in Seerr (`DELETE /api/v1/media/{id}` by tmdb/tvdb id), and lets
Jellyfin's real-time library monitoring drop the item (files are gone). Radarr/Sonarr add
an import exclusion so the title is not re-grabbed. Jellyfin is explicitly NOT a deletion
point (a file deleted there would just be re-downloaded by the arr).

**Files:** Create `nas/media-janitor/janitor.py`, `nas/media-janitor/README.md`; modify
`nas/torrent-vpn/compose.yaml` (new service `media-janitor`, `network_mode: service:gluetun`,
gluetun `FIREWALL_INPUT_PORTS: 9797`); arr webhook connections (API).

- [ ] `janitor.py` (python:3.12-alpine, stdlib only): HTTP server :9797, `POST /arr` handles eventTypes `MovieDelete`, `SeriesDelete`, `EpisodeFileDelete` (reason manual only), `Test`; `GET /healthz`. Reads API keys at runtime from ro mounts of `radarr/config/config.xml`, `sonarr/config/config.xml`, `seerr/settings.json`. Idempotent; logs one line per action.
- [ ] Torrent matching: `torrents/info` → candidates where `name == sceneName` OR any file in `torrents/files` has `size == movieFile.size` and basename matches `relativePath`/`originalFilePath` basename. Delete via `torrents/delete?deleteFiles=true`. Season packs: one match removes the pack (documented).
- [ ] Seerr: `GET /api/v1/media?take=100&filter=all` pages → match `tmdbId` (movies) / `tvdbId` (series) → `DELETE /api/v1/media/{id}`.
- [ ] Register webhooks: Radarr + Sonarr `POST /api/v3/notification` implementation `Webhook`, url `http://torrent-vpn-gluetun:9797/arr`, events `onMovieDelete`/`onSeriesDelete`/`onEpisodeFileDelete`; test with the "Test" button (eventType Test → 200).
- [ ] End-to-end test on a throwaway title (a small movie added + downloaded once, then removed via Seerr Manage → Remove): torrent gone from qBittorrent, Seerr media gone, Jellyfin entry gone within a minute.
- [ ] Docs + commit.

## Progress log

- 2026-09-11: plan written. Execution order 1 → 2 → 3 → 4 → 7 → 6 → 5 → 8 → 9 → 10 → 11.
- 2026-09-11 evening: Task 1 + 2 done.
- 2026-09-11 later: Tasks 3, 4 (first snapshot 629 s / 15 GB), 5 (gating verified 302 → outpost, Sonarr loads after Authentik), 7 done. Task 6: recyclarr container deployed, first `recyclarr sync` still to run. Task 8: stack live, NAS targets discovered (down until nas-metrics is created on UGOS), test alert reached the phone. Task 9: arr webhooks registered + tested; Seerr webhook pending (needs Seerr API key from the NAS shell). Task 13: code written + stub-tested; NAS deploy pending (torrent-vpn compose edit). Side find: HA `automations.yaml`/`scripts.yaml`/`scenes.yaml`/`secrets.yaml` + 2 theme files were mode 0000 on the NFS PVC — HA could not edit or reload automations (Errno 13); fixed with chmod 644 (mirror: `.claude/ha-jellyfin-backup.yaml`).
