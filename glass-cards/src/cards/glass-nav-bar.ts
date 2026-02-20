import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardConfig } from '../types.js';

interface NavItem {
  icon: string;
  label: string;
  hash: string;
}

interface GlassNavBarConfig extends LovelaceCardConfig {
  items: NavItem[];
}

@customElement('glass-nav-bar')
export class GlassNavBar extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) _config!: GlassNavBarConfig;
  @state() private _activeHash = '';

  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 0 12px 12px;
      pointer-events: none;
    }
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      max-width: 500px;
      margin: 0 auto;
      padding: 8px 4px;
      background: rgba(15, 15, 35, 0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 6px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .nav-item:active { transform: scale(0.92); }
    .nav-item.active { background: rgba(79, 195, 247, 0.10); }
    .nav-item.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 2px;
      border-radius: 1px;
      background: #4FC3F7;
      box-shadow: 0 0 8px rgba(79, 195, 247, 0.5);
    }
    .nav-item ha-icon {
      --mdc-icon-size: 22px;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active ha-icon { color: #4FC3F7; }
    .nav-label {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active .nav-label { color: rgba(255, 255, 255, 0.85); }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._activeHash = window.location.hash.replace('#', '') || this._config?.items?.[0]?.hash || '';
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private _onHashChange = (): void => {
    const hash = window.location.hash.replace('#', '');
    const isNavHash = this._config.items.some((item) => item.hash === hash);
    if (isNavHash) this._activeHash = hash;
  };

  setConfig(config: GlassNavBarConfig): void {
    if (!config.items?.length) throw new Error('glass-nav-bar requires "items"');
    this._config = config;
  }

  private _handleTap(hash: string): void {
    this._activeHash = hash;
    window.location.hash = hash;
  }

  render() {
    if (!this._config?.items) return html``;
    return html`
      <div class="nav-bar">
        ${this._config.items.map((item) => html`
          <div class="nav-item ${this._activeHash === item.hash ? 'active' : ''}" @click=${() => this._handleTap(item.hash)}>
            <ha-icon .icon=${item.icon}></ha-icon>
            <span class="nav-label">${item.label}</span>
          </div>
        `)}
      </div>
    `;
  }

  getCardSize(): number { return 0; }
}
