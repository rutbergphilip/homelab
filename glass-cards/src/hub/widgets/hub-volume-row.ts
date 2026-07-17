import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubMediaPlayer } from './hub-now-playing.js';

const DEAD_STATES = new Set(['unavailable', 'unknown']);

/** Is `player` currently joined to `master`'s group? */
export function isGrouped(
  masterMembers: unknown,
  playerEntity: string,
): boolean {
  return Array.isArray(masterMembers) && masterMembers.includes(playerEntity);
}

/**
 * One speaker's row: name, a horizontal volume slider, and — for any speaker
 * that isn't the group master — a chip to join/leave the master's group.
 *
 * The slider is a native range input styled with hub tokens. It stops pointer
 * propagation so a horizontal drag never reaches the page-deck swipe handler.
 */
export class HubVolumeRow extends GlassBaseElement {
  @property({ attribute: false }) player!: HubMediaPlayer;
  @property({ attribute: false }) groupMaster: string | null = null;

  // Optimistic value while dragging, so the fill + percentage track the thumb
  // without waiting for the state to round-trip through Home Assistant.
  @state() private _drag: number | null = null;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
      }
      .row {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: border-color var(--hub-fade) ease;
      }
      .row.active {
        border-color: var(--hub-teal-border);
      }
      .ic {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .row.active .ic {
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
      }
      .ic svg {
        width: 17px;
        height: 17px;
      }
      .main {
        flex: 1;
        min-width: 0;
      }
      .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .name {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .row.active .name {
        color: var(--hub-teal-text);
      }
      .pct {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }
      .row.active .pct {
        color: var(--hub-teal);
      }

      /* Native range, restyled. 48px hit height, slim visible track. */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        display: block;
        width: 100%;
        height: 48px;
        margin: -14px 0;
        background: transparent;
        cursor: pointer;
        touch-action: none;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: var(--track-bg, var(--hub-track));
      }
      input[type='range']::-moz-range-track {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-track);
      }
      input[type='range']::-moz-range-progress {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-teal);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        margin-top: -6px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }
      input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }

      .chip {
        flex-shrink: 0;
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease,
          border-color 160ms ease, color 160ms ease;
      }
      .chip:active {
        transform: scale(0.95);
      }
      .chip.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* Unavailable speaker → quiet, non-interactive row. */
      .dead {
        color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        margin-left: auto;
      }
    `,
  ];

  private _entity() {
    return this.hass?.states[this.player.entity];
  }

  private _volume(): number {
    if (this._drag !== null) return this._drag;
    const v = this._entity()?.attributes.volume_level;
    return typeof v === 'number' ? v : 0;
  }

  private _onInput(e: Event): void {
    this._drag = Number((e.target as HTMLInputElement).value);
  }

  private _onChange(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    this._drag = null;
    this.callService(
      'media_player',
      'volume_set',
      { volume_level: v },
      this.player.entity,
    );
  }

  // The deck swipe listens on pointer events at the strip; swallow them here so
  // a horizontal volume drag never turns into a page swipe.
  private _stop(e: Event): void {
    e.stopPropagation();
  }

  private _toggleGroup(grouped: boolean): void {
    if (!this.groupMaster) return;
    if (grouped) {
      this.callService('media_player', 'unjoin', undefined, this.player.entity);
    } else {
      this.callService(
        'media_player',
        'join',
        { group_members: [this.player.entity] },
        this.groupMaster,
      );
    }
  }

  render(): TemplateResult {
    if (!this.hass || !this.player) return html``;
    const e = this._entity();
    const dead = !e || DEAD_STATES.has(e.state);

    const vol = this._volume();
    const pct = Math.round(vol * 100);
    const active = !dead && vol > 0;

    const isMaster = this.player.entity === this.groupMaster;
    const grouped =
      !isMaster &&
      !!this.groupMaster &&
      isGrouped(
        this.hass.states[this.groupMaster]?.attributes.group_members,
        this.player.entity,
      );

    // Paint the webkit track's filled portion up to the current value.
    const trackBg = `linear-gradient(90deg, var(--hub-teal) 0 ${pct}%, var(--hub-track) ${pct}% 100%)`;

    return html`
      <div class="row ${active ? 'active' : ''}">
        <span class="ic">${icons.speaker}</span>
        <div class="main">
          <div class="top">
            <span class="name">${this.player.name}</span>
            ${dead ? nothing : html`<span class="pct">${pct}%</span>`}
          </div>
          ${dead
            ? html`<span class="dead">Ej tillgänglig</span>`
            : html`
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${String(vol)}
                  style=${`--track-bg:${trackBg}`}
                  aria-label=${`Volym ${this.player.name}`}
                  @input=${this._onInput}
                  @change=${this._onChange}
                  @pointerdown=${this._stop}
                  @pointermove=${this._stop}
                  @pointerup=${this._stop}
                  @touchstart=${this._stop}
                  @touchmove=${this._stop}
                />
              `}
        </div>
        ${dead || isMaster
          ? nothing
          : html`
              <button
                class="chip ${grouped ? 'on' : ''}"
                @click=${() => this._toggleGroup(grouped)}
              >
                ${grouped ? 'I gruppen' : 'Gruppera'}
              </button>
            `}
      </div>
    `;
  }
}

customElements.define('hub-volume-row', HubVolumeRow);
