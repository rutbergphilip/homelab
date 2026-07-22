# Wall-hub round 6 — car, vacuum, calendar, todo, compact lighting, responsive

**Date:** 2026-07-22
**Status:** Approved

## Goal

Seven improvements to the wall-hub dashboard (`glass-cards/src/hub/`), all landing on
the Hem page as compact widgets with rich popups (the established transit/weather
pattern), plus a responsive sweep and one HA automation:

1. Compact lighting widget on Hem (frees the room-tile grid space)
2. Volvo car card (EV/PHEV — battery, range, lock, climate start)
3. Roborock S8 card (status + per-room cleaning)
4. Simple todo list ("Att göra", separate from shopping list)
5. Merged Apple + Google calendar with event creation (target: iCloud)
6. Night automation: `light.spotlight_top` 30% blue, fixed hours
7. Responsive layout: wall panel + phone + desktop

No new swipe pages — swipe count stays at 5 (+ Vecka). Hem becomes the command
center.

## HA-side setup

| Piece | How | Credentials needed from Philip |
|---|---|---|
| Volvo | HACS **Volvo Cars** (thomasddn) | API key from developer.volvocars.com + Volvo ID login/OTP during config flow |
| Google Calendar | Core integration, OAuth | Google application credentials, one-time browser flow |
| Apple/iCloud | Core **CalDAV** in `configuration.yaml` | App-specific password from appleid.apple.com → HA `secrets.yaml` |
| Todo | **Local To-do** list "Att göra" → `todo.att_gora` | none |
| Night automation | HA automation YAML | none |

Config mirrors in `.claude/` per repo convention: `ha-caldav.yaml`,
`ha-automations.yaml`.

### Night automation

- 22:00 → `light.turn_on` `light.spotlight_top`, `brightness_pct: 30`,
  `hs_color: [240, 90]`
- 07:00 → `light.turn_off`
- HA-start trigger: if boot time falls inside 22:00–07:00, re-apply the on-state
  (restart guard).

## Hem page rework

The `.rooms` grid in `hub-home-page.ts` is replaced by a widget grid, 3×2 on the
panel:

```
[ Belysning ] [ Bil (Volvo) ] [ Roborock ]
[ Kalender — span 2        ] [ Att göra ]
```

Clock hero, chip row, `.info` band (energy + transit) and `.bottom` band
(now-playing, kcal, meal) are unchanged. The vacuum chip in the top row stays
(appears only while cleaning) and opens the same vacuum popup.

### New widgets (in `src/hub/widgets/`)

| Widget | Card face | Popup |
|---|---|---|
| `hub-lighting-tile` | "Belysning · N tända", amber glow when any on | `hub-lights-modal`: all rooms as sections, group toggle per room + per-light sliders; reuses `hub-room-popup`/`hub-light-tile` internals |
| `hub-car-card` | battery %, range km, lock icon, charging state | `hub-car-popup`: big climate start/stop, lock/unlock, doors/windows, odometer, charging detail |
| `hub-vacuum-card` | status text, battery | `hub-vacuum-popup`: full clean + 4 existing room buttons (vardagsrum, kök, sovrum, hall), pause/dock, mop mode + intensity selects, consumables |
| `hub-calendar-card` | next 2–3 merged events | `hub-calendar-popup`: 7-day agenda grouped by day, "Nytt" → inline form (title, date, time, length) → `calendar.create_event` on iCloud entity |
| `hub-todo-card` | top ~4 unchecked items, tap to complete | `hub-todo-popup`: full list, quick-add, complete/delete |

Domain colors per token system: amber = lighting, neutral/teal = car+vacuum,
lavender = calendar/todo (planning), coral reserved for alerts (e.g. vacuum
error, car unlocked at night).

## Data plumbing

- **`src/hub/calendar-model.ts`** — fetch both calendars via WS
  `calendar.get_events` (service call with `return_response`); merge, sort by
  start; **dedupe by normalized title (lowercase, trimmed) + start truncated to
  minute**; 5-min cache keyed by entity set (pattern: `weather-forecast.ts`).
  Create events via `calendar.create_event`.
- **`src/hub/todo-model.ts`** — `todo.get_items` (WS with response),
  `todo.add_item`, `todo.update_item` (status → completed).
- Volvo + vacuum: plain entity reads and service calls, no model layer.
- **`scripts/hub-config.mjs`** gains `volvo: {…entity ids}`,
  `calendar: { entities: [google, icloud], create_entity: icloud }`,
  `todo_entity`. Volvo entity ids are filled in after the integration is
  installed and entities are discovered.

## Responsive

Three regimes, applied across all pages and popups:

- **Phone ≤600px**: single-column stacks, popups become full-screen sheets,
  touch targets ≥44px, chip row wraps under the clock.
- **Tablet/panel 601–1400+**: current behavior kept (2-col ≤1400, 3-col above).
- **Desktop >1600px**: content capped ~1500px and centered; popups centered
  modals max ~560px wide.

Every swipe page (Hem, Ljus, Media, Energi, Kcal, Vecka) gets a phone
single-column pass, not just Hem.

## Testing & verification

- Vitest: calendar merge/dedupe (duplicate collapse, ordering, all-day events),
  todo item sorting/filtering. Pure-logic style matching existing tests.
- Live: panel URL, phone-sized viewport, desktop via browser; night automation
  triggered manually once.

## Build order

1. HA integrations (Volvo / Google / iCloud — needs Philip's credentials; all
   else automated)
2. Night automation
3. Lighting tile + modal (frees Hem)
4. Vacuum card + popup
5. Todo list + card
6. Calendar model + card + popup
7. Volvo card + popup (once entities exist)
8. Responsive sweep
