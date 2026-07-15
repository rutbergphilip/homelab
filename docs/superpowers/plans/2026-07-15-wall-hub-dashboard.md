# Wall Hub Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `glass-hub` wall-dashboard (5 swipe pages, dual themes) in the existing `glass-cards` package, plus Tibber/HomeKit-Bridge/kcal integration plumbing, verified visually with Claude for Chrome after every milestone.

**Architecture:** New `custom:glass-hub` Lit root card owns the viewport in a panel-mode Lovelace view; config-driven pages; token-based dual theme (Natt/Dag) switched by sun elevation. Data arrives exclusively as HA entities (Tibber integration, kcal REST sensors). kcal-assistant gains one read-only in-cluster endpoint guarded by a Cilium L7 rule.

**Tech Stack:** Lit 3 + TypeScript + Rollup (existing), vitest (new, logic tests only), Bun (kcal-assistant), Kubernetes/Flux/Cilium, HA 2025.12.

**Spec:** `docs/superpowers/specs/2026-07-15-wall-hub-dashboard-design.md` — read it first.
**Visual source of truth:** approved mockups at `.superpowers/brainstorm/51198-1784148570/content/visual-system.html` (both themes, exact colors/spacing) and `layout.html` (choice 3). Open them in a browser when implementing pages.

## Global Constraints

- Both themes always: every component styles ONLY via `--hub-*` tokens from `src/styles/tokens.ts`. No hardcoded colors in components.
- Domain colors only when active: amber=lights, teal=media, green=energy, lavender=kcal, coral=alerts. Inactive = neutral card tokens.
- Fonts: Outfit (display/numerals) + Inter (body), self-hosted from `/local/glass-cards/fonts/` — no CDN requests at runtime.
- Touch targets ≥ 48 px. Landscape-first: perfect at 1920×1200 and 1280×800.
- All UI text in Swedish (Hem, Ljus, Media, Energi, Kcal, Släckt, lampor …).
- Unavailable entities render quiet neutral states ("—"), never error styling.
- `glass-home` dashboard must remain untouched and working throughout.
- Frontend page tasks (5, 8, 10, 11, 14): invoke the `frontend-design:frontend-design` skill before writing markup, with the mockup files as reference.
- Every milestone ends with a Chrome verification pass (procedure at bottom, "Chrome verification procedure").
- Commit after every task. `npm run build` in `glass-cards/` must pass before any commit touching it.

---

## Milestone 1 — Foundation (tokens, themes, hub shell, Hem page)

### Task 1: Test infra + design tokens + fonts

**Files:**
- Modify: `glass-cards/package.json`
- Create: `glass-cards/src/styles/tokens.ts`
- Create: `glass-cards/test/tokens.test.ts`

**Interfaces:**
- Produces: `hubTokens: CSSResult` (a `css` block defining all `--hub-*` custom props under `:host([data-theme='natt'])` / `:host([data-theme='dag'])`), `FONT_FACE_CSS: string`, `ensureFonts(): void` (idempotent injection of font-face into `document.head`).

- [ ] **Step 1: Install dev deps**

```bash
cd ~/Development/homelab/glass-cards
npm i -D vitest @fontsource-variable/outfit @fontsource-variable/inter
```

- [ ] **Step 2: Add test script** — in `package.json` scripts add `"test": "vitest run"`.

- [ ] **Step 3: Write failing test** `test/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FONT_FACE_CSS, hubTokens } from '../src/styles/tokens';

describe('tokens', () => {
  it('defines both themes', () => {
    const cssText = hubTokens.cssText;
    expect(cssText).toContain("[data-theme='natt']");
    expect(cssText).toContain("[data-theme='dag']");
    // spec §2 anchor values
    expect(cssText).toContain('#0A0A0C');
    expect(cssText).toContain('#F3F0E9');
    expect(cssText).toContain('#F5B63C'); // amber (natt)
    expect(cssText).toContain('#63D6C2'); // teal (natt)
  });
  it('font css is CDN-free and self-hosted', () => {
    expect(FONT_FACE_CSS).toContain('/local/glass-cards/fonts/outfit-variable.woff2');
    expect(FONT_FACE_CSS).toContain('/local/glass-cards/fonts/inter-variable.woff2');
    expect(FONT_FACE_CSS).not.toContain('http');
  });
});
```

- [ ] **Step 4: Run** `npx vitest run` — expect FAIL (module not found).

- [ ] **Step 5: Implement** `src/styles/tokens.ts`:

```ts
import { css } from 'lit';

export const FONT_FACE_CSS = `
@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}
@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}
`;

export function ensureFonts(): void {
  if (document.getElementById('glass-hub-fonts')) return;
  const style = document.createElement('style');
  style.id = 'glass-hub-fonts';
  style.textContent = FONT_FACE_CSS;
  document.head.appendChild(style);
}

// Values are the approved mockup values — see spec §2. Do not invent new ones.
export const hubTokens = css`
  :host([data-theme='natt']) {
    --hub-surface: #0a0a0c;
    --hub-card: #131316;
    --hub-card-border: #202026;
    --hub-text: #f2f1ee;
    --hub-text-muted: #8b8a92;
    --hub-text-dim: #55555e;
    --hub-amber: #f5b63c;       --hub-amber-text: #f6d9a0;  --hub-amber-muted: #a08a5e;
    --hub-amber-bg: linear-gradient(160deg, rgba(245,182,60,.13), rgba(245,182,60,.04));
    --hub-amber-border: rgba(245,182,60,.25);
    --hub-amber-glow: 0 0 28px rgba(245,182,60,.07);
    --hub-teal: #63d6c2;        --hub-teal-text: #9fe8db;   --hub-teal-muted: #5f7f78;
    --hub-teal-bg: #101418;     --hub-teal-border: #1e2b31;
    --hub-green: #8edca8;       --hub-green-bg: rgba(110,220,160,.08); --hub-green-border: rgba(110,220,160,.18);
    --hub-lavender: #b99cf2;    --hub-lavender-text: #cdbbf0; --hub-lavender-muted: #7a6e92;
    --hub-lavender-bg: #141217; --hub-lavender-border: #262130;
    --hub-coral: #f2968c;       --hub-coral-bg: rgba(240,110,100,.12);
    --hub-chip-bg: #151519;     --hub-chip-border: #232329;
    --hub-track: #1e2b31;
    --hub-shadow: none;
  }
  :host([data-theme='dag']) {
    --hub-surface: #f3f0e9;
    --hub-card: #ffffff;
    --hub-card-border: #e8e3d8;
    --hub-text: #2a2823;
    --hub-text-muted: #8d877a;
    --hub-text-dim: #a9a395;
    --hub-amber: #f7be4f;       --hub-amber-text: #2a2823;  --hub-amber-muted: #8d877a;
    --hub-amber-bg: #ffffff;
    --hub-amber-border: #f0e4c8;
    --hub-amber-glow: 0 2px 12px rgba(165,115,27,.08);
    --hub-teal: #2e9b87;        --hub-teal-text: #1f6e60;   --hub-teal-muted: #8d877a;
    --hub-teal-bg: #ffffff;     --hub-teal-border: #e8e3d8;
    --hub-green: #3e7a4c;       --hub-green-bg: #e9f2e7;    --hub-green-border: #d2e4ce;
    --hub-lavender: #8b6dc7;    --hub-lavender-text: #6b4fa8; --hub-lavender-muted: #8d877a;
    --hub-lavender-bg: #ffffff; --hub-lavender-border: #e4ddf0;
    --hub-coral: #c65445;       --hub-coral-bg: #fbe7e3;
    --hub-chip-bg: #ffffff;     --hub-chip-border: #e8e3d8;
    --hub-track: #ede9de;
    --hub-shadow: 0 1px 6px rgba(60,50,30,.05);
  }
  :host {
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-fade: 600ms;
  }
`;
```

- [ ] **Step 6: Run tests + build** — `npx vitest run` PASS; `npm run build` PASS.
- [ ] **Step 7: Commit** — `git add -A glass-cards && git commit -m "feat(glass-hub): design tokens, dual themes, self-hosted fonts, vitest"`

### Task 2: Theme controller (TDD)

**Files:**
- Create: `glass-cards/src/hub/theme-controller.ts`
- Create: `glass-cards/test/theme-controller.test.ts`

**Interfaces:**
- Produces: `resolveTheme(sunElevation: number | null, override: ThemeOverride, dayElevation?: number): HubTheme`; `getStoredOverride(): ThemeOverride`; `setStoredOverride(v: ThemeOverride): void`; types `HubTheme = 'natt' | 'dag'`, `ThemeOverride = HubTheme | 'auto'`. Storage key: `glass-hub-theme`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTheme, getStoredOverride, setStoredOverride } from '../src/hub/theme-controller';

describe('resolveTheme', () => {
  it('follows sun when auto', () => {
    expect(resolveTheme(10, 'auto')).toBe('dag');
    expect(resolveTheme(1, 'auto')).toBe('natt');   // below default threshold 4
    expect(resolveTheme(-5, 'auto')).toBe('natt');
  });
  it('honors custom day elevation threshold', () => {
    expect(resolveTheme(5, 'auto', 8)).toBe('natt');
  });
  it('override wins over sun', () => {
    expect(resolveTheme(30, 'natt')).toBe('natt');
    expect(resolveTheme(-10, 'dag')).toBe('dag');
  });
  it('null elevation (sensor unavailable) → natt', () => {
    expect(resolveTheme(null, 'auto')).toBe('natt');
  });
});

describe('override storage', () => {
  beforeEach(() => localStorage.clear());
  it('defaults to auto and round-trips', () => {
    expect(getStoredOverride()).toBe('auto');
    setStoredOverride('dag');
    expect(getStoredOverride()).toBe('dag');
  });
  it('ignores garbage values', () => {
    localStorage.setItem('glass-hub-theme', 'banana');
    expect(getStoredOverride()).toBe('auto');
  });
});
```

Note: vitest needs a DOM for localStorage — add to `package.json`: `"test": "vitest run --environment jsdom"` and `npm i -D jsdom`.

- [ ] **Step 2: Run** — FAIL (module not found).
- [ ] **Step 3: Implement**

```ts
export type HubTheme = 'natt' | 'dag';
export type ThemeOverride = HubTheme | 'auto';

const KEY = 'glass-hub-theme';

export function resolveTheme(
  sunElevation: number | null,
  override: ThemeOverride,
  dayElevation = 4
): HubTheme {
  if (override !== 'auto') return override;
  if (sunElevation === null) return 'natt';
  return sunElevation > dayElevation ? 'dag' : 'natt';
}

export function getStoredOverride(): ThemeOverride {
  const v = localStorage.getItem(KEY);
  return v === 'natt' || v === 'dag' ? v : 'auto';
}

export function setStoredOverride(v: ThemeOverride): void {
  localStorage.setItem(KEY, v);
}
```

- [ ] **Step 4: Run tests + build** — PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(glass-hub): theme controller with sun-based auto switch"`

### Task 3: glass-hub shell — swipe engine, dots, idle timer

**Files:**
- Create: `glass-cards/src/hub/swipe.ts`, `glass-cards/src/hub/hub-config.ts`, `glass-cards/src/hub/glass-hub.ts`
- Create: `glass-cards/test/swipe.test.ts`
- Modify: `glass-cards/src/glass-cards.ts` (import + register `glass-hub`)

**Interfaces:**
- Produces: `settlePage(offsetPx, viewportW, velocityPxMs, current, pageCount): number`; `HubConfig` interface (below) consumed by ALL page tasks; `<glass-hub>` element with `hass` + `setConfig(HubConfig)`, page slots rendered from `this._config.pages` (default `['hem','ljus','media','energi','kcal']`), property `theme: HubTheme` reflected as `data-theme` attribute, method `goToPage(id: string)`.

```ts
// hub-config.ts — the single config contract for the whole hub
import type { LovelaceCardConfig } from '../types.js';

export interface HubRoomLight { entity: string; name: string; }
export interface HubRoom {
  id: string; name: string; icon: string;
  main_entity: string;              // toggled by room tile long-press
  lights: HubRoomLight[];
}
export interface HubConfig extends LovelaceCardConfig {
  pages?: string[];
  weather_entity: string;
  person_entity?: string;
  lights_count_entity?: string;
  vacuum_entity?: string;
  price_entity?: string;            // Tibber, wired in Task 9
  co2_entity?: string;
  fossil_entity?: string;
  departures?: { next_entity: string; list_entity: string; window?: { start: string; end: string } };
  rooms: HubRoom[];
  media_players: { entity: string; name: string }[];
  kcal?: { today_entity: string; forecast_entity: string };
  scenes?: { entity: string; name: string; icon: string }[];
  idle_return_s?: number;           // default 120
  day_elevation?: number;           // default 4
}
```

- [ ] **Step 1: Failing swipe tests** `test/swipe.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { settlePage } from '../src/hub/swipe';

describe('settlePage', () => {
  const W = 1000;
  it('stays under threshold', () => expect(settlePage(-100, W, 0, 1, 5)).toBe(1));
  it('advances past 20% drag', () => expect(settlePage(-250, W, 0, 1, 5)).toBe(2));
  it('goes back past 20% drag', () => expect(settlePage(250, W, 0, 1, 5)).toBe(0));
  it('fast flick advances regardless of distance', () => expect(settlePage(-40, W, -0.8, 1, 5)).toBe(2));
  it('clamps at ends', () => {
    expect(settlePage(400, W, 0, 0, 5)).toBe(0);
    expect(settlePage(-400, W, 0, 4, 5)).toBe(4);
  });
});
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement `swipe.ts`:**

```ts
export function settlePage(
  offsetPx: number, viewportW: number, velocityPxMs: number,
  current: number, pageCount: number
): number {
  const threshold = viewportW * 0.2;
  const flick = Math.abs(velocityPxMs) > 0.5;
  let target = current;
  if (offsetPx < -threshold || (flick && velocityPxMs < -0.5)) target = current + 1;
  else if (offsetPx > threshold || (flick && velocityPxMs > 0.5)) target = current - 1;
  return Math.max(0, Math.min(pageCount - 1, target));
}
```

- [ ] **Step 4: Implement `glass-hub.ts`.** Structure (complete the obvious Lit plumbing; behaviors are normative):

```ts
import { html, css, type PropertyValues } from 'lit';
import { state } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import { hubTokens, ensureFonts } from '../styles/tokens.js';
import { resolveTheme, getStoredOverride, setStoredOverride, type ThemeOverride, type HubTheme } from './theme-controller.js';
import { settlePage } from './swipe.js';
import type { HubConfig } from './hub-config.js';

const DEFAULT_PAGES = ['hem', 'ljus', 'media', 'energi', 'kcal'];

export class GlassHub extends GlassBaseElement {
  @state() private _page = 0;
  @state() private _dragX = 0;
  @state() private _theme: HubTheme = 'natt';
  private _override: ThemeOverride = getStoredOverride();
  private _idleTimer?: number;
  // pointer tracking: pointerdown records x/t; pointermove sets _dragX;
  // pointerup computes velocity = dx/dt and calls settlePage(...)
}
customElements.define('glass-hub', GlassHub);
```

Normative behaviors:
1. `connectedCallback`: `ensureFonts()`; compute theme from `sun.sun` attribute `elevation` (number) via `resolveTheme`; set `data-theme` attr on host; re-evaluate on every `hass` update (elevation changes slowly — cheap).
2. Theme toggle button (top-right, 48×48, sun/moon glyph) cycles auto → dag → natt → auto; persists via `setStoredOverride`; theme change applies `transition: background 600ms` on the page container — input stays interactive during fade (no overlay).
3. Page strip: `display:flex; width: calc(100% * pageCount)`, transform `translateX(calc(-${page} * 100% / pageCount + ${_dragX}px))`; `transition: transform 320ms cubic-bezier(.3,.7,.3,1)` except while dragging.
4. Dot nav: fixed bottom-center, one 6px dot per page, active dot uses `--hub-text`, inactive `--hub-text-dim`; each dot is a 48×48 hit area; click = `goToPage`.
5. Idle return: any `pointerdown` resets a timer of `idle_return_s ?? 120` seconds; on fire, animate back to page 0. Never fires while already on page 0.
6. Pages render as `<section class="page" data-page-id="hem">…` — Task 3 renders placeholder `<h1>` titles; page components replace them in later tasks.
7. Host styles include `hubTokens`; host is `position:absolute; inset:0; overflow:hidden; background:var(--hub-surface); font-family:var(--hub-font-body);` (panel view fills viewport).
8. Register in `glass-cards.ts`: `import './hub/glass-hub.js';` + `customCards.push({ type: 'glass-hub', name: 'Glass Hub', description: 'Full-screen wall hub' })`.

- [ ] **Step 5:** `npx vitest run` PASS; `npm run build` PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(glass-hub): hub shell with swipe engine, dot nav, idle return, theme switch"`

### Task 4: Hem widgets — clock, status chip, room tile

**Files:**
- Create: `glass-cards/src/hub/widgets/hub-clock.ts`, `hub-status-chip.ts`, `hub-room-tile.ts`
- Create: `glass-cards/src/hub/widgets/departure-window.ts` + `glass-cards/test/departure-window.test.ts`

**Interfaces:**
- Produces:
  - `<hub-clock>` — props `hass`, `weatherEntity: string`. Renders `HH:MM` (Outfit 200, `clamp(56px, 7vw, 96px)`, letter-spacing −2px) + date line `Tisdag 15 juli · Klart 18°` (Swedish via `Intl.DateTimeFormat('sv-SE', {weekday:'long', day:'numeric', month:'long'})`, capitalized first letter; weather state translated by `hass.formatEntityState`). Updates via 30 s interval; interval cleared on disconnect.
  - `<hub-status-chip>` — props `icon: string` (inline SVG name from a small map: `lamp|bolt|home|vacuum|train`), `label: string`, `tone: 'amber'|'green'|'teal'|'lavender'|'coral'|'neutral'`, `active: boolean`. Pill: `padding:10px 16px; border-radius:var(--hub-radius-pill); font:500 13px var(--hub-font-body);` Active+tone → tone bg/border/text tokens; inactive → `--hub-chip-bg/--hub-chip-border/--hub-text-muted`.
  - `<hub-room-tile>` — props `hass`, `room: HubRoom`. Shows icon chip, room name, subtitle (`3 lampor · 40 %` — count of lights with state `on`, brightness of `main_entity` as %; `Släckt` when none on). Active (any light on) → amber treatment (`--hub-amber-bg/border/glow`, icon chip solid `--hub-amber`); inactive → neutral. Tap dispatches `hub-room-open` CustomEvent `{detail:{roomId}}` (bubbles, composed). Long-press (500 ms) toggles `main_entity`.
  - `inDepartureWindow(now: Date, start?: string, end?: string): boolean` — weekdays only, default 06:30–09:30 (spec §3).

- [ ] **Step 1: Failing test** `test/departure-window.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { inDepartureWindow } from '../src/hub/widgets/departure-window';

const d = (s: string) => new Date(s);
describe('inDepartureWindow', () => {
  it('true weekday morning', () => expect(inDepartureWindow(d('2026-07-15T07:30:00'))).toBe(true)); // Wed
  it('false weekday evening', () => expect(inDepartureWindow(d('2026-07-15T18:00:00'))).toBe(false));
  it('false weekend morning', () => expect(inDepartureWindow(d('2026-07-18T07:30:00'))).toBe(false)); // Sat
  it('honors custom window', () => expect(inDepartureWindow(d('2026-07-15T10:00:00'), '09:00', '11:00')).toBe(true));
  it('boundary inclusive', () => expect(inDepartureWindow(d('2026-07-15T06:30:00'))).toBe(true));
});
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement:**

```ts
export function inDepartureWindow(now: Date, start = '06:30', end = '09:30'): boolean {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toM = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  return mins >= toM(start) && mins <= toM(end);
}
```

- [ ] **Step 4: Implement the three widgets** per the interface block above. Match the mockup exactly (open `visual-system.html`). All styling through tokens; include `hubTokens` in each widget's static styles. Icons: define `src/hub/widgets/icons.ts` exporting a `Record<string, ReturnType<typeof svg>>` with 8–10 minimal 24×24 stroke SVGs (lamp, bolt, home, vacuum, train, note, sun, moon, play, pause) — no external icon font on these new widgets.
- [ ] **Step 5:** tests + build PASS. **Step 6: Commit** — `feat(glass-hub): clock, status chip, room tile widgets`

### Task 5: Hem page + re-skinned popup/light-slider

**Files:**
- Create: `glass-cards/src/hub/pages/hub-home-page.ts`, `glass-cards/src/hub/widgets/hub-now-playing.ts`, `glass-cards/src/hub/widgets/hub-kcal-ring.ts`, `glass-cards/src/hub/widgets/hub-room-popup.ts`
- Modify: `glass-cards/src/hub/glass-hub.ts` (render real Hem page + popup host)

**Interfaces:**
- Consumes: `HubConfig`, all Task 4 widgets, `settlePage` untouched.
- Produces:
  - `<hub-home-page>` — props `hass`, `config: HubConfig`. Layout (from mockup): top row = `hub-clock` left, chips right (lights count amber-when->0, price green placeholder "— öre" until Task 10 wires `price_entity`, person neutral, vacuum chip only when state ≠ `docked`, departures chip only when `inDepartureWindow(new Date(), …config.departures.window)`); middle = responsive room grid `repeat(3, 1fr)` (2 cols below 1400px); bottom row = `hub-now-playing` (flex 2) + `hub-kcal-ring` (flex 1).
  - `<hub-now-playing>` — props `hass`, `players: {entity,name}[]`. Shows first playing player (fallback: first non-off, else idle state "Ingenting spelas" dimmed). Art from `entity_picture` attr (40×40 rounded), title/artist from `media_title`/`media_artist`, thin progress bar (`media_position`/`media_duration`, advanced client-side from `media_position_updated_at`), play/pause button 48×48 calling `media_player.media_play_pause`. Teal treatment when playing. Tap on body dispatches `hub-goto-page {detail:{page:'media'}}`.
  - `<hub-kcal-ring>` — props `hass`, `todayEntity?: string`. Conic-gradient ring (`--hub-lavender` on `--hub-track`), center-masked; value/target from sensor state + `kcal_target` attr; subtitle `112 g protein · i fas ✓`. When entity missing/`unavailable`: ring at 0, text "Kcal · offline" in `--hub-text-dim` (spec §6). Tap → `hub-goto-page {page:'kcal'}`.
  - `<hub-room-popup>` — props `hass`, `room: HubRoom | null`. Modal overlay (frosted: `backdrop-filter: blur(20px)`, scrim `rgba(0,0,0,.4)` natt / `rgba(40,35,25,.25)` dag), card centered max-width 520px listing one row per light: name + existing `glass-light-slider` re-skinned. Close on scrim tap or × (48×48). Renders when `room` set.
- Re-skin `src/cards/glass-light-slider.ts`: replace hardcoded `--glass-*` colors with `--hub-*` equivalents **with fallbacks** (`var(--hub-amber, #4FC3F7)` pattern) so glass-home keeps working unchanged.

- [ ] **Step 1:** Invoke `frontend-design:frontend-design` skill; build the four components against the mockup.
- [ ] **Step 2:** Wire into `glass-hub.ts`: Hem placeholder → `<hub-home-page .hass=… .config=…>`; listen for `hub-room-open` → set `_openRoom`, render `<hub-room-popup>`; listen for `hub-goto-page` → `goToPage(detail.page)`.
- [ ] **Step 3:** `npx vitest run` + `npm run build` PASS.
- [ ] **Step 4: Commit** — `feat(glass-hub): Hem page — clock, chips, room grid, now playing, kcal ring, room popup`

### Task 6: Deploy pipeline + Chrome verification pass 1

**Files:**
- Modify: `glass-cards/scripts/deploy.mjs`
- Create: `glass-cards/scripts/hub-config.mjs`, `glass-cards/scripts/upload.sh`

**Interfaces:**
- Produces: `node scripts/deploy.mjs hub` (new) and `node scripts/deploy.mjs` (legacy glass-home, unchanged behavior); `./scripts/upload.sh` copies bundle + fonts into the HA pod.

- [ ] **Step 1: `hub-config.mjs`** — export the dashboard config:

```js
export const hubDashboard = {
  url_path: 'hub',
  title: 'Hub',
  icon: 'mdi:view-dashboard',
  config: {
    title: 'Hub',
    views: [{
      title: 'Hub', type: 'panel', path: 'main',
      cards: [{
        type: 'custom:glass-hub',
        weather_entity: 'weather.forecast_home',
        person_entity: 'person.philip_rutberg',
        lights_count_entity: 'sensor.lights_on_count',
        vacuum_entity: 'vacuum.roborock_s8',
        co2_entity: 'sensor.electricity_maps_co2_intensitet',
        fossil_entity: 'sensor.electricity_maps_procent_fossila_branslen_i_elnatet',
        departures: { next_entity: 'sensor.avgangar_next_departure', list_entity: 'sensor.avgangar_departures' },
        media_players: [
          { entity: 'media_player.arc_sub', name: 'Vardagsrum (Arc)' },
          { entity: 'media_player.kitchen', name: 'Kök' },
          { entity: 'media_player.bedroom', name: 'Sovrum' },
        ],
        rooms: [
          { id: 'vardagsrum', name: 'Vardagsrum', icon: 'sofa', main_entity: 'light.vardagsrum',
            lights: [ { entity: 'light.vardagsrum', name: 'Taklampa' }, { entity: 'light.tv', name: 'TV-lampa' } ] },
          { id: 'kok', name: 'Kök', icon: 'pot', main_entity: 'light.kok',
            lights: [ { entity: 'light.kok', name: 'Taklampa' }, { entity: 'light.tak_1', name: 'Tak 1' },
                      { entity: 'light.tak_2', name: 'Tak 2' }, { entity: 'light.slinga', name: 'Slinga' },
                      { entity: 'light.koksfonstret', name: 'Köksfönstret' } ] },
          { id: 'sovrum', name: 'Sovrum', icon: 'bed', main_entity: 'light.sovrum',
            lights: [ { entity: 'light.sovrum', name: 'Taklampa' }, { entity: 'light.lightstrip', name: 'Lightstrip' },
                      { entity: 'light.sovrumsfonstret', name: 'Fönsterlampa' }, { entity: 'light.spot_1', name: 'Spot 1' },
                      { entity: 'light.spot_2', name: 'Spot 2' }, { entity: 'light.spot_3', name: 'Spot 3' } ] },
          { id: 'hall', name: 'Hall', icon: 'door', main_entity: 'light.hall',
            lights: [ { entity: 'light.hall', name: 'Taklampa' }, { entity: 'light.hall_spot_1', name: 'Spot 1' },
                      { entity: 'light.hall_spot_2', name: 'Spot 2' }, { entity: 'light.hall_spot_3', name: 'Spot 3' } ] },
          { id: 'office', name: 'Office', icon: 'desk', main_entity: 'light.office',
            lights: [ { entity: 'light.office', name: 'Office' } ] },
          { id: 'badrum', name: 'Badrum', icon: 'shower', main_entity: 'light.badrum',
            lights: [ { entity: 'light.badrum', name: 'Taklampa' }, { entity: 'light.spotlight_top', name: 'Spotlight' } ] },
        ],
      }],
    }],
  },
};
```

(Add `sofa|pot|bed|door|desk|shower` to `icons.ts` if not present.)

- [ ] **Step 2: `deploy.mjs`** — accept `process.argv[2] === 'hub'`: reuse the existing auth + resource-registration code (shared function), then create/update dashboard `hub` from `hub-config.mjs` via `lovelace/dashboards/create` + `lovelace/config/save` (same message types as glass-home path). Legacy no-arg path stays byte-identical in behavior.
- [ ] **Step 3: `upload.sh`:**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
POD=$(kubectl -n home-automation get pod -l app=home-assistant -o jsonpath='{.items[0].metadata.name}')
kubectl -n home-automation exec "$POD" -c home-assistant -- mkdir -p /config/www/glass-cards/fonts
kubectl cp dist/glass-cards.js "home-automation/$POD:/config/www/glass-cards/glass-cards.js" -c home-assistant
kubectl cp node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2 \
  "home-automation/$POD:/config/www/glass-cards/fonts/outfit-variable.woff2" -c home-assistant
kubectl cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 \
  "home-automation/$POD:/config/www/glass-cards/fonts/inter-variable.woff2" -c home-assistant
echo "Uploaded bundle + fonts to $POD"
```

- [ ] **Step 4: Deploy** — `npm run build && ./scripts/upload.sh && node scripts/deploy.mjs hub`. Expected output ends `Visit: https://home.rutberg.dev/hub/main`.
- [ ] **Step 5: Chrome verification pass 1** (procedure at bottom). Scope: Hem page only — both themes, both resolutions; clock ticks; room popup opens/slides; swipe to placeholder pages and back; dots + idle return work; fonts render as Outfit/Inter (check computed style); zero console errors. Verify `glass-home` dashboard still loads.
- [ ] **Step 6: Fix findings, redeploy, re-verify. Commit** — `feat(glass-hub): hub deploy target + fonts upload; Hem verified`

---

## Milestone 2 — Ljus

### Task 7: Hue scene & naming audit

**Files:**
- Create: `docs/hue-audit.md`
- Modify: `glass-cards/scripts/hub-config.mjs` (add `scenes:` once confirmed)

- [ ] **Step 1: Dump current state:**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states \
  | jq -r '.[] | select(.entity_id|startswith("scene.")) | [.entity_id, .attributes.friendly_name] | @tsv'
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states \
  | jq -r '.[] | select(.entity_id|startswith("light.")) | [.entity_id, .attributes.friendly_name] | @tsv'
```

- [ ] **Step 2:** Write `docs/hue-audit.md`: table of lights (entity / HA name / room), table of scenes (entity / scope). Flag mismatches between HA names and the room mapping in `hub-config.mjs`.
- [ ] **Step 3:** Decide the three whole-home scenes (spec §5): `Kvällsläge`, `Film`, `Allt släckt`. `Allt släckt` is a service call (`light.turn_off`, `entity_id: all`), not a scene. For `Kvällsläge`/`Film`: if matching Hue scenes exist, record their `scene.*` ids; if not, **ask Philip to create them in the Hue app** (so they exist identically in HomeKit) — this is a user step; pause the task until done, then re-run the dump.
- [ ] **Step 4:** Add to `hub-config.mjs`: `scenes: [{ entity: 'scene.<confirmed-id>', name: 'Kvällsläge', icon: 'moon' }, { entity: 'scene.<confirmed-id>', name: 'Film', icon: 'play' }]` — ids come from Step 3's dump; do not guess.
- [ ] **Step 5: Commit** — `docs: hue naming/scene audit + hub scene config`

### Task 8: Ljus page + Chrome pass 2

**Files:**
- Create: `glass-cards/src/hub/pages/hub-lights-page.ts`
- Modify: `glass-cards/src/hub/glass-hub.ts` (mount page)

**Interfaces:**
- Consumes: `HubConfig.rooms`, `HubConfig.scenes`, re-skinned `glass-light-slider`, `hub-status-chip`.
- Produces: `<hub-lights-page>` props `hass`, `config`. Layout: header row = page title `Ljus` (Outfit 300, 28px) + whole-home actions right (pill buttons: `Allt släckt` → `light.turn_off` all; one pill per `config.scenes` → `scene.turn_on`); body = 2-col grid of room cards, each card: room name, per-light row with inline `glass-light-slider` (48px row height), room scene chips if Hue exposes per-room scenes (from Task 7 audit — only include if confirmed). Amber-dominant page: active sliders/cards use amber tokens.

- [ ] **Step 1:** Invoke frontend-design skill; implement page per interface. Whole-home action pills need a pressed→confirmation state (200 ms scale + tone flash) — no accidental all-off: `Allt släckt` requires a second tap within 3 s (`Säker? Tryck igen`).
- [ ] **Step 2:** Mount in `glass-hub.ts` (replace `ljus` placeholder).
- [ ] **Step 3:** Build + deploy (`npm run build && ./scripts/upload.sh && node scripts/deploy.mjs hub`).
- [ ] **Step 4: Chrome pass 2** — Ljus page in both themes/resolutions: sliders drag and update real lights (pick one light, verify state change via `curl .../api/states/light.office`), scene pills fire, double-tap guard works, console clean. **Revert any lights you toggled.**
- [ ] **Step 5: Commit** — `feat(glass-hub): Ljus page with per-light sliders and whole-home actions`

---

## Milestone 3 — Energi

### Task 9: Tibber integration + fixture capture

**Files:**
- Create: `glass-cards/test/fixtures/tibber-price.json`

- [ ] **Step 1 (user step):** Philip fetches API token at https://developer.tibber.com/settings/access-token. Add integration: HA → Settings → Devices & Services → Add Integration → Tibber → paste token. (Claude can drive this via Chrome with Philip pasting the token, or Philip does it — his choice at execution time.)
- [ ] **Step 2:** Verify entities exist:

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states \
  | jq '[.[] | select(.entity_id | test("tibber|electricity_price"))] | map(.entity_id)'
```

- [ ] **Step 3:** Capture the **full price sensor object** into the fixture (this locks the attribute shape the transform is written against — Tibber's hourly-price attribute layout must be observed, not assumed):

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" \
  "https://home.rutberg.dev/api/states/<price-entity-from-step-2>" \
  | jq . > glass-cards/test/fixtures/tibber-price.json
```

- [ ] **Step 4:** Set `price_entity` in `hub-config.mjs` to the real entity id. Commit — `feat(energi): tibber integration live + price fixture`

### Task 10: Price transform (TDD) + Energi page + Chrome pass 3

**Files:**
- Create: `glass-cards/src/hub/energy-model.ts`, `glass-cards/test/energy-model.test.ts`
- Create: `glass-cards/src/hub/pages/hub-energy-page.ts`, `glass-cards/src/hub/widgets/hub-price-chart.ts`
- Modify: `glass-cards/src/hub/glass-hub.ts`, `glass-cards/src/hub/pages/hub-home-page.ts` (wire real price chip)

**Interfaces:**
- Produces:

```ts
export interface HourPrice { start: Date; ore: number; }   // öre/kWh
export interface EnergyModel {
  now: HourPrice | null;
  level: 'låg' | 'normal' | 'hög';       // vs trailing today-average: <0.85 låg, >1.15 hög
  today: HourPrice[];                     // 24 entries
  tomorrow: HourPrice[];                  // empty until published (spec §6)
  cheapestWindow: { start: Date; end: Date } | null;  // cheapest contiguous 3h in the future
}
export function buildEnergyModel(attrs: Record<string, unknown>, state: string, now: Date): EnergyModel;
```

- `<hub-price-chart>` — props `model: EnergyModel`. 24–48 bar chart, bar color: past hours `--hub-text-dim` at 30% opacity, current hour `--hub-green` solid + label, future `--hub-track` with green tint scaled to cheapness; cheapest-window bars outlined. Tomorrow appears right of a divider once present.
- `<hub-energy-page>` — props `hass`, `config`. Header: `142 öre` huge (Outfit 200, 72px, green when level=`låg`, coral when `hög`) + `öre/kWh just nu · lågt`; chart center; bottom chips: CO₂ (`co2_entity`), fossil % (`fossil_entity`), cheapest window (`Billigast 13–16`).

- [ ] **Step 1: Failing tests** against the captured fixture:

```ts
import { describe, it, expect } from 'vitest';
import { buildEnergyModel } from '../src/hub/energy-model';
import fixture from './fixtures/tibber-price.json';

describe('buildEnergyModel', () => {
  const m = buildEnergyModel(fixture.attributes, fixture.state, new Date(/* an hour that exists in the fixture */));
  it('parses current price in öre', () => expect(m.now?.ore).toBeGreaterThan(0));
  it('has 24 hours today', () => expect(m.today.length).toBe(24));
  it('classifies level', () => expect(['låg', 'normal', 'hög']).toContain(m.level));
  it('cheapest window is 3h contiguous and in the future', () => { /* assert against fixture values */ });
  it('empty tomorrow tolerated', () => expect(Array.isArray(m.tomorrow)).toBe(true));
});
```

Write exact expected numbers from the fixture once captured (Task 9 gates this task).

- [ ] **Step 2:** Run — FAIL. **Step 3:** Implement `buildEnergyModel` against the observed attribute layout (Tibber exposes prices in SEK/kWh → multiply by 100 for öre). Handle: missing tomorrow, `state: unavailable` → all-empty model.
- [ ] **Step 4:** Invoke frontend-design skill; implement chart + page. Wire Hem's price chip: state × 100 rounded + `· lågt/högt` from model level, green tone when låg, coral when hög, neutral otherwise.
- [ ] **Step 5:** Tests + build; deploy; **Chrome pass 3** — Energi both themes/resolutions, bar chart sane vs Tibber app numbers, Hem chip live, console clean.
- [ ] **Step 6: Commit** — `feat(glass-hub): Energi page with Tibber price chart and cheapest-window hint`

---

## Milestone 4 — Media

### Task 11: Media page + Chrome pass 4

**Files:**
- Create: `glass-cards/src/hub/pages/hub-media-page.ts`, `glass-cards/src/hub/widgets/hub-volume-row.ts`, `glass-cards/src/hub/ambient-color.ts`, `glass-cards/test/ambient-color.test.ts`
- Modify: `glass-cards/src/hub/glass-hub.ts`

**Interfaces:**
- Produces:

```ts
// ambient-color.ts — dominant color from album art for background bleed
export async function dominantColor(imgUrl: string): Promise<[number, number, number] | null>;
// draws image onto an 8×8 canvas (crossOrigin='anonymous' won't work for
// hass-proxied art; entity_picture URLs are same-origin — /api/media_player_proxy/…
// — so canvas readback is allowed), averages pixels, returns [r,g,b]; null on any error.
export function bleedGradient(rgb: [number, number, number] | null, theme: 'natt' | 'dag'): string;
// natt: `radial-gradient(80% 60% at 30% 20%, rgba(r,g,b,.22), transparent 70%)`
// dag:  same at .12 opacity. rgb null → 'none'.
```

- `<hub-media-page>` — props `hass`, `config`. Selected player (default: playing one, tabs to switch between `config.media_players`): album art large (min(38vh, 340px), radius 20, shadow), title (Outfit 400 26px) / artist (muted), progress bar with elapsed/total, transport row (prev 48px, play/pause 64px teal-filled when playing, next 48px) calling `media_player.media_previous_track|media_play_pause|media_next_track`. Page background layers `bleedGradient` behind content, recomputed on `entity_picture` change. Below: one `<hub-volume-row>` per player.
- `<hub-volume-row>` — props `hass`, `player: {entity,name}`, `groupMaster: string | null`. Name, horizontal volume slider (`media_player.volume_set`, 0–1, step .01, 48px hit height), and a group toggle chip: if entity is in the master's `group_members` attr → chip `I gruppen` active-teal, tap = `media_player.unjoin`; else chip `Gruppera`, tap = `media_player.join` with `{ group_members: [entity] }` on the master. Master = the currently playing player; chip hidden on the master itself.

- [ ] **Step 1: Failing test** for `bleedGradient` (pure): rgb `[100,50,200]` natt → string contains `rgba(100, 50, 200, 0.22)`; null → `'none'`; dag opacity `0.12`.
- [ ] **Step 2:** Run — FAIL. **Step 3:** Implement both functions.
- [ ] **Step 4:** Invoke frontend-design skill; implement page + volume row.
- [ ] **Step 5:** Tests + build; deploy; **Chrome pass 4** — play something on a Sonos speaker first (ask Philip or use `media_player.media_play` on a queued player); verify art bleed, transport controls actually control playback, volume slider moves real volume (then restore), grouping joins/unjoins Kitchen to Arc (then restore), both themes. Console clean.
- [ ] **Step 6: Commit** — `feat(glass-hub): Media page with ambient art bleed, transport, volume, grouping`

---

## Milestone 5 — Kcal

### Task 12: kcal-assistant `/internal/summary` endpoint (TDD) + release

**Files:**
- Create: `kcal-assistant/src/ui/internal.ts`, `kcal-assistant/tests/internal-summary.test.ts`
- Modify: `kcal-assistant/src/server.ts`, `kcal-assistant/package.json` (version → 0.10.0)
- Modify: `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml` (image tag)

**Interfaces:**
- Produces: `GET /internal/summary` (no auth — network-layer protected in Task 13) returning exactly:

```json
{
  "status": "ok",
  "date": "2026-07-15",
  "kcal": 1620, "kcal_target": 2200,
  "protein_g": 112, "protein_target_g": 140,
  "meals": [{ "name": "Lunch — kycklingbowl", "kcal": 640 }],
  "current_kg": 81.4,
  "weight_trend": [{ "date": "2026-07-01", "kg": 82.1 }],
  "forecast": { "goal_kg": 78.0, "eta": "2026-10-02", "eta_early": "2026-09-18", "eta_late": "2026-10-20", "on_track": true }
}
```

All numbers rounded to 1 decimal (kcal to integer). Fields map from existing read functions (same ones `ui/api.ts` uses): `readDay(db)` → kcal/protein/meals; `getTargets(db)` → targets; `getTrend(db, 28)` → current_kg + weight_trend (28 days); `buildForecast(db, { intake_source: 'targets' })` → forecast (map its ETA/interval fields; exact source field names are visible in `src/db/forecast.ts` — keep `eta_early`/`eta_late` as the output names). Empty DB → zeros/empty arrays/`forecast: null`, still `status: "ok"`.

- [ ] **Step 1: Failing test** `tests/internal-summary.test.ts` (mirror the setup pattern of `tests/ui-api.test.ts` — in-memory DB + seeded meals/weights):

```ts
import { describe, it, expect } from "bun:test";
import { buildInternalSummary } from "../src/ui/internal";
// + the same test-db bootstrap used in tests/ui-api.test.ts

describe("buildInternalSummary", () => {
  it("returns the full summary shape", () => {
    const s = buildInternalSummary(db); // db seeded like ui-api.test.ts does
    expect(s.status).toBe("ok");
    expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof s.kcal).toBe("number");
    expect(typeof s.kcal_target).toBe("number");
    expect(Array.isArray(s.meals)).toBe(true);
    expect(Array.isArray(s.weight_trend)).toBe(true);
    expect(s.forecast === null || typeof s.forecast.goal_kg === "number").toBe(true);
  });
  it("empty db → zeros, not errors", () => {
    const s = buildInternalSummary(emptyDb);
    expect(s.kcal).toBe(0);
    expect(s.meals).toEqual([]);
    expect(s.forecast).toBeNull();
  });
});
```

- [ ] **Step 2:** `bun test tests/internal-summary.test.ts` — FAIL. **Step 3:** Implement `src/ui/internal.ts` per the interface. **Step 4:** Route in `server.ts` — insert **before** the `/ui` block:

```ts
if (pathname === "/internal/summary") {
  if (req.method !== "GET") { res.writeHead(405, { allow: "GET" }).end(); return; }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" })
     .end(JSON.stringify(buildInternalSummary(opts.db)));
  return;
}
```

Add a server-level test in the style of `tests/server.test.ts`: GET → 200 + `status: "ok"`; POST → 405; and `/ui` routes still require auth.

- [ ] **Step 5:** `bun test` — full suite PASS.
- [ ] **Step 6: Release:** bump `package.json` to 0.10.0; `docker build -t rutbergphilip/kcal-assistant:v0.10.0 . && docker push rutbergphilip/kcal-assistant:v0.10.0`; update `deployment.yaml` image tag to `v0.10.0`.
- [ ] **Step 7: Commit + reconcile** — `git add -A kcal-assistant kubernetes && git commit -m "feat(kcal-assistant): v0.10.0 — internal summary endpoint for wall hub" && git push && task reconcile`. Verify rollout: `kubectl -n home-automation rollout status deploy/kcal-assistant`.

### Task 13: Cilium L7 rule + HA REST sensors

**Files:**
- Modify: `kubernetes/apps/home-automation/kcal-assistant/networkpolicy.yaml`
- Create: `.claude/ha-rest-sensors.yaml` (copy of the block added to HA's configuration.yaml, mirroring the existing `.claude/ha-template-sensors.yaml` convention)

- [ ] **Step 1: Netpol** — append a third ingress rule (L7: HA pod, GET /internal/summary only — spec §5):

```yaml
    - fromEndpoints:
        - matchLabels:
            k8s:io.kubernetes.pod.namespace: home-automation
            app: home-assistant
      toPorts:
        - ports:
            - port: "3000"
              protocol: TCP
          rules:
            http:
              - method: "GET"
                path: "/internal/summary"
```

Commit + push + `task reconcile`.

- [ ] **Step 2: Verify enforcement from inside the HA pod:**

```bash
POD=$(kubectl -n home-automation get pod -l app=home-assistant -o jsonpath='{.items[0].metadata.name}')
kubectl -n home-automation exec "$POD" -c home-assistant -- \
  python3 -c "import urllib.request;print(urllib.request.urlopen('http://kcal-assistant.home-automation.svc.cluster.local:3000/internal/summary').read()[:200])"
# expect JSON with "status": "ok"
kubectl -n home-automation exec "$POD" -c home-assistant -- \
  python3 -c "import urllib.request;print(urllib.request.urlopen('http://kcal-assistant.home-automation.svc.cluster.local:3000/ui').status)" \
  && echo "SECURITY FAIL: /ui reachable" || echo "OK: /ui blocked"
```

- [ ] **Step 3: REST sensors** — append to HA's `/config/configuration.yaml` (edit via `kubectl exec` into the pod; keep the identical block in `.claude/ha-rest-sensors.yaml`):

```yaml
rest:
  - resource: http://kcal-assistant.home-automation.svc.cluster.local:3000/internal/summary
    scan_interval: 300
    timeout: 10
    sensor:
      - name: "Kcal idag"
        unique_id: kcal_today
        unit_of_measurement: kcal
        value_template: "{{ value_json.kcal | round(0) }}"
        availability: "{{ value_json is defined and value_json.status == 'ok' }}"
        json_attributes:
          - kcal_target
          - protein_g
          - protein_target_g
          - meals
          - date
      - name: "Kcal viktprognos"
        unique_id: kcal_forecast
        unit_of_measurement: kg
        value_template: "{{ value_json.current_kg }}"
        availability: "{{ value_json is defined and value_json.status == 'ok' }}"
        json_attributes:
          - weight_trend
          - forecast
```

Reload: `curl -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/services/rest/reload` (falls back to HA restart if the rest integration wasn't loaded before: `.../api/services/homeassistant/restart`).

- [ ] **Step 4: Verify sensors:** `curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/sensor.kcal_idag | jq '{state, attributes}'` — real numbers matching the kcal UI.
- [ ] **Step 5: Commit** — `feat(kcal): L7 netpol for HA + REST sensors`

### Task 14: Kcal page + wire mini card + Chrome pass 5

**Files:**
- Create: `glass-cards/src/hub/pages/hub-kcal-page.ts`, `glass-cards/src/hub/widgets/hub-sparkline.ts`
- Modify: `glass-cards/scripts/hub-config.mjs` (`kcal: { today_entity: 'sensor.kcal_idag', forecast_entity: 'sensor.kcal_viktprognos' }`), `glass-cards/src/hub/glass-hub.ts`

**Interfaces:**
- Consumes: the two REST sensors (shapes from Task 13), `hub-kcal-ring` from Task 5.
- Produces:
  - `<hub-sparkline>` — props `points: {date: string; value: number}[]`, `stroke` (token name), `width/height`. SVG polyline, min/max normalized with 10% pad, end-dot, no axes.
  - `<hub-kcal-page>` — props `hass`, `config`. Layout: left column = large kcal ring (kcal + protein bars beneath: `protein_g / protein_target_g` as horizontal bar) + today's meals list (name + kcal, dimmed timestamps); right column = weight card: `current_kg` large, 28-day `hub-sparkline` (lavender), forecast row `Mål 78 kg · ETA 2 okt (18 sep–20 okt)` + `i fas ✓` green chip when `on_track`. Both columns as cards; lavender-dominant. Offline sensors → whole page shows the quiet offline state (ring at 0, "Kcal · offline").

- [ ] **Step 1:** Invoke frontend-design skill; implement sparkline + page; wire `hub-kcal-ring` on Hem to `sensor.kcal_idag` via config (replace placeholder).
- [ ] **Step 2:** Build; deploy (upload + `deploy.mjs hub`).
- [ ] **Step 3: Chrome pass 5** — Kcal page + Hem mini card in both themes/resolutions; numbers cross-checked against `https://kcal.rutberg.dev/ui` (Philip's session) or the REST sensor values; console clean.
- [ ] **Step 4: Commit** — `feat(glass-hub): Kcal page with ring, meals, weight trend and forecast`

---

## Milestone 6 — HomeKit Bridge

### Task 15: Expose curated HA entities to Apple Home

**Files:**
- Modify: HA `/config/configuration.yaml` (via kubectl exec; mirror block in `.claude/ha-homekit.yaml`)

- [ ] **Step 1:** Append to configuration.yaml:

```yaml
homekit:
  - name: HA Bridge
    port: 21063
    filter:
      include_entities:
        - vacuum.roborock_s8
        - sensor.electricity_maps_co2_intensitet
```

(Spec §5: curated allowlist; explicitly NO `light.*` — Hue reaches HomeKit natively — and no `media_player.*` — Sonos uses AirPlay 2.)

- [ ] **Step 2:** Restart HA (`.../api/services/homeassistant/restart`), wait for it to come back (`curl .../api/` returns 200).
- [ ] **Step 3 (user step):** Pairing — HA creates a persistent notification with the QR/setup code. Fetch it: `curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq '.[] | select(.entity_id|startswith("persistent_notification")) | .attributes.message'`. Philip scans/enters the code in Apple Home.
- [ ] **Step 4:** Philip confirms in Apple Home: Roborock appears; **no duplicate lights** (if duplicates: the filter is wrong — fix before proceeding). Note: HomeKit accessories vanish while HA is down — expected for bridged entities.
- [ ] **Step 5: Commit** — `feat(ha): HomeKit bridge with curated allowlist (vacuum, CO2)`

---

## Milestone 7 — Final verification & docs

### Task 16: Full verification matrix + docs

**Files:**
- Modify: `.claude/CLAUDE.md` (glass-cards section: hub components, deploy targets, REST sensors, fonts)
- Modify: `docs/superpowers/specs/2026-07-15-wall-hub-dashboard-design.md` (status → Implemented)

- [ ] **Step 1: Full Chrome matrix** — all 5 pages × both themes × 1920×1200 and 1280×800 (20 combinations, screenshot each). Check against mockups: typography, spacing, active-color logic, glow/shadow treatment. Exercise: swipe chain hem→kcal→hem, theme toggle cycle (auto/dag/natt), idle return (temporarily set `idle_return_s: 10` in a test deploy, verify, restore to 120), room popup, light slider, scene pill, price chart, media transport, kcal numbers. Console: zero errors on every page.
- [ ] **Step 2:** Fix punch list; redeploy; re-verify failures only.
- [ ] **Step 3:** Update CLAUDE.md (hub deploy: `npm run build && ./scripts/upload.sh && node scripts/deploy.mjs hub`; hub URL `https://home.rutberg.dev/hub/main`; kcal REST sensors; HomeKit bridge note).
- [ ] **Step 4: Commit** — `docs: wall hub implemented — usage + verification notes`
- [ ] **Step 5:** Tell Philip: the hub is live at `https://home.rutberg.dev/hub/main`; tablet purchase criteria in spec §8; when the tablet arrives → install Fully Kiosk, point it at the hub URL, add the Fully Kiosk integration in HA.

---

## Chrome verification procedure (referenced by every milestone)

1. Load the `claude-in-chrome` skill; get tab context; create a new tab.
2. Navigate to `https://home.rutberg.dev/hub/main` (Philip's Chrome is already authenticated to HA; if a login screen appears, ask Philip to log in once).
3. Resize window to 1280×800, screenshot; resize to 1920×1200, screenshot.
4. Toggle theme via the hub's theme button (tap twice: auto→dag→natt), screenshot each theme at each size for the pages in scope.
5. Read console messages — the pass fails on ANY error; warnings triaged.
6. Exercise the interactions listed in the task's verification step. Restore any real-world state you changed (lights, volume, playback, groups).
7. Judge against `.superpowers/brainstorm/51198-1784148570/content/visual-system.html` — if a page would look out of place next to the mockup, it's not done. Fix, redeploy, re-verify.
8. Verify `https://home.rutberg.dev/glass-home/0` still renders (fallback intact).
