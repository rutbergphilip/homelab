import { html, css, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import {
  numericState,
  overallStatus,
  pctTone,
  tempTone,
  zeroTone,
  restartTone,
  volumeTone,
  backupTone,
  certTone,
  nodesTone,
  worstTone,
  formatAge,
  formatPct,
  formatRate,
  formatTb,
  formatUptime,
  type SystemSnapshot,
} from '../system-model.js';
import type { HubConfig } from '../hub-config.js';
import type { SystemCardModel } from '../widgets/hub-system-card.js';
import '../widgets/hub-system-card.js';

const TWO_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 });

/**
 * System: the cluster and the NAS at a glance, as a 2×2 deck.
 *
 * Reading order: Kluster and NAS on top (the two machines), Media and Drift
 * below (what they are doing, and whether anything needs a hand). The page
 * has no domain colour — infrastructure is not a mood — so every surface is
 * the neutral card and colour appears only on values that can be good or bad.
 * Thresholds live in system-model.ts, never here.
 */
export class HubSystemPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: var(--hub-radius-pill);
        font: 600 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
      .status::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
      .status.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .status.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .status.tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .hint {
        margin-left: auto;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
          grid-auto-rows: auto;
        }
      }
    `,
  ];

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _text(entity: string | undefined): string | null {
    if (!entity) return null;
    const s = this.getState(entity);
    return s === 'unavailable' || s === 'unknown' || s === '' ? null : s;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    const sys = this.config.system ?? {};
    const c = sys.cluster ?? {};
    const n = sys.nas ?? {};
    const m = sys.media ?? {};
    const a = sys.alerts ?? {};

    const snap: SystemSnapshot = {
      nodesReady: this._num(c.nodes_ready_entity),
      nodesTotal: this._num(c.nodes_total_entity),
      alerts: this._num(a.count_entity),
      fluxFailing: this._num(c.flux_failing_entity),
      podsUnhealthy: this._num(c.pods_unhealthy_entity),
      restarts1h: this._num(c.restarts_entity),
      clusterTemp: this._num(c.temp_entity),
      nasCpuTemp: this._num(n.cpu_temp_entity),
      nasNvmeTemp: this._num(n.nvme_temp_entity),
      volume1UsedPct: this._num(n.volume1_used_entity),
      volume2UsedPct: this._num(n.volume2_used_entity),
      backupAgeHours: this._num(n.backup_age_entity),
      certDays: this._num(c.certs_days_entity),
    };
    const status = overallStatus(snap);

    const clusterCpu = this._num(c.cpu_entity);
    const clusterMem = this._num(c.mem_entity);
    const nodesLabel =
      snap.nodesReady === null || snap.nodesTotal === null ? '–' : `${snap.nodesReady}/${snap.nodesTotal}`;
    const nodeTone = nodesTone(snap.nodesReady, snap.nodesTotal);
    const kluster: SystemCardModel = {
      section: 'kluster',
      eyebrow: 'Kluster',
      value: nodesLabel,
      unit: 'noder',
      pill:
        nodeTone === 'neutral'
          ? undefined
          : { label: nodeTone === 'green' ? 'Alla redo' : 'Nod nere', tone: nodeTone },
      rows: [
        { key: 'CPU', value: formatPct(clusterCpu), tone: pctTone(clusterCpu) },
        { key: 'Minne', value: formatPct(clusterMem), tone: pctTone(clusterMem) },
        {
          key: 'Poddar',
          value: (() => {
            const r = this._num(c.pods_running_entity);
            const u = snap.podsUnhealthy;
            if (r === null) return '–';
            return u ? `${r} igång · ${u} med problem` : `${r} igång`;
          })(),
          tone: zeroTone(snap.podsUnhealthy),
        },
        {
          key: 'Omstarter / 1 h',
          value: snap.restarts1h === null ? '–' : `${Math.round(snap.restarts1h)}`,
          tone: restartTone(snap.restarts1h),
        },
        {
          key: 'Varmaste nod',
          value: snap.clusterTemp === null ? '–' : `${Math.round(snap.clusterTemp)} °C`,
          tone: tempTone(snap.clusterTemp),
        },
      ],
    };

    const v1free = this._num(n.volume1_free_entity);
    const v1used = snap.volume1UsedPct;
    const nasCpu = this._num(n.cpu_entity);
    const nasMem = this._num(n.mem_entity);
    const nas: SystemCardModel = {
      section: 'nas',
      eyebrow: 'NAS',
      value: formatTb(v1free),
      unit: 'ledigt',
      bar:
        v1used === null
          ? undefined
          : { pct: v1used, tone: volumeTone(v1used), label: `Volume 1 · ${formatPct(v1used)} använt` },
      rows: [
        { key: 'CPU', value: formatPct(nasCpu), tone: pctTone(nasCpu) },
        { key: 'Minne', value: formatPct(nasMem), tone: pctTone(nasMem) },
        {
          key: 'Temperatur',
          value:
            snap.nasCpuTemp === null
              ? '–'
              : `${Math.round(snap.nasCpuTemp)} °C${snap.nasNvmeTemp === null ? '' : ` · NVMe ${Math.round(snap.nasNvmeTemp)} °C`}`,
          tone: worstTone([tempTone(snap.nasCpuTemp), tempTone(snap.nasNvmeTemp)]),
        },
        {
          key: 'Appar (SSD)',
          value: (() => {
            const g = this._num(n.volume2_free_entity);
            return g === null ? '–' : `${Math.round(g)} GB ledigt`;
          })(),
          tone: volumeTone(snap.volume2UsedPct),
        },
        { key: 'Drifttid', value: formatUptime(this._num(n.uptime_entity)) },
      ],
    };

    const streams = this._num(m.jellyfin_streams_entity);
    const jfCpu = this._num(m.jellyfin_cpu_entity);
    const media: SystemCardModel = {
      section: 'media',
      eyebrow: 'Media',
      value: streams === null ? '–' : `${Math.round(streams)}`,
      unit: streams === 1 ? 'ström' : 'strömmar',
      pill:
        jfCpu !== null && jfCpu >= 0.8 && (streams ?? 0) === 0
          ? { label: 'Jellyfin jobbar', tone: 'neutral' }
          : undefined,
      rows: [
        { key: 'Jellyfin CPU', value: jfCpu === null ? '–' : `${TWO_DEC.format(jfCpu)} kärnor` },
        { key: 'Seedar (upp)', value: formatRate(this._num(m.torrent_up_entity)) },
        { key: 'Laddar ner', value: formatRate(this._num(m.torrent_down_entity)) },
        {
          key: 'Containrar',
          value: (() => {
            const k = this._num(n.containers_entity);
            return k === null ? '–' : `${Math.round(k)} igång`;
          })(),
        },
      ],
    };

    const alerts = snap.alerts;
    const names = this._text(a.names_entity);
    const drift: SystemCardModel = {
      section: 'drift',
      eyebrow: 'Drift',
      value: alerts === null ? '–' : `${Math.round(alerts)}`,
      unit: alerts === 1 ? 'larm' : 'larm',
      pill:
        alerts === null
          ? undefined
          : alerts > 0
            ? { label: names && names !== 'OK' ? names.split(',')[0].trim() : 'Ringer', tone: 'coral' }
            : { label: 'Tyst', tone: 'green' },
      rows: [
        {
          key: 'Flux',
          value: snap.fluxFailing === null ? '–' : snap.fluxFailing === 0 ? 'Synkad' : `${Math.round(snap.fluxFailing)} misslyckade`,
          tone: zeroTone(snap.fluxFailing),
        },
        {
          key: 'Certifikat',
          value: snap.certDays === null ? '–' : `${Math.round(snap.certDays)} dagar kvar`,
          tone: certTone(snap.certDays),
        },
        {
          key: 'NAS-backup',
          value: snap.backupAgeHours === null ? '–' : `${formatAge(snap.backupAgeHours)} sedan`,
          tone: backupTone(snap.backupAgeHours),
        },
        { key: 'Kluster drifttid', value: formatUptime(this._num(c.uptime_entity)) },
      ],
    };

    return html`
      <div class="page">
        <div class="header">
          <h1 class="title">System</h1>
          <span class="status tone-${status.tone}">${status.label}</span>
          <span class="hint">Tryck på ett kort för detaljer</span>
        </div>
        <div class="grid">
          <hub-system-card .model=${kluster}></hub-system-card>
          <hub-system-card .model=${nas}></hub-system-card>
          <hub-system-card .model=${media}></hub-system-card>
          <hub-system-card .model=${drift}></hub-system-card>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-system-page', HubSystemPage);
