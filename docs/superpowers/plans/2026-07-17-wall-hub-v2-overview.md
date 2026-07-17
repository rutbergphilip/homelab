# Wall Hub v2 — Nav Bar + Hem Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Approved follow-up to `2026-07-15-wall-hub-dashboard.md` (implemented). Same global constraints apply (tokens-only styling, both themes, Swedish text, ≥48px targets, quiet unavailable states, frontend-design skill for visual tasks, Chrome verification, glass-home untouched).

**Goal:** Replace dot nav with a labeled frosted bottom nav bar; make Hem a full overview by adding a working SL transit card (pendeltåg + bus 861 Kullstaplan→Slakthuset) and a compact energy strip.

**Facts established (do not re-derive):**
- SL Transport API is key-free: `https://transport.integration.sl.se/v1/sites/8532/departures` (8532 = Kullstaplan; max `forecast=1200` minutes; response `.departures[]` with `line.designation`, `destination`, `display`, `expected`, `scheduled`, `state`). Line 861 is weekday-rush-only — empty results evenings/weekends are NORMAL and must render "Inga avgångar idag".
- Stockholm-bound filter heuristic: line=861 AND destination NOT matching /nynäs/i (config-adjustable; exact destination strings observable only when the line runs).
- Pendeltåg sensors work: `sensor.avgangar_next_departure` (timestamp state), `sensor.avgangar_departures` (count). Thin attributes — render "Nästa HH:MM · N avgångar".
- Tibber series sensor: `sensor.elpris_timserie` (attrs today/tomorrow [{total,startsAt}]) — reuse `buildEnergyModel`.

### Task V2-1: hub-nav-bar (replaces dots)
Files: create `glass-cards/src/hub/widgets/hub-nav-bar.ts`; modify `glass-cards/src/hub/glass-hub.ts` (remove dot nav, mount bar).
- Slim frosted bottom bar (backdrop-blur accent per design system; bg `--hub-card` at ~70% + blur in natt, frosted white in dag — via tokens, add `--hub-navbar-bg` if needed), full-width, ~64px tall.
- 5 items: icon (from icons.ts: home, lamp, note, bolt + a ring/kcal glyph) + Swedish label (Hem/Ljus/Media/Energi/Kcal), stacked icon-over-label, ≥48px hit, `aria-current` on active.
- Active item tinted with the PAGE's domain color (hem=neutral `--hub-text`, ljus=amber, media=teal, energi=green, kcal=lavender); inactive `--hub-text-dim`. 150ms transitions.
- Tap → `goToPage`; swipe unchanged; pages get bottom padding so content clears the bar.
- Tests: pure helper for page→tone mapping if extracted; else typecheck+build. Commit `feat(glass-hub): labeled bottom nav bar replaces dot nav`.

### Task V2-2: SL 861 REST sensor + transit card
Files: HA configuration.yaml (controller does the config half — implementer builds frontend against the shape below); create `glass-cards/src/hub/widgets/hub-transit-card.ts`; modify `hub-home-page.ts`, `hub-config.ts`, `scripts/hub-config.mjs`.
- REST sensor (controller): name "SL Kullstaplan", unique_id sl_kullstaplan, resource `https://transport.integration.sl.se/v1/sites/8532/departures?forecast=1200`, scan_interval 120, value_template departures count, json_attributes `departures`. Mirror in `.claude/ha-rest-sensors.yaml`.
- Config: `transit: { pendeltag: { next_entity, count_entity }, bus: { entity: 'sensor.sl_kullstaplan', line: '861', exclude_destination: 'nynäs', label: 'Buss 861 → Slakthuset' } }`.
- `<hub-transit-card>`: two rows. Pendeltåg: train icon, "Pendeltåg" + "Nästa HH:MM · N avgångar" (timestamp → local HH:MM; stale/unknown → "–"). Buss: bus icon, label from config + next 2-3 filtered departures as "X min · Y min" (from `display`, or HH:MM when far); delay state `state != 'EXPECTED'` → coral tint on that departure; empty after filter → "Inga avgångar idag" dim. Pure helper `filterBusDepartures(departures, line, excludePattern)` with vitest tests (fixture from a live capture of the API response).
- Commit `feat(glass-hub): transit card — pendeltåg + buss 861 with live SL data`.

### Task V2-3: Hem overview layout + energy strip + Chrome pass
Files: create `glass-cards/src/hub/widgets/hub-energy-strip.ts`; modify `hub-home-page.ts`.
- `<hub-energy-strip>`: current price large-ish + level word (reuse buildEnergyModel via price/price_series entities from config), mini 12h bar sparkline (next 12 hours from now; reuse chart logic or a slim variant), "Billigast HH–HH" chip. Tap → goto energi. Green-dominant-when-cheap.
- Hem layout: header (clock+slimmed chips: lights, vacuum-when-active, person) / room grid / row: energy strip (flex 3) + transit card (flex 2) / row: now-playing (flex 2) + kcal ring (flex 1). Remove the old price + departures CHIPS from the chips row (now real cards). Stacks at 1280. Departure chip window logic retires (card is always present).
- Deploy + Chrome verification: both themes × 1280/1512 for Hem + nav bar on all pages; nav taps; transit card rows render (bus likely "Inga avgångar idag" outside rush — verify quiet state); energy strip numbers vs sensor; regression: swipe, popups, idle return (now to Hem with nav bar visible); console clean.
- Commit `feat(glass-hub): Hem overview — energy strip, transit card, slimmed chips`.
