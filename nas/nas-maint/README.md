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
(head/tail reads on the RAID). `--apply` run the same afternoon.

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
