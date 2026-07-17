import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { inDepartureWindow } from '../widgets/departure-window.js';
import { buildEnergyModel } from '../energy-model.js';
import type { HubChipTone } from '../widgets/hub-status-chip.js';
import type { HubConfig } from '../hub-config.js';
import '../widgets/hub-clock.js';
import '../widgets/hub-status-chip.js';
import '../widgets/hub-room-tile.js';
import '../widgets/hub-now-playing.js';
import '../widgets/hub-kcal-ring.js';
import '../widgets/hub-transit-card.js';

interface ChipDescriptor {
  icon: string;
  label: string;
  tone: HubChipTone;
  active: boolean;
}

const VAC_LABELS: Record<string, string> = {
  cleaning: 'Städar',
  returning: 'Åker hem',
  paused: 'Pausad',
  error: 'Fel',
  idle: 'Väntar',
};

export class HubHomePage extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  // Re-evaluate the departure window on a slow tick so the train chip
  // appears/disappears near the window edges without a state push.
  @state() private _now = new Date();
  private _interval?: number;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: var(--hub-page-pad);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 62%;
      }
      .rooms {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      @media (max-width: 1400px) {
        .rooms {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .transit {
        flex-shrink: 0;
      }
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this._interval = window.setInterval(() => {
      this._now = new Date();
    }, 60000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== undefined) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private get _chips(): ChipDescriptor[] {
    const cfg = this.config;
    const chips: ChipDescriptor[] = [];

    // Lights — amber when any are on.
    const lc = cfg.lights_count_entity ? this.getEntity(cfg.lights_count_entity) : undefined;
    const count = lc && !Number.isNaN(Number(lc.state)) ? Number(lc.state) : null;
    chips.push({
      icon: 'lamp',
      label: count === null ? '—' : `${count} ${count === 1 ? 'lampa' : 'lampor'}`,
      tone: 'amber',
      active: (count ?? 0) > 0,
    });

    // Price — öre from the Tibber sensor (SEK/kWh × 100); the level word and
    // tone come from the hourly series once that sensor is live.
    const priceEnt = cfg.price_entity ? this.getEntity(cfg.price_entity) : undefined;
    const priceOre =
      priceEnt && !Number.isNaN(Number(priceEnt.state))
        ? Math.round(Number(priceEnt.state) * 100)
        : null;
    const seriesEnt = cfg.price_series_entity
      ? this.getEntity(cfg.price_series_entity)
      : undefined;
    const model = seriesEnt
      ? buildEnergyModel(seriesEnt.attributes as Record<string, unknown>, seriesEnt.state, this._now)
      : null;
    const level = model?.now ? model.level : 'normal';
    const word = level === 'låg' ? ' · lågt' : level === 'hög' ? ' · högt' : '';
    chips.push({
      icon: 'bolt',
      label: priceOre === null ? '— öre' : `${priceOre} öre${word}`,
      tone: level === 'låg' ? 'green' : level === 'hög' ? 'coral' : 'neutral',
      active: priceOre !== null,
    });

    // Vacuum — only surfaced when it's not resting on the dock.
    if (cfg.vacuum_entity) {
      const v = this.getEntity(cfg.vacuum_entity);
      if (v && v.state !== 'docked' && v.state !== 'unavailable' && v.state !== 'unknown') {
        chips.push({
          icon: 'vacuum',
          label: VAC_LABELS[v.state] ?? 'Städar',
          tone: v.state === 'error' ? 'coral' : 'neutral',
          active: true,
        });
      }
    }

    // Departures — only during the morning commute window.
    if (
      cfg.departures &&
      inDepartureWindow(this._now, cfg.departures.window?.start, cfg.departures.window?.end)
    ) {
      const d = this.getEntity(cfg.departures.next_entity);
      const label = d && d.state && d.state !== 'unavailable' ? d.state : '—';
      chips.push({ icon: 'train', label, tone: 'neutral', active: true });
    }

    // Person — identity, always neutral.
    if (cfg.person_entity) {
      const p = this.getEntity(cfg.person_entity);
      const name = (((p?.attributes.friendly_name as string) || 'Philip').split(' ')[0]);
      const home = p?.state === 'home';
      chips.push({
        icon: 'home',
        label: `${name} ${home ? 'hemma' : 'borta'}`,
        tone: 'neutral',
        active: false,
      });
    }

    return chips;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.config;
    return html`
      <div class="page">
        <div class="top">
          <hub-clock .hass=${this.hass} .weatherEntity=${cfg.weather_entity}></hub-clock>
          <div class="chips">
            ${this._chips.map(
              (c) => html`
                <hub-status-chip
                  .icon=${c.icon}
                  .label=${c.label}
                  .tone=${c.tone}
                  ?active=${c.active}
                ></hub-status-chip>
              `,
            )}
          </div>
        </div>

        <div class="rooms">
          ${(cfg.rooms ?? []).map(
            (r) => html`<hub-room-tile .hass=${this.hass} .room=${r}></hub-room-tile>`,
          )}
        </div>

        <hub-transit-card class="transit" .hass=${this.hass} .config=${cfg}></hub-transit-card>

        <div class="bottom">
          <hub-now-playing
            class="np"
            .hass=${this.hass}
            .players=${cfg.media_players ?? []}
          ></hub-now-playing>
          <hub-kcal-ring
            class="kc"
            .hass=${this.hass}
            .todayEntity=${cfg.kcal?.today_entity}
          ></hub-kcal-ring>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-home-page', HubHomePage);
