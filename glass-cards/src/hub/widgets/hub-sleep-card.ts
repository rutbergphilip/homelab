import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { healthCardStyles } from './health-card-styles.js';
import { scoreTone, formatSleepDuration, numericState, metricSeries } from '../health-model.js';
import type { HubConfig } from '../hub-config.js';
import './hub-sparkline.js';

const HOUR_FMT = new Intl.DateTimeFormat('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Stockholm',
});

/** "22:46" from an ISO timestamp, or '' when unparseable. */
export function clockTime(iso: string | undefined): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : HOUR_FMT.format(new Date(t));
}

interface Stage {
  key: string;
  label: string;
  hours: number;
}

/**
 * Stage split as fractions of the summed stage time — NOT of total sleep. Oura's
 * stage durations do not always add up to the headline figure, and normalising
 * against the headline would leave a mystery gap in the bar.
 */
export function stageFractions(stages: Stage[]): Array<Stage & { pct: number }> {
  const total = stages.reduce((sum, s) => sum + s.hours, 0);
  if (total <= 0) return [];
  return stages.map((s) => ({ ...s, pct: (s.hours / total) * 100 }));
}

export class HubSleepCard extends GlassBaseElement {
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

      /* Stage bar: deep / rem / light as one continuous rail. Rounded ends on
         the rail rather than per-segment so it reads as a single night. */
      .stages {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .rail {
        display: flex;
        height: 9px;
        border-radius: var(--hub-radius-pill);
        overflow: hidden;
        background: var(--hub-track);
      }
      .seg {
        height: 100%;
        /* Values shift once a night; animating avoids a jarring snap when the
           morning sync lands while the panel is being looked at. */
        transition: width var(--hub-fade) ease;
      }
      .seg-deep {
        background: var(--hub-lavender);
      }
      .seg-rem {
        background: color-mix(in srgb, var(--hub-lavender) 62%, transparent);
      }
      .seg-light {
        background: color-mix(in srgb, var(--hub-lavender) 28%, transparent);
      }
      .legend {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 10px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .sw-deep {
        background: var(--hub-lavender);
      }
      .sw-rem {
        background: color-mix(in srgb, var(--hub-lavender) 62%, transparent);
      }
      .sw-light {
        background: color-mix(in srgb, var(--hub-lavender) 28%, transparent);
      }
    `,
  ];

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-health-open', {
        detail: { section: 'sleep' },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): TemplateResult {
    const oura = this.config?.health?.oura ?? {};
    const durationH = this._num(oura.sleep_duration_entity);
    const score = this._num(oura.sleep_score_entity);
    const tone = scoreTone(score);

    // The duration sensor reports HOURS; the shared formatter takes minutes.
    const minutes = durationH === null ? null : Math.round(durationH * 60);

    const stages = stageFractions(
      [
        { key: 'deep', label: 'Djup', hours: this._num(oura.deep_entity) ?? 0 },
        { key: 'rem', label: 'REM', hours: this._num(oura.rem_entity) ?? 0 },
        { key: 'light', label: 'Lätt', hours: this._num(oura.light_entity) ?? 0 },
      ].filter((s) => s.hours > 0),
    );

    const bedtime = clockTime(
      oura.bedtime_start_entity ? this.getState(oura.bedtime_start_entity) : undefined,
    );
    const wake = clockTime(
      oura.bedtime_end_entity ? this.getState(oura.bedtime_end_entity) : undefined,
    );
    const efficiency = this._num(oura.efficiency_entity);

    const series = metricSeries(
      this.config?.health?.history_entity
        ? this.getEntityAttribute(this.config.health.history_entity, 'days')
        : undefined,
      'sleep_score',
    );

    return html`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Sömn</span>
        <div class="value-row">
          <span class="value">${formatSleepDuration(minutes)}</span>
          ${score === null
            ? nothing
            : html`<span class="score tone-${tone}"
                ><span class="score-label">poäng</span>${Math.round(score)}</span
              >`}
        </div>

        <div class="facts">
          ${bedtime && wake
            ? html`<span>${bedtime}&thinsp;–&thinsp;${wake}</span>`
            : html`<span class="dash">Ingen sömndata</span>`}
          ${efficiency === null
            ? nothing
            : html`<span class="sep">·</span><span>Effektivitet <b>${Math.round(efficiency)} %</b></span>`}
        </div>

        ${stages.length > 0
          ? html`
              <div class="stages">
                <div class="rail">
                  ${stages.map(
                    (s) => html`<div class="seg seg-${s.key}" style="width:${s.pct.toFixed(2)}%"></div>`,
                  )}
                </div>
                <div class="legend">
                  ${stages.map(
                    (s) => html`<span
                      ><i class="swatch sw-${s.key}"></i>${s.label}
                      ${formatSleepDuration(Math.round(s.hours * 60))}</span
                    >`,
                  )}
                </div>
              </div>
            `
          : nothing}

        <div class="trend">
          ${series.length >= 2
            ? html`
                <hub-sparkline
                  .points=${series}
                  stroke=${tone === 'neutral' ? '--hub-lavender' : `--hub-${tone}`}
                  .height=${52}
                ></hub-sparkline>
                <div class="trend-foot">
                  <span>Sömnpoäng ${series.length} dagar</span>
                  <span>${Math.round(series[series.length - 1].value)}</span>
                </div>
              `
            : html`<span class="trend-empty">Samlar sömnhistorik</span>`}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-sleep-card', HubSleepCard);
