import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardConfig } from '../types.js';

interface GlassBackgroundConfig extends LovelaceCardConfig {
  cards?: LovelaceCardConfig[];
}

@customElement('glass-background')
export class GlassBackground extends LitElement {
  @property({ attribute: false }) _config!: GlassBackgroundConfig;
  @property({ attribute: false }) _cards: (HTMLElement & { hass?: HomeAssistant })[] = [];

  private _hass!: HomeAssistant;

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
      .content > glass-section {
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

  setConfig(config: GlassBackgroundConfig): void {
    this._config = config;
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
    return html`
      <div class="background"></div>
      <div class="content">
        ${this._cards.map((card) => card)}
      </div>
    `;
  }

  getCardSize(): number {
    return 6;
  }
}
