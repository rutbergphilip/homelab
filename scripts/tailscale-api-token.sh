#!/usr/bin/env bash
# Print a fresh (1-hour) Tailscale API access token, minted from the OAuth client
# in .claude/tailscale-oauth.env. Nothing long-lived to rotate: the OAuth client
# secret never expires, and every token this prints dies on its own.
#
#   T=$(scripts/tailscale-api-token.sh)
#   curl -s -u "$T:" https://api.tailscale.com/api/v2/tailnet/-/devices
#
# .claude/tailscale-oauth.env (gitignored) holds two lines:
#   TS_OAUTH_CLIENT_ID=...
#   TS_OAUTH_CLIENT_SECRET=tskey-client-...
# Created 2026-09-18 in the admin console (Settings → Trust credentials) with the
# scopes devices:core (write), auth_keys (write, tag:subnet-router), dns (read),
# policy_file (read). Policy/DNS writes are deliberately left to a human.
set -euo pipefail
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.claude/tailscale-oauth.env"
[[ -r "$ENV_FILE" ]] || { echo "missing $ENV_FILE" >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"
: "${TS_OAUTH_CLIENT_ID:?}" "${TS_OAUTH_CLIENT_SECRET:?}"
curl -sf -d "client_id=${TS_OAUTH_CLIENT_ID}" -d "client_secret=${TS_OAUTH_CLIENT_SECRET}" \
  https://api.tailscale.com/api/v2/oauth/token | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])'
