import { html, css, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubChipTone } from './hub-status-chip.js';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  tone: HubChipTone;
}

// Each page carries its domain signature colour into the tab bar: the active
// item tints with it, everything else stays --hub-text-dim so the bar reads as
// a calm, glanceable strip. Kept as data so it can be unit-tested apart from
// the component. Hem is deliberately neutral — home is "no domain".
const NAV_MAP: Record<string, Omit<NavItem, 'id'>> = {
  hem: { label: 'Hem', icon: 'home', tone: 'neutral' },
  ljus: { label: 'Ljus', icon: 'lamp', tone: 'amber' },
  media: { label: 'Media', icon: 'note', tone: 'teal' },
  energi: { label: 'Energi', icon: 'bolt', tone: 'green' },
  kcal: { label: 'Kcal', icon: 'ring', tone: 'lavender' },
};

/** Page id → tab bar item (label, icon, domain tone). Unknown ids fall back to
 *  a neutral, icon-less item titled from the id so a custom page still shows. */
export function navItem(id: string): NavItem {
  const known = NAV_MAP[id];
  if (known) return { id, ...known };
  return { id, label: id.charAt(0).toUpperCase() + id.slice(1), icon: '', tone: 'neutral' };
}

export class HubNavBar extends LitElement {
  @property({ attribute: false }) pages: string[] = [];
  @property({ type: Number }) active = 0;

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 30;
        display: block;
      }
      nav {
        display: flex;
        align-items: stretch;
        height: var(--hub-nav-h);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-sizing: border-box;
        background: var(--hub-navbar-bg);
        border-top: 1px solid var(--hub-navbar-border);
        backdrop-filter: blur(24px) saturate(1.4);
        -webkit-backdrop-filter: blur(24px) saturate(1.4);
      }
      /* Three-column bar: an empty left rail balances the right control
         cluster so the 5 nav items stay optically centred at any width. */
      .rail {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        align-items: center;
      }
      .rail.controls {
        justify-content: flex-end;
        gap: 4px;
        padding-right: 12px;
      }
      /* Quiet divider between the nav items and the theme/kiosk controls. */
      .rail.controls::before {
        content: '';
        width: 1px;
        height: 26px;
        margin-right: 8px;
        background: var(--hub-card-border);
      }
      .items {
        flex: 0 0 auto;
        display: flex;
        align-items: stretch;
      }
      .item {
        flex: 0 0 auto;
        min-width: 64px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hub-text-dim);
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .pill {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 30px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid transparent;
        transition:
          background 150ms ease,
          border-color 150ms ease;
      }
      .icon {
        display: flex;
        width: 24px;
        height: 24px;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .label {
        font: 500 11px var(--hub-font-body);
        letter-spacing: 0.02em;
        color: inherit;
        transition: color 150ms ease;
      }

      /* Active — icon + label take the page's domain colour, and a subtle
         tinted pill sits behind the icon. Mirrors the chip tone tokens. */
      .item.active.tone-neutral {
        color: var(--hub-text);
      }
      .item.active.tone-neutral .pill {
        background: var(--hub-icon-chip-bg);
        border-color: var(--hub-card-border);
      }
      .item.active.tone-amber {
        color: var(--hub-amber-text);
      }
      .item.active.tone-amber .pill {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .item.active.tone-green {
        color: var(--hub-green);
      }
      .item.active.tone-green .pill {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
      }
      .item.active.tone-teal {
        color: var(--hub-teal-text);
      }
      .item.active.tone-teal .pill {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .item.active.tone-lavender {
        color: var(--hub-lavender-text);
      }
      .item.active.tone-lavender .pill {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
      }
    `,
  ];

  private _select(id: string): void {
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <nav>
        <div class="rail"></div>
        <div class="items">
          ${this.pages.map((id, i) => {
            const item = navItem(id);
            const isActive = i === this.active;
            const glyph = icons[item.icon];
            return html`
              <button
                class="item tone-${item.tone} ${isActive ? 'active' : ''}"
                aria-label=${item.label}
                aria-current=${isActive ? 'page' : nothing}
                @click=${() => this._select(id)}
              >
                <span class="pill">
                  ${glyph ? html`<span class="icon">${glyph}</span>` : nothing}
                </span>
                <span class="label">${item.label}</span>
              </button>
            `;
          })}
        </div>
        <div class="rail controls">
          <slot name="controls"></slot>
        </div>
      </nav>
    `;
  }
}

customElements.define('hub-nav-bar', HubNavBar);
