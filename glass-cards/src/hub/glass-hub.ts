import { html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
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
import { getWeatherBgEnabled, setWeatherBgEnabled, installForceHook } from './weather-settings.js';
import { settlePage, isDrag, isHorizontalDrag } from './swipe.js';
import { icons } from './widgets/icons.js';
import type { HubConfig, HubRoom } from './hub-config.js';
import './pages/hub-home-page.js';
import './pages/hub-lights-page.js';
import './pages/hub-energy-page.js';
import './pages/hub-media-page.js';
import './pages/hub-kcal-page.js';
import './pages/hub-planner-page.js';
import './widgets/hub-room-popup.js';
import './widgets/hub-light-popup.js';
import './widgets/hub-transit-popup.js';
import './widgets/hub-weather-popup.js';
import './widgets/hub-nav-bar.js';

const DEFAULT_PAGES = ['hem', 'ljus', 'media', 'energi', 'kcal', 'vecka'];

const PAGE_TITLES: Record<string, string> = {
  hem: 'Hem',
  ljus: 'Ljus',
  media: 'Media',
  energi: 'Energi',
  kcal: 'Kcal',
  vecka: 'Vecka',
};

function pageTitle(id: string): string {
  return PAGE_TITLES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

const THEME_CYCLE: ThemeOverride[] = ['auto', 'dag', 'natt'];

// Active page index kept at module scope so it survives a re-mount of the
// element (e.g. Home Assistant rebuilding the card). Only interactive
// navigation and the idle timer change it; a theme change must never reset it.
let lastActivePage = 0;

export class GlassHub extends GlassBaseElement {
  @property({ reflect: true, attribute: 'data-theme' }) theme: HubTheme = 'natt';

  // Reflected so CSS can add a top inset for HA's header only when the hub is
  // NOT in kiosk mode (kiosk-mode hides that header). URL is fixed per load.
  @property({ reflect: true, type: Boolean }) kiosk = new URLSearchParams(
    location.search,
  ).has('kiosk');

  @state() private _page = 0;
  @state() private _dragX = 0;
  @state() private _openRoom: HubRoom | null = null;
  @state() private _openLight: { entity: string; name: string } | null = null;
  @state() private _openTransit = false;
  @state() private _openWeather = false;
  @state() private _weatherBgOn = getWeatherBgEnabled();

  private _override: ThemeOverride = getStoredOverride();
  private _idleTimer?: number;
  private _kioskTimer?: number;

  // pointer / swipe tracking
  private _pointerActive = false;   // pointer is down, gesture undecided
  private _dragging = false;        // gesture locked to a horizontal deck swipe
  private _startX = 0;
  private _startY = 0;
  private _lastX = 0;
  private _lastT = 0;
  private _velocity = 0;

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
      }
      /* Outside kiosk mode HA still shows its own header on top of us; inset
         the whole hub so the top row clears it. HA exposes --header-height. */
      :host(:not([kiosk])) {
        padding-top: var(--header-height, 56px);
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
        box-sizing: border-box;
        padding-bottom: var(--hub-nav-h);
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
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

      /* Quiet control cluster — slotted into the nav bar's right edge. */
      .theme-toggle,
      .kiosk-toggle {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-dim);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .theme-toggle svg,
      .kiosk-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
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
    this._page = lastActivePage;   // survive a re-mount without snapping to Hem
    this._resetIdle();
    this._startKioskDrawerShim();
    installForceHook();
    this.addEventListener('pointerdown', this._onAnyInteraction);
    this.addEventListener('hub-room-open', this._onRoomOpen as EventListener);
    this.addEventListener('hub-light-open', this._onLightOpen as EventListener);
    this.addEventListener('hub-transit-open', this._onTransitOpen);
    this.addEventListener('hub-goto-page', this._onGotoPage as EventListener);
    this.addEventListener('hub-popup-close', this._onPopupClose);
    this.addEventListener('hub-weather-open', this._onWeatherOpen);
    this.addEventListener('hub-weather-bg-toggle', this._onWeatherBgToggle as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearIdle();
    if (this._kioskTimer !== undefined) {
      clearInterval(this._kioskTimer);
      this._kioskTimer = undefined;
    }
    this.removeEventListener('pointerdown', this._onAnyInteraction);
    this.removeEventListener('hub-room-open', this._onRoomOpen as EventListener);
    this.removeEventListener('hub-light-open', this._onLightOpen as EventListener);
    this.removeEventListener('hub-transit-open', this._onTransitOpen);
    this.removeEventListener('hub-goto-page', this._onGotoPage as EventListener);
    this.removeEventListener('hub-popup-close', this._onPopupClose);
    this.removeEventListener('hub-weather-open', this._onWeatherOpen);
    this.removeEventListener('hub-weather-bg-toggle', this._onWeatherBgToggle as EventListener);
  }

  // ── Room popup + cross-widget navigation ─────────────────
  private _onRoomOpen = (e: CustomEvent<{ roomId: string }>): void => {
    const id = e.detail?.roomId;
    this._openRoom = this._cfg?.rooms?.find((r) => r.id === id) ?? null;
  };

  private _onLightOpen = (e: CustomEvent<{ entity: string; name: string }>): void => {
    const d = e.detail;
    this._openLight = d?.entity ? { entity: d.entity, name: d.name ?? d.entity } : null;
  };

  private _onGotoPage = (e: CustomEvent<{ page: string }>): void => {
    const page = e.detail?.page;
    if (page) this.goToPage(page);
  };

  private _onTransitOpen = (): void => {
    this._openTransit = true;
  };

  private _onWeatherOpen = (): void => {
    this._openWeather = true;
  };

  private _onWeatherBgToggle = (e: CustomEvent<{ on: boolean }>): void => {
    this._weatherBgOn = e.detail?.on ?? getWeatherBgEnabled();
    setWeatherBgEnabled(this._weatherBgOn);
  };

  private _onPopupClose = (): void => {
    this._openRoom = null;
    this._openLight = null;
    this._openTransit = false;
    this._openWeather = false;
  };

  willUpdate(changed: PropertyValues): void {
    if (changed.has('hass')) this._applyTheme();
  }

  goToPage(id: string): void {
    const idx = this._pages.indexOf(id);
    if (idx >= 0) {
      this._page = idx;
      lastActivePage = idx;
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

  // ── Kiosk toggle ─────────────────────────────────────────
  // The kiosk-mode plugin and the drawer shim both read the ?kiosk param at
  // load, so flipping it means rewriting the URL and reloading. Any other
  // query params are preserved (none are expected in normal use).
  private _toggleKiosk(): void {
    const params = new URLSearchParams(location.search);
    if (params.has('kiosk')) {
      params.delete('kiosk');
    } else {
      params.set('kiosk', 'true');
    }
    const qs = params.toString();
    location.assign(location.pathname + (qs ? `?${qs}` : ''));
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

  // ── Kiosk drawer-width compat shim ───────────────────────
  // With ?kiosk=true the kiosk-mode plugin hides HA's header/sidebar, but
  // ha-drawer (HA 2025.12) still RESERVES the sidebar width — --mdc-drawer-width
  // stays calc(256px + 0px), so hui-root starts at x=256 and a 256px gutter
  // shows on the left. Zero the width ourselves. Strictly gated on the kiosk
  // query param so normal browsing keeps its sidebar layout. The drawer may not
  // exist on first tick, so retry briefly until it applies.
  private _startKioskDrawerShim(): void {
    if (!new URLSearchParams(location.search).has('kiosk')) return;
    const start = Date.now();
    const apply = (): boolean => {
      const main = document
        .querySelector('home-assistant')
        ?.shadowRoot?.querySelector('home-assistant-main') as HTMLElement | null;
      if (!main) return false;
      main.style.setProperty('--mdc-drawer-width', '0px');
      const drawer = main.shadowRoot?.querySelector('ha-drawer') as HTMLElement | null;
      drawer?.style.setProperty('--mdc-drawer-width', '0px');
      return true;
    };
    if (apply()) return;
    this._kioskTimer = window.setInterval(() => {
      if (apply() || Date.now() - start > 5000) {
        clearInterval(this._kioskTimer);
        this._kioskTimer = undefined;
      }
    }, 250);
  }

  // ── Swipe ────────────────────────────────────────────────
  // The gesture stays undecided until it crosses the drag slop. Two things are
  // deferred to that moment: (1) pointer capture — capturing at pointerdown
  // would retarget the resulting click to the strip and swallow taps on child
  // tiles/buttons; (2) the axis decision — a vertical-dominant gesture is a
  // scroll, so we bail without capturing and let the page scroll natively.
  private _onPointerDown = (e: PointerEvent): void => {
    this._pointerActive = true;
    this._dragging = false;
    this._startX = e.clientX;
    this._startY = e.clientY;
    this._lastX = e.clientX;
    this._lastT = e.timeStamp;
    this._velocity = 0;
    this._dragX = 0;
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._pointerActive) return;
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;

    if (!this._dragging) {
      if (!isDrag(dx) && !isDrag(dy)) return;   // still within tap slop
      if (!isHorizontalDrag(dx, dy)) {
        // vertical-dominant → this is a scroll; stop tracking and never
        // capture, so the page scrolls natively for the rest of the gesture.
        this._pointerActive = false;
        return;
      }
      // horizontal swipe: take over. Capture so it keeps flowing if it leaves
      // the strip, and re-base velocity from here.
      this._dragging = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      this._lastX = e.clientX;
      this._lastT = e.timeStamp;
    }

    const dt = e.timeStamp - this._lastT;
    if (dt > 0) this._velocity = (e.clientX - this._lastX) / dt;
    this._lastX = e.clientX;
    this._lastT = e.timeStamp;
    this._dragX = dx;
  };

  private _onPointerUp = (e: PointerEvent): void => {
    if (!this._pointerActive) return;
    const wasDragging = this._dragging;
    this._pointerActive = false;
    this._dragging = false;

    if (wasDragging) {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      const viewportW = this.clientWidth || window.innerWidth;
      this._page = settlePage(
        this._dragX,
        viewportW,
        this._velocity,
        this._page,
        this._pages.length,
      );
      lastActivePage = this._page;
    }
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
              ${id === 'hem'
                ? html`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                    .theme=${this.theme}
                    .weatherBg=${this._weatherBgOn}
                    .pageActive=${pages[this._page] === 'hem'}
                  ></hub-home-page>`
                : id === 'ljus'
                  ? html`<hub-lights-page
                      .hass=${this.hass}
                      .config=${this._cfg}
                    ></hub-lights-page>`
                  : id === 'energi'
                    ? html`<hub-energy-page
                        .hass=${this.hass}
                        .config=${this._cfg}
                      ></hub-energy-page>`
                    : id === 'media'
                      ? html`<hub-media-page
                          .hass=${this.hass}
                          .config=${this._cfg}
                        ></hub-media-page>`
                      : id === 'kcal'
                        ? html`<hub-kcal-page
                            .hass=${this.hass}
                            .config=${this._cfg}
                          ></hub-kcal-page>`
                        : id === 'vecka'
                          ? html`<hub-planner-page
                              .hass=${this.hass}
                              .config=${this._cfg}
                            ></hub-planner-page>`
                          : html`<h1 class="page-placeholder">${pageTitle(id)}</h1>`}
            </section>
          `,
        )}
      </div>

      <hub-nav-bar .pages=${pages} .active=${this._page}>
        <button
          slot="controls"
          class="kiosk-toggle"
          aria-label=${this.kiosk ? 'Avsluta helskärm' : 'Helskärmsläge'}
          @click=${this._toggleKiosk}
        >
          ${this.kiosk ? icons.compress : icons.expand}
        </button>
        <button
          slot="controls"
          class="theme-toggle"
          aria-label="Byt tema"
          @click=${this._cycleTheme}
        >
          ${this._themeGlyph()}
        </button>
      </hub-nav-bar>

      ${this._openRoom
        ? html`<hub-room-popup
            .hass=${this.hass}
            .room=${this._openRoom}
          ></hub-room-popup>`
        : nothing}
      ${this._openLight
        ? html`<hub-light-popup
            .hass=${this.hass}
            .entity=${this._openLight.entity}
            .name=${this._openLight.name}
          ></hub-light-popup>`
        : nothing}
      ${this._openTransit
        ? html`<hub-transit-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-transit-popup>`
        : nothing}
      ${this._openWeather
        ? html`<hub-weather-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-weather-popup>`
        : nothing}
    `;
  }
}

customElements.define('glass-hub', GlassHub);
