import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';

const NUM_FMT = new Intl.NumberFormat('sv-SE');

/** Ring fill 0–100 from consumed vs target kcal. */
export function kcalPct(value: number, target: number): number {
  if (!(target > 0)) return 0;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

/**
 * Mini-card subtitle from sensor.kcal_idag's real `protein_g` attribute, e.g.
 * "58 g protein". Empty when the attribute is absent — the forecast/"i fas ✓"
 * status lives on a different sensor and belongs to the Kcal page, not here.
 */
export function proteinSubtitle(attrs: Record<string, unknown>): string {
  const protein = attrs.protein_g;
  return typeof protein === 'number' ? `${Math.round(protein)} g protein` : '';
}

export class HubKcalRing extends GlassBaseElement {
  @property({ attribute: false }) todayEntity?: string;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .kc {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .kc.offline {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .ring {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        flex-shrink: 0;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 14px, #000 14.5px);
        mask: radial-gradient(circle, transparent 14px, #000 14.5px);
      }
      .kc.offline .ring {
        background: var(--hub-track);
      }
      .meta {
        min-width: 0;
      }
      .val {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-lavender-text);
        display: block;
        white-space: nowrap;
      }
      .kc.offline .val {
        color: var(--hub-text-dim);
        font-weight: 500;
        font-size: 13px;
      }
      .target {
        opacity: 0.5;
        font-weight: 400;
      }
      .sub {
        font-size: 12px;
        color: var(--hub-lavender-muted);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  private _goto(): void {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: 'kcal' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.hass) return html``;
    const e = this.todayEntity ? this.getEntity(this.todayEntity) : undefined;
    const value = e ? Number(e.state) : NaN;
    const offline = !e || e.state === 'unavailable' || e.state === 'unknown' || Number.isNaN(value);

    if (offline) {
      return html`
        <div class="kc offline" @click=${this._goto}>
          <div class="ring" style="--pct:0"></div>
          <div class="meta"><b class="val">Kcal · offline</b></div>
        </div>
      `;
    }

    const target =
      typeof e!.attributes.kcal_target === 'number' ? (e!.attributes.kcal_target as number) : 0;
    const pct = kcalPct(value, target);

    const subtitle = proteinSubtitle(e!.attributes);

    return html`
      <div class="kc" @click=${this._goto}>
        <div class="ring" style="--pct:${pct}"></div>
        <div class="meta">
          <b class="val">
            ${NUM_FMT.format(Math.round(value))}
            <span class="target">
              ${target > 0 ? `/ ${NUM_FMT.format(target)} kcal` : 'kcal'}
            </span>
          </b>
          ${subtitle ? html`<small class="sub">${subtitle}</small>` : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-kcal-ring', HubKcalRing);
