import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import {
  buildPlannerModel,
  upcomingMeals,
  SLOT_LABELS,
  type PlannerModel,
} from '../planner-model.js';

const NUM_FMT = new Intl.NumberFormat('sv-SE');

/**
 * Hem's meal-plan overview card (bottom band, next to the kcal ring): the
 * next day's planned meals at a glance, tap → the Vecka page. Same lavender
 * domain treatment as the ring.
 */
export class HubMealCard extends GlassBaseElement {
  @property({ attribute: false }) plannerEntity?: string;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition:
          background var(--hub-fade) ease,
          border-color var(--hub-fade) ease;
        overflow: hidden;
      }
      .card.empty {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
      }
      .eyebrow {
        font: 600 11px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .count {
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .when {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        margin-top: 4px;
        flex-shrink: 0;
      }
      .meals {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        margin-top: 2px;
      }
      .meal {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2.5px 0;
      }
      .slot {
        flex-shrink: 0;
        width: 58px;
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .name {
        min-width: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .kcal {
        flex-shrink: 0;
        margin-left: auto;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .none {
        flex: 1;
        display: flex;
        align-items: center;
        font: 400 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
    `,
  ];

  private _model(): PlannerModel | null {
    if (!this.plannerEntity) return null;
    const entity = this.getEntity(this.plannerEntity);
    if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    return buildPlannerModel(entity.attributes as Record<string, unknown>);
  }

  private _open(): void {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: 'vecka' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.plannerEntity) return nothing;
    const model = this._model();
    const up = model ? upcomingMeals(model) : null;

    return html`
      <div class="card${up ? '' : ' empty'}" @click=${this._open}>
        <div class="head">
          <span class="eyebrow">Matsedel</span>
          ${model
            ? html`<span class="count">${model.confirmedDays} / 7 ✓</span>`
            : nothing}
        </div>
        ${up
          ? html`
              <span class="when">${up.dayLabel}</span>
              <div class="meals">
                ${up.meals.map(
                  (m) => html`
                    <div class="meal">
                      <span class="slot">${SLOT_LABELS[m.slot]}</span>
                      <span class="name">${m.name}</span>
                      <span class="kcal">${NUM_FMT.format(m.kcal)}</span>
                    </div>
                  `,
                )}
              </div>
            `
          : html`<div class="none">${model ? 'Inget planerat ännu' : 'Vecka · offline'}</div>`}
      </div>
    `;
  }
}

customElements.define('hub-meal-card', HubMealCard);
