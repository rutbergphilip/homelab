import { html, css, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubChipTone } from './hub-status-chip.js';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  tone: HubChipTone;
}

// Each page carries its domain signature colour into the dock: the active item
// and the lens behind it tint with it, everything else stays muted so the dock
// reads as a calm, glanceable strip. Kept as data so it can be unit-tested apart from
// the component. Hem is deliberately neutral — home is "no domain".
const NAV_MAP: Record<string, Omit<NavItem, 'id'>> = {
  hem: { label: 'Hem', icon: 'home', tone: 'neutral' },
  ljus: { label: 'Ljus', icon: 'lamp', tone: 'amber' },
  media: { label: 'Media', icon: 'note', tone: 'teal' },
  energi: { label: 'Energi', icon: 'bolt', tone: 'green' },
  kcal: { label: 'Kcal', icon: 'ring', tone: 'lavender' },
  vecka: { label: 'Vecka', icon: 'calendar', tone: 'lavender' },
  halsa: { label: 'Hälsa', icon: 'pulse', tone: 'lavender' },
  // System has no domain colour on purpose — infrastructure is not a mood; the
  // status pills inside the page carry the only semantic colour.
  system: { label: 'System', icon: 'server', tone: 'neutral' },
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
  /** Phone only: the theme/fullscreen controls live in a popover above the
   *  detached "more" button instead of sitting inline. */
  @state() private _moreOpen = false;

  static styles = [
    hubTokens,
    css`
      /* A floating dock, not a bar: page content scrolls behind and around it.
         The host is a click-through row; only the glass pieces take input. */
      :host {
        position: absolute;
        left: 0;
        right: 0;
        bottom: var(--hub-nav-bottom);
        z-index: 30;
        display: flex;
        justify-content: center;
        padding: 0 10px;
        box-sizing: border-box;
        pointer-events: none;
      }
      .dock {
        position: relative;
        display: flex;
        align-items: stretch;
        gap: 8px;
        max-width: 100%;
        min-width: 0;
      }
      .glass {
        box-sizing: border-box;
        height: var(--hub-nav-capsule-h);
        border-radius: var(--hub-radius-pill);
        background: var(--hub-navbar-bg);
        border: 1px solid var(--hub-navbar-border);
        box-shadow: var(--hub-navbar-shadow);
        backdrop-filter: blur(28px) saturate(1.8);
        -webkit-backdrop-filter: blur(28px) saturate(1.8);
        pointer-events: auto;
      }

      /* ── Page items ───────────────────────────────────────── */
      nav {
        position: relative;
        display: flex;
        align-items: stretch;
        padding: 4px;
        min-width: 0;
      }
      /* Grid, not flex: the slots must size the capsule. With flex items sized
         by flex-basis, Chromium counts the basis toward the container's
         intrinsic width but Firefox and WebKit count only the label text — the
         capsule collapsed to ~240px and five items spilled out of it (Zen,
         Safari). Explicit grid tracks are sized identically everywhere. */
      .items {
        position: relative;
        display: grid;
        grid-template-columns: repeat(var(--n), var(--hub-nav-slot, 72px));
        align-items: stretch;
        min-width: 0;
        flex: 1 1 auto;
      }
      /* The lens: one highlight that slides between equal-width slots. Its own
         width is one slot, so translateX(100% × index) lands it exactly. */
      .lens {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: calc(100% / var(--n));
        transform: translateX(calc(100% * var(--i)));
        box-sizing: border-box;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-card-border);
        background: var(--hub-icon-chip-bg);
        box-shadow: var(--hub-navbar-lens-shadow);
        transition:
          transform 380ms cubic-bezier(0.3, 1.35, 0.5, 1),
          background 200ms ease,
          border-color 200ms ease;
        pointer-events: none;
      }
      .lens.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .lens.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
      }
      .lens.tone-teal {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .lens.tone-lavender {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
      }
      @media (prefers-reduced-motion: reduce) {
        .lens {
          transition: none;
        }
      }

      .item {
        position: relative;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 0;
        border: none;
        border-radius: var(--hub-radius-pill);
        background: transparent;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .item:focus-visible,
      .more:focus-visible {
        outline: 2px solid var(--hub-text-muted);
        outline-offset: -2px;
      }
      .icon {
        display: flex;
        width: 22px;
        height: 22px;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .label {
        font: 500 10.5px/1.15 var(--hub-font-body);
        letter-spacing: 0.01em;
        color: inherit;
        white-space: nowrap;
      }
      /* Active — icon + label take the page's domain colour; the lens behind
         carries the matching tint. */
      .item.active.tone-neutral {
        color: var(--hub-text);
      }
      .item.active.tone-amber {
        color: var(--hub-amber-text);
      }
      .item.active.tone-green {
        color: var(--hub-green);
      }
      .item.active.tone-teal {
        color: var(--hub-teal-text);
      }
      .item.active.tone-lavender {
        color: var(--hub-lavender-text);
      }

      /* ── Controls (theme + fullscreen) ────────────────────── */
      .controls {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 0 5px;
        flex: 0 0 auto;
      }
      .more {
        display: none;
        flex: 0 0 var(--hub-nav-capsule-h);
        width: var(--hub-nav-capsule-h);
        align-items: center;
        justify-content: center;
        padding: 0;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .more svg {
        width: 22px;
        height: 22px;
      }
      .more[aria-expanded='true'] {
        color: var(--hub-text);
      }

      /* ── Phone: every page stays visible, controls fold away ─ */
      @media (max-width: 600px) {
        .dock {
          width: 100%;
          max-width: 480px;
        }
        nav {
          flex: 1 1 auto;
        }
        .items {
          --hub-nav-slot: minmax(0, 1fr);
        }
        .label {
          font-size: 10px;
          letter-spacing: 0;
        }
        .more {
          display: flex;
        }
        .controls {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          padding: 0 6px;
          transform-origin: bottom right;
          transition:
            opacity 160ms ease,
            transform 200ms cubic-bezier(0.3, 1.35, 0.5, 1),
            visibility 0s;
        }
        .controls:not(.open) {
          opacity: 0;
          visibility: hidden;
          transform: scale(0.85) translateY(6px);
          pointer-events: none;
          transition:
            opacity 120ms ease,
            transform 120ms ease,
            visibility 0s 120ms;
        }
      }
      @media (max-width: 400px) {
        :host {
          padding: 0 8px;
        }
        .dock {
          gap: 6px;
        }
        .label {
          font-size: 9.5px;
        }
        .icon {
          width: 21px;
          height: 21px;
        }
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('pointerdown', this._onWindowPointerDown, true);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('pointerdown', this._onWindowPointerDown, true);
  }

  // Tap anywhere outside the dock closes the controls popover.
  private _onWindowPointerDown = (e: PointerEvent): void => {
    if (!this._moreOpen) return;
    if (e.composedPath().includes(this)) return;
    this._moreOpen = false;
  };

  // The theme button cycles, so the popover stays for repeated taps; anything
  // else (HA menu, fullscreen) is a one-shot and dismisses it.
  private _onControlClick = (e: Event): void => {
    const hit = e.composedPath().find(
      (n) => n instanceof HTMLElement && n.slot === 'controls',
    ) as HTMLElement | undefined;
    if (hit && !hit.classList.contains('theme-toggle')) this._moreOpen = false;
  };

  private _select(id: string): void {
    this._moreOpen = false;
    this.dispatchEvent(
      new CustomEvent('hub-goto-page', {
        detail: { page: id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const items = this.pages.map(navItem);
    const tone = items[this.active]?.tone ?? 'neutral';
    return html`
      <div class="dock">
        <nav class="glass" aria-label="Sidor">
          <div class="items" style="--n:${Math.max(items.length, 1)};--i:${this.active}">
            <span class="lens tone-${tone}"></span>
            ${items.map((item, i) => {
              const isActive = i === this.active;
              const glyph = icons[item.icon];
              return html`
                <button
                  class="item tone-${item.tone} ${isActive ? 'active' : ''}"
                  aria-label=${item.label}
                  aria-current=${isActive ? 'page' : nothing}
                  @click=${() => this._select(item.id)}
                >
                  ${glyph ? html`<span class="icon">${glyph}</span>` : nothing}
                  <span class="label">${item.label}</span>
                </button>
              `;
            })}
          </div>
        </nav>
        <div class="controls glass ${this._moreOpen ? 'open' : ''}" @click=${this._onControlClick}>
          <slot name="controls"></slot>
        </div>
        <button
          class="more glass"
          aria-label="Utseende och helskärm"
          aria-expanded=${this._moreOpen ? 'true' : 'false'}
          @click=${() => (this._moreOpen = !this._moreOpen)}
        >
          ${icons.more}
        </button>
      </div>
    `;
  }
}

customElements.define('hub-nav-bar', HubNavBar);
