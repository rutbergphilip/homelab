import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { healthCardStyles } from './health-card-styles.js';
import { numericState, seriesDelta } from '../health-model.js';
import type { SparkPoint } from './hub-sparkline.js';
import type { HubConfig } from '../hub-config.js';
import './hub-sparkline.js';

const KG_FMT = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const PCT_FMT = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const DAY_FMT = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * The Vikt page's own trend concept: kcal-assistant's `weight_trend` attribute
 * is the EWMA line, not raw weigh-ins. Reused here so the two pages cannot
 * disagree about the same number.
 */
export function weightSeries(attr: unknown): SparkPoint[] {
  if (!Array.isArray(attr)) return [];
  const points: SparkPoint[] = [];
  for (const row of attr) {
    if (typeof row !== 'object' || row === null) continue;
    const { date, kg } = row as { date?: unknown; kg?: unknown };
    if (typeof date !== 'string' || typeof kg !== 'number' || !Number.isFinite(kg)) continue;
    points.push({ date, value: kg });
  }
  return points;
}

/**
 * "senast vägd 26 juli", or "i dag" when that is today — a wall panel is read at
 * a glance and a date you have to decode is worse than a word.
 */
export function weighedLabel(date: string | null, today: string): string {
  if (!date) return 'aldrig vägd';
  if (date === today) return 'vägd i dag';
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return `vägd ${DAY_FMT.format(d).replace(/\.$/, '')}`;
}

export class HubBodyCard extends GlassBaseElement {
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
      /* Composition split: fat vs everything else, as one rail. Muscle is not
         shown as a third segment because Withings' fat + muscle + bone do not
         sum to body mass, and a bar with a gap invites the wrong question. */
      .comp {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .rail {
        display: flex;
        height: 9px;
        border-radius: var(--hub-radius-pill);
        overflow: hidden;
        background: var(--hub-track);
      }
      .seg-fat {
        height: 100%;
        background: var(--hub-amber);
        transition: width var(--hub-fade) ease;
      }
      .seg-lean {
        height: 100%;
        background: color-mix(in srgb, var(--hub-lavender) 55%, transparent);
        transition: width var(--hub-fade) ease;
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
      .sw-fat {
        background: var(--hub-amber);
      }
      .sw-lean {
        background: color-mix(in srgb, var(--hub-lavender) 55%, transparent);
      }
    `,
  ];

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-health-open', {
        detail: { section: 'body' },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): TemplateResult {
    const w = this.config?.health?.withings ?? {};
    const kcalEntity = this.config?.kcal?.forecast_entity;

    const fatPct = this._num(w.fat_pct_entity);
    const muscle = this._num(w.muscle_entity);

    // Headline weight comes from kcal-assistant (`current_kg`), NOT from
    // sensor.withings_vikt. The two diverge whenever the morning-window rule
    // declines a weigh-in — on 2026-07-26 the scale read 79.747 from a second
    // weigh-in at 10:55 while the recorded morning value was 79.91 — and a panel
    // showing one weight on the Kcal page and another here is simply wrong.
    // Body composition still comes live from the scale: kcal stores none of it.
    // Falls back through: current_kg attribute → the sensor's own state (which
    // is also current_kg) → the raw scale, so the card still shows something if
    // kcal-assistant is unreachable.
    const weight =
      (kcalEntity
        ? numericState(String(this.getEntityAttribute(kcalEntity, 'current_kg') ?? ''))
        : null) ??
      (kcalEntity ? numericState(this.getState(kcalEntity)) : null) ??
      this._num(w.weight_entity);

    // Trend and "senast vägd" come from the same record, so all three agree.
    const series = weightSeries(
      kcalEntity ? this.getEntityAttribute(kcalEntity, 'weight_trend') : undefined,
    );
    const summaryEntity = this.config?.kcal?.today_entity;
    const latestDate = kcalEntity
      ? ((this.getEntityAttribute(kcalEntity, 'latest_weight_date') as string | undefined) ?? null)
      : null;
    const today = (summaryEntity ? (this.getEntityAttribute(summaryEntity, 'date') as string) : '') ?? '';

    const leanPct = fatPct === null ? null : 100 - fatPct;

    return html`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Kropp</span>
        <div class="value-row">
          ${weight === null
            ? html`<span class="value dash">—</span>`
            : html`<span class="value">${KG_FMT.format(weight)}</span><span class="unit">kg</span>`}
        </div>

        <div class="facts">
          <span>${weighedLabel(latestDate, today)}</span>
          ${muscle === null
            ? nothing
            : html`<span class="sep">·</span><span>Muskler <b>${KG_FMT.format(muscle)} kg</b></span>`}
        </div>

        ${fatPct === null
          ? nothing
          : html`
              <div class="comp">
                <div class="rail">
                  <div class="seg-fat" style="width:${fatPct.toFixed(2)}%"></div>
                  <div class="seg-lean" style="width:${(leanPct ?? 0).toFixed(2)}%"></div>
                </div>
                <div class="legend">
                  <span><i class="swatch sw-fat"></i>Fett ${PCT_FMT.format(fatPct)} %</span>
                  <span><i class="swatch sw-lean"></i>Fettfritt ${PCT_FMT.format(leanPct ?? 0)} %</span>
                </div>
              </div>
            `}

        <div class="trend">
          ${series.length >= 2
            ? html`
                <hub-sparkline .points=${series} stroke="--hub-lavender" .height=${52}></hub-sparkline>
                <div class="trend-foot">
                  <span>Trendkurva ${series.length} vägningar</span>
                  ${(() => {
                    const delta = seriesDelta(series);
                    if (delta === null) return nothing;
                    // Down is progress on a cut, so the sign is stated plainly
                    // rather than colour-coded — the card should not editorialise.
                    return html`<span
                      >${delta < 0 ? '−' : '+'}${KG_FMT.format(Math.abs(delta))} kg</span
                    >`;
                  })()}
                </div>
              `
            : html`<span class="trend-empty">Samlar viktdata</span>`}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-body-card', HubBodyCard);
