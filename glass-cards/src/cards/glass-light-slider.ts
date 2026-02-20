import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import { getBrightness } from '../utils/state-helpers.js';
import type { GlassCardConfig } from '../types.js';

@customElement('glass-light-slider')
export class GlassLightSlider extends GlassBaseElement {
  @state() private _dragging = false;
  @state() private _dragValue = 0;

  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host { display: block; }
      .slider-card { padding: 16px; }
      .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .slider-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .light-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        transition: all var(--glass-transition);
      }
      .on .light-icon {
        background: rgba(79, 195, 247, 0.12);
        box-shadow: 0 0 12px rgba(79, 195, 247, 0.15);
      }
      .light-icon ha-icon {
        --mdc-icon-size: 20px;
        color: var(--glass-text-dim);
        transition: color var(--glass-transition);
      }
      .on .light-icon ha-icon { color: var(--glass-accent); }
      .light-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
      }
      .brightness-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--glass-text-dim);
        font-variant-numeric: tabular-nums;
        min-width: 36px;
        text-align: right;
      }
      .on .brightness-value { color: var(--glass-accent); }
      .slider-track {
        position: relative;
        height: 36px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        overflow: hidden;
        cursor: pointer;
        touch-action: none;
      }
      .slider-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 18px;
        background: linear-gradient(90deg, var(--glass-accent), var(--glass-accent-light, #B3E5FC));
        transition: width 0.15s ease;
        pointer-events: none;
      }
      .slider-fill.dragging { transition: none; }
      .slider-glow {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 24px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(79, 195, 247, 0.4), transparent);
        filter: blur(6px);
        pointer-events: none;
        transition: opacity var(--glass-transition);
        opacity: 0;
      }
      .on .slider-glow { opacity: 1; }
      .off-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: var(--glass-text-dim);
        cursor: pointer;
      }
    `,
  ];

  setConfig(config: GlassCardConfig): void {
    super.setConfig(config);
    if (config.entity) this.setTrackedEntities([config.entity]);
  }

  private _handleSliderInteraction(e: MouseEvent | TouchEvent): void {
    if (!this._config.entity) return;
    const entity = this.getEntity(this._config.entity);
    if (!entity || entity.state === 'off') {
      this.callService('light', 'turn_on', { brightness_pct: 100 }, this._config.entity);
      return;
    }
    const track = e.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const updateValue = (clientX: number) => {
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = Math.round((x / rect.width) * 100);
      this._dragValue = Math.max(1, Math.min(100, pct));
    };
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateValue(clientX);
    this._dragging = true;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      updateValue(cx);
    };
    const onEnd = () => {
      this._dragging = false;
      this.callService('light', 'turn_on', { brightness_pct: this._dragValue }, this._config.entity!);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }

  render() {
    if (!this.hass || !this._config?.entity) return html``;
    const entity = this.getEntity(this._config.entity);
    if (!entity) return html``;
    const isOn = entity.state === 'on';
    const brightness = this._dragging ? this._dragValue : getBrightness(entity);
    const name = this._config.name ?? entity.attributes.friendly_name ?? '';
    const icon = this._config.icon ?? (entity.attributes.icon as string) ?? 'mdi:lightbulb';

    return html`
      <div class="glass slider-card ${isOn ? 'on' : 'off'}">
        <div class="slider-header">
          <div class="slider-left">
            <div class="light-icon">
              <ha-icon .icon=${icon}></ha-icon>
            </div>
            <span class="light-name">${name}</span>
          </div>
          <span class="brightness-value">${isOn ? `${brightness}%` : 'Av'}</span>
        </div>
        <div class="slider-track" @mousedown=${this._handleSliderInteraction} @touchstart=${this._handleSliderInteraction}>
          ${isOn ? html`
            <div class="slider-fill ${this._dragging ? 'dragging' : ''}" style="width: ${brightness}%"></div>
            <div class="slider-glow" style="left: calc(${brightness}% - 12px)"></div>
          ` : html`
            <div class="off-overlay" @click=${() => this.callService('light', 'turn_on', { brightness_pct: 100 }, this._config.entity!)}>
              Tryck for att tanda
            </div>
          `}
        </div>
      </div>
    `;
  }
}
