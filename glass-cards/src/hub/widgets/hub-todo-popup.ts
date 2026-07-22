import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import { shapeTodo, fetchTodoItems, type TodoItem } from '../todo-model.js';
import type { HubConfig } from '../hub-config.js';

export class HubTodoPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _items: TodoItem[] | null = null;
  private _lastCount = '';

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .add {
        display: flex; gap: 8px; margin-bottom: 14px;
      }
      .add input {
        flex: 1; min-width: 0; height: 48px;
        padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
      }
      .add button {
        height: 48px; padding: 0 18px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .row {
        display: flex; align-items: center; gap: 12px;
        min-height: 48px;
        border-top: 1px solid var(--hub-card-border);
      }
      .box {
        width: 22px; height: 22px; flex-shrink: 0;
        border-radius: 7px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
        cursor: pointer; padding: 0;
        -webkit-tap-highlight-color: transparent;
        display: flex; align-items: center; justify-content: center;
        color: transparent;
      }
      .row.done .box { color: var(--hub-text-dim); border-color: var(--hub-text-dim); }
      .box svg { width: 14px; height: 14px; }
      .txt { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); }
      .row.done .txt { color: var(--hub-text-dim); text-decoration: line-through; }
      .clear {
        margin-top: 14px; min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: transparent; color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    `,
  ];

  updated(changed: PropertyValues): void {
    super.updated(changed);
    const entity = this.config?.todo_entity;
    if (!entity || !this.hass) return;
    const count = this.getEntity(entity)?.state ?? '';
    if (count !== this._lastCount) {
      this._lastCount = count;
      void this._refresh();
    }
  }

  private async _refresh(): Promise<void> {
    if (!this.hass || !this.config?.todo_entity) return;
    this._items = await fetchTodoItems(this.hass, this.config.todo_entity);
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private async _add(): Promise<void> {
    const input = this.shadowRoot?.querySelector('input');
    const text = input?.value.trim();
    if (!text || !this.config.todo_entity) return;
    this.callService('todo', 'add_item', { item: text }, this.config.todo_entity);
    if (input) input.value = '';
  }

  private _toggle(item: TodoItem): void {
    if (!this.config.todo_entity) return;
    const status = item.status === 'completed' ? 'needs_action' : 'completed';
    this.callService('todo', 'update_item', { item: item.uid, status }, this.config.todo_entity);
    // Optimistic refetch after the roundtrip; the count-change hook also fires
    // but completed→completed transitions don't change the count.
    window.setTimeout(() => void this._refresh(), 400);
  }

  private _clearDone(): void {
    if (!this.config.todo_entity) return;
    this.callService('todo', 'remove_completed_items', undefined, this.config.todo_entity);
    window.setTimeout(() => void this._refresh(), 400);
  }

  render() {
    if (!this.hass || !this.config?.todo_entity) return html``;
    const { open, done } = shapeTodo(this._items);
    const check = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"></path></svg>`;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Att göra">
          <div class="head">
            <span class="title">Att göra</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          <div class="add">
            <input
              placeholder="Lägg till…"
              @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this._add()}
            />
            <button @click=${() => this._add()}>Lägg till</button>
          </div>
          ${[...open, ...done].map(
            (i) => html`
              <div class="row ${i.status === 'completed' ? 'done' : ''}">
                <button class="box" aria-label="Växla" @click=${() => this._toggle(i)}>${check}</button>
                <span class="txt">${i.summary}</span>
              </div>
            `,
          )}
          ${done.length
            ? html`<button class="clear" @click=${() => this._clearDone()}>Rensa klara (${done.length})</button>`
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-todo-popup', HubTodoPopup);
