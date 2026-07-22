import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import type { HubChipTone } from '../widgets/hub-status-chip.js';
import type { HubConfig } from '../hub-config.js';
import '../widgets/hub-weather-bg.js';
import type { HubTheme } from '../theme-controller.js';
import '../widgets/hub-clock.js';
import '../widgets/hub-status-chip.js';
import '../widgets/hub-lighting-tile.js';
import '../widgets/hub-vacuum-card.js';
import '../widgets/hub-todo-card.js';
import '../widgets/hub-now-playing.js';
import '../widgets/hub-kcal-ring.js';
import '../widgets/hub-meal-card.js';
import '../widgets/hub-transit-card.js';
import '../widgets/hub-energy-strip.js';

interface ChipDescriptor {
  icon: string;
  label: string;
  tone: HubChipTone;
  active: boolean;
  goto?: string; // tap navigates to this hub page
  open?: () => void; // tap dispatches a popup-open event instead of navigating
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
  @property({ attribute: false }) theme: HubTheme = 'natt';
  @property({ attribute: false }) weatherBg = false;
  @property({ attribute: false }) pageActive = false;

  static styles = [
    hubTokens,
    css`
      /* Host is a flex column that fills the page section but may grow past it:
         when the wall is too short for everything, the section (its own
         overflow-y:auto) scrolls instead of anything overlapping. */
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        position: relative;
      }
      .page {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: var(--hub-page-pad);
        position: relative;
        z-index: 1;
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
      /* The grid grows into spare height but its flex-basis is the true content
         size and it never shrinks below min-content — so a shrunk band can never
         be painted over. Rows are minmax(min-content, 1fr): fill slack, never
         collapse below a tile. */
      .widgets {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: minmax(min-content, 1fr);
        gap: var(--hub-gap);
      }
      .widgets .cal {
        grid-column: span 2;
      }

      /* Two glanceable bands below the rooms, fixed-height and non-shrinking. */
      .info,
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
        flex-shrink: 0;
      }
      .info {
        height: clamp(116px, 15vh, 148px);
      }
      .bottom {
        height: clamp(94px, 12vh, 124px);
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
      .bottom .meal {
        flex: 1.4;
        min-width: 0;
      }

      /* 2-col regime (≤1400): the room grid becomes three rows, so reclaim
         vertical space — tighter vertical padding and gaps, slimmer bands, and
         equal-width band cards so neither second card is squeezed. Everything
         fits without scrolling down to ~700px tall; shorter than that the page
         scrolls rather than overlapping. */
      @media (max-width: 1400px) {
        .page {
          gap: 10px;
          padding: clamp(14px, 1.8vw, 22px) var(--hub-page-pad);
        }
        .widgets {
          grid-template-columns: repeat(2, 1fr);
        }
        .info {
          height: clamp(104px, 13.5vh, 130px);
        }
        .bottom {
          height: clamp(88px, 11.5vh, 114px);
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc,
        .bottom .meal {
          flex: 1;
        }
      }

      @media (max-width: 600px) {
        .top {
          flex-direction: column;
        }
        .chips {
          max-width: 100%;
          justify-content: flex-start;
          padding-right: 0;
        }
        .widgets {
          grid-template-columns: 1fr;
        }
        .widgets .cal {
          grid-column: auto;
        }
        .info,
        .bottom {
          flex-direction: column;
          height: auto;
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc,
        .bottom .meal {
          height: 104px;
          flex: none;
        }
      }
    `,
  ];

  private _gotoPage(page: string): void {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', { detail: { page }, bubbles: true, composed: true }),
    );
  }

  private _openVacuum = (): void => {
    this.dispatchEvent(new CustomEvent('hub-vacuum-open', { bubbles: true, composed: true }));
  };

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
          open: this._openVacuum,
        });
      }
    }

    // (The meal plan lives in the bottom band's hub-meal-card, not a chip.)

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
    // Over the animated weather scene, soften the opaque surfaces so cards sit
    // in the scene instead of punching hard rectangles out of it. Values are
    // the theme's card/chip colors at ~86% alpha; interior text contrast is
    // preserved. Vars cascade from this wrapper into every child widget.
    const mediaVars = !this.weatherBg
      ? ''
      : this.theme === 'natt'
        ? '--hub-card:rgba(19,19,22,0.86);--hub-chip-bg:rgba(21,21,25,0.86);' +
          '--hub-teal-bg:rgba(16,20,24,0.86);--hub-lavender-bg:rgba(20,18,23,0.86);'
        : '--hub-card:rgba(255,255,255,0.88);--hub-chip-bg:rgba(255,255,255,0.88);' +
          '--hub-teal-bg:rgba(255,255,255,0.88);--hub-lavender-bg:rgba(255,255,255,0.88);' +
          '--hub-amber-bg:rgba(255,255,255,0.88);';
    return html`
      ${this.weatherBg
        ? html`<hub-weather-bg
            .hass=${this.hass}
            .entity=${cfg.weather_entity}
            .theme=${this.theme}
            .active=${this.pageActive}
          ></hub-weather-bg>`
        : nothing}
      <div class="page" style=${mediaVars}>
        <div class="top">
          <hub-clock
            .hass=${this.hass}
            .weatherEntity=${cfg.weather_entity}
            .bgActive=${this.weatherBg}
          ></hub-clock>
          <div class="chips">
            ${this._chips.map(
              (c) => html`
                <hub-status-chip
                  style=${c.goto || c.open ? 'cursor:pointer' : ''}
                  .icon=${c.icon}
                  .label=${c.label}
                  .tone=${c.tone}
                  ?active=${c.active}
                  @click=${c.open ?? (c.goto ? () => this._gotoPage(c.goto!) : nothing)}
                ></hub-status-chip>
              `,
            )}
          </div>
        </div>

        <div class="widgets">
          <hub-lighting-tile .hass=${this.hass} .config=${cfg}></hub-lighting-tile>
          <hub-vacuum-card .hass=${this.hass} .config=${cfg}></hub-vacuum-card>
          <hub-todo-card .hass=${this.hass} .config=${cfg}></hub-todo-card>
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
          ${cfg.kcal?.planner_entity
            ? html`<hub-meal-card
                class="meal"
                .hass=${this.hass}
                .plannerEntity=${cfg.kcal.planner_entity}
              ></hub-meal-card>`
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-home-page', HubHomePage);
