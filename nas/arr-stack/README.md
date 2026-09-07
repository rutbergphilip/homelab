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
