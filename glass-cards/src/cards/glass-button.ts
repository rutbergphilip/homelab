import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import type { GlassCardConfig } from '../types.js';

interface GlassButtonConfig extends GlassCardConfig {
  show_state?: boolean;
  tap_action?: { action: string; navigation_path?: string };
}

@customElement('glass-button')
export class GlassButton extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host { display: block; }
      .button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
      }
      .button:active {
        background: var(--glass-bg-active);
        transform: scale(0.98);
      }
      .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .icon-wrap {
        background: rgba(79, 195, 247, 0.15);
        box-shadow: 0 0 16px rgba(79, 195, 247, 0.2);
      }
      .icon-wrap ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .icon-wrap ha-icon { color: var(--glass-accent); }
      .info { flex: 1; min-width: 0; }
      .name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .state {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .active .state { color: var(--glass-text-secondary); }
    `,
  ];

  private get _buttonConfig(): GlassButtonConfig {
    return this._config as GlassButtonConfig;
  }

  setConfig(config: GlassButtonConfig): void {
    super.setConfig(config);
    if (config.entity) this.setTrackedEntities([config.entity]);
  }

  private _handleTap(): void {
    const action = this._buttonConfig.tap_action?.action ?? 'toggle';
    if (action === 'toggle' && this._config.entity) {
      this.toggle(this._config.entity);
    } else if (action === 'navigate' && this._buttonConfig.tap_action?.navigation_path) {
      window.location.hash = this._buttonConfig.tap_action.navigation_path;
    }
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const entity = this._config.entity ? this.getEntity(this._config.entity) : undefined;
    const active = entity ? this.isOn(this._config.entity!) : false;
    const name = this._config.name ?? entity?.attributes.friendly_name ?? '';
    const icon = this._config.icon ?? (entity?.attributes.icon as string) ?? 'mdi:help-circle';
    const showState = this._buttonConfig.show_state !== false;
    let stateText = '';
    if (showState && entity) {
      const unit = entity.attributes.unit_of_measurement as string | undefined;
      stateText = unit ? `${entity.state} ${unit}` : entity.state === 'on' ? 'Pa' : entity.state === 'off' ? 'Av' : entity.state;
    }
    return html`
      <div class="glass button ${active ? 'active' : ''}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${icon}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${name}</div>
          ${stateText ? html`<div class="state">${stateText}</div>` : ''}
        </div>
      </div>
    `;
  }
}
