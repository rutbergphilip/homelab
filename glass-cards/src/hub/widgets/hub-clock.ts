import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { weatherIcon } from './weather-icons.js';
import { fetchForecasts } from '../weather-forecast.js';
import { getForcedCondition } from '../weather-settings.js';
import {
  parseHourly,
  parseDaily,
  todayRange,
  precipHint,
  type ForecastHour,
  type ForecastDay,
} from '../weather-model.js';

const DATE_FMT = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const REFRESH_MS = 15 * 60_000;

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Hem's clock+weather hero. Time and date as before; below them the current
 * temp with condition icon, today's hi/lo, and (when relevant) a one-line
 * precipitation hint. Tapping anywhere opens the weather popup.
 */
export class HubClock extends GlassBaseElement {
  @property({ attribute: false }) weatherEntity!: string;
  @property({ type: Boolean, reflect: true, attribute: 'bg-active' }) bgActive = false;

  @state() private _now = new Date();
  @state() private _hours: ForecastHour[] = [];
  @state() private _days: ForecastDay[] = [];

  private _interval?: number;
  private _forecastTimer?: number;
  private _fetchedFor = '';

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .time {
        font-family: var(--hub-font-display);
        font-weight: 200;
        font-size: clamp(56px, 7vw, 96px);
        letter-spacing: -2px;
        line-height: 1;
        color: var(--hub-text);
      }
      .date {
        font-size: 13px;
        margin-top: 6px;
        color: var(--hub-text-muted);
        font-family: var(--hub-font-body);
      }
      .wx {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      .wx svg {
        width: 30px;
        height: 30px;
        color: var(--hub-text-muted);
      }
      .wx-temp {
        font: 300 30px var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .wx-range {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .hint {
        margin-top: 5px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-teal);
      }
      /* Over weather footage the hero always uses light ink + shadow — the
         backdrop is the video (dark night clips, bright day clips), not the
         theme surface, so theme-colored text can't guarantee contrast. */
      :host([bg-active]) .time,
      :host([bg-active]) .wx-temp {
        color: var(--hub-ink-on-media);
        text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3);
      }
      :host([bg-active]) .date,
      :host([bg-active]) .wx-range {
        color: var(--hub-ink-on-media-muted);
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
      }
      :host([bg-active]) .wx svg {
        color: var(--hub-ink-on-media-muted);
      }
      :host([bg-active]) .hint {
        color: #8fe3d2;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = new Date();
    }, 30000);
    this._forecastTimer = window.setInterval(() => this._loadForecasts(), REFRESH_MS);
    this.addEventListener('click', this._open);
    window.addEventListener('hub-weather-force', this._onForce);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) clearInterval(this._interval);
    if (this._forecastTimer !== undefined) clearInterval(this._forecastTimer);
    this._interval = this._forecastTimer = undefined;
    this.removeEventListener('click', this._open);
    window.removeEventListener('hub-weather-force', this._onForce);
  }

  updated(changed: PropertyValues): void {
    // First fetch once hass + entity are both available (or entity changed).
    if ((changed.has('hass') || changed.has('weatherEntity')) && this.hass && this.weatherEntity) {
      if (this._fetchedFor !== this.weatherEntity) {
        this._fetchedFor = this.weatherEntity;
        void this._loadForecasts();
      }
    }
  }

  private _onForce = (): void => {
    this.requestUpdate();
  };

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-weather-open', { bubbles: true, composed: true }));
  };

  private async _loadForecasts(): Promise<void> {
    if (!this.hass || !this.weatherEntity) return;
    const [hourly, daily] = await Promise.all([
      fetchForecasts(this.hass, this.weatherEntity, 'hourly'),
      fetchForecasts(this.hass, this.weatherEntity, 'daily'),
    ]);
    if (hourly) this._hours = parseHourly(hourly);
    if (daily) this._days = parseDaily(daily);
  }

  private get _timeStr(): string {
    const hh = String(this._now.getHours()).padStart(2, '0');
    const mm = String(this._now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private get _isNight(): boolean {
    return this.hass?.states['sun.sun']?.state === 'below_horizon';
  }

  render() {
    const entity = this.weatherEntity ? this.getEntity(this.weatherEntity) : undefined;
    const condition = getForcedCondition() ?? entity?.state ?? '';
    const temp = entity?.attributes.temperature;
    const range = todayRange(this._days);
    const hint = precipHint(this._hours, this._now.getTime());
    return html`
      <div class="time">${this._timeStr}</div>
      <div class="date">${capitalize(DATE_FMT.format(this._now))}</div>
      ${entity && typeof temp === 'number'
        ? html`
            <div class="wx">
              ${weatherIcon(condition, this._isNight)}
              <span class="wx-temp">${Math.round(temp)}°</span>
              ${range
                ? html`<span class="wx-range">
                    <span>↑ ${Math.round(range.high)}°</span>
                    <span>↓ ${Math.round(range.low)}°</span>
                  </span>`
                : nothing}
            </div>
            ${hint ? html`<div class="hint">${hint}</div>` : nothing}
          `
        : nothing}
    `;
  }
}

customElements.define('hub-clock', HubClock);
