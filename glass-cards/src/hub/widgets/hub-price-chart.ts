import { html, css, nothing, LitElement, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { hubTokens } from '../../styles/tokens.js';
import { priceBreakdown, type EnergyModel, type HourPrice } from '../energy-model.js';

type Slot =
  | { kind: 'bar'; hour: HourPrice; cls: string; label: string | null }
  | { kind: 'divider' };

const MIN_BAR = 0.14; // shortest bar as a fraction of the plot height

/**
 * 24–48 hourly price bars. Height encodes price (shared scale across today +
 * tomorrow); colour encodes time and cheapness — past hours recede, the current
 * hour is solid green with a floating öre label, future hours tint greener the
 * cheaper they are, and the cheapest contiguous 3h window is outlined.
 */
export class HubPriceChart extends LitElement {
  @property({ attribute: false }) model!: EnergyModel;
  @property({ type: Number }) gridAddOre = 0;
  @state() private _detail: number | null = null; // slot index of the open flyout
  private _detailTimer?: number;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._detailTimer !== undefined) {
      clearTimeout(this._detailTimer);
      this._detailTimer = undefined;
    }
  }

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .chart {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .plot {
        flex: 1;
        min-height: 0;
        display: grid;
        align-items: end;
        gap: 3px;
      }
      .cell {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .bar {
        width: 100%;
        border-radius: 4px 4px 2px 2px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .cell.past .bar {
        background: var(--hub-text-dim);
        opacity: 0.3;
      }
      .cell.current .bar {
        background: var(--hub-green);
        box-shadow: 0 0 16px var(--hub-green-border);
      }
      .cell.cheap .bar {
        outline: 1.5px solid var(--hub-green);
        outline-offset: 1px;
      }
      .cell-label {
        position: absolute;
        bottom: calc(var(--bar-h) + 8px);
        left: 50%;
        transform: translateX(-50%);
        font: 600 13px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
        letter-spacing: -0.01em;
      }
      .divider {
        width: 1px;
        justify-self: center;
        height: 82%;
        align-self: center;
        background: var(--hub-card-border);
      }

      .axis {
        display: grid;
        gap: 3px;
      }
      .tick {
        text-align: center;
        font: 500 10.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
        overflow: visible;
      }
      .tick.day {
        color: var(--hub-text-muted);
        font-weight: 600;
      }
      .cell {
        cursor: pointer;
      }
      .flyout {
        position: absolute;
        bottom: calc(var(--bar-h) + 10px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        min-width: 132px;
        padding: 10px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        pointer-events: none;
      }
      .flyout.edge-l {
        left: 0;
        transform: none;
      }
      .flyout.edge-r {
        left: auto;
        right: 0;
        transform: none;
      }
      .fly-hour {
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
      }
      .fly-price {
        margin-top: 2px;
        font: 600 17px var(--hub-font-display);
        color: var(--hub-text);
        white-space: nowrap;
      }
      .fly-rows {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .fly-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  private _slots(): Slot[] {
    const m = this.model;
    const today = m?.today ?? [];
    const tomorrow = m?.tomorrow ?? [];
    const nowMs = m?.now ? m.now.start.getTime() : null;
    const win = m?.cheapestWindow;
    const winStart = win ? win.start.getTime() : null;
    const winEnd = win ? win.end.getTime() : null;

    const classify = (h: HourPrice): Slot => {
      const t = h.start.getTime();
      let cls = 'future';
      let label: string | null = null;
      if (nowMs !== null) {
        if (t < nowMs) cls = 'past';
        else if (t === nowMs) {
          cls = 'current';
          label = String(Math.round(h.ore));
        }
      }
      if (winStart !== null && t >= winStart && t < winEnd!) cls += ' cheap';
      return { kind: 'bar', hour: h, cls, label };
    };

    const slots: Slot[] = today.map(classify);
    if (tomorrow.length) {
      slots.push({ kind: 'divider' });
      for (const h of tomorrow) slots.push(classify(h));
    }
    return slots;
  }

  private _toggleDetail(idx: number): void {
    this._detail = this._detail === idx ? null : idx;
    if (this._detailTimer !== undefined) clearTimeout(this._detailTimer);
    if (this._detail !== null) {
      this._detailTimer = window.setTimeout(() => {
        this._detail = null;
        this._detailTimer = undefined;
      }, 6000);
    }
  }

  private _bounds(): { min: number; max: number } {
    const all = [...(this.model?.today ?? []), ...(this.model?.tomorrow ?? [])].map((h) => h.ore);
    return { min: Math.min(...all), max: Math.max(...all) };
  }

  private _height(ore: number, min: number, max: number): number {
    const span = max - min;
    if (!Number.isFinite(span) || span <= 0) return 60;
    return (MIN_BAR + (1 - MIN_BAR) * ((ore - min) / span)) * 100;
  }

  /** Cheaper future hours read greener; expensive ones fade toward the track. */
  private _tint(ore: number, min: number, max: number): string {
    const span = max - min;
    const cheapness = span > 0 ? (max - ore) / span : 0.5; // 1 = cheapest
    const pct = Math.round(22 + cheapness * 58); // 22%..80% green over track
    return `color-mix(in srgb, var(--hub-green) ${pct}%, var(--hub-track))`;
  }

  /**
   * One span per column (keeps the axis grid aligned with the bars); the label
   * is shown only at 00/06/12/18, with midnight doubling as a day marker.
   */
  private _tick(h: HourPrice): TemplateResult {
    const hr = h.start.getHours();
    const show = hr % 6 === 0;
    return html`<span class="tick ${hr === 0 ? 'day' : ''}"
      >${show ? String(hr).padStart(2, '0') : ''}</span
    >`;
  }

  private _flyout(h: HourPrice, idx: number, count: number): TemplateResult {
    const from = String(h.start.getHours()).padStart(2, '0');
    const to = String((h.start.getHours() + 1) % 24).padStart(2, '0');
    const edge = idx < 2 ? 'edge-l' : idx > count - 3 ? 'edge-r' : '';
    const bd = priceBreakdown(h, this.gridAddOre);
    return html`
      <div class="flyout ${edge}">
        <div class="fly-hour">${from}–${to}</div>
        <div class="fly-price">${Math.round(h.ore)} öre/kWh</div>
        ${bd
          ? html`<div class="fly-rows">
              <div class="fly-row"><span>Spot</span><span>${Math.round(bd.spot)} öre</span></div>
              <div class="fly-row"><span>Skatt &amp; moms</span><span>${Math.round(bd.taxes)} öre</span></div>
              <div class="fly-row"><span>Elnät</span><span>${Math.round(bd.grid)} öre</span></div>
            </div>`
          : nothing}
      </div>
    `;
  }

  render() {
    if (!this.model || this.model.today.length === 0) return html``;
    const slots = this._slots();
    const { min, max } = this._bounds();

    // Bars get equal fractional columns; the divider gets a hairline column.
    const cols = slots.map((s) => (s.kind === 'divider' ? '8px' : 'minmax(0, 1fr)')).join(' ');

    return html`
      <div class="chart">
        <div class="plot" style="grid-template-columns:${cols}">
          ${slots.map((s, i) => {
            if (s.kind === 'divider') return html`<div class="divider"></div>`;
            const h = this._height(s.hour.ore, min, max);
            // Future bars carry the cheapness tint; past/current use their class colours.
            const bg = s.cls.startsWith('future')
              ? `background:${this._tint(s.hour.ore, min, max)}`
              : '';
            return html`
              <div
                class="cell ${s.cls}"
                style="--bar-h:${h}%"
                @click=${() => this._toggleDetail(i)}
              >
                ${this._detail === i ? this._flyout(s.hour, i, slots.length) : nothing}
                ${s.label && this._detail !== i
                  ? html`<span class="cell-label">${s.label}</span>`
                  : nothing}
                <div class="bar" style="height:${h}%;${bg}"></div>
              </div>
            `;
          })}
        </div>
        <div class="axis" style="grid-template-columns:${cols}">
          ${slots.map((s) => (s.kind === 'divider' ? html`<span></span>` : this._tick(s.hour)))}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-price-chart', HubPriceChart);
