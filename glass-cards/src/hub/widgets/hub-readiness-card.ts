import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { healthCardStyles } from './health-card-styles.js';
import { scoreTone, numericState, metricSeries, seriesAverage } from '../health-model.js';
import type { HubConfig } from '../hub-config.js';
import './hub-sparkline.js';

const ONE_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });

/**
 * "+0,3 över snittet" — a score alone is unanchored; against its own 14-day mean
 * it becomes a judgement. Returns '' when there is nothing to compare with.
 */
export function baselineNote(latest: number | null, average: number | null): string {
  if (latest === null || average === null) return '';
  const delta = latest - average;
  if (Math.abs(delta) < 1) return 'som snittet';
  return `${delta > 0 ? '+' : '−'}${ONE_DEC.format(Math.abs(delta))} mot snittet`;
}

export class HubReadinessCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    healthCardStyles,
    css`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        height: 100%;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      /* Press feedback only — no hover lift: this is a wall panel, and a
         hover state that never fires on glass is dead code. */
      .card:active {
        transform: scale(0.995);
      }
      /* Contributor rows: the three numbers that explain the score. Laid out as
         a label/value pair per row so the values form a readable column. */
      .rows {
        margin-top: clamp(10px, 1.6vh, 16px);
        display: flex;
        flex-direction: column;
        gap: 9px;
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
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .baseline {
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        margin-top: 8px;
      }
    `,
  ];

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-health-open', {
        detail: { section: 'readiness' },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): TemplateResult {
    const oura = this.config?.health?.oura ?? {};
    const score = this._num(oura.readiness_score_entity);
    const tone = scoreTone(score);
    const hrv = this._num(oura.hrv_entity);
    const restingHr = this._num(oura.resting_hr_entity);
    const tempDev = this._num(oura.temp_deviation_entity);

    const series = metricSeries(
      this.config?.health?.history_entity
        ? this.getEntityAttribute(this.config.health.history_entity, 'days')
        : undefined,
      'readiness_score',
    );
    const note = baselineNote(score, seriesAverage(series));

    return html`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Beredskap</span>
        <div class="value-row">
          ${score === null
            ? html`<span class="value dash">—</span>`
            : html`<span class="value">${Math.round(score)}</span>
                <span class="score tone-${tone}">${
                  tone === 'green' ? 'Optimal' : tone === 'amber' ? 'Bra' : 'Ta det lugnt'
                }</span>`}
        </div>
        ${note ? html`<div class="baseline">${note}</div>` : nothing}

        <div class="rows">
          <div class="row">
            <span>HRV under sömn</span>
            <b>${hrv === null ? html`<span class="dash">—</span>` : `${Math.round(hrv)} ms`}</b>
          </div>
          <div class="row">
            <span>Vilopuls</span>
            <b>
              ${restingHr === null ? html`<span class="dash">—</span>` : `${Math.round(restingHr)} slag/min`}
            </b>
          </div>
          <div class="row">
            <span>Kroppstemperatur</span>
            <b>
              ${tempDev === null
                ? html`<span class="dash">—</span>`
                : `${tempDev > 0 ? '+' : tempDev < 0 ? '−' : ''}${ONE_DEC.format(Math.abs(tempDev))} °C`}
            </b>
          </div>
        </div>

        <div class="trend">
          ${series.length >= 2
            ? html`
                <hub-sparkline
                  .points=${series}
                  stroke=${tone === 'neutral' ? '--hub-lavender' : `--hub-${tone}`}
                  .height=${52}
                ></hub-sparkline>
                <div class="trend-foot">
                  <span>Beredskap ${series.length} dagar</span>
                  <span>${Math.round(series[series.length - 1].value)}</span>
                </div>
              `
            : html`<span class="trend-empty">Samlar beredskapshistorik</span>`}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-readiness-card', HubReadinessCard);
