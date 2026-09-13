# arr-autoimport — finish the imports Sonarr/Radarr refuse

Service `arr-autoimport` in `nas/arr-stack/compose.yaml` (added 2026-09-13).
Image `rutbergphilip/arr-autoimport:<tag>` built from this folder.

## The problem it solves

"Noll stjärnor med Erik och Lotta" was requested in Seerr on 2026-09-13. Sonarr
holds the show under its TheTVDB title **Zero Stars Sweden** (no aliases), the only
indexer (Superbits) tags releases with IMDb ids, so the grab worked
(`Noll.stjarnor.med.Erik.och.Lotta.S01…`, matched by `tt36352329`). The download
finished, but Sonarr left it in the queue as **importBlocked**:

> Found matching series via grab history, but release was matched to series by ID.
> Automatic import is not possible. See the FAQ for details.

Sonarr refuses because a release whose title does not parse to the series *could*
be a mis-tagged upload. Nothing downstream moves: Seerr stays "Processing",
Jellyfin never sees the files. Radarr has the same rule ("Movie title mismatch,
automatic import is not possible"). Every Swedish show with an English TVDB title
and no Swedish alias hits this.

The upstream fix is per show: add the Swedish title as an alias on TheTVDB (needs a
TVDB login) or ask for a Sonarr scene mapping. `Taskmaster (SE)` already has one
(`Bast I Test`), which is why it works today. This service is the general net.

## What it does

Every 2 minutes, for Sonarr and Radarr:

1. `GET /api/v3/queue` — completed downloads in `trackedDownloadState=importBlocked`
   that the arr already linked to a series/movie (via grab history).
2. `GET /api/v3/manualimport?downloadId=…` — the arr's own manual-import preview,
   exactly what the "Manual Import" modal shows a human.
3. Files that map to the expected series (with episodes) / movie and have **no
   rejections** are imported with the `ManualImport` command, `importMode: auto`
   (hardlink into the library; the torrent keeps seeding). Rejected or unmapped
   files are logged and left; the download is re-checked after 30 minutes
   (unpackerr extracts rar releases in the meantime).

Nothing is deleted. Radarr rows without a movie (torrents added by hand, e.g.
`Vacation.2015…` / `The.Killer.2023…` on 2026-09-13) are ignored — a human decides those.

Trade-off accepted: the arrs block these imports to guard against a tracker tagging
the wrong IMDb id. With one private tracker and season/episode numbers that must
still parse against the series, that risk is small, and a wrong import is visible
in Jellyfin and reversible (delete in the arr).

## Keys, env, logs

API keys are read at runtime from read-only mounts of each arr's `config.xml`
(same pattern as media-janitor) — nothing secret in git or in the compose file.

| Env | Default | Meaning |
|---|---|---|
| `AI_INTERVAL` | 120 | seconds between polls |
| `AI_RETRY_AFTER` | 1800 | seconds before a download with skipped files is re-checked |
| `AI_DRY_RUN` | false | log what would be imported, import nothing |

Logs: UGOS → Docker → Container → arr-autoimport → Log. One line per import/skip.

## Build & deploy

```sh
cd nas/arr-autoimport
python3 -m unittest -v
docker build --platform linux/amd64 -t rutbergphilip/arr-autoimport:0.1.1 .
docker push rutbergphilip/arr-autoimport:0.1.1
```

Then bump the tag in `nas/arr-stack/compose.yaml`, paste the file into the UGOS
`arr-stack` project (Docker → Project → arr-stack → Compose) and Deploy.
