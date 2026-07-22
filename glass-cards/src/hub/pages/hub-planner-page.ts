import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import {
  buildPlannerModel,
  dayTypeLetter,
  SLOT_LABELS,
  SLOT_ORDER,
  type PlannerDay,
  type PlannerModel,
} from '../planner-model.js';
import type { HubConfig } from '../hub-config.js';

const NUM_FMT = new Intl.NumberFormat('sv-SE');
const LONG_DATE = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** Time to let the confirm POST land before refreshing the REST sensor. */
const REFRESH_DELAY_MS = 1500;

export class HubPlannerPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  @state() private _openDate: string | null = null;
  @state() private _confirming = false;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
        position: relative; /* containing block for the day-popup overlay */
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      .header {
        padding-right: 56px;
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

      /* ── Week grid ─────────────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: clamp(8px, 1vw, 14px);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 600px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .day {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(10px, 1.2vw, 16px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        text-align: left;
        font: inherit;
        color: inherit;
      }
      .day.today {
        border-color: var(--hub-lavender);
      }
      .day.confirmed {
        opacity: 0.78;
      }

      .day-head {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 8px;
      }
      .day-name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text);
        text-transform: capitalize;
      }
      .day-date {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .day-flex {
        flex: 1;
      }
      .type-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font: 600 11px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        flex-shrink: 0;
      }
      .type-chip.gymdag {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .type-chip.flexdag {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal);
      }
      .lock {
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
      }

      .slots {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slot-label {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .meal {
        display: flex;
        flex-direction: column;
        margin-top: 2px;
      }
      .meal-name {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-name.logged {
        color: var(--hub-text-dim);
      }
      .meal-kcal {
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty-day {
        font: 400 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      .day-foot {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .day-foot .warn {
        color: var(--hub-coral);
      }

      /* ── Day popup ─────────────────────────────────────────── */
      /* Absolute, not fixed: the swipe strip's translateX makes it the
         containing block for fixed elements, which would center the popup
         across the whole strip instead of the visible page. */
      .scrim {
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--hub-surface) 62%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .popup {
        box-sizing: border-box;
        width: min(560px, 94vw);
        max-height: 86vh;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: clamp(20px, 3vw, 32px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }
      .popup-title {
        margin: 0 0 4px;
        font: 300 clamp(24px, 3.4vw, 32px) var(--hub-font-display);
        color: var(--hub-text);
      }
      .popup-title::first-letter {
        text-transform: uppercase;
      }
      .popup-sub {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        margin-bottom: 14px;
      }
      .pm {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 9px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .pm-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .pm-slot {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        display: block;
      }
      .pm-macro {
        flex-shrink: 0;
        text-align: right;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .popup-actions {
        margin-top: 18px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .btn {
        font: 600 14px var(--hub-font-body);
        padding: 12px 22px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .btn.primary {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .btn:disabled {
        opacity: 0.5;
      }
      .confirmed-note {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-green);
        align-self: center;
        margin-right: auto;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
      }
    `,
  ];

  private _model(): PlannerModel | null {
    const id = this.config?.kcal?.planner_entity;
    if (!id) return null;
    const entity = this.getEntity(id);
    if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    return buildPlannerModel(entity.attributes as Record<string, unknown>);
  }

  private _confirm(day: PlannerDay): void {
    if (this._confirming || day.confirmed || day.meals.length === 0) return;
    this._confirming = true;
    this.callService('rest_command', 'kcal_confirm_day', { date: day.date });
    // Give the POST a moment to land, then refresh the sensor for feedback.
    window.setTimeout(() => {
      const id = this.config?.kcal?.planner_entity;
      if (id) this.callService('homeassistant', 'update_entity', undefined, id);
      this._confirming = false;
      this._openDate = null;
    }, REFRESH_DELAY_MS);
  }

  private _dayPopup(model: PlannerModel): TemplateResult | typeof nothing {
    const day = model.days.find((d) => d.date === this._openDate);
    if (!day) return nothing;
    const dateLabel = LONG_DATE.format(new Date(`${day.date}T00:00:00Z`));
    const canConfirm = !day.confirmed && day.meals.some((m) => !m.logged);
    return html`
      <div class="scrim" @click=${() => (this._openDate = null)}>
        <div class="popup" @click=${(e: Event) => e.stopPropagation()}>
          <h2 class="popup-title">${dateLabel}</h2>
          <div class="popup-sub">
            ${day.day_type} · ${NUM_FMT.format(day.total_kcal)} / ${NUM_FMT.format(day.target_kcal)} kcal
            ${day.confirmed ? ' · bekräftad ✓' : ''}
          </div>
          ${day.meals.map(
            (m) => html`
              <div class="pm">
                <div>
                  <span class="pm-slot">${SLOT_LABELS[m.slot]}${m.logged ? ' · loggad' : ''}</span>
                  <span class="pm-name">${m.name}</span>
                </div>
                <span class="pm-macro">
                  ${NUM_FMT.format(m.kcal)} kcal<br />
                  P ${NUM_FMT.format(m.protein)} · F ${NUM_FMT.format(m.fat)} · K ${NUM_FMT.format(m.carbs)}
                </span>
              </div>
            `,
          )}
          ${day.meals.length === 0 ? html`<div class="empty-day">Inget planerat.</div>` : nothing}
          <div class="popup-actions">
            ${day.confirmed ? html`<span class="confirmed-note">Dagen är låst ✓</span>` : nothing}
            <button class="btn" @click=${() => (this._openDate = null)}>Stäng</button>
            ${canConfirm
              ? html`
                  <button class="btn primary" ?disabled=${this._confirming} @click=${() => this._confirm(day)}>
                    ${this._confirming ? 'Bekräftar…' : 'Bekräfta dagen'}
                  </button>
                `
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private _dayCard(day: PlannerDay, today: string): TemplateResult {
    const slots = SLOT_ORDER.filter((slot) => day.meals.some((m) => m.slot === slot));
    return html`
      <button
        class="day${day.date === today ? ' today' : ''}${day.confirmed ? ' confirmed' : ''}"
        @click=${() => (this._openDate = day.date)}
      >
        <div class="day-head">
          <span class="day-name">${day.weekday.slice(0, 3)}</span>
          <span class="day-date">${day.date.slice(8)}</span>
          <span class="day-flex"></span>
          ${day.confirmed ? html`<span class="lock">✓</span>` : nothing}
          <span class="type-chip ${day.day_type}">${dayTypeLetter(day.day_type)}</span>
        </div>
        <div class="slots">
          ${slots.length === 0 ? html`<span class="empty-day">—</span>` : nothing}
          ${slots.map(
            (slot) => html`
              <div>
                <span class="slot-label">${SLOT_LABELS[slot]}</span>
                ${day.meals
                  .filter((m) => m.slot === slot)
                  .map(
                    (m) => html`
                      <div class="meal">
                        <span class="meal-name${m.logged ? ' logged' : ''}">${m.name}</span>
                        <span class="meal-kcal">${NUM_FMT.format(m.kcal)} kcal</span>
                      </div>
                    `,
                  )}
              </div>
            `,
          )}
        </div>
        <div class="day-foot">
          ${day.meals.length > 0
            ? html`${NUM_FMT.format(day.total_kcal)} / ${NUM_FMT.format(day.target_kcal)}
              ${!day.kcal_ok || !day.protein_ok ? html`<span class="warn"> ⚠</span>` : nothing}`
            : html`&nbsp;`}
        </div>
      </button>
    `;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    const model = this._model();
    if (!model) {
      return html`<div class="page"><div class="offline">Vecka · offline</div></div>`;
    }
    return html`
      <div class="page">
        <div class="header">
          <h1 class="title">Vecka</h1>
          <span class="subtitle">${model.confirmedDays} / 7 bekräftade</span>
        </div>
        <div class="grid">${model.days.map((d) => this._dayCard(d, model.today))}</div>
      </div>
      ${this._openDate ? this._dayPopup(model) : nothing}
    `;
  }
}

customElements.define('hub-planner-page', HubPlannerPage);
