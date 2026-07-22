import { html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from '../widgets/icons.js';
import type { HubConfig, HubRoom } from '../hub-config.js';
import type { HassEntity } from '../../types.js';
import { isDrag } from '../swipe.js';
import { roomTapPlan } from '../light-actions.js';
import '../widgets/hub-light-tile.js';

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
  private _headPressTimer?: number;
  private _headLongPressed = false;
  private _headDownX = 0;
  private _headDownY = 0;

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

      /* ── Room sections in a 3-column flow ─────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto; /* emergency fallback only — content must fit 1280×800 */
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
        columns: 3;
        column-gap: var(--hub-gap);
      }
      @media (max-width: 1100px) {
        .body {
          columns: 2;
        }
      }
      @media (max-width: 600px) {
        .body {
          columns: 1;
        }
      }

      .section {
        break-inside: avoid;
        margin-bottom: 16px;
      }
      .sec-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2px 4px 8px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .sec-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sec-head.active .sec-name {
        color: var(--hub-amber-text);
      }
      .sec-meta {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .sec-head.active .sec-meta {
        color: var(--hub-amber-muted);
      }
      .tiles {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      hub-light-tile {
        display: block;
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
    this._cancelHeadPress();
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
  private _onHeadDown(e: PointerEvent, room: HubRoom): void {
    this._headLongPressed = false;
    this._headDownX = e.clientX;
    this._headDownY = e.clientY;
    this._headPressTimer = window.setTimeout(() => {
      this._headLongPressed = true;
      this.dispatchEvent(
        new CustomEvent('hub-room-open', {
          detail: { roomId: room.id },
          bubbles: true,
          composed: true,
        }),
      );
    }, 500);
  }

  private _onHeadMove = (e: PointerEvent): void => {
    if (this._headPressTimer === undefined) return;
    if (isDrag(e.clientX - this._headDownX) || isDrag(e.clientY - this._headDownY)) {
      this._cancelHeadPress();
    }
  };

  private _cancelHeadPress = (): void => {
    if (this._headPressTimer !== undefined) {
      clearTimeout(this._headPressTimer);
      this._headPressTimer = undefined;
    }
  };

  private _onHeadClick(room: HubRoom): void {
    if (this._headLongPressed) {
      this._headLongPressed = false;
      return;
    }
    const plan = roomTapPlan(room, this.hass.states);
    this.callService('light', plan.service, { entity_id: plan.entities });
  }

  private _section(room: HubRoom): TemplateResult {
    const summary = roomLightSummary(room, this.hass.states);
    const active = summary.onCount > 0;
    return html`
      <div class="section">
        <div
          class="sec-head ${active ? 'active' : ''}"
          @pointerdown=${(e: PointerEvent) => this._onHeadDown(e, room)}
          @pointermove=${this._onHeadMove}
          @pointerup=${this._cancelHeadPress}
          @pointercancel=${this._cancelHeadPress}
          @pointerleave=${this._cancelHeadPress}
          @click=${() => this._onHeadClick(room)}
        >
          <span class="sec-name">${room.name}</span>
          <span class="sec-meta">${summary.label}</span>
        </div>
        <div class="tiles">
          ${room.lights.map(
            (l) => html`<hub-light-tile .hass=${this.hass} .light=${l}></hub-light-tile>`,
          )}
        </div>
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
          ${(cfg.rooms ?? []).map((r) => this._section(r))}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lights-page', HubLightsPage);
