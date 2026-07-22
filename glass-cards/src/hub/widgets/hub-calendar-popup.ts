import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import {
  fetchMergedEvents,
  clearCalendarCache,
  dayLabel,
  type HubCalEvent,
} from '../calendar-model.js';
import type { HubConfig } from '../hub-config.js';

const DUR_OPTIONS = [
  { label: '30 min', min: 30 },
  { label: '1 tim', min: 60 },
  { label: '2 tim', min: 120 },
  { label: 'Heldag', min: 0 },
];

export class HubCalendarPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _events: HubCalEvent[] | null = null;
  @state() private _creating = false;
  @state() private _saving = false;
  @state() private _durMin = 60;
  @state() private _saveError = false;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .new-btn {
        min-height: 48px; padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .day {
        margin-top: 16px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .ev { display: flex; align-items: baseline; gap: 12px; min-height: 40px; }
      .when { flex-shrink: 0; width: 52px; font: 600 13px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted)); }
      .what { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .src { flex-shrink: 0; font: 500 11px var(--hub-font-body); color: var(--hub-text-dim); }
      .empty { margin-top: 14px; font: 500 13.5px var(--hub-font-body); color: var(--hub-text-dim); }
      .form { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
      .form input {
        height: 48px; padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
        color-scheme: dark light;
      }
      .form .row2 { display: flex; gap: 10px; }
      .form .row2 input { flex: 1; min-width: 0; }
      .durs { display: flex; gap: 8px; flex-wrap: wrap; }
      .dur {
        min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dur.sel {
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        border-color: transparent;
        color: var(--hub-lavender, var(--hub-text));
      }
      .save {
        min-height: 48px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .save[disabled] { opacity: 0.5; }
      .err { font: 500 12.5px var(--hub-font-body); color: var(--hub-coral); }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    void this._refresh();
  }

  private async _refresh(): Promise<void> {
    const cal = this.config?.calendar;
    if (!this.hass || !cal?.entities?.length) return;
    const events = await fetchMergedEvents(this.hass, cal.entities);
    if (events) this._events = events;
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _input(sel: string): HTMLInputElement | null {
    return this.shadowRoot?.querySelector(sel) ?? null;
  }

  private async _save(): Promise<void> {
    const cal = this.config?.calendar;
    const title = this._input('.f-title')?.value.trim();
    const date = this._input('.f-date')?.value;
    const time = this._input('.f-time')?.value;
    if (!cal || !title || !date) return;
    this._saving = true;
    this._saveError = false;
    const data: Record<string, string> = { summary: title };
    if (this._durMin === 0 || !time) {
      const [y, m, d] = date.split('-').map(Number);
      const next = new Date(y, m - 1, d + 1);
      data.start_date = date;
      data.end_date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    } else {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + this._durMin * 60_000);
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
      data.start_date_time = iso(start);
      data.end_date_time = iso(end);
    }
    try {
      await this.hass?.callService('calendar', 'create_event', data, {
        entity_id: cal.create_entity,
      });
      clearCalendarCache();
      await this._refresh();
      this._creating = false;
      this._durMin = 60;
    } catch {
      this._saveError = true;
    } finally {
      this._saving = false;
    }
  }

  private _grouped(): Map<string, HubCalEvent[]> {
    const now = new Date();
    const groups = new Map<string, HubCalEvent[]>();
    for (const ev of this._events ?? []) {
      const label = dayLabel(ev.start, now);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(ev);
    }
    return groups;
  }

  private _hm(ev: HubCalEvent): string {
    if (ev.allDay) return 'Heldag';
    const t = new Date(ev.start);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }

  render() {
    if (!this.hass || !this.config?.calendar) return html``;
    const today = new Date();
    const dateDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const groups = this._grouped();
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Kalender">
          <div class="head">
            <span class="title">Kalender</span>
            <button class="new-btn" @click=${() => (this._creating = !this._creating)}>
              ${this._creating ? 'Avbryt' : 'Nytt'}
            </button>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          ${this._creating
            ? html`<div class="form">
                <input class="f-title" placeholder="Vad händer?" />
                <div class="row2">
                  <input class="f-date" type="date" value=${dateDefault} />
                  <input class="f-time" type="time" value="12:00" />
                </div>
                <div class="durs">
                  ${DUR_OPTIONS.map(
                    (d) => html`
                      <button class="dur ${this._durMin === d.min ? 'sel' : ''}" @click=${() => (this._durMin = d.min)}>
                        ${d.label}
                      </button>
                    `,
                  )}
                </div>
                <button class="save" ?disabled=${this._saving} @click=${() => this._save()}>
                  ${this._saving ? 'Sparar…' : 'Spara'}
                </button>
                ${this._saveError ? html`<span class="err">Kunde inte spara — försök igen</span>` : nothing}
              </div>`
            : nothing}
          ${groups.size === 0
            ? html`<div class="empty">Inga händelser de närmaste 7 dagarna</div>`
            : [...groups.entries()].map(
                ([label, evs]) => html`
                  <div class="day">${label}</div>
                  ${evs.map(
                    (ev) => html`
                      <div class="ev">
                        <span class="when">${this._hm(ev)}</span>
                        <span class="what">${ev.title}</span>
                        ${ev.sources.length > 1 ? html`<span class="src">båda</span>` : nothing}
                      </div>
                    `,
                  )}
                `,
              )}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-calendar-popup', HubCalendarPopup);
