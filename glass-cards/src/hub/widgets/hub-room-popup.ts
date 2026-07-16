import { html, css, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import type { HubRoom } from '../hub-config.js';
import '../../cards/glass-light-slider.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

export class HubRoomPopup extends GlassBaseElement {
  @property({ attribute: false }) room: HubRoom | null = null;

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .card {
        width: 100%;
        max-width: 520px;
        max-height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      glass-light-slider {
        display: block;
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(
      new CustomEvent('hub-popup-close', { bubbles: true, composed: true }),
    );
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  render() {
    if (!this.room || !this.hass) return html``;
    const room = this.room;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${room.name}>
          <div class="head">
            <span class="title">${room.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>
              ${CLOSE_ICON}
            </button>
          </div>
          <div class="lights">
            ${room.lights.map(
              (l) => html`
                <glass-light-slider
                  .hass=${this.hass}
                  ._config=${{ type: 'glass-light-slider', entity: l.entity, name: l.name }}
                ></glass-light-slider>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-room-popup', HubRoomPopup);
