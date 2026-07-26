import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { healthCardStyles } from './health-card-styles.js';
import { numericState, metricSeries, freshestWorkout, type WorkoutSummary } from '../health-model.js';
import type { HubConfig } from '../hub-config.js';
import './hub-sparkline.js';

const NUM_FMT = new Intl.NumberFormat('sv-SE');

const WORKOUT_LABELS: Record<string, string> = {
  walking: 'Promenad',
  walk: 'Promenad',
  running: 'Löpning',
  run: 'Löpning',
  cycling: 'Cykling',
  bike: 'Cykling',
  strength_training: 'Styrketräning',
  weights: 'Styrketräning',
  swimming: 'Simning',
  hiking: 'Vandring',
};

export function workoutLabel(type: string | null | undefined): string {
  if (!type) return 'Träning';
  return WORKOUT_LABELS[type.toLowerCase()] ?? type.replace(/_/g, ' ');
}

/** Clamped 0–100 so an exceeded goal fills the rail rather than overflowing it. */
export function goalPct(value: number | null, target: number | null): number | null {
  if (value === null || target === null || target <= 0) return null;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

export class HubActivityCard extends GlassBaseElement {
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
      .goal {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .goal-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
        margin-bottom: 8px;
      }
      .rail {
        height: 9px;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-track);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-lavender);
        transition: width var(--hub-fade) ease;
      }
      .fill.reached {
        background: var(--hub-green);
      }
      .workout {
        margin-top: 14px;
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .workout .who {
        font: 600 10.5px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        padding: 3px 7px;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
      }
    `,
  ];

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  private _workouts(): WorkoutSummary | null {
    const oura = this.config?.health?.oura ?? {};
    const w = this.config?.health?.withings ?? {};

    const ouraType = oura.workout_type_entity ? this.getState(oura.workout_type_entity) : undefined;
    const ouraAt = oura.workout_at_entity ? this.getState(oura.workout_at_entity) : undefined;
    const withingsType = w.workout_type_entity ? this.getState(w.workout_type_entity) : undefined;

    // Both feeds are partly fed by Apple Health, so they routinely disagree about
    // which workout was last. Freshest wins; see health-model.freshestWorkout.
    const a: WorkoutSummary | null =
      ouraType && ouraType !== 'unavailable' && ouraType !== 'unknown'
        ? {
            source: 'Oura',
            type: ouraType,
            kcal: this._num(oura.workout_kcal_entity),
            minutes: this._num(oura.workout_duration_entity),
            at: ouraAt ?? '',
          }
        : null;
    const b: WorkoutSummary | null =
      withingsType && withingsType !== 'unavailable' && withingsType !== 'unknown'
        ? {
            source: 'Withings',
            type: withingsType,
            kcal: this._num(w.workout_kcal_entity),
            minutes: this._num(w.workout_duration_entity),
            at: '',
          }
        : null;
    return freshestWorkout(a, b);
  }

  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-health-open', {
        detail: { section: 'activity' },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): TemplateResult {
    const oura = this.config?.health?.oura ?? {};
    const steps = this._num(oura.steps_entity);
    const activeKcal = this._num(oura.active_kcal_entity);
    const targetKcal = this._num(oura.target_kcal_entity);
    const totalKcal = this._num(oura.total_kcal_entity);
    const pct = goalPct(activeKcal, targetKcal);
    const workout = this._workouts();

    const series = metricSeries(
      this.config?.health?.history_entity
        ? this.getEntityAttribute(this.config.health.history_entity, 'days')
        : undefined,
      'oura_steps',
    );

    return html`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Aktivitet</span>
        <div class="value-row">
          ${steps === null
            ? html`<span class="value dash">—</span>`
            : html`<span class="value">${NUM_FMT.format(Math.round(steps))}</span>
                <span class="unit">steg</span>`}
        </div>

        <div class="facts">
          ${totalKcal === null
            ? html`<span class="dash">Ingen förbrukning</span>`
            : html`<span>Totalt <b>${NUM_FMT.format(Math.round(totalKcal))} kcal</b></span>`}
        </div>

        ${pct === null
          ? nothing
          : html`
              <div class="goal">
                <div class="goal-head">
                  <span>Aktiva kalorier</span>
                  <span
                    >${NUM_FMT.format(Math.round(activeKcal ?? 0))} /
                    ${NUM_FMT.format(Math.round(targetKcal ?? 0))} kcal</span
                  >
                </div>
                <div class="rail">
                  <div class="fill ${pct >= 100 ? 'reached' : ''}" style="width:${pct.toFixed(2)}%"></div>
                </div>
              </div>
            `}

        ${workout
          ? html`
              <div class="workout">
                <span class="who">${workout.source}</span>
                <span>${workoutLabel(workout.type)}</span>
                ${workout.minutes === null
                  ? nothing
                  : html`<span class="sep">·</span><span>${Math.round(workout.minutes)} min</span>`}
                ${workout.kcal === null
                  ? nothing
                  : html`<span class="sep">·</span
                      ><span>${NUM_FMT.format(Math.round(workout.kcal))} kcal</span>`}
              </div>
            `
          : nothing}

        <div class="trend">
          ${series.length >= 2
            ? html`
                <hub-sparkline .points=${series} stroke="--hub-lavender" .height=${52}></hub-sparkline>
                <div class="trend-foot">
                  <span>Steg ${series.length} dagar</span>
                  <span>${NUM_FMT.format(Math.round(series[series.length - 1].value))}</span>
                </div>
              `
            : html`<span class="trend-empty">Samlar aktivitetshistorik</span>`}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-activity-card', HubActivityCard);
