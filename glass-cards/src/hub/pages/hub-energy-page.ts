import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { buildEnergyModel, hasSpotSeries, type EnergyModel, type PriceView } from '../energy-model.js';
import { getStoredPriceView, setStoredPriceView, gridAddOre } from '../price-view.js';
import type { HubConfig } from '../hub-config.js';
import type { HubChipTone } from '../widgets/hub-status-chip.js';
import '../widgets/hub-price-chart.js';
import '../widgets/hub-status-chip.js';

const LEVEL_WORD: Record<EnergyModel['level'], string> = {
  låg: 'lågt',
  normal: 'normalt',
  hög: 'högt',
};

interface EnergyChip {
  icon: string;
  label: string;
  tone: HubChipTone;
}

export class HubEnergyPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  // Advance the current hour without waiting on a state push.
  @state() private _now = new Date();
  @state() private _view: PriceView = getStoredPriceView();
  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }

      /* ── Header: the current price, oversized ─────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 8px;
      }
      .view-toggle {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
      }
      .view-toggle button {
        min-height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: var(--hub-radius-pill);
        background: transparent;
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 150ms ease, color 150ms ease;
      }
      .view-toggle button.sel {
        background: var(--hub-green-bg);
        color: var(--hub-green);
      }
      .head-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .price {
        display: flex;
        align-items: baseline;
        gap: 12px;
        line-height: 1;
      }
      .price-num {
        font: 200 clamp(56px, 8vw, 76px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        transition: color var(--hub-fade) ease;
        font-variant-numeric: tabular-nums;
      }
      .price-num.low {
        color: var(--hub-green);
      }
      .price-num.high {
        color: var(--hub-coral);
      }
      .price-unit {
        font: 400 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline {
        margin-top: 6px;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline .accent-low {
        color: var(--hub-green);
        font-weight: 600;
      }
      .subline .accent-high {
        color: var(--hub-coral);
        font-weight: 600;
      }

      /* ── Chart fills the middle ───────────────────────────── */
      .chart-wrap {
        flex: 1;
        min-height: 0;
        margin: 12px 0 16px;
      }
      .waiting {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font: 400 clamp(16px, 2.4vw, 22px) var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }

      /* ── Bottom chips ─────────────────────────────────────── */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-bottom: 44px; /* clear the page dots */
      }

      @media (max-width: 600px) {
        .head-row {
          flex-wrap: wrap;
          gap: 10px;
        }
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
    const attrs = ent.attributes as Record<string, unknown>;
    let model = buildEnergyModel(
      attrs, ent.state, this._now, this._view,
      this._view === 'allin' ? gridAddOre(this.config) : 0,
    );
    if (this._view === 'spot' && !hasSpotSeries(model)) {
      // sensor not migrated yet — fall back to the allt-in series
      model = buildEnergyModel(attrs, ent.state, this._now, 'allin', gridAddOre(this.config));
    }
    return model;
  }

  private _setView(v: PriceView): void {
    this._view = v;
    setStoredPriceView(v);
  }

  /** Current price in öre: the series' current hour, else the Tibber sensor. */
  private _currentOre(model: EnergyModel | null): number | null {
    if (model?.now) return Math.round(model.now.ore);
    const ent = this.config.price_entity ? this.getEntity(this.config.price_entity) : undefined;
    if (ent && !Number.isNaN(Number(ent.state))) return Math.round(Number(ent.state) * 100);
    return null;
  }

  private _chips(model: EnergyModel | null): EnergyChip[] {
    const cfg = this.config;
    const chips: EnergyChip[] = [];

    const co2 = cfg.co2_entity ? this.getEntity(cfg.co2_entity) : undefined;
    if (co2 && !Number.isNaN(Number(co2.state))) {
      chips.push({ icon: 'leaf', label: `${Math.round(Number(co2.state))} g CO₂`, tone: 'green' });
    }

    const fossil = cfg.fossil_entity ? this.getEntity(cfg.fossil_entity) : undefined;
    if (fossil && !Number.isNaN(Number(fossil.state))) {
      const pct = Math.round(Number(fossil.state));
      // Low fossil share is the good case → green; a high share reads as a warning.
      chips.push({
        icon: 'leaf',
        label: `${pct} % fossilt`,
        tone: pct >= 40 ? 'coral' : 'green',
      });
    }

    const win = model?.cheapestWindow;
    if (win) {
      const from = win.start.getHours();
      const to = win.end.getHours();
      chips.push({ icon: 'clock', label: `Billigast ${from}–${to}`, tone: 'green' });
    }

    return chips;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    const model = this._model();
    const ore = this._currentOre(model);
    const level = model?.now ? model.level : 'normal';
    const hasChart = !!model && model.today.length > 0;
    const chips = this._chips(model);
    const spotAvailable = !!model && hasSpotSeries(model);

    const numClass = level === 'låg' ? 'low' : level === 'hög' ? 'high' : '';
    const showWord = !!model?.now && level !== 'normal';

    return html`
      <div class="page">
        <div class="header">
          <div class="head-row">
            <div>
              <div class="price">
                <span class="price-num ${numClass}">${ore === null ? '—' : ore}</span>
                <span class="price-unit">öre/kWh</span>
              </div>
              <div class="subline">
                ${this._view === 'spot' ? 'spotpris' : 'allt-in'} just nu${showWord
                  ? html` ·
                      <span class=${level === 'låg' ? 'accent-low' : 'accent-high'}
                        >${LEVEL_WORD[level]}</span
                      >`
                  : nothing}
              </div>
            </div>
            ${spotAvailable
              ? html`<div class="view-toggle">
                  <button
                    class=${this._view === 'spot' ? 'sel' : ''}
                    @click=${() => this._setView('spot')}
                  >
                    Spot
                  </button>
                  <button
                    class=${this._view === 'allin' ? 'sel' : ''}
                    @click=${() => this._setView('allin')}
                  >
                    Allt-in
                  </button>
                </div>`
              : nothing}
          </div>
        </div>

        <div class="chart-wrap">
          ${hasChart
            ? html`<hub-price-chart .model=${model} .gridAddOre=${gridAddOre(this.config)}></hub-price-chart>`
            : html`<div class="waiting">Väntar på prisdata</div>`}
        </div>

        <div class="chips">
          ${chips.map(
            (c) => html`
              <hub-status-chip
                .icon=${c.icon}
                .label=${c.label}
                .tone=${c.tone}
                active
              ></hub-status-chip>
            `,
          )}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-energy-page', HubEnergyPage);
