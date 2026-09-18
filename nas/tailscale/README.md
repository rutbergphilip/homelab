# tailscale — second LAN subnet router, on the Ugreen NAS

Half of the remote-access setup described in
`docs/superpowers/specs/2026-09-18-remote-access-tailscale-design.md`. The other
half is the `homelab-k8s` pod in `kubernetes/apps/network/tailscale/`.

| | |
|---|---|
| Where | UGOS Pro Docker → Project `tailscale` (192.168.50.254) |
| Node name | `homelab-nas` (tag `tag:subnet-router`) |
| Advertises | `192.168.50.0/24` (auto-approved by the tailnet policy) |
| Mode | kernel (host network, NET_ADMIN, `/dev/net/tun`) |
| State | `/volume2/nas-apps/tailscale/state` |
| Logs | `docker logs tailscale` via the UGOS container view |

## Deploy

1. Generate a **single-use**, **pre-authorized** auth key tagged
   `tag:subnet-router` (Tailscale admin console → Settings → Keys, or
   `POST /api/v2/tailnet/-/keys` with the API token in `.claude/tailscale-api-token`).
   One day of validity is plenty — the key is consumed at first start.
2. Create the folder `nas-apps/tailscale/state` in Files first — UGOS refuses to
   deploy a project whose bind-mount source does not exist yet
   (`Volumes parameter configuration error: NAS path not found`).
3. UGOS → Docker → Project → Create, name `tailscale`, folder `nas-apps/tailscale`,
   paste `compose.yaml`, replace `REPLACE_ME` with the key in the UGOS editor
   (the repo copy keeps the placeholder — same rule as `torrent-vpn`). Deployed
   this way on 2026-09-18: the key was substituted on the laptop and pasted via the
   clipboard, so it never appeared in a terminal or in git.
4. Deploy. First log lines to expect: `Starting tailscaled`,
   `AuthLoop: state is Running`, and no `ip_forward` warning. The node appears
   under Machines as `homelab-nas` with the subnet route already enabled.
5. Optional but recommended: disable key expiry on the machine
   (Machines → homelab-nas → … → Disable key expiry). Tagged nodes do not
   expire by default, so this is belt and braces.

## Verify

From a device on the tailnet that is *not* on the home Wi-Fi (phone on 4G):

```bash
tailscale status            # homelab-nas and homelab-k8s listed, one of them "primary" for 192.168.50.0/24
ping 192.168.50.254         # NAS
curl -sk https://192.168.50.254:9443/ -o /dev/null -w '%{http_code}\n'   # UGOS UI → 200/30x
ssh rutbergphilip@192.168.50.254   # UGOS SSH (Control Panel → Terminal)
kubectl get nodes           # kubeconfig unchanged: 192.168.50.20:6443 rides the tunnel
```

## Failover test (passed 2026-09-18)

`kubectl -n network scale deploy tailscale --replicas=0` → within ~10 s
`tailscale status --json` on the Mac showed `homelab-nas` with
`PrimaryRoutes: [192.168.50.0/24]`, `tailscale ping 192.168.50.20` answered
"pong from homelab-nas", and `dig @100.100.100.100 home.rutberg.dev` still returned
192.168.50.23 (MagicDNS → Pi-hole through the NAS router). Scaling back to 1
brought `homelab-k8s` online again.

## Rollback

Stop the project. The `homelab-k8s` router keeps advertising the route, so
nothing else changes. Deleting the state directory forgets the node identity;
the machine entry in the admin console then has to be removed by hand.
