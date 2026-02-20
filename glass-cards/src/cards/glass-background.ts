import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { glassAnimations } from '../styles/animations.js';
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
    glassAnimations,
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
        background: linear-gradient(135deg, #0a0a2e 0%, #1a0a30 25%, #0a1a2e 50%, #0d0a25 75%, #0a0a2e 100%);
        background-size: 400% 400%;
        animation: gradientShift 30s ease infinite;
        z-index: -1;
      }
      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        padding-bottom: 80px;
        max-width: 500px;
        margin: 0 auto;
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
      if (card.hass !== undefined) card.hass = hass;
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
