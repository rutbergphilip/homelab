# arr-stack — Ugreen NAS

Compose project `arr-stack` (UGOS Docker → Project): Sonarr, Radarr, Prowlarr, Seerr.
Created 2026-09-07 from the UGOS exports of the previous hand-made containers so
names, ports, mounts and env are identical — only `/config` moved to the SSD volume
(`/volume2/nas-apps`) and image tags are pinned.

| App | Host port | Config | Notes |
|---|---|---|---|
| sonarr | 38989 | `/volume2/nas-apps/sonarr/config` | `/series`, `/torrents` |
| radarr | 37878 | `/volume2/nas-apps/radarr/config` | `/movies`, `/torrents` |
| prowlarr | 39696 | `/volume2/nas-apps/prowlarr/config` | outbound proxy = `torrent-vpn-gluetun:8888` |
| seerr | 35055 | `/volume2/nas-apps/seerr` → `/app/config` | talks to `jellyfin:8096` |

Cluster ingresses: `kubernetes/apps/home-automation/arr-stack/`. Download client
for all three arr apps: `192.168.50.254:38080` (nas/torrent-vpn).

Hardlink imports: Sonarr/Radarr mount one `/data` root (TRaSH layout), see below.
The legacy `/series`, `/movies`, `/torrents` binds were removed on 2026-09-11.

## Deployed 2026-09-07

Project created on UGOS after the SSD move. Seerr is pinned to **v3.4.1**, not the
3.2.0 the old container's image label claimed: its SQLite DB already carried the
3.3/3.4 migrations (`user_settings.discordIds`, `AddIgnoreQuotaToMediaRequest`), so
3.2.0 failed every Jellyfin sync with `no such column: User__settings.discordId`.
Never pin Seerr below the schema level of its DB.

## /data hardlink layout (2026-09-07)

Sonarr and Radarr mount `/volume1/homelab/streaming` as **`/data`** (media + torrents on
one bind mount = one filesystem), so completed-download imports are hardlinks instead of
copies. Applied without moving a single file:

- root folders `/data/media/series` and `/data/media/movies` (old `/series`, `/movies` removed);
  every series/movie/collection repointed with `moveFiles: false`;
- remote path mapping on the qBittorrent client: host `192.168.50.254`, `/torrents/` →
  `/data/torrents/` (qBittorrent itself still mounts `/torrents`; nothing changed there);
- Seerr's Sonarr/Radarr `activeDirectory` updated to the new roots (its API rejects the
  read-only `id` field — strip it before PUT);
- Prowlarr's dead "Lidarr" application deleted; Lidarr and Plex cluster proxies removed.

The legacy `/series`, `/movies`, `/torrents` mounts were dropped on 2026-09-11 after
Radarr's three imports since 09-07 all landed under `/data/media/movies` (Sonarr had no
imports in that window; its root folder and path mapping are identical). "Use Hardlinks"
was already on.

## Recyclarr (2026-09-11)

`recyclarr` (in this compose) syncs the TRaSH guides into Sonarr and Radarr daily at
05:00: quality definitions, the `WEB-1080p` (Sonarr) and `HD Bluray + WEB` (Radarr)
quality profiles and their custom formats with scores. First run (2026-09-11 19:57) was
**additive**: Radarr +40 custom formats + "HD Bluray + WEB", Sonarr +37 + "WEB-1080p", 14
quality-definition sizes each; no existing profile touched, nothing re-assigned. Moving series
and movies onto the new profiles is a manual choice in each arr UI (Series → Mass Edit).
Config: generated template configs on the NAS, see `recyclarr/README.md`. Run by hand:
Container → recyclarr → Terminal → `recyclarr sync`. The container runs as root because
UGOS denies uid 1000 on the `nas-apps` share (kernel-level share permissions).

## Notifications (2026-09-11)

Sonarr and Radarr post health issues / restored, imports and manual-interaction events
to a Home Assistant webhook, which forwards them to Philip's iPhone
(`.claude/ha-alerts.yaml` mirrors the HA side). Seerr does the same for request
available / failed / pending-approval.
