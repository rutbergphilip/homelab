# torrent-vpn — gluetun + qBittorrent on the Ugreen NAS

Replaces `binhex/arch-qbittorrentvpn` (OpenVPN + bash watchdog, ~66 % CPU at
idle). Design: `docs/superpowers/specs/2026-09-04-nas-torrent-vpn-gluetun-design.md`.

| | |
|---|---|
| Where | UGOS Pro Docker → Project `torrent-vpn` (192.168.50.254) |
| VPN | ProtonVPN WireGuard via gluetun, NAT-PMP port forwarding, kill switch |
| Client | linuxserver/qbittorrent **libtorrent 1.2** build (libtorrent 2's mmap I/O is a known multi-GB RSS source; the old container sat at 5.1 GB) |
| WebUI | `http://192.168.50.254:38081` during the side-by-side test, **38080** after cutover |
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

## Rollback

Stop project `torrent-vpn`, start `qbittorrentvpn`. Its config folder is never
modified (BT_backup is copied, not moved).
