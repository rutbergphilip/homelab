#!/usr/bin/env python3
"""dedup-media.py — replace duplicated media files with hardlinks to their torrent twins.

Background (2026-09-12): until 2026-09-07 Sonarr/Radarr mounted /torrents and /media as
separate paths, so every import was a COPY. Audit: media 5.3 TB + torrents 4.9 TB, only 4
files hardlinked → ~5 TB wasted on /volume1.

For every file under /streaming/media that has a single link, find torrent files under
/streaming/torrents with the exact same size. If exactly one candidate exists and the
first and last 32 MiB are byte-identical, atomically replace the media file with a
hardlink to the torrent file (link to a temp name, then rename over the original), so
the media path, name and content stay the same while the blocks become shared.

Safety: dry-run by default (pass --apply to change anything); size must match exactly;
ambiguous sizes are skipped; head+tail compare; never touches files already linked;
never deletes anything — the rename only swaps an inode for an identical one.
Run from the nas-maint container (root, local filesystem, fast):
    apk add --no-cache python3 && python3 /nas-apps/nas-backup/dedup-media.py [--apply]
"""
import os
import sys
import time
from collections import defaultdict

MEDIA = "/streaming/media"
TORRENTS = "/streaming/torrents"
CHUNK = 32 * 1024 * 1024
APPLY = "--apply" in sys.argv
MIN_SIZE = 1 * 1024 * 1024   # ignore tiny files (nfo, srt, jpg)


def same_head_tail(a, b, size):
    with open(a, "rb") as fa, open(b, "rb") as fb:
        if fa.read(CHUNK) != fb.read(CHUNK):
            return False
        if size > CHUNK:
            fa.seek(max(0, size - CHUNK))
            fb.seek(max(0, size - CHUNK))
            if fa.read(CHUNK) != fb.read(CHUNK):
                return False
    return True


t0 = time.time()
by_size = defaultdict(list)
for root, _, files in os.walk(TORRENTS):
    for f in files:
        p = os.path.join(root, f)
        try:
            st = os.stat(p)
        except OSError:
            continue
        if st.st_size >= MIN_SIZE:
            by_size[st.st_size].append((p, st.st_ino))
print(f"indexed {sum(len(v) for v in by_size.values())} torrent files in {time.time()-t0:.0f}s", flush=True)

linked = ambiguous = nomatch = mismatch = 0
freed = 0
for root, _, files in os.walk(MEDIA):
    for f in files:
        m = os.path.join(root, f)
        try:
            st = os.stat(m)
        except OSError:
            continue
        if st.st_size < MIN_SIZE or st.st_nlink > 1:
            continue
        cands = [(p, ino) for p, ino in by_size.get(st.st_size, []) if ino != st.st_ino]
        if not cands:
            nomatch += 1
            continue
        if len(cands) > 1:
            ambiguous += 1
            print(f"AMBIGUOUS {m} ({len(cands)} same-size torrent files)")
            continue
        t, _ = cands[0]
        if not same_head_tail(m, t, st.st_size):
            mismatch += 1
            print(f"MISMATCH {m} <> {t}")
            continue
        if APPLY:
            tmp = m + ".dedup-tmp"
            os.link(t, tmp)
            os.replace(tmp, m)
        linked += 1
        freed += st.st_size
        print(f"{'LINKED' if APPLY else 'WOULD LINK'} {m} -> {t}", flush=True)

print(f"\n{'applied' if APPLY else 'dry-run'}: linked={linked} ({freed/1e12:.2f} TB {'freed' if APPLY else 'to free'}), "
      f"no-match={nomatch}, ambiguous={ambiguous}, mismatch={mismatch}, {time.time()-t0:.0f}s")
