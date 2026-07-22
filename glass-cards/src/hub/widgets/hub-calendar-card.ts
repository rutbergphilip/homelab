import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { fetchMergedEvents, dayLabel, type HubCalEvent } from '../calendar-model.js';
import type { HubConfig } from '../hub-config.js';

const SHOW = 3;
const POLL_MS = 5 * 60_000;

export class HubCalendarCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _events: HubCalEvent[] | null = null;
  private _timer?: number;

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 7px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg, var(--hub-card));
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }
      .card:active { transform: scale(0.985); }
      .label { font: 600 14px var(--hub-font-body); color: var(--hub-text); flex-shrink: 0; }
      .row { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
      .when {
        flex-shrink: 0; width: 96px;
        font: 600 12.5px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted));
      }
      .what {
        flex: 1; min-width: 0;
        font: 500 13.5px var(--hub-font-body); color: var(--hub-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    void this._refresh();
    this._timer = window.setInterval(() => void this._refresh(), POLL_MS);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer !== undefined) clearInterval(this._timer);
  }

  private async _refresh(): Promise<void> {
    const cal = this.config?.calendar;
    if (!this.hass || !cal?.entities?.length) return;
    const events = await fetchMergedEvents(this.hass, cal.entities);
    if (events) this._events = events;
  }

  private _when(ev: HubCalEvent): string {
    const day = dayLabel(ev.start, new Date());
    if (ev.allDay) return day;
    const t = new Date(ev.start);
    const hm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return `${day} ${hm}`;
  }

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-calendar-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config?.calendar) return html``;
    const upcoming = (this._events ?? []).slice(0, SHOW);
    return html`
      <div class="card" role="button" tabindex="0" aria-label="Visa kalendern" @click=${this._open}>
        <b class="label">Kalender</b>
        ${upcoming.length === 0
          ? html`<span class="empty">Inga händelser på 7 dagar</span>`
          : upcoming.map(
              (ev) => html`
                <div class="row">
                  <span class="when">${this._when(ev)}</span>
                  <span class="what">${ev.title}</span>
                </div>
              `,
            )}
      </div>
    `;
  }
}

customElements.define('hub-calendar-card', HubCalendarCard);
