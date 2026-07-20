# Transit Details Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tap the Hem transit card to open a "Resor & störningar" popup: pendeltåg departures, up to 6 buss 861 departures, and each SL störning's full text — per spec `docs/superpowers/specs/2026-07-20-transit-details-popup-design.md`.

**Architecture:** `ShapedDeviation` gains optional `details`/`scope` passthrough (pure logic, TDD). A new `hub-transit-popup` Lit widget renders three sections from the same entities the card reads; the card dispatches `hub-transit-open` on tap and `glass-hub` hosts the popup exactly like the room/light popups. The SL command_line sensor's python extraction adds the two new fields (HA-side, restart required — **user must approve the restart when asked; it is not pre-authorized**).

**Tech Stack:** TypeScript + Lit 3, vitest; HA command_line sensor (python one-liner), kubectl.

## Global Constraints

- Swedish UI copy with diacritics: popup title "Resor & störningar", section titles "Pendeltåg", the configured bus label (`config.transit.bus.label`), "Störningar"; empty states "–" / "Inga avgångar idag"; scope prefix "Berör: "; close button aria-label "Stäng"; card aria-label "Visa avgångar och störningar".
- Event contract: `hub-transit-open`, no detail payload, `bubbles: true, composed: true`. Close via existing `hub-popup-close`.
- Details truncation server-side: 400 chars. Cap semantics of `shapeDeviations` unchanged (dedupe by header, priority desc, max 5).
- Delay rule for departure rows: delayed ⇔ `state` is a non-empty string not in `{'EXPECTED','ATSTOP'}`.
- Working dir for npm/vitest: `/Users/philiprutberg/Development/homelab/glass-cards`; repo root for git/kubectl/curl: `/Users/philiprutberg/Development/homelab`.
- Do not stage or commit `glass-cards/dist/` mid-plan (bundle committed once at the end); `.claude/ha-rest-sensors.yaml` is gitignored/local-only — never force-add.
- Known pre-existing test failures to ignore: `test/theme-controller.test.ts`, `test/glass-light-slider-toggle.test.ts` (missing DOM env; fail identically on main).
- Deploy reminder: after `./scripts/upload.sh`, `node scripts/deploy.mjs hub` MUST be re-run to bump the `?v=` cache-bust param, else clients keep the old bundle.

---

### Task 1: `shapeDeviations` — details/scope passthrough (TDD)

**Files:**
- Modify: `glass-cards/src/hub/transit-model.ts` (the `RawDeviation`/`ShapedDeviation`/`shapeDeviations` block at the end of the file)
- Test: `glass-cards/test/transit-model.test.ts` (append inside the existing `shapeDeviations` describe or a new one)

**Interfaces:**
- Consumes: existing `shapeDeviations(raw: unknown): ShapedDeviation[]`.
- Produces (Task 2 depends on these exact names): `ShapedDeviation` = `{ badges: string[]; header: string; details?: string; scope?: string }`. Merge rule: on duplicate headers, the first non-empty `details`/`scope` seen wins.

- [ ] **Step 1: Write the failing tests**

Append to `glass-cards/test/transit-model.test.ts` (inside the file, after the existing `shapeDeviations` describe block — reuse the existing `dev` helper if in the same describe, else copy it):

```ts
describe('shapeDeviations details/scope passthrough', () => {
  const dev = (over: Record<string, unknown> = {}) => ({
    header: 'Försenad trafik',
    priority: 30,
    lines: [{ designation: '19', transport_mode: 'METRO' }],
    ...over,
  });

  it('passes details and scope through', () => {
    const out = shapeDeviations([
      dev({ details: 'Signalfel vid Gullmarsplan.', scope: 'Gröna linjen mot Hagsätra' }),
    ]);
    expect(out).toEqual([
      {
        badges: ['19'],
        header: 'Försenad trafik',
        details: 'Signalfel vid Gullmarsplan.',
        scope: 'Gröna linjen mot Hagsätra',
      },
    ]);
  });

  it('omits details/scope when absent or not strings', () => {
    const out = shapeDeviations([dev({ details: 42, scope: null })]);
    expect(out[0].details).toBeUndefined();
    expect(out[0].scope).toBeUndefined();
  });

  it('merge keeps the first non-empty details/scope', () => {
    const out = shapeDeviations([
      dev({ details: '', scope: undefined }),
      dev({ details: 'Först.', scope: 'Nynäsgård' }),
      dev({ details: 'Sen.', scope: 'Ösmo' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].details).toBe('Först.');
    expect(out[0].scope).toBe('Nynäsgård');
  });
});
```

- [ ] **Step 2: Run tests to verify the new block fails**

Run: `npx vitest run test/transit-model.test.ts`
Expected: existing tests PASS; the three new tests FAIL (details/scope undefined in output).

- [ ] **Step 3: Implement**

In `glass-cards/src/hub/transit-model.ts`, update the deviation block:

```ts
/** One slimmed SL deviation as emitted by the sensor.sl_storningar command. */
interface RawDeviation {
  header?: unknown;
  priority?: unknown;
  lines?: unknown;
  details?: unknown;
  scope?: unknown;
}

export interface ShapedDeviation {
  badges: string[]; // line designations, e.g. ['18', '19']
  header: string;
  details?: string; // SL's longer description (server-truncated to 400 chars)
  scope?: string; // affected area, e.g. 'Nynäsgård, Ösmo'
}
```

In `shapeDeviations`, the map value becomes `{ badges: Set<string>; priority: number; details?: string; scope?: string }`. Inside the loop, after computing `badges`:

```ts
    const details =
      typeof rec.details === 'string' && rec.details.length > 0 ? rec.details : undefined;
    const scope =
      typeof rec.scope === 'string' && rec.scope.length > 0 ? rec.scope : undefined;
    const existing = byHeader.get(rec.header);
    if (existing) {
      for (const b of badges) existing.badges.add(b);
      existing.priority = Math.max(existing.priority, priority);
      if (!existing.details && details) existing.details = details;
      if (!existing.scope && scope) existing.scope = scope;
    } else {
      byHeader.set(rec.header, { badges: new Set(badges), priority, details, scope });
    }
```

and the final map:

```ts
  return [...byHeader.entries()]
    .sort((a, b) => b[1].priority - a[1].priority)
    .slice(0, MAX_DEVIATIONS)
    .map(([header, v]) => ({
      badges: [...v.badges].sort(),
      header,
      ...(v.details !== undefined ? { details: v.details } : {}),
      ...(v.scope !== undefined ? { scope: v.scope } : {}),
    }));
```

(The conditional spread keeps absent fields truly absent, so the first passthrough test's `toEqual` — and Task 14's older exact-equality tests without the new fields — both pass.)

- [ ] **Step 4: Run the whole file's tests**

Run: `npx vitest run test/transit-model.test.ts`
Expected: ALL PASS (old exact-`toEqual` tests still pass because absent fields are omitted, not `undefined`-valued).

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/transit-model.ts glass-cards/test/transit-model.test.ts
git commit -m "feat(hub): shapeDeviations carries details and scope"
```

---

### Task 2: `hub-transit-popup` + card tap + glass-hub wiring

**Files:**
- Create: `glass-cards/src/hub/widgets/hub-transit-popup.ts`
- Modify: `glass-cards/src/hub/widgets/hub-transit-card.ts` (tap dispatch + press feedback)
- Modify: `glass-cards/src/hub/glass-hub.ts` (state, listener, render)

**Interfaces:**
- Consumes: `ShapedDeviation` incl. `details?`/`scope?` (Task 1); `filterBusDepartures(raw, line, excludePattern)` and `SlDeparture` from `../transit-model.js`; `formatHm` exported by `hub-transit-card.ts`; `HubConfig` (`departures.list_entity`, `transit.bus`, `disturbances_entity`).
- Produces: `<hub-transit-popup .hass .config>`; `hub-transit-open` event (no detail, bubbles, composed); glass-hub state `_openTransit: boolean`.

- [ ] **Step 1: Create the popup widget**

Create `glass-cards/src/hub/widgets/hub-transit-popup.ts`:

```ts
import { html, css, svg, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import {
  filterBusDepartures,
  shapeDeviations,
  type SlDeparture,
  type ShapedDeviation,
} from '../transit-model.js';
import { formatHm } from './hub-transit-card.js';
import type { HubConfig } from '../hub-config.js';

const CLOSE_ICON = svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

const MAX_ROWS = 6;
const ON_TIME_STATES = new Set(['EXPECTED', 'ATSTOP']);

function isDelayed(d: SlDeparture): boolean {
  return typeof d.state === 'string' && d.state.length > 0 && !ON_TIME_STATES.has(d.state);
}

/**
 * Tap-the-transit-card popup: pendeltåg departures (both directions from
 * Nynäsgård), the next bus runs, and every active störning with SL's full
 * text. Each section degrades independently when its sensor is dead.
 */
export class HubTransitPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

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
        max-width: 560px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
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

      .section + .section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--hub-card-border);
      }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 8px;
      }
      .empty {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Departure rows ─────────────────────────────────── */
      .dep-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-height: 30px;
      }
      .dep-time {
        flex-shrink: 0;
        width: 52px;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .dep-time.delayed {
        color: var(--hub-coral);
      }
      .dep-dest {
        flex: 1;
        min-width: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dep-in {
        flex-shrink: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .dep-in.delayed {
        color: var(--hub-coral);
      }

      /* ── Störningar ─────────────────────────────────────── */
      .stor + .stor {
        margin-top: 12px;
      }
      .stor-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .badge {
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .stor-header {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-coral);
      }
      .stor-details {
        margin-top: 4px;
        font: 400 13px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-muted);
        white-space: pre-line;
      }
      .stor-scope {
        margin-top: 3px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _departures(entity: string | undefined, line: string, exclude: string): SlDeparture[] {
    if (!entity) return [];
    const ent = this.getEntity(entity);
    const raw = (ent?.attributes.departures as SlDeparture[] | undefined) ?? [];
    return filterBusDepartures(raw, line, exclude).slice(0, MAX_ROWS);
  }

  private _depRow(d: SlDeparture): TemplateResult {
    const delayed = isDelayed(d);
    const hm = formatHm(d.expected ?? d.scheduled) ?? '–';
    return html`
      <div class="dep-row">
        <span class="dep-time ${delayed ? 'delayed' : ''}">${hm}</span>
        <span class="dep-dest">${d.destination ?? '–'}</span>
        <span class="dep-in ${delayed ? 'delayed' : ''}">${d.display ?? ''}</span>
      </div>
    `;
  }

  private _depSection(title: string, deps: SlDeparture[], emptyText: string): TemplateResult {
    return html`
      <div class="section">
        <div class="sec-title">${title}</div>
        ${deps.length
          ? deps.map((d) => this._depRow(d))
          : html`<div class="empty">${emptyText}</div>`}
      </div>
    `;
  }

  private _storSection(shaped: ShapedDeviation[]): TemplateResult | typeof nothing {
    if (shaped.length === 0) return nothing;
    return html`
      <div class="section">
        <div class="sec-title">Störningar</div>
        ${shaped.map(
          (s) => html`
            <div class="stor">
              <div class="stor-head">
                ${s.badges.map((b) => html`<span class="badge">${b}</span>`)}
                <span class="stor-header">${s.header}</span>
              </div>
              ${s.details ? html`<div class="stor-details">${s.details}</div>` : nothing}
              ${s.scope ? html`<div class="stor-scope">Berör: ${s.scope}</div>` : nothing}
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.config;

    const trains = this._departures(cfg.departures?.list_entity, '43', '');
    const busCfg = cfg.transit?.bus;
    const buses = busCfg
      ? this._departures(busCfg.entity, busCfg.line, busCfg.exclude_destination)
      : [];

    const devEnt = cfg.disturbances_entity ? this.getEntity(cfg.disturbances_entity) : undefined;
    const shaped =
      devEnt && devEnt.state !== 'unavailable' && devEnt.state !== 'unknown'
        ? shapeDeviations(devEnt.attributes.deviations)
        : [];

    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Resor och störningar">
          <div class="head">
            <span class="title">Resor & störningar</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${CLOSE_ICON}</button>
          </div>
          ${this._depSection('Pendeltåg', trains, '–')}
          ${this._depSection(busCfg?.label ?? 'Buss', buses, 'Inga avgångar idag')}
          ${this._storSection(shaped)}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-transit-popup', HubTransitPopup);
```

- [ ] **Step 2: Make the card tappable**

In `glass-cards/src/hub/widgets/hub-transit-card.ts`:

1. Add to `.card`'s CSS: `cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;` and extend/replace its `transition` to include `transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1)`. Add:

```css
      .card:active {
        transform: scale(0.985);
      }
```

2. Add the dispatch method:

```ts
  private _open = (): void => {
    this.dispatchEvent(
      new CustomEvent('hub-transit-open', { bubbles: true, composed: true }),
    );
  };
```

3. In `render()`, wire the card div:

```ts
      <div
        class="card ${shaped.length ? 'has-alerts' : ''}"
        role="button"
        tabindex="0"
        aria-label="Visa avgångar och störningar"
        @click=${this._open}
      >
```

(keep the existing `has-alerts` class logic exactly as it is today — only the attributes/handler are added).

- [ ] **Step 3: Wire glass-hub**

In `glass-cards/src/hub/glass-hub.ts`:

1. Import: `import './widgets/hub-transit-popup.js';` (next to the other popup imports).
2. State next to `_openLight`: `@state() private _openTransit = false;`
3. Listeners in connected/disconnectedCallback (next to the `hub-light-open` pair):

```ts
    this.addEventListener('hub-transit-open', this._onTransitOpen);
```
```ts
    this.removeEventListener('hub-transit-open', this._onTransitOpen);
```

4. Handler + extend `_onPopupClose`:

```ts
  private _onTransitOpen = (): void => {
    this._openTransit = true;
  };

  private _onPopupClose = (): void => {
    this._openRoom = null;
    this._openLight = null;
    this._openTransit = false;
  };
```

5. In `render()` after the light-popup block:

```ts
      ${this._openTransit
        ? html`<hub-transit-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-transit-popup>`
        : nothing}
```

- [ ] **Step 4: Build + tests**

Run: `npm run build && npx vitest run`
Expected: build clean; 123 tests pass (120 + Task 1's 3), same 5 pre-existing failures only.

- [ ] **Step 5: Commit**

```bash
git add glass-cards/src/hub/widgets/hub-transit-popup.ts glass-cards/src/hub/widgets/hub-transit-card.ts glass-cards/src/hub/glass-hub.ts
git commit -m "feat(hub): tap transit card for departures + störningar popup"
```

---

### Task 3: SL sensor — add `details` + `scope` (HA-side; restart needs user approval)

**Files:**
- Modify: `.claude/ha-rest-sensors.yaml` (mirror; NOT committed — gitignored by design)
- Modify (in pod): HA `/config/configuration.yaml` — the `command_line:` block's python command

**Interfaces:**
- Produces: `sensor.sl_storningar` deviations gain `details` (≤400 chars, or null) and `scope` (scope_alias, or null) — consumed by Task 1's passthrough (which treats null/absent as undefined).

- [ ] **Step 1: New python one-liner (uses walrus; pod has python 3.13)**

The command becomes (single line inside the YAML `>-` block; shown wrapped for readability):

```python
python3 -c "import json,urllib.request;
d=json.load(urllib.request.urlopen('https://deviations.integration.sl.se/v1/messages?future=false&transport_mode=METRO&transport_mode=TRAIN&transport_mode=BUS',timeout=15));
MON={('METRO','17'),('METRO','18'),('METRO','19'),('TRAIN','43'),('BUS','861')};
keep=[{'header':(v:=(m.get('message_variants') or [{}])[0]).get('header'),'details':((v.get('details') or '')[:400] or None),'scope':(v.get('scope_alias') or None),'priority':(m.get('priority') or {}).get('importance_level'),'lines':[{'designation':str(l.get('designation')),'transport_mode':l.get('transport_mode')} for l in ((m.get('scope') or {}).get('lines') or []) if (l.get('transport_mode'),str(l.get('designation'))) in MON]} for m in d];
keep=[k for k in keep if k['lines'] and k['header']];
print(json.dumps({'count':len(keep),'deviations':keep}))"
```

- [ ] **Step 2: Test the extraction locally BEFORE touching the pod**

Run the same python locally (multi-line is fine in a terminal). Expected: valid JSON; each deviation has `header`, `details` (string ≤400 or null), `scope` (string or null), `priority`, `lines`. If SL's schema differs, STOP and report rather than improvising.

- [ ] **Step 3: Update the mirror file**

Replace the `command:` value in the `command_line:` block of `.claude/ha-rest-sensors.yaml` with the new one-liner (keep everything else — name, unique_id, scan_interval, command_timeout, value_template, json_attributes — unchanged).

- [ ] **Step 4: Apply to the pod, validate, ASK USER, restart, verify**

1. Pull `/config/configuration.yaml` from the pod, replace the same `command:` value, keep a timestamped backup copy under `.superpowers/sdd/`, push back (same pull/edit/push flow as round 3's Task 13).
2. `check_config` via the HA API — expect `"valid"`.
3. **Ask the user for permission to restart HA** (not pre-authorized). After approval: restart, poll `/api/` until 200, then:

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/sensor.sl_storningar | jq '.attributes.deviations[0] | {header, details: (.details | if . then .[:80] else . end), scope}'
```

Expected: `details`/`scope` present (may be null for some deviations). If the sensor hasn't refreshed, trigger `homeassistant.update_entity` for it and re-check.

- [ ] **Step 5: No git commit**

This task changes only the gitignored mirror + live pod config. Record the outcome in the progress ledger instead.

---

### Task 4: Deploy + live acceptance

**Files:**
- Modify: `glass-cards/dist/glass-cards.js` (committed once here)

- [ ] **Step 1: Full suite + build + deploy (BOTH steps)**

```bash
cd glass-cards
npx vitest run       # expected: 123 pass, only the 5 known pre-existing failures
npm run build
./scripts/upload.sh
node scripts/deploy.mjs hub    # REQUIRED to bump ?v= — upload alone serves stale JS
```

- [ ] **Step 2: Live acceptance at 1280×800**

Using the browser (iframe harness at 1280×800 like round 3, purging SW/HTTP cache as needed):

- Tap the transit card → popup opens with title "Resor & störningar".
- Pendeltåg section: rows with HH:MM + destination (both directions), delayed rows coral.
- Bus section: label "Buss 861 → Slakthuset", rows or "Inga avgångar idag".
- Störningar section: current real deviations each show badges + header + details text; scope line when present; section entirely absent if the sensor reports 0.
- Close via scrim tap AND via X.
- The Hem page still fits (page overflow 0); the card's press feedback doesn't shift layout.

- [ ] **Step 3: Commit bundle + ledger**

```bash
git add glass-cards/dist/glass-cards.js
git commit -m "chore(hub): rebuild bundle — transit details popup"
```

Append the acceptance results to `.superpowers/sdd/progress.md`.

---

## Self-Review Notes

- Spec coverage: interaction (Task 2 steps 2–3), popup content §1–3 (Task 2 step 1), data changes (Tasks 1, 3), error handling (popup's per-section degradation + optional fields; old-payload case = Task 3 not yet run, popup still works), testing (Task 1 tests + Task 4 acceptance). No gaps.
- Type consistency: `ShapedDeviation.details?/scope?` (Tasks 1→2), `hub-transit-open` (Task 2 card→hub), `formatHm` import from `./hub-transit-card.js` (already exported there today).
- Restart approval is explicitly gated in Task 3 step 4 — not pre-authorized.
