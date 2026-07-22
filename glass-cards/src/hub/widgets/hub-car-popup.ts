import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

const CHARGING_LABELS: Record<string, string> = {
  charging: 'Laddar',
  discharging: 'Urladdar',
  done: 'Färdigladdad',
  idle: 'Vilar',
  scheduled: 'Schemalagd',
  not_charging: 'Laddar inte',
  error: 'Fel',
  fault: 'Fel',
};

export class HubCarPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active { transform: scale(0.97); }
      .act.primary { grid-column: span 2; background: var(--hub-teal-bg); color: var(--hub-teal); border-color: transparent; }
      .act.on { background: var(--hub-teal-bg); color: var(--hub-teal); border-color: transparent; }
      .grid { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
      .row { display: flex; justify-content: space-between; min-height: 32px; align-items: center; }
      .k { font: 500 13.5px var(--hub-font-body); color: var(--hub-text-muted); }
      .v { font: 600 13.5px var(--hub-font-body); color: var(--hub-text); }
      .v.warn { color: var(--hub-coral); }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  /** Climate entity can be a switch (toggle) or a button (press). */
  private _climate(): void {
    const ent = this.config.volvo?.climate_entity;
    if (!ent) return;
    if (ent.startsWith('switch.')) this.callService('switch', 'toggle', undefined, ent);
    else this.callService('button', 'press', undefined, ent);
  }

  private _climateStop(): void {
    const ent = this.config.volvo?.climate_stop_entity;
    if (ent) this.callService('button', 'press', undefined, ent);
  }

  private _lockAction(service: 'lock' | 'unlock'): void {
    const ent = this.config.volvo?.lock_entity;
    if (ent) this.callService('lock', service, undefined, ent);
  }

  private _val(entity: string | undefined, suffix = ''): string {
    if (!entity) return '–';
    const e = this.getEntity(entity);
    if (!e || e.state === 'unavailable' || e.state === 'unknown') return '–';
    const unit = suffix || ((e.attributes.unit_of_measurement as string | undefined) ?? '');
    return unit ? `${e.state} ${unit}` : e.state;
  }

  private _chargingLabel(entity: string | undefined): string {
    if (!entity) return '–';
    const e = this.getEntity(entity);
    if (!e || e.state === 'unavailable' || e.state === 'unknown') return '–';
    return CHARGING_LABELS[e.state] ?? e.state.replace(/_/g, ' ');
  }

  render() {
    if (!this.hass || !this.config?.volvo) return html``;
    const v = this.config.volvo;
    const isSwitch = v.climate_entity?.startsWith('switch.') ?? false;
    const climateEnt = isSwitch && v.climate_entity ? this.getEntity(v.climate_entity) : undefined;
    const climateOn = isSwitch && climateEnt?.state === 'on';
    const lockState = v.lock_entity ? this.getEntity(v.lock_entity)?.state : undefined;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${v.name ?? 'Volvo'}>
          <div class="head">
            <span class="title">${v.name ?? 'Volvo'}</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          <div class="actions">
            ${v.climate_entity
              ? html`<button class="act primary ${climateOn ? 'on' : ''}" @click=${() => this._climate()}>
                  ${climateOn ? 'Klimat på — stäng av' : 'Starta klimat'}
                </button>`
              : nothing}
            ${v.climate_stop_entity && !v.climate_entity?.startsWith('switch.')
              ? html`<button class="act" style="grid-column: span 2" @click=${() => this._climateStop()}>
                  Stoppa klimat
                </button>`
              : nothing}
            ${v.lock_entity
              ? html`
                  <button class="act" @click=${() => this._lockAction('lock')}>Lås</button>
                  <button class="act" @click=${() => this._lockAction('unlock')}>Lås upp</button>
                `
              : nothing}
          </div>
          <div class="grid">
            <div class="row"><span class="k">Batteri</span><span class="v">${this._val(v.battery_entity, '%')}</span></div>
            <div class="row"><span class="k">Räckvidd</span><span class="v">${this._val(v.range_entity, 'km')}</span></div>
            <div class="row"><span class="k">Laddning</span><span class="v">${this._chargingLabel(v.charging_entity)}</span></div>
            <div class="row"><span class="k">Lås</span><span class="v ${lockState === 'unlocked' ? 'warn' : ''}">${lockState === 'locked' ? 'Låst' : lockState === 'unlocked' ? 'Olåst' : '–'}</span></div>
            <div class="row"><span class="k">Mätarställning</span><span class="v">${this._val(v.odometer_entity)}</span></div>
            ${(v.doors ?? []).map((d) => {
              const open = this.getEntity(d.entity)?.state === 'on';
              return html`<div class="row">
                <span class="k">${d.name}</span>
                <span class="v ${open ? 'warn' : ''}">${open ? 'Öppen' : 'Stängd'}</span>
              </div>`;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-car-popup', HubCarPopup);
