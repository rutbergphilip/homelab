import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import { getGreeting } from '../utils/time-helpers.js';
import { getWeatherIcon } from '../utils/ha-utils.js';
import type { GlassCardConfig } from '../types.js';

interface ChipConfig {
  chip_type: string;
  entity: string;
  icon?: string;
}

interface GlassHeaderConfig extends GlassCardConfig {
  weather_entity?: string;
  greeting?: boolean;
  chips?: ChipConfig[];
}

@customElement('glass-header')
export class GlassHeader extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host { display: block; }
      .header { padding: 16px; }
      .top-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .home-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(79, 195, 247, 0.12);
        flex-shrink: 0;
      }
      .home-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-accent);
      }
      .greeting-section { flex: 1; min-width: 0; }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .weather {
        font-size: 13px;
        color: var(--glass-text-secondary);
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .weather ha-icon { --mdc-icon-size: 16px; }
      .chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
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
    `,
  ];

  private get _headerConfig(): GlassHeaderConfig {
    return this._config as GlassHeaderConfig;
  }

  setConfig(config: GlassHeaderConfig): void {
    super.setConfig(config);
    const entities: string[] = [];
    if (config.weather_entity) entities.push(config.weather_entity);
    if (config.chips) config.chips.forEach((c) => { if (c.entity) entities.push(c.entity); });
    this.setTrackedEntities(entities);
  }

  private _renderChip(chipConfig: ChipConfig) {
    const entity = this.getEntity(chipConfig.entity);
    if (!entity) return html``;
    let icon = chipConfig.icon ?? '';
    let value = '';
    let isActive = false;
    switch (chipConfig.chip_type) {
      case 'person': {
        icon = icon || 'mdi:account';
        const name = entity.attributes.friendly_name ?? '';
        value = `${name} \u00b7 ${entity.state === 'home' ? 'Hemma' : 'Borta'}`;
        isActive = entity.state === 'home';
        break;
      }
      case 'battery': {
        icon = icon || 'mdi:cellphone';
        value = `${entity.state} %`;
        isActive = Number(entity.state) > 20;
        break;
      }
      case 'lights': {
        icon = icon || 'mdi:lightbulb-group';
        value = `${entity.state} st`;
        isActive = Number(entity.state) > 0;
        break;
      }
      default: {
        icon = icon || 'mdi:information';
        value = entity.state;
        break;
      }
    }
    return html`
      <div class="chip ${isActive ? 'active' : ''}">
        <ha-icon .icon=${icon}></ha-icon>
        <span>${value}</span>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const userName = this.hass.user?.name ?? '';
    const greeting = this._headerConfig.greeting !== false ? getGreeting(userName) : userName;
    const weatherEntity = this._headerConfig.weather_entity ? this.getEntity(this._headerConfig.weather_entity) : undefined;
    const weatherCondition = weatherEntity?.state ?? '';
    const weatherTemp = weatherEntity?.attributes.temperature ?? '';
    const weatherUnit = (weatherEntity?.attributes.temperature_unit as string) ?? '\u00b0C';
    const weatherIcon = getWeatherIcon(weatherCondition);
    const conditionMap: Record<string, string> = {
      'clear-night': 'Klart', 'cloudy': 'Molnigt', 'fog': 'Dimma',
      'partlycloudy': 'Delvis molnigt', 'rainy': 'Regn', 'snowy': 'Sno',
      'sunny': 'Soligt', 'windy': 'Blasigt',
    };
    return html`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${greeting}</div>
            ${weatherEntity ? html`
              <div class="weather">
                <ha-icon .icon=${weatherIcon}></ha-icon>
                ${conditionMap[weatherCondition] ?? weatherCondition} \u2022 ${weatherTemp}${weatherUnit}
              </div>
            ` : ''}
          </div>
        </div>
        ${this._headerConfig.chips?.length ? html`
          <div class="chips">
            ${this._headerConfig.chips.map((c) => this._renderChip(c))}
          </div>
        ` : ''}
      </div>
    `;
  }
}
