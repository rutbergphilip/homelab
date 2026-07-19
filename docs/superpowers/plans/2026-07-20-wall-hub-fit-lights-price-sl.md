# Wall Hub Round 3 Implementation Plan — Fit, Lights, Price Toggle, SL Störningar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved spec `docs/superpowers/specs/2026-07-20-wall-hub-fit-lights-price-sl-design.md`: no-scroll fit at 1280×800, Apple-Home-style Ljus page, tap/hold swap on Hem room tiles, Energi spot/allt-in toggle with tap-for-detail, and SL störningar on the Hem transit card.

**Architecture:** All UI work is in the Lit-based wall-hub (`glass-cards/src/hub/`); pure logic goes in plain modules (`light-actions.ts`, `energy-model.ts`, `transit-model.ts`) tested with vitest. Two Home-Assistant-side sensor changes (extended Tibber GraphQL REST sensor; new SL deviations command_line sensor) are mirrored in `.claude/ha-rest-sensors.yaml` and applied to the HA pod. Deploy = rollup bundle → `upload.sh` → `deploy.mjs hub`.

**Tech Stack:** TypeScript + Lit 3, vitest, Rollup; HA REST/command_line sensors; kubectl for pod access.

## Global Constraints

- Design target viewport: **1280×800 CSS** (Galaxy Tab A9+ 11″ landscape kiosk). Every hub page must show all content with no vertical scroll at that size.
- All UI copy in Swedish (Släckt, Tänd, Ej tillgänglig, störningar, …). Preserve diacritics.
- Long-press threshold 500 ms; long-press cancels when pointer moves past `isDrag` slop (`src/hub/swipe.ts`).
- Grid fee constants (from user's contract): `overforing_ore: 26`, `energiskatt_ore: 45`. The 100 kr/mån fixed fee is excluded.
- Price view localStorage key: `glass-hub-price-view`; values `'spot' | 'allin'`; default `'allin'`.
- Monitored SL traffic: METRO lines 17/18/19, TRAIN line 43, BUS line 861.
- Working dir for all npm/vitest commands: `/Users/philiprutberg/Development/homelab/glass-cards`. Repo root for git/kubectl: `/Users/philiprutberg/Development/homelab`.
- Commit after every task; conventional-commit style messages (`feat(hub): …`, `test(hub): …`, `chore(ha): …`).

---

### Task 1: Config types + hub-config.mjs additions

**Files:**
- Modify: `glass-cards/src/hub/hub-config.ts`
- Modify: `glass-cards/scripts/hub-config.mjs`

**Interfaces:**
- Produces: `HubRoom.default_lights?: string[]`; `HubConfig.grid?: HubGridFees`; `HubConfig.disturbances_entity?: string`; exported `interface HubGridFees { overforing_ore: number; energiskatt_ore: number }`. Later tasks (2, 11, 12, 15) consume these.

- [ ] **Step 1: Extend the TypeScript config types**

In `glass-cards/src/hub/hub-config.ts` replace the `HubRoom` interface and add fields to `HubConfig`:

```ts
export interface HubRoomLight { entity: string; name: string; }
export interface HubRoomScene { entity: string; name: string; }
export interface HubRoom {
  id: string; name: string; icon: string;
  main_entity: string;              // fallback "default light" for room tap-on
  default_lights?: string[];        // lights turned on by a tap on a dark room
  lights: HubRoomLight[];
  scenes?: HubRoomScene[];          // per-room Hue scenes (Hall/Office/Badrum only)
}
export interface HubGridFees {
  overforing_ore: number;           // elnät överföringsavgift, öre/kWh
  energiskatt_ore: number;          // statlig energiskatt, öre/kWh (set 0 if Tibber total already includes it — see Task 9 gate)
}
```

and inside `HubConfig` (after `fossil_entity?: string;`):

```ts
  grid?: HubGridFees;               // per-kWh add-ons for the "Allt-in" price view
  disturbances_entity?: string;     // sensor.sl_storningar — SL deviations
```

- [ ] **Step 2: Extend `scripts/hub-config.mjs`**

After the `fossil_entity` line add:

```js
        grid: { overforing_ore: 26, energiskatt_ore: 45 },
        disturbances_entity: 'sensor.sl_storningar',
```

Add `default_lights` to each room (after each room's `main_entity`):

| room | default_lights |
|---|---|
| vardagsrum | `['light.vardagsrum', 'light.tv']` |
| kok | `['light.kok']` |
| sovrum | `['light.sovrum']` |
| hall | `['light.hall']` |
| office | `['light.office']` |
| badrum | `['light.badrum']` |

Example (vardagsrum):

```js
          { id: 'vardagsrum', name: 'Vardagsrum', icon: 'sofa', main_entity: 'light.vardagsrum',
            default_lights: ['light.vardagsrum', 'light.tv'],
            lights: [ { entity: 'light.vardagsrum', name: 'Taklampa' }, { entity: 'light.tv', name: 'TV-lampa' } ] },
```

- [ ] **Step 3: Verify build + existing tests stay green**

Run: `npm run build && npx vitest run`
Expected: build succeeds, all existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add glass-cards/src/hub/hub-config.ts glass-cards/scripts/hub-config.mjs
git commit -m "feat(hub): config types for default lights, grid fees, disturbances"
```

---

### Task 2: `light-actions.ts` — room tap plan (pure logic, TDD)

**Files:**
- Create: `glass-cards/src/hub/light-actions.ts`
- Test: `glass-cards/test/light-actions.test.ts`

**Interfaces:**
- Consumes: `HubRoom` from Task 1; `HassEntity` from `src/types.js`.
- Produces: `interface RoomTapPlan { service: 'turn_on' | 'turn_off'; entities: string[] }` and `function roomTapPlan(room: HubRoom, states: Record<string, HassEntity | undefined>): RoomTapPlan`. Tasks 3 and 7 call it and pass the result to `light.<service>` with `{ entity_id: plan.entities }`.

- [ ] **Step 1: Write the failing test**

Create `glass-cards/test/light-actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { roomTapPlan } from '../src/hub/light-actions';
import type { HubRoom } from '../src/hub/hub-config';
import type { HassEntity } from '../src/types';

const room = (over: Partial<HubRoom> = {}): HubRoom => ({
  id: 'sovrum', name: 'Sovrum', icon: 'bed', main_entity: 'light.sovrum',
  lights: [
    { entity: 'light.sovrum', name: 'Taklampa' },
    { entity: 'light.lightstrip', name: 'Lightstrip' },
    { entity: 'light.spot_1', name: 'Spot 1' },
  ],
  ...over,
});

const st = (state: string): HassEntity =>
  ({ entity_id: 'x', state, attributes: {} } as unknown as HassEntity);

describe('roomTapPlan', () => {
  it('turns off ALL room lights when any light is on', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('on'), 'light.spot_1': st('off') };
    expect(roomTapPlan(room(), states)).toEqual({
      service: 'turn_off',
      entities: ['light.sovrum', 'light.lightstrip', 'light.spot_1'],
    });
  });

  it('turns on default_lights when the room is dark', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('off'), 'light.spot_1': st('off') };
    const r = room({ default_lights: ['light.sovrum', 'light.spot_1'] });
    expect(roomTapPlan(r, states)).toEqual({
      service: 'turn_on',
      entities: ['light.sovrum', 'light.spot_1'],
    });
  });

  it('falls back to main_entity when default_lights is missing or empty', () => {
    const states = { 'light.sovrum': st('off'), 'light.lightstrip': st('off'), 'light.spot_1': st('off') };
    expect(roomTapPlan(room(), states).entities).toEqual(['light.sovrum']);
    expect(roomTapPlan(room({ default_lights: [] }), states).entities).toEqual(['light.sovrum']);
  });

  it('treats unavailable/unknown lights as off', () => {
    const states = { 'light.sovrum': st('unavailable'), 'light.lightstrip': st('unknown') };
    expect(roomTapPlan(room(), states).service).toBe('turn_on');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/light-actions.test.ts`
Expected: FAIL — cannot resolve `../src/hub/light-actions`.

- [ ] **Step 3: Write the implementation**

Create `glass-cards/src/hub/light-actions.ts`:

```ts
// Decides what a tap on a room (Hem tile / Ljus section heading) should do.
// Asymmetric by design: any light on → the whole room goes dark; a dark room
// → only the room's default lights come on (fallback: main_entity).

import type { HubRoom } from './hub-config.js';
import type { HassEntity } from '../types.js';

export interface RoomTapPlan {
  service: 'turn_on' | 'turn_off';
  entities: string[];
}

export function roomTapPlan(
  room: HubRoom,
  states: Record<string, HassEntity | undefined>,
): RoomTapPlan {
  const anyOn = room.lights.some((l) => states[l.entity]?.state === 'on');
  if (anyOn) {
    return { service: 'turn_off', entities: room.lights.map((l) => l.entity) };
  }
  const defaults = room.default_lights?.length ? room.default_lights : [room.main_entity];
  return { service: 'turn_on', entities: defaults };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/light-actions.test.ts`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/light-actions.ts glass-cards/test/light-actions.test.ts
git commit -m "feat(hub): roomTapPlan — asymmetric room tap toggle logic"
```

---

### Task 3: Hem room tile — tap acts, hold reveals

**Files:**
- Modify: `glass-cards/src/hub/widgets/hub-room-tile.ts`

**Interfaces:**
- Consumes: `roomTapPlan` (Task 2).
- Produces: unchanged event contract — tile still dispatches `hub-room-open` (`detail: { roomId }`), but now from **long-press**; tap executes the room plan via `light.turn_on/turn_off`.

- [ ] **Step 1: Swap the handlers**

In `hub-room-tile.ts`:

1. Add import: `import { roomTapPlan } from '../light-actions.js';`
2. Add a flash state: after `private _downY = 0;` add:

```ts
  @state() private _flash = false;
  private _flashTimer?: number;
```

and add `state` to the decorators import: `import { property, state } from 'lit/decorators.js';`

3. In `_onPointerDown`, the long-press timer now opens the popup instead of toggling. Replace the timer body:

```ts
    this._pressTimer = window.setTimeout(() => {
      this._longPressed = true;
      this.dispatchEvent(
        new CustomEvent('hub-room-open', {
          detail: { roomId: this.room.id },
          bubbles: true,
          composed: true,
        }),
      );
    }, LONG_PRESS_MS);
```

4. Replace `_onClick` with the tap action:

```ts
  private _onClick = (): void => {
    if (this._longPressed) {
      this._longPressed = false;
      return;
    }
    const plan = roomTapPlan(this.room, this.hass.states);
    this.callService('light', plan.service, { entity_id: plan.entities });
    this._flash = true;
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._flashTimer = window.setTimeout(() => {
      this._flash = false;
      this._flashTimer = undefined;
    }, 200);
  };
```

5. Clear the flash timer in `disconnectedCallback` (inside the existing method, after `this._cancelPress();`):

```ts
    if (this._flashTimer !== undefined) {
      clearTimeout(this._flashTimer);
      this._flashTimer = undefined;
    }
```

6. Add press-flash styling. In `static styles`, extend the `.tile` transition and add a flash rule (after the `.tile.active` block):

```css
      .tile.flash {
        transform: scale(0.96);
      }
```

and add `transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1)` to the `.tile` `transition` list.

7. In `render()`, include the class: `class="tile ${active ? 'active' : ''} ${this._flash ? 'flash' : ''}"`.

- [ ] **Step 2: Build + existing tests**

Run: `npm run build && npx vitest run`
Expected: build OK, all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-room-tile.ts
git commit -m "feat(hub): room tile — tap smart-toggles the room, hold opens popup"
```

---

### Task 4: `hub-light-tile` — compact per-light tile

**Files:**
- Create: `glass-cards/src/hub/widgets/hub-light-tile.ts`

**Interfaces:**
- Consumes: `HubRoomLight` (config), `isDrag` from `../swipe.js`, `icons.lamp`.
- Produces: `<hub-light-tile .hass .light>` where `light: HubRoomLight`. Tap → `light.toggle` on the entity. Long-press → dispatches `hub-light-open` (`detail: { entity: string; name: string }`, bubbles, composed) — consumed by glass-hub in Task 5. Dead entities render as non-interactive "Ej tillgänglig".

- [ ] **Step 1: Create the widget**

Create `glass-cards/src/hub/widgets/hub-light-tile.ts`:

```ts
import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { isDrag } from '../swipe.js';
import type { HubRoomLight } from '../hub-config.js';

const LONG_PRESS_MS = 500;
const DEAD_STATES = new Set(['unavailable', 'unknown']);

/**
 * Apple-Home-style compact light tile: tap toggles the light, long-press opens
 * the brightness popup (via hub-light-open). Same long-press/drag-slop pattern
 * as hub-room-tile so a deck swipe never fires a toggle.
 */
export class HubLightTile extends GlassBaseElement {
  @property({ attribute: false }) light!: HubRoomLight;

  @state() private _flash = false;

  private _pressTimer?: number;
  private _flashTimer?: number;
  private _longPressed = false;
  private _downX = 0;
  private _downY = 0;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .tile.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .tile.flash {
        transform: scale(0.96);
      }
      .tile.dead {
        cursor: default;
        opacity: 0.55;
      }
      .ic {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .ic svg {
        width: 15px;
        height: 15px;
      }
      .tile.on .ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        flex: 1;
        min-width: 0;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tile.on .name {
        color: var(--hub-amber-text);
        font-weight: 600;
      }
      .state {
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .tile.on .state {
        color: var(--hub-amber-text);
      }
    `,
  ];

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelPress();
    if (this._flashTimer !== undefined) {
      clearTimeout(this._flashTimer);
      this._flashTimer = undefined;
    }
  }

  private get _dead(): boolean {
    const st = this.getEntity(this.light.entity);
    return !st || DEAD_STATES.has(st.state);
  }

  private get _stateLabel(): string {
    const st = this.getEntity(this.light.entity);
    if (!st || DEAD_STATES.has(st.state)) return 'Ej tillgänglig';
    if (st.state !== 'on') return 'Av';
    const b = st.attributes.brightness;
    return typeof b === 'number' ? `${Math.round((b / 255) * 100)} %` : 'På';
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (this._dead) return;
    this._longPressed = false;
    this._downX = e.clientX;
    this._downY = e.clientY;
    this._pressTimer = window.setTimeout(() => {
      this._longPressed = true;
      this.dispatchEvent(
        new CustomEvent('hub-light-open', {
          detail: { entity: this.light.entity, name: this.light.name },
          bubbles: true,
          composed: true,
        }),
      );
    }, LONG_PRESS_MS);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (this._pressTimer === undefined) return;
    if (isDrag(e.clientX - this._downX) || isDrag(e.clientY - this._downY)) {
      this._cancelPress();
    }
  };

  private _cancelPress = (): void => {
    if (this._pressTimer !== undefined) {
      clearTimeout(this._pressTimer);
      this._pressTimer = undefined;
    }
  };

  private _onClick = (): void => {
    if (this._dead) return;
    if (this._longPressed) {
      this._longPressed = false;
      return;
    }
    this.callService('light', 'toggle', undefined, this.light.entity);
    this._flash = true;
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._flashTimer = window.setTimeout(() => {
      this._flash = false;
      this._flashTimer = undefined;
    }, 200);
  };

  render() {
    if (!this.hass || !this.light) return html``;
    const on = this.isOn(this.light.entity);
    const dead = this._dead;
    return html`
      <div
        class="tile ${on ? 'on' : ''} ${this._flash ? 'flash' : ''} ${dead ? 'dead' : ''}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="ic">${icons.lamp}</span>
        <span class="name">${this.light.name}</span>
        <span class="state">${this._stateLabel}</span>
      </div>
    `;
  }
}

customElements.define('hub-light-tile', HubLightTile);
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: success (component is not imported anywhere yet — that comes in Task 7).

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-light-tile.ts
git commit -m "feat(hub): hub-light-tile — tap toggle, hold to open detail"
```

---

### Task 5: `hub-light-popup` + glass-hub wiring

**Files:**
- Create: `glass-cards/src/hub/widgets/hub-light-popup.ts`
- Modify: `glass-cards/src/hub/glass-hub.ts`

**Interfaces:**
- Consumes: `hub-light-open` event (Task 4); `glass-light-slider` card; `hub-popup-close` event convention.
- Produces: `<hub-light-popup .hass .entity .name>` full-screen scrim popup; glass-hub state `_openLight: { entity: string; name: string } | null`.

- [ ] **Step 1: Create the popup**

Create `glass-cards/src/hub/widgets/hub-light-popup.ts` (same scrim/card pattern as `hub-room-popup.ts`):

```ts
import { html, css, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import '../../cards/glass-light-slider.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

/** Single-light detail popup: drag the slider to dim, tap scrim to close. */
export class HubLightPopup extends GlassBaseElement {
  @property() entity = '';
  @property() name = '';

  static styles = [
    hubTokens,
    css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 440px;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }
      glass-light-slider {
        display: block;
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  render() {
    if (!this.entity || !this.hass) return html``;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${this.name}>
          <div class="head">
            <span class="title">${this.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${CLOSE_ICON}</button>
          </div>
          <glass-light-slider
            .hass=${this.hass}
            ._config=${{ type: 'glass-light-slider', entity: this.entity, name: this.name }}
          ></glass-light-slider>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-light-popup', HubLightPopup);
```

- [ ] **Step 2: Wire into glass-hub**

In `glass-cards/src/hub/glass-hub.ts`:

1. Add import (next to the room-popup import): `import './widgets/hub-light-popup.js';`
2. Add state next to `_openRoom`:

```ts
  @state() private _openLight: { entity: string; name: string } | null = null;
```

3. Register/unregister the listener in `connectedCallback`/`disconnectedCallback` (next to the `hub-room-open` lines):

```ts
    this.addEventListener('hub-light-open', this._onLightOpen as EventListener);
```
```ts
    this.removeEventListener('hub-light-open', this._onLightOpen as EventListener);
```

4. Add the handler and extend `_onPopupClose`:

```ts
  private _onLightOpen = (e: CustomEvent<{ entity: string; name: string }>): void => {
    const d = e.detail;
    this._openLight = d?.entity ? { entity: d.entity, name: d.name ?? d.entity } : null;
  };

  private _onPopupClose = (): void => {
    this._openRoom = null;
    this._openLight = null;
  };
```

5. In `render()` after the room-popup block add:

```ts
      ${this._openLight
        ? html`<hub-light-popup
            .hass=${this.hass}
            .entity=${this._openLight.entity}
            .name=${this._openLight.name}
          ></hub-light-popup>`
        : nothing}
```

- [ ] **Step 3: Build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-light-popup.ts glass-cards/src/hub/glass-hub.ts
git commit -m "feat(hub): single-light brightness popup opened by long-press"
```

---

### Task 6: Room popup gains scene chips

**Files:**
- Modify: `glass-cards/src/hub/widgets/hub-room-popup.ts`

**Interfaces:**
- Consumes: `HubRoom.scenes` (existing config).
- Produces: scene chips inside the popup; tapping one calls `scene.turn_on`.

- [ ] **Step 1: Add scenes section**

In `hub-room-popup.ts`:

1. Change the lit import to include `nothing`: `import { html, css, svg, nothing } from 'lit';`
2. Add styles (after the `glass-light-slider` rule):

```css
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .scene-chip {
        min-height: 48px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease, border-color 160ms ease,
          color 160ms ease;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
```

3. Add the handler and render block. Handler:

```ts
  private _activateScene(entity: string): void {
    this.callService('scene', 'turn_on', undefined, entity);
  }
```

In `render()`, after the closing `</div>` of `.lights`:

```ts
          ${room.scenes?.length
            ? html`<div class="scenes">
                ${room.scenes.map(
                  (s) => html`
                    <button class="scene-chip" @click=${() => this._activateScene(s.entity)}>
                      ${s.name}
                    </button>
                  `,
                )}
              </div>`
            : nothing}
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-room-popup.ts
git commit -m "feat(hub): room popup hosts the room's scene chips"
```

---

### Task 7: Ljus page — sectioned tile grid

**Files:**
- Modify: `glass-cards/src/hub/pages/hub-lights-page.ts`

**Interfaces:**
- Consumes: `hub-light-tile` (Task 4), `roomTapPlan` (Task 2), `hub-room-open` event (glass-hub already listens).
- Produces: exports `roomLightSummary` and `totalLightsOn` **unchanged** (existing tests depend on them). Page keeps the header ("Allt släckt" two-stage guard + global scenes) untouched.

- [ ] **Step 1: Rework the page**

In `hub-lights-page.ts`:

1. Replace imports: drop `glass-light-slider` import, add:

```ts
import { isDrag } from '../swipe.js';
import { roomTapPlan } from '../light-actions.js';
import '../widgets/hub-light-tile.js';
```

(keep everything else; `HubRoomScene` is no longer needed in the import list — remove it.)

2. Keep `roomLightSummary`, `totalLightsOn`, `ALL_OFF_ARM_MS`, `FLASH_MS`, the `_armed/_flash` machinery and the whole `.header`/`.actions` CSS + render code **exactly as-is**.

3. Replace the body/rooms CSS (everything from `/* ── Rooms grid ── */` down to the end of `.scene-chip:active`, keeping `.dead-row` rules removable — the tile handles dead lights now) with:

```css
      /* ── Room sections in a 3-column flow ─────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto; /* emergency fallback only — content must fit 1280×800 */
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
        columns: 3;
        column-gap: var(--hub-gap);
      }
      @media (max-width: 1100px) {
        .body {
          columns: 2;
        }
      }

      .section {
        break-inside: avoid;
        margin-bottom: 16px;
      }
      .sec-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2px 4px 8px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .sec-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sec-head.active .sec-name {
        color: var(--hub-amber-text);
      }
      .sec-meta {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .sec-head.active .sec-meta {
        color: var(--hub-amber-muted);
      }
      .tiles {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      hub-light-tile {
        display: block;
      }
```

4. Add section heading press handling (tap = room smart toggle, hold = room popup) and the new render helpers. Add fields near `_armTimer`:

```ts
  private _headPressTimer?: number;
  private _headLongPressed = false;
  private _headDownX = 0;
  private _headDownY = 0;
```

Add methods (replace `_lightRow`, `_sceneChip`, `_roomCard`):

```ts
  private _onHeadDown(e: PointerEvent, room: HubRoom): void {
    this._headLongPressed = false;
    this._headDownX = e.clientX;
    this._headDownY = e.clientY;
    this._headPressTimer = window.setTimeout(() => {
      this._headLongPressed = true;
      this.dispatchEvent(
        new CustomEvent('hub-room-open', {
          detail: { roomId: room.id },
          bubbles: true,
          composed: true,
        }),
      );
    }, 500);
  }

  private _onHeadMove = (e: PointerEvent): void => {
    if (this._headPressTimer === undefined) return;
    if (isDrag(e.clientX - this._headDownX) || isDrag(e.clientY - this._headDownY)) {
      this._cancelHeadPress();
    }
  };

  private _cancelHeadPress = (): void => {
    if (this._headPressTimer !== undefined) {
      clearTimeout(this._headPressTimer);
      this._headPressTimer = undefined;
    }
  };

  private _onHeadClick(room: HubRoom): void {
    if (this._headLongPressed) {
      this._headLongPressed = false;
      return;
    }
    const plan = roomTapPlan(room, this.hass.states);
    this.callService('light', plan.service, { entity_id: plan.entities });
  }

  private _section(room: HubRoom): TemplateResult {
    const summary = roomLightSummary(room, this.hass.states);
    const active = summary.onCount > 0;
    return html`
      <div class="section">
        <div
          class="sec-head ${active ? 'active' : ''}"
          @pointerdown=${(e: PointerEvent) => this._onHeadDown(e, room)}
          @pointermove=${this._onHeadMove}
          @pointerup=${this._cancelHeadPress}
          @pointercancel=${this._cancelHeadPress}
          @pointerleave=${this._cancelHeadPress}
          @click=${() => this._onHeadClick(room)}
        >
          <span class="sec-name">${room.name}</span>
          <span class="sec-meta">${summary.label}</span>
        </div>
        <div class="tiles">
          ${room.lights.map(
            (l) => html`<hub-light-tile .hass=${this.hass} .light=${l}></hub-light-tile>`,
          )}
        </div>
      </div>
    `;
  }
```

Also clear the head timer in `_clearTimers()`:

```ts
    this._cancelHeadPress();
```

5. In `render()`, replace the body block:

```ts
        <div class="body">
          ${(cfg.rooms ?? []).map((r) => this._section(r))}
        </div>
```

(Remove the now-unused `_lightRow`, `_sceneChip`, `_roomCard` methods, the `.rooms`/`.room*`/`.lights`/`.dead-row`/`.scenes`/`.scene-chip` CSS, and the `DEAD_STATES`/`isLightLive` helpers **only if** no longer referenced — note `totalLightsOn` still uses `isLightLive`, so keep those two.)

- [ ] **Step 2: Build + tests**

Run: `npm run build && npx vitest run test/hub-lights-page.test.ts && npx vitest run`
Expected: all PASS (`roomLightSummary`/`totalLightsOn` unchanged).

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/pages/hub-lights-page.ts
git commit -m "feat(hub): Ljus page — sectioned light-tile grid, no-scroll layout"
```

---

### Task 8: Energy model — dual series + breakdown (TDD)

**Files:**
- Modify: `glass-cards/src/hub/energy-model.ts`
- Test: `glass-cards/test/energy-model.test.ts` (append a new describe block)

**Interfaces:**
- Consumes: sensor attributes now shaped `{ today: [{ total, energy?, startsAt }], tomorrow: [...] }`.
- Produces (consumed by Tasks 10–12):
  - `type PriceView = 'spot' | 'allin'`
  - `HourPrice` gains `spotOre: number | null; totalOre: number` (`ore` remains the active-view value)
  - `buildEnergyModel(attrs, state, now, view: PriceView = 'allin', gridAddOre = 0): EnergyModel` — backwards compatible: existing 3-arg calls behave exactly as before (`ore === totalOre`).
  - `hasSpotSeries(model: EnergyModel): boolean` — true when every parsed hour carries `spotOre`.
  - `interface PriceBreakdown { spot: number; taxes: number; grid: number }` and `priceBreakdown(h: HourPrice, gridAddOre: number): PriceBreakdown | null`.

- [ ] **Step 1: Write the failing tests**

Append to `glass-cards/test/energy-model.test.ts`:

```ts
import {
  buildEnergyModel as buildV2,
  hasSpotSeries,
  priceBreakdown,
} from '../src/hub/energy-model';

describe('dual-series price views', () => {
  const NOW = new Date('2026-07-20T10:30:00');
  const attrs = {
    today: [
      { total: 1.0, energy: 0.6, startsAt: '2026-07-20T10:00:00' },
      { total: 1.5, energy: 1.0, startsAt: '2026-07-20T11:00:00' },
    ],
    tomorrow: [],
  };

  it('allin view adds gridAddOre on top of total', () => {
    const m = buildV2(attrs, '1.0', NOW, 'allin', 71);
    expect(m.today[0].ore).toBeCloseTo(171); // 100 + 71
    expect(m.today[0].totalOre).toBeCloseTo(100);
    expect(m.today[0].spotOre).toBeCloseTo(60);
  });

  it('spot view uses the energy field, no grid add', () => {
    const m = buildV2(attrs, '1.0', NOW, 'spot', 71);
    expect(m.today[0].ore).toBeCloseTo(60);
    expect(m.today[1].ore).toBeCloseTo(100);
  });

  it('default 3-arg call behaves like before (ore = total×100)', () => {
    const m = buildV2(attrs, '1.0', NOW);
    expect(m.today[0].ore).toBeCloseTo(100);
  });

  it('hours without energy fall back to total in spot view and report no spot series', () => {
    const partial = { today: [{ total: 1.0, startsAt: '2026-07-20T10:00:00' }], tomorrow: [] };
    const m = buildV2(partial, '1.0', NOW, 'spot', 71);
    expect(m.today[0].ore).toBeCloseTo(100);
    expect(m.today[0].spotOre).toBeNull();
    expect(hasSpotSeries(m)).toBe(false);
    expect(hasSpotSeries(buildV2(attrs, '1.0', NOW))).toBe(true);
  });

  it('priceBreakdown splits spot / taxes / grid, null without spot data', () => {
    const m = buildV2(attrs, '1.0', NOW, 'allin', 71);
    expect(priceBreakdown(m.today[0], 71)).toEqual({ spot: 60, taxes: 40, grid: 71 });
    const partial = buildV2(
      { today: [{ total: 1.0, startsAt: '2026-07-20T10:00:00' }], tomorrow: [] },
      '1.0',
      NOW,
    );
    expect(priceBreakdown(partial.today[0], 71)).toBeNull();
  });

  it('level and cheapest window follow the active view', () => {
    const m = buildV2(attrs, '1.0', NOW, 'spot', 71);
    // current hour 60 vs today avg 80 → ratio 0.75 < 0.85 → låg
    expect(m.level).toBe('låg');
  });
});
```

(If the file's existing imports collide, reuse the existing `buildEnergyModel` import instead of aliasing — adjust the new block accordingly; the alias just avoids touching existing lines.)

- [ ] **Step 2: Run tests to verify the new block fails**

Run: `npx vitest run test/energy-model.test.ts`
Expected: existing tests PASS, new block FAILS (missing exports).

- [ ] **Step 3: Implement**

In `glass-cards/src/hub/energy-model.ts`:

1. Extend types:

```ts
export type PriceView = 'spot' | 'allin';

export interface HourPrice {
  start: Date;
  ore: number; // öre/kWh in the ACTIVE view
  totalOre: number; // Tibber total (spot+påslag+skatt/moms) öre/kWh
  spotOre: number | null; // Tibber energy part, null when the sensor lacks it
}

export interface PriceBreakdown {
  spot: number; // öre/kWh
  taxes: number; // Tibber total − spot (påslag + skatt + moms)
  grid: number; // configured elnät add-on
}
```

2. `parseHours` reads both fields and takes the view:

```ts
function parseHours(raw: unknown, view: PriceView, gridAddOre: number): HourPrice[] {
  if (!Array.isArray(raw)) return [];
  const out: HourPrice[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const total = typeof rec.total === 'number' ? rec.total : Number(rec.total);
    if (!Number.isFinite(total) || typeof rec.startsAt !== 'string') continue;
    const start = new Date(rec.startsAt);
    if (Number.isNaN(start.getTime())) continue;
    const energyRaw = typeof rec.energy === 'number' ? rec.energy : Number(rec.energy);
    const spotOre = Number.isFinite(energyRaw) ? energyRaw * 100 : null;
    const totalOre = total * 100;
    const ore =
      view === 'spot' && spotOre !== null ? spotOre : totalOre + (view === 'allin' ? gridAddOre : 0);
    out.push({ start, ore, totalOre, spotOre });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}
```

Wait — the default 3-arg behaviour must stay `ore = total×100` (no grid add). Achieve that by defaulting `gridAddOre = 0` in `buildEnergyModel` (below): `allin` with grid 0 ≡ old behaviour. ✓

3. `buildEnergyModel` signature + plumbing:

```ts
export function buildEnergyModel(
  attrs: Record<string, unknown> | null | undefined,
  state: string,
  now: Date,
  view: PriceView = 'allin',
  gridAddOre = 0,
): EnergyModel {
  if (DEAD.has(String(state ?? '').toLowerCase())) return emptyModel();

  const today = parseHours(attrs?.today, view, gridAddOre);
  const tomorrow = parseHours(attrs?.tomorrow, view, gridAddOre);
  // …rest of the function body unchanged…
```

4. New helpers at the end of the file:

```ts
/** True when every parsed hour carries the Tibber energy (spot) component. */
export function hasSpotSeries(model: EnergyModel): boolean {
  const all = [...model.today, ...model.tomorrow];
  return all.length > 0 && all.every((h) => h.spotOre !== null);
}

/** Spot / taxes / elnät split for the detail flyout; null without spot data. */
export function priceBreakdown(h: HourPrice, gridAddOre: number): PriceBreakdown | null {
  if (h.spotOre === null) return null;
  return { spot: h.spotOre, taxes: h.totalOre - h.spotOre, grid: gridAddOre };
}
```

5. Fix `emptyModel()` — no change needed (arrays empty), but the `HourPrice` construction in this file is only in `parseHours`. Confirm nothing else builds `HourPrice` literals.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run test/energy-model.test.ts && npx vitest run`
Expected: ALL PASS (old + new).

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/energy-model.ts glass-cards/test/energy-model.test.ts
git commit -m "feat(hub): energy model — spot/allt-in views, grid add-on, breakdown"
```

---

### Task 9: Tibber REST sensor — add `energy` + double-count gate (HA-side)

**Files:**
- Modify: `.claude/ha-rest-sensors.yaml`
- Modify (in pod): HA `/config/configuration.yaml`

**Interfaces:**
- Produces: `sensor.elpris_timserie` attributes `today`/`tomorrow` items shaped `{ total, energy, startsAt }`. Consumed by Task 8's parser (already tolerant of missing `energy`, so ordering is safe either way).

- [ ] **Step 1: Update the mirror file**

In `.claude/ha-rest-sensors.yaml`, change the Tibber payload line to also request `energy` (all three of current/today/tomorrow):

```yaml
    payload: '{"query":"{viewer{homes{currentSubscription{priceInfo{current{total energy startsAt} today{total energy startsAt} tomorrow{total energy startsAt}}}}}}"}'
```

- [ ] **Step 2: Apply the same change in the HA pod**

```bash
kubectl -n home-automation exec deploy/home-assistant -- \
  sed -i 's/priceInfo{current{total startsAt} today{total startsAt} tomorrow{total startsAt}}/priceInfo{current{total energy startsAt} today{total energy startsAt} tomorrow{total energy startsAt}}/' \
  /config/configuration.yaml
kubectl -n home-automation exec deploy/home-assistant -- \
  grep -c 'total energy startsAt' /config/configuration.yaml
```

Expected: `1` (the payload line matched and now contains the energy fields ×3 on one line — grep -c counts lines).

- [ ] **Step 3: Validate config and restart HA**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" \
  https://home.rutberg.dev/api/config/core/check_config | jq .result
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" \
  https://home.rutberg.dev/api/services/homeassistant/restart
```

Expected: `"valid"`, then HA restarts (~1–2 min). Wait, then:

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" \
  https://home.rutberg.dev/api/states/sensor.elpris_timserie | jq '.attributes.today[0]'
```

Expected: an object containing `total`, `energy`, `startsAt`.

- [ ] **Step 4: Double-count gate — decide the grid add-on**

Compute for the current hour: `diff_ore = (total − energy) × 100` and `moms_only = energy × 100 × 0.25`.

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" \
  https://home.rutberg.dev/api/states/sensor.elpris_timserie | \
  jq '.attributes.today[0] | {diff_ore: ((.total - .energy) * 100), moms_only: (.energy * 25)}'
```

Decision rule:
- `diff_ore ≈ moms_only` (within a few öre) → Tibber total does **not** include energiskatt → keep `energiskatt_ore: 45` in `scripts/hub-config.mjs` (grid add = 71 öre).
- `diff_ore ≈ moms_only + ~45` → energiskatt **is** included → set `energiskatt_ore: 0` in `scripts/hub-config.mjs` (grid add = 26 öre) and note why in a comment.

Record the measured numbers and the decision in the commit message.

- [ ] **Step 5: Commit**

```bash
git add .claude/ha-rest-sensors.yaml glass-cards/scripts/hub-config.mjs
git commit -m "chore(ha): elpris sensor carries Tibber energy component

Double-count gate: diff_ore=<measured>, moms_only=<measured> → energiskatt
<included|not included> in Tibber total → grid add-on = <26|71> öre/kWh."
```

---

### Task 10: Energi page — Spot/Allt-in toggle (+ strip view awareness)

**Files:**
- Create: `glass-cards/src/hub/price-view.ts`
- Modify: `glass-cards/src/hub/pages/hub-energy-page.ts`
- Modify: `glass-cards/src/hub/widgets/hub-energy-strip.ts`

**Interfaces:**
- Consumes: Task 8 model API; `HubConfig.grid` (Task 1).
- Produces: `getStoredPriceView(): PriceView`, `setStoredPriceView(v: PriceView): void`, and `gridAddOre(cfg: HubConfig): number` in `price-view.ts`. Task 11 (chart) consumes `gridAddOre` too.

- [ ] **Step 1: Create the storage helper**

Create `glass-cards/src/hub/price-view.ts`:

```ts
// Persisted Spot/Allt-in choice for the Energi page (and the Hem strip, which
// mirrors it). Mirrors theme-controller's guarded-localStorage pattern.

import type { PriceView } from './energy-model.js';
import type { HubConfig } from './hub-config.js';

const KEY = 'glass-hub-price-view';

export function getStoredPriceView(): PriceView {
  try {
    return localStorage.getItem(KEY) === 'spot' ? 'spot' : 'allin';
  } catch {
    return 'allin';
  }
}

export function setStoredPriceView(v: PriceView): void {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode etc. — the toggle simply won't persist */
  }
}

/** Per-kWh öre added on top of Tibber total in the Allt-in view. */
export function gridAddOre(cfg: HubConfig | undefined): number {
  return (cfg?.grid?.overforing_ore ?? 0) + (cfg?.grid?.energiskatt_ore ?? 0);
}
```

- [ ] **Step 2: Energi page toggle**

In `hub-energy-page.ts`:

1. Imports:

```ts
import { buildEnergyModel, hasSpotSeries, type EnergyModel, type PriceView } from '../energy-model.js';
import { getStoredPriceView, setStoredPriceView, gridAddOre } from '../price-view.js';
```

2. State: `@state() private _view: PriceView = getStoredPriceView();`

3. `_model()` passes view + grid:

```ts
    return buildEnergyModel(
      ent.attributes as Record<string, unknown>,
      ent.state,
      this._now,
      this._view,
      this._view === 'allin' ? gridAddOre(this.config) : 0,
    );
```

4. Toggle handler:

```ts
  private _setView(v: PriceView): void {
    this._view = v;
    setStoredPriceView(v);
  }
```

5. Toggle CSS (add to styles):

```css
      .view-toggle {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
      }
      .view-toggle button {
        min-height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: var(--hub-radius-pill);
        background: transparent;
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 150ms ease, color 150ms ease;
      }
      .view-toggle button.sel {
        background: var(--hub-green-bg);
        color: var(--hub-green);
      }
      .head-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
```

6. In `render()`, wrap the existing header content and add the toggle — replace `<div class="header">…</div>` with:

```ts
        <div class="header">
          <div class="head-row">
            <div>
              <div class="price">
                <span class="price-num ${numClass}">${ore === null ? '—' : ore}</span>
                <span class="price-unit">öre/kWh</span>
              </div>
              <div class="subline">
                ${this._view === 'spot' ? 'spotpris' : 'allt-in'} just nu${showWord
                  ? html` ·
                      <span class=${level === 'låg' ? 'accent-low' : 'accent-high'}
                        >${LEVEL_WORD[level]}</span
                      >`
                  : nothing}
              </div>
            </div>
            ${spotAvailable
              ? html`<div class="view-toggle">
                  <button
                    class=${this._view === 'spot' ? 'sel' : ''}
                    @click=${() => this._setView('spot')}
                  >
                    Spot
                  </button>
                  <button
                    class=${this._view === 'allin' ? 'sel' : ''}
                    @click=${() => this._setView('allin')}
                  >
                    Allt-in
                  </button>
                </div>`
              : nothing}
          </div>
        </div>
```

with, earlier in `render()`:

```ts
    const spotAvailable = !!model && hasSpotSeries(model);
```

Guard the case where `_view === 'spot'` but the sensor hasn't been migrated yet (no `energy` fields) inside `_model()`:

```ts
  private _model(): EnergyModel | null {
    const ent = this.config.price_series_entity
      ? this.getEntity(this.config.price_series_entity)
      : undefined;
    if (!ent) return null;
    const attrs = ent.attributes as Record<string, unknown>;
    let model = buildEnergyModel(
      attrs, ent.state, this._now, this._view,
      this._view === 'allin' ? gridAddOre(this.config) : 0,
    );
    if (this._view === 'spot' && !hasSpotSeries(model)) {
      // sensor not migrated yet — fall back to the allt-in series
      model = buildEnergyModel(attrs, ent.state, this._now, 'allin', gridAddOre(this.config));
    }
    return model;
  }
```

and compute `spotAvailable = !!model && hasSpotSeries(model)` in `render()` from that model (a spot-view model built from spot data still has `spotOre` set, so `hasSpotSeries` works on either view).

7. Pass the grid constant to the chart (Task 11 adds the property; setting an unknown property before that is harmless):

```ts
<hub-price-chart .model=${model} .gridAddOre=${gridAddOre(this.config)}></hub-price-chart>
```

- [ ] **Step 3: Strip follows the stored view**

In `hub-energy-strip.ts`:

```ts
import { getStoredPriceView, gridAddOre } from '../price-view.js';
```

and `_model()` becomes:

```ts
  private _model(): EnergyModel | null {
    const ent = this.config.price_series_entity
      ? this.getEntity(this.config.price_series_entity)
      : undefined;
    if (!ent) return null;
    const view = getStoredPriceView();
    const attrs = ent.attributes as Record<string, unknown>;
    const model = buildEnergyModel(
      attrs, ent.state, this._now, view,
      view === 'allin' ? gridAddOre(this.config) : 0,
    );
    if (view === 'spot' && model.today.length && model.today.some((h) => h.spotOre === null)) {
      return buildEnergyModel(attrs, ent.state, this._now, 'allin', gridAddOre(this.config));
    }
    return model;
  }
```

- [ ] **Step 4: Build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/price-view.ts glass-cards/src/hub/pages/hub-energy-page.ts glass-cards/src/hub/widgets/hub-energy-strip.ts
git commit -m "feat(hub): Spot/Allt-in price toggle, persisted; strip follows"
```

---

### Task 11: Price chart — tap a bar for details

**Files:**
- Modify: `glass-cards/src/hub/widgets/hub-price-chart.ts`

**Interfaces:**
- Consumes: `priceBreakdown` (Task 8); `gridAddOre` property set by the Energi page (Task 10).
- Produces: `@property({ type: Number }) gridAddOre = 0;` on `HubPriceChart`.

- [ ] **Step 1: Implement the flyout**

In `hub-price-chart.ts`:

1. Imports: add `state` to decorators import; add `import { priceBreakdown, type EnergyModel, type HourPrice } from '../energy-model.js';` (replacing the existing type-only import).
2. Add property + state:

```ts
  @property({ type: Number }) gridAddOre = 0;
  @state() private _detail: number | null = null; // slot index of the open flyout
  private _detailTimer?: number;
```

3. Add `disconnectedCallback` to clear the timer:

```ts
  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._detailTimer !== undefined) {
      clearTimeout(this._detailTimer);
      this._detailTimer = undefined;
    }
  }
```

4. Handlers:

```ts
  private _toggleDetail(idx: number): void {
    this._detail = this._detail === idx ? null : idx;
    if (this._detailTimer !== undefined) clearTimeout(this._detailTimer);
    if (this._detail !== null) {
      this._detailTimer = window.setTimeout(() => {
        this._detail = null;
        this._detailTimer = undefined;
      }, 6000);
    }
  }
```

5. Flyout CSS (append to styles):

```css
      .cell {
        cursor: pointer;
      }
      .flyout {
        position: absolute;
        bottom: calc(var(--bar-h) + 10px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        min-width: 132px;
        padding: 10px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        pointer-events: none;
      }
      .flyout.edge-l {
        left: 0;
        transform: none;
      }
      .flyout.edge-r {
        left: auto;
        right: 0;
        transform: none;
      }
      .fly-hour {
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
      }
      .fly-price {
        margin-top: 2px;
        font: 600 17px var(--hub-font-display);
        color: var(--hub-text);
        white-space: nowrap;
      }
      .fly-rows {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .fly-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
```

6. Flyout template helper:

```ts
  private _flyout(h: HourPrice, idx: number, count: number): TemplateResult {
    const from = String(h.start.getHours()).padStart(2, '0');
    const to = String((h.start.getHours() + 1) % 24).padStart(2, '0');
    const edge = idx < 2 ? 'edge-l' : idx > count - 3 ? 'edge-r' : '';
    const bd = priceBreakdown(h, this.gridAddOre);
    return html`
      <div class="flyout ${edge}">
        <div class="fly-hour">${from}–${to}</div>
        <div class="fly-price">${Math.round(h.ore)} öre/kWh</div>
        ${bd
          ? html`<div class="fly-rows">
              <div class="fly-row"><span>Spot</span><span>${Math.round(bd.spot)} öre</span></div>
              <div class="fly-row"><span>Skatt &amp; moms</span><span>${Math.round(bd.taxes)} öre</span></div>
              <div class="fly-row"><span>Elnät</span><span>${Math.round(bd.grid)} öre</span></div>
            </div>`
          : nothing}
      </div>
    `;
  }
```

7. In `render()`'s slot map, give bar cells a click handler and the flyout. The map already has the index implicitly — change `${slots.map((s) => {` to `${slots.map((s, i) => {` and the bar-cell return to:

```ts
            return html`
              <div
                class="cell ${s.cls}"
                style="--bar-h:${h}%"
                @click=${() => this._toggleDetail(i)}
              >
                ${this._detail === i ? this._flyout(s.hour, i, slots.length) : nothing}
                ${s.label && this._detail !== i
                  ? html`<span class="cell-label">${s.label}</span>`
                  : nothing}
                <div class="bar" style="height:${h}%;${bg}"></div>
              </div>
            `;
```

(The current-hour öre label hides while that cell's flyout is open, so they don't overlap.)

- [ ] **Step 2: Build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-price-chart.ts
git commit -m "feat(hub): price chart — tap a bar for hour details and breakdown"
```

---

### Task 12: Transit model — deviation shaping (TDD)

**Files:**
- Modify: `glass-cards/src/hub/transit-model.ts`
- Test: `glass-cards/test/transit-model.test.ts` (append)

**Interfaces:**
- Consumes: `sensor.sl_storningar` attribute `deviations`: array of `{ header?: string; priority?: number; lines?: [{ designation?: string; transport_mode?: string }] }` (slimmed server-side in Task 13).
- Produces (consumed by Task 15):
  - `interface ShapedDeviation { badges: string[]; header: string }`
  - `function shapeDeviations(raw: unknown): ShapedDeviation[]` — validates, drops entries without a header, dedupes identical headers (merging badges), sorts by priority desc, caps at 5.

- [ ] **Step 1: Write the failing tests**

Append to `glass-cards/test/transit-model.test.ts`:

```ts
import { shapeDeviations } from '../src/hub/transit-model';

describe('shapeDeviations', () => {
  const dev = (over: Record<string, unknown> = {}) => ({
    header: 'Försenad trafik',
    priority: 30,
    lines: [{ designation: '19', transport_mode: 'METRO' }],
    ...over,
  });

  it('maps deviations to badge + header rows', () => {
    expect(shapeDeviations([dev()])).toEqual([{ badges: ['19'], header: 'Försenad trafik' }]);
  });

  it('dedupes identical headers and merges badges', () => {
    const out = shapeDeviations([
      dev({ lines: [{ designation: '18', transport_mode: 'METRO' }] }),
      dev({ lines: [{ designation: '19', transport_mode: 'METRO' }] }),
    ]);
    expect(out).toEqual([{ badges: ['18', '19'], header: 'Försenad trafik' }]);
  });

  it('sorts by priority descending', () => {
    const out = shapeDeviations([
      dev({ header: 'Mindre', priority: 10, lines: [{ designation: '861', transport_mode: 'BUS' }] }),
      dev({ header: 'Stopp', priority: 40, lines: [{ designation: '43', transport_mode: 'TRAIN' }] }),
    ]);
    expect(out.map((d) => d.header)).toEqual(['Stopp', 'Mindre']);
  });

  it('drops malformed entries and caps at 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => dev({ header: `Störning ${i}` }));
    expect(shapeDeviations(many)).toHaveLength(5);
    expect(shapeDeviations([{ lines: [] }, null, 'x'])).toEqual([]);
    expect(shapeDeviations(undefined)).toEqual([]);
    expect(shapeDeviations('not-an-array')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify the new block fails**

Run: `npx vitest run test/transit-model.test.ts`
Expected: existing PASS, new block FAILS (`shapeDeviations` not exported).

- [ ] **Step 3: Implement**

Append to `glass-cards/src/hub/transit-model.ts`:

```ts
/** One slimmed SL deviation as emitted by the sensor.sl_storningar command. */
interface RawDeviation {
  header?: unknown;
  priority?: unknown;
  lines?: unknown;
}

export interface ShapedDeviation {
  badges: string[]; // line designations, e.g. ['18', '19']
  header: string;
}

const MAX_DEVIATIONS = 5;

/**
 * Sensor payload → UI rows: validate defensively, merge duplicate headers
 * (one incident often spans several lines), highest priority first, cap at 5.
 */
export function shapeDeviations(raw: unknown): ShapedDeviation[] {
  if (!Array.isArray(raw)) return [];
  const byHeader = new Map<string, { badges: Set<string>; priority: number }>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as RawDeviation;
    if (typeof rec.header !== 'string' || rec.header.length === 0) continue;
    const priority = typeof rec.priority === 'number' ? rec.priority : 0;
    const badges = Array.isArray(rec.lines)
      ? rec.lines
          .map((l) => (l && typeof l === 'object' ? (l as { designation?: unknown }).designation : null))
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
      : [];
    const existing = byHeader.get(rec.header);
    if (existing) {
      for (const b of badges) existing.badges.add(b);
      existing.priority = Math.max(existing.priority, priority);
    } else {
      byHeader.set(rec.header, { badges: new Set(badges), priority });
    }
  }
  return [...byHeader.entries()]
    .sort((a, b) => b[1].priority - a[1].priority)
    .slice(0, MAX_DEVIATIONS)
    .map(([header, v]) => ({ badges: [...v.badges].sort(), header }));
}
```

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run test/transit-model.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/transit-model.ts glass-cards/test/transit-model.test.ts
git commit -m "feat(hub): shapeDeviations — SL disturbance rows for the transit card"
```

---

### Task 13: SL deviations sensor (HA-side)

**Files:**
- Modify: `.claude/ha-rest-sensors.yaml`
- Modify (in pod): HA `/config/configuration.yaml`

**Interfaces:**
- Produces: `sensor.sl_storningar` — state = count of active monitored deviations; attribute `deviations` = slim list consumed by `shapeDeviations` (Task 12).

**Note (spec deviation, deliberate):** the spec put all filtering client-side, but SL's deviations endpoint returns a top-level JSON **array** (HA REST sensors can't attach attributes from arrays) and the unfiltered payload would bloat HA's recorder. So a `command_line` sensor fetches, filters to the monitored lines, slims the fields, and wraps in a dict. `shapeDeviations` still validates/dedupes client-side.

- [ ] **Step 1: Append to the mirror file**

Append to `.claude/ha-rest-sensors.yaml`:

```yaml
# SL deviations (störningar) for the wall-hub Hem transit card. SL's deviations
# API returns a top-level array, which HA REST sensors can't take attributes
# from — so a command_line sensor fetches, filters to the monitored lines
# (METRO 17/18/19, TRAIN 43, BUS 861), slims fields and wraps in a dict.
# Separate top-level key in configuration.yaml (NOT under rest:).
command_line:
  - sensor:
      name: "SL störningar"
      unique_id: sl_storningar
      scan_interval: 300
      command_timeout: 25
      command: >-
        python3 -c "import json,urllib.request;
        MON={('METRO','17'),('METRO','18'),('METRO','19'),('TRAIN','43'),('BUS','861')};
        d=json.load(urllib.request.urlopen('https://deviations.integration.sl.se/v1/messages?future=false&transport_mode=METRO&transport_mode=TRAIN&transport_mode=BUS',timeout=15));
        keep=[{'header':(m.get('message_variants') or [{}])[0].get('header'),'priority':(m.get('priority') or {}).get('importance_level'),'lines':[{'designation':str(l.get('designation')),'transport_mode':l.get('transport_mode')} for l in ((m.get('scope') or {}).get('lines') or []) if (l.get('transport_mode'),str(l.get('designation'))) in MON]} for m in d];
        keep=[k for k in keep if k['lines'] and k['header']];
        print(json.dumps({'count':len(keep),'deviations':keep}))"
      value_template: "{{ value_json.count }}"
      json_attributes:
        - deviations
```

- [ ] **Step 2: Test the command locally first**

```bash
python3 -c "import json,urllib.request;
MON={('METRO','17'),('METRO','18'),('METRO','19'),('TRAIN','43'),('BUS','861')};
d=json.load(urllib.request.urlopen('https://deviations.integration.sl.se/v1/messages?future=false&transport_mode=METRO&transport_mode=TRAIN&transport_mode=BUS',timeout=15));
keep=[{'header':(m.get('message_variants') or [{}])[0].get('header'),'priority':(m.get('priority') or {}).get('importance_level'),'lines':[{'designation':str(l.get('designation')),'transport_mode':l.get('transport_mode')} for l in ((m.get('scope') or {}).get('lines') or []) if (l.get('transport_mode'),str(l.get('designation'))) in MON]} for m in d];
keep=[k for k in keep if k['lines'] and k['header']];
print(json.dumps({'count':len(keep),'deviations':keep}, ensure_ascii=False)[:600])"
```

Expected: valid JSON `{"count": N, "deviations": [...]}` (N may be 0 on a calm day — verify the structure, not the count). If the API schema differs from `message_variants`/`scope.lines`, adjust the extraction here AND in the mirror before applying to the pod.

- [ ] **Step 3: Apply to the HA pod**

Append the same `command_line:` block to `/config/configuration.yaml`. If the file already has a `command_line:` key, merge under it instead — check first:

```bash
kubectl -n home-automation exec deploy/home-assistant -- grep -n '^command_line:' /config/configuration.yaml
```

If absent (expected), append via a heredoc-safe copy: pull, edit, push:

```bash
kubectl -n home-automation cp home-automation/$(kubectl -n home-automation get pod -l app.kubernetes.io/name=home-assistant -o jsonpath='{.items[0].metadata.name}'):config/configuration.yaml /tmp/ha-config.yaml 2>/dev/null \
  || kubectl -n home-automation exec deploy/home-assistant -- cat /config/configuration.yaml > /tmp/ha-config.yaml
# append the command_line block from .claude/ha-rest-sensors.yaml to /tmp/ha-config.yaml (exact YAML above)
kubectl -n home-automation exec -i deploy/home-assistant -- sh -c 'cat > /config/configuration.yaml' < /tmp/ha-config.yaml
```

- [ ] **Step 4: Validate + restart + verify**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/config/core/check_config | jq .result
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/services/homeassistant/restart
# wait ~2 min
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/sensor.sl_storningar | jq '{state, n: (.attributes.deviations | length)}'
```

Expected: `"valid"`; sensor exists with a numeric state and a `deviations` list (possibly empty).

- [ ] **Step 5: Commit**

```bash
git add .claude/ha-rest-sensors.yaml
git commit -m "chore(ha): sensor.sl_storningar — SL deviations for gröna linjen, 43, 861"
```

---

### Task 14: Transit card — störnings rows

**Files:**
- Modify: `glass-cards/src/hub/widgets/hub-transit-card.ts`

**Interfaces:**
- Consumes: `shapeDeviations` (Task 12); `config.disturbances_entity` (Task 1).
- Produces: coral alert strip at the bottom of the card; zero footprint when there are no deviations. Exactly 1 deviation → its row; ≥2 → one summary row (protects the fixed-height Hem band).

- [ ] **Step 1: Implement**

In `hub-transit-card.ts`:

1. Import: `import { filterBusDepartures, shapeDeviations, type SlDeparture } from '../transit-model.js';`
2. Styles (append):

```css
      .alerts {
        flex-shrink: 0;
        border-top: 1px solid var(--hub-coral-border);
        background: var(--hub-coral-bg);
        padding: 6px 18px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .badge {
        flex-shrink: 0;
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .alert-text {
        flex: 1;
        min-width: 0;
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-coral);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
```

3. Render helper:

```ts
  private _alerts() {
    const ent = this.config.disturbances_entity
      ? this.getEntity(this.config.disturbances_entity)
      : undefined;
    if (!ent || ent.state === 'unavailable' || ent.state === 'unknown') return nothing;
    const shaped = shapeDeviations(ent.attributes.deviations);
    if (shaped.length === 0) return nothing;

    if (shaped.length === 1) {
      const d = shaped[0];
      return html`<div class="alerts">
        <div class="alert">
          ${d.badges.map((b) => html`<span class="badge">${b}</span>`)}
          <span class="alert-text">${d.header}</span>
        </div>
      </div>`;
    }
    const badges = [...new Set(shaped.flatMap((d) => d.badges))].sort();
    return html`<div class="alerts">
      <div class="alert">
        ${badges.map((b) => html`<span class="badge">${b}</span>`)}
        <span class="alert-text">${shaped.length} störningar</span>
      </div>
    </div>`;
  }
```

Add `nothing` to the lit import: `import { html, css, nothing } from 'lit';`

4. In `render()`, add `${this._alerts()}` after the second `.row` div (inside `.card`).

- [ ] **Step 2: Build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-transit-card.ts
git commit -m "feat(hub): transit card shows SL störningar as coral alert rows"
```

---

### Task 15: Deploy + fit audit at 1280×800 + acceptance

**Files:**
- Possibly modify: page CSS files (only if the audit finds overflow — knobs listed below)

- [ ] **Step 1: Full test suite + build + deploy**

```bash
cd glass-cards
npx vitest run          # expected: ALL PASS
npm run build           # expected: dist/glass-cards.js rebuilt
./scripts/upload.sh     # kubectl cp bundle into HA pod
node scripts/deploy.mjs hub
```

- [ ] **Step 2: Fit audit**

Open `https://home.rutberg.dev/wall-hub/main?kiosk=true` in a browser window sized to **exactly 1280×800** (browser dev-tools responsive mode, or Playwright `browser_resize`). Remember the stale-service-worker caveat: hard-reload / bypass the SW so the new bundle is actually served.

For each page (Hem, Ljus, Media, Energi, Kcal, Vecka), check for vertical overflow by running in the console:

```js
const hub = document.querySelector('home-assistant').shadowRoot
  .querySelector('home-assistant-main').shadowRoot
  .querySelector('ha-drawer partial-panel-resolver ha-panel-lovelace').shadowRoot
  .querySelector('hui-root').shadowRoot
  .querySelector('hui-view')?.querySelector('glass-hub');
[...hub.shadowRoot.querySelectorAll('section.page')].map(s =>
  ({ id: s.dataset.pageId, overflow: s.scrollHeight - s.clientHeight }));
```

(If the HA DOM chain differs, locate `glass-hub` via `document.querySelector('home-assistant')` and successive shadowRoot hops.) Acceptance: `overflow <= 0` for every page.

- [ ] **Step 3: Fix any page that overflows**

Concrete knobs, in order of preference — apply only to offending pages, rebuild, redeploy, re-measure:

- **Ljus:** tile `min-height` 52→48; `.section` margin 16→12; tile gap 6→4.
- **Hem:** at ≤1400px the 2-col regime applies — reduce `.info` clamp to `clamp(96px, 12.5vh, 122px)` and `.bottom` to `clamp(80px, 10.5vh, 106px)`; page gap 10→8.
- **Energi:** `.chips` padding-bottom 44→36; header margin-bottom 8→4.
- **Kcal / Vecka / Media:** reduce the page's outer padding to `clamp(12px, 1.6vw, 20px)` and the largest inter-section gaps by 20 %.

- [ ] **Step 4: Interaction acceptance (manual, on the deployed hub)**

- Hem: tap a lit room → all its lights go off; tap again → only default lights come on; hold → popup with sliders + scene chips (Hall shows 6 chips); tap flash visible.
- Ljus: tap a light tile → toggles with flash; hold → slider popup, drag changes brightness; hold a section heading → room popup; "Allt släckt" still two-stage.
- Energi: toggle Spot/Allt-in changes bar heights + current price; choice survives reload; tap a bar → flyout with breakdown; second tap or 6 s closes it; Hem strip matches the chosen view.
- Störningar: `curl` the sensor — if 0 deviations, temporarily verify UI with a mocked state via HA dev-tools (Developer tools → States → set `sensor.sl_storningar` attributes `deviations: [{"header":"Test","priority":30,"lines":[{"designation":"19","transport_mode":"METRO"}]}]`) → coral row appears; clear it → row gone.

- [ ] **Step 5: Final commit**

```bash
git add -A glass-cards
git commit -m "feat(hub): wall-hub round 3 — fit audit fixes and deploy"
```

---

## Self-Review Notes

- Spec §1 → Task 15; §2 → Tasks 4, 5, 7; §3 → Tasks 2, 3, 6; §4 → Tasks 8–11; §5 → Tasks 12–14; §6 → Tasks 1, 9, 13, 15; §7 (tests) → Tasks 2, 8, 12 + Task 15 acceptance. Error-handling section → dead tiles (Task 4), missing `energy` fallback (Tasks 8, 10), SL sensor unavailable (Task 14).
- Deliberate spec deviation documented in Task 13 (server-side line filtering; reason: top-level-array limitation + recorder bloat).
- Type-consistency check: `roomTapPlan` (Tasks 2/3/7), `hub-light-open` detail `{entity, name}` (Tasks 4/5), `buildEnergyModel(attrs, state, now, view, gridAddOre)` (Tasks 8/10), `gridAddOre(cfg)` (Tasks 10/11), `shapeDeviations` slim shape (Tasks 12/13/14) — all matched.
