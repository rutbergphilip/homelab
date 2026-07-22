import { html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from '../widgets/icons.js';
import { bleedGradient, dominantColor } from '../ambient-color.js';
import { pickPlayer, mediaProgress, type HubMediaPlayer } from '../widgets/hub-now-playing.js';
import type { HubConfig } from '../hub-config.js';
import type { HassEntity } from '../../types.js';
import '../widgets/hub-volume-row.js';

/** States with nothing worth surfacing in the hero. */
const OFF_STATES = new Set(['off', 'unavailable', 'unknown', 'standby', 'idle']);

/** Seconds → "m:ss". */
export function clock(sec: number): string {
  const t = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** The group master: first playing speaker, else the first configured one. */
export function groupMaster(
  states: Record<string, HassEntity | undefined>,
  players: HubMediaPlayer[],
): string | null {
  for (const p of players) {
    if (states[p.entity]?.state === 'playing') return p.entity;
  }
  return players[0]?.entity ?? null;
}

export class HubMediaPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  // User's explicit tab choice; null = follow whatever is playing.
  @state() private _sel: string | null = null;
  @state() private _rgb: [number, number, number] | null = null;
  @state() private _now = Date.now();

  private _pic?: string; // last art URL we extracted colour from
  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        position: relative;
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }
      /* Ambient art bleed, painted behind everything. */
      .bleed {
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background 900ms ease;
        z-index: 0;
      }
      .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      /* ── Speaker tabs ─────────────────────────────────────── */
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 20px;
      }
      .tab {
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }
      .tab.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* ── Hero: art + meta + transport ─────────────────────── */
      .hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 22px;
        margin-bottom: 28px;
      }
      .art {
        width: min(38vh, 340px);
        height: min(38vh, 340px);
        border-radius: 20px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #1b5a6e, #2f7d70);
        background-size: cover;
        background-position: center;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      }
      .meta {
        max-width: 100%;
      }
      .title {
        font: 400 26px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .artist {
        margin-top: 6px;
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .progress {
        width: min(100%, 420px);
      }
      .bar {
        height: 5px;
        border-radius: 3px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 3px;
        background: var(--hub-teal);
        transition: width 0.9s linear;
      }
      .times {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }

      .transport {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
      }
      .tbtn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
        transition: color var(--hub-fade) ease, transform 120ms ease;
      }
      .tbtn:active {
        transform: scale(0.9);
      }
      .tbtn.side {
        width: 48px;
        height: 48px;
      }
      .tbtn.side svg {
        width: 28px;
        height: 28px;
      }
      .tbtn.play {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text);
      }
      .tbtn.play.on {
        background: var(--hub-teal);
        border-color: var(--hub-teal);
        color: var(--hub-surface);
        box-shadow: 0 0 30px rgba(99, 214, 194, 0.25);
      }
      .tbtn.play svg {
        width: 28px;
        height: 28px;
      }

      /* ── Quiet / empty state ──────────────────────────────── */
      .quiet {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 14px;
        padding: 40px 0 44px;
      }
      .quiet .qic {
        width: 44px;
        height: 44px;
        color: var(--hub-text-dim);
      }
      .quiet .qic svg {
        width: 100%;
        height: 100%;
      }
      .quiet .qtext {
        font: 300 clamp(24px, 4vw, 34px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }

      /* ── Speaker volume list ──────────────────────────────── */
      .speakers {
        display: flex;
        flex-direction: column;
        gap: var(--hub-gap);
        padding-bottom: 56px; /* clear the page dots */
      }
      .speakers.pushed {
        margin-top: auto;
      }

      @media (max-width: 600px) {
        .hero {
          flex-direction: column;
          align-items: flex-start;
        }
        .tabs {
          flex-wrap: wrap;
        }
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

  private get _players(): HubMediaPlayer[] {
    return this.config?.media_players ?? [];
  }

  /** Effective selected entity id: explicit tab, else what's playing, else first. */
  private _selId(): string | null {
    if (this._sel) return this._sel;
    const playing = pickPlayer(this.hass?.states ?? {}, this._players);
    return playing?.entity.entity_id ?? this._players[0]?.entity ?? null;
  }

  private _theme(): 'natt' | 'dag' {
    const host = (this.getRootNode() as ShadowRoot)?.host as HTMLElement | undefined;
    return host?.getAttribute('data-theme') === 'dag' ? 'dag' : 'natt';
  }

  // Recompute the ambient colour whenever the selected art changes.
  updated(_changed: PropertyValues): void {
    const id = this._selId();
    const pic = id
      ? (this.hass?.states[id]?.attributes.entity_picture as string | undefined)
      : undefined;
    if (pic === this._pic) return;
    this._pic = pic;
    if (!pic) {
      this._rgb = null;
      return;
    }
    dominantColor(pic).then((rgb) => {
      // Guard against a race where the selection changed mid-flight.
      if (this._pic === pic) this._rgb = rgb;
    });
  }

  private _transport(service: string, id: string): void {
    this.callService('media_player', service, undefined, id);
  }

  private _hero(entity: HassEntity, name: string): TemplateResult {
    const playing = entity.state === 'playing';
    const title = (entity.attributes.media_title as string) || name;
    const artist = (entity.attributes.media_artist as string) || name;
    const pic = entity.attributes.entity_picture as string | undefined;
    const dur = typeof entity.attributes.media_duration === 'number'
      ? entity.attributes.media_duration
      : 0;
    const pct = mediaProgress(entity, this._now);
    const elapsed = (pct / 100) * dur;
    const id = entity.entity_id;

    return html`
      <div class="hero">
        <div class="art" style=${pic ? `background-image:url('${pic}')` : ''}></div>
        <div class="meta">
          <div class="title">${title}</div>
          <div class="artist">${artist}</div>
        </div>
        ${dur > 0
          ? html`
              <div class="progress">
                <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
                <div class="times">
                  <span>${clock(elapsed)}</span>
                  <span>${clock(dur)}</span>
                </div>
              </div>
            `
          : nothing}
        <div class="transport">
          <button
            class="tbtn side"
            aria-label="Föregående"
            @click=${() => this._transport('media_previous_track', id)}
          >
            ${icons.prev}
          </button>
          <button
            class="tbtn play ${playing ? 'on' : ''}"
            aria-label=${playing ? 'Pausa' : 'Spela'}
            @click=${() => this._transport('media_play_pause', id)}
          >
            ${playing ? icons.pause : icons.play}
          </button>
          <button
            class="tbtn side"
            aria-label="Nästa"
            @click=${() => this._transport('media_next_track', id)}
          >
            ${icons.next}
          </button>
        </div>
      </div>
    `;
  }

  private _quiet(): TemplateResult {
    return html`
      <div class="quiet">
        <span class="qic">${icons.note}</span>
        <span class="qtext">Ingenting spelas</span>
      </div>
    `;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    const players = this._players;
    const states = this.hass.states;

    const selId = this._selId();
    const selEntity = selId ? states[selId] : undefined;
    const selName = players.find((p) => p.entity === selId)?.name ?? '';
    const hasHero = !!selEntity && !OFF_STATES.has(selEntity.state);

    const master = groupMaster(states, players);
    const bleed = bleedGradient(this._rgb, this._theme());

    return html`
      <div class="page">
        <div class="bleed" style=${`background:${bleed}`}></div>
        <div class="content">
          ${players.length > 1
            ? html`
                <div class="tabs">
                  ${players.map(
                    (p) => html`
                      <button
                        class="tab ${p.entity === selId ? 'on' : ''}"
                        @click=${() => (this._sel = p.entity)}
                      >
                        ${p.name}
                      </button>
                    `,
                  )}
                </div>
              `
            : nothing}

          ${hasHero ? this._hero(selEntity!, selName) : this._quiet()}

          <div class="speakers ${hasHero ? '' : 'pushed'}">
            ${players.map(
              (p) => html`
                <hub-volume-row
                  .hass=${this.hass}
                  .player=${p}
                  .groupMaster=${master}
                ></hub-volume-row>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-media-page', HubMediaPage);
