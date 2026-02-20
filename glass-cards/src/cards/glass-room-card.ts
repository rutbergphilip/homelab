import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import { getRoomStatus } from '../utils/state-helpers.js';
import type { GlassCardConfig } from '../types.js';

interface SubButton {
  entity: string;
  icon?: string;
  name?: string;
}

interface GlassRoomCardConfig extends GlassCardConfig {
  popup_id?: string;
  sub_buttons?: SubButton[];
}

@customElement('glass-room-card')
export class GlassRoomCard extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host { display: block; }
      .room-card {
        padding: 12px;
        cursor: pointer;
        user-select: none;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .room-card:active { transform: scale(0.97); }
      .top {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .room-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .room-icon {
        background: rgba(79, 195, 247, 0.12);
        box-shadow: 0 0 12px rgba(79, 195, 247, 0.15);
      }
      .room-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .room-icon ha-icon { color: var(--glass-accent); }
      .room-info { flex: 1; min-width: 0; }
      .room-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .room-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .active .room-status { color: var(--glass-accent); }
      .sub-buttons {
        display: flex;
        gap: 5px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .sub-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
      }
      .sub-btn:hover { background: rgba(255, 255, 255, 0.10); }
      .sub-btn.on {
        background: rgba(79, 195, 247, 0.15);
        border-color: rgba(79, 195, 247, 0.25);
      }
      .sub-btn ha-icon {
        --mdc-icon-size: 16px;
        color: var(--glass-text-dim);
      }
      .sub-btn.on ha-icon { color: var(--glass-accent); }
    `,
  ];

  private get _roomConfig(): GlassRoomCardConfig {
    return this._config as GlassRoomCardConfig;
  }

  setConfig(config: GlassRoomCardConfig): void {
    super.setConfig(config);
    const entities: string[] = [];
    if (config.entity) entities.push(config.entity);
    if (config.sub_buttons) config.sub_buttons.forEach((b) => entities.push(b.entity));
    this.setTrackedEntities(entities);
  }

  private _handleCardTap(): void {
    if (this._roomConfig.popup_id) {
      window.location.hash = this._roomConfig.popup_id;
    }
  }

  private _handleSubButtonTap(e: Event, entityId: string): void {
    e.stopPropagation();
    this.toggle(entityId);
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const subButtons = this._roomConfig.sub_buttons ?? [];
    const allEntities = subButtons.map((b) => b.entity);
    if (this._config.entity && !allEntities.includes(this._config.entity)) {
      allEntities.unshift(this._config.entity);
    }
    const anyOn = allEntities.some((id) => this.isOn(id));
    const status = getRoomStatus(this.hass.states, allEntities);
    const icon = this._config.icon ?? 'mdi:home';
    const name = this._config.name ?? '';

    return html`
      <div class="glass room-card ${anyOn ? 'active' : ''}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${icon}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${name}</div>
            <div class="room-status">${status}</div>
          </div>
        </div>
        ${subButtons.length ? html`
          <div class="sub-buttons">
            ${subButtons.map((btn) => {
              const on = this.isOn(btn.entity);
              const btnIcon = btn.icon ?? (this.getEntity(btn.entity)?.attributes.icon as string) ?? 'mdi:lightbulb';
              return html`
                <div
                  class="sub-btn ${on ? 'on' : ''}"
                  @click=${(e: Event) => this._handleSubButtonTap(e, btn.entity)}
                  title=${btn.name ?? (this.getEntity(btn.entity)?.attributes.friendly_name as string) ?? btn.entity}
                >
                  <ha-icon .icon=${btnIcon}></ha-icon>
                </div>
              `;
            })}
          </div>
        ` : ''}
      </div>
    `;
  }
}
