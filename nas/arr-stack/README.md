# arr-stack — Ugreen NAS

Compose project `arr-stack` (UGOS Docker → Project): Sonarr, Radarr, Prowlarr, Seerr.
Created 2026-09-07 from the UGOS exports of the previous hand-made containers so
names, ports, mounts and env are identical — only `/config` moved to the SSD volume
(`/volume2/nas-apps`) and image tags are pinned.

| App | Host port | Config | Notes |
|---|---|---|---|
| sonarr | 38989 | `/volume2/nas-apps/sonarr/config` | `/data` (TRaSH layout) |
| radarr | 37878 | `/volume2/nas-apps/radarr/config` | `/data` (TRaSH layout) |
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

## Incident 2026-09-18: UGOS ACL rewrite locked the arrs out of `/config`

At 13:49:11 on 2026-09-18 a folder was created in UGOS *Files* (`nas-apps/tailscale`,
for the Tailscale router). UGOS took that as a cue to (re)apply its own ACL layer —
kernel module `ugacl_vfs`, CLI `ugacltool` — to **every** file in the `nas-apps` share
(ctime of all 70k entries = 13:49:11). The entries allow only `group:admin` (gid 10) and
`user:rutbergphilip` (uid 1001); POSIX `777` stops mattering once a file carries a UG ACL.

Effect: containers running as uid 1000 / **gid 1000** (Sonarr, Radarr, Prowlarr, Unpackerr)
lost access to their own config. Radarr/Sonarr APIs answered `500 unable to open database
file`, Prowlarr `500 Access to /config/config.xml is denied`, Seerr showed "Unable to
connect to Radarr, Sonarr" and marked new requests Failed. Root containers (Jellyfin,
qBittorrent, recyclarr) were unaffected; Seerr runs with gid 10 and mostly worked (its
Jellyfin sync failed on `anime-list.xml` and no log file was created after midnight).
The arr processes themselves never died — `docker logs` shows nothing, the evidence is
in the arr API bodies and `ugacltool get <file>`.

Fix: `scripts/nas-apps-restore-acl.sh` adds `user:poweruser:allow` (uid 1000 = the file
owner) on the four app trees over SSH; idempotent, no sudo, no restart needed — SQLite
reopens the DB on the next request. Rule of thumb: create folders under `nas-apps` with
`mkdir` over SSH, not in UGOS Files, and if Files was used, run the script afterwards.

Restarting these containers without `docker` (poweruser has no socket access): the arr
processes and Seerr's `node dist/index.js` run as uid 1000 = poweruser, so `kill -TERM
<pid>` over SSH works — s6 (arrs) or Docker's `restart: always` (Seerr) bring them back
in seconds. Do **not** use the arrs' `POST /api/v1/system/restart` in these LinuxServer
images: it re-execs Prowlarr with `/restart` as an orphan that keeps the port while s6
respawns its own copy every 5 s ("Failed to bind to address … 9696"); the cure was to
kill the orphan. Also cleaned that day: Prowlarr's `logs.db` had been corrupt since
2026-09-14 (nightly `TrimLogDatabase` error) — moved aside and recreated on restart.

## Notifications (2026-09-11)

Sonarr and Radarr post health issues / restored, imports and manual-interaction events
to a Home Assistant webhook, which forwards them to Philip's iPhone
(`.claude/ha-alerts.yaml` mirrors the HA side). Seerr does the same for request
available / failed / pending-approval.

## arr-autoimport (2026-09-13)

`arr-autoimport` (in this compose, image `rutbergphilip/arr-autoimport`) polls the
Sonarr/Radarr queues every 2 min and finishes imports the arrs refuse on their own:
downloads in `importBlocked` with "release was matched to series by ID. Automatic
import is not possible" (Radarr: "Movie title mismatch"). That is every Swedish show
kept under an English TVDB title — "Noll stjärnor med Erik och Lotta" is
`Zero Stars Sweden` (tvdb 461570, no aliases); the grab works because Superbits tags
releases with IMDb ids, the import then stalls, and Seerr/Jellyfin never see it. The
service runs the arr's own manual-import preview and imports only files that map to
the expected title with no rejections; everything else is logged and left. Keys come
from read-only `config.xml` mounts. Details: `nas/arr-autoimport/README.md`.

Per-show upstream fix (needs a TheTVDB login): add the Swedish title as an alias on
thetvdb.com; Sonarr picks aliases up on its next series refresh. `Taskmaster (SE)`
already carries the `Bast I Test` mapping, which is why it searches fine today.

## Quality profiles + Unpackerr size cap (2026-09-17)

Seerr's default profile in both arrs is **Highest Possible** (id 7). After a Fallout request
came back with 1 of 8 episodes, it was rebuilt (in the arr UIs, not in git):

- **Sonarr:** one quality group per resolution (720p / 1080p / 2160p), upgrades off. Inside a
  group custom formats rank releases: `Season Pack` +1000, `Source: Remux` +300, `Bluray` +200,
  `WEB-DL` +100, `WEBRip` +50, Repack/Proper +5..7. Media Management → Propers and Repacks =
  *Do not prefer*. Reason: Sonarr sorts by quality, then revision, then format score — with
  Blu-ray ranked above WEB, a single stray Blu-ray episode was grabbed first and every season
  pack was then skipped as overlapping.
- **Radarr:** ladder unchanged (already highest-first); BR-DISK, Raw-HD, CAM, TELESYNC,
  TELECINE, WORKPRINT, DVDSCR, REGIONAL and Unknown are disabled — disc images cannot be
  imported, and with upgrades off a cinema rip would be final.
- **Unpackerr** 0.16 rejects archives whose extracted size passes a per-app cap (Sonarr 20GB,
  Radarr 75GB): `extraction failed: extracted size exceeds maximum bytes`. 4K Blu-ray
  episodes are 25–30GB. `UN_*_MAX_BYTES: 150GB` in the compose file.
