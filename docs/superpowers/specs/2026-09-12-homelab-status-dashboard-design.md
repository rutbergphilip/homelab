# Homelab status: Grafana overview + Home Assistant "System" page

**Date:** 2026-09-12 · **Status:** approved in chat (native HA entities, new wall-hub page), built autonomously

## Goal

One place to see the health of the cluster and the NAS at a glance, in two forms:

1. **Grafana "Homelab Overview"** at grafana.rutberg.dev — the deep view for a computer.
2. **Wall-hub page "System"** in Home Assistant — a handful of curated numbers as native
   HA entities (so they also work in automations and Jarvis), plus a status chip on Hem
   so a red state is visible without swiping.

Philip chose native entities over embedded Grafana panels ("will look better on our
dashboard") and a dedicated hub page over a Hem-only widget.

## Architecture

```
node-exporter (3 Talos nodes)  kube-state-metrics  cAdvisor + node-exporter (NAS)  Flux controllers
            └──────────────────────┬────────────────────────────┘                    │ PodMonitor (new)
                          Prometheus (kube-prometheus-stack)  ◄───────────────────────┘
                                   │ recording rules  homelab:*   (PrometheusRule homelab-status)
              ┌────────────────────┼──────────────────────────┐
     Grafana "Homelab Overview"    │            HA rest: sensors (one HTTP call, ~20 sensors)
     (ConfigMap, sidecar, folder   │            + Alertmanager /api/v2/alerts (names)
      "Homelab")                   │            + Jellyfin /Sessions (active streams)
                                   │                     │
                                   │            wall-hub page "System" + Hem chip
```

**Why recording rules:** every consumer reads the same pre-computed `homelab:*` series, so
Grafana, HA and any future alert agree on the definition, and HA needs exactly one
Prometheus request per poll (`{__name__=~"homelab:.*"}`) instead of one per sensor.

## The numbers (recording rules, all prefixed `homelab:`)

| Series | Definition | Shown |
|---|---|---|
| `cluster_nodes_ready` / `cluster_nodes_total` | kube-state-metrics Ready condition / node count | hub, Grafana |
| `cluster_cpu_pct`, `cluster_mem_pct` | node-exporter, all Talos nodes, 5 m rate | hub, Grafana |
| `cluster_pods_running`, `cluster_pods_unhealthy` | phases + waiting reasons (CrashLoop/ImagePull) | hub, Grafana |
| `cluster_restarts_1h` | container restarts, last hour | hub, Grafana |
| `cluster_temp_max_celsius` | hottest coretemp package across nodes | hub, Grafana |
| `cluster_flux_failing` | Flux Kustomizations/HelmReleases with Ready=False | hub, Grafana |
| `cluster_certs_min_days` | soonest cert-manager expiry | hub, Grafana |
| `alerts_firing` | firing alerts excluding Watchdog/InfoInhibitor/severity=info | hub chip, Grafana |
| `nas_cpu_pct`, `nas_mem_pct`, `nas_cpu_temp_celsius`, `nas_nvme_temp_max_celsius` | NAS node-exporter | hub, Grafana |
| `nas_volume1_free_bytes`, `nas_volume1_used_pct`, `nas_volume2_free_bytes`, `nas_volume2_used_pct` | NAS filesystems | hub, Grafana |
| `nas_net_rx_bps`, `nas_net_tx_bps` | NAS eth0 | Grafana |
| `nas_containers_running` | cAdvisor container count | hub |
| `nas_backup_age_hours`, `nas_backup_size_bytes` | nas-backup textfile metrics | hub, Grafana |
| `torrent_tx_bps`, `torrent_rx_bps` | gluetun container network (seeding) | hub, Grafana |
| `jellyfin_cpu_cores`, `jellyfin_rss_bytes` | cAdvisor, *rss* not the cache-inflated usage | hub, Grafana |
| `nas_uptime_hours`, `cluster_uptime_min_hours` | boot times | Grafana |

Not numeric, fetched directly by HA: firing alert names (Alertmanager), active Jellyfin
streams (Jellyfin `/Sessions`, API key read from `input_text.jellyfin_backup_api_key`).

## Home Assistant

- `rest:` block appended to `configuration.yaml` (mirror `.claude/ha-homelab-status.yaml`):
  one resource against Prometheus' cluster service (reachable, verified 200) with one
  sensor per series, `unique_id: homelab_<name>`, 60 s scan; one resource against
  Alertmanager (count + names attribute); one against Jellyfin (streams count + who).
- Entities are the contract for the hub: `sensor.homelab_*`.

## Wall hub

- New page **System** (8th, after Hälsa): 2×2 deck — **Kluster** (nodes, CPU/mem, pods,
  restarts, temp), **NAS** (CPU/mem, temps, volumes with bars, uptime), **Media**
  (Jellyfin streams + CPU, torrent up/down, containers), **Drift** (alerts, Flux, certs,
  backup age). Tap → one `hub-system-popup` with a `section` property (same shape as the
  Hälsa popup: key/value rows + a short explanation).
- Colour semantics reuse the existing tones: green = fine, amber = watch, coral = act.
  Thresholds live in `src/hub/system-model.ts` (pure, vitest-tested), never in templates.
- Hem chip: "Drift" chip with `goto: 'system'`, coral when alerts > 0 or nodes not all
  ready or Flux failing, amber when backup > 26 h or a volume > 85 %, otherwise green with
  a one-word "OK".
- Unknown/unavailable entities render as "–", never as 0 (HA restarts, Prometheus down).

## Grafana

`kubernetes/apps/observability/grafana/app/dashboards/homelab-overview.json`, generated by
`dashboards/gen-homelab-overview.py` (keeps the JSON reviewable and regenerable), shipped
as a ConfigMap with label `grafana_dashboard=1` and annotation `grafana_folder=Homelab`
(the sidecar is already on). Rows: Overview stats, Cluster, NAS, Media, Alerts table.

## Out of scope

Loki/logs, SMART disk health (UGOS exposes none to the container), Grafana panels
embedded in HA, alerting changes (the existing Alertmanager → HA webhook route stays).
