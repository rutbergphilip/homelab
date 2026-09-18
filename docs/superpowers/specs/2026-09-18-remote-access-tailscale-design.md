# Remote access to the homelab (Tailscale) — design

**Date:** 2026-09-18
**Status:** approved by Philip in advance ("full permission, as autonomous as possible"); built the same day.

## Goal

From anywhere outside the home network, Philip and Claude Code (running on
Philip's laptop) can reach the whole homelab the same way they do at home:

- the NAS web UI (UGOS, `https://192.168.50.254:9443`) and a NAS shell (SSH),
- the Kubernetes API (`192.168.50.20:6443`, unchanged `kubeconfig`) and the
  Talos API on each node (`192.168.50.10-12:50000`, unchanged `talosconfig`),
- every LAN-only service (Pi-hole, internal ingress, HA, UGOS, printers) at its
  LAN address, and every `*.rutberg.dev` name resolving exactly as on the LAN.

Non-goals: exposing anything new to the public internet; replacing the
Cloudflare tunnel for the web apps that already ride it; giving third parties
access.

## Decision

**Tailscale subnet routers, two of them, on the existing personal tailnet
(`tail710e04.ts.net`, free plan).** WireGuard end-to-end, no port forwarding, no
dynamic DNS, no new account, zero monthly cost. The alternatives were weighed and
rejected:

| Option | Why not |
|---|---|
| Cloudflare WARP + Zero Trust private network | Traffic terminates at Cloudflare (not end-to-end); the tunnel token in git has only DNS/tunnel scope, Zero Trust setup needs a payment method on file. |
| Plain WireGuard (wg-easy) on the NAS | Needs a router port-forward + dynamic DNS, and a second set of client configs to manage. |
| Headscale (self-hosted control plane) | Control plane would live *inside* the thing it gives access to; ops burden for a one-person tailnet. |
| Tailscale Kubernetes operator | Heavier than needed: one subnet route is a 60-line HelmRelease. |

### Components

1. **`homelab-k8s`** — pod in namespace `network`
   (`kubernetes/apps/network/tailscale/`, app-template HelmRelease, Flux).
   Userspace networking (no NET_ADMIN, no tun, runs as `nobody`, read-only
   rootfs). Node state in the Secret `tailscale-state` (RBAC in `rbac.yaml`)
   so the pod can move between nodes without changing identity. Auth key in
   `secret.sops.yaml` (`tailscale-auth`, key `TS_AUTHKEY`; reusable, tagged,
   90-day). Health via containerboot's `/healthz` on :9002.
2. **`homelab-nas`** — UGOS Docker project (`nas/tailscale/compose.yaml`).
   Kernel mode (host network, NET_ADMIN, `/dev/net/tun` — the same profile
   gluetun already runs with). State on `/volume2/nas-apps/tailscale/state`.
   Single-use auth key pasted only into the NAS copy of the compose file.
   `TS_ACCEPT_DNS=false` because UGOS owns `/etc/resolv.conf`.
3. **Tailnet policy** (`docs/tailscale-policy.hujson`, mirror of the admin
   console): `tag:subnet-router` owned by admins; `autoApprovers` enables
   `192.168.50.0/24` for that tag so a redeployed router never waits for a
   click; grants = `autogroup:member → *` (Philip's devices reach everything,
   tagged routers initiate nothing); Tailscale SSH rule kept as default
   (own devices, check mode); tests pin the four ports that matter.
4. **Split DNS**: `rutberg.dev → 192.168.50.24` (Pi-hole) for tailnet clients.
   Abroad, `home.rutberg.dev` therefore resolves to the LAN ingress
   (192.168.50.23) through the tunnel, exactly as at home; Pi-hole forwards
   the zone to k8s-gateway as it already does. Public names keep working
   (Pi-hole recurses upstream).
5. **NAS shell**: UGOS's own SSH service (Control Panel → Terminal), reachable
   only on the LAN and thus only through the tailnet from outside. UGOS SSH
   authenticates with the UGOS user password; add a key with `ssh-copy-id`
   from the laptop once.

Both routers advertise the same prefix; Tailscale marks one primary and fails
over within seconds when it disappears. That is the point of having two: when
the cluster is broken, the NAS router still carries kubectl/talosctl to fix it,
and vice versa.

### Client side

- **MacBook**: Tailscale app already installed and logged in; accepts routes
  and MagicDNS by default (`tailscale debug prefs`: RouteAll + CorpDNS true).
  Nothing to change. `kubeconfig`/`talosconfig` unchanged.
- **iPhone**: node `iphone172` has been offline 241 days → reinstall the
  Tailscale app and sign in with Google. Subnet routes are accepted by default
  on iOS.
- **Claude Code**: runs on the MacBook, so it inherits all of the above; the
  Chrome extension too.

### Security notes

- Return traffic from LAN hosts is SNAT'd by the router (default), so a LAN
  host sees the router's address (node IP or NAS IP), not the 100.x address.
  Consequence: HA's `trusted_networks` passwordless login applies to tailnet
  clients as well. Acceptable on a single-user tailnet where every device is
  Philip's; revisit if a second user is ever added (posture/tag the LAN grant).
- The tailnet also contains two cloud VMs (`supabase`, `pathfolio-prod`).
  `autogroup:member` includes them, so they *could* reach the LAN through the
  routers. Recommended follow-up for Philip: remove `pathfolio-prod` (offline
  203 days) and tag `supabase` (tagged nodes are excluded from the grant).
- The API access token used for setup lives in `.claude/tailscale-api-token`
  (gitignored), expires 2026-12-17, can be revoked at Settings → Keys.
- The reusable k8s auth key is only ever stored SOPS-encrypted. The NAS key is
  single-use and expires after one day.

### Verification

1. `kubectl -n network get pod -l app.kubernetes.io/name=tailscale` → Running,
   `tailscale status` on the Mac lists `homelab-k8s` and `homelab-nas` with
   `192.168.50.0/24` (admin console: Machines → both show the route enabled).
2. From the phone on mobile data with Tailscale on: `https://192.168.50.254:9443`
   loads UGOS; `https://home.rutberg.dev` loads HA.
3. From the laptop tethered to the phone: `kubectl get nodes`,
   `talosctl -n 192.168.50.10 version`, `ssh <user>@192.168.50.254`,
   `dig home.rutberg.dev` → 192.168.50.23.
4. Stop the NAS project → step 3 still works (k8s router takes over); scale the
   k8s deployment to 0 → step 3 still works via the NAS router.
