import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

export class HubVacuumPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .status {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 16px;
      }
      .state {
        font: 500 18px var(--hub-font-display);
        color: var(--hub-text);
      }
      .batt {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
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
      .act:active {
        transform: scale(0.97);
      }
      .act.primary {
        grid-column: span 2;
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
        border-color: transparent;
      }
      .sect {
        margin-top: 18px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .chip.sel {
        background: var(--hub-teal-bg);
        border-color: transparent;
        color: var(--hub-teal);
      }
      .cons {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cons-row {
        display: flex;
        justify-content: space-between;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _press(entity: string): void {
    this.callService('button', 'press', undefined, entity);
  }

  private _vac(service: string): void {
    if (this.config.vacuum_entity) this.callService('vacuum', service, undefined, this.config.vacuum_entity);
  }

  private _selectOption(entity: string, option: string): void {
    this.callService('select', 'select_option', { option }, entity);
  }

  private _selectChips(entity: string | undefined) {
    if (!entity) return nothing;
    const ent = this.getEntity(entity);
    const options = (ent?.attributes.options as string[] | undefined) ?? [];
    if (!options.length) return nothing;
    return html`<div class="chips">
      ${options.map(
        (o) => html`
          <button class="chip ${ent?.state === o ? 'sel' : ''}" @click=${() => this._selectOption(entity, o)}>
            ${o}
          </button>
        `,
      )}
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const vc = this.config.vacuum_controls;
    const vac = this.config.vacuum_entity ? this.getEntity(this.config.vacuum_entity) : undefined;
    const state = vac?.state ?? 'unknown';
    const statusText = vc?.status_entity ? this.getEntity(vc.status_entity)?.state : state;
    const batt = vc?.battery_entity ? this.getEntity(vc.battery_entity)?.state : undefined;
    const room = vc?.current_room_entity ? this.getEntity(vc.current_room_entity)?.state : undefined;
    const busy = state === 'cleaning' || state === 'returning';
    const paused = state === 'paused';
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Roborock">
          <div class="head">
            <span class="title">Roborock</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>
              ${icons.close}
            </button>
          </div>
          <div class="status">
            <span class="state">${statusText ?? '–'}${busy && room ? ` · ${room}` : ''}</span>
            ${batt ? html`<span class="batt">${batt}%</span>` : nothing}
          </div>
          <div class="actions">
            ${busy || paused
              ? html`
                  <button class="act" @click=${() => this._vac(paused ? 'start' : 'pause')}>
                    ${paused ? 'Fortsätt' : 'Pausa'}
                  </button>
                  <button class="act" @click=${() => this._vac('return_to_base')}>Åk hem</button>
                `
              : html`
                  ${vc?.full_button
                    ? html`<button class="act primary" @click=${() => this._press(vc.full_button)}>
                        Städa allt
                      </button>`
                    : nothing}
                  ${(vc?.room_buttons ?? []).map(
                    (b) => html`
                      <button class="act" @click=${() => this._press(b.entity)}>${b.name}</button>
                    `,
                  )}
                `}
          </div>
          ${vc?.mop_mode_entity
            ? html`<div class="sect">Mopläge</div>${this._selectChips(vc.mop_mode_entity)}`
            : nothing}
          ${vc?.mop_intensity_entity
            ? html`<div class="sect">Moppintensitet</div>${this._selectChips(vc.mop_intensity_entity)}`
            : nothing}
          ${vc?.consumables?.length
            ? html`<div class="sect">Förbrukning</div>
                <div class="cons">
                  ${vc.consumables.map((c) => {
                    const e = this.getEntity(c.entity);
                    const unit = (e?.attributes.unit_of_measurement as string | undefined) ?? '';
                    return html`<div class="cons-row">
                      <span>${c.name}</span><span>${e?.state ?? '–'} ${unit}</span>
                    </div>`;
                  })}
                </div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-vacuum-popup', HubVacuumPopup);
