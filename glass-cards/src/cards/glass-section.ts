import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardConfig } from '../types.js';

interface GlassSectionConfig extends LovelaceCardConfig {
  label: string;
  icon?: string;
}

@customElement('glass-section')
export class GlassSection extends LitElement {
  @property({ attribute: false }) _config!: GlassSectionConfig;

  set hass(_hass: HomeAssistant) {}

  static styles = css`
    :host { display: block; }
    .section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 4px 0;
    }
    .label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.35);
    }
    ha-icon {
      --mdc-icon-size: 14px;
      color: rgba(255, 255, 255, 0.25);
    }
  `;

  setConfig(config: GlassSectionConfig): void {
    if (!config.label) throw new Error('glass-section requires a "label" property');
    this._config = config;
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="section">
        ${this._config.icon ? html`<ha-icon .icon=${this._config.icon}></ha-icon>` : ''}
        <span class="label">${this._config.label}</span>
      </div>
    `;
  }

  getCardSize(): number { return 0; }
}
