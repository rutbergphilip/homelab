# Wall-Hub Round 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hem-page command center: compact lighting widget + modal, Volvo card, Roborock card, todo list, merged Apple+Google calendar with event creation, night light automation, and a responsive sweep (panel/phone/desktop).

**Architecture:** All new dashboard surfaces are Lit custom elements in `glass-cards/src/hub/widgets/`, wired through `glass-hub.ts` popup state (existing transit/weather pattern: card dispatches `hub-*-open`, hub renders popup, popup dispatches `hub-popup-close`). Calendar/todo data comes over the HA WebSocket via services with `return_response` (pattern: `weather-forecast.ts`). Entity IDs live only in `scripts/hub-config.mjs`. HA-side work (integrations, automation) happens first because the Volvo/calendar/todo entities must exist before their widgets can be verified.

**Tech Stack:** Lit 3 + TypeScript + Rollup (`npm run build`), Vitest (`npm test`), HA REST/WS API, kubectl into the `home-automation` namespace.

**Spec:** `docs/superpowers/specs/2026-07-22-wall-hub-round-6-design.md`

## Global Constraints

- All UI copy is Swedish ("Belysning", "Att göra", "Städa allt", "Nytt", "Stäng").
- Style only with `--hub-*` design tokens from `src/styles/tokens.ts` (`hubTokens`). Domain colors: amber = lights, teal = media, green = energy, lavender = kcal/planning, coral = alerts only.
- Entity IDs never appear in component code — only in `scripts/hub-config.mjs` (config, not code).
- Touch targets ≥ 44px (existing convention: 48px buttons).
- Frontend commands run from `/Users/philiprutberg/Development/homelab/glass-cards`; HA API commands from repo root `/Users/philiprutberg/Development/homelab`.
- HA API access: `HA_TOKEN=$(cat .claude/ha-token)`, base URL `https://home.rutberg.dev`.
- HA pod access: `POD=$(kubectl get pods -n home-automation -o name | grep home-assistant | head -1)`.
- Night automation target: `light.spotlight_top`, `brightness_pct: 30`, `hs_color: [240, 90]`, window 22:00–07:00 (spec-fixed values).
- Do NOT trigger real-world actions during verification that move machines: no vacuum cleaning starts, no car climate/lock commands. Verify those render correctly; Philip exercises them.
- Existing tests must keep passing: `npm test` green after every task.

---

### Task 1: Night automation — badrum spotlight 30% blue

**Files:**
- Create: `.claude/ha-automations.yaml` (mirror of what's added to HA)

**Interfaces:**
- Produces: HA automations `automation.badrum_nattljus_pa` / `automation.badrum_nattljus_av` (entity IDs derive from aliases; verify actual IDs in step 5)

- [ ] **Step 1: Confirm automations.yaml is included and see its current tail**

```bash
cd /Users/philiprutberg/Development/homelab
POD=$(kubectl get pods -n home-automation -o name | grep home-assistant | head -1)
kubectl exec -n home-automation "$POD" -- grep -n "automation" /config/configuration.yaml
kubectl exec -n home-automation "$POD" -- tail -5 /config/automations.yaml
```

Expected: a line like `automation: !include automations.yaml`. If the include is missing, add `automation: !include automations.yaml` to `/config/configuration.yaml` first (same append technique as step 2) — a restart is then needed instead of reload; fold that into step 4.

- [ ] **Step 2: Write the mirror file**

Create `.claude/ha-automations.yaml`:

```yaml
# Mirror of automations appended to HA /config/automations.yaml (2026-07-22).
# Badrum nattljus: spotlight 30% blått 22:00-07:00. Boot-trigger så en
# HA-omstart mitt i natten återställer läget.
- id: badrum_nattljus_pa
  alias: "Badrum nattljus pa"
  description: "Spotlight 30% blått under natten (22:00-07:00)"
  triggers:
    - trigger: time
      at: "22:00:00"
      id: natt
    - trigger: homeassistant
      event: start
      id: boot
  conditions:
    - condition: or
      conditions:
        - condition: trigger
          id: natt
        - condition: time
          after: "22:00:00"
          before: "07:00:00"
  actions:
    - action: light.turn_on
      target:
        entity_id: light.spotlight_top
      data:
        brightness_pct: 30
        hs_color: [240, 90]
  mode: single
- id: badrum_nattljus_av
  alias: "Badrum nattljus av"
  triggers:
    - trigger: time
      at: "07:00:00"
  actions:
    - action: light.turn_off
      target:
        entity_id: light.spotlight_top
  mode: single
```

(ASCII aliases on purpose — predictable entity ID slugs.)

- [ ] **Step 3: Append to the pod's automations.yaml**

```bash
kubectl exec -i -n home-automation "$POD" -- sh -c 'cat >> /config/automations.yaml' < .claude/ha-automations.yaml
kubectl exec -n home-automation "$POD" -- tail -45 /config/automations.yaml
```

Expected: the two automations appear at the tail, correctly indented.

- [ ] **Step 4: Check config and reload automations**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/config/core/check_config
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/services/automation/reload
```

Expected: check_config returns `{"result": "valid", ...}`. If invalid, fix the YAML in the pod before reloading.

- [ ] **Step 5: Verify entities exist and test-fire the on-automation**

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '.[].entity_id' | grep badrum_nattljus
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/services/automation/trigger \
  -d '{"entity_id": "automation.badrum_nattljus_pa"}'
sleep 3
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/light.spotlight_top | jq '{state, brightness: .attributes.brightness, hs: .attributes.hs_color}'
```

Expected: both automation entities listed; after trigger, `state: "on"`, brightness ≈ 76 (30% of 255), hs ≈ [240, 90]. (`automation.trigger` skips conditions by default — that's why this works in daytime.)

- [ ] **Step 6: Restore the light and commit**

```bash
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/services/light/turn_off -d '{"entity_id": "light.spotlight_top"}'
git add -f .claude/ha-automations.yaml
git commit -m "feat(ha): badrum nattljus automation — spotlight 30% blue 22:00-07:00 with boot guard"
```

(`git add -f` because `.claude/` may be partially gitignored; `git check-ignore .claude/ha-automations.yaml` tells you. `.claude/ha-token` must NEVER be committed.)

---

### Task 2: Local To-do list "Att göra"

**Files:** none (HA config entry via API)

**Interfaces:**
- Produces: entity `todo.att_gora` (verify exact slug in step 2 — Task 8 config uses it)

- [ ] **Step 1: Create the local_todo config entry via the flow API**

```bash
cd /Users/philiprutberg/Development/homelab
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/config/config_entries/flow \
  -d '{"handler": "local_todo", "show_advanced_options": false}'
```

Expected: JSON with a `flow_id` and `step_id: "user"`. Then finish the flow:

```bash
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/config/config_entries/flow/<FLOW_ID> \
  -d '{"todo_list_name": "Att göra"}'
```

Expected: `"type": "create_entry"`.

- [ ] **Step 2: Verify the entity and smoke-test add/get**

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '.[].entity_id' | grep '^todo\.'
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/services/todo/add_item \
  -d '{"entity_id": "todo.att_gora", "item": "Testpunkt — ta bort"}'
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/todo.att_gora | jq .state
```

Expected: `todo.att_gora` (note the actual slug if it differs — å→a transliteration) alongside `todo.shopping_list`; state becomes `"1"` after add. Remove the test item:

```bash
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  https://home.rutberg.dev/api/services/todo/remove_item \
  -d '{"entity_id": "todo.att_gora", "item": "Testpunkt — ta bort"}'
```

No commit (nothing in the repo changed).

---

### Task 3: iCloud CalDAV calendar integration

**Files:**
- Create: `.claude/ha-caldav.yaml` (mirror, without secrets)

**Interfaces:**
- Produces: one or more `calendar.*` entities from iCloud. Record the chosen primary (create-target) entity ID — Task 9 config needs it.

- [ ] **Step 1: Get credentials from Philip**

Ask Philip (blocking — only he can do this):
1. His Apple ID email.
2. An app-specific password: appleid.apple.com → Sign-In and Security → App-Specific Passwords → Generate, name it `home-assistant`.

- [ ] **Step 2: Add secrets to the pod's secrets.yaml**

```bash
cd /Users/philiprutberg/Development/homelab
POD=$(kubectl get pods -n home-automation -o name | grep home-assistant | head -1)
kubectl exec -i -n home-automation "$POD" -- sh -c 'cat >> /config/secrets.yaml' <<'EOF'
icloud_username: "<APPLE_ID_EMAIL>"
icloud_password: "<APP_SPECIFIC_PASSWORD>"
EOF
```

(Substitute real values — they go only into the pod, never into git.)

- [ ] **Step 3: Add the caldav platform to configuration.yaml**

First check whether a top-level `calendar:` key already exists:

```bash
kubectl exec -n home-automation "$POD" -- grep -n "^calendar:" /config/configuration.yaml
```

Expected: no match (if there IS one, merge into it instead of appending a duplicate key). Then append:

```bash
kubectl exec -i -n home-automation "$POD" -- sh -c 'cat >> /config/configuration.yaml' <<'EOF'

calendar:
  - platform: caldav
    url: https://caldav.icloud.com
    username: !secret icloud_username
    password: !secret icloud_password
EOF
```

- [ ] **Step 4: Check config and restart HA**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/config/core/check_config
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/services/homeassistant/restart
```

Expected: `{"result": "valid"}` before restarting. Wait ~90s, then poll `curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/ | jq .message` until it returns `"API running."`.

- [ ] **Step 5: Verify calendar entities and pick the create target**

```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '.[] | select(.entity_id | startswith("calendar.")) | .entity_id'
```

Expected: one entity per iCloud calendar (e.g. `calendar.hemma`, `calendar.familj`). Ask Philip which is his main calendar; record its entity ID for Task 9 (`create_entity`). Also record which ones should be merged into the view (usually all non-birthday ones).

- [ ] **Step 6: Write mirror and commit**

Create `.claude/ha-caldav.yaml`:

```yaml
# Mirror of the caldav block in HA /config/configuration.yaml (2026-07-22).
# Credentials live in the pod's secrets.yaml (icloud_username/icloud_password —
# app-specific password from appleid.apple.com, named "home-assistant").
calendar:
  - platform: caldav
    url: https://caldav.icloud.com
    username: !secret icloud_username
    password: !secret icloud_password
# Entities produced: <fill in the discovered calendar.* list>
# Primary (create target): <fill in>
```

Fill in the two comment lines with the real discovered values, then:

```bash
git add -f .claude/ha-caldav.yaml
git commit -m "feat(ha): iCloud CalDAV calendar integration (mirror)"
```

---

### Task 4: Google Calendar integration

**Files:** none (UI OAuth flow)

**Interfaces:**
- Produces: `calendar.*` entities from Google. Record the Google calendar entity ID(s) to merge — Task 9 config needs them.

- [ ] **Step 1: Guide Philip through Google Cloud OAuth credentials**

Philip must do this in a browser (blocking). Give him these exact steps:
1. console.cloud.google.com → create/select a project (e.g. `ha-calendar`).
2. APIs & Services → Library → enable **Google Calendar API**.
3. APIs & Services → OAuth consent screen → External → fill app name `home-assistant`, add himself as test user.
4. Credentials → Create credentials → OAuth client ID → type **Web application** → add authorized redirect URI `https://my.home-assistant.io/redirect/oauth`.
5. Note the Client ID + Client Secret.

- [ ] **Step 2: Add the integration in HA**

Philip in the HA UI: Settings → Devices & services → Add integration → **Google Calendar** → paste Client ID/Secret when prompted (Application Credentials dialog) → complete the Google sign-in → when asked for access level choose **read/write**.

- [ ] **Step 3: Verify entities**

```bash
cd /Users/philiprutberg/Development/homelab
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '.[] | select(.entity_id | startswith("calendar.")) | .entity_id'
```

Expected: new Google `calendar.*` entities alongside the CalDAV ones. Record which Google entity is his primary (usually `calendar.<gmail-address-slug>`) for Task 9's merge list. No commit.

---

### Task 5: Volvo Cars HACS integration

**Files:**
- Create: `.claude/ha-volvo-entities.txt` (discovered entity list, reference for Task 10)

**Interfaces:**
- Produces: `sensor./lock./binary_sensor./switch./button.` entities for the car. Task 10 maps them into `hub-config.mjs`.

- [ ] **Step 1: Guide Philip through the Volvo developer API key**

Philip in a browser (blocking):
1. developer.volvocars.com → sign in with his Volvo ID.
2. Account → API applications → create an application (name e.g. `home-assistant`).
3. Note the **Primary API key**.

- [ ] **Step 2: Install the integration via HACS and configure**

Philip in the HA UI:
1. HACS → search **Volvo Cars** (author thomasddn) → Download → restart HA when prompted (Settings → System → Restart).
2. Settings → Devices & services → Add integration → **Volvo Cars** → enter Volvo ID email/password, the API key, and the OTP emailed by Volvo during the flow.

- [ ] **Step 3: Discover and record entities**

```bash
cd /Users/philiprutberg/Development/homelab
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states \
  | jq -r '.[] | select(.entity_id | test("volvo")) | "\(.entity_id) = \(.state) \(.attributes.friendly_name // "")"' \
  | tee .claude/ha-volvo-entities.txt
```

Expected: a few dozen entities. Identify and note at the top of the file (as comments) the IDs for these roles — Task 10 consumes them:
- battery % (name contains `battery_charge_level` or `batteriniva`)
- electric range (`distance_to_empty_battery` / `rackvidd`)
- lock (`lock.` domain)
- charging status (`charging_status` / `laddningsstatus`)
- climatization start (`switch.` or `button.` containing `climatization`; note the domain — the popup handles both; if there's a separate stop button, note it too)
- odometer (`odometer` / `matarstallning`)
- door/window binary sensors worth showing (front/rear doors, tailgate)

```bash
git add -f .claude/ha-volvo-entities.txt
git commit -m "feat(ha): Volvo Cars integration installed — discovered entity reference"
```

---

### Task 6: Compact lighting tile + lights modal, Hem grid rework

**Files:**
- Create: `glass-cards/src/hub/widgets/popup-styles.ts`
- Create: `glass-cards/src/hub/widgets/hub-lighting-tile.ts`
- Create: `glass-cards/src/hub/widgets/hub-lights-modal.ts`
- Modify: `glass-cards/src/hub/light-actions.ts` (add `lightingSubtitle`)
- Modify: `glass-cards/src/hub/widgets/icons.ts` (add `close` icon)
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts` (`.rooms` → `.widgets`)
- Modify: `glass-cards/src/hub/glass-hub.ts` (popup wiring)
- Test: `glass-cards/test/light-actions.test.ts` (extend)

**Interfaces:**
- Consumes: `HubConfig.rooms`, `HubConfig.lights_count_entity` (existing).
- Produces: event `hub-lights-open` (no detail); shared `popupStyles` CSSResult used by every later popup; `lightingSubtitle(count: number | null, litRooms: string[]): string`; `icons.close`.

- [ ] **Step 1: Write the failing test for `lightingSubtitle`**

Append to `test/light-actions.test.ts`:

```ts
import { lightingSubtitle } from '../src/hub/light-actions';

describe('lightingSubtitle', () => {
  it('returns dash when count is unknown', () => {
    expect(lightingSubtitle(null, [])).toBe('–');
  });
  it('says allt släckt at zero', () => {
    expect(lightingSubtitle(0, [])).toBe('Allt släckt');
  });
  it('uses singular tänd for one light', () => {
    expect(lightingSubtitle(1, ['Hall'])).toBe('1 tänd · Hall');
  });
  it('lists lit rooms after the plural count', () => {
    expect(lightingSubtitle(5, ['Vardagsrum', 'Kök'])).toBe('5 tända · Vardagsrum, Kök');
  });
  it('omits the room tail when no room names resolve', () => {
    expect(lightingSubtitle(2, [])).toBe('2 tända');
  });
});
```

(Match the existing import style at the top of that file — merge into the existing import from `../src/hub/light-actions` if one exists.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/philiprutberg/Development/homelab/glass-cards && npx vitest run test/light-actions.test.ts`
Expected: FAIL — `lightingSubtitle` is not exported.

- [ ] **Step 3: Implement `lightingSubtitle`**

Append to `src/hub/light-actions.ts`:

```ts
/** Subtitle for the Hem lighting tile: "5 tända · Vardagsrum, Kök". */
export function lightingSubtitle(count: number | null, litRooms: string[]): string {
  if (count === null) return '–';
  if (count === 0) return 'Allt släckt';
  const head = `${count} ${count === 1 ? 'tänd' : 'tända'}`;
  return litRooms.length ? `${head} · ${litRooms.join(', ')}` : head;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/light-actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the shared popup shell styles**

Create `src/hub/widgets/popup-styles.ts`:

```ts
import { css } from 'lit';

/**
 * Shared popup shell: blurred scrim + centered card. On phones (≤600px) the
 * card becomes a full-screen sheet. Import into every hub popup's styles array
 * after hubTokens; the component adds only its content styles.
 */
export const popupStyles = css`
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
  @media (max-width: 600px) {
    .scrim { padding: 0; }
    .card {
      max-width: none;
      height: 100%;
      max-height: none;
      border-radius: 0;
    }
  }
`;
```

- [ ] **Step 6: Add the close icon**

In `src/hub/widgets/icons.ts`, add a `close` entry following the exact shape of the existing entries (open the file first — entries are `svg` tagged templates in an exported `icons` record):

```ts
close: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`,
```

- [ ] **Step 7: Create the lighting tile**

Create `src/hub/widgets/hub-lighting-tile.ts`:

```ts
import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import { lightingSubtitle } from '../light-actions.js';
import type { HubConfig } from '../hub-config.js';

export class HubLightingTile extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition:
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background 200ms ease,
          border-color 200ms ease;
      }
      .card:active {
        transform: scale(0.985);
      }
      .card.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .ic {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .card.on .ic {
        color: var(--hub-amber-text);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .label {
        display: block;
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.on .sub {
        color: var(--hub-amber-text);
      }
    `,
  ];

  private get _count(): number | null {
    const ent = this.config.lights_count_entity
      ? this.getEntity(this.config.lights_count_entity)
      : undefined;
    const n = Number(ent?.state);
    return ent && !Number.isNaN(n) ? n : null;
  }

  private _litRooms(): string[] {
    return (this.config.rooms ?? [])
      .filter((r) => r.lights.some((l) => this.getEntity(l.entity)?.state === 'on'))
      .map((r) => r.name);
  }

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-lights-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config) return html``;
    const count = this._count;
    return html`
      <div
        class="card ${(count ?? 0) > 0 ? 'on' : ''}"
        role="button"
        tabindex="0"
        aria-label="Visa alla lampor"
        @click=${this._open}
      >
        <span class="ic">${icons.lamp}</span>
        <div>
          <b class="label">Belysning</b>
          <span class="sub">${lightingSubtitle(count, this._litRooms())}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lighting-tile', HubLightingTile);
```

- [ ] **Step 8: Create the lights modal**

Create `src/hub/widgets/hub-lights-modal.ts`:

```ts
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';
import '../../cards/glass-light-slider.js';

export class HubLightsModal extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .all-off {
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .all-off:active {
        transform: scale(0.96);
      }
      .room {
        margin-top: 18px;
      }
      .room:first-of-type {
        margin-top: 0;
      }
      .room-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
      }
      .room-name {
        font: 500 16px var(--hub-font-display);
        color: var(--hub-text);
      }
      .room-count {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .scene-chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _allOff = (): void => {
    const all = [
      ...new Set((this.config.rooms ?? []).flatMap((r) => r.lights.map((l) => l.entity))),
    ];
    this.hass?.callService('light', 'turn_off', {}, { entity_id: all });
  };

  private _scene(entity: string): void {
    this.callService('scene', 'turn_on', undefined, entity);
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const rooms = this.config.rooms ?? [];
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Belysning">
          <div class="head">
            <span class="title">Belysning</span>
            <button class="all-off" @click=${this._allOff}>Släck allt</button>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>
              ${icons.close}
            </button>
          </div>
          ${rooms.map((room) => {
            const on = room.lights.filter((l) => this.getEntity(l.entity)?.state === 'on').length;
            return html`
              <div class="room">
                <div class="room-head">
                  <span class="room-name">${room.name}</span>
                  <span class="room-count">${on > 0 ? `${on} tänd${on === 1 ? '' : 'a'}` : ''}</span>
                </div>
                <div class="lights">
                  ${room.lights.map(
                    (l) => html`
                      <glass-light-slider
                        .hass=${this.hass}
                        ._config=${{ type: 'glass-light-slider', entity: l.entity, name: l.name }}
                      ></glass-light-slider>
                    `,
                  )}
                </div>
                ${room.scenes?.length
                  ? html`<div class="scenes">
                      ${room.scenes.map(
                        (s) => html`
                          <button class="scene-chip" @click=${() => this._scene(s.entity)}>
                            ${s.name}
                          </button>
                        `,
                      )}
                    </div>`
                  : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-lights-modal', HubLightsModal);
```

- [ ] **Step 9: Rework the Hem page grid**

In `src/hub/pages/hub-home-page.ts`:

1. Replace the import `import '../widgets/hub-room-tile.js';` with `import '../widgets/hub-lighting-tile.js';`.
2. In the CSS, rename the `.rooms` rule to `.widgets` (same properties) and add below it:

```css
.widgets .cal {
  grid-column: span 2;
}
```

3. In the `@media (max-width: 1400px)` block, change the `.rooms` selector to `.widgets`.
4. In `render()`, replace the `.rooms` div:

```ts
<div class="widgets">
  <hub-lighting-tile .hass=${this.hass} .config=${cfg}></hub-lighting-tile>
</div>
```

(Later tasks append their widgets inside this div; the `cal` class lands in Task 9.)

- [ ] **Step 10: Wire the modal into glass-hub**

In `src/hub/glass-hub.ts`:

1. Add import: `import './widgets/hub-lights-modal.js';`
2. Add state: `@state() private _openLights = false;`
3. In `connectedCallback` add, and in `disconnectedCallback` remove:
   `this.addEventListener('hub-lights-open', this._onLightsOpen);`
4. Add handler next to `_onTransitOpen`:

```ts
private _onLightsOpen = (): void => {
  this._openLights = true;
};
```

5. In `_onPopupClose` add `this._openLights = false;`
6. In `render()`, next to the other popups:

```ts
${this._openLights
  ? html`<hub-lights-modal .hass=${this.hass} .config=${this._cfg}></hub-lights-modal>`
  : nothing}
```

- [ ] **Step 11: Full test + build**

Run: `npm test && npm run build`
Expected: all tests pass, bundle builds. If `hub-home-widgets.test.ts` or `hub-lights-page.test.ts` referenced the removed room grid on Hem, update those expectations (Ljus page room tiles are untouched — only Hem changed).

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat(hub): compact lighting tile + all-lights modal replace Hem room grid"
```

---

### Task 7: Roborock vacuum card + popup

**Files:**
- Modify: `glass-cards/src/hub/hub-config.ts` (add `HubVacuumControls`)
- Create: `glass-cards/src/hub/widgets/hub-vacuum-card.ts`
- Create: `glass-cards/src/hub/widgets/hub-vacuum-popup.ts`
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts` (add card)
- Modify: `glass-cards/src/hub/glass-hub.ts` (wiring)
- Modify: `glass-cards/scripts/hub-config.mjs` (vacuum_controls block)

**Interfaces:**
- Consumes: `popupStyles`, `icons.close`, `icons.vacuum` (exists — used by home chips), `HubConfig.vacuum_entity` (exists).
- Produces: event `hub-vacuum-open`; `HubVacuumControls` interface; config key `vacuum_controls`.

- [ ] **Step 1: Extend the config types**

In `src/hub/hub-config.ts`, add above `HubConfig`:

```ts
export interface HubVacuumControls {
  status_entity: string;            // sensor.roborock_s8_status (rich state text)
  battery_entity: string;           // sensor.roborock_s8_batteri
  current_room_entity?: string;     // sensor.roborock_s8_nuvarande_rum
  full_button: string;              // button.roborock_s8_full_cleaning
  room_buttons: { entity: string; name: string }[];
  mop_mode_entity?: string;         // select.roborock_s8_mopplage
  mop_intensity_entity?: string;    // select.roborock_s8_moppintensitet
  consumables?: { entity: string; name: string }[];
}
```

and inside `HubConfig` after `vacuum_entity?: string;`:

```ts
vacuum_controls?: HubVacuumControls;
```

- [ ] **Step 2: Create the vacuum card**

Create `src/hub/widgets/hub-vacuum-card.ts` — same card skeleton as `hub-lighting-tile` (host block height 100%, `.card` column with `.ic` + `.label`/`.sub`, active scale). Differences only:

```ts
import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

const STATE_LABELS: Record<string, string> = {
  docked: 'Dockad',
  cleaning: 'Städar',
  returning: 'Åker hem',
  paused: 'Pausad',
  error: 'Fel',
  idle: 'Väntar',
};

export class HubVacuumCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .card.err { border-color: var(--hub-coral-border); background: var(--hub-coral-bg); }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .card.active .ic { color: var(--hub-teal); }
      .card.err .ic { color: var(--hub-coral); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `,
  ];

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-vacuum-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config) return html``;
    const vac = this.config.vacuum_entity ? this.getEntity(this.config.vacuum_entity) : undefined;
    const vc = this.config.vacuum_controls;
    const batt = vc?.battery_entity ? this.getEntity(vc.battery_entity)?.state : undefined;
    const state = vac?.state ?? 'unknown';
    const label = STATE_LABELS[state] ?? '–';
    const busy = state === 'cleaning' || state === 'returning';
    const sub = batt && !Number.isNaN(Number(batt)) ? `${label} · ${batt}%` : label;
    return html`
      <div
        class="card ${busy ? 'active' : ''} ${state === 'error' ? 'err' : ''}"
        role="button"
        tabindex="0"
        aria-label="Visa dammsugaren"
        @click=${this._open}
      >
        <span class="ic">${icons.vacuum}</span>
        <div>
          <b class="label">Roborock</b>
          <span class="sub">${sub}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-vacuum-card', HubVacuumCard);
```

(If `--hub-teal` isn't a defined token, check `tokens.ts` for the media/teal color var name and use that.)

- [ ] **Step 3: Create the vacuum popup**

Create `src/hub/widgets/hub-vacuum-popup.ts`:

```ts
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

export class HubVacuumPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .status {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 16px;
      }
      .state {
        font: 500 18px var(--hub-font-display);
        color: var(--hub-text);
      }
      .batt {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active {
        transform: scale(0.97);
      }
      .act.primary {
        grid-column: span 2;
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
        border-color: transparent;
      }
      .sect {
        margin-top: 18px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .chip.sel {
        background: var(--hub-teal-bg);
        border-color: transparent;
        color: var(--hub-teal);
      }
      .cons {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cons-row {
        display: flex;
        justify-content: space-between;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _press(entity: string): void {
    this.callService('button', 'press', undefined, entity);
  }

  private _vac(service: string): void {
    if (this.config.vacuum_entity) this.callService('vacuum', service, undefined, this.config.vacuum_entity);
  }

  private _selectOption(entity: string, option: string): void {
    this.callService('select', 'select_option', { option }, entity);
  }

  private _selectChips(entity: string | undefined) {
    if (!entity) return nothing;
    const ent = this.getEntity(entity);
    const options = (ent?.attributes.options as string[] | undefined) ?? [];
    if (!options.length) return nothing;
    return html`<div class="chips">
      ${options.map(
        (o) => html`
          <button class="chip ${ent?.state === o ? 'sel' : ''}" @click=${() => this._selectOption(entity, o)}>
            ${o}
          </button>
        `,
      )}
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const vc = this.config.vacuum_controls;
    const vac = this.config.vacuum_entity ? this.getEntity(this.config.vacuum_entity) : undefined;
    const state = vac?.state ?? 'unknown';
    const statusText = vc?.status_entity ? this.getEntity(vc.status_entity)?.state : state;
    const batt = vc?.battery_entity ? this.getEntity(vc.battery_entity)?.state : undefined;
    const room = vc?.current_room_entity ? this.getEntity(vc.current_room_entity)?.state : undefined;
    const busy = state === 'cleaning';
    const paused = state === 'paused';
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Roborock">
          <div class="head">
            <span class="title">Roborock</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>
              ${icons.close}
            </button>
          </div>
          <div class="status">
            <span class="state">${statusText ?? '–'}${busy && room ? ` · ${room}` : ''}</span>
            ${batt ? html`<span class="batt">${batt}%</span>` : nothing}
          </div>
          <div class="actions">
            ${busy || paused
              ? html`
                  <button class="act" @click=${() => this._vac(paused ? 'start' : 'pause')}>
                    ${paused ? 'Fortsätt' : 'Pausa'}
                  </button>
                  <button class="act" @click=${() => this._vac('return_to_base')}>Åk hem</button>
                `
              : html`
                  ${vc?.full_button
                    ? html`<button class="act primary" @click=${() => this._press(vc.full_button)}>
                        Städa allt
                      </button>`
                    : nothing}
                  ${(vc?.room_buttons ?? []).map(
                    (b) => html`
                      <button class="act" @click=${() => this._press(b.entity)}>${b.name}</button>
                    `,
                  )}
                `}
          </div>
          ${vc?.mop_mode_entity
            ? html`<div class="sect">Mopläge</div>${this._selectChips(vc.mop_mode_entity)}`
            : nothing}
          ${vc?.mop_intensity_entity
            ? html`<div class="sect">Moppintensitet</div>${this._selectChips(vc.mop_intensity_entity)}`
            : nothing}
          ${vc?.consumables?.length
            ? html`<div class="sect">Förbrukning</div>
                <div class="cons">
                  ${vc.consumables.map((c) => {
                    const e = this.getEntity(c.entity);
                    const unit = (e?.attributes.unit_of_measurement as string | undefined) ?? '';
                    return html`<div class="cons-row">
                      <span>${c.name}</span><span>${e?.state ?? '–'} ${unit}</span>
                    </div>`;
                  })}
                </div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-vacuum-popup', HubVacuumPopup);
```

- [ ] **Step 4: Add config block**

In `scripts/hub-config.mjs`, after `vacuum_entity: 'vacuum.roborock_s8',` add:

```js
vacuum_controls: {
  status_entity: 'sensor.roborock_s8_status',
  battery_entity: 'sensor.roborock_s8_batteri',
  current_room_entity: 'sensor.roborock_s8_nuvarande_rum',
  full_button: 'button.roborock_s8_full_cleaning',
  room_buttons: [
    { entity: 'button.roborock_s8_living_room', name: 'Vardagsrum' },
    { entity: 'button.roborock_s8_kitchen', name: 'Kök' },
    { entity: 'button.roborock_s8_bedroom', name: 'Sovrum' },
    { entity: 'button.roborock_s8_hall', name: 'Hall' },
  ],
  mop_mode_entity: 'select.roborock_s8_mopplage',
  mop_intensity_entity: 'select.roborock_s8_moppintensitet',
  consumables: [
    { entity: 'sensor.roborock_s8_huvudborste_tid_kvar', name: 'Huvudborste' },
    { entity: 'sensor.roborock_s8_sidoborste_tid_kvar', name: 'Sidoborste' },
    { entity: 'sensor.roborock_s8_filtertid_kvar', name: 'Filter' },
    { entity: 'sensor.roborock_s8_sensortid_kvar', name: 'Sensorer' },
  ],
},
```

- [ ] **Step 5: Wire into home page and glass-hub**

`src/hub/pages/hub-home-page.ts`: add `import '../widgets/hub-vacuum-card.js';` and inside `.widgets` after the lighting tile:

```ts
<hub-vacuum-card .hass=${this.hass} .config=${cfg}></hub-vacuum-card>
```

`src/hub/glass-hub.ts`: same wiring pattern as Task 6 step 10, with `_openVacuum` / event `hub-vacuum-open` / `import './widgets/hub-vacuum-popup.js';` and:

```ts
${this._openVacuum
  ? html`<hub-vacuum-popup .hass=${this.hass} .config=${this._cfg}></hub-vacuum-popup>`
  : nothing}
```

Also: in `hub-home-page.ts` `_chips`, make the vacuum chip clickable to the popup by changing its descriptor to include dispatching — replace the chips' `@click` guard usage: give the vacuum chip `goto: undefined` but add an `open?: () => void` field to `ChipDescriptor`, set it for the vacuum chip to dispatch `hub-vacuum-open`, and in the chip render use `@click=${c.open ?? (c.goto ? () => this._gotoPage(c.goto!) : nothing)}`.

- [ ] **Step 6: Test, build, commit**

Run: `npm test && npm run build`
Expected: green + bundle builds.

```bash
git add -A && git commit -m "feat(hub): Roborock card + popup — per-room clean, mop settings, consumables"
```

---

### Task 8: Todo model + card + popup

**Files:**
- Create: `glass-cards/src/hub/todo-model.ts`
- Create: `glass-cards/src/hub/widgets/hub-todo-card.ts`
- Create: `glass-cards/src/hub/widgets/hub-todo-popup.ts`
- Modify: `glass-cards/src/hub/hub-config.ts` (`todo_entity?: string`)
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts`, `glass-cards/src/hub/glass-hub.ts`, `glass-cards/scripts/hub-config.mjs`
- Test: `glass-cards/test/todo-model.test.ts`

**Interfaces:**
- Consumes: `popupStyles`, `icons.close`.
- Produces: event `hub-todo-open`; `TodoItem { uid: string; summary: string; status: 'needs_action' | 'completed' }`; `shapeTodo(items: TodoItem[] | null | undefined): { open: TodoItem[]; done: TodoItem[] }`; `fetchTodoItems(hass, entityId): Promise<TodoItem[] | null>`; config key `todo_entity`.

- [ ] **Step 1: Write failing tests**

Create `test/todo-model.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shapeTodo, type TodoItem } from '../src/hub/todo-model';

const item = (over: Partial<TodoItem>): TodoItem => ({
  uid: 'u1',
  summary: 'Handla',
  status: 'needs_action',
  ...over,
});

describe('shapeTodo', () => {
  it('splits open and done, preserving list order', () => {
    const items = [
      item({ uid: 'a', summary: 'Första' }),
      item({ uid: 'b', summary: 'Klar', status: 'completed' }),
      item({ uid: 'c', summary: 'Andra' }),
    ];
    const out = shapeTodo(items);
    expect(out.open.map((i) => i.uid)).toEqual(['a', 'c']);
    expect(out.done.map((i) => i.uid)).toEqual(['b']);
  });

  it('handles null/undefined as empty', () => {
    expect(shapeTodo(null)).toEqual({ open: [], done: [] });
    expect(shapeTodo(undefined)).toEqual({ open: [], done: [] });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run test/todo-model.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the model**

Create `src/hub/todo-model.ts`:

```ts
import type { HomeAssistant } from '../types.js';

export interface TodoItem {
  uid: string;
  summary: string;
  status: 'needs_action' | 'completed';
}

/** Split a todo list into open/done, preserving the list's own order. */
export function shapeTodo(items: TodoItem[] | null | undefined): {
  open: TodoItem[];
  done: TodoItem[];
} {
  const list = items ?? [];
  return {
    open: list.filter((i) => i.status === 'needs_action'),
    done: list.filter((i) => i.status === 'completed'),
  };
}

interface GetItemsResponse {
  response?: Record<string, { items?: TodoItem[] }>;
}

/** One-shot todo.get_items over the websocket. Errors resolve to null. */
export async function fetchTodoItems(
  hass: HomeAssistant,
  entityId: string,
): Promise<TodoItem[] | null> {
  try {
    const resp = await hass.callWS<GetItemsResponse>({
      type: 'call_service',
      domain: 'todo',
      service: 'get_items',
      service_data: {},
      target: { entity_id: entityId },
      return_response: true,
    });
    return resp?.response?.[entityId]?.items ?? [];
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/todo-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Create the todo card**

Create `src/hub/widgets/hub-todo-card.ts`. Refetch strategy: the todo entity's state IS the open-item count, so refetch whenever that state string changes (cheap, race-free):

```ts
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
```

- [ ] **Step 6: Create the todo popup**

Create `src/hub/widgets/hub-todo-popup.ts` — popupStyles shell (scrim/card/head/title/close exactly as in `hub-lights-modal`), title "Att göra", content:

```ts
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
```

- [ ] **Step 7: Config + wiring**

1. `src/hub/hub-config.ts`: add `todo_entity?: string;` to `HubConfig`.
2. `scripts/hub-config.mjs`: add `todo_entity: 'todo.att_gora',` (use the actual slug recorded in Task 2).
3. `hub-home-page.ts`: `import '../widgets/hub-todo-card.js';`, append `<hub-todo-card .hass=${this.hass} .config=${cfg}></hub-todo-card>` inside `.widgets`.
4. `glass-hub.ts`: wiring pattern from Task 6 step 10 with `_openTodo` / `hub-todo-open` / `hub-todo-popup`.

- [ ] **Step 8: Test, build, commit**

Run: `npm test && npm run build`
Expected: green.

```bash
git add -A && git commit -m "feat(hub): Att göra — todo model, Hem card with quick-complete, popup with add/clear"
```

---

### Task 9: Calendar model + card + popup with event creation

**Files:**
- Create: `glass-cards/src/hub/calendar-model.ts`
- Create: `glass-cards/src/hub/widgets/hub-calendar-card.ts`
- Create: `glass-cards/src/hub/widgets/hub-calendar-popup.ts`
- Modify: `glass-cards/src/hub/hub-config.ts` (`HubCalendarConfig`)
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts`, `glass-cards/src/hub/glass-hub.ts`, `glass-cards/scripts/hub-config.mjs`
- Test: `glass-cards/test/calendar-model.test.ts`

**Interfaces:**
- Consumes: `popupStyles`, `icons.close`; calendar entities from Tasks 3–4.
- Produces: event `hub-calendar-open`;
  - `RawCalEvent { summary?: string; start?: string; end?: string }`
  - `HubCalEvent { title: string; start: string; end: string; allDay: boolean; sources: string[] }`
  - `mergeEvents(byEntity: Record<string, RawCalEvent[]>): HubCalEvent[]`
  - `dedupeKey(summary: string, start: string): string`
  - `startMs(start: string): number`
  - `dayLabel(start: string, now: Date): string` ("Idag" / "Imorgon" / "ons 24/7")
  - `fetchMergedEvents(hass, entities: string[], days?: number): Promise<HubCalEvent[] | null>` (5-min cache)
  - `clearCalendarCache(): void`
  - `HubCalendarConfig { entities: string[]; create_entity: string }`, config key `calendar`.

- [ ] **Step 1: Write failing tests**

Create `test/calendar-model.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeEvents, dedupeKey, startMs, dayLabel, type RawCalEvent } from '../src/hub/calendar-model';

const ev = (over: Partial<RawCalEvent>): RawCalEvent => ({
  summary: 'Middag',
  start: '2026-07-23T18:00:00+02:00',
  end: '2026-07-23T19:00:00+02:00',
  ...over,
});

describe('mergeEvents', () => {
  it('collapses the same event present in both calendars and records both sources', () => {
    const out = mergeEvents({
      'calendar.google': [ev({})],
      'calendar.icloud': [ev({})],
    });
    expect(out).toHaveLength(1);
    expect(out[0].sources.sort()).toEqual(['calendar.google', 'calendar.icloud']);
  });

  it('dedupes across differing timezone offsets for the same instant', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ start: '2026-07-23T18:00:00+02:00' })],
      'calendar.icloud': [ev({ start: '2026-07-23T16:00:00+00:00' })],
    });
    expect(out).toHaveLength(1);
  });

  it('dedupe is case- and whitespace-insensitive on the title', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ summary: ' middag ' })],
      'calendar.icloud': [ev({ summary: 'Middag' })],
    });
    expect(out).toHaveLength(1);
  });

  it('keeps events with the same title at different times', () => {
    const out = mergeEvents({
      'calendar.google': [ev({}), ev({ start: '2026-07-24T18:00:00+02:00' })],
    });
    expect(out).toHaveLength(2);
  });

  it('flags date-only events as all-day and sorts them before timed events that day', () => {
    const out = mergeEvents({
      'calendar.icloud': [ev({}), ev({ summary: 'Semester', start: '2026-07-23', end: '2026-07-24' })],
    });
    expect(out[0].title).toBe('Semester');
    expect(out[0].allDay).toBe(true);
    expect(out[1].allDay).toBe(false);
  });

  it('drops events without summary or start', () => {
    const out = mergeEvents({ 'calendar.x': [ev({ summary: undefined }), ev({ start: undefined })] });
    expect(out).toHaveLength(0);
  });

  it('sorts by start time across calendars', () => {
    const out = mergeEvents({
      'calendar.google': [ev({ summary: 'Sen', start: '2026-07-25T10:00:00+02:00' })],
      'calendar.icloud': [ev({ summary: 'Tidig', start: '2026-07-23T08:00:00+02:00' })],
    });
    expect(out.map((e) => e.title)).toEqual(['Tidig', 'Sen']);
  });
});

describe('dedupeKey / startMs', () => {
  it('truncates timed starts to the minute', () => {
    expect(dedupeKey('X', '2026-07-23T18:00:10+02:00')).toBe(dedupeKey('X', '2026-07-23T18:00:40+02:00'));
  });
  it('keeps all-day keys on the raw date', () => {
    expect(dedupeKey('X', '2026-07-23')).not.toBe(dedupeKey('X', '2026-07-24'));
  });
  it('startMs parses date-only as local midnight', () => {
    expect(startMs('2026-07-23')).toBe(new Date(2026, 6, 23).getTime());
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 6, 22, 12, 0); // wed 22 july
  it('labels today and tomorrow', () => {
    expect(dayLabel('2026-07-22T18:00:00+02:00', now)).toBe('Idag');
    expect(dayLabel('2026-07-23', now)).toBe('Imorgon');
  });
  it('labels later days with weekday + date', () => {
    expect(dayLabel('2026-07-24T09:00:00+02:00', now)).toBe('fre 24/7');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run test/calendar-model.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the model**

Create `src/hub/calendar-model.ts`:

```ts
import type { HomeAssistant } from '../types.js';

/**
 * Merged Apple+Google agenda. Events are fetched per-entity via
 * calendar.get_events (WS, return_response), merged, and deduped: an invite
 * that lands in both accounts appears once, with both entities in `sources`.
 */

export interface RawCalEvent {
  summary?: string;
  start?: string; // ISO datetime with offset, or YYYY-MM-DD for all-day
  end?: string;
}

export interface HubCalEvent {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  sources: string[];
}

/** Date-only starts parse as LOCAL midnight (new Date('YYYY-MM-DD') would be UTC). */
export function startMs(start: string): number {
  if (!start.includes('T')) {
    const [y, m, d] = start.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return new Date(start).getTime();
}

/** Same normalized title + same instant (minute precision) ⇒ duplicate. */
export function dedupeKey(summary: string, start: string): string {
  const t = summary.trim().toLowerCase();
  if (!start.includes('T')) return `${t}|${start}`;
  return `${t}|${Math.floor(new Date(start).getTime() / 60000)}`;
}

export function mergeEvents(byEntity: Record<string, RawCalEvent[]>): HubCalEvent[] {
  const map = new Map<string, HubCalEvent>();
  for (const [entity, events] of Object.entries(byEntity)) {
    for (const ev of events ?? []) {
      if (!ev?.summary || !ev.start) continue;
      const key = dedupeKey(ev.summary, ev.start);
      const hit = map.get(key);
      if (hit) {
        if (!hit.sources.includes(entity)) hit.sources.push(entity);
        continue;
      }
      map.set(key, {
        title: ev.summary.trim(),
        start: ev.start,
        end: ev.end ?? ev.start,
        allDay: !ev.start.includes('T'),
        sources: [entity],
      });
    }
  }
  return [...map.values()].sort((a, b) => startMs(a.start) - startMs(b.start));
}

const WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tors', 'fre', 'lör'];

/** "Idag" / "Imorgon" / "fre 24/7" for an event start, relative to `now`. */
export function dayLabel(start: string, now: Date): string {
  const d = new Date(startMs(start));
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const evDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((evDay - day0) / 86_400_000);
  if (diff === 0) return 'Idag';
  if (diff === 1) return 'Imorgon';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

const TTL_MS = 5 * 60_000;
let cache: { key: string; at: number; data: HubCalEvent[] } | null = null;

interface GetEventsResponse {
  response?: Record<string, { events?: RawCalEvent[] }>;
}

export async function fetchMergedEvents(
  hass: HomeAssistant,
  entities: string[],
  days = 7,
): Promise<HubCalEvent[] | null> {
  if (!entities.length) return [];
  const key = entities.join(',');
  if (cache && cache.key === key && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const start = new Date();
    const end = new Date(start.getTime() + days * 86_400_000);
    const resp = await hass.callWS<GetEventsResponse>({
      type: 'call_service',
      domain: 'calendar',
      service: 'get_events',
      service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() },
      target: { entity_id: entities },
      return_response: true,
    });
    const byEntity: Record<string, RawCalEvent[]> = {};
    for (const id of entities) byEntity[id] = resp?.response?.[id]?.events ?? [];
    const merged = mergeEvents(byEntity);
    cache = { key, at: Date.now(), data: merged };
    return merged;
  } catch {
    return null;
  }
}

export function clearCalendarCache(): void {
  cache = null;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/calendar-model.test.ts`
Expected: PASS. Also run the whole suite once: `npm test`.

- [ ] **Step 5: Config types + values**

1. `src/hub/hub-config.ts`:

```ts
export interface HubCalendarConfig {
  entities: string[];    // all calendars merged into the agenda
  create_entity: string; // iCloud calendar that receives new events
}
```

and in `HubConfig`: `calendar?: HubCalendarConfig;`

2. `scripts/hub-config.mjs` (use the entity IDs recorded in Tasks 3–4):

```js
calendar: {
  entities: ['<calendar.google-primary>', '<calendar.icloud-primary>'],
  create_entity: '<calendar.icloud-primary>',
},
```

- [ ] **Step 6: Create the calendar card**

Create `src/hub/widgets/hub-calendar-card.ts`:

```ts
import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { fetchMergedEvents, dayLabel, type HubCalEvent } from '../calendar-model.js';
import type { HubConfig } from '../hub-config.js';

const SHOW = 3;
const POLL_MS = 5 * 60_000;

export class HubCalendarCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _events: HubCalEvent[] | null = null;
  private _timer?: number;

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 7px;
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
      .row { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
      .when {
        flex-shrink: 0; width: 96px;
        font: 600 12.5px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted));
      }
      .what {
        flex: 1; min-width: 0;
        font: 500 13.5px var(--hub-font-body); color: var(--hub-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    void this._refresh();
    this._timer = window.setInterval(() => void this._refresh(), POLL_MS);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer !== undefined) clearInterval(this._timer);
  }

  private async _refresh(): Promise<void> {
    const cal = this.config?.calendar;
    if (!this.hass || !cal?.entities?.length) return;
    const events = await fetchMergedEvents(this.hass, cal.entities);
    if (events) this._events = events;
  }

  private _when(ev: HubCalEvent): string {
    const day = dayLabel(ev.start, new Date());
    if (ev.allDay) return day;
    const t = new Date(ev.start);
    const hm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return `${day} ${hm}`;
  }

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-calendar-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config?.calendar) return html``;
    const upcoming = (this._events ?? []).slice(0, SHOW);
    return html`
      <div class="card" role="button" tabindex="0" aria-label="Visa kalendern" @click=${this._open}>
        <b class="label">Kalender</b>
        ${upcoming.length === 0
          ? html`<span class="empty">Inga händelser på 7 dagar</span>`
          : upcoming.map(
              (ev) => html`
                <div class="row">
                  <span class="when">${this._when(ev)}</span>
                  <span class="what">${ev.title}</span>
                </div>
              `,
            )}
      </div>
    `;
  }
}

customElements.define('hub-calendar-card', HubCalendarCard);
```

- [ ] **Step 7: Create the calendar popup**

Create `src/hub/widgets/hub-calendar-popup.ts` — popupStyles shell, 7-day agenda grouped by day label + a "Nytt" create form:

```ts
import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import {
  fetchMergedEvents,
  clearCalendarCache,
  dayLabel,
  type HubCalEvent,
} from '../calendar-model.js';
import type { HubConfig } from '../hub-config.js';

const DUR_OPTIONS = [
  { label: '30 min', min: 30 },
  { label: '1 tim', min: 60 },
  { label: '2 tim', min: 120 },
  { label: 'Heldag', min: 0 },
];

export class HubCalendarPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;
  @state() private _events: HubCalEvent[] | null = null;
  @state() private _creating = false;
  @state() private _saving = false;
  @state() private _durMin = 60;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .new-btn {
        min-height: 48px; padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .day {
        margin-top: 16px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .ev { display: flex; align-items: baseline; gap: 12px; min-height: 40px; }
      .when { flex-shrink: 0; width: 52px; font: 600 13px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted)); }
      .what { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .src { flex-shrink: 0; font: 500 11px var(--hub-font-body); color: var(--hub-text-dim); }
      .empty { margin-top: 14px; font: 500 13.5px var(--hub-font-body); color: var(--hub-text-dim); }
      .form { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
      .form input {
        height: 48px; padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
        color-scheme: dark light;
      }
      .form .row2 { display: flex; gap: 10px; }
      .form .row2 input { flex: 1; min-width: 0; }
      .durs { display: flex; gap: 8px; flex-wrap: wrap; }
      .dur {
        min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dur.sel {
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        border-color: transparent;
        color: var(--hub-lavender, var(--hub-text));
      }
      .save {
        min-height: 48px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .save[disabled] { opacity: 0.5; }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    void this._refresh();
  }

  private async _refresh(): Promise<void> {
    const cal = this.config?.calendar;
    if (!this.hass || !cal?.entities?.length) return;
    const events = await fetchMergedEvents(this.hass, cal.entities);
    if (events) this._events = events;
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  private _input(sel: string): HTMLInputElement | null {
    return this.shadowRoot?.querySelector(sel) ?? null;
  }

  private async _save(): Promise<void> {
    const cal = this.config?.calendar;
    const title = this._input('.f-title')?.value.trim();
    const date = this._input('.f-date')?.value;
    const time = this._input('.f-time')?.value;
    if (!cal || !title || !date) return;
    this._saving = true;
    const data: Record<string, string> = { summary: title };
    if (this._durMin === 0 || !time) {
      const next = new Date(new Date(`${date}T00:00:00`).getTime() + 86_400_000);
      data.start_date = date;
      data.end_date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    } else {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + this._durMin * 60_000);
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
      data.start_date_time = iso(start);
      data.end_date_time = iso(end);
    }
    try {
      await this.hass?.callService('calendar', 'create_event', data, {
        entity_id: cal.create_entity,
      });
      clearCalendarCache();
      await this._refresh();
      this._creating = false;
    } finally {
      this._saving = false;
    }
  }

  private _grouped(): Map<string, HubCalEvent[]> {
    const now = new Date();
    const groups = new Map<string, HubCalEvent[]>();
    for (const ev of this._events ?? []) {
      const label = dayLabel(ev.start, now);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(ev);
    }
    return groups;
  }

  private _hm(ev: HubCalEvent): string {
    if (ev.allDay) return 'Heldag';
    const t = new Date(ev.start);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }

  render() {
    if (!this.hass || !this.config?.calendar) return html``;
    const today = new Date();
    const dateDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const groups = this._grouped();
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Kalender">
          <div class="head">
            <span class="title">Kalender</span>
            <button class="new-btn" @click=${() => (this._creating = !this._creating)}>
              ${this._creating ? 'Avbryt' : 'Nytt'}
            </button>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          ${this._creating
            ? html`<div class="form">
                <input class="f-title" placeholder="Vad händer?" />
                <div class="row2">
                  <input class="f-date" type="date" value=${dateDefault} />
                  <input class="f-time" type="time" value="12:00" />
                </div>
                <div class="durs">
                  ${DUR_OPTIONS.map(
                    (d) => html`
                      <button class="dur ${this._durMin === d.min ? 'sel' : ''}" @click=${() => (this._durMin = d.min)}>
                        ${d.label}
                      </button>
                    `,
                  )}
                </div>
                <button class="save" ?disabled=${this._saving} @click=${() => this._save()}>
                  ${this._saving ? 'Sparar…' : 'Spara'}
                </button>
              </div>`
            : nothing}
          ${groups.size === 0
            ? html`<div class="empty">Inga händelser de närmaste 7 dagarna</div>`
            : [...groups.entries()].map(
                ([label, evs]) => html`
                  <div class="day">${label}</div>
                  ${evs.map(
                    (ev) => html`
                      <div class="ev">
                        <span class="when">${this._hm(ev)}</span>
                        <span class="what">${ev.title}</span>
                        ${ev.sources.length > 1 ? html`<span class="src">båda</span>` : nothing}
                      </div>
                    `,
                  )}
                `,
              )}
        </div>
      </div>
    `;
  }
}

customElements.define('hub-calendar-popup', HubCalendarPopup);
```

- [ ] **Step 8: Wire into home page and glass-hub**

1. `hub-home-page.ts`: `import '../widgets/hub-calendar-card.js';`, and inside `.widgets` add `<hub-calendar-card class="cal" .hass=${this.hass} .config=${cfg}></hub-calendar-card>` **before** the todo card so the DOM order is lighting, (car), vacuum, calendar, todo — matching the `.cal { grid-column: span 2 }` layout.
2. `glass-hub.ts`: wiring pattern from Task 6 step 10 with `_openCalendar` / `hub-calendar-open` / `hub-calendar-popup`.

- [ ] **Step 9: Test, build, commit**

Run: `npm test && npm run build`
Expected: green.

```bash
git add -A && git commit -m "feat(hub): merged Apple+Google calendar — dedupe model, Hem agenda card, popup with event creation"
```

---

### Task 10: Volvo car card + popup

**Files:**
- Modify: `glass-cards/src/hub/hub-config.ts` (`HubVolvoConfig`)
- Create: `glass-cards/src/hub/widgets/hub-car-card.ts`
- Create: `glass-cards/src/hub/widgets/hub-car-popup.ts`
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts`, `glass-cards/src/hub/glass-hub.ts`, `glass-cards/scripts/hub-config.mjs`
- Modify: `glass-cards/src/hub/widgets/icons.ts` (add `car`)

**Interfaces:**
- Consumes: `popupStyles`, `icons.close`; entity IDs from `.claude/ha-volvo-entities.txt` (Task 5).
- Produces: event `hub-car-open`; `HubVolvoConfig`; config key `volvo`; `icons.car`.

- [ ] **Step 1: Config types**

In `src/hub/hub-config.ts`:

```ts
export interface HubVolvoConfig {
  name?: string;                   // display name, default "Volvo"
  battery_entity?: string;         // battery charge level %
  range_entity?: string;           // electric range km
  lock_entity?: string;            // lock.<car>...
  charging_entity?: string;        // charging status sensor
  climate_entity?: string;         // switch.* (toggle) or button.* (press) for climatization
  climate_stop_entity?: string;    // optional separate stop button
  odometer_entity?: string;
  doors?: { entity: string; name: string }[]; // binary sensors: on = open
}
```

and in `HubConfig`: `volvo?: HubVolvoConfig;`

- [ ] **Step 2: Add the car icon**

In `src/hub/widgets/icons.ts` add (same entry shape as the rest):

```ts
car: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"></path><path d="M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1"></path><path d="M3 12v4a1 1 0 0 0 1 1h1"></path><circle cx="7.5" cy="16.5" r="1.7"></circle><circle cx="16.5" cy="16.5" r="1.7"></circle><path d="M9.2 17h5.6"></path></svg>`,
```

- [ ] **Step 3: Create the car card**

Create `src/hub/widgets/hub-car-card.ts` — same card skeleton as `hub-vacuum-card` (copy its styles verbatim, they're identical):

```ts
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

export class HubCarCard extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    css`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .top-row { display: flex; align-items: center; justify-content: space-between; }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .lock {
        font: 600 11px var(--hub-font-body);
        padding: 3px 8px; border-radius: 6px;
        background: var(--hub-chip-bg); color: var(--hub-text-dim);
        border: 1px solid var(--hub-chip-border);
      }
      .lock.unlocked { background: var(--hub-coral-bg); color: var(--hub-coral); border-color: var(--hub-coral-border); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `,
  ];

  private _open = (): void => {
    this.dispatchEvent(new CustomEvent('hub-car-open', { bubbles: true, composed: true }));
  };

  render() {
    if (!this.hass || !this.config?.volvo) return html``;
    const v = this.config.volvo;
    const batt = v.battery_entity ? this.getEntity(v.battery_entity)?.state : undefined;
    const range = v.range_entity ? this.getEntity(v.range_entity)?.state : undefined;
    const lock = v.lock_entity ? this.getEntity(v.lock_entity)?.state : undefined;
    const charging = v.charging_entity ? this.getEntity(v.charging_entity)?.state : undefined;
    const isCharging = charging === 'charging' || charging === 'Laddar';
    const parts = [
      batt && !Number.isNaN(Number(batt)) ? `${batt}%` : null,
      range && !Number.isNaN(Number(range)) ? `${range} km` : null,
      isCharging ? 'Laddar' : null,
    ].filter(Boolean);
    return html`
      <div class="card" role="button" tabindex="0" aria-label="Visa bilen" @click=${this._open}>
        <div class="top-row">
          <span class="ic">${icons.car}</span>
          ${lock
            ? html`<span class="lock ${lock === 'locked' ? '' : 'unlocked'}">
                ${lock === 'locked' ? 'Låst' : 'Olåst'}
              </span>`
            : nothing}
        </div>
        <div>
          <b class="label">${v.name ?? 'Volvo'}</b>
          <span class="sub">${parts.length ? parts.join(' · ') : '–'}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-car-card', HubCarCard);
```

- [ ] **Step 4: Create the car popup**

Create `src/hub/widgets/hub-car-popup.ts`:

```ts
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import { hubTokens } from '../../styles/tokens.js';
import { popupStyles } from './popup-styles.js';
import { icons } from './icons.js';
import type { HubConfig } from '../hub-config.js';

export class HubCarPopup extends GlassBaseElement {
  @property({ attribute: false }) config!: HubConfig;

  static styles = [
    hubTokens,
    popupStyles,
    css`
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active { transform: scale(0.97); }
      .act.primary { grid-column: span 2; background: var(--hub-teal-bg); color: var(--hub-teal); border-color: transparent; }
      .act.on { background: var(--hub-amber-bg); color: var(--hub-amber-text); border-color: transparent; }
      .grid { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
      .row { display: flex; justify-content: space-between; min-height: 32px; align-items: center; }
      .k { font: 500 13.5px var(--hub-font-body); color: var(--hub-text-muted); }
      .v { font: 600 13.5px var(--hub-font-body); color: var(--hub-text); }
      .v.warn { color: var(--hub-coral); }
    `,
  ];

  private _close(): void {
    this.dispatchEvent(new CustomEvent('hub-popup-close', { bubbles: true, composed: true }));
  }

  private _onScrim = (e: Event): void => {
    if (e.target === e.currentTarget) this._close();
  };

  /** Climate entity can be a switch (toggle) or a button (press). */
  private _climate(): void {
    const ent = this.config.volvo?.climate_entity;
    if (!ent) return;
    if (ent.startsWith('switch.')) this.callService('switch', 'toggle', undefined, ent);
    else this.callService('button', 'press', undefined, ent);
  }

  private _climateStop(): void {
    const ent = this.config.volvo?.climate_stop_entity;
    if (ent) this.callService('button', 'press', undefined, ent);
  }

  private _lockAction(service: 'lock' | 'unlock'): void {
    const ent = this.config.volvo?.lock_entity;
    if (ent) this.callService('lock', service, undefined, ent);
  }

  private _val(entity: string | undefined, suffix = ''): string {
    if (!entity) return '–';
    const e = this.getEntity(entity);
    if (!e || e.state === 'unavailable' || e.state === 'unknown') return '–';
    const unit = suffix || ((e.attributes.unit_of_measurement as string | undefined) ?? '');
    return unit ? `${e.state} ${unit}` : e.state;
  }

  render() {
    if (!this.hass || !this.config?.volvo) return html``;
    const v = this.config.volvo;
    const climateEnt = v.climate_entity ? this.getEntity(v.climate_entity) : undefined;
    const climateOn = climateEnt?.state === 'on';
    const lockState = v.lock_entity ? this.getEntity(v.lock_entity)?.state : undefined;
    return html`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${v.name ?? 'Volvo'}>
          <div class="head">
            <span class="title">${v.name ?? 'Volvo'}</span>
            <button class="close" aria-label="Stäng" @click=${() => this._close()}>${icons.close}</button>
          </div>
          <div class="actions">
            ${v.climate_entity
              ? html`<button class="act primary ${climateOn ? 'on' : ''}" @click=${() => this._climate()}>
                  ${climateOn ? 'Klimat på — stäng av' : 'Starta klimat'}
                </button>`
              : nothing}
            ${v.climate_stop_entity && !v.climate_entity?.startsWith('switch.')
              ? html`<button class="act" style="grid-column: span 2" @click=${() => this._climateStop()}>
                  Stoppa klimat
                </button>`
              : nothing}
            ${v.lock_entity
              ? html`
                  <button class="act" @click=${() => this._lockAction('lock')}>Lås</button>
                  <button class="act" @click=${() => this._lockAction('unlock')}>Lås upp</button>
                `
              : nothing}
          </div>
          <div class="grid">
            <div class="row"><span class="k">Batteri</span><span class="v">${this._val(v.battery_entity, '%')}</span></div>
            <div class="row"><span class="k">Räckvidd</span><span class="v">${this._val(v.range_entity, 'km')}</span></div>
            <div class="row"><span class="k">Laddning</span><span class="v">${this._val(v.charging_entity)}</span></div>
            <div class="row"><span class="k">Lås</span><span class="v ${lockState === 'locked' ? '' : 'warn'}">${lockState === 'locked' ? 'Låst' : lockState === 'unlocked' ? 'Olåst' : '–'}</span></div>
            <div class="row"><span class="k">Mätarställning</span><span class="v">${this._val(v.odometer_entity)}</span></div>
            ${(v.doors ?? []).map((d) => {
              const open = this.getEntity(d.entity)?.state === 'on';
              return html`<div class="row">
                <span class="k">${d.name}</span>
                <span class="v ${open ? 'warn' : ''}">${open ? 'Öppen' : 'Stängd'}</span>
              </div>`;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('hub-car-popup', HubCarPopup);
```

- [ ] **Step 5: Config values + wiring**

1. `scripts/hub-config.mjs`: add a `volvo:` block using the role→entity mapping recorded in `.claude/ha-volvo-entities.txt` (Task 5 step 3). Shape:

```js
volvo: {
  name: 'EX30',                                  // whatever the model is
  battery_entity: '<from discovery>',
  range_entity: '<from discovery>',
  lock_entity: '<from discovery>',
  charging_entity: '<from discovery>',
  climate_entity: '<from discovery>',
  climate_stop_entity: '<from discovery, omit if none>',
  odometer_entity: '<from discovery>',
  doors: [
    { entity: '<from discovery>', name: 'Förardörr' },
    // ... the door/tailgate binary sensors worth showing
  ],
},
```

2. `hub-home-page.ts`: `import '../widgets/hub-car-card.js';`, insert `<hub-car-card .hass=${this.hass} .config=${cfg}></hub-car-card>` between the lighting tile and the vacuum card.
3. `glass-hub.ts`: wiring pattern from Task 6 step 10 with `_openCar` / `hub-car-open` / `hub-car-popup`.

- [ ] **Step 6: Test, build, commit**

Run: `npm test && npm run build`
Expected: green.

```bash
git add -A && git commit -m "feat(hub): Volvo card + popup — battery/range/lock, climate start, doors"
```

---

### Task 11: Responsive sweep — phone + desktop

**Files:**
- Modify: `glass-cards/src/hub/glass-hub.ts` (desktop content cap)
- Modify: `glass-cards/src/hub/pages/hub-home-page.ts` (phone layout)
- Modify: `glass-cards/src/hub/pages/hub-media-page.ts`, `hub-energy-page.ts`, `hub-lights-page.ts`, `hub-kcal-page.ts`, `hub-planner-page.ts` (phone pass)
- Modify: `glass-cards/src/hub/widgets/hub-room-popup.ts`, `hub-light-popup.ts`, `hub-transit-popup.ts`, `hub-weather-popup.ts` (phone sheet retrofit)

**Interfaces:**
- Consumes: nothing new. New popups (Tasks 6–10) already get phone behavior via `popupStyles`.

- [ ] **Step 1: Desktop content cap in glass-hub**

In `glass-hub.ts` styles, after the `.page` rule add:

```css
/* Desktop: cap and center each page's content instead of stretching. */
@media (min-width: 1600px) {
  .page > * {
    display: block;
    max-width: 1560px;
    margin-inline: auto;
  }
}
```

(Each page component is the single child of its `section.page`; `hub-home-page`'s host is `display: flex` — verify with a wide window that `display: block` doesn't break its internal column flex. Its `.page` inner div is the flex column, so it doesn't.)

- [ ] **Step 2: Hem page phone layout**

In `hub-home-page.ts` styles, add at the end:

```css
@media (max-width: 600px) {
  .top {
    flex-direction: column;
  }
  .chips {
    max-width: 100%;
    justify-content: flex-start;
    padding-right: 0;
  }
  .widgets {
    grid-template-columns: 1fr;
  }
  .widgets .cal {
    grid-column: auto;
  }
  .info,
  .bottom {
    flex-direction: column;
    height: auto;
  }
  .info > *,
  .bottom > * {
    height: 104px;
    flex: none;
  }
}
```

- [ ] **Step 3: Retrofit phone-sheet behavior on the four legacy popups**

In each of `hub-room-popup.ts`, `hub-light-popup.ts`, `hub-transit-popup.ts`, `hub-weather-popup.ts`, append to the component's css (do NOT refactor to popupStyles — minimal-risk append):

```css
@media (max-width: 600px) {
  .scrim { padding: 0; }
  .card {
    max-width: none;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
}
```

First check each file's actual class names (`grep -n "scrim\|max-width" src/hub/widgets/hub-weather-popup.ts` etc.) — if a popup uses different shell class names, adapt the selectors to that popup's scrim/card equivalents.

- [ ] **Step 4: Phone pass on the remaining pages**

For each page, add a `@media (max-width: 600px)` block that collapses horizontal layouts to single-column. Known targets (verify selectors in-file before editing):

- `hub-media-page.ts`: `.hero { flex-direction: column; align-items: flex-start; }` and `.tabs { flex-wrap: wrap; }`
- `hub-energy-page.ts`: `.chips { flex-wrap: wrap; }` and `.head-row { flex-wrap: wrap; gap: 10px; }`
- `hub-lights-page.ts`: find the room grid selector (it has a `@media (max-width: 1100px)` block already) and add a 600px block taking it to `grid-template-columns: 1fr;`
- `hub-kcal-page.ts`: it already collapses at 760px — verify at 390px width and only adjust if something overflows.
- `hub-planner-page.ts`: the 7-col week grid already drops to 2 at 900px; add at 600px: `grid-template-columns: 1fr;`

Acceptance criterion for every page: at 390px viewport width there is no horizontal scrolling and no clipped text.

- [ ] **Step 5: Build + browser verification at three widths**

```bash
npm test && npm run build && ./scripts/upload.sh
```

Then verify in a browser (claude-in-chrome or playwright) against `https://home.rutberg.dev/wall-hub/main` — bypass the service worker (DevTools → hard reload, or append `?v=<timestamp>`):
1. 390×844: swipe through all 6 pages — no horizontal overflow (check `document.scrollingElement.scrollWidth <= 390` via JS on each page), popups open full-screen.
2. 1280×800: current tablet layout intact.
3. 1920×1080: content centered/capped, popups centered.

Expected: all three pass; screenshot each width for the record.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(hub): responsive sweep — phone single-column + full-screen sheets, desktop content cap"
```

---

### Task 12: Deploy, live verification, memory update

**Files:**
- Modify: `/Users/philiprutberg/.claude/projects/-Users-philiprutberg-Development-homelab/memory/wall-hub-dashboard-project.md`

- [ ] **Step 1: Final build + deploy**

```bash
cd /Users/philiprutberg/Development/homelab/glass-cards
npm test && npm run build
./scripts/upload.sh
node scripts/deploy.mjs hub
```

Expected: tests green, upload copies bundle into the HA pod, deploy pushes the hub dashboard config (now including `vacuum_controls`, `todo_entity`, `calendar`, `volvo`).

- [ ] **Step 2: Live verification on the real dashboard**

In a browser on `https://home.rutberg.dev/wall-hub/main` (bypass service worker):
1. Hem shows the 3×2 widget grid: Belysning / Volvo / Roborock / Kalender (wide) / Att göra.
2. Lighting tile → modal lists all 6 rooms; toggle one light on/off; "Släck allt" works (turn a light on first).
3. Vacuum popup renders status/battery/mop chips/consumables. Do NOT press clean buttons.
4. Car popup renders battery/range/lock/doors. Do NOT press climate or lock buttons — tell Philip they're ready for him to try.
5. Todo: add "Testa hubben" from the popup, check it off from the Hem card, "Rensa klara".
6. Calendar: card shows merged events; create a test event "Hub-test" today via "Nytt"; confirm it appears in the agenda AND ask Philip to confirm it reached his iPhone calendar; then delete it from the phone (hub has no delete by design).
7. Night automation: already verified in Task 1; confirm `automation.badrum_nattljus_pa` shows `state: on` in HA.

- [ ] **Step 3: Update memory + commit anything outstanding**

Update the memory file's wall-hub line to record round 6 (responsive + car/vacuum/calendar/todo/compact lighting live). Then:

```bash
git status   # expect clean; commit stragglers if any
```

---

## Plan Self-Review (completed)

- **Spec coverage:** responsive → Task 11; Volvo → 5+10; Roborock → 7; todo → 2+8; calendar → 3+4+9; night automation → 1; compact lighting → 6; deploy/verify → 12. ✓
- **Placeholders:** the `<from discovery>` / `<FLOW_ID>` / credential markers are runtime-discovered values with exact discovery commands in earlier steps — not design gaps. ✓
- **Type consistency:** `popupStyles`, `icons.close`, event names (`hub-lights-open`, `hub-vacuum-open`, `hub-todo-open`, `hub-calendar-open`, `hub-car-open`), and model signatures match across tasks. ✓
