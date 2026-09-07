# NAS torrent client: gluetun + qBittorrent (replacing binhex/arch-qbittorrentvpn)

**Date:** 2026-09-04
**Status:** implemented; cutover completed 2026-09-07 (see `nas/torrent-vpn/README.md` → Cutover log). The old container turned out to be **compromised** (auth-bypass whitelist + `curl | sh` hooks); nothing but BT_backup was migrated.

## Problem

The download client on the Ugreen NAS (UGOS Pro, 192.168.50.254) is
`binhex/arch-qbittorrentvpn:5.1.2-1-05`, configured for ProtonVPN over
**OpenVPN** with strict port forwarding and Privoxy. Observed on 2026-09-04:

- 66–68 % CPU continuously for >11 h with 0 B/s torrent traffic, 5.1 GB RSS.
- Container log shows the image's bash watchdog repeatedly "marking for
  reconfigure" the listening interface and incoming port, and NAT-PMP
  polling every cycle.
- The rest of the stack (jellyfin, prowlarr, sonarr, radarr, seerr) sits at
  ~1 % CPU.

Root cause is the image design: OpenVPN userspace crypto plus a polling
watchdog loop. It is not a misconfiguration we can tune away.

## Goal

A download client on the NAS that:

1. Routes all torrent traffic through ProtonVPN with a kill switch.
2. Gets a Proton forwarded port and keeps qBittorrent's listening port in
   sync automatically.
3. Idles near 0 % CPU.
4. Keeps Sonarr, Radarr, Prowlarr, Seerr and Jellyfin working with at most a
   port change — same host paths, same category names, same credentials.
5. Can be deployed and tested **beside** the old container. The old container
   is not stopped until Philip has tested and confirmed the new one.

Non-goals: moving the client into Kubernetes (NFS breaks hardlinks and the
arr apps live on the NAS); replacing qBittorrent.

*Correction 2026-09-07:* Privoxy **was** depended on — Prowlarr used
`qbittorrentvpn:8118` as its outbound proxy. Replaced by gluetun's built-in
HTTP proxy (`HTTPPROXY=on`, `torrent-vpn-gluetun:8888`, docker-network only).

## Current state (inventory, 2026-09-04)

| Item | Value |
|---|---|
| Image | binhex/arch-qbittorrentvpn:5.1.2-1-05 |
| Network | custom bridge `starrs`, container IP 172.18.0.6 |
| Host ports | 38080→8080 (WebUI), 38118→8118 (Privoxy) |
| Volumes | `nas-apps/qbittorrentvpn/config`→`/config`; `…/config/openvpn`→`/openvpn` (ro); `homelab/streaming/torrents`→`/torrents` |
| Env | VPN_PROV=protonvpn, VPN_CLIENT=openvpn, STRICT_PORT_FORWARD=yes, LAN_NETWORK=192.168.50.0/24,10.42.0.0/16,172.18.0.0/16, NAME_SERVERS=1.1.1.1,1.0.0.1, PUID=1000, PGID=10 |
| Sonarr download client | host 192.168.50.254, port 38080, user `admin`, category `series`, no remote path mappings |
| Cluster | `kubernetes/apps/home-automation/qbittorrent/` proxies qbittorrent.rutberg.dev → 192.168.50.254:38080 |

Radarr and Prowlarr are assumed to follow the Sonarr pattern (verified at
cutover, not assumed blindly).

## Design

### Topology

One UGOS Docker **Project** (compose) named `torrent-vpn`, on the existing
`starrs` bridge network, with two services:

- **gluetun** `qmcgaw/gluetun:v3.41.3` — owns the network namespace. ProtonVPN
  via WireGuard (`VPN_SERVICE_PROVIDER=protonvpn`, `VPN_TYPE=wireguard`),
  `VPN_PORT_FORWARDING=on`, `PORT_FORWARD_ONLY=on`, `SERVER_COUNTRIES` set to
  a nearby p2p country (start with `Sweden`; fall back to `Netherlands`).
  Publishes the WebUI host port. `cap_add: NET_ADMIN`, `/dev/net/tun`.
- **qbittorrent** `lscr.io/linuxserver/qbittorrent:5.2.3-libtorrentv1` (libtorrent 1.2: the repo's earlier cluster deployment used this variant, and libtorrent 2's mmap I/O is a known cause of multi-GB RSS like the 5.1 GB seen today) —
  `network_mode: service:gluetun`, `depends_on: gluetun: condition:
  service_healthy`. `PUID=1000`, `PGID=10`, `UMASK=002`, `WEBUI_PORT=8080`,
  `TORRENTING_PORT` left to gluetun's hook.

Kill switch is gluetun's default firewall: if the tunnel is down the
qbittorrent container has no route out at all.

### Port forwarding hook

gluetun's `VPN_PORT_FORWARDING_UP_COMMAND` posts the forwarded port to
`http://127.0.0.1:8080/api/v2/app/setPreferences` (the wiki-documented
`wget` one-liner, with `random_port=false`, `upnp=false`). This requires
qBittorrent's **"Bypass authentication for clients on localhost"** to be on;
that is set once in the WebUI during first boot. The down command resets
the listen port to 0 on the `lo` interface.

### Volumes

| Host (UGOS "Shared folder") | Container | Note |
|---|---|---|
| `nas-apps/torrent-vpn/gluetun` | `/gluetun` (gluetun) | new; servers.json cache |
| `nas-apps/torrent-vpn/qbittorrent` | `/config` (qbittorrent) | new; empty at first |
| `homelab/streaming/torrents` | `/torrents` (qbittorrent) | **identical** to today so arr paths and hardlinks are unchanged |

### Firewall / LAN reachability

`FIREWALL_OUTBOUND_SUBNETS=192.168.50.0/24,10.42.0.0/16,172.18.0.0/16` —
same three ranges the old LAN_NETWORK allowed (LAN, cluster pod CIDR,
docker bridge). None overlap Proton's WireGuard tunnel range (10.2.0.0/16),
which the gluetun wiki warns about. `DNS_KEEP_NAMESERVER=off` (gluetun's
own DoT resolver); no `DOT_PROVIDERS` override.

### Ports

- Test period: WebUI on host **38081**. Old container keeps 38080.
- Cutover: WebUI moves to **38080**. Sonarr/Radarr/Prowlarr and the cluster
  ingress then need no change.
- No torrent port is published on the host; incoming peers arrive via the
  Proton forwarded port.

### Secrets

The WireGuard private key is the only secret. It lives in
`nas-apps/torrent-vpn/.env` on the NAS as `WIREGUARD_PRIVATE_KEY=…`,
referenced from the compose file via `env_file`. Claude never sees or types
it: the project is created with `WIREGUARD_PRIVATE_KEY=REPLACE_ME` and
Philip pastes the real key in the UGOS editor. Philip generates the config
at https://account.proton.me/u/0/vpn/WireGuard with **NAT-PMP (Port
Forwarding)** enabled; any Proton server works for the key.

The WebUI `admin` password is set by Philip in the new WebUI to match the
current one, so the existing Sonarr/Radarr client entries keep working
unchanged after the port moves.

### Repo layout

```
nas/torrent-vpn/
  compose.yaml        # exactly what is pasted into the UGOS Project
  .env.example        # WIREGUARD_PRIVATE_KEY=REPLACE_ME
  README.md           # runbook: deploy, verify, cutover, rollback
```

`nas/` is a new top-level folder for NAS-hosted compose stacks (the cluster
manifests under `kubernetes/apps/home-automation/{qbittorrent,arr-stack,
jellyfin,plex}` are proxies to these). `.env` is gitignored.

## Rollout

### Phase 1 — deploy beside the old container

1. Commit `nas/torrent-vpn/` to the repo.
2. In UGOS Docker → Project → Create, name `torrent-vpn`, paste
   `compose.yaml`, create the two `nas-apps/torrent-vpn/*` folders.
3. Philip pastes the WireGuard key into the project's `.env`.
4. Start the project.

### Phase 2 — verify (Claude, read-only checks)

- gluetun log: `Wireguard is up`, public IP is a Proton address (compare with
  `wget -qO- https://ipinfo.io` from inside gluetun), `port forwarded is
  NNNNN`, and the up-command returned `Ok`.
- qbittorrent WebUI on :38081 reachable from the LAN; Options → Connection
  shows listening port = NNNNN.
- Add a Linux ISO torrent (e.g. Debian netinst via magnet); confirm it
  downloads to `/torrents` and reaches seeding with incoming peers (proof
  the forwarded port works).
- CPU of both containers at idle in UGOS Docker overview (expect <3 %).

### Phase 3 — Philip tests and confirms

Philip uses the WebUI on 38081, confirms it feels right, sets the `admin`
password to match the old one and turns on localhost auth bypass (if not
already done in phase 2 with Philip watching).

### Phase 4 — cutover (only after explicit go)

1. Stop (do **not** delete) `qbittorrentvpn` in UGOS.
2. Copy `nas-apps/qbittorrentvpn/config/qBittorrent/data/BT_backup/*` into
   `nas-apps/torrent-vpn/qbittorrent/qBittorrent/BT_backup/` so current
   seeds carry over (paths are identical, so fastresume stays valid).
3. Change the WebUI host port in the project from 38081 to 38080, restart.
4. Sonarr and Radarr: Settings → Download Clients → Test. Prowlarr: Test.
   Seerr: request one title; confirm it lands in Radarr/Sonarr → qBittorrent
   → imported → visible in Jellyfin.
5. Watch for 24 h. Then Philip decides whether to delete the old container.

### Rollback

Stop the project, start `qbittorrentvpn` again. Its config folder is never
touched (BT_backup is copied, not moved), so rollback is a single click.

## Testing

Pure-logic tests do not apply (no code). Verification is the phase-2
checklist above, executed and reported with command output before any
claim that it works.

## Open questions

None. Decisions taken: no Privoxy replacement; qBittorrent stays; NAS not
cluster; WebUI password reused so arr configs are untouched.
