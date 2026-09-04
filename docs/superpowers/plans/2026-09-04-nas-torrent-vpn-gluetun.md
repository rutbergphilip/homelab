# NAS torrent-vpn (gluetun + qBittorrent) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a gluetun (ProtonVPN WireGuard, port-forwarded) + qBittorrent compose project on the Ugreen NAS beside the old binhex container, verified end to end, ready for Philip's test and a later cutover.

**Architecture:** Two services in one UGOS Docker Project. gluetun owns the network namespace and firewall; qBittorrent runs inside it (`network_mode: service:gluetun`) so it has no route to the internet except the tunnel. gluetun's port-forwarding up-command pushes Proton's forwarded port into qBittorrent over the local WebUI API.

**Tech Stack:** Docker Compose on UGOS Pro, qmcgaw/gluetun v3.41.3, lscr.io/linuxserver/qbittorrent 5.2.3-libtorrentv1, ProtonVPN WireGuard with NAT-PMP.

**Spec:** `docs/superpowers/specs/2026-09-04-nas-torrent-vpn-gluetun-design.md`

## Global Constraints

- Old container `qbittorrentvpn` is **never stopped, edited or deleted** in this plan. Cutover is a separate, Philip-gated step (spec Phase 4) and is NOT part of this plan.
- New WebUI host port is **38081** (38080 stays with the old container).
- Volumes: `/volume1/nas-apps/torrent-vpn/gluetun` → `/gluetun`, `/volume1/nas-apps/torrent-vpn/qbittorrent` → `/config`, `/volume1/homelab/streaming/torrents` → `/torrents` (same host path as the old container).
- `PUID=1000`, `PGID=10`, `UMASK=002`, `TZ=Europe/Stockholm`.
- Network: existing bridge `starrs` (external).
- `FIREWALL_OUTBOUND_SUBNETS=192.168.50.0/24,10.42.0.0/16,172.18.0.0/16`.
- Secret: `WIREGUARD_PRIVATE_KEY` is pasted by Philip only. Claude never reads, types or commits it. Repo holds `.env.example` with `REPLACE_ME`; `nas/**/.env` is gitignored (already in `.gitignore`).
- No Privoxy / HTTP proxy.
- Browser rules: no clicking Delete/Forced Close on any container; if a login screen appears, stop and wait for Philip.

---

## File structure

```
nas/torrent-vpn/
  compose.yaml       # the exact text pasted into the UGOS Project editor
  .env.example       # WIREGUARD_PRIVATE_KEY=REPLACE_ME
  README.md          # runbook: deploy, verify, cutover, rollback (mirrors spec Rollout)
```

---

### Task 1: Compose stack files in the repo

**Files:**
- Create: `nas/torrent-vpn/compose.yaml`
- Create: `nas/torrent-vpn/.env.example`
- Create: `nas/torrent-vpn/README.md`

**Interfaces:**
- Produces: `compose.yaml` text that Task 2 pastes verbatim into UGOS. Service names `gluetun` and `qbittorrent`; container names `torrent-vpn-gluetun` and `torrent-vpn-qbittorrent` (Tasks 3–4 search for these names in UGOS).

- [x] **Step 1: Write compose.yaml**

```yaml
# nas/torrent-vpn/compose.yaml
# Deployed as UGOS Docker "Project" torrent-vpn on the Ugreen NAS (192.168.50.254).
# Spec: docs/superpowers/specs/2026-09-04-nas-torrent-vpn-gluetun-design.md
name: torrent-vpn

services:
  gluetun:
    image: qmcgaw/gluetun:v3.41.3
    container_name: torrent-vpn-gluetun
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    networks:
      - starrs
    ports:
      # qBittorrent WebUI. 38081 during the side-by-side test; 38080 after cutover.
      - "38081:8080"
    env_file:
      - .env # WIREGUARD_PRIVATE_KEY only — pasted on the NAS, never in git
    environment:
      TZ: Europe/Stockholm
      VPN_SERVICE_PROVIDER: protonvpn
      VPN_TYPE: wireguard
      SERVER_COUNTRIES: Sweden
      PORT_FORWARD_ONLY: "on"
      VPN_PORT_FORWARDING: "on"
      # Push Proton's forwarded port into qBittorrent (needs "Bypass authentication
      # for clients on localhost" enabled in qBittorrent WebUI options).
      VPN_PORT_FORWARDING_UP_COMMAND: >-
        /bin/sh -c 'wget -O- -nv --retry-connrefused --post-data "json={\"listen_port\":{{PORT}},\"current_network_interface\":\"{{VPN_INTERFACE}}\",\"random_port\":false,\"upnp\":false}" http://127.0.0.1:8080/api/v2/app/setPreferences'
      VPN_PORT_FORWARDING_DOWN_COMMAND: >-
        /bin/sh -c 'wget -O- -nv --retry-connrefused --post-data "json={\"listen_port\":0,\"current_network_interface\":\"lo\"}" http://127.0.0.1:8080/api/v2/app/setPreferences'
      # LAN, cluster pod CIDR, docker bridge — same as the old LAN_NETWORK.
      FIREWALL_OUTBOUND_SUBNETS: 192.168.50.0/24,10.42.0.0/16,172.18.0.0/16
      UPDATER_PERIOD: 24h
      HEALTH_VPN_DURATION_INITIAL: 30s
    volumes:
      - /volume1/nas-apps/torrent-vpn/gluetun:/gluetun
    restart: unless-stopped

  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:5.2.3-libtorrentv1
    container_name: torrent-vpn-qbittorrent
    network_mode: service:gluetun
    depends_on:
      gluetun:
        condition: service_healthy
    environment:
      TZ: Europe/Stockholm
      PUID: "1000"
      PGID: "10"
      UMASK: "002"
      WEBUI_PORT: "8080"
    volumes:
      - /volume1/nas-apps/torrent-vpn/qbittorrent:/config
      - /volume1/homelab/streaming/torrents:/torrents
    restart: unless-stopped

networks:
  starrs:
    external: true
```

- [x] **Step 2: Write .env.example**

```
# Copy to .env on the NAS (same folder as compose.yaml) and paste the PrivateKey
# from a ProtonVPN WireGuard config generated with "NAT-PMP (Port Forwarding)" on:
# https://account.proton.me/u/0/vpn/WireGuard
WIREGUARD_PRIVATE_KEY=REPLACE_ME
```

- [x] **Step 3: Write README.md** — a runbook with these sections, copied from the spec's Rollout: Deploy (UGOS Project create, paste compose, paste key into .env), Verify (gluetun log lines, `wget -qO- https://ipinfo.io/ip` in gluetun terminal, WebUI :38081, listen port matches, Debian ISO seeds), Cutover (stop old, copy BT_backup, port 38081→38080, test Sonarr/Radarr/Prowlarr/Seerr), Rollback (stop project, start old container). Include the note that libtorrentv1 was chosen for RAM stability and that the old container's data lives in `nas-apps/qbittorrentvpn/config`.

- [x] **Step 4: Validate the compose file locally**

Run (from `nas/torrent-vpn/`, with a throwaway `.env` that is deleted right after):

```bash
cd nas/torrent-vpn && printf 'WIREGUARD_PRIVATE_KEY=REPLACE_ME\n' > .env && docker compose config --quiet && echo VALID; rm -f .env
```

Expected: `VALID`, no warnings about the `{{PORT}}` template (compose only interpolates `$`). Also confirm `git status --ignored` does not list `.env` as tracked.

- [x] **Step 5: Commit**

```bash
git add nas/torrent-vpn/compose.yaml nas/torrent-vpn/.env.example nas/torrent-vpn/README.md
git commit -m "feat(nas): torrent-vpn compose stack (gluetun + qBittorrent)"
```

---

### Task 2: Create the UGOS Docker Project (not started yet)

**Files:** none in repo. NAS UI only, via Claude in Chrome at `http://192.168.50.254:9999/desktop/?os=ugospro#/` → Docker → Project.

**Interfaces:**
- Consumes: `nas/torrent-vpn/compose.yaml` from Task 1.
- Produces: UGOS project `torrent-vpn` with compose pasted, key placeholder in place, **not started**.

- [x] **Step 1: Confirm host paths.** In UGOS Files, open `nas-apps` and `homelab` and read the absolute path shown in the folder properties/URL (expected `/volume1/nas-apps`, `/volume1/homelab`). If either differs, edit the three volume lines in compose.yaml (repo and pasted copy) to match and amend the Task 1 commit.

- [x] **Step 2: Create the project.** Docker → Project → Create (or "+"). Project name `torrent-vpn`. Choose the project folder `nas-apps/torrent-vpn` (create it if the picker allows). Paste the full compose.yaml from Task 1 into the YAML editor. Do not start yet; if the wizard has "Start after creation", untick it.

- [x] **Step 3: Provide the secret slot.** If UGOS supports a `.env` file in the project folder, create `.env` with `WIREGUARD_PRIVATE_KEY=REPLACE_ME` (via the project's env editor or Files → TextEdit). If UGOS rejects `env_file`, remove the `env_file:` block from the pasted compose and add `WIREGUARD_PRIVATE_KEY: REPLACE_ME` under `gluetun.environment` instead; note this in README.md and commit that change.

- [x] **Step 4: Screenshot the created project** (save_to_disk) for the handoff message, then stop and ask Philip to paste the real private key into the placeholder. Do not proceed to Task 3 until Philip confirms the key is in place.

---

### Task 3: Start and verify the tunnel

**Interfaces:**
- Consumes: project `torrent-vpn` from Task 2 with the real key in place.
- Produces: running `torrent-vpn-gluetun` (healthy) and `torrent-vpn-qbittorrent`; the forwarded port number `PF_PORT` used in Task 4.

- [x] **Step 1: Start the project** in UGOS Docker → Project → torrent-vpn → Start. Wait 60 s.

- [x] **Step 2: Read gluetun log** (Container → torrent-vpn-gluetun → Log). Required lines, in order:
  - `[wireguard] Wireguard setup is complete` (or `Wireguard is up`)
  - `[healthcheck] healthy!`
  - `[port forwarding] port forwarded is NNNNN` → record as `PF_PORT`
  - `[ip getter] Public IP address is X.X.X.X (Sweden, …)`
  - After the up-command: either `Ok` (localhost bypass already on) or a `403`/`Forbidden` line (expected before Task 4 Step 2; harmless).
  If `Wireguard` never comes up: check the log for `invalid private key` (bad paste → back to Task 2 Step 4) or `no server found` (change `SERVER_COUNTRIES` to `Netherlands`, save, restart).

- [x] **Step 3: Check from the Mac that the WebUI is reachable and the old one is untouched**

```bash
curl -s -o /dev/null -w 'new %{http_code}\n' http://192.168.50.254:38081/ ; curl -s -o /dev/null -w 'old %{http_code}\n' http://192.168.50.254:38080/
```

Expected: `new 200` (qBittorrent login page). `old` may be 200 or fail — the old container is flaky; either way it was not touched.

- [x] **Step 4: Confirm the public IP is Proton's, from inside gluetun.** UGOS Container → torrent-vpn-gluetun → Terminal → `wget -qO- https://ipinfo.io/ip` (or read the `[ip getter]` line). Must NOT be the home WAN IP (the old container's log showed home-side NAT-PMP IP 169.150.208.234 as Proton exit; any Proton range is fine). Record it.

- [x] **Step 5: Read qBittorrent's temporary password** from Container → torrent-vpn-qbittorrent → Log: line `A temporary password is provided for this session: XXXX`. Record it for the handoff. Claude does not log in with it.

---

### Task 4: qBittorrent first-boot settings and end-to-end download test

**Interfaces:**
- Consumes: `PF_PORT` and the temporary password from Task 3.
- Produces: a qBittorrent instance with localhost auth bypass on, listen port = `PF_PORT`, and one completed + seeding test torrent in `/torrents`.

- [x] **Step 1: Hand the temporary password to Philip** and ask him to, in `http://192.168.50.254:38081`: log in, Options → Web UI → set username `admin` and the same password the old instance uses, tick **"Bypass authentication for clients on localhost"**, Save. (This is the only step that needs Philip's hands before the review handoff.)

- [x] **Step 2: Re-fire the port-forward hook.** UGOS → Container → torrent-vpn-gluetun → Restart (gluetun only; qbittorrent restarts with it because it shares the namespace — that is expected). Wait 60 s. gluetun log must now show the up-command output `Ok`.

- [x] **Step 3: Verify the listen port** — ask Philip to open Options → Connection and confirm "Port used for incoming connections" equals `PF_PORT`, OR check the qbittorrent log for `Successfully listening on IP: 10.2.0.2, port: TCP/PF_PORT`.

- [x] **Step 4: Test download.** Philip (or Claude, since adding a public Linux ISO magnet is not a destructive action) adds the Debian netinst magnet from https://www.debian.org/CD/torrent-cd/ with save path `/torrents/test`. Expected within ~2 minutes: state goes downloading → seeding; Peers column shows connections; the "Connection status" icon in the WebUI footer is green (firewalled icon would mean the forwarded port is not reaching qBittorrent).

- [x] **Step 5: Confirm file ownership on disk.** UGOS Files → homelab/streaming/torrents/test → properties: owner uid 1000, group gid 10 (matches the arr apps' expectations from the old container).

- [x] **Step 6: Idle CPU.** UGOS Docker → Overview → Resource usage: `torrent-vpn-gluetun` and `torrent-vpn-qbittorrent` both < 3 % CPU while the ISO seeds; the old `qbittorrentvpn` still at ~66 % (untouched, for comparison). Screenshot (save_to_disk) for the handoff.

- [x] **Step 7: Remove the test torrent from qBittorrent (keep files off — delete files too, they are a public ISO)** and commit nothing (no repo changes in this task). Write the handoff message for Philip: what runs where, port 38081, what was verified with the numbers, what cutover will involve, and that the old container is untouched.

---

## Execution notes (2026-09-04)

- Task 2: UGOS has no `.env` slot → key placeholder inline in compose (repo keeps
  `REPLACE_ME`). UGOS validated bind paths and refused non-existent folders, so
  `nas-apps/torrent-vpn/{gluetun,qbittorrent}` were created in the folder picker.
  Project storage path is the UGOS default `docker/torrent-vpn`.
- Task 3: tunnel up on first start (se, 169.150.208.244, forwarded port 50995).
  WebUI answered **401** — qBittorrent host-header validation, not auth (see README).
- Task 4 step 1 was done by Claude over the API with the temporary password
  instead of by Philip: `web_ui_host_header_validation_enabled=false`,
  `bypass_local_auth=true`, `save_path=/torrents`. Philip still sets the real
  admin password. Debian 13.6 netinst: 98 % in 25 s (~33 MB/s), seeding with
  incoming peers, `connection_status=connected`, file uid 1000 gid 10. Idle CPU
  1 % both containers vs 66 % old. Test torrent + file deleted afterwards.
- For cutover: old `/torrents` layout has `incomplete/`, `series/`, `movies/`
  → mirror old qBittorrent.conf (temp path, category paths) before switching.

## Not in this plan (Philip-gated, spec Phase 4)

Cutover: stop old container, copy `BT_backup`, move port to 38080, test Sonarr/Radarr/Prowlarr/Seerr → Jellyfin. Written up in README.md; executed only after Philip says go.

## Self-review

- Spec coverage: topology (T1), volumes/ports/firewall (T1), secrets (T1 .env.example + T2 step 3–4), repo layout (T1), Phase 1 deploy (T2–T3), Phase 2 verify (T3–T4), Phase 3 hand-off (T4 step 7), Phase 4 explicitly excluded and gated, rollback in README (T1 step 3). No gaps.
- Placeholders: `REPLACE_ME` is the intended secret placeholder, not a plan gap.
- Names consistent: `torrent-vpn`, `torrent-vpn-gluetun`, `torrent-vpn-qbittorrent`, `PF_PORT`, port 38081 throughout.
