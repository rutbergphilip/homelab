# nas-apps → dedicated SSD volume (Ugreen NAS)

**Date:** 2026-09-07 · **Requested by Philip** ("do the SSD volume move for
nas-apps, but keep a backup") · executed autonomously up to the step UGOS gates
behind the account password.

## Before

- M.2 (465 GB WD) = read-only SSD cache (300 GB) of Volume 1 (RAID 5, 3×7.2 TB, ext4).
- `nas-apps` shared folder (8.3 GB: jellyfin 4.7 G, plex 2.3 G, radarr, seerr,
  sonarr, prowlarr, torrent-vpn, …) on Volume 1 with a 100 GB quota.
- Apps: projects `jellyfin`, `torrent-vpn`; hand-made containers `sonarr`,
  `radarr`, `prowlarr`, `seerr` (configs exported to JSON via UGOS "Export →
  Container Configuration", stored in nas-apps root / jellyfin/cache).

## Plan

1. Backup: `cp -a /volume1/nas-apps/. /volume1/nas-apps-backup/nas-apps-2026-09-07-pre-ssd-move/`
   with **all apps stopped** (helper project `nas-maint`, Alpine + both shares).
2. Storage: remove SSD Cache 1 (read-only → nothing to flush) → Create Storage
   Pool 2 (Basic, M.2) → Volume 2 (ext4, 450 GB). **Needs poweruser password.**
3. Control Panel → Shared Folder → `nas-apps` → move to Volume 2 (UGOS "Move
   Folders to Other Volume"). Path becomes `/volume2/nas-apps`.
4. Repoint: `nas/torrent-vpn` + `nas/jellyfin` compose (done in git, paste on
   UGOS), new project `nas/arr-stack` replaces the four hand-made containers
   (delete them first — same container names).
5. Start all, verify each port + Seerr↔Jellyfin + Sonarr/Radarr↔qBittorrent.
6. Keep the backup until Philip confirms; `nas-maint` stays stopped afterwards.

## Rollback

Move the shared folder back to Volume 1 (or restore from the backup folder),
revert the three compose files to `/volume1/nas-apps`, redeploy.

## Status 2026-09-07 (autonomous run)

- Step 1 **done**: backup `nas-apps-backup/nas-apps-2026-09-07-pre-ssd-move` —
  8.3 GB, 71 850 entries on both sides (`find | wc -l`), `COPY-DONE 10:51 UTC`.
- Step 2 **half done**: SSD Cache 1 removed; Create Storage Pool wizard (M.2,
  Basic, ext4, 450.5 GB) reached the *Password validation* dialog for
  `poweruser`. Not entered (credential) — **Philip enters it**, then steps 3–6.
- Apps restarted on Volume 1 meanwhile (Jellyfin, torrent-vpn, sonarr, radarr,
  prowlarr, seerr all answering) so nothing is down while waiting. `nas-maint`
  is still running and must be stopped before the share move (it holds
  `/volume1/nas-apps` open).

## Done 2026-09-07 (after Philip entered the password)

UGOS has no "move shared folder to another volume" action (not in Files, not in
Storage), so the move was: rename share `nas-apps` → **`nas-apps-v1`** (stays on
Volume 1 as a second, untouched copy), create a new share `nas-apps` on **Volume 2**
(ext4, 442 GB), copy with `cp -a` from `nas-maint` (excluding `#recycle`; 8.2 GB,
71 847 entries both sides, ~2 min). Then torrent-vpn and jellyfin redeployed with
`/volume2/nas-apps` paths, the four hand-made containers deleted and project
`arr-stack` created. All six ports + public hosts answer; Sonarr/Radarr still use
qBittorrent at 192.168.50.254:38080 with clean health; Prowlarr syncs all apps.
Seerr had to go to v3.4.1 (DB schema was already 3.4 — see nas/arr-stack/README.md).
New share permission: rutbergphilip has Read & Write (old share had Access denied).

Backups to keep until Philip confirms: `/volume1/nas-apps-v1` (original) and
`/volume1/nas-apps-backup/nas-apps-2026-09-07-pre-ssd-move` (cp -a with apps stopped).
Rollback = point the three compose files back at `/volume1/nas-apps-v1` and redeploy.
