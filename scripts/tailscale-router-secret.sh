#!/usr/bin/env bash
# Write the homelab-k8s router's login credential into
# kubernetes/apps/network/tailscale/app/secret.sops.yaml, SOPS-encrypted, without
# the value ever landing in a terminal, a chat or git in plain text.
#
# Usage (secret on the clipboard, straight from the admin console):
#   pbpaste | scripts/tailscale-router-secret.sh
#
# Accepts either an OAuth client secret (tskey-client-…, the intended input:
# non-expiring, containerboot mints its own tagged auth key from it) or a plain
# auth key (tskey-auth-…, the old 90-day way). "?ephemeral=false" is appended
# to an OAuth secret so the node keeps its identity across restarts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/kubernetes/apps/network/tailscale/app/secret.sops.yaml"
export SOPS_AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-$ROOT/age.key}"

secret="$(tr -d '[:space:]')"
case "$secret" in
  tskey-client-*) [[ "$secret" == *\?* ]] || secret="${secret}?ephemeral=false" ;;
  tskey-auth-*)   ;;
  *) echo "input does not look like a Tailscale OAuth client secret or auth key" >&2; exit 1 ;;
esac

printf '%s\n' \
  '# yaml-language-server: $schema=https://kubernetesjsonschema.dev/v1.18.1-standalone-strict/secret-v1.json' \
  'apiVersion: v1' 'kind: Secret' 'metadata:' '  name: tailscale-auth' 'stringData:' \
  "  TS_AUTHKEY: ${secret}" \
  | sops --encrypt --input-type yaml --output-type yaml --filename-override "$OUT" /dev/stdin > "$OUT"

echo "wrote $OUT ($(grep -c 'ENC\[' "$OUT") encrypted value(s), kind=${secret%%-*}-${secret#tskey-})" | cut -c1-80
