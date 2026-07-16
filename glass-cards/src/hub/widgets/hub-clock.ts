import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';

const DATE_FMT = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export class HubClock extends GlassBaseElement {
  @property({ attribute: false }) weatherEntity!: string;

  @state() private _now = new Date();

  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
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
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = new Date();
    }, 30000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private get _timeStr(): string {
    const hh = String(this._now.getHours()).padStart(2, '0');
    const mm = String(this._now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private get _dateStr(): string {
    return capitalize(DATE_FMT.format(this._now));
  }

  private get _weatherStr(): string {
    const entity = this.weatherEntity ? this.getEntity(this.weatherEntity) : undefined;
    if (!entity || !this.hass) return '';
    const condition = this.hass.formatEntityState(entity);
    const temp = entity.attributes.temperature;
    const tempStr = typeof temp === 'number' ? `${Math.round(temp)}°` : '';
    return [condition, tempStr].filter(Boolean).join(' ');
  }

  render() {
    const weather = this._weatherStr;
    return html`
      <div class="time">${this._timeStr}</div>
      <div class="date">${this._dateStr}${weather ? html` · ${weather}` : ''}</div>
    `;
  }
}

customElements.define('hub-clock', HubClock);
