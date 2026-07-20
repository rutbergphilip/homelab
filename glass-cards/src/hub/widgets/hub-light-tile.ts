import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { isDrag } from '../swipe.js';
import type { HubRoomLight } from '../hub-config.js';

const LONG_PRESS_MS = 500;
const DEAD_STATES = new Set(['unavailable', 'unknown']);

/**
 * Apple-Home-style compact light tile: tap toggles the light, long-press opens
 * the brightness popup (via hub-light-open). Same long-press/drag-slop pattern
 * as hub-room-tile so a deck swipe never fires a toggle.
 */
export class HubLightTile extends GlassBaseElement {
  @property({ attribute: false }) light!: HubRoomLight;

  @state() private _flash = false;

  private _pressTimer?: number;
  private _flashTimer?: number;
  private _longPressed = false;
  private _downX = 0;
  private _downY = 0;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .tile.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .tile.flash {
        transform: scale(0.96);
      }
      .tile.dead {
        cursor: default;
        opacity: 0.55;
      }
      .ic {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .ic svg {
        width: 15px;
        height: 15px;
      }
      .tile.on .ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        flex: 1;
        min-width: 0;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tile.on .name {
        color: var(--hub-amber-text);
        font-weight: 600;
      }
      .state {
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .tile.on .state {
        color: var(--hub-amber-text);
      }
    `,
  ];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelPress();
    if (this._flashTimer !== undefined) {
      clearTimeout(this._flashTimer);
      this._flashTimer = undefined;
    }
  }

  private get _dead(): boolean {
    const st = this.getEntity(this.light.entity);
    return !st || DEAD_STATES.has(st.state);
  }

  private get _stateLabel(): string {
    const st = this.getEntity(this.light.entity);
    if (!st || DEAD_STATES.has(st.state)) return 'Ej tillgänglig';
    if (st.state !== 'on') return 'Av';
    const b = st.attributes.brightness;
    return typeof b === 'number' ? `${Math.round((b / 255) * 100)} %` : 'På';
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (this._dead) return;
    this._longPressed = false;
    this._downX = e.clientX;
    this._downY = e.clientY;
    this._pressTimer = window.setTimeout(() => {
      this._longPressed = true;
      this.dispatchEvent(
        new CustomEvent('hub-light-open', {
          detail: { entity: this.light.entity, name: this.light.name },
          bubbles: true,
          composed: true,
        }),
      );
    }, LONG_PRESS_MS);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (this._pressTimer === undefined) return;
    if (isDrag(e.clientX - this._downX) || isDrag(e.clientY - this._downY)) {
      this._cancelPress();
    }
  };

  private _cancelPress = (): void => {
    if (this._pressTimer !== undefined) {
      clearTimeout(this._pressTimer);
      this._pressTimer = undefined;
    }
  };

  private _onClick = (): void => {
    if (this._dead) return;
    if (this._longPressed) {
      this._longPressed = false;
      return;
    }
    this.callService('light', 'toggle', undefined, this.light.entity);
    this._flash = true;
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._flashTimer = window.setTimeout(() => {
      this._flash = false;
      this._flashTimer = undefined;
    }, 200);
  };

  render() {
    if (!this.hass || !this.light) return html``;
    const on = this.isOn(this.light.entity);
    const dead = this._dead;
    return html`
      <div
        class="tile ${on ? 'on' : ''} ${this._flash ? 'flash' : ''} ${dead ? 'dead' : ''}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="ic">${icons.lamp}</span>
        <span class="name">${this.light.name}</span>
        <span class="state">${this._stateLabel}</span>
      </div>
    `;
  }
}

customElements.define('hub-light-tile', HubLightTile);
