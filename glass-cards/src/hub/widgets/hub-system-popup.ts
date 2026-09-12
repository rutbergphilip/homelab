import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import {
  numericState,
  formatAge,
  formatPct,
  formatRate,
  formatTb,
  formatUptime,
} from '../system-model.js';
import type { HubConfig } from '../hub-config.js';

export type SystemSection = 'kluster' | 'nas' | 'media' | 'drift';

const TITLES: Record<SystemSection, string> = {
  kluster: 'Kluster',
  nas: 'NAS',
  media: 'Media',
  drift: 'Drift',
};

const ONE_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const TWO_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 });

interface Row {
  key: string;
  value: string;
}

/**
 * One popup for the four System cards (the Hälsa pattern): every section is a
 * titled list of key/value rows plus, where a number is easy to misread, one
 * sentence saying how to read it.
 */
export class HubSystemPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @property({ attribute: false }) section: SystemSection = 'kluster';

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .grid {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        min-height: 34px;
      }
      .k {
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .v {
        font: 600 13.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        text-align: right;
        max-width: 60%;
        overflow-wrap: anywhere;
      }
      .note {
        margin-top: 16px;
        font: 400 12.5px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-dim);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _text(entity: string | undefined): string {
    if (!entity) return '–';
    const s = this.getState(entity);
    return s === 'unavailable' || s === 'unknown' || s === '' ? '–' : s;
  }

  private _int(key: string, entity: string | undefined, unit = ''): Row {
    const n = this._num(entity);
    return { key, value: n === null ? '–' : `${Math.round(n)}${unit ? ` ${unit}` : ''}` };
  }

  private _rows(): Row[] {
    const sys = this.config?.system ?? {};
    const c = sys.cluster ?? {};
    const n = sys.nas ?? {};
    const m = sys.media ?? {};
    const a = sys.alerts ?? {};

    switch (this.section) {
      case 'kluster': {
        const ready = this._num(c.nodes_ready_entity);
        const total = this._num(c.nodes_total_entity);
        return [
          { key: 'Noder redo', value: ready === null || total === null ? '–' : `${ready} av ${total}` },
          { key: 'CPU (alla noder)', value: formatPct(this._num(c.cpu_entity)) },
          { key: 'Minne (alla noder)', value: formatPct(this._num(c.mem_entity)) },
          this._int('Poddar igång', c.pods_running_entity),
          this._int('Poddar med problem', c.pods_unhealthy_entity),
          this._int('Omstarter senaste timmen', c.restarts_entity),
          this._int('Varmaste nod', c.temp_entity, '°C'),
          { key: 'Kortaste drifttid', value: formatUptime(this._num(c.uptime_entity)) },
        ];
      }
      case 'nas': {
        const v1 = this._num(n.volume1_free_entity);
        const v2 = this._num(n.volume2_free_entity);
        return [
          { key: 'CPU', value: formatPct(this._num(n.cpu_entity)) },
          { key: 'Minne', value: formatPct(this._num(n.mem_entity)) },
          this._int('CPU-temperatur', n.cpu_temp_entity, '°C'),
          this._int('NVMe-temperatur (max)', n.nvme_temp_entity, '°C'),
          { key: 'Volume 1 ledigt (media)', value: v1 === null ? '–' : `${formatTb(v1)} · ${formatPct(this._num(n.volume1_used_entity))} använt` },
          { key: 'Volume 2 ledigt (appar, SSD)', value: v2 === null ? '–' : `${Math.round(v2)} GB · ${formatPct(this._num(n.volume2_used_entity))} använt` },
          this._int('Containrar igång', n.containers_entity),
          { key: 'Drifttid', value: formatUptime(this._num(n.uptime_entity)) },
          { key: 'Senaste backup', value: `${formatAge(this._num(n.backup_age_entity))} sedan` },
          { key: 'Backupens storlek', value: (() => { const g = this._num(n.backup_size_entity); return g === null ? '–' : `${ONE_DEC.format(g)} GB`; })() },
        ];
      }
      case 'media': {
        const cpu = this._num(m.jellyfin_cpu_entity);
        const mem = this._num(m.jellyfin_mem_entity);
        return [
          this._int('Jellyfin-strömmar just nu', m.jellyfin_streams_entity),
          { key: 'Jellyfin CPU', value: cpu === null ? '–' : `${TWO_DEC.format(cpu)} kärnor` },
          { key: 'Jellyfin minne (process)', value: mem === null ? '–' : `${TWO_DEC.format(mem)} GB` },
          { key: 'Torrent uppladdning', value: formatRate(this._num(m.torrent_up_entity)) },
          { key: 'Torrent nedladdning', value: formatRate(this._num(m.torrent_down_entity)) },
        ];
      }
      case 'drift':
        return [
          this._int('Larm som ringer', a.count_entity),
          { key: 'Vilka', value: this._text(a.names_entity) },
          this._int('Flux: misslyckade', c.flux_failing_entity),
          this._int('Certifikat går ut om', c.certs_days_entity, 'dagar'),
          { key: 'Senaste NAS-backup', value: `${formatAge(this._num(n.backup_age_entity))} sedan` },
          { key: 'Fördjupning', value: this.config?.system?.grafana_url ?? 'grafana.rutberg.dev' },
        ];
    }
  }

  /** Only where a number would otherwise be quietly misread. */
  private _note(): string {
    switch (this.section) {
      case 'nas':
        return 'Minnet här är processernas verkliga minne. UGOS egen RAM-stapel räknar även filcachen, så den ser mycket högre ut när Jellyfin läser igenom biblioteket.';
      case 'media':
        return 'Hög Jellyfin-CPU utan strömmar betyder oftast att Intro Skipper eller trickplay jobbar med nyimporterade avsnitt. Det går över av sig självt.';
      case 'drift':
        return 'Larm når telefonen via Home Assistant. Här visas bara sådant som kräver en hand — Watchdog och info-larm räknas inte.';
      default:
        return '';
    }
  }

  render(): TemplateResult {
    if (!this.hass || !this.config?.system) return html``;
    const note = this._note();
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${TITLES[this.section]}>
          <div class="head">
            <span class="title">${TITLES[this.section]}</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          <div class="grid">
            ${this._rows().map(
              (r) => html`<div class="row"><span class="k">${r.key}</span><span class="v">${r.value}</span></div>`,
            )}
          </div>
          ${note ? html`<p class="note">${note}</p>` : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-system-popup', HubSystemPopup);
