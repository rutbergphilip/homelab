import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import type { GlassCardConfig } from '../types.js';

interface GlassChipConfig extends GlassCardConfig {
  chip_type?: 'person' | 'battery' | 'lights' | 'custom';
  content?: string;
}

@customElement('glass-chip')
export class GlassChip extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--glass-radius-pill);
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        white-space: nowrap;
        cursor: default;
        transition: all var(--glass-transition);
      }
      .chip.active {
        color: var(--glass-text-primary);
        background: rgba(79, 195, 247, 0.12);
        border-color: rgba(79, 195, 247, 0.2);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
      .chip .value {
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  setConfig(config: GlassChipConfig): void {
    super.setConfig(config);
    if (config.entity) {
      this.setTrackedEntities([config.entity]);
    }
  }

  private get _chipConfig(): GlassChipConfig {
    return this._config as GlassChipConfig;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const entity = this._config.entity ? this.getEntity(this._config.entity) : undefined;
    const chipType = this._chipConfig.chip_type ?? 'custom';
    let icon = this._config.icon ?? '';
    let value = '';
    let isActive = false;

    switch (chipType) {
      case 'person': {
        const name = entity?.attributes.friendly_name ?? '';
        const state = entity?.state ?? '';
        icon = icon || 'mdi:account';
        value = `${name} \u00b7 ${state === 'home' ? 'Hemma' : 'Borta'}`;
        isActive = state === 'home';
        break;
      }
      case 'battery': {
        const level = entity?.state ?? '?';
        icon = icon || 'mdi:cellphone';
        value = `${level} %`;
        isActive = Number(level) > 20;
        break;
      }
      case 'lights': {
        const count = entity?.state ?? '0';
        icon = icon || 'mdi:lightbulb-group';
        value = `${count} st`;
        isActive = Number(count) > 0;
        break;
      }
      default: {
        icon = icon || 'mdi:information';
        value = this._chipConfig.content ?? entity?.state ?? '';
        break;
      }
    }

    return html`
      <div class="chip ${isActive ? 'active' : ''}">
        <ha-icon .icon=${icon}></ha-icon>
        <span class="value">${value}</span>
      </div>
    `;
  }
}
