#!/usr/bin/env python3
"""media-janitor — single-point media removal for the NAS (added 2026-09-11).

Runs inside gluetun's network namespace (nas/torrent-vpn compose) so it can use
qBittorrent's "bypass authentication for localhost" — no password stored anywhere.
Radarr and Sonarr post their delete webhooks here (http://torrent-vpn-gluetun:9797/arr).

What happens on a delete (the arrs are the pivot; Seerr's "Remove from Radarr/Sonarr"
calls the same arr delete, so both UIs are single points):

  MovieFileDelete / EpisodeFileDelete (deleteReason manual/missingFromDisk)
      -> remove the torrent(s) that produced that file from qBittorrent WITH files
         (matched by exact file size, tie-broken by release name); a season pack is
         removed as a whole (its other episodes stay in the library as hardlinks).
  MovieDelete / SeriesDelete
      -> delete the Seerr media record (+ its requests) by tmdbId / tvdbId, so the
         title goes back to "request" state instead of showing as available.
  Jellyfin drops the entry on its own: real-time library monitoring sees the files
  vanish. Jellyfin is deliberately NOT a starting point (deleting there would make
  the arr re-download the title).

Upgrade deletions (deleteReason upgrade) are ignored by default: the replaced
torrent keeps seeding. Set JANITOR_ON_UPGRADE=true to remove those too.

Stdlib only; runs on python:3.12-alpine. Keys are read at request time from the
read-only mounts of the arr config.xml files and Seerr's settings.json.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("JANITOR_PORT", "9797"))
QBT_URL = os.environ.get("QBT_URL", "http://127.0.0.1:8080")
SEERR_URL = os.environ.get("SEERR_URL", "http://192.168.50.254:35055")
RADARR_XML = os.environ.get("RADARR_CONFIG", "/keys/radarr.xml")
SONARR_XML = os.environ.get("SONARR_CONFIG", "/keys/sonarr.xml")
SEERR_JSON = os.environ.get("SEERR_SETTINGS", "/keys/seerr.json")
ON_UPGRADE = os.environ.get("JANITOR_ON_UPGRADE", "false").lower() == "true"
DRY_RUN = os.environ.get("JANITOR_DRY_RUN", "false").lower() == "true"

FILE_EVENTS = {"MovieFileDelete", "EpisodeFileDelete"}
TITLE_EVENTS = {"MovieDelete", "SeriesDelete"}


def log(msg):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), msg, flush=True)


def http(method, url, data=None, headers=None, form=False):
    body = None
    hdrs = dict(headers or {})
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            hdrs["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, method=method, headers=hdrs)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        ctype = r.headers.get("Content-Type", "")
        if "json" in ctype and raw:
            return json.loads(raw)
        return raw.decode(errors="replace")


def seerr_key():
    try:
        with open(SEERR_JSON) as f:
            return json.load(f)["main"]["apiKey"]
    except Exception as e:  # noqa: BLE001
        log(f"seerr: cannot read api key ({e})")
        return None


def norm(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


# ---------------------------------------------------------------- qBittorrent
def qbt_torrents():
    return http("GET", f"{QBT_URL}/api/v2/torrents/info")


def qbt_files(h):
    return http("GET", f"{QBT_URL}/api/v2/torrents/files?hash={h}")


def qbt_delete(hashes):
    if DRY_RUN:
        log(f"DRY_RUN qbt delete {hashes}")
        return
    http("POST", f"{QBT_URL}/api/v2/torrents/delete",
         {"hashes": "|".join(hashes), "deleteFiles": "true"}, form=True)


def find_torrents_for_file(size, scene_name, rel_path):
    """Torrents that contain a file of exactly `size` bytes. If several, prefer the one
    whose name matches the release (scene) name; otherwise refuse (ambiguous)."""
    if not size:
        return []
    candidates = []
    for t in qbt_torrents():
        # cheap pre-filter: single-file torrents expose their size directly
        if t.get("total_size") == size or t.get("size") == size:
            candidates.append(t)
            continue
        try:
            files = qbt_files(t["hash"])
        except Exception:  # noqa: BLE001
            continue
        if any(f.get("size") == size for f in files):
            candidates.append(t)
    if len(candidates) <= 1:
        return candidates
    key = norm(scene_name) or norm(os.path.splitext(os.path.basename(rel_path or ""))[0])
    exact = [t for t in candidates if key and norm(t["name"]) == key]
    if len(exact) == 1:
        return exact
    partial = [t for t in candidates if key and (key in norm(t["name"]) or norm(t["name"]) in key)]
    if len(partial) == 1:
        return partial
    log(f"ambiguous: {len(candidates)} torrents hold a {size}-byte file "
        f"({[t['name'] for t in candidates]}) — leaving them alone")
    return []


# ---------------------------------------------------------------------- Seerr
def seerr_find_media(tmdb_id=None, tvdb_id=None):
    key = seerr_key()
    if not key:
        return None
    skip = 0
    while True:
        page = http("GET", f"{SEERR_URL}/api/v1/media?take=100&skip={skip}&filter=all",
                    headers={"X-Api-Key": key})
        results = page.get("results", [])
        for m in results:
            if tmdb_id and m.get("mediaType") == "movie" and m.get("tmdbId") == tmdb_id:
                return m
            if tvdb_id and m.get("mediaType") == "tv" and m.get("tvdbId") == tvdb_id:
                return m
        skip += len(results)
        if not results or skip >= page.get("pageInfo", {}).get("results", 0):
            return None


def seerr_delete_media(media_id):
    key = seerr_key()
    if DRY_RUN:
        log(f"DRY_RUN seerr delete media {media_id}")
        return
    http("DELETE", f"{SEERR_URL}/api/v1/media/{media_id}", headers={"X-Api-Key": key})


# ------------------------------------------------------------------- handlers
def handle_file_delete(p):
    reason = (p.get("deleteReason") or "").lower()
    if reason == "upgrade" and not ON_UPGRADE:
        log(f"{p['eventType']}: reason=upgrade — ignored (JANITOR_ON_UPGRADE=false)")
        return {"ignored": "upgrade"}
    mf = p.get("movieFile") or p.get("episodeFile") or {}
    size = mf.get("size")
    scene = mf.get("sceneName")
    rel = mf.get("relativePath") or mf.get("path")
    title = (p.get("movie") or p.get("series") or {}).get("title")
    log(f"{p['eventType']}: {title!r} file={rel!r} size={size} scene={scene!r} reason={reason}")
    hits = find_torrents_for_file(size, scene, rel)
    if not hits:
        log("no matching torrent — nothing to remove")
        return {"torrents_removed": []}
    qbt_delete([t["hash"] for t in hits])
    names = [t["name"] for t in hits]
    log(f"removed torrent(s) with files: {names}")
    return {"torrents_removed": names}


def handle_title_delete(p):
    if p["eventType"] == "MovieDelete":
        m = p.get("movie") or {}
        ident = {"tmdb_id": m.get("tmdbId")}
        title = m.get("title")
    else:
        s = p.get("series") or {}
        ident = {"tvdb_id": s.get("tvdbId")}
        title = s.get("title")
    log(f"{p['eventType']}: {title!r} {ident} deletedFiles={p.get('deletedFiles')}")
    media = seerr_find_media(**ident)
    if not media:
        log("seerr: no media record — nothing to do")
        return {"seerr_deleted": None}
    seerr_delete_media(media["id"])
    log(f"seerr: deleted media {media['id']} (requests gone, title is requestable again)")
    return {"seerr_deleted": media["id"]}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):  # quiet default access log
        pass

    def _send(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/healthz"):
            return self._send(200, {"ok": True, "dry_run": DRY_RUN})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/arr"):
            return self._send(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return self._send(400, {"error": "bad json"})
        et = payload.get("eventType")
        try:
            if et == "Test":
                log(f"Test from {payload.get('instanceName') or payload.get('applicationUrl') or 'arr'}")
                return self._send(200, {"ok": True})
            if et in FILE_EVENTS:
                return self._send(200, handle_file_delete(payload))
            if et in TITLE_EVENTS:
                return self._send(200, handle_title_delete(payload))
            return self._send(200, {"ignored": et})
        except urllib.error.HTTPError as e:
            log(f"{et}: upstream {e.code} {e.reason} at {e.url}")
            return self._send(502, {"error": f"{e.code} {e.reason}"})
        except Exception as e:  # noqa: BLE001
            log(f"{et}: error {e!r}")
            return self._send(500, {"error": repr(e)})


if __name__ == "__main__":
    log(f"media-janitor listening on :{PORT} (qbt={QBT_URL}, seerr={SEERR_URL}, "
        f"on_upgrade={ON_UPGRADE}, dry_run={DRY_RUN})")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
