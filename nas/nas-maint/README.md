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
