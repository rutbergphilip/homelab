import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';

export type HubChipTone = 'amber' | 'green' | 'teal' | 'lavender' | 'coral' | 'neutral';

export class HubStatusChip extends LitElement {
  @property({ attribute: false }) icon = '';
  @property({ attribute: false }) label = '';
  @property({ attribute: false }) tone: HubChipTone = 'neutral';
  @property({ type: Boolean }) active = false;

  static styles = [
    hubTokens,
    css`
      :host {
        display: inline-flex;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: var(--hub-radius-pill);
        font: 500 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        white-space: nowrap;
      }
      .icon {
        display: flex;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .chip.active.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .chip.active.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .chip.active.tone-teal {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }
      .chip.active.tone-lavender {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .chip.active.tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .chip.active.tone-neutral {
        background: var(--hub-chip-bg);
        border-color: var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
    `,
  ];

  render() {
    const ic = icons[this.icon];
    return html`
      <span class="chip tone-${this.tone} ${this.active ? 'active' : ''}">
        ${ic ? html`<span class="icon">${ic}</span>` : ''}
        <span class="label">${this.label}</span>
      </span>
    `;
  }
}

customElements.define('hub-status-chip', HubStatusChip);
