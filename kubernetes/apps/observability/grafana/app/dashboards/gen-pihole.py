#!/usr/bin/env python3
"""Generate pihole.json (Grafana "Pi-hole" dashboard).

Run `python3 gen-pihole.py` from this directory after editing, commit both files.
The JSON ships as a ConfigMap via ../kustomization.yaml (label grafana_dashboard=1,
folder "Homelab") and is picked up by Grafana's sidecar.

Numbers come from the ekofr/pihole-exporter sidecar in the pihole pod
(kubernetes/apps/network/pihole/), scraped through the `pihole` ServiceMonitor.
Everything is prefixed `pihole_`. Since 2026-09-18 Pi-hole forwards to a
co-located unbound recursive resolver, so "forward destinations" is expected to
show a single local upstream rather than Cloudflare.
"""
import json
import pathlib

DS = {"type": "prometheus", "uid": "prometheus"}
GREEN, AMBER, CORAL, TEXT = "green", "orange", "red", "text"


def thresholds(*steps):
    """steps: (value, color) pairs; first value None = base."""
    return {"mode": "absolute", "steps": [{"color": c, "value": v} for v, c in steps]}


def target(expr, legend="", ref="A", instant=False, fmt=None):
    t = {"datasource": DS, "expr": expr, "legendFormat": legend, "refId": ref, "instant": instant}
    if fmt:
        t["format"] = fmt
    return t


def panel(ptype, title, x, y, w, h, targets, unit=None, thr=None, decimals=None, opts=None,
          overrides=None, minv=None, maxv=None, desc=None):
    fc = {"unit": unit or "none", "thresholds": thr or thresholds((None, TEXT)),
          "color": {"mode": "thresholds" if ptype in ("stat", "gauge", "bargauge") else "palette-classic"}}
    if decimals is not None:
        fc["decimals"] = decimals
    if minv is not None:
        fc["min"] = minv
    if maxv is not None:
        fc["max"] = maxv
    if ptype == "timeseries":
        fc["custom"] = {"lineWidth": 1, "fillOpacity": 12, "showPoints": "never", "spanNulls": True}
    p = {"type": ptype, "title": title, "datasource": DS,
         "gridPos": {"x": x, "y": y, "w": w, "h": h},
         "targets": targets, "fieldConfig": {"defaults": fc, "overrides": overrides or []},
         "options": opts or {}}
    if desc:
        p["description"] = desc
    return p


def stat(title, x, y, w, h, expr, unit="none", thr=None, decimals=0, desc=None, graph=False,
         mappings=None):
    opts = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "colorMode": "value", "graphMode": "area" if graph else "none",
            "justifyMode": "center", "textMode": "value"}
    p = panel("stat", title, x, y, w, h, [target(expr)], unit, thr, decimals, opts, desc=desc)
    if mappings:
        p["fieldConfig"]["defaults"]["mappings"] = mappings
    return p


def gauge(title, x, y, w, h, expr, unit="percent", thr=None, decimals=1, minv=0, maxv=100, desc=None):
    opts = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "showThresholdLabels": False, "showThresholdMarkers": True}
    return panel("gauge", title, x, y, w, h, [target(expr)], unit, thr, decimals, opts,
                 minv=minv, maxv=maxv, desc=desc)


def ts(title, x, y, w, h, targets, unit="none", decimals=None, minv=None, desc=None, stack=False):
    opts = {"legend": {"displayMode": "list", "placement": "bottom", "showLegend": True},
            "tooltip": {"mode": "multi", "sort": "desc"}}
    p = panel("timeseries", title, x, y, w, h, targets, unit, None, decimals, opts,
              minv=minv, desc=desc)
    if stack:
        p["fieldConfig"]["defaults"]["custom"]["stacking"] = {"mode": "normal", "group": "A"}
        p["fieldConfig"]["defaults"]["custom"]["fillOpacity"] = 40
    return p


def topn(title, x, y, w, h, expr, label, desc=None):
    """Horizontal bar gauge of a labelled gauge metric (top queries/ads/sources)."""
    opts = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "displayMode": "gradient", "orientation": "horizontal", "showUnfilled": True}
    return panel("bargauge", title, x, y, w, h,
                 [target(f"topk(10, {expr})", "{{" + label + "}}")],
                 thr=thresholds((None, "blue")), opts=opts, desc=desc)


def row(title, y):
    return {"type": "row", "title": title, "collapsed": False, "panels": [],
            "gridPos": {"x": 0, "y": y, "w": 24, "h": 1}}


# Blocking more than ~40% of queries usually means a blocklist is too aggressive;
# under ~5% usually means clients are bypassing Pi-hole entirely.
block_thr = thresholds((None, AMBER), (5, GREEN), (40, AMBER))
up_thr = thresholds((None, CORAL), (1, GREEN))

panels = []
y = 0

# ── Today ───────────────────────────────────────────────────────────────────────────
panels.append(row("Today", y)); y += 1
panels += [
    stat("Status", 0, y, 3, 4, "pihole_status", thr=up_thr,
         mappings=[{"type": "value", "options": {"0": {"text": "Disabled", "color": CORAL, "index": 0},
                                                 "1": {"text": "Enabled", "color": GREEN, "index": 1}}}],
         desc="Pi-hole blocking enabled. 0 here means DNS still resolves but nothing is filtered."),
    stat("Queries today", 3, y, 4, 4, "pihole_dns_queries_today", graph=True,
         thr=thresholds((None, TEXT))),
    stat("Blocked today", 7, y, 4, 4, "pihole_ads_blocked_today", graph=True,
         thr=thresholds((None, TEXT))),
    gauge("Blocked share", 11, y, 4, 4, "pihole_ads_percentage_today", thr=block_thr,
          desc="Healthy range is roughly 5–40%. Near zero suggests clients are using DoH or a hardcoded resolver instead of Pi-hole."),
    stat("Domains on blocklist", 15, y, 3, 4, "pihole_domains_being_blocked",
         thr=thresholds((None, TEXT)), desc="Gravity list size. Drops to 0 if a gravity update failed."),
    stat("Active clients", 18, y, 3, 4, "pihole_unique_clients", thr=thresholds((None, TEXT))),
    stat("Clients ever seen", 21, y, 3, 4, "pihole_clients_ever_seen", thr=thresholds((None, TEXT))),
]
y += 4

# ── Traffic ─────────────────────────────────────────────────────────────────────────
panels.append(row("Traffic", y)); y += 1
panels += [
    ts("Query rate", 0, y, 12, 7,
       [target("rate(pihole_dns_queries_today[5m])", "all queries"),
        target("rate(pihole_ads_blocked_today[5m])", "blocked", "B")],
       unit="reqps", decimals=2, minv=0,
       desc="Rates derived from the daily counters, which reset at midnight — expect one gap per day."),
    ts("Cached vs forwarded", 12, y, 12, 7,
       [target("pihole_queries_cached", "cached"),
        target("pihole_queries_forwarded", "forwarded to unbound", "B")],
       minv=0, stack=True,
       desc="A healthy cache hit share keeps recursive lookups (and therefore latency) down."),
]
y += 7
panels += [
    ts("Query types", 0, y, 12, 7, [target("pihole_querytypes", "{{type}}")],
       decimals=0, minv=0,
       desc="Absolute count per record type today (verified against the exporter: counts, not percentages). A large HTTPS/TYPE65 share is normal on Apple devices."),
    ts("Reply types", 12, y, 12, 7, [target("pihole_reply", "{{type}}")], minv=0,
       desc="NXDOMAIN/NODATA spikes can indicate a misbehaving client or a broken upstream."),
]
y += 7

# ── Top talkers ─────────────────────────────────────────────────────────────────────
panels.append(row("Top talkers", y)); y += 1
panels += [
    topn("Top permitted domains", 0, y, 8, 9, "pihole_top_queries", "domain"),
    topn("Top blocked domains", 8, y, 8, 9, "pihole_top_ads", "domain"),
    topn("Top clients", 16, y, 8, 9, "pihole_top_sources", "source",
         desc="Source of the most queries. A single client dominating is usually an IoT device polling."),
]
y += 9

# ── Upstream ────────────────────────────────────────────────────────────────────────
panels.append(row("Upstream", y)); y += 1
panels += [
    topn("Forward destinations", 0, y, 12, 7, "pihole_forward_destinations", "destination",
         desc="Since 2026-09-18 this should be the local unbound resolver (127.0.0.1#5335) plus cache/blocklist entries. A public resolver appearing here means the recursive path fell back."),
    ts("Upstream response time", 12, y, 12, 7,
       [target("pihole_forward_destinations_responsetime", "{{destination}}")],
       unit="ms", decimals=1, minv=0,
       desc="Recursive resolution is slower than a public resolver on a cold cache and comparable once warm."),
]
y += 7

dashboard = {
    "uid": "pihole",
    "title": "Pi-hole",
    "tags": ["homelab", "dns", "network"],
    "timezone": "browser",
    "editable": True,
    "graphTooltip": 1,
    "refresh": "1m",
    "schemaVersion": 39,
    "time": {"from": "now-24h", "to": "now"},
    "templating": {"list": []},
    "annotations": {"list": []},
    "links": [
        {"title": "Homelab Overview", "type": "link", "url": "/d/homelab-overview", "targetBlank": False},
    ],
    "panels": panels,
}

out = pathlib.Path(__file__).with_name("pihole.json")
out.write_text(json.dumps(dashboard, indent=1, ensure_ascii=False) + "\n")
print(f"wrote {out} ({len(panels)} panels, height {y})")
