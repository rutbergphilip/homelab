import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { filterBusDepartures, shapeDeviations, type SlDeparture } from '../transit-model.js';
import type { HubConfig } from '../hub-config.js';

const DEAD = new Set(['unavailable', 'unknown', '']);

/** ISO timestamp → local "HH:MM", or null when unparseable. */
export function formatHm(iso: string | undefined): string | null {
  if (!iso || DEAD.has(iso)) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const h = String(t.getHours()).padStart(2, '0');
  const m = String(t.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** How many bus departures to surface. */
const BUS_LIMIT = 3;

export class HubTransitCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        overflow: hidden;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        min-width: 0;
        flex: 1;
      }
      .row + .row {
        border-top: 1px solid var(--hub-card-border);
      }
      .ic {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .label {
        display: block;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sub.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
      .dep {
        color: var(--hub-text-muted);
      }
      .dep.delayed {
        color: var(--hub-coral);
      }
      .sep {
        color: var(--hub-text-dim);
        margin: 0 6px;
      }
      .alerts {
        flex-shrink: 0;
        border-top: 1px solid var(--hub-coral-border);
        background: var(--hub-coral-bg);
        padding: 6px 18px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .badge {
        flex-shrink: 0;
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .alert-text {
        flex: 1;
        min-width: 0;
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-coral);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  private _pendeltag() {
    const cfg = this.config.transit?.pendeltag;
    if (!cfg) return html`<span class="sub dim">–</span>`;
    const next = this.getEntity(cfg.next_entity);
    const hm = formatHm(next?.state);
    if (!hm) return html`<span class="sub dim">–</span>`;

    const countEnt = this.getEntity(cfg.count_entity);
    const count =
      countEnt && !Number.isNaN(Number(countEnt.state)) ? Number(countEnt.state) : null;
    const tail = count === null ? '' : ` · ${count} ${count === 1 ? 'avgång' : 'avgångar'}`;
    return html`<span class="sub">Nästa ${hm}${tail}</span>`;
  }

  private _bus() {
    const cfg = this.config.transit?.bus;
    if (!cfg) return html`<span class="sub dim">Inga avgångar idag</span>`;
    const ent = this.getEntity(cfg.entity);
    const raw = (ent?.attributes.departures as SlDeparture[] | undefined) ?? [];
    const deps = filterBusDepartures(raw, cfg.line, cfg.exclude_destination).slice(0, BUS_LIMIT);

    if (deps.length === 0) {
      return html`<span class="sub dim">Inga avgångar idag</span>`;
    }
    return html`<span class="sub"
      >${deps.map(
        (d, i) => html`${i > 0 ? html`<span class="sep">·</span>` : ''}<span
            class="dep ${d.state && d.state !== 'EXPECTED' ? 'delayed' : ''}"
            >${d.display ?? '–'}</span
          >`,
      )}</span
    >`;
  }

  private _alerts() {
    const ent = this.config.disturbances_entity
      ? this.getEntity(this.config.disturbances_entity)
      : undefined;
    if (!ent || ent.state === 'unavailable' || ent.state === 'unknown') return nothing;
    const shaped = shapeDeviations(ent.attributes.deviations);
    if (shaped.length === 0) return nothing;

    if (shaped.length === 1) {
      const d = shaped[0];
      return html`<div class="alerts">
        <div class="alert">
          ${d.badges.map((b) => html`<span class="badge">${b}</span>`)}
          <span class="alert-text">${d.header}</span>
        </div>
      </div>`;
    }
    const badges = [...new Set(shaped.flatMap((d) => d.badges))].sort();
    return html`<div class="alerts">
      <div class="alert">
        ${badges.map((b) => html`<span class="badge">${b}</span>`)}
        <span class="alert-text">${shaped.length} störningar</span>
      </div>
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const busLabel = this.config.transit?.bus?.label ?? 'Buss';
    return html`
      <div class="card">
        <div class="row">
          <span class="ic">${icons.train}</span>
          <div class="meta">
            <b class="label">Pendeltåg</b>
            ${this._pendeltag()}
          </div>
        </div>
        <div class="row">
          <span class="ic">${icons.bus}</span>
          <div class="meta">
            <b class="label">${busLabel}</b>
            ${this._bus()}
          </div>
        </div>
        ${this._alerts()}
      </div>
    `;
  }
}

customElements.define('hub-transit-card', HubTransitCard);
