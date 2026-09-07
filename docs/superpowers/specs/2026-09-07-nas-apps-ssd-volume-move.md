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
