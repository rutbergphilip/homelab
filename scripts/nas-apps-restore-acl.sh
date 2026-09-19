#!/usr/bin/env bash
# Restore uid-1000 access on the UGOS share /volume2/nas-apps after UGOS re-ACLs it.
#
# Background (2026-09-18 13:49): creating a folder in UGOS *Files* (nas-apps/tailscale,
# step 2 of nas/tailscale/README.md) made UGOS rewrite its own ACL layer (kernel module
# ugacl_vfs, tool `ugacltool`) on EVERY file in the share. The resulting entries allow only
# group `admin` (gid 10) and user `rutbergphilip` (uid 1001). POSIX mode bits (777) no
# longer matter. Containers running as uid 1000 / gid 1000 — Sonarr, Radarr, Prowlarr,
# Unpackerr — lost access to their own config: the arr APIs answered 500
# "unable to open database file", Seerr showed "Unable to connect to Radarr, Sonarr",
# Prowlarr 500 "Access to /config/config.xml is denied". Root containers (Jellyfin,
# qBittorrent) were unaffected; Seerr (gid 10) mostly worked.
#
# Fix: add an allow entry for `poweruser` (uid 1000, the owner of these files) on the app
# trees. Idempotent; runs over SSH as poweruser (owner → may change ACLs, no sudo needed).
# The arrs recover immediately, no restart: SQLite reopens the DB on the next request.
#
# Usage: scripts/nas-apps-restore-acl.sh [dir ...]   (default: radarr sonarr prowlarr seerr)
set -euo pipefail
NAS=${NAS:-poweruser@192.168.50.254}
DIRS=("$@"); [ ${#DIRS[@]} -eq 0 ] && DIRS=(radarr sonarr prowlarr seerr)
PATHS=(); for d in "${DIRS[@]}"; do PATHS+=("/volume2/nas-apps/$d"); done

ssh "$NAS" bash -s -- "${PATHS[@]}" <<'REMOTE'
set -u
apply() {
  p="$1"
  ugacltool get "$p" 2>/dev/null | grep -q 'user:poweruser:' && return 0
  if [ -d "$p" ]; then ugacltool add "$p" 'user:poweruser:allow:rwxpdDaARWc--:-fd-'
  else                 ugacltool add "$p" 'user:poweruser:allow:rwxpdDaARWc--:----'; fi
}
export -f apply
echo "applying to: $*"
find "$@" -print0 | xargs -0 -n1 -P6 bash -c 'apply "$0"'
missing=$(find "$@" -print0 | xargs -0 -n1 -P6 bash -c 'ugacltool get "$0" 2>/dev/null | grep -q user:poweruser: || echo x' | wc -l)
echo "entries still without the poweruser ACE: $missing"
REMOTE

echo "--- verifying arr APIs from here (expect 200 200 200)"
for p in 37878:radarr 38989:sonarr 39696:prowlarr; do
  port=${p%%:*}; app=${p##*:}
  key=$(ssh "$NAS" "grep -o '<ApiKey>[^<]*' /volume2/nas-apps/$app/config/config.xml | cut -c9-")
  v=v3; [ "$app" = prowlarr ] && v=v1
  printf '%s: ' "$app"; curl -s -m 10 -o /dev/null -w '%{http_code}\n' -H "X-Api-Key: $key" "http://192.168.50.254:$port/api/$v/system/status" || true
done
