import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardConfig } from '../types.js';

interface GlassBackgroundConfig extends LovelaceCardConfig {
  cards?: LovelaceCardConfig[];
  views?: string[];
  default_view?: string;
}

@customElement('glass-background')
export class GlassBackground extends LitElement {
  @property({ attribute: false }) _config!: GlassBackgroundConfig;
  @property({ attribute: false }) _cards: (HTMLElement & { hass?: HomeAssistant })[] = [];
  @state() private _activeView: string | null = null;

  private _hass!: HomeAssistant;
  private _cardConfigs: LovelaceCardConfig[] = [];
  private _boundHashChange = this._onHashChange.bind(this);

  static styles = [
    css`
      :host {
        display: block;
        min-height: 100vh;
        position: relative;
      }
      .background {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #0b1120;
        z-index: -1;
      }
      .content {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 8px;
        padding-bottom: 72px;
        max-width: 600px;
        margin: 0 auto;
      }
      /* Full-width cards */
      .content > glass-header,
      .content > glass-nav-bar,
      .content > glass-popup,
      .content > glass-info-row,
      .content > glass-section,
      .content > glass-light-slider,
      .content > glass-departure-card {
        grid-column: 1 / -1;
      }
      /* Buttons and room cards fill 1 column each */
      .content > glass-button,
      .content > glass-room-card {
        grid-column: span 1;
      }
      /* Responsive: wider screens get more breathing room */
      @media (min-width: 600px) {
        .content {
          gap: 12px;
          padding: 12px;
          padding-bottom: 80px;
          max-width: 700px;
        }
      }
      /* Desktop: allow 3 columns for buttons */
      @media (min-width: 900px) {
        .content {
          max-width: 900px;
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('hashchange', this._boundHashChange);
    this._activeView = this._getViewFromHash() ?? this._config?.default_view ?? null;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._boundHashChange);
  }

  private _onHashChange(): void {
    const view = this._getViewFromHash();
    // Only update active view for known view hashes (not popup hashes)
    if (view !== null) {
      this._activeView = view;
    }
    // If hash is empty, go back to default view
    if (!location.hash || location.hash === '#') {
      this._activeView = this._config?.default_view ?? null;
    }
  }

  private _getViewFromHash(): string | null {
    const hash = location.hash.replace('#', '');
    if (!hash) return null;
    const views = this._config?.views ?? [];
    if (views.includes(hash)) {
      return hash;
    }
    // Hash is not a known view (it's a popup or unknown) — ignore
    return null;
  }

  setConfig(config: GlassBackgroundConfig): void {
    this._config = config;
    this._activeView = this._getViewFromHash() ?? config.default_view ?? null;
    this._createCards();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._cards.forEach((card) => {
      card.hass = hass;
    });
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  private _createCards(): void {
    if (!this._config.cards) return;
    this._cardConfigs = this._config.cards;
    this._cards = this._config.cards.map((config) => {
      const tag = config.type?.startsWith('custom:')
        ? config.type.replace('custom:', '')
        : `hui-${config.type}-card`;
      const el = document.createElement(tag) as HTMLElement & {
        setConfig: (c: LovelaceCardConfig) => void;
        hass?: HomeAssistant;
      };
      if (typeof el.setConfig === 'function') {
        el.setConfig(config);
      }
      return el;
    });
    this.requestUpdate();
  }

  render() {
    const visibleCards = this._cards.filter((_, index) => {
      const config = this._cardConfigs[index];
      // Cards without a view property are always shown
      if (!config || !(config as Record<string, unknown>).view) return true;
      // Cards with a view property are shown only when their view is active
      return (config as Record<string, unknown>).view === this._activeView;
    });

    return html`
      <div class="background"></div>
      <div class="content">
        ${visibleCards.map((card) => card)}
      </div>
    `;
  }

  getCardSize(): number {
    return 6;
  }
}
