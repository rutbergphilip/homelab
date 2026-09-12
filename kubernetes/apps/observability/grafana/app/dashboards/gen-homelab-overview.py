#!/usr/bin/env python3
"""Generate homelab-overview.json (Grafana "Homelab Overview" dashboard).

Run `python3 gen-homelab-overview.py` from this directory after editing, commit both
files. The JSON is shipped as a ConfigMap by ../kustomization.yaml (label
grafana_dashboard=1, folder "Homelab") and picked up by Grafana's sidecar.
Numbers come from the homelab:* recording rules
(../../kube-prometheus-stack/app/homelab-status.yaml) so this dashboard, Home Assistant
and alerting share one definition of every headline value.
"""
import json
import pathlib

DS = {"type": "prometheus", "uid": "prometheus"}
GREEN, AMBER, CORAL, TEXT = "green", "orange", "red", "text"


def thresholds(*steps):
    """steps: (value, color) pairs; first value None = base."""
    return {"mode": "absolute", "steps": [{"color": c, "value": v} for v, c in steps]}


def target(expr, legend="", ref="A"):
    return {"datasource": DS, "expr": expr, "legendFormat": legend, "refId": ref, "instant": False}


def panel(ptype, title, x, y, w, h, targets, unit=None, thr=None, decimals=None, opts=None,
          overrides=None, minv=None, maxv=None, desc=None, color_mode=None):
    fc = {"unit": unit or "none", "thresholds": thr or thresholds((None, TEXT)),
          "color": {"mode": color_mode or ("thresholds" if ptype in ("stat", "gauge", "bargauge") else "palette-classic")}}
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


def stat(title, x, y, w, h, expr, unit="none", thr=None, decimals=0, desc=None, graph=False):
    opts = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "colorMode": "value", "graphMode": "area" if graph else "none",
            "justifyMode": "center", "textMode": "value"}
    return panel("stat", title, x, y, w, h, [target(expr)], unit, thr, decimals, opts, desc=desc)


def gauge(title, x, y, w, h, expr, unit="percent", thr=None, decimals=0, minv=0, maxv=100):
    opts = {"reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "showThresholdLabels": False, "showThresholdMarkers": True}
    return panel("gauge", title, x, y, w, h, [target(expr)], unit, thr, decimals, opts, minv=minv, maxv=maxv)


def ts(title, x, y, w, h, targets, unit="none", decimals=None, minv=None, maxv=None, thr=None, desc=None):
    opts = {"legend": {"displayMode": "list", "placement": "bottom", "showLegend": True},
            "tooltip": {"mode": "multi", "sort": "desc"}}
    return panel("timeseries", title, x, y, w, h, targets, unit, thr, decimals, opts, minv=minv, maxv=maxv, desc=desc)


def row(title, y):
    return {"type": "row", "title": title, "collapsed": False, "panels": [],
            "gridPos": {"x": 0, "y": y, "w": 24, "h": 1}}


pct_thr = thresholds((None, GREEN), (70, AMBER), (90, CORAL))
temp_thr = thresholds((None, GREEN), (65, AMBER), (80, CORAL))
zero_good = thresholds((None, GREEN), (1, CORAL))
zero_warn = thresholds((None, GREEN), (1, AMBER), (5, CORAL))

panels = []
y = 0
# ── Overview ────────────────────────────────────────────────────────────────────────
panels.append(row("Overview", y)); y += 1
panels += [
    stat("Nodes ready", 0, y, 3, 4, "homelab:cluster_nodes_ready", thr=thresholds((None, CORAL), (3, GREEN)),
         desc="Talos nodes with Ready=True (of 3)"),
    stat("Alerts firing", 3, y, 3, 4, "homelab:alerts_firing", thr=zero_good,
         desc="Firing alerts, excluding Watchdog/InfoInhibitor and severity=info"),
    stat("Flux failing", 6, y, 3, 4, "homelab:cluster_flux_failing", thr=zero_good,
         desc="Kustomizations + HelmReleases with Ready=False"),
    stat("Unhealthy pods", 9, y, 3, 4, "homelab:cluster_pods_unhealthy", thr=zero_warn),
    stat("Restarts / 1h", 12, y, 3, 4, "homelab:cluster_restarts_1h", thr=zero_warn),
    stat("Cert expiry (min)", 15, y, 3, 4, "homelab:cluster_certs_min_days", unit="d",
         thr=thresholds((None, CORAL), (7, AMBER), (20, GREEN))),
    stat("NAS backup age", 18, y, 3, 4, "homelab:nas_backup_age_hours", unit="h", decimals=1,
         thr=thresholds((None, GREEN), (26, AMBER), (50, CORAL)), desc="Hours since the last successful nas-backup snapshot (04:00 nightly)"),
    stat("/volume1 free", 21, y, 3, 4, "homelab:nas_volume1_free_bytes", unit="bytes", decimals=1,
         thr=thresholds((None, CORAL), (800e9, AMBER), (2e12, GREEN))),
]
y += 4
panels += [
    gauge("Cluster CPU", 0, y, 4, 5, "homelab:cluster_cpu_pct", thr=pct_thr),
    gauge("Cluster memory", 4, y, 4, 5, "homelab:cluster_mem_pct", thr=pct_thr),
    gauge("Cluster temp (max)", 8, y, 4, 5, "homelab:cluster_temp_max_celsius", unit="celsius", thr=temp_thr, maxv=100),
    gauge("NAS CPU", 12, y, 4, 5, "homelab:nas_cpu_pct", thr=pct_thr),
    gauge("NAS memory", 16, y, 4, 5, "homelab:nas_mem_pct", thr=pct_thr),
    gauge("NAS CPU temp", 20, y, 4, 5, "homelab:nas_cpu_temp_celsius", unit="celsius", thr=temp_thr, maxv=100),
]
y += 5
# ── Cluster ─────────────────────────────────────────────────────────────────────────
panels.append(row("Cluster (Talos)", y)); y += 1
panels += [
    ts("CPU per node", 0, y, 8, 8, [target('100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{job="node-exporter",mode="idle"}[5m])))', "{{instance}}")], unit="percent", minv=0, maxv=100),
    ts("Memory per node", 8, y, 8, 8, [target('100 * (1 - node_memory_MemAvailable_bytes{job="node-exporter"} / node_memory_MemTotal_bytes{job="node-exporter"})', "{{instance}}")], unit="percent", minv=0, maxv=100),
    ts("Temperatures", 16, y, 8, 8, [
        target('max by (instance) (node_hwmon_temp_celsius{job="node-exporter",chip="platform_coretemp_0"})', "cpu {{instance}}"),
        target('max by (instance) (node_hwmon_temp_celsius{job="node-exporter",chip=~"nvme.*"})', "nvme {{instance}}", "B")], unit="celsius"),
]
y += 8
panels += [
    ts("Pods by namespace", 0, y, 8, 7, [target('sum by (namespace) (kube_pod_status_phase{phase="Running"})', "{{namespace}}")], unit="none"),
    ts("Container restarts (1h window)", 8, y, 8, 7, [target('sum by (namespace) (increase(kube_pod_container_status_restarts_total[1h])) > 0', "{{namespace}}")], unit="none"),
    ts("Ingress requests/s", 16, y, 8, 7, [target('sum by (ingress) (rate(nginx_ingress_controller_requests[5m])) > 0', "{{ingress}}")], unit="reqps"),
]
y += 7
# ── NAS ─────────────────────────────────────────────────────────────────────────────
panels.append(row("NAS (Ugreen, 192.168.50.254)", y)); y += 1
panels += [
    ts("CPU / memory", 0, y, 8, 8, [target("homelab:nas_cpu_pct", "cpu %"), target("homelab:nas_mem_pct", "mem %", "B")], unit="percent", minv=0, maxv=100),
    ts("Volumes free", 8, y, 8, 8, [target("homelab:nas_volume1_free_bytes", "/volume1 (RAID5 HDD)"), target("homelab:nas_volume2_free_bytes", "/volume2 (NVMe apps)", "B")], unit="bytes", minv=0),
    ts("Temperatures", 16, y, 8, 8, [
        target("homelab:nas_cpu_temp_celsius", "cpu"),
        target('node_hwmon_temp_celsius{job="nas-node-exporter",chip=~"nvme.*",sensor="temp1"}', "{{chip}}", "B")], unit="celsius"),
]
y += 8
panels += [
    ts("Network eth0", 0, y, 8, 8, [target("homelab:nas_net_rx_bps", "rx"), target("homelab:nas_net_tx_bps", "tx", "B")], unit="Bps", minv=0),
    ts("Container CPU (cores)", 8, y, 8, 8, [target('sum by (name) (rate(container_cpu_usage_seconds_total{job="nas-cadvisor",name!=""}[5m]))', "{{name}}")], unit="none", decimals=2, minv=0),
    ts("Container memory (rss)", 16, y, 8, 8, [target('container_memory_rss{job="nas-cadvisor",name!=""}', "{{name}}")], unit="bytes", minv=0,
       desc="rss, not cgroup usage — UGOS's RAM bar includes page cache, which is why Jellyfin looks huge there"),
]
y += 8
# ── Media ───────────────────────────────────────────────────────────────────────────
panels.append(row("Media", y)); y += 1
panels += [
    ts("Torrent traffic (gluetun)", 0, y, 8, 7, [target("homelab:torrent_tx_bps", "upload (seeding)"), target("homelab:torrent_rx_bps", "download", "B")], unit="Bps", minv=0),
    ts("Jellyfin CPU (cores)", 8, y, 8, 7, [target("homelab:jellyfin_cpu_cores", "jellyfin")], unit="none", decimals=2, minv=0,
       desc="Sustained 1–2 cores with nobody watching = Intro Skipper / trickplay working through new imports"),
    ts("Jellyfin memory", 16, y, 8, 7, [target("homelab:jellyfin_rss_bytes", "rss"), target('container_memory_cache{job="nas-cadvisor",name="jellyfin"}', "page cache", "B")], unit="bytes", minv=0),
]
y += 7
# ── Alerts ──────────────────────────────────────────────────────────────────────────
panels.append(row("Alerts", y)); y += 1
alerts_tbl = panel("table", "Firing alerts", 0, y, 24, 7,
                   [{"datasource": DS, "expr": 'ALERTS{alertstate="firing"}', "format": "table", "instant": True, "refId": "A"}],
                   opts={"showHeader": True, "sortBy": [{"displayName": "severity", "desc": True}]})
alerts_tbl["transformations"] = [
    {"id": "organize", "options": {"excludeByName": {"Time": True, "Value": True, "__name__": True, "alertstate": True, "job": True, "endpoint": True, "service": True, "prometheus": True},
                                   "indexByName": {"alertname": 0, "severity": 1, "namespace": 2, "instance": 3}}}]
panels.append(alerts_tbl)
y += 7

dashboard = {
    "uid": "homelab-overview",
    "title": "Homelab Overview",
    "tags": ["homelab", "nas", "cluster"],
    "timezone": "browser",
    "editable": True,
    "graphTooltip": 1,
    "refresh": "30s",
    "schemaVersion": 39,
    "time": {"from": "now-6h", "to": "now"},
    "templating": {"list": []},
    "annotations": {"list": []},
    "links": [
        {"title": "Kubernetes views", "type": "dashboards", "tags": ["kubernetes"], "asDropdown": True},
        {"title": "NAS containers (cAdvisor)", "type": "link", "url": "/d/pMEd7m0Mz", "targetBlank": False},
    ],
    "panels": panels,
}

out = pathlib.Path(__file__).with_name("homelab-overview.json")
out.write_text(json.dumps(dashboard, indent=1, ensure_ascii=False) + "\n")
print(f"wrote {out} ({len(panels)} panels, height {y})")
