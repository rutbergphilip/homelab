import { html, css, nothing, LitElement, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { hubTokens } from '../../styles/tokens.js';
import type { SystemTone } from '../system-model.js';

export interface SystemRow {
  key: string;
  value: string;
  tone?: SystemTone; // only for values that can genuinely be good or bad
}

export interface SystemCardModel {
  section: string; // hub-system-open detail
  eyebrow: string;
  value: string; // headline
  unit?: string;
  pill?: { label: string; tone: SystemTone };
  bar?: { pct: number; tone: SystemTone; label: string }; // e.g. volume fill
  rows: SystemRow[];
}

/**
 * One card component for all four System tiles. They are the same shape — an
 * eyebrow, one headline number, an optional verdict pill, an optional fill bar
 * and a few label/value rows — so the page builds four descriptors from the
 * model and this renders them. Surfaces stay neutral (the System page has no
 * domain colour: infrastructure is not a mood); green/amber/coral appear only
 * on values that can be good or bad.
 */
export class HubSystemCard extends LitElement {
  @property({ attribute: false }) model!: SystemCardModel;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(14px, 2vh, 26px) clamp(18px, 2.2vw, 30px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      .card:active {
        transform: scale(0.995);
      }
      .eyebrow {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .value-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-top: 6px;
        flex-wrap: wrap;
      }
      .value {
        font: 200 clamp(34px, min(5.2vw, 6.4vh), 58px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .value.dash {
        color: var(--hub-text-dim);
      }
      .unit {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .pill {
        display: inline-flex;
        align-items: baseline;
        padding: 5px 11px;
        border-radius: var(--hub-radius-pill);
        font: 600 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
      .tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }

      .bar {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .bar-track {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 3px;
        background: var(--hub-text-muted);
        transition: width 400ms ease;
      }
      .bar-fill.tone-green {
        background: var(--hub-green);
      }
      .bar-fill.tone-amber {
        background: var(--hub-amber);
      }
      .bar-fill.tone-coral {
        background: var(--hub-coral);
      }
      .bar-label {
        margin-top: 6px;
        font: 500 11.5px var(--hub-font-body);
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }

      .rows {
        margin-top: auto;
        padding-top: clamp(10px, 1.6vh, 16px);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .row b {
        font: 600 14.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      /* Row values only take a semantic colour when the tone is not green:
         a card full of green numbers is noise, one amber number is a signal. */
      .row b.tone-amber {
        color: var(--hub-amber-text);
      }
      .row b.tone-coral {
        color: var(--hub-coral);
      }
    `,
  ];

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-system-open', {
        detail: { section: this.model?.section },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): TemplateResult {
    const m = this.model;
    if (!m) return html``;
    return html`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">${m.eyebrow}</span>
        <div class="value-row">
          <span class="value ${m.value === '–' ? 'dash' : ''}">${m.value}</span>
          ${m.unit && m.value !== '–' ? html`<span class="unit">${m.unit}</span>` : nothing}
          ${m.pill ? html`<span class="pill tone-${m.pill.tone}">${m.pill.label}</span>` : nothing}
        </div>
        ${m.bar
          ? html`<div class="bar">
              <div class="bar-track">
                <div
                  class="bar-fill tone-${m.bar.tone}"
                  style="width:${Math.max(0, Math.min(100, m.bar.pct))}%"
                ></div>
              </div>
              <div class="bar-label">${m.bar.label}</div>
            </div>`
          : nothing}
        <div class="rows">
          ${m.rows.map(
            (r) => html`<div class="row">
              <span>${r.key}</span>
              <b class=${r.tone && r.tone !== 'green' && r.tone !== 'neutral' ? `tone-${r.tone}` : ''}>${r.value}</b>
            </div>`,
          )}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-system-card', HubSystemCard);
