import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HassEntity } from '../../types.js';

export interface HubMediaPlayer {
  entity: string;
  name: string;
}

/** States that mean "nothing is going on here". */
const OFF_STATES = new Set(['off', 'unavailable', 'unknown', 'standby', 'idle']);

/**
 * Pick the player to surface: first one actively playing, else the first that
 * isn't off/idle (e.g. paused), else null (nothing to show).
 */
export function pickPlayer(
  states: Record<string, HassEntity | undefined>,
  players: HubMediaPlayer[],
): { entity: HassEntity; name: string } | null {
  for (const p of players) {
    const e = states[p.entity];
    if (e && e.state === 'playing') return { entity: e, name: p.name };
  }
  for (const p of players) {
    const e = states[p.entity];
    if (e && !OFF_STATES.has(e.state)) return { entity: e, name: p.name };
  }
  return null;
}

/**
 * Progress 0–100. While playing, advances client-side from
 * media_position_updated_at so the bar creeps without state pushes.
 */
export function mediaProgress(entity: HassEntity | null | undefined, nowMs: number): number {
  if (!entity) return 0;
  const a = entity.attributes;
  const dur = typeof a.media_duration === 'number' ? a.media_duration : 0;
  if (dur <= 0) return 0;
  let pos = typeof a.media_position === 'number' ? a.media_position : 0;
  const updated =
    typeof a.media_position_updated_at === 'string'
      ? Date.parse(a.media_position_updated_at)
      : NaN;
  if (entity.state === 'playing' && !Number.isNaN(updated)) {
    pos += (nowMs - updated) / 1000;
  }
  return Math.max(0, Math.min(100, (pos / dur) * 100));
}

export class HubNowPlaying extends GlassBaseElement {
  @property({ attribute: false }) players: HubMediaPlayer[] = [];

  @state() private _now = Date.now();
  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .np {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .np.playing {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .art {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b6ea5, #8e5ea2);
        background-size: cover;
        background-position: center;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .title {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .title {
        color: var(--hub-teal-text);
      }
      .sub {
        font-size: 12px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .sub {
        color: var(--hub-teal-muted);
      }
      .bar {
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        margin-top: 9px;
        overflow: hidden;
      }
      .np.playing .bar {
        background: var(--hub-teal-border);
      }
      .fill {
        height: 100%;
        border-radius: 2px;
        background: var(--hub-text-dim);
        transition: width 0.9s linear;
      }
      .np.playing .fill {
        background: var(--hub-teal);
      }
      .pp {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        margin: -4px -8px -4px 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
      }
      .np.playing .pp {
        color: var(--hub-teal);
      }
      .pp .ppic {
        display: flex;
        width: 22px;
        height: 22px;
      }
      .pp svg {
        width: 100%;
        height: 100%;
      }
      .idle-ic {
        display: flex;
        width: 22px;
        height: 22px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .idle-ic svg {
        width: 100%;
        height: 100%;
      }
      .title.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = Date.now();
    }, 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private _goto(): void {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: 'media' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _togglePlay(e: Event, entityId: string): void {
    e.stopPropagation();
    this.callService('media_player', 'media_play_pause', undefined, entityId);
  }

  render() {
    if (!this.hass) return html``;
    const sel = pickPlayer(this.hass.states, this.players ?? []);

    if (!sel) {
      return html`
        <div class="np idle" @click=${this._goto}>
          <span class="idle-ic">${icons.note}</span>
          <b class="title dim">Ingenting spelas</b>
        </div>
      `;
    }

    const e = sel.entity;
    const playing = e.state === 'playing';
    const title = (e.attributes.media_title as string) || sel.name;
    const artist = (e.attributes.media_artist as string) || sel.name;
    const pic = e.attributes.entity_picture as string | undefined;
    const pct = mediaProgress(e, this._now);

    return html`
      <div class="np ${playing ? 'playing' : ''}" @click=${this._goto}>
        <div
          class="art"
          style=${pic ? `background-image:url('${pic}')` : ''}
        ></div>
        <div class="meta">
          <b class="title">${title}</b>
          <small class="sub">${artist}</small>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>
        <button
          class="pp"
          aria-label=${playing ? 'Pausa' : 'Spela'}
          @click=${(ev: Event) => this._togglePlay(ev, e.entity_id)}
        >
          <span class="ppic">${playing ? icons.pause : icons.play}</span>
        </button>
      </div>
    `;
  }
}

customElements.define('hub-now-playing', HubNowPlaying);
