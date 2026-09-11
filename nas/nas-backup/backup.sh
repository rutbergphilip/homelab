#!/bin/sh
# nas/nas-backup/backup.sh — nightly hardlinked snapshot of /volume2/nas-apps (single
# M.2, no redundancy) onto the RAID volume. Runs inside the nas-backup container
# (alpine + rsync) from crond at 04:00; can be run by hand from the container Terminal.
#
#   /src  = /volume2/nas-apps            (read-only)
#   /dst  = /volume1/nas-apps-backup     (snapshots in /dst/daily/YYYY-MM-DD)
#
# Each day is a full tree, but unchanged files are hardlinks to the previous day
# (--link-dest), so 7 days cost about 1x the data plus the daily deltas.
# The live copy on the NAS is /volume2/nas-apps/nas-backup/backup.sh (mirrored here).
set -eu

SRC=/src
DST=/dst/daily
KEEP_DAYS=7
TODAY=$(date +%F)
START=$(date +%s)

mkdir -p "$DST"
PREV=$(ls -1d "$DST"/20??-??-?? 2>/dev/null | grep -v "$DST/$TODAY" | sort | tail -n 1 || true)
LINK=""
[ -n "$PREV" ] && LINK="--link-dest=$PREV"

echo "[$(date '+%F %T')] snapshot $TODAY (link-dest: ${PREV:-none})"
set +e
rsync -a --delete --numeric-ids $LINK \
  --exclude='/#recycle/' \
  --exclude='/jellyfin/cache/' \
  --exclude='/jellyfin/configurations/cache/' \
  --exclude='/jellyfin/configurations/log/' \
  --exclude='/jellyfin/configurations/data/transcodes/' \
  --exclude='/*/config/logs/' \
  --exclude='/*/config/MediaCover/' \
  --exclude='/*/config/*.txt' \
  --exclude='/seerr/logs/' \
  --exclude='/torrent-vpn/qbittorrent/qBittorrent/logs/' \
  --exclude='*.log' --exclude='*.log.*' \
  --exclude='/recyclarr/logs/' \
  "$SRC/" "$DST/$TODAY.partial/"
RC=$?
set -e
# 24 = "some files vanished before they could be transferred" — harmless on a live tree.
if [ "$RC" -ne 0 ] && [ "$RC" -ne 24 ]; then
  echo "[$(date '+%F %T')] rsync failed with exit $RC" >&2
  rm -rf "$DST/$TODAY.partial"
  exit "$RC"
fi
rm -rf "$DST/$TODAY"
mv "$DST/$TODAY.partial" "$DST/$TODAY"

# Retention: keep the newest KEEP_DAYS daily snapshots.
ls -1d "$DST"/20??-??-?? | sort -r | tail -n +"$((KEEP_DAYS+1))" | while read -r old; do
  echo "[$(date '+%F %T')] pruning $old"; rm -rf "$old"
done

# Jellyfin's own application backups (HA triggers them at 02:30) pile up on the SSD;
# they are inside the snapshot above, so the live copies can be trimmed to 7 days.
JF_BACKUPS=/jellyfin-backups
if [ -d "$JF_BACKUPS" ]; then
  find "$JF_BACKUPS" -maxdepth 1 -name 'jellyfin-backup-*.zip' -mtime +7 -print -delete | sed 's/^/pruned live jellyfin backup: /'
fi

END=$(date +%s)
SIZE=$(du -sk "$DST/$TODAY" | cut -f1)
echo "[$(date '+%F %T')] done in $((END-START)) s, $((SIZE/1024)) MiB (apparent size incl. hardlinks)"

# Prometheus textfile-collector metrics (node-exporter in nas-metrics mounts /dst/daily).
TMP="$DST/nas_backup.prom.$$"
{
  echo "# HELP nas_backup_last_ok_timestamp_seconds Unix time of the last successful nas-apps snapshot."
  echo "# TYPE nas_backup_last_ok_timestamp_seconds gauge"
  echo "nas_backup_last_ok_timestamp_seconds $END"
  echo "# HELP nas_backup_last_duration_seconds Duration of the last successful snapshot."
  echo "# TYPE nas_backup_last_duration_seconds gauge"
  echo "nas_backup_last_duration_seconds $((END-START))"
  echo "# HELP nas_backup_last_size_bytes Apparent size of the last snapshot tree."
  echo "# TYPE nas_backup_last_size_bytes gauge"
  echo "nas_backup_last_size_bytes $((SIZE*1024))"
} > "$TMP"
mv "$TMP" "$DST/nas_backup.prom"
