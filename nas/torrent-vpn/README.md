# torrent-vpn — gluetun + qBittorrent on the Ugreen NAS

Replaces `binhex/arch-qbittorrentvpn` (OpenVPN + bash watchdog, ~66 % CPU at
idle). Design: `docs/superpowers/specs/2026-09-04-nas-torrent-vpn-gluetun-design.md`.

| | |
|---|---|
| Where | UGOS Pro Docker → Project `torrent-vpn` (192.168.50.254) |
| VPN | ProtonVPN WireGuard via gluetun, NAT-PMP port forwarding, kill switch |
| Client | linuxserver/qbittorrent **libtorrent 1.2** build (libtorrent 2's mmap I/O is a known multi-GB RSS source; the old container sat at 5.1 GB) |
| WebUI | `http://192.168.50.254:38080` (also `https://qbittorrent.rutberg.dev` via the cluster ingress) |
| Proxy | gluetun HTTP proxy `torrent-vpn-gluetun:8888` on the `starrs` network — Prowlarr's outbound proxy (Settings → General → Proxy) |
| Data | `/volume1/homelab/streaming/torrents` → `/torrents` (same as the old container; arr paths unchanged) |
| Config | `/volume1/nas-apps/torrent-vpn/{gluetun,qbittorrent}` |
| Old container data | `/volume1/nas-apps/qbittorrentvpn/config` (left intact for rollback) |

## Deploy

1. UGOS → Docker → Project → Create, name `torrent-vpn`, folder `nas-apps/torrent-vpn`, paste `compose.yaml`.
2. In the UGOS editor, replace `REPLACE_ME` on the `WIREGUARD_PRIVATE_KEY` line
   with the `PrivateKey` from a Proton WireGuard config generated with
   **NAT-PMP (Port Forwarding)** on (https://account.proton.me/u/0/vpn/WireGuard).
   UGOS has no separate `.env` slot, so the key lives only in the project copy on
   the NAS; the repo copy keeps the placeholder.
3. Start the project.

## Verify

- gluetun log: `Wireguard setup is complete`, `healthy!`, `port forwarded is NNNNN`,
  `Public IP address is …` (a Proton address, not the home WAN IP), and the
  up-command replying `Ok`.
- **Host header validation.** The linuxserver image ships with qBittorrent's
  host-header validation on, and inside gluetun's namespace the container's
  local address is the `starrs` bridge IP, so any request with
  `Host: 192.168.50.254:…` gets `401 Unauthorized` (the binhex image had this
  disabled in its bundled config). Fix once via the API with a `localhost` Host
  header, using the temporary password from the log:

  ```bash
  B=http://192.168.50.254:38081
  curl -c qb.cookie -H 'Host: localhost:8080' -H 'Origin: http://localhost:8080' \
    --data 'username=admin&password=<temp>' $B/api/v2/auth/login
  curl -b qb.cookie -H 'Host: localhost:8080' -H 'Origin: http://localhost:8080' \
    --data-urlencode 'json={"web_ui_host_header_validation_enabled":false,"bypass_local_auth":true,"save_path":"/torrents"}' \
    $B/api/v2/app/setPreferences
  ```

  (Origin must match Host including the port, or qBittorrent's CSRF check also
  answers 401.) The setting is persisted in `/config/qBittorrent/qBittorrent.conf`.
- First boot of qBittorrent prints `A temporary password is provided for this
  session` (a **new** one on every restart until a password is saved). Log in, set user `admin` + the same password the old instance uses
  (so Sonarr/Radarr entries keep working after cutover), and tick
  **Options → Web UI → Bypass authentication for clients on localhost** — the
  port-forward hook posts to `127.0.0.1:8080` and gets 403 without it. Restart
  the **project** (not gluetun alone — a container in `network_mode: service:`
  is left in the dead namespace if only gluetun restarts) so the hook re-fires.
  The hook's wget output is logged by gluetun under `ERROR` because wget writes
  to stderr; `URL:… -> "-" [1]` is success, `Connection refused` is not.
- Options → Connection → listening port equals NNNNN.
- Add a Debian netinst magnet to `/torrents/test`: it must reach seeding with
  incoming peers and a green connection icon (firewalled = forwarded port not
  reaching qBittorrent).
- Docker overview: both containers < 3 % CPU while seeding.

## Cutover (only after the new stack is tested and approved)

1. **Stop** (do not delete) the old `qbittorrentvpn` container.
2. Copy `nas-apps/qbittorrentvpn/config/qBittorrent/data/BT_backup/*` →
   `nas-apps/torrent-vpn/qbittorrent/qBittorrent/BT_backup/` (verify both paths
   exist first; the linuxserver image keeps data under `/config/qBittorrent/`).
   Paths are identical so fastresume stays valid and seeds carry over.
3. Edit the project: `"38081:8080"` → `"38080:8080"`, restart.
4. Sonarr/Radarr/Prowlarr → Settings → Download Clients → Test. Seerr: request one
   title and follow it through to Jellyfin.
5. Watch 24 h, then decide whether to delete the old container.

## Cutover log (2026-09-07)

Done: old container stopped, categories (movies/music/random/secret/series →
`/torrents/<cat>`), share limits (ratio 1.2, 3000 min, stop), temp path
`/torrents/incomplete`, auto-TMM and 527 BT_backup files migrated; port moved to
38080; Sonarr/Radarr/Prowlarr re-pointed (new WebUI user `rutbergphilip`);
Prowlarr proxy → `torrent-vpn-gluetun:8888`.

**The old container was compromised.** Its `qBittorrent.conf` had
`AutoRun\program` and `OnTorrentAdded\Program` set to `curl … | sh` droppers
(files.catbox.moe, abcdefghijklmnopqrst.net) — the 66 % CPU was a miner.
Root cause: `WebUI\AuthSubnetWhitelist=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`
with `CSRFProtection=false`; the public ingress arrives from the cluster pod
CIDR (10.42.0.0/16), so the WebUI was open to the internet without a password.
Nothing from the old config folder was copied except `BT_backup/*.{torrent,
fastresume}`. Keep `nas-apps/qbittorrentvpn/config` only as evidence; never
mount it into anything writable. The new instance has no whitelist and CSRF on.

**Operational rule:** never use UGOS "Restart" on the project — compose restart
ignores start order and qBittorrent can come up in gluetun's *old* network
namespace (symptom: port 38080 refused, gluetun hook "Connection refused"
forever). Use **Stop → Enable** instead.

## Rollback

Stop project `torrent-vpn`, start `qbittorrentvpn`. Its config folder is never
modified (BT_backup is copied, not moved).

## Seeding policy (2026-09-11)

Philip's rule: **seed forever**. Global share limits are off (`max_ratio_enabled`,
`max_seeding_time_enabled`, `max_inactive_seeding_time_enabled` all false — they were
1.2 / 3000 min before, which had stopped 260 of 267 torrents), every torrent's own limit
is reset to "use global" (`setShareLimits` with `-2`), and the 260 stopped torrents were
started again. Done through the WebUI API on `127.0.0.1:8080` from the qBittorrent
container Terminal (localhost auth bypass), so no password was needed. New torrents
inherit the global setting. Torrents only leave qBittorrent through the media-janitor
(see below) or by hand.

## media-janitor (2026-09-11)

Third service in this compose, `network_mode: service:gluetun` (so `127.0.0.1:8080` is
qBittorrent with the localhost bypass) and `FIREWALL_INPUT_PORTS=9797` on gluetun so the
arrs can reach it as `torrent-vpn-gluetun:9797`. What it does and how to use it:
`nas/media-janitor/README.md`.
