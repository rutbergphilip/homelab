import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { lightingSubtitle } from '../light-actions.js';
import type { HubConfig } from '../hub-config.js';

export class HubLightingTile extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

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
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition:
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background 200ms ease,
          border-color 200ms ease;
      }
      .card:active {
        transform: scale(0.985);
      }
      .card.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .ic {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .card.on .ic {
        color: var(--hub-amber-text);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .label {
        display: block;
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.on .sub {
        color: var(--hub-amber-text);
      }
    `,
  ];

  private get _count(): number | null {
    const ent = this.config.lights_count_entity
      ? this.getEntity(this.config.lights_count_entity)
      : undefined;
    const n = Number(ent?.state);
    return ent && !Number.isNaN(n) ? n : null;
  }

  private _litRooms(): string[] {
    return (this.config.rooms ?? [])
      .filter((r) => r.lights.some((l) => this.getEntity(l.entity)?.state === 'on'))
      .map((r) => r.name);
  }

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-lights-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config) return html``;
    const count = this._count;
    return html`
      <div
        class="card ${(count ?? 0) > 0 ? 'on' : ''}"
        role="button"
        tabindex="0"
        aria-label="Visa alla lampor"
        @click=${this._open}
      >
        <span class="ic">${icons.lamp}</span>
        <div>
          <b class="label">Belysning</b>
          <span class="sub">${lightingSubtitle(count, this._litRooms())}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lighting-tile', HubLightingTile);
