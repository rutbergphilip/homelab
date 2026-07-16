import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from '../widgets/icons.js';
import type { HubConfig, HubRoom, HubRoomLight, HubRoomScene } from '../hub-config.js';
import type { HassEntity } from '../../types.js';
import '../../cards/glass-light-slider.js';

type StateMap = Record<string, HassEntity | undefined>;

const DEAD_STATES = new Set(['unavailable', 'unknown']);

function isLightLive(state: HassEntity | undefined): boolean {
  return !!state && !DEAD_STATES.has(state.state);
}

export interface RoomLightSummary {
  onCount: number;
  pct: number | null;
  label: string;
}

/** Lights-on count, average brightness and a Swedish summary line for a room card. */
export function roomLightSummary(room: HubRoom, states: StateMap): RoomLightSummary {
  const onLights = room.lights.filter((l) => states[l.entity]?.state === 'on');
  const onCount = onLights.length;
  if (onCount === 0) return { onCount: 0, pct: null, label: 'Släckt' };

  const brights = onLights
    .map((l) => states[l.entity]?.attributes.brightness)
    .filter((b): b is number => typeof b === 'number');
  const pct = brights.length
    ? Math.round((brights.reduce((a, b) => a + b, 0) / brights.length / 255) * 100)
    : null;

  const lampText = onCount === 1 ? '1 lampa' : `${onCount} lampor`;
  return { onCount, pct, label: pct !== null ? `${lampText} · ${pct} %` : lampText };
}

/** How many of the home's real lights are on, and how many resolve at all. */
export function totalLightsOn(config: HubConfig, states: StateMap): { on: number; total: number } {
  let on = 0;
  let total = 0;
  for (const room of config.rooms ?? []) {
    for (const l of room.lights) {
      const st = states[l.entity];
      if (!isLightLive(st)) continue;
      total += 1;
      if (st!.state === 'on') on += 1;
    }
  }
  return { on, total };
}

const ALL_OFF_ARM_MS = 3000;
const FLASH_MS = 200;

export class HubLightsPage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  // Two-stage guard on the whole-home "Allt släckt": first tap arms, second
  // tap (within 3 s) fires. _flash drives the momentary press confirmation.
  @state() private _armed = false;
  @state() private _flash = false;
  private _armTimer?: number;
  private _flashTimer?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }

      /* ── Header ─────────────────────────────────────────── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        /* keep the whole-home actions clear of the theme toggle in the corner */
        padding-right: 56px;
        margin-bottom: 20px;
      }
      .heading {
        display: flex;
        flex-direction: column;
      }
      .title {
        font: 300 28px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.05;
      }
      .subtitle {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subtitle .lit {
        color: var(--hub-amber);
        font-weight: 600;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-amber-border);
        background: var(--hub-amber-bg);
        color: var(--hub-amber-text);
        font: 600 14px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform ${FLASH_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          color var(--hub-fade) ease;
      }
      .action .ic {
        display: flex;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .action .ic svg {
        width: 100%;
        height: 100%;
      }
      .action.armed {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .action.flash {
        transform: scale(0.94);
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }

      /* ── Rooms grid ─────────────────────────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
      }
      .rooms {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        align-content: start;
        gap: var(--hub-gap);
      }
      @media (max-width: 900px) {
        .rooms {
          grid-template-columns: 1fr;
        }
      }

      .room {
        box-sizing: border-box;
        border-radius: var(--hub-radius);
        padding: 16px;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: border-color var(--hub-fade) ease, box-shadow var(--hub-fade) ease;
      }
      .room.active {
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .room-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .room-ic {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .room-ic svg {
        width: 16px;
        height: 16px;
      }
      .room.active .room-ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .room-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .room.active .room-name {
        color: var(--hub-amber-text);
      }
      .room-meta {
        display: block;
        margin-top: 1px;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .room.active .room-meta {
        color: var(--hub-amber-muted);
      }

      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }

      /* Unavailable / missing lights are quiet, non-interactive rows. */
      .dead-row {
        box-sizing: border-box;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 16px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-icon-chip-bg);
        border: 1px solid var(--hub-card-border);
      }
      .dead-name {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .dead-state {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Per-room scene chips ───────────────────────────── */
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-top: 2px;
      }
      .scene-chip {
        min-height: 48px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease, border-color 160ms ease,
          color 160ms ease;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `,
  ];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimers();
  }

  private _clearTimers(): void {
    if (this._armTimer !== undefined) clearTimeout(this._armTimer);
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._armTimer = undefined;
    this._flashTimer = undefined;
    // Never leave the all-off guard armed across a disconnect — otherwise the
    // next single tap would fire light.turn_off all with no confirmation.
    this._armed = false;
    this._flash = false;
  }

  // ── Whole-home "Allt släckt" — arm then fire ──────────────
  private _onAllOff = (): void => {
    if (!this._armed) {
      this._armed = true;
      if (this._armTimer !== undefined) clearTimeout(this._armTimer);
      this._armTimer = window.setTimeout(() => {
        this._armed = false;
        this._armTimer = undefined;
      }, ALL_OFF_ARM_MS);
      return;
    }
    // Confirmed second tap.
    if (this._armTimer !== undefined) clearTimeout(this._armTimer);
    this._armTimer = undefined;
    this._armed = false;
    this._flash = true;
    this.callService('light', 'turn_off', undefined, 'all');
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._flashTimer = window.setTimeout(() => {
      this._flash = false;
      this._flashTimer = undefined;
    }, FLASH_MS);
  };

  private _activateScene(entity: string): void {
    this.callService('scene', 'turn_on', undefined, entity);
  }

  // ── Render ────────────────────────────────────────────────
  private _lightRow(l: HubRoomLight): TemplateResult {
    const st = this.hass.states[l.entity];
    if (!isLightLive(st)) {
      return html`
        <div class="dead-row">
          <span class="dead-name">${l.name}</span>
          <span class="dead-state">Ej tillgänglig</span>
        </div>
      `;
    }
    return html`
      <glass-light-slider
        .hass=${this.hass}
        ._config=${{ type: 'glass-light-slider', entity: l.entity, name: l.name }}
      ></glass-light-slider>
    `;
  }

  private _sceneChip(s: HubRoomScene): TemplateResult {
    return html`
      <button class="scene-chip" @click=${() => this._activateScene(s.entity)}>
        ${s.name}
      </button>
    `;
  }

  private _roomCard(room: HubRoom): TemplateResult {
    const summary = roomLightSummary(room, this.hass.states);
    const active = summary.onCount > 0;
    const ic = icons[room.icon];
    return html`
      <div class="room ${active ? 'active' : ''}">
        <div class="room-head">
          <span class="room-ic">${ic ?? ''}</span>
          <div>
            <b class="room-name">${room.name}</b>
            <small class="room-meta">${summary.label}</small>
          </div>
        </div>
        <div class="lights">${room.lights.map((l) => this._lightRow(l))}</div>
        ${room.scenes?.length
          ? html`<div class="scenes">${room.scenes.map((s) => this._sceneChip(s))}</div>`
          : nothing}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.config;
    const totals = totalLightsOn(cfg, this.hass.states);

    return html`
      <div class="page">
        <div class="header">
          <div class="heading">
            <span class="title">Ljus</span>
            <span class="subtitle">
              ${totals.on > 0
                ? html`<span class="lit">${totals.on} tända</span>`
                : html`Allt släckt`}
            </span>
          </div>
          <div class="actions">
            ${(cfg.scenes ?? []).map(
              (s) => html`
                <button
                  class="action"
                  @click=${() => this._activateScene(s.entity)}
                >
                  ${icons[s.icon] ? html`<span class="ic">${icons[s.icon]}</span>` : nothing}
                  <span>${s.name}</span>
                </button>
              `,
            )}
            <button
              class="action ${this._armed ? 'armed' : ''} ${this._flash ? 'flash' : ''}"
              aria-label="Släck alla lampor"
              @click=${this._onAllOff}
            >
              <span class="ic">${icons.power}</span>
              <span>${this._armed ? 'Säker? Tryck igen' : 'Allt släckt'}</span>
            </button>
          </div>
        </div>

        <div class="body">
          <div class="rooms">
            ${(cfg.rooms ?? []).map((r) => this._roomCard(r))}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lights-page', HubLightsPage);
