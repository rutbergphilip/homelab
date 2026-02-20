import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { glassAnimations } from '../styles/animations.js';
import type { HomeAssistant, LovelaceCardConfig } from '../types.js';

interface GlassPopupConfig extends LovelaceCardConfig {
  hash: string;
  title?: string;
  icon?: string;
  cards?: LovelaceCardConfig[];
}

@customElement('glass-popup')
export class GlassPopup extends LitElement {
  @property({ attribute: false }) _config!: GlassPopupConfig;
  @state() private _isOpen = false;
  @state() private _isClosing = false;
  private _cards: (HTMLElement & { hass?: HomeAssistant })[] = [];

  static styles = [
    glassAnimations,
    css`
      :host { display: block; }
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .overlay.open {
        pointer-events: auto;
        opacity: 1;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        overflow-y: auto;
        background: rgba(20, 20, 40, 0.85);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px 24px 0 0;
        padding: 20px;
        padding-bottom: 40px;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .overlay.open .panel { transform: translateY(0); }
      .overlay.closing .panel { transform: translateY(100%); }
      .handle {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 auto 16px;
      }
      .popup-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .popup-header ha-icon {
        --mdc-icon-size: 24px;
        color: rgba(79, 195, 247, 0.8);
      }
      .popup-title {
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
      .popup-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('hashchange', this._onHashChange);
    this._checkHash();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private _onHashChange = (): void => { this._checkHash(); };

  private _checkHash(): void {
    if (!this._config?.hash) return;
    const hash = window.location.hash.replace('#', '');
    if (hash === this._config.hash && !this._isOpen) {
      this._open();
    } else if (hash !== this._config.hash && this._isOpen) {
      this._close();
    }
  }

  private _open(): void {
    this._isOpen = true;
    this._isClosing = false;
    this._createPopupCards();
  }

  private _close(): void {
    this._isClosing = true;
    setTimeout(() => {
      this._isOpen = false;
      this._isClosing = false;
    }, 350);
    if (window.location.hash.replace('#', '') === this._config.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  private _handleBackdropClick(): void { this._close(); }

  setConfig(config: GlassPopupConfig): void {
    if (!config.hash) throw new Error('glass-popup requires a "hash" property');
    this._config = config;
  }

  set hass(hass: HomeAssistant) {
    (this as unknown as { _hass: HomeAssistant })._hass = hass;
    this._cards.forEach((card) => { card.hass = hass; });
  }

  get hass(): HomeAssistant {
    return (this as unknown as { _hass: HomeAssistant })._hass;
  }

  private _createPopupCards(): void {
    if (!this._config?.cards) return;
    this._cards = this._config.cards.map((config) => {
      const tag = config.type?.startsWith('custom:')
        ? config.type.replace('custom:', '')
        : `hui-${config.type}-card`;
      const el = document.createElement(tag) as HTMLElement & {
        setConfig: (c: LovelaceCardConfig) => void;
        hass?: HomeAssistant;
      };
      if (typeof el.setConfig === 'function') el.setConfig(config);
      if (this.hass) el.hass = this.hass;
      return el;
    });
    this.requestUpdate();
  }

  render() {
    if (!this._isOpen && !this._isClosing) return html``;
    return html`
      <div class="overlay ${this._isOpen && !this._isClosing ? 'open' : ''} ${this._isClosing ? 'closing' : ''}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title ? html`
            <div class="popup-header">
              ${this._config.icon ? html`<ha-icon .icon=${this._config.icon}></ha-icon>` : ''}
              <span class="popup-title">${this._config.title}</span>
            </div>
          ` : ''}
          <div class="popup-cards">
            ${this._cards.map((card) => card)}
          </div>
        </div>
      </div>
    `;
  }

  getCardSize(): number { return 0; }
}
