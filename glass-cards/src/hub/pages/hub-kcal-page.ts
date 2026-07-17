import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { kcalPct } from '../widgets/hub-kcal-ring.js';
import type { SparkPoint } from '../widgets/hub-sparkline.js';
import type { HubConfig } from '../hub-config.js';
import '../widgets/hub-sparkline.js';

const NUM_FMT = new Intl.NumberFormat('sv-SE');
const KG_FMT = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const GOAL_FMT = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const SHORT_DATE = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const LONG_DATE = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const MINUS = '−';

/** A date-only ISO string → Swedish short form ("29 sep"), or '' if unparseable. */
export function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  // sv-SE abbreviates most months with a trailing dot ("sep.") — drop it.
  return SHORT_DATE.format(d).replace(/\.$/, '');
}

export interface ForecastData {
  goal_kg?: number;
  eta?: string;
  eta_early?: string;
  eta_late?: string;
  on_track?: boolean;
}

/** "Mål 71 kg · ETA 29 sep (11 sep–2 nov)", degrading gracefully as fields drop out. */
export function forecastLine(f: ForecastData): string {
  const goal = typeof f.goal_kg === 'number' ? `Mål ${GOAL_FMT.format(f.goal_kg)} kg` : '';
  const etaShort = f.eta ? formatShortDate(f.eta) : '';
  const range =
    f.eta_early && f.eta_late
      ? `${formatShortDate(f.eta_early)}–${formatShortDate(f.eta_late)}`
      : '';
  const eta = etaShort ? `ETA ${etaShort}${range ? ` (${range})` : ''}` : '';
  return [goal, eta].filter(Boolean).join(' · ');
}

interface Meal {
  name: string;
  kcal: number;
}

export class HubKcalPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      /* ── Header ────────────────────────────────────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Swedish keeps weekdays/months lowercase — only lift the leading letter. */
      .subtitle::first-letter {
        text-transform: uppercase;
      }

      /* ── Two-column deck ───────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--hub-gap);
      }
      /* Stack only on genuinely narrow / portrait panels; landscape walls keep
         both columns side by side and fit without vertical scroll. */
      @media (max-width: 760px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .card {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(20px, 2.6vw, 34px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }

      /* ── Left: kcal ring + protein + meals ─────────────────── */
      .ring-wrap {
        position: relative;
        width: clamp(176px, 23vh, 236px);
        aspect-ratio: 1;
        margin: 2px auto 0;
        flex-shrink: 0;
      }
      .ring-glow {
        position: absolute;
        inset: -6%;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          color-mix(in srgb, var(--hub-lavender) 20%, transparent),
          transparent 68%
        );
        filter: blur(10px);
      }
      .ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        transition: --pct var(--hub-fade) ease;
      }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .kc-num {
        font: 200 clamp(42px, 6vw, 62px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .kc-target {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        font-variant-numeric: tabular-nums;
      }
      .kc-remain {
        margin: 12px auto 0;
        text-align: center;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }

      .metric {
        margin-top: clamp(18px, 2.6vh, 30px);
        flex-shrink: 0;
      }
      .metric-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;
      }
      .metric-label {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-muted);
      }
      .metric-val {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .bar {
        height: 8px;
        border-radius: 99px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 99px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--hub-lavender) 62%, transparent),
          var(--hub-lavender)
        );
        transition: width var(--hub-fade) ease;
      }

      .meals {
        margin-top: clamp(16px, 2.4vh, 26px);
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .meals-title {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 6px;
      }
      .meal {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 14px;
        padding: 8px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .meal:first-of-type {
        border-top: none;
      }
      .meal-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-kcal {
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty {
        padding: 10px 0;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Right: weight ─────────────────────────────────────── */
      .w-eyebrow {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .w-num-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-top: 8px;
      }
      .w-num {
        font: 200 clamp(58px, 8.4vw, 88px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .w-unit {
        font: 500 18px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .w-delta {
        margin-top: 10px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .spark-wrap {
        flex: 1;
        min-height: 96px;
        margin: clamp(18px, 3vh, 34px) 0;
        display: flex;
        align-items: center;
      }
      .spark-empty {
        width: 100%;
        text-align: center;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .forecast {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .fc-line {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .fc-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 99px;
        font: 600 13px var(--hub-font-body);
        background: var(--hub-green-bg);
        color: var(--hub-green);
        border: 1px solid var(--hub-green-border);
        white-space: nowrap;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .off-ring {
        width: clamp(156px, 21vh, 208px);
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--hub-track);
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
      }
      .off-text {
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }
    `,
  ];

  private _meals(entity: import('../../types.js').HassEntity): Meal[] {
    const raw = entity.attributes.meals;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
      .map((m) => ({
        name: typeof m.name === 'string' ? m.name : '',
        kcal: typeof m.kcal === 'number' ? m.kcal : Number(m.kcal) || 0,
      }))
      .filter((m) => m.name);
  }

  private _num(v: unknown): number {
    return typeof v === 'number' ? v : NaN;
  }

  private _offline(): TemplateResult {
    return html`
      <div class="page">
        <div class="offline">
          <div class="off-ring"></div>
          <div class="off-text">Kcal · offline</div>
        </div>
      </div>
    `;
  }

  private _weightCard(): TemplateResult {
    const foreId = this.config.kcal?.forecast_entity;
    const fore = foreId ? this.getEntity(foreId) : undefined;
    const weight = fore ? Number(fore.state) : NaN;
    const down =
      !fore || fore.state === 'unavailable' || fore.state === 'unknown' || Number.isNaN(weight);

    if (down) {
      return html`
        <section class="card">
          <span class="w-eyebrow">Vikt</span>
          <div class="w-num-row"><span class="w-num">${MINUS}</span><span class="w-unit">kg</span></div>
          <div class="spark-wrap"><span class="spark-empty">Ingen viktdata</span></div>
        </section>
      `;
    }

    const trendRaw = fore!.attributes.weight_trend;
    const trend: SparkPoint[] = Array.isArray(trendRaw)
      ? trendRaw
          .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
          .map((p) => ({ date: String(p.date ?? ''), value: Number(p.kg) }))
          .filter((p) => Number.isFinite(p.value))
      : [];

    const delta =
      trend.length >= 2 ? trend[trend.length - 1].value - trend[0].value : null;
    const deltaLabel =
      delta === null
        ? null
        : `${delta < 0 ? MINUS : delta > 0 ? '+' : ''}${KG_FMT.format(Math.abs(delta))} kg på ${trend.length} dagar`;

    const fc = fore!.attributes.forecast;
    const forecast: ForecastData | null =
      fc && typeof fc === 'object' ? (fc as ForecastData) : null;
    const line = forecast ? forecastLine(forecast) : '';
    const onTrack = !!forecast?.on_track;

    return html`
      <section class="card">
        <span class="w-eyebrow">Vikt</span>
        <div class="w-num-row">
          <span class="w-num">${KG_FMT.format(weight)}</span>
          <span class="w-unit">kg</span>
        </div>
        ${deltaLabel ? html`<span class="w-delta">${deltaLabel}</span>` : nothing}

        <div class="spark-wrap">
          ${trend.length >= 2
            ? html`<hub-sparkline
                .points=${trend}
                stroke="--hub-lavender"
                .width=${560}
                .height=${130}
              ></hub-sparkline>`
            : html`<span class="spark-empty">Samlar viktdata</span>`}
        </div>

        <div class="forecast">
          ${line
            ? html`<span class="fc-line">${line}</span>`
            : html`<span class="fc-line">Ingen prognos ännu</span>`}
          ${onTrack ? html`<span class="fc-chip">i fas ✓</span>` : nothing}
        </div>
      </section>
    `;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;

    const todayId = this.config.kcal?.today_entity;
    const today = todayId ? this.getEntity(todayId) : undefined;
    const value = today ? Number(today.state) : NaN;
    const offline =
      !today || today.state === 'unavailable' || today.state === 'unknown' || Number.isNaN(value);

    if (offline) return this._offline();

    const target = this._num(today!.attributes.kcal_target);
    const pct = kcalPct(value, target);
    const hasTarget = Number.isFinite(target) && target > 0;
    const remaining = hasTarget ? target - value : NaN;
    const remainLabel = hasTarget
      ? remaining > 0
        ? `${NUM_FMT.format(Math.round(remaining))} kcal kvar`
        : remaining === 0
          ? 'Målet nått'
          : `${NUM_FMT.format(Math.round(-remaining))} över målet`
      : null;

    const protein = this._num(today!.attributes.protein_g);
    const proteinTarget = this._num(today!.attributes.protein_target_g);
    const hasProtein = Number.isFinite(protein) && Number.isFinite(proteinTarget) && proteinTarget > 0;
    const proteinPct = hasProtein ? Math.max(0, Math.min(100, (protein / proteinTarget) * 100)) : 0;

    const meals = this._meals(today!);

    const dateStr = today!.attributes.date;
    const subtitle =
      typeof dateStr === 'string' && !Number.isNaN(new Date(`${dateStr}T00:00:00Z`).getTime())
        ? LONG_DATE.format(new Date(`${dateStr}T00:00:00Z`))
        : '';

    return html`
      <div class="page">
        <div class="header">
          <h1 class="title">Kcal</h1>
          ${subtitle ? html`<span class="subtitle">${subtitle}</span>` : nothing}
        </div>

        <div class="grid">
          <section class="card">
            <div class="ring-wrap">
              <div class="ring-glow"></div>
              <div class="ring" style="--pct:${pct}"></div>
              <div class="ring-center">
                <span class="kc-num">${NUM_FMT.format(Math.round(value))}</span>
                <span class="kc-target">
                  ${hasTarget ? `/ ${NUM_FMT.format(target)} kcal` : 'kcal'}
                </span>
              </div>
            </div>
            ${remainLabel ? html`<div class="kc-remain">${remainLabel}</div>` : nothing}

            ${hasProtein
              ? html`
                  <div class="metric">
                    <div class="metric-head">
                      <span class="metric-label">Protein</span>
                      <span class="metric-val">
                        ${Math.round(protein)} / ${Math.round(proteinTarget)} g
                      </span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${proteinPct}%"></div></div>
                  </div>
                `
              : nothing}

            <div class="meals">
              <div class="meals-title">Idag</div>
              ${meals.length
                ? meals.map(
                    (m) => html`
                      <div class="meal">
                        <span class="meal-name">${m.name}</span>
                        <span class="meal-kcal">${NUM_FMT.format(Math.round(m.kcal))} kcal</span>
                      </div>
                    `,
                  )
                : html`<div class="empty">Inga måltider loggade ännu</div>`}
            </div>
          </section>

          ${this._weightCard()}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-kcal-page', HubKcalPage);
