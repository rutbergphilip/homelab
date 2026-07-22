import { html, css, svg, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import {
  filterBusDepartures,
  shapeDeviations,
  type SlDeparture,
  type ShapedDeviation,
} from '../transit-model.js';
import { formatHm } from './hub-transit-card.js';
import type { HubConfig } from '../hub-config.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

const MAX_ROWS = 6;
const ON_TIME_STATES = new Set(['EXPECTED', 'ATSTOP']);

function isDelayed(d: SlDeparture): boolean {
  return typeof d.state === 'string' && d.state.length > 0 && !ON_TIME_STATES.has(d.state);
}

/**
 * Tap-the-transit-card popup: pendeltåg departures (both directions from
 * Nynäsgård), the next bus runs, and every active störning with SL's full
 * text. Each section degrades independently when its sensor is dead.
 */
export class HubTransitPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 560px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }

      .section + .section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--hub-card-border);
      }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 8px;
      }
      .empty {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Departure rows ─────────────────────────────────── */
      .dep-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-height: 30px;
      }
      .dep-time {
        flex-shrink: 0;
        width: 52px;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .dep-time.delayed {
        color: var(--hub-coral);
      }
      .dep-dest {
        flex: 1;
        min-width: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dep-in {
        flex-shrink: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .dep-in.delayed {
        color: var(--hub-coral);
      }

      /* ── Störningar ─────────────────────────────────────── */
      .stor + .stor {
        margin-top: 12px;
      }
      .stor-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .badge {
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .stor-header {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-coral);
      }
      .stor-details {
        margin-top: 4px;
        font: 400 13px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-muted);
        white-space: pre-line;
      }
      .stor-scope {
        margin-top: 3px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _departures(entity: string | undefined, line: string, exclude: string): SlDeparture[] {
    if (!entity) return [];
    const ent = this.getEntity(entity);
    const raw = (ent?.attributes.departures as SlDeparture[] | undefined) ?? [];
    return filterBusDepartures(raw, line, exclude).slice(0, MAX_ROWS);
  }

  private _depRow(d: SlDeparture): TemplateResult {
    const delayed = isDelayed(d);
    const hm = formatHm(d.expected ?? d.scheduled) ?? '–';
    return html`
      <div class="dep-row">
        <span class="dep-time ${delayed ? 'delayed' : ''}">${hm}</span>
        <span class="dep-dest">${d.destination ?? '–'}</span>
        <span class="dep-in ${delayed ? 'delayed' : ''}">${d.display ?? ''}</span>
      </div>
    `;
  }

  private _depSection(title: string, deps: SlDeparture[], emptyText: string): TemplateResult {
    return html`
      <div class="section">
        <div class="sec-title">${title}</div>
        ${deps.length
          ? deps.map((d) => this._depRow(d))
          : html`<div class="empty">${emptyText}</div>`}
      </div>
    `;
  }

  private _storSection(shaped: ShapedDeviation[]): TemplateResult | typeof nothing {
    if (shaped.length === 0) return nothing;
    return html`
      <div class="section">
        <div class="sec-title">Störningar</div>
        ${shaped.map(
          (s) => html`
            <div class="stor">
              <div class="stor-head">
                ${s.badges.map((b) => html`<span class="badge">${b}</span>`)}
                <span class="stor-header">${s.header}</span>
              </div>
              ${s.details ? html`<div class="stor-details">${s.details}</div>` : nothing}
              ${s.scope ? html`<div class="stor-scope">Berör: ${s.scope}</div>` : nothing}
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.config;

    const trains = this._departures(cfg.departures?.list_entity, '43', '');
    const busCfg = cfg.transit?.bus;
    const buses = busCfg
      ? this._departures(busCfg.entity, busCfg.line, busCfg.exclude_destination)
      : [];

    const devEnt = cfg.disturbances_entity ? this.getEntity(cfg.disturbances_entity) : undefined;
    const shaped =
      devEnt && devEnt.state !== 'unavailable' && devEnt.state !== 'unknown'
        ? shapeDeviations(devEnt.attributes.deviations)
        : [];

    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Resor och störningar">
          <div class="head">
            <span class="title">Resor & störningar</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${CLOSE_ICON}</button>
          </div>
          ${this._depSection('Pendeltåg', trains, '–')}
          ${this._depSection(busCfg?.label ?? 'Buss', buses, 'Inga avgångar idag')}
          ${this._storSection(shaped)}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-transit-popup', HubTransitPopup);
