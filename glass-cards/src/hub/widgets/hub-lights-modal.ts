import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';
import '../../cards/glass-light-slider.js';

export class HubLightsModal extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .all-off {
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .all-off:active {
        transform: scale(0.96);
      }
      .room {
        margin-top: 18px;
      }
      .room:first-of-type {
        margin-top: 0;
      }
      .room-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
      }
      .room-name {
        font: 500 16px var(--hub-font-display);
        color: var(--hub-text);
      }
      .room-count {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .scene-chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _allOff = (): void => {
    const all = [
      ...new Set((this.config.rooms ?? []).flatMap((r) => r.lights.map((l) => l.entity))),
    ];
    this.hass?.callService('light', 'turn_off', {}, { entity_id: all });
  };

  private _scene(entity: string): void {
    this.callService('scene', 'turn_on', undefined, entity);
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const rooms = this.config.rooms ?? [];
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Belysning">
          <div class="head">
            <span class="title">Belysning</span>
            <button class="all-off" @click=${this._allOff}>Släck allt</button>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>
              ${icons.close}
            </button>
          </div>
          ${rooms.map((room) => {
            const on = room.lights.filter((l) => this.getEntity(l.entity)?.state === 'on').length;
            return html`
              <div class="room">
                <div class="room-head">
                  <span class="room-name">${room.name}</span>
                  <span class="room-count">${on > 0 ? `${on} tänd${on === 1 ? '' : 'a'}` : ''}</span>
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
                ${room.scenes?.length
                  ? html`<div class="scenes">
                      ${room.scenes.map(
                        (s) => html`
                          <button class="scene-chip" @click=${() => this._scene(s.entity)}>
                            ${s.name}
                          </button>
                        `,
                      )}
                    </div>`
                  : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lights-modal', HubLightsModal);
