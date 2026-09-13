#!/usr/bin/env python3
"""arr-autoimport — finish the imports Sonarr/Radarr refuse to do on their own.

Why (2026-09-13): Swedish shows usually sit on TheTVDB/TMDB under an English title
("Zero Stars Sweden") while the tracker names the release in Swedish
("Noll.stjarnor.med.Erik.och.Lotta.S01…"). The only indexer (Superbits) is searched
by IMDb id, so the grab works — but Sonarr then blocks the import with

  "Found matching series via grab history, but release was matched to series by
   ID. Automatic import is not possible."

(Radarr: "Movie title mismatch, automatic import is not possible"), because a
title that does not parse to the series could in theory be a mis-tagged upload.
The download then sits in the queue forever, Seerr never flips to Available and
Jellyfin never sees it. The upstream fix is an alias on TheTVDB / a Sonarr scene
mapping per show; this service is the general one.

What it does, every INTERVAL seconds, for Sonarr and Radarr:
  1. read the queue, pick completed downloads in trackedDownloadState
     `importBlocked` that ARE linked to a series/movie via grab history;
  2. ask the arr's own manual-import preview for that download
     (`GET /api/v3/manualimport?downloadId=…`) — the same thing the "Manual
     Import" modal shows a human;
  3. if a file maps to the expected series (with episodes) / the expected movie
     and has no rejections, import it with the `ManualImport` command
     (importMode auto → hardlink into the library, torrent keeps seeding).
     Files that are rejected or unmapped are left alone and logged; a download
     that still has such files is re-checked after RETRY_AFTER seconds (rar
     releases are extracted by unpackerr in the meantime).

Nothing is ever deleted. Radarr queue rows with no movie (torrents added by hand)
are ignored — those need a human. Stdlib only, python:3.12-alpine.
"""
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

INTERVAL = int(os.environ.get("AI_INTERVAL", "120"))
RETRY_AFTER = int(os.environ.get("AI_RETRY_AFTER", "1800"))
DRY_RUN = os.environ.get("AI_DRY_RUN", "false").lower() == "true"

ARRS = [
    # name, base url, kind, config.xml with the api key
    ("sonarr", os.environ.get("SONARR_URL", "http://sonarr:8989"), "series",
     os.environ.get("SONARR_CONFIG", "/keys/sonarr.xml")),
    ("radarr", os.environ.get("RADARR_URL", "http://radarr:7878"), "movie",
     os.environ.get("RADARR_CONFIG", "/keys/radarr.xml")),
]


def log(msg):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), msg, flush=True)


# ------------------------------------------------------------------ pure logic
def api_key_from_xml(text):
    m = re.search(r"<ApiKey>([^<]+)</ApiKey>", text or "")
    return m.group(1).strip() if m else None


def blocked_downloads(records, id_field):
    """(downloadId, seriesId|movieId) for completed, import-blocked downloads that
    the arr already linked to a title. Season packs have one row per episode →
    dedup on downloadId."""
    out, seen = [], set()
    for r in records:
        did = r.get("downloadId")
        tid = r.get(id_field)
        if not did or did in seen:
            continue
        if r.get("status") != "completed" or r.get("trackedDownloadState") != "importBlocked":
            continue
        if not tid:
            continue
        seen.add(did)
        out.append((did, tid))
    return out


def plan(kind, files, expected_id):
    """Split the manual-import preview into (importable payload entries, skipped
    reasons). Only files that map to the expected title and carry no rejection
    are importable."""
    ok, skipped = [], []
    for f in files:
        name = (f.get("path") or "?").rsplit("/", 1)[-1]
        rej = [r.get("reason", "?") for r in (f.get("rejections") or [])]
        if rej:
            skipped.append(f"{name}: {'; '.join(rej)}")
            continue
        entry = {
            "path": f.get("path"),
            "quality": f.get("quality"),
            "languages": f.get("languages") or [],
            "releaseGroup": f.get("releaseGroup"),
            "downloadId": f.get("downloadId"),
            "indexerFlags": f.get("indexerFlags") or 0,
        }
        if kind == "series":
            sid = (f.get("series") or {}).get("id")
            eps = [e["id"] for e in (f.get("episodes") or [])]
            if sid != expected_id:
                skipped.append(f"{name}: mapped to series {sid}, expected {expected_id}")
                continue
            if not eps:
                skipped.append(f"{name}: no episodes mapped")
                continue
            entry["seriesId"] = sid
            entry["episodeIds"] = eps
            entry["releaseType"] = f.get("releaseType") or "unknown"
        else:
            mid = (f.get("movie") or {}).get("id")
            if mid != expected_id:
                skipped.append(f"{name}: mapped to movie {mid}, expected {expected_id}")
                continue
            entry["movieId"] = mid
        ok.append(entry)
    return ok, skipped


def due(seen, download_id, now, retry_after):
    last = seen.get(download_id)
    return last is None or now - last >= retry_after


# ------------------------------------------------------------------------ http
def http(method, url, key, data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "X-Api-Key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def read_key(path):
    try:
        with open(path) as f:
            key = api_key_from_xml(f.read())
    except OSError as e:
        log(f"cannot read {path}: {e}")
        return None
    if not key:
        log(f"no <ApiKey> in {path}")
    return key


def hello(name, url, key):
    """One log line per arr at start so the log proves the key + URL work."""
    try:
        st = http("GET", f"{url}/api/v3/system/status", key)
        log(f"{name}: connected to {st.get('appName', name)} {st.get('version')} at {url}")
    except Exception as e:  # noqa: BLE001
        log(f"{name}: cannot reach {url}: {type(e).__name__}: {e}")


def process(name, url, kind, key, seen):
    id_field = "seriesId" if kind == "series" else "movieId"
    unknown = "includeUnknownSeriesItems" if kind == "series" else "includeUnknownMovieItems"
    page = http("GET", f"{url}/api/v3/queue?page=1&pageSize=500&{unknown}=true", key)
    now = time.time()
    for did, tid in blocked_downloads(page.get("records", []), id_field):
        if not due(seen, did, now, RETRY_AFTER):
            continue
        seen[did] = now
        preview = http("GET", f"{url}/api/v3/manualimport?downloadId={urllib.parse.quote(did)}"
                              "&filterExistingFiles=false", key)
        if not isinstance(preview, list):
            log(f"{name}: {did[:8]} preview failed: {str(preview)[:200]}")
            continue
        ok, skipped = plan(kind, preview, tid)
        for s in skipped:
            log(f"{name}: {did[:8]} skip {s}")
        if not ok:
            log(f"{name}: {did[:8]} nothing importable ({len(preview)} files) — left for a human")
            continue
        names = ", ".join(e["path"].rsplit("/", 1)[-1] for e in ok)
        if DRY_RUN:
            log(f"{name}: DRY_RUN would import {len(ok)} file(s) for {kind} {tid}: {names}")
            continue
        cmd = http("POST", f"{url}/api/v3/command", key,
                   {"name": "ManualImport", "files": ok, "importMode": "auto"})
        log(f"{name}: imported {len(ok)} file(s) for {kind} {tid} (command {cmd.get('id')}): {names}")


def main():
    log(f"arr-autoimport start interval={INTERVAL}s retry={RETRY_AFTER}s dry_run={DRY_RUN}")
    seen = {}
    for name, url, kind, cfg in ARRS:
        key = read_key(cfg)
        if key:
            hello(name, url, key)
    while True:
        for name, url, kind, cfg in ARRS:
            key = read_key(cfg)
            if not key:
                continue
            try:
                process(name, url, kind, key, seen)
            except Exception as e:  # noqa: BLE001 — keep polling
                log(f"{name}: error {type(e).__name__}: {e}")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
