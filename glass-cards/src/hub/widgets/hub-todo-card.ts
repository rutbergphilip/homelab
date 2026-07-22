import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { shapeTodo, fetchTodoItems, type TodoItem } from '../todo-model.js';
import type { HubConfig } from '../hub-config.js';

const SHOW = 4;

export class HubTodoCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _items: TodoItem[] | null = null;
  private _lastCount = '';

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 8px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg, var(--hub-card));
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }
      .card:active { transform: scale(0.985); }
      .label { font: 600 14px var(--hub-font-body); color: var(--hub-text); flex-shrink: 0; }
      .row {
        display: flex; align-items: center; gap: 10px; min-height: 28px;
      }
      .box {
        width: 18px; height: 18px; flex-shrink: 0;
        border-radius: 6px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        padding: 0;
      }
      .txt {
        flex: 1; min-width: 0;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
      .more { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
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

  private _complete(e: Event, item: TodoItem): void {
    e.stopPropagation();
    if (!this.config.todo_entity) return;
    this.callService('todo', 'update_item', { item: item.uid, status: 'completed' }, this.config.todo_entity);
  }

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-todo-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config?.todo_entity) return html``;
    const { open } = shapeTodo(this._items);
    return html`
      <div class="card" role="button" tabindex="0" aria-label="Visa att göra-listan" @click=${this._open}>
        <b class="label">Att göra</b>
        ${open.length === 0
          ? html`<span class="empty">Inget att göra</span>`
          : open.slice(0, SHOW).map(
              (i) => html`
                <div class="row">
                  <button class="box" aria-label="Klar: ${i.summary}" @click=${(e: Event) => this._complete(e, i)}></button>
                  <span class="txt">${i.summary}</span>
                </div>
              `,
            )}
        ${open.length > SHOW ? html`<span class="more">+${open.length - SHOW} till</span>` : nothing}
      </div>
    `;
  }
}

customElements.define('hub-todo-card', HubTodoCard);
