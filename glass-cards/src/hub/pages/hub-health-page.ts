import { html, css, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { numericState } from '../health-model.js';
import type { HubConfig } from '../hub-config.js';
import '../widgets/hub-sleep-card.js';
import '../widgets/hub-readiness-card.js';
import '../widgets/hub-body-card.js';
import '../widgets/hub-activity-card.js';

const LONG_DATE = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Stockholm',
});

/**
 * Hälsa: recovery and body, as a 2×2 deck.
 *
 * Reading order is deliberate. Sömn and Beredskap sit on the top row because
 * they answer the morning question ("how did I sleep, what can I take on
 * today?"); Kropp and Aktivitet below answer the slower one ("where is this
 * heading?"). Withings owns the body row, Oura the rest — a split by capability,
 * since Oura measures no weight.
 */
export class HubHealthPage extends GlassBaseElement {
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
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Swedish keeps weekdays and months lowercase — lift only the first letter. */
      .subtitle::first-letter {
        text-transform: uppercase;
      }
      .ring-battery {
        margin-left: auto;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .ring-battery.low {
        color: var(--hub-coral);
      }

      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      /* Stack only on genuinely narrow / portrait panels; a landscape wall keeps
         the 2×2 and fits without vertical scroll. */
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
          grid-auto-rows: auto;
        }
      }
    `,
  ];

  render(): TemplateResult {
    if (!this.hass || !this.config) return html``;
    const cfg = this.config;
    const battery = numericState(
      cfg.health?.oura?.battery_entity ? this.getState(cfg.health.oura.battery_entity) : undefined,
    );

    return html`
      <div class="page">
        <div class="header">
          <h1 class="title">Hälsa</h1>
          <span class="subtitle">${LONG_DATE.format(new Date())}</span>
          ${battery === null
            ? html``
            : html`<span class="ring-battery ${battery <= 20 ? 'low' : ''}"
                >Ring ${Math.round(battery)} %</span
              >`}
        </div>

        <div class="grid">
          <hub-sleep-card .hass=${this.hass} .config=${cfg}></hub-sleep-card>
          <hub-readiness-card .hass=${this.hass} .config=${cfg}></hub-readiness-card>
          <hub-body-card .hass=${this.hass} .config=${cfg}></hub-body-card>
          <hub-activity-card .hass=${this.hass} .config=${cfg}></hub-activity-card>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-health-page', HubHealthPage);
