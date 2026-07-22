import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

const STATE_LABELS: Record<string, string> = {
  docked: 'Dockad',
  cleaning: 'Städar',
  returning: 'Åker hem',
  paused: 'Pausad',
  error: 'Fel',
  idle: 'Väntar',
};

export class HubVacuumCard extends GlassBaseElement {
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
      .card.err { border-color: var(--hub-coral-border); background: var(--hub-coral-bg); }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .card.active .ic { color: var(--hub-teal); }
      .card.err .ic { color: var(--hub-coral); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `,
  ];

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-vacuum-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config) return html``;
    const vac = this.config.vacuum_entity ? this.getEntity(this.config.vacuum_entity) : undefined;
    const vc = this.config.vacuum_controls;
    const batt = vc?.battery_entity ? this.getEntity(vc.battery_entity)?.state : undefined;
    const state = vac?.state ?? 'unknown';
    const label = STATE_LABELS[state] ?? '–';
    const busy = state === 'cleaning' || state === 'returning';
    const sub = batt && !Number.isNaN(Number(batt)) ? `${label} · ${batt}%` : label;
    return html`
      <div
        class="card ${busy ? 'active' : ''} ${state === 'error' ? 'err' : ''}"
        role="button"
        tabindex="0"
        aria-label="Visa dammsugaren"
        @click=${this._open}
      >
        <span class="ic">${icons.vacuum}</span>
        <div>
          <b class="label">Roborock</b>
          <span class="sub">${sub}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-vacuum-card', HubVacuumCard);
