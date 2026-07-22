import { html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { weatherIcon } from './weather-icons.js';
import { fetchForecasts } from '../weather-forecast.js';
import { getWeatherBgEnabled, setWeatherBgEnabled } from '../weather-settings.js';
import {
  parseHourly,
  parseDaily,
  weekRange,
  type ForecastHour,
  type ForecastDay,
} from '../weather-model.js';
import type { HubConfig } from '../hub-config.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

const DAY_FMT = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' });
const MAX_HOURS = 24;
const MAX_DAYS = 7;

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Tap-the-clock weather popup: location pills (Nynäshamn/Stockholm), current
 * conditions hero, 24 h hourly strip, Apple-style 7-day list with relative
 * temp-range bars, and the animated-background toggle.
 */
export class HubWeatherPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  @state() private _loc = 0;
  @state() private _hours: ForecastHour[] = [];
  @state() private _days: ForecastDay[] = [];
  @state() private _bgOn = getWeatherBgEnabled();

  private _loadedFor = '';

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 620px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .pills {
        display: flex;
        gap: 6px;
      }
      .pill {
        padding: 7px 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease, border-color 150ms ease;
      }
      .pill.active {
        color: var(--hub-text);
        border-color: var(--hub-text-dim);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg { width: 22px; height: 22px; }

      /* ── Current hero ───────────────────────────────────── */
      .hero {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 4px 0 16px;
      }
      .hero svg {
        width: 52px;
        height: 52px;
        color: var(--hub-text-muted);
      }
      .hero-temp {
        font: 200 56px var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        line-height: 1;
      }
      .hero-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .hero-cond {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }

      .section {
        padding-top: 14px;
        border-top: 1px solid var(--hub-card-border);
      }
      .section + .section { margin-top: 14px; }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 10px;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }

      /* ── Hourly strip ───────────────────────────────────── */
      .hours {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
      }
      .hour {
        flex: 0 0 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-variant-numeric: tabular-nums;
      }
      .hour-t { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
      .hour svg { width: 22px; height: 22px; color: var(--hub-text-muted); }
      .hour-temp { font: 600 14px var(--hub-font-body); color: var(--hub-text); }
      .hour-precip { font: 500 11px var(--hub-font-body); color: var(--hub-teal); min-height: 13px; }

      /* ── Daily list ─────────────────────────────────────── */
      .day-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 40px;
      }
      .day-name {
        width: 44px;
        flex-shrink: 0;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
      }
      .day-row svg { width: 24px; height: 24px; color: var(--hub-text-muted); flex-shrink: 0; }
      .day-prob {
        width: 40px;
        flex-shrink: 0;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-teal);
        font-variant-numeric: tabular-nums;
      }
      .day-lo, .day-hi {
        width: 34px;
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        font-variant-numeric: tabular-nums;
      }
      .day-lo { color: var(--hub-text-dim); text-align: right; }
      .day-hi { color: var(--hub-text); }
      .day-bar {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        position: relative;
        overflow: hidden;
      }
      .day-bar-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--hub-teal), var(--hub-amber));
      }

      /* ── Background toggle ──────────────────────────────── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 44px;
      }
      .toggle-label { font: 500 14px var(--hub-font-body); color: var(--hub-text); }
      .switch {
        position: relative;
        width: 46px;
        height: 28px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        background: var(--hub-track);
        transition: background 200ms ease;
        -webkit-tap-highlight-color: transparent;
      }
      .switch.on { background: var(--hub-amber); }
      .switch::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--hub-card);
        transition: transform 200ms ease;
      }
      .switch.on::after { transform: translateX(18px); }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `,
  ];

  private get _locations(): { entity: string; name: string }[] {
    const cfg = this.config;
    if (cfg?.weather_locations?.length) return cfg.weather_locations;
    return cfg?.weather_entity ? [{ entity: cfg.weather_entity, name: 'Hem' }] : [];
  }

  updated(changed: PropertyValues): void {
    const entity = this._locations[this._loc]?.entity;
    if (!entity || !this.hass) return;
    if ((changed.has('hass') || changed.has('config')) && this._loadedFor !== entity) {
      void this._load(entity);
    }
  }

  private async _load(entity: string): Promise<void> {
    this._loadedFor = entity;
    const [hourly, daily] = await Promise.all([
      fetchForecasts(this.hass, entity, 'hourly'),
      fetchForecasts(this.hass, entity, 'daily'),
    ]);
    if (this._loadedFor !== entity) return; // location switched mid-flight
    this._hours = hourly ? parseHourly(hourly) : [];
    this._days = daily ? parseDaily(daily) : [];
  }

  private _pickLoc(i: number): void {
    if (i === this._loc) return;
    this._loc = i;
    this._hours = [];
    this._days = [];
    const entity = this._locations[i]?.entity;
    if (entity) void this._load(entity);
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _toggleBg(): void {
    this._bgOn = !this._bgOn;
    setWeatherBgEnabled(this._bgOn);
    this.dispatchEvent(
      new CustomEvent('hub-weather-bg-toggle', {
        detail: { on: this._bgOn },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get _isNight(): boolean {
    return this.hass?.states['sun.sun']?.state === 'below_horizon';
  }

  private _hero(): TemplateResult | typeof nothing {
    const entity = this.getEntity(this._locations[this._loc]?.entity ?? '');
    if (!entity) return nothing;
    const temp = entity.attributes.temperature;
    const feels = entity.attributes.apparent_temperature;
    const wind = entity.attributes.wind_speed;
    const windUnit = (entity.attributes.wind_speed_unit as string) ?? 'km/h';
    return html`
      <div class="hero">
        ${weatherIcon(entity.state, this._isNight)}
        <span class="hero-temp">${typeof temp === 'number' ? Math.round(temp) : '–'}°</span>
        <span class="hero-meta">
          <span class="hero-cond">${this.hass.formatEntityState(entity)}</span>
          ${typeof feels === 'number' ? html`<span>Känns som ${Math.round(feels)}°</span>` : nothing}
          ${typeof wind === 'number' ? html`<span>Vind ${Math.round(wind)} ${windUnit}</span>` : nothing}
        </span>
      </div>
    `;
  }

  private _hourly(): TemplateResult {
    const now = Date.now() - 3600_000; // keep the current (partial) hour
    const hours = this._hours.filter((h) => h.ts >= now).slice(0, MAX_HOURS);
    return html`
      <div class="section">
        <div class="sec-title">Idag</div>
        ${hours.length
          ? html`<div class="hours">
              ${hours.map(
                (h) => html`
                  <div class="hour">
                    <span class="hour-t">${String(new Date(h.ts).getHours()).padStart(2, '0')}</span>
                    ${weatherIcon(h.condition, this._isNight)}
                    <span class="hour-temp">${Math.round(h.temp)}°</span>
                    <span class="hour-precip">${h.precip >= 0.1 ? `${h.precip.toFixed(1)}` : ''}</span>
                  </div>
                `,
              )}
            </div>`
          : html`<div class="empty">Ingen timprognos</div>`}
      </div>
    `;
  }

  private _daily(): TemplateResult {
    const days = this._days.slice(0, MAX_DAYS);
    const range = weekRange(days);
    const span = range ? Math.max(range.max - range.min, 1) : 1;
    return html`
      <div class="section">
        <div class="sec-title">7 dagar</div>
        ${days.length && range
          ? days.map((d, i) => {
              const lo = d.low ?? d.high;
              const left = ((lo - range.min) / span) * 100;
              const width = Math.max(((d.high - lo) / span) * 100, 4);
              return html`
                <div class="day-row">
                  <span class="day-name">${i === 0 ? 'Idag' : capitalize(DAY_FMT.format(new Date(d.ts)))}</span>
                  ${weatherIcon(d.condition, false)}
                  <span class="day-prob">${d.precipProb !== null && d.precipProb >= 20 ? `${Math.round(d.precipProb)}%` : ''}</span>
                  <span class="day-lo">${d.low !== null ? `${Math.round(d.low)}°` : ''}</span>
                  <span class="day-bar">
                    <span class="day-bar-fill" style="left:${left}%;width:${width}%"></span>
                  </span>
                  <span class="day-hi">${Math.round(d.high)}°</span>
                </div>
              `;
            })
          : html`<div class="empty">Ingen veckoprognos</div>`}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const locs = this._locations;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Väder">
          <div class="head">
            <div class="pills">
              ${locs.map(
                (l, i) => html`
                  <button class="pill ${i === this._loc ? 'active' : ''}" @click=${() => this._pickLoc(i)}>
                    ${l.name}
                  </button>
                `,
              )}
            </div>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${CLOSE_ICON}</button>
          </div>
          ${this._hero()}
          ${this._hourly()}
          ${this._daily()}
          <div class="section">
            <div class="toggle-row">
              <span class="toggle-label">Animerad bakgrund</span>
              <button
                class="switch ${this._bgOn ? 'on' : ''}"
                role="switch"
                aria-checked=${this._bgOn}
                aria-label="Animerad bakgrund"
                @click=${() => this._toggleBg()}
              ></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-weather-popup', HubWeatherPopup);
