# Transit Details Popup — Tap the Hem Transit Card

**Date:** 2026-07-20
**Status:** Approved
**Scope:** One popup. Follow-up to the round-3 spec
(`2026-07-20-wall-hub-fit-lights-price-sl-design.md`), which added the störnings-strip this
popup expands on.

## Background

The Hem transit card now shows a coral störnings-strip, but with ≥2 deviations it collapses
to "N störningar" with no way to read what they are. The card is also the only glanceable
band on Hem with no tap action. Requirement (user): pressing the **entire card** opens a
popup with more details about everything — departures and störningar.

## Interaction

- The whole transit card becomes pressable: press-scale feedback, `aria-label`
  "Visa avgångar och störningar". Plain tap (no long-press semantics — the card is
  informational; tap reveals).
- Tap → dispatch `hub-transit-open` (no detail payload, bubbles, composed) → `glass-hub`
  renders `hub-transit-popup` with `.hass` and `.config`, following the exact
  state/listener/render pattern of `hub-room-popup`/`hub-light-popup` (`_openTransit`
  boolean state; `hub-popup-close` clears all three popup states).
- Popup: same scrim + card pattern; title "Resor & störningar"; card `max-width: 560px`,
  `max-height: 100%` with internal scroll (the störnings texts can be long).

## Popup content — three sections

1. **Pendeltåg** — upcoming departures from `config.departures.list_entity`
   (`sensor.avgangar_departures`), whose `departures` attribute carries the same SL
   Transport schema as the bus sensor (verified live: `destination`, `display`,
   `scheduled`/`expected`, `state`, `line.designation`, both directions from Nynäsgård).
   Reuse `filterBusDepartures(raw, '43', '')` (line filter + time sort, no destination
   exclusion) and show up to 6 rows: time (`display`), destination, delayed
   (non-EXPECTED/ATSTOP state) in coral. "–" when the sensor is dead or empty.
2. **Buss 861 → Slakthuset** — up to 6 departures via the existing
   `filterBusDepartures` (same entity/filters as the card), each row: display time +
   destination, delayed (non-EXPECTED state) in coral. "Inga avgångar idag" when empty.
3. **Störningar** — one block per shaped deviation: line badges + header (coral), then
   SL's `details` text and `scope` (affected area) in muted body text. Section omitted
   entirely when there are no deviations. Publish window is NOT shown (kept out per the
   detail-depth decision).

## Data changes

- **SL sensor** (`sensor.sl_storningar`, command_line python in HA `configuration.yaml` +
  local mirror `.claude/ha-rest-sensors.yaml`): the extraction adds per deviation
  `details` — first message variant's details text, truncated to 400 chars server-side
  (recorder hygiene) — and `scope` — the variant's `scope_alias` string. Requires one HA
  restart (**ask the user before restarting; not pre-authorized**).
- **`shapeDeviations`** (`glass-cards/src/hub/transit-model.ts`): `ShapedDeviation` gains
  optional `details?: string` and `scope?: string`, passed through with defensive string
  checks; on duplicate-header merge, the first non-empty values win. Existing behaviour
  (dedupe, priority sort, cap 5) unchanged; existing tests untouched; new tests cover the
  passthrough, merge-keeps-first, and non-string rejection.
- Pendeltåg/bus: no sensor changes.

## Error handling

- Deviations without `details`/`scope` render header-only (fields optional end-to-end).
- Dead/absent sensors: each section degrades independently (pendeltåg falls back to
  summary or "–", bus shows "Inga avgångar idag", störnings section hidden). The popup
  itself always opens on tap.
- Old sensor payload (pre-restart, no `details` field): popup works, headers only.

## Testing

- Vitest: extended `shapeDeviations` cases (see above).
- Live acceptance at 1280×800: tap card → popup lists current real deviations with
  details text; bus/pendeltåg sections populated; close via scrim and X; no layout change
  to the card itself (strip still fits, `has-alerts` compact mode untouched).
