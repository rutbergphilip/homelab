import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import type { GlassCardConfig } from '../types.js';

interface RoomButton {
  name: string;
  room_id?: number;
  icon?: string;
}

interface GlassVacuumConfig extends GlassCardConfig {
  rooms?: RoomButton[];
}

@customElement('glass-vacuum-card')
export class GlassVacuumCard extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host {
        display: block;
      }
      .vacuum-card {
        padding: 16px;
      }
      .vacuum-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .vacuum-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon {
        background: rgba(79, 195, 247, 0.12);
        animation: pulseGlow 2s ease infinite;
      }
      @keyframes pulseGlow {
        0%,
        100% {
          box-shadow: 0 0 8px rgba(79, 195, 247, 0.1);
        }
        50% {
          box-shadow: 0 0 16px rgba(79, 195, 247, 0.3);
        }
      }
      .vacuum-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon ha-icon {
        color: var(--glass-accent);
      }
      .vacuum-info {
        flex: 1;
      }
      .vacuum-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .vacuum-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .cleaning .vacuum-status {
        color: var(--glass-accent);
      }
      .error .vacuum-status {
        color: var(--glass-coral);
      }
      .vacuum-battery {
        font-size: 12px;
        color: var(--glass-text-dim);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .vacuum-battery ha-icon {
        --mdc-icon-size: 16px;
      }
      .controls {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .control-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
      }
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .control-btn:active {
        transform: scale(0.96);
      }
      .control-btn ha-icon {
        --mdc-icon-size: 18px;
      }
      .rooms {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .room-btn {
        padding: 8px 14px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .room-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .room-btn:active {
        transform: scale(0.96);
      }
    `,
  ];

  private get _vacuumConfig(): GlassVacuumConfig {
    return this._config as GlassVacuumConfig;
  }

  setConfig(config: GlassVacuumConfig): void {
    super.setConfig(config);
    if (config.entity) this.setTrackedEntities([config.entity]);
  }

  private _getStatusText(state: string): string {
    const map: Record<string, string> = {
      cleaning: 'Stader',
      docked: 'Dockad',
      paused: 'Pausad',
      returning: 'Atergar',
      idle: 'Inaktiv',
      error: 'Fel',
      unavailable: 'Otillganglig',
    };
    return map[state] ?? state;
  }

  private _start(): void {
    if (this._config.entity)
      this.callService('vacuum', 'start', undefined, this._config.entity);
  }

  private _stop(): void {
    if (this._config.entity)
      this.callService('vacuum', 'return_to_base', undefined, this._config.entity);
  }

  private _cleanRoom(room: RoomButton): void {
    if (!this._config.entity || room.room_id == null) return;
    this.callService(
      'vacuum',
      'send_command',
      {
        command: 'app_segment_clean',
        params: [room.room_id],
      },
      this._config.entity,
    );
  }

  render() {
    if (!this.hass || !this._config?.entity) return html``;
    const entity = this.getEntity(this._config.entity);
    if (!entity) return html``;
    const state = entity.state;
    const isCleaning = state === 'cleaning';
    const isError = state === 'error';
    const battery = entity.attributes.battery_level as number | undefined;
    const name = this._config.name ?? entity.attributes.friendly_name ?? 'Vacuum';
    const icon = this._config.icon ?? 'mdi:robot-vacuum';

    return html`
      <div
        class="glass vacuum-card ${isCleaning ? 'cleaning' : ''} ${isError
          ? 'error'
          : ''}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${icon}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${name}</div>
            <div class="vacuum-status">${this._getStatusText(state)}</div>
          </div>
          ${battery != null
            ? html`
                <div class="vacuum-battery">
                  <ha-icon
                    icon="mdi:battery${battery > 80
                      ? ''
                      : battery > 60
                        ? '-80'
                        : battery > 40
                          ? '-60'
                          : battery > 20
                            ? '-40'
                            : '-20'}"
                  ></ha-icon>
                  ${battery}%
                </div>
              `
            : ''}
        </div>
        <div class="controls">
          <div class="control-btn" @click=${this._start}>
            <ha-icon icon="mdi:play"></ha-icon> Starta
          </div>
          <div class="control-btn" @click=${this._stop}>
            <ha-icon icon="mdi:home"></ha-icon> Docka
          </div>
        </div>
        ${this._vacuumConfig.rooms?.length
          ? html`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(
                  (room) => html`
                    <div class="room-btn" @click=${() => this._cleanRoom(room)}>
                      ${room.name}
                    </div>
                  `,
                )}
              </div>
            `
          : ''}
      </div>
    `;
  }
}
