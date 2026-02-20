import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import type { GlassCardConfig } from '../types.js';

interface GlassInfoRowConfig extends GlassCardConfig {
  secondary_entity?: string;
  badge_entity?: string;
  badge_icon?: string;
}

@customElement('glass-info-row')
export class GlassInfoRow extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host {
        display: block;
      }
      .info-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
      }
      .info-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
      }
      .info-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .info-content {
        flex: 1;
        min-width: 0;
      }
      .info-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
      }
      .info-value {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 50px;
        background: rgba(79, 195, 247, 0.12);
        border: 1px solid rgba(79, 195, 247, 0.2);
        font-size: 12px;
        font-weight: 600;
        color: #4fc3f7;
        flex-shrink: 0;
      }
      .badge ha-icon {
        --mdc-icon-size: 14px;
        color: #4fc3f7;
      }
    `,
  ];

  private get _infoConfig(): GlassInfoRowConfig {
    return this._config as GlassInfoRowConfig;
  }

  setConfig(config: GlassInfoRowConfig): void {
    super.setConfig(config);
    const entities: string[] = [];
    if (config.entity) entities.push(config.entity);
    if (config.secondary_entity) entities.push(config.secondary_entity);
    if (config.badge_entity) entities.push(config.badge_entity);
    this.setTrackedEntities(entities);
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const entity = this._config.entity
      ? this.getEntity(this._config.entity)
      : undefined;
    const name = this._config.name ?? entity?.attributes.friendly_name ?? '';
    const icon =
      this._config.icon ??
      (entity?.attributes.icon as string) ??
      'mdi:information';
    let value = entity?.state ?? '';
    const unit = entity?.attributes.unit_of_measurement as string | undefined;
    if (unit) value = `${value} ${unit}`;
    const badgeEntity = this._infoConfig.badge_entity
      ? this.getEntity(this._infoConfig.badge_entity)
      : undefined;

    return html`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${icon}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${name}</div>
          <div class="info-value">${value}</div>
        </div>
        ${badgeEntity
          ? html`
              <div class="badge">
                ${this._infoConfig.badge_icon
                  ? html`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`
                  : ''}
                ${badgeEntity.state}
              </div>
            `
          : ''}
      </div>
    `;
  }
}
