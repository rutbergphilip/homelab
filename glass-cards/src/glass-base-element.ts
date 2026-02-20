import { LitElement, css, type CSSResultGroup } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant, HassEntity, GlassCardConfig } from './types.js';

export class GlassBaseElement extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) _config!: GlassCardConfig;

  private _trackedEntities: string[] = [];
  private _previousStates: Record<string, string> = {};

  setConfig(config: GlassCardConfig): void {
    this._config = config;
  }

  protected setTrackedEntities(entities: string[]): void {
    this._trackedEntities = entities.filter(Boolean);
  }

  shouldUpdate(): boolean {
    if (!this.hass) return false;
    if (this._trackedEntities.length === 0) return true;

    let changed = false;
    for (const entityId of this._trackedEntities) {
      const newState = this.hass.states[entityId]?.state;
      if (this._previousStates[entityId] !== newState) {
        this._previousStates[entityId] = newState;
        changed = true;
      }
    }
    return changed;
  }

  protected getEntity(entityId: string): HassEntity | undefined {
    return this.hass?.states[entityId];
  }

  protected getState(entityId: string): string {
    return this.hass?.states[entityId]?.state ?? 'unavailable';
  }

  protected getEntityAttribute(entityId: string, attr: string): unknown {
    return this.hass?.states[entityId]?.attributes[attr];
  }

  protected isOn(entityId: string): boolean {
    return this.getState(entityId) === 'on';
  }

  protected callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    entityId?: string
  ): void {
    this.hass?.callService(domain, service, data, entityId ? { entity_id: entityId } : undefined);
  }

  protected toggle(entityId: string): void {
    const [domain] = entityId.split('.');
    this.callService(domain, 'toggle', undefined, entityId);
  }

  getCardSize(): number {
    return 1;
  }

  static get glassStyles(): CSSResultGroup {
    return css`
      :host {
        --glass-bg: rgba(255, 255, 255, 0.06);
        --glass-bg-hover: rgba(255, 255, 255, 0.10);
        --glass-bg-active: rgba(255, 255, 255, 0.14);
        --glass-border: rgba(255, 255, 255, 0.10);
        --glass-border-active: rgba(79, 195, 247, 0.30);
        --glass-accent: #4FC3F7;
        --glass-accent-light: #B3E5FC;
        --glass-accent-glow: rgba(79, 195, 247, 0.30);
        --glass-text-primary: rgba(255, 255, 255, 0.95);
        --glass-text-secondary: rgba(255, 255, 255, 0.55);
        --glass-text-dim: rgba(255, 255, 255, 0.35);
        --glass-radius: 16px;
        --glass-radius-sm: 10px;
        --glass-radius-pill: 50px;
        --glass-blur: 20px;
        --glass-transition: 0.3s ease;
        --glass-coral: #EF5350;
        --glass-green: #66BB6A;

        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--glass-text-primary);
        -webkit-tap-highlight-color: transparent;
      }

      .glass {
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--glass-radius);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .glass:hover {
        background: var(--glass-bg-hover);
      }

      .glass.active {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-active);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 20px var(--glass-accent-glow),
          0 0 60px rgba(79, 195, 247, 0.1);
      }
    `;
  }
}
