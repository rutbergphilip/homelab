# Wall Hub Round 3 — Fit, Lights Redesign, Price Toggle, SL Störningar

**Date:** 2026-07-20
**Status:** Approved
**Scope:** Four improvements to the wall-hub dashboard (`glass-cards/src/hub/`). The AI
assistant ("Jarvis") and further feature ideation are explicitly out of scope — separate
future spec.

## Background

Field-testing on an iPad 12.9″ showed several pages need vertical scrolling to reach all
content; the planned wall panel is smaller (Samsung Galaxy Tab A9+ 11″). The Ljus page is
the worst offender: full-width slider rows per light plus large scene-chip sets make even
two rooms overflow. Interaction on room tiles is also inverted relative to Apple Home
muscle memory (tap opens a popup, hold toggles). The Energi page lacks per-hour detail and
shows only Tibber's price, leaving out grid costs. Finally, SL disturbance info
(störningar) is wanted alongside the existing departures.

## 1. Fit rule (all pages)

- **Design target: 1280×800 CSS viewport** (Galaxy Tab A9+ 11″, 1920×1200 physical,
  landscape, kiosk mode). If content fits there it fits the iPad 12.9″ too.
- Every hub page (Hem, Ljus, Media, Energi, Kcal, Vecka) must render all content with **no
  vertical scrolling** at the target viewport. `overflow-y: auto` remains only as an
  emergency fallback for degenerate states, never as the design.
- Verification: load each page in a browser at exactly 1280×800 and confirm no page
  scrolls. This is an acceptance criterion, not a nice-to-have.
- Pages that overflow are fixed by layout redesign (Ljus, below) or by tightening
  spacing/typography — not by shrinking content into illegibility.

## 2. Ljus page — sectioned tile grid

Replace the room-card + slider-row layout with an Apple-Home-style tile grid.

### New widget: `hub-light-tile`

- Compact row-tile, ~52 px tall: icon chip left (amber fill when on), light name, state
  text right (`60 %` when on with brightness, `På` without, `Av` when off).
- **Tap** → `light.toggle` on that entity, with a brief press-flash.
- **Hold (500 ms)** → opens a light popup containing the existing
  `glass-light-slider` for drag-to-dim. Uses the same long-press pattern as
  `hub-room-tile` today (drag-slop cancel via `isDrag`, suppressed click after
  long-press).
- Unavailable/unknown lights render as dimmed non-interactive tiles labelled
  "Ej tillgänglig".

### Page layout

- Rooms become lightweight **sections**: heading row (room name + summary line, e.g.
  "2 tända · 60 %") over a vertical stack of light tiles. No card frames around rooms.
- Sections flow in a **3-column layout** (CSS columns or explicit grid) so all 6 rooms /
  20 lights fit 1280×800 without scrolling.
- Per-room scene chips are **removed from the page**; they move into the room popup
  (see §3). The header keeps its global scene actions and the two-stage "Allt släckt"
  guard unchanged.
- `roomLightSummary` / `totalLightsOn` logic is reused as-is.

## 3. Tap/hold swap on room tiles (Hem)

New grammar everywhere: **tap acts, hold reveals.**

- **Tap** on a Hem room tile — asymmetric smart toggle:
  - If any light in the room is on → `light.turn_off` **all** the room's lights.
  - If the room is dark → turn on the room's **`default_lights`** — a new optional
    per-room list in `hub-config.mjs` (falls back to `[main_entity]`). This encodes
    "the lights I actually use" per room.
- **Hold** on a room tile → opens the existing `hub-room-popup`, which now also hosts the
  room's scene chips (moved from the Ljus page).
- Tap gets a quick press-flash so the action visibly registered.
- The same room popup is reachable from the Ljus page room heading (hold), keeping both
  pages consistent.

## 4. Energi — price view toggle + tap-for-detail

### Data

- Extend the REST sensor `sensor.elpris_timserie` (Tibber GraphQL) so each hour carries
  **`energy`** (spot incl. Tibber påslag) alongside the existing `total`. Mirror the
  config block in `.claude/ha-rest-sensors.yaml`; requires HA restart.
- New hub-config constants: `grid: { overforing_ore: 26, energiskatt_ore: 45 }` (from the
  user's Vattenfall contract: överföringsavgift 26,00 öre/kWh, statlig energiskatt
  45,00 öre/kWh). The 100 kr/mån fixed fee is not per-kWh and is excluded.

### Views

- Header toggle chip: **Spot** ↔ **Allt-in**.
  - *Spot* = `energy × 100` öre/kWh.
  - *Allt-in* = Tibber `total` öre + överföring + energiskatt (see double-count gate
    below).
- Default view **Allt-in**; the choice persists in `localStorage`
  (`glass-hub-price-view`), same pattern as the theme override.
- Current-hour label, cheapest contiguous 3 h window, låg/normal/hög level, and the Hem
  energy strip all derive from the **active** view's series so the page stays internally
  consistent.

### Tap-for-detail (touch "hover")

- Tapping a bar shows a floating detail anchored to it: hour range + price in the active
  view, plus a breakdown: Spot / Skatt & moms / Elnät.
- Dismissed by tapping elsewhere or automatically after a few seconds. Only one detail
  open at a time.

### ⚠️ Double-count verification gate

Tibber's API docs claim `total`'s tax part includes Swedish energy tax, but the user's
grid company bills energiskatt on the elnät invoice. During implementation, compare the
sensor's `total` against the Tibber app for the same hour:

- If `total` ≈ spot + påslag + moms only → Allt-in = `total` + 26 + 45.
- If `total` already includes energiskatt → Allt-in = `total` + 26 (and the breakdown
  labels adjust accordingly).

The chosen formula and the evidence must be recorded in the implementation PR.

## 5. SL störningar

### Data

- New REST sensor (`sensor.sl_storningar`) polling SL's open deviations API:
  `https://deviations.integration.sl.se/v1/messages?future=false` with transport-mode
  filters. No API key required. Poll every 5 minutes.
- Monitored traffic:
  - **Tunnelbana Gröna linjen** (lines 17, 18, 19)
  - **Pendeltåg 43** (Nynäshamn–Stockholm C — user boards at Nynäsgård)
  - **Buss 861**
- Sensor state = number of active relevant deviations; attributes = list of
  `{ lines, header, scope, priority }`.
- Filtering/dedupe of the raw API payload to the monitored lines lives in
  `transit-model.ts` as pure functions (vitest-tested); the sensor template stays thin.
- Config mirrored in `.claude/ha-rest-sensors.yaml`.

### UI

- Coral alert rows attached to the Hem page transit card: line badge (e.g. `19`, `43`,
  `861`) + one-line headline per deviation.
- Rendered **only when deviations exist** — zero visual footprint otherwise. If more than
  ~2, collapse to a count row ("3 störningar") to protect the fit rule.

## 6. Config & deployment changes

| File | Change |
|---|---|
| `scripts/hub-config.mjs` | `default_lights` per room; `grid` fee constants; störnings-entity reference |
| `.claude/ha-rest-sensors.yaml` | extended elpris sensor + new SL deviations sensor (mirror) |
| HA `configuration.yaml` | same two sensor changes applied in the pod + restart |
| `src/hub/…` | new `hub-light-tile`, light popup, reworked `hub-lights-page`, `hub-room-tile` tap/hold swap, energy toggle + detail, alert rows |

Deploy: `npm run build` → `./scripts/upload.sh` → `node scripts/deploy.mjs hub` → HA
restart for sensor changes. Remember the stale-service-worker caveat when verifying.

## 7. Testing

- **Vitest (pure logic):** room tap-toggle decision (on→all off, off→default lights,
  fallback to main_entity); spot/all-in series building incl. breakdown math and
  missing-`energy` handling; SL deviation filtering to monitored lines + dedupe.
- **Browser acceptance:** all six pages at 1280×800 — no vertical scroll; tap/hold
  behaviour on Hem and Ljus; price toggle persistence; bar detail open/dismiss;
  disturbance rows with a mocked non-empty sensor.

## Error handling

- Dead light entities: quiet non-interactive tiles (§2); dead rooms count 0 in summaries.
- `tomorrow` prices absent before ~13:00: unchanged behaviour (shorter chart).
- Missing `energy` field (sensor not yet updated): toggle hides, chart falls back to
  today's total-based view.
- SL API unreachable / sensor unavailable: alert row area renders nothing.
