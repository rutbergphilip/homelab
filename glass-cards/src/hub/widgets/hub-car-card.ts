import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

export class HubCarCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .top-row { display: flex; align-items: center; justify-content: space-between; }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .lock {
        font: 600 11px var(--hub-font-body);
        padding: 3px 8px; border-radius: 6px;
        background: var(--hub-chip-bg); color: var(--hub-text-dim);
        border: 1px solid var(--hub-chip-border);
      }
      .lock.unlocked { background: var(--hub-coral-bg); color: var(--hub-coral); border-color: var(--hub-coral-border); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `,
  ];

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-car-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config?.volvo) return html``;
    const v = this.config.volvo;
    const batt = v.battery_entity ? this.getEntity(v.battery_entity)?.state : undefined;
    const range = v.range_entity ? this.getEntity(v.range_entity)?.state : undefined;
    const lock = v.lock_entity ? this.getEntity(v.lock_entity)?.state : undefined;
    const charging = v.charging_entity ? this.getEntity(v.charging_entity)?.state : undefined;
    const isCharging = charging === 'charging' || charging === 'Laddar';
    const parts = [
      batt && !Number.isNaN(Number(batt)) ? `${batt}%` : null,
      range && !Number.isNaN(Number(range)) ? `${range} km` : null,
      isCharging ? 'Laddar' : null,
    ].filter(Boolean);
    return html`
      <div class="card" role="button" tabindex="0" aria-label="Visa bilen" @click=${this._open}>
        <div class="top-row">
          <span class="ic">${icons.car}</span>
          ${lock
            ? html`<span class="lock ${lock === 'locked' ? '' : 'unlocked'}">
                ${lock === 'locked' ? 'Låst' : 'Olåst'}
              </span>`
            : nothing}
        </div>
        <div>
          <b class="label">${v.name ?? 'Volvo'}</b>
          <span class="sub">${parts.length ? parts.join(' · ') : '–'}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-car-card', HubCarCard);
