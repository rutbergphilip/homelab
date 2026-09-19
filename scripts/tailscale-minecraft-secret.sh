#!/usr/bin/env bash
# One-shot activation of the Minecraft server's Tailscale node, for sharing
# with friends. Run once with a PERSONAL auth key on the clipboard:
#
#   Admin console → Settings → Keys → Generate auth key
#     Reusable: off   Ephemeral: off   Tags: NONE (tagged nodes cannot be shared)
#   then:
#   pbpaste | scripts/tailscale-minecraft-secret.sh
#
# What it does, in order (each step is idempotent, re-run freely):
#   1. SOPS-encrypts the key into kubernetes/apps/default/crafty/tailscale-auth.sops.yaml
#      and adds it to the kustomization; commits and pushes; Flux applies it and
#      reloader restarts the crafty pod so the sidecar logs in.
#   2. Waits for a device named "minecraft" to appear in the tailnet (API).
#   3. Disables key expiry on it (devices:core write), so the login never lapses.
#   4. Writes mc.rutberg.dev as an UNPROXIED public A record to the node's
#      100.x address (external-dns DNSEndpoint), commits and pushes.
# The auth key itself is single-use: once the node exists its identity lives in
# the tailscale-minecraft-state Secret and the key is never needed again.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/kubernetes/apps/default/crafty"
export SOPS_AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-$ROOT/age.key}"

key="$(tr -d '[:space:]')"
[[ "$key" == tskey-auth-* ]] || { echo "input does not look like a Tailscale auth key (tskey-auth-…)" >&2; exit 1; }

# ---- 1. secret ------------------------------------------------------------
printf '%s\n' \
  '# yaml-language-server: $schema=https://kubernetesjsonschema.dev/v1.18.1-standalone-strict/secret-v1.json' \
  'apiVersion: v1' 'kind: Secret' 'metadata:' '  name: tailscale-minecraft-auth' '  namespace: default' 'stringData:' \
  "  TS_AUTHKEY: ${key}" \
  | sops --encrypt --input-type yaml --output-type yaml --filename-override "$APP/tailscale-auth.sops.yaml" /dev/stdin > "$APP/tailscale-auth.sops.yaml"
grep -q "tailscale-auth.sops.yaml" "$APP/kustomization.yaml" || \
  sed -i '' 's|^resources:$|resources:\n  - ./tailscale-auth.sops.yaml|' "$APP/kustomization.yaml"
( cd "$ROOT" && git add "$APP/tailscale-auth.sops.yaml" "$APP/kustomization.yaml" \
  && git commit -q -m "feat(crafty): tailscale login key for the minecraft node" \
  && git push -q origin main && flux reconcile source git flux-system --timeout=2m >/dev/null \
  && flux reconcile kustomization cluster-apps --timeout=3m >/dev/null )
echo "1/4 key applied; waiting for the pod to restart and the node to register"

# ---- 2. wait for the device -------------------------------------------------
T="$("$ROOT/scripts/tailscale-api-token.sh")"
dev=""
for _ in $(seq 1 60); do
  dev="$(curl -sf -u "$T:" "https://api.tailscale.com/api/v2/tailnet/-/devices" \
    | python3 -c 'import sys,json;[print(d["nodeId"],d["addresses"][0]) for d in json.load(sys.stdin)["devices"] if d["hostname"]=="minecraft"]' | head -1 || true)"
  [[ -n "$dev" ]] && break
  sleep 10
done
[[ -n "$dev" ]] || { echo "node 'minecraft' never appeared — check: kubectl -n default logs deploy/crafty -c tailscale" >&2; exit 1; }
node_id="${dev%% *}"; node_ip="${dev##* }"
echo "2/4 node registered: $node_id at $node_ip"

# ---- 3. never expire ---------------------------------------------------------
curl -sf -u "$T:" -X POST -H 'Content-Type: application/json' \
  -d '{"keyExpiryDisabled": true}' "https://api.tailscale.com/api/v2/device/$node_id/key" >/dev/null
echo "3/4 key expiry disabled"

# ---- 4. public DNS -----------------------------------------------------------
cat > "$APP/dnsendpoint.yaml" <<YAML
# mc.rutberg.dev on the PUBLIC internet resolves to the Minecraft node's
# tailnet address. That only routes for people the node has been shared with;
# for everyone else it is an unroutable CGNAT address. On the LAN and on
# Philip's own tailnet, split DNS wins and the same name resolves to
# 192.168.50.25 (k8s-gateway, from the annotation on the game Service).
# Written by scripts/tailscale-minecraft-secret.sh — regenerate, do not edit.
apiVersion: externaldns.k8s.io/v1alpha1
kind: DNSEndpoint
metadata:
  name: minecraft-tailnet
  namespace: default
spec:
  endpoints:
    - dnsName: "mc.rutberg.dev"
      recordType: A
      recordTTL: 300
      targets: ["$node_ip"]
      providerSpecific:
        # Must stay DNS-only: Cloudflare cannot proxy raw TCP, and the
        # controller runs with --cloudflare-proxied as the default.
        - name: external-dns.alpha.kubernetes.io/cloudflare-proxied
          value: "false"
YAML
grep -q "dnsendpoint.yaml" "$APP/kustomization.yaml" || \
  sed -i '' 's|^resources:$|resources:\n  - ./dnsendpoint.yaml|' "$APP/kustomization.yaml"
( cd "$ROOT" && git add "$APP/dnsendpoint.yaml" "$APP/kustomization.yaml" \
  && git commit -q -m "feat(crafty): mc.rutberg.dev public A record -> minecraft tailnet node ($node_ip)" \
  && git push -q origin main && flux reconcile source git flux-system --timeout=2m >/dev/null \
  && flux reconcile kustomization cluster-apps --timeout=3m >/dev/null )
echo "4/4 mc.rutberg.dev -> $node_ip (public, DNS-only). Now share the node:"
echo "    admin console → Machines → minecraft → Share → send each friend the link."
echo "    They install Tailscale, accept, and join mc.rutberg.dev in Minecraft."
echo "    Remember the policy grant for autogroup:shared (docs/tailscale-policy.hujson)."
