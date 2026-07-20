import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { buildEnergyModel, next12Hours, type EnergyModel } from '../energy-model.js';
import { getStoredPriceView, gridAddOre } from '../price-view.js';
import type { HubConfig } from '../hub-config.js';

const LEVEL_WORD: Record<EnergyModel['level'], string> = {
  låg: 'lågt',
  normal: 'normalt',
  hög: 'högt',
};

// Shortest bar as a fraction of the plot height, so a cheap hour still reads as
// a mark rather than vanishing.
const MIN_BAR = 0.2;

/**
 * Compact Hem energy card: the current öre price up front, a slim 12-hour
 * forward sparkline (current hour lit, cheapest window tinted green), and a
 * "Billigast HH–HH" hint. Tapping opens the Energi page. Falls back to a quiet
 * "Väntar på prisdata" with the bare current price until the series sensor is
 * live.
 */
export class HubEnergyStrip extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  // Advance the current hour without waiting on a state push, mirroring the
  // Energi page's own tick.
  @state() private _now = new Date();
  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 18px;
        text-align: left;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        color: inherit;
        font-family: var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: border-color 150ms ease;
      }
      .card:focus-visible {
        outline: 2px solid var(--hub-green-border);
        outline-offset: 2px;
      }

      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }
      .lead {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
      }
      .ic {
        align-self: center;
        display: flex;
        width: 15px;
        height: 15px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .ic svg {
        width: 100%;
        height: 100%;
      }
      .num {
        font: 300 clamp(30px, 4vw, 40px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        transition: color var(--hub-fade) ease;
      }
      .num.low {
        color: var(--hub-green);
      }
      .num.high {
        color: var(--hub-coral);
      }
      .unit {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .level {
        font: 600 13px var(--hub-font-body);
      }
      .level.low {
        color: var(--hub-green);
      }
      .level.high {
        color: var(--hub-coral);
      }
      .hint {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
      }
      .hint .ic {
        width: 13px;
        height: 13px;
        color: var(--hub-green);
      }

      /* ── Slim 12h forward sparkline ────────────────────────── */
      .bars {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        gap: 3px;
      }
      .bar {
        flex: 1;
        min-width: 0;
        border-radius: 3px 3px 1px 1px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .bar.cheap {
        background: color-mix(in srgb, var(--hub-green) 45%, var(--hub-track));
      }
      .bar.current {
        background: var(--hub-green);
        box-shadow: 0 0 12px var(--hub-green-border);
      }

      .waiting {
        flex: 1;
        display: flex;
        align-items: center;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = new Date();
    }, 60000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  /** Series model from the REST sensor, or null until it is live. */
  private _model(): EnergyModel | null {
    const ent = this.config.price_series_entity
      ? this.getEntity(this.config.price_series_entity)
      : undefined;
    if (!ent) return null;
    const view = getStoredPriceView();
    const attrs = ent.attributes as Record<string, unknown>;
    const model = buildEnergyModel(
      attrs, ent.state, this._now, view,
      view === 'allin' ? gridAddOre(this.config) : 0,
    );
    if (view === 'spot' && model.today.length && model.today.some((h) => h.spotOre === null)) {
      return buildEnergyModel(attrs, ent.state, this._now, 'allin', gridAddOre(this.config));
    }
    return model;
  }

  /** Current price in öre: the series' current hour, else the Tibber sensor. */
  private _currentOre(model: EnergyModel | null): number | null {
    if (model?.now) return Math.round(model.now.ore);
    const ent = this.config.price_entity ? this.getEntity(this.config.price_entity) : undefined;
    if (ent && !Number.isNaN(Number(ent.state))) return Math.round(Number(ent.state) * 100);
    return null;
  }

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: 'energi' },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _bars(model: EnergyModel): TemplateResult {
    const hours = next12Hours(model, this._now);
    if (hours.length === 0) return html`<div class="waiting">Väntar på prisdata</div>`;

    const values = hours.map((h) => h.ore);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const height = (ore: number): number =>
      span > 0 ? (MIN_BAR + (1 - MIN_BAR) * ((ore - min) / span)) * 100 : 60;

    return html`<div class="bars">
      ${hours.map(
        (h) => html`<div
          class="bar ${h.current ? 'current' : h.cheap ? 'cheap' : ''}"
          style="height:${height(h.ore).toFixed(1)}%"
        ></div>`,
      )}
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const model = this._model();
    const ore = this._currentOre(model);
    const hasSeries = !!model && model.today.length > 0;
    const level = model?.now ? model.level : 'normal';
    const levelCls = level === 'låg' ? 'low' : level === 'hög' ? 'high' : '';
    const showWord = hasSeries && !!model?.now && level !== 'normal';

    const win = model?.cheapestWindow;
    const hint = win
      ? html`<span class="hint"
          ><span class="ic">${icons.clock}</span>Billigast ${win.start.getHours()}–${win.end.getHours()}</span
        >`
      : nothing;

    const label =
      ore === null
        ? 'Elpris, öppna energisidan'
        : `Elpris ${ore} öre just nu${showWord ? `, ${LEVEL_WORD[level]}` : ''}, öppna energisidan`;

    return html`
      <button class="card" aria-label=${label} @click=${this._open}>
        <div class="head">
          <div class="lead">
            <span class="ic">${icons.bolt}</span>
            <span class="num ${levelCls}">${ore === null ? '—' : ore}</span>
            <span class="unit">öre</span>
            ${showWord
              ? html`<span class="level ${levelCls}">· ${LEVEL_WORD[level]}</span>`
              : nothing}
          </div>
          ${hint}
        </div>
        ${hasSeries
          ? this._bars(model!)
          : html`<div class="waiting">Väntar på prisdata</div>`}
      </button>
    `;
  }
}

customElements.define('hub-energy-strip', HubEnergyStrip);
