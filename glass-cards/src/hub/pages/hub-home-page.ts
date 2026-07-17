import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import type { HubChipTone } from '../widgets/hub-status-chip.js';
import type { HubConfig } from '../hub-config.js';
import '../widgets/hub-clock.js';
import '../widgets/hub-status-chip.js';
import '../widgets/hub-room-tile.js';
import '../widgets/hub-now-playing.js';
import '../widgets/hub-kcal-ring.js';
import '../widgets/hub-transit-card.js';
import '../widgets/hub-energy-strip.js';

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
        gap: 14px;
        padding: var(--hub-page-pad);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-shrink: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 56%;
        padding-right: 56px; /* clear the corner theme toggle */
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

      /* Two glanceable bands below the rooms. Both are content-capped so the
         room grid keeps the slack and the page never scrolls. */
      .info,
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
        flex-shrink: 0;
      }
      .info {
        height: clamp(118px, 15.5vh, 150px);
      }
      .bottom {
        height: clamp(96px, 12.5vh, 128px);
      }
      .info .energy {
        flex: 3;
        min-width: 0;
      }
      .info .transit {
        flex: 2;
        min-width: 0;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }

      /* Narrower walls: even the flex ratios out so neither band's second card
         gets squeezed below legibility, and give the bars a touch more height. */
      @media (max-width: 1280px) {
        .info {
          height: clamp(122px, 17vh, 154px);
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc {
          flex: 1;
        }
      }
    `,
  ];

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

    // Person — identity, always neutral.
    if (cfg.person_entity) {
      const p = this.getEntity(cfg.person_entity);
      const name = ((p?.attributes.friendly_name as string) || 'Philip').split(' ')[0];
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

        <div class="info">
          <hub-energy-strip class="energy" .hass=${this.hass} .config=${cfg}></hub-energy-strip>
          <hub-transit-card class="transit" .hass=${this.hass} .config=${cfg}></hub-transit-card>
        </div>

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
