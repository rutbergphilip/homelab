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

Known debt (see spec 2026-09-04): Sonarr/Radarr mount `/series|/movies` and
`/torrents` separately → hardlinks across them fail (EXDEV) and imports copy.
Fix = one `/data` mount (TRaSH layout) + "Use Hardlinks" — not done yet.

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

The legacy `/series`, `/movies`, `/torrents` mounts are still in the compose so nothing
can dangle; drop them after a couple of successful imports. "Use Hardlinks" was already on.
