import { html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import { formatSleepDuration, numericState } from '../health-model.js';
import { clockTime } from './hub-sleep-card.js';
import type { HubConfig } from '../hub-config.js';

export type HealthSection = 'sleep' | 'readiness' | 'body' | 'activity';

const TITLES: Record<HealthSection, string> = {
  sleep: 'Sömn',
  readiness: 'Beredskap',
  body: 'Kropp',
  activity: 'Aktivitet',
};

const ONE_DEC = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const NUM_FMT = new Intl.NumberFormat('sv-SE');

interface Row {
  key: string;
  value: string;
}

/**
 * One popup for all four Hälsa cards rather than four near-identical components:
 * every section is the same shape — a titled list of key/value rows — so a
 * `section` property expresses the difference far better than duplicated shells.
 */
export class HubHealthPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @property({ attribute: false }) section: HealthSection = 'sleep';

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .grid {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        min-height: 34px;
      }
      .k {
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .v {
        font: 600 13.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .note {
        margin-top: 16px;
        font: 400 12.5px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-dim);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _num(entity: string | undefined): number | null {
    return entity ? numericState(this.getState(entity)) : null;
  }

  /** A numeric row, or a dash — never a silently missing line. */
  private _row(key: string, entity: string | undefined, unit: string, factor = 1, digits = 0): Row {
    const n = this._num(entity);
    if (n === null) return { key, value: '–' };
    const scaled = n * factor;
    const text = digits > 0 ? ONE_DEC.format(scaled) : NUM_FMT.format(Math.round(scaled));
    return { key, value: unit ? `${text} ${unit}` : text };
  }

  private _hoursRow(key: string, entity: string | undefined): Row {
    const h = this._num(entity);
    return { key, value: h === null ? '–' : formatSleepDuration(Math.round(h * 60)) };
  }

  private _rows(): Row[] {
    const oura = this.config?.health?.oura ?? {};
    const w = this.config?.health?.withings ?? {};

    switch (this.section) {
      case 'sleep': {
        const start = clockTime(
          oura.bedtime_start_entity ? this.getState(oura.bedtime_start_entity) : undefined,
        );
        const end = clockTime(oura.bedtime_end_entity ? this.getState(oura.bedtime_end_entity) : undefined);
        return [
          this._hoursRow('Total sömn', oura.sleep_duration_entity),
          this._hoursRow('Tid i sängen', oura.time_in_bed_entity),
          this._hoursRow('Djupsömn', oura.deep_entity),
          this._hoursRow('REM-sömn', oura.rem_entity),
          this._hoursRow('Lätt sömn', oura.light_entity),
          this._hoursRow('Vaken tid', oura.awake_entity),
          this._row('Effektivitet', oura.efficiency_entity, '%'),
          this._row('Insomningstid', oura.latency_entity, 'min'),
          { key: 'Sänggående', value: start || '–' },
          { key: 'Uppstigning', value: end || '–' },
          this._row('Sömnpoäng', oura.sleep_score_entity, ''),
        ];
      }
      case 'readiness':
        return [
          this._row('Beredskapspoäng', oura.readiness_score_entity, ''),
          this._row('HRV under sömn', oura.hrv_entity, 'ms'),
          this._row('Vilopuls', oura.resting_hr_entity, 'slag/min'),
          this._row('Temperaturavvikelse', oura.temp_deviation_entity, '°C', 1, 1),
          this._row('HRV-balans', oura.hrv_balance_entity, ''),
          this._row('Sömnregularitet', oura.sleep_regularity_entity, ''),
          this._row('Vilopulspoäng', oura.resting_hr_score_entity, ''),
        ];
      case 'body':
        return [
          this._row('Vikt', w.weight_entity, 'kg', 1, 1),
          this._row('Fettandel', w.fat_pct_entity, '%', 1, 1),
          this._row('Fettmassa', w.fat_mass_entity, 'kg', 1, 1),
          this._row('Fettfri massa', w.lean_mass_entity, 'kg', 1, 1),
          this._row('Muskelmassa', w.muscle_entity, 'kg', 1, 1),
          this._row('Benmassa', w.bone_entity, 'kg', 1, 1),
          this._row('Puls vid vägning', w.heart_rate_entity, 'slag/min'),
        ];
      case 'activity':
        return [
          this._row('Steg', oura.steps_entity, ''),
          this._row('Aktiva kalorier', oura.active_kcal_entity, 'kcal'),
          this._row('Total förbrukning', oura.total_kcal_entity, 'kcal'),
          this._row('Kalorimål', oura.target_kcal_entity, 'kcal'),
          this._row('Aktivitetspoäng', oura.activity_score_entity, ''),
          this._row('MET-minuter hög', oura.high_met_entity, 'min'),
          this._row('MET-minuter medel', oura.medium_met_entity, 'min'),
          this._row('MET-minuter låg', oura.low_met_entity, 'min'),
          this._row('Träningspass idag', oura.workouts_today_entity, ''),
        ];
    }
  }

  /** Only where a number would otherwise be quietly misread. */
  private _note(): string {
    switch (this.section) {
      case 'body':
        return 'Vikten här kommer direkt från vågen. Kcal-sidan visar morgonvägningen som prognosen räknar på — de skiljer sig om du vägt dig fler gånger under dagen.';
      case 'activity':
        return 'Total förbrukning är Ourings uppskattning och ligger högt: modellens TDEE räknas ut från intag och viktförändring, vilket är ett starkare underlag.';
      default:
        return '';
    }
  }

  render(): TemplateResult {
    if (!this.hass || !this.config?.health) return html``;
    const note = this._note();
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${TITLES[this.section]}>
          <div class="head">
            <span class="title">${TITLES[this.section]}</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          <div class="grid">
            ${this._rows().map(
              (r) => html`<div class="row"><span class="k">${r.key}</span><span class="v">${r.value}</span></div>`,
            )}
          </div>
          ${note ? html`<p class="note">${note}</p>` : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-health-popup', HubHealthPopup);
