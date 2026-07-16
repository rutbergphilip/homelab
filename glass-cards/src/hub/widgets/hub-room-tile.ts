import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubRoom } from '../hub-config.js';

const LONG_PRESS_MS = 500;

export class HubRoomTile extends GlassBaseElement {
  @property({ attribute: false }) room!: HubRoom;

  private _pressTimer?: number;
  private _longPressed = false;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        height: 100%;
        border-radius: var(--hub-radius);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          box-shadow var(--hub-fade) ease;
      }
      .tile.active {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .icon-chip {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .icon-chip svg {
        width: 16px;
        height: 16px;
      }
      .tile.active .icon-chip {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .tile.active .name {
        color: var(--hub-amber-text);
      }
      .subtitle {
        font-size: 10.5px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
      }
      .tile.active .subtitle {
        color: var(--hub-amber-muted);
      }
    `,
  ];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelPress();
  }

  private get _lightsOn(): number {
    return this.room.lights.filter((l) => this.isOn(l.entity)).length;
  }

  private get _brightnessPct(): number | null {
    const raw = this.getEntityAttribute(this.room.main_entity, 'brightness');
    return typeof raw === 'number' ? Math.round((raw / 255) * 100) : null;
  }

  private get _subtitle(): string {
    const on = this._lightsOn;
    if (on === 0) return 'Släckt';
    const lampText = on === 1 ? '1 lampa' : `${on} lampor`;
    const pct = this._brightnessPct;
    return pct !== null ? `${lampText} · ${pct} %` : lampText;
  }

  private _onPointerDown = (): void => {
    this._longPressed = false;
    this._pressTimer = window.setTimeout(() => {
      this._longPressed = true;
      this.toggle(this.room.main_entity);
    }, LONG_PRESS_MS);
  };

  private _cancelPress = (): void => {
    if (this._pressTimer !== undefined) {
      clearTimeout(this._pressTimer);
      this._pressTimer = undefined;
    }
  };

  private _onClick = (): void => {
    if (this._longPressed) {
      this._longPressed = false;
      return;
    }
    this.dispatchEvent(
      new CustomEvent('hub-room-open', {
        detail: { roomId: this.room.id },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    if (!this.hass || !this.room) return html``;
    const active = this._lightsOn > 0;
    const ic = icons[this.room.icon];
    return html`
      <div
        class="tile ${active ? 'active' : ''}"
        @pointerdown=${this._onPointerDown}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="icon-chip">${ic ?? ''}</span>
        <div>
          <b class="name">${this.room.name}</b>
          <small class="subtitle">${this._subtitle}</small>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-room-tile', HubRoomTile);
