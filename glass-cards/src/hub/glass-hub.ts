import { html, css, svg, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import { hubTokens, ensureFonts } from '../styles/tokens.js';
import {
  resolveTheme,
  getStoredOverride,
  setStoredOverride,
  type ThemeOverride,
  type HubTheme,
} from './theme-controller.js';
import { settlePage } from './swipe.js';
import type { HubConfig } from './hub-config.js';
import './widgets/hub-clock.js';
import './widgets/hub-status-chip.js';
import './widgets/hub-room-tile.js';

const DEFAULT_PAGES = ['hem', 'ljus', 'media', 'energi', 'kcal'];

const PAGE_TITLES: Record<string, string> = {
  hem: 'Hem',
  ljus: 'Ljus',
  media: 'Media',
  energi: 'Energi',
  kcal: 'Kcal',
};

function pageTitle(id: string): string {
  return PAGE_TITLES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

const THEME_CYCLE: ThemeOverride[] = ['auto', 'dag', 'natt'];

export class GlassHub extends GlassBaseElement {
  @property({ reflect: true, attribute: 'data-theme' }) theme: HubTheme = 'natt';

  @state() private _page = 0;
  @state() private _dragX = 0;

  private _override: ThemeOverride = getStoredOverride();
  private _idleTimer?: number;

  // pointer / swipe tracking
  private _dragging = false;
  private _startX = 0;
  private _lastX = 0;
  private _lastT = 0;
  private _velocity = 0;

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
      }

      .strip {
        display: flex;
        height: 100%;
        will-change: transform;
        touch-action: pan-y;
      }

      .page {
        flex: 0 0 calc(100% / var(--page-count));
        height: 100%;
        overflow: hidden;
        position: relative;
      }

      .page-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin: 0;
        font-family: var(--hub-font-display);
        font-weight: 300;
        font-size: clamp(32px, 6vw, 64px);
        color: var(--hub-text-muted);
        letter-spacing: 0.02em;
      }

      .theme-toggle {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        z-index: 20;
        -webkit-tap-highlight-color: transparent;
      }
      .theme-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
      }

      .dots {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        z-index: 20;
      }
      .dot {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dot::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--hub-text-dim);
        transition: background 0.25s ease, transform 0.25s ease;
      }
      .dot.active::before {
        background: var(--hub-text);
        transform: scale(1.15);
      }
    `,
  ];

  setConfig(config: HubConfig): void {
    super.setConfig(config);
  }

  private get _cfg(): HubConfig {
    return this._config as unknown as HubConfig;
  }

  private get _pages(): string[] {
    return this._cfg?.pages ?? DEFAULT_PAGES;
  }

  connectedCallback(): void {
    super.connectedCallback();
    ensureFonts();
    this._applyTheme();
    this._resetIdle();
    this.addEventListener('pointerdown', this._onAnyInteraction);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearIdle();
    this.removeEventListener('pointerdown', this._onAnyInteraction);
  }

  willUpdate(changed: PropertyValues): void {
    if (changed.has('hass')) this._applyTheme();
  }

  goToPage(id: string): void {
    const idx = this._pages.indexOf(id);
    if (idx >= 0) {
      this._page = idx;
      this._dragX = 0;
    }
  }

  // ── Theme ────────────────────────────────────────────────
  private _applyTheme(): void {
    const elevation = this.hass?.states['sun.sun']?.attributes?.elevation;
    const sunElev = typeof elevation === 'number' ? elevation : null;
    this.theme = resolveTheme(sunElev, this._override, this._cfg?.day_elevation ?? 4);
  }

  private _cycleTheme(): void {
    const idx = THEME_CYCLE.indexOf(this._override);
    this._override = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setStoredOverride(this._override);
    this._applyTheme();
  }

  // ── Idle return ──────────────────────────────────────────
  private _onAnyInteraction = (): void => {
    this._resetIdle();
  };

  private _resetIdle(): void {
    this._clearIdle();
    const secs = this._cfg?.idle_return_s ?? 120;
    this._idleTimer = window.setTimeout(() => {
      if (this._page !== 0) this.goToPage(this._pages[0]);
    }, secs * 1000);
  }

  private _clearIdle(): void {
    if (this._idleTimer !== undefined) {
      clearTimeout(this._idleTimer);
      this._idleTimer = undefined;
    }
  }

  // ── Swipe ────────────────────────────────────────────────
  private _onPointerDown = (e: PointerEvent): void => {
    this._dragging = true;
    this._startX = e.clientX;
    this._lastX = e.clientX;
    this._lastT = e.timeStamp;
    this._velocity = 0;
    this._dragX = 0;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    const dt = e.timeStamp - this._lastT;
    if (dt > 0) this._velocity = (e.clientX - this._lastX) / dt;
    this._lastX = e.clientX;
    this._lastT = e.timeStamp;
    this._dragX = e.clientX - this._startX;
  };

  private _onPointerUp = (e: PointerEvent): void => {
    if (!this._dragging) return;
    this._dragging = false;
    const viewportW = this.clientWidth || window.innerWidth;
    this._page = settlePage(
      this._dragX,
      viewportW,
      this._velocity,
      this._page,
      this._pages.length,
    );
    this._dragX = 0;
    this._velocity = 0;
  };

  // ── Render ───────────────────────────────────────────────
  private _themeGlyph(): TemplateResult {
    if (this._override === 'auto') {
      return html`<span class="glyph-auto">A</span>`;
    }
    if (this._override === 'dag') {
      return svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
        <line x1="4.9" y1="4.9" x2="7" y2="7"></line>
        <line x1="17" y1="17" x2="19.1" y2="19.1"></line>
        <line x1="4.9" y1="19.1" x2="7" y2="17"></line>
        <line x1="17" y1="7" x2="19.1" y2="4.9"></line>
      </svg>`;
    }
    // natt
    return svg`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"></path>
    </svg>`;
  }

  render() {
    const pages = this._pages;
    const n = pages.length;
    const stripStyle =
      `--page-count:${n};` +
      `width:calc(100% * ${n});` +
      `transform:translateX(calc(${-this._page} * 100% / ${n} + ${this._dragX}px));` +
      `transition:${this._dragging ? 'none' : 'transform 320ms cubic-bezier(.3,.7,.3,1)'};`;

    return html`
      <div
        class="strip"
        style=${stripStyle}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
      >
        ${pages.map(
          (id) => html`
            <section class="page" data-page-id=${id}>
              <h1 class="page-placeholder">${pageTitle(id)}</h1>
            </section>
          `,
        )}
      </div>

      <button
        class="theme-toggle"
        aria-label="Byt tema"
        @click=${this._cycleTheme}
      >
        ${this._themeGlyph()}
      </button>

      <div class="dots">
        ${pages.map(
          (id, i) => html`
            <button
              class="dot ${i === this._page ? 'active' : ''}"
              aria-label=${pageTitle(id)}
              @click=${() => this.goToPage(id)}
            ></button>
          `,
        )}
      </div>
    `;
  }
}

customElements.define('glass-hub', GlassHub);
