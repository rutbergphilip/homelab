# nas-backup — nightly snapshots of the app-config SSD

`/volume2/nas-apps` (Jellyfin DB + metadata, arr configs, qBittorrent state, Seerr,
Recyclarr…) lives on a single M.2 with no redundancy. This project copies it every
night at 04:00 to `/volume1/nas-apps-backup/daily/<YYYY-MM-DD>` on the RAID 5 volume.

- **Hardlinked snapshots** (`rsync --link-dest`): every day is a full browsable tree,
  unchanged files share blocks with the previous day, 7 days are kept.
- **Excluded**: caches, logs, transcodes, arr `MediaCover`. Everything needed to
  rebuild a container from scratch is included (Jellyfin `data/`, arr `*.db` +
  `config.xml`, qBittorrent `BT_backup/` fastresume + torrents, Seerr `db/` + settings).
- **Jellyfin app backups**: HA runs `POST /Backup/Create` at 02:30; the zips in
  `jellyfin/configurations/data/backups` are part of the snapshot, and the live copies
  older than 7 days are pruned by `backup.sh`.
- **Monitoring**: the script writes `daily/nas_backup.prom` (last-ok timestamp,
  duration, size) for the node-exporter textfile collector in `nas/nas-metrics`;
  Prometheus alerts `NasBackupStale` when the timestamp is older than 36 h.

Consistency note: SQLite files are copied live. The 04:00 slot is idle time and Jellyfin
checkpoints its WAL every 6 h ("Optimize database" task), and the 02:30 application
backup is the consistent copy for Jellyfin. For the arrs and qBittorrent, a live copy
of a WAL-mode SQLite DB plus its `-wal` file restores cleanly in practice.

## Operate

- Run now: UGOS Docker → Container → `nas-backup` → Terminal → `/backup.sh`.
- Restore a file: browse `/volume1/nas-apps-backup/daily/<date>/...` in UGOS Files and
  copy it back (stop the owning container first).
- The script on the NAS is `/volume2/nas-apps/nas-backup/backup.sh`; after editing it
  in git, paste the new content there (nas-maint Terminal, heredoc) — the container
  mounts it read-only, no redeploy needed.
