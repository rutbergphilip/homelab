# media-janitor — remove a title once, everywhere

Philip's ask (2026-09-11): delete a movie or series from **one place** and have it gone
from qBittorrent, Seerr, Radarr/Sonarr and Jellyfin.

## How to use it

Delete the title in **Radarr / Sonarr** (Movie → Delete → "Delete files" + "Add exclusion"),
or in **Seerr** (title → Manage → *Remove from Radarr/Sonarr*), which calls the same arr
delete. That is the single point. Everything else follows automatically:

| System | What happens | Who does it |
|---|---|---|
| Radarr/Sonarr | title + media files deleted, exclusion added (if ticked) | the arr itself |
| qBittorrent | the torrent that produced the file is removed **with its data** | media-janitor (`MovieFileDelete`/`EpisodeFileDelete` webhook) |
| Seerr | media record + requests deleted → title is requestable again | media-janitor (`MovieDelete`/`SeriesDelete` webhook) |
| Jellyfin | entry disappears on its own | real-time library monitoring sees the files vanish |

Do **not** start from Jellyfin: deleting there leaves the arr monitoring the title and it
will simply be downloaded again.

## Behaviour details

- Torrent matching is by **exact file size**; if two torrents contain a file of the same
  size the release name breaks the tie, and if still ambiguous nothing is removed (logged).
- Deleting one episode of a **season pack** removes the whole pack from qBittorrent; the
  other episodes stay in the library (they are hardlinks, not copies).
- `deleteReason: upgrade` is ignored — a torrent replaced by a better release keeps seeding
  (Philip: seed forever). Flip `JANITOR_ON_UPGRADE=true` in the compose to change that.
- `JANITOR_DRY_RUN=true` logs what it would do without touching anything.

## Where it runs

Service `media-janitor` in `nas/torrent-vpn/compose.yaml`, `network_mode: service:gluetun`,
so qBittorrent is `127.0.0.1:8080` with the localhost auth bypass (no password stored).
Inbound from the arrs is allowed through gluetun's firewall with `FIREWALL_INPUT_PORTS=9797`;
the port is not published to the LAN. Keys for Radarr/Sonarr/Seerr are read at request
time from read-only mounts of their own config files. Code: `janitor.py` (stdlib only),
live copy `/volume2/nas-apps/media-janitor/janitor.py`.

Webhooks registered in Radarr and Sonarr (Settings → Connect → Webhook, name `media-janitor`,
URL `http://torrent-vpn-gluetun:9797/arr`, events: On Movie/Series Delete, On Movie/Episode
File Delete). Logs: UGOS → Container → media-janitor → Log.
