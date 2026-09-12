# nas-maint — maintenance shell on the Ugreen NAS

Idle Alpine container with the app-config shares mounted (`/nas-apps` = Volume 2
SSD, `/nas-apps-backup`). UGOS has
no SSH, so this plus the container **Terminal** tab (Add → `/bin/sh`) is how files,
ownership and SQLite DBs on the NAS get inspected (`apk add sqlite` works).

Keep the project **stopped** when not in use: while running it holds the mounted
shared folders open, which blocks renaming or moving them. Wheel-scrolling the UGOS
container list does not work — filter with the Search box instead.

## Hardlink dedup of media vs torrents (`dedup-media.py`, 2026-09-12)

Until 2026-09-07 Sonarr/Radarr saw `/torrents` and `/media` as different mounts, so
every import was a copy: media 5.3 TB + torrents 4.9 TB with only 4 hardlinked files.
`dedup-media.py` replaces each single-link media file with a hardlink to its torrent
twin (same size, exactly one candidate, first+last 32 MiB identical; link to a temp
name, then rename over the original). Paths, names and content stay identical, so
Jellyfin/Sonarr/Radarr/qBittorrent notice nothing.

Run from this container's Terminal (root; `apk add --no-cache python3`); copy the
script to `/nas-apps/nas-backup/` first (the repo is not mounted):

```sh
python3 /nas-apps/nas-backup/dedup-media.py            # dry run, prints WOULD LINK
nohup python3 /nas-apps/nas-backup/dedup-media.py --apply > /nas-apps/nas-backup/dedup-apply.log 2>&1 &
```

Result 2026-09-12: dry run 1666 files / 4.58 TB linkable, 1307 no-match (torrent
gone), 685 ambiguous (all `.rNN`/`.rar`/`.sfv` parts — see below), 0 mismatches, 28 min
(head/tail reads on the RAID). `--apply` the same afternoon: 1666 linked, 4.58 TB freed, 0 errors, 22 min; /volume1 free
4.70 → 9.28 TB (Prometheus `node_filesystem_avail_bytes`), Jellyfin/Sonarr/Radarr/qBittorrent
all healthy afterwards.

### RAR release junk inside the media library

The library also holds 62.8 GB of unextracted release archives (1569 `.rar`/`.rNN`
files in 75 folders: 8 movies, 67 series folders), copied in before the arr stack
existed. Where the folder also has the extracted `.mkv`, the parts are pure waste.
`series/Macken/Del.1–6 + Extras` (18 GB) are rar-only — nothing playable there until
extracted. Jellyfin ignores archives, so none of this shows in the UI.

Verified 2026-09-12 (rar volume sizes sum to the extracted video within 0.2 % in 64 of
the folders; the six `Macken/Del.N` sets do NOT match the loose `Del N.mkv` files —
those rars hold a different 1080p encode that was never extracted). Deleting the 64
redundant sets (~45 GB) needs a human-approved command in the nas-maint Terminal;
the classifier blocks bulk `rm` from Claude:

```sh
# 1) list candidate folders (release dirs whose rar parts sum to the video next to them)
find /streaming/media -name '*.rar' | sed 's#/[^/]*$##' | sort -u | grep -vE '/(Subs|Extras)$' > /tmp/rardirs
while IFS= read -r d; do sum=$(stat -c %s "$d"/*.rar "$d"/*.r[0-9][0-9] 2>/dev/null | awk '{s+=$1} END {print s+0}'); best=$(find "$d" "$(dirname "$d")" -maxdepth 1 -type f \( -iname '*.mkv' -o -iname '*.mp4' -o -iname '*.avi' \) -exec stat -c %s {} + 2>/dev/null | awk -v s="$sum" 'BEGIN{b=9} {r=($1-s)/s; if(r<0)r=-r; if(r<b)b=r} END{print b}'); awk -v b="$best" -v d="$d" 'BEGIN{ print (b < 0.002 ? "OK " : "SKIP ") d }'; done < /tmp/rardirs > /tmp/rarplan; grep -c ^OK /tmp/rarplan; grep ^SKIP /tmp/rarplan
# 2) delete the parts in the OK folders only
grep ^OK /tmp/rarplan | sed 's/^OK //' | while IFS= read -r d; do find "$d" -maxdepth 1 -type f \( -name '*.rar' -o -name '*.r[0-9][0-9]' -o -name '*.sfv' \) -exec rm -f {} +; done
```

`Macken`: either extract the rars over the small files (`apk add unrar` is not in Alpine;
use a desktop unrar via SMB) or delete `Del.1–6` + `Extras` (18 GB) if the loose files
are good enough.

## Rar-packed releases: Unpackerr (2026-09-12)

The root cause of both the media-library rar junk and the "manual import required"
phone spam was that nothing extracted rar releases: Sonarr/Radarr only saw the sample
`.mkv` inside such torrents and parked them in the queue forever (re-alerting on every
arr restart, e.g. after the UGOS update). `unpackerr` now runs in `nas/arr-stack`; API
keys live in `/volume2/nas-apps/unpackerr/unpackerr.env` (mode 600, env_file). The
first run queued seven Sonarr items (Gustafsson 3 tr S01+S02, BoJack S05, four Family
Guy singles) and a Radarr one (Sommaren med Göran).

Cleared by hand the same day, from this shell with the arr APIs (`curl` + `jq`, keys
read out of each `config.xml`, never echoed):

- Trazan Apansson S01 — the eight `.mp4` were already in the library and in Sonarr;
  the queue row was stale → `DELETE /api/v3/queue/bulk?removeFromClient=false&blocklist=false`.
- Radarr "Movie title mismatch" ×3 — Swedish releases for movies Radarr lists under
  their English titles (Sommaren med Göran = *A Midsummer of Love*, Hur många lingon… =
  *The Importance of Tying Your Own Shoes*, Hur många kramar… = *It's All About Friends*)
  → `POST /api/v3/command {"name":"ManualImport","importMode":"auto",files:[…movieId…]}`
  with the items from `GET /api/v3/manualimport?downloadId=…`. Note: Radarr's queue
  hides unmapped rows unless `includeUnknownMovieItems=true`.
- Vacation (2015) and The Killer (2023) are not in Radarr any more (orphaned torrents)
  → removed from the queue only; the torrents keep seeding in `/torrents/movies`.
- Macken (Sonarr series 9): the six loose `Del N.mkv` were the *sample clips*; the real
  episodes sat in `Del.N/*.rar`. Extracted with `bsdtar -xf` (libarchive-tools handles
  the multi-volume RAR3; its "Truncated RAR file data" warning is harmless — sizes
  verified against `bsdtar -tvf`), imported via `manualimport` with explicit
  `episodeIds` (Sonarr parsed "Del.N" as nothing), quality fixed with
  `PUT /api/v3/episodefile/editor` (Bluray-1080p), then `RenameFiles` moved them to
  `Season 1/Macken - S01E0N - <title> Bluray-1080p.mkv`. Extras rar → `Macken/extras/`.
  Samples + rar folders moved to `/volume1/homelab/streaming/_trash-2026-09-12/`
  (bulk `rm` is classifier-blocked for Claude; delete that folder in Files).
