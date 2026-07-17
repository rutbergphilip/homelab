# Wall Hub Dashboard — Design Spec

**Date:** 2026-07-15
**Status:** Implemented (2026-07-17). Deltas from design: dashboard url_path is `wall-hub` (HA requires a hyphen); whole-home Hue scenes skipped by user decision (per-room scene chips shipped instead); hourly prices via a Tibber-GraphQL REST sensor (`sensor.elpris_timserie`) because the official integration lacks hourly arrays; HA moved to `hostNetwork` for HomeKit pairing, with the kcal netpol host rule L7-tightened to compensate; kiosk fullscreen via kiosk-mode plugin + a drawer-width shim in glass-hub.
**Scope:** New wall-mounted home hub dashboard for Home Assistant, built by evolving the existing `glass-cards` library, plus integration plumbing (Tibber, HomeKit Bridge, kcal endpoint) and a Claude-for-Chrome visual verification workflow.

---

## 1. Goals

- A dashboard beautiful enough to hang on a wall as the home's control center — "expensive hotel" quality, not default Lovelace.
- Controls the whole home: lights (Hue), media (Sonos), energy (Tibber), vacuum status, plus a kcal tracker card.
- Dual ecosystem: everything relevant available in **both** Apple HomeKit and Home Assistant.
- Runs on a landscape wall tablet (not yet purchased — criteria in §8), but responsive enough for desktop/phone browsers too.
- Existing `glass-home` dashboard remains untouched as fallback until the hub is verified.

## 2. Design language

One token-based design system, two themes, switched automatically by sun elevation (`sun.sun`) with a manual override toggle in the header (persisted per device in `localStorage`). Theme cross-fade: 600 ms, never blocks input.

### Themes

| | **Natt (dark)** | **Dag (light)** |
|---|---|---|
| Surface | `#0A0A0C` (OLED black) | `#F3F0E9` (warm paper) |
| Card | `#131316`, border `#202026` | `#FFFFFF`, border `#E8E3D8` |
| Text primary | `#F2F1EE` | `#2A2823` |
| Text muted | `#8B8A92` | `#8D877A` |
| Active accent | faint outer glow | warm-tinted shadow |

### Domain signature colors (shared)

Amber = lights, teal = media, green = energy, lavender = kcal, coral = alerts/warnings.
**Core rule:** a surface only takes its domain color when *active*. Inactive cards stay neutral so the wall reads calm and glanceable. Dark-theme accents (`#F5B63C` amber, `#63D6C2` teal, `#8EDCA8` green, `#B99CF2` lavender, `#F2968C` coral); light theme uses deeper variants on tinted backgrounds (e.g. amber `#A5731B` on `#FDF3DE`).

### Typography & shape

- **Outfit** (weights 200–600) for the large clock, numerals, and display text; **Inter** for labels/body. Both self-hosted in the bundle (no CDN dependency — the tablet must work offline from the internet).
- Radius: 18–20 px cards, pill chips. Spacing: 8 px grid, generous. Touch targets ≥ 48 px.
- Subtle frosted-glass texture allowed as an *accent* (popups, overlays) in both themes — not a third theme.

## 3. Layout — full-screen swipe deck

Five full-screen pages, swipe or dot-nav (dots centered bottom). Auto-return to Hem after 2 minutes idle. Landscape-first, target 1920×1200, fluid down to 1280×800.

1. **Hem** — big thin clock, date/weather line, status chips (lamps on, current el-price, vacuum, person presence; SL departures chip appears only during a configurable weekday time window, default 06:30–09:30), 3×2 room-tile grid, Sonos now-playing strip, kcal mini ring-card. Room tap → popup with that room's lights + scenes. Media strip / kcal card tap → jumps to that page.
2. **Ljus** — rooms as large cards with per-light sliders, Hue scenes per room, whole-home actions (allt släckt, kvällsläge, film). Amber-dominant.
3. **Media** — immersive Sonos page: large album art with ambient color bleed into the page background, transport controls, per-speaker volume, speaker grouping (join/unjoin Kitchen/Bedroom to Arc) via `media_player.join`/`unjoin`. Teal-dominant.
4. **Energi** — current price large, 24 h price bar chart (today + tomorrow after Nordpool publishes ~13:00), consumption, CO₂-intensity and fossil-share from existing Electricity Maps sensors, "cheapest hours" hints. Green-dominant.
5. **Kcal** — full-page tracker: today's ring (kcal + protein vs targets), weight-trend sparkline, forecast ETA with error bands (prognosmotor v2), last logged meals. Lavender-dominant. Layout leaves room for future meal-planning features.

Vacuum appears as a status chip on Hem only (no dedicated card in v1).

## 4. Architecture

Evolve the existing `glass-cards` package (Lit + Rollup + existing WebSocket deploy script). New root card `custom:glass-hub` fills one panel-mode Lovelace view and owns the viewport.

```
glass-cards/src/
├── glass-cards.ts              # registry (existing + new)
├── styles/tokens.ts            # design tokens: both themes as CSS custom props
├── hub/
│   ├── glass-hub.ts            # root: swipe engine, theme controller, idle timer
│   ├── pages/hub-{home,lights,media,energy,kcal}-page.ts
│   └── widgets/hub-*.ts        # clock, status-chip, room-tile, now-playing,
│                               # price-chart, kcal-ring, sparkline, speaker-group
└── cards/                      # existing cards kept; light-slider + popup
                                # re-skinned via tokens and reused in pages
```

- **Config-driven:** the `glass-hub` YAML config declares pages, room→entity mapping, scene lists, and theme behavior. Adding a room/page later is config, not code.
- **Theme controller:** sets `data-theme` on hub root; all components style exclusively through tokens.
- **Swipe engine:** pointer events (touch + mouse), CSS transform transitions.
- **Data:** everything reads `hass` states. No direct network calls from the frontend.
- **Deploy:** extend `scripts/deploy.mjs` with a `hub` dashboard target alongside `glass-home`.

## 5. Integrations

### Tibber
Official HA integration via UI config flow; Philip provides API token from developer.tibber.com at implementation time. Supplies current price, today/tomorrow price arrays, hourly consumption/cost. No Pulse assumed; if added later, real-time watts appear on Energi as progressive enhancement.

### Hue (no migration needed)
Lights stay connected via Hue Bridge to **both** HA and Apple Home natively — HomeKit keeps working even if HA is down. Work items: audit naming/room consistency across Hue app, HomeKit and HA; define the shared scene set (kvällsläge, film, allt släckt) **as Hue scenes** so they are identical in both ecosystems and exposed on the Ljus page.

### Sonos
Already in HA. Apple Home side via AirPlay 2 (added from the Home app; no HA involvement). Hub uses HA services for transport, volume, grouping.

### HomeKit Bridge (HA → Apple Home)
New HA `homekit` integration exposing a **curated allowlist** of non-Hue entities: `vacuum.roborock_s8` plus selected sensors/switches. Hue and Sonos entities explicitly excluded (they reach HomeKit natively) to avoid duplicates.

### Kcal endpoint
New read-only endpoint in kcal-assistant: `GET /internal/summary`, returning: today's kcal/protein vs targets, weight trend, forecast ETA (+ error band), last meals. Served only inside the cluster — **not** through the Authentik-gated ingress. HA polls it with two REST sensors (today + trend/forecast) at ~5 min interval via `http://kcal-assistant.home-automation.svc.cluster.local:3000/internal/summary`.

**Network policy:** the existing CiliumNetworkPolicy on kcal-assistant only admits ingress-nginx (it protects the `X-authentik-email` header from in-cluster forgery). Extend it with an **L7 rule** admitting the home-assistant pod to `GET /internal/summary` only — HA gets its data while `/ui` and `/mcp` stay unreachable from anything but nginx. Code change lives in kcal-assistant (endpoint) + this repo (netpol, REST sensors).

## 6. Resilience

- Unavailable entities → quiet neutral card states ("—"), never error-red walls.
- Kcal REST sensor failure → card shows explicit "offline" state, not stale data presented as fresh.
- Tomorrow's prices render only once published.
- Swipe/theme animations never block touch input.
- Fonts and all assets bundled; hub fully functional without internet (LAN + HA only).

## 7. Verification workflow (per implementation milestone)

Using Claude for Chrome against the live deployment (`home.rutberg.dev`):
1. Resize window to tablet resolution (1920×1200 and 1280×800).
2. Walk every page in **both themes**; screenshot and judge against approved mockups (spacing, hierarchy, active-glow behavior, typography).
3. Check console for errors/warnings.
4. Exercise interactions for real: swipe between pages, open room popup, drag a light slider, toggle theme, group/ungroup a speaker.
5. Fix anything off before the next milestone. `glass-home` remains the fallback dashboard throughout.

## 8. Hardware selection criteria (Philip researches model separately)

Requirements the chosen tablet must meet:
- Android with **Fully Kiosk Browser** support (HA integration: motion wake, brightness control from HA, auto-launch)
- 10–11" landscape, IPS, ≥ 1920×1200 preferred (1280×800 minimum), decent max brightness (≥ 400 nits for daytime)
- Front camera (motion-based screen wake), USB-C powered continuously (battery-charge-limit feature is a plus for longevity)
- Price band ~1 500–2 500 kr; reference candidates: Samsung Galaxy Tab A9+ 11", Lenovo Tab M11
- Flush wall mount with hidden cable routing

## 9. Implementation order

1. Token system + `glass-hub` shell (swipe, themes, dots, idle) with Hem page
2. Ljus page + re-skinned light slider/popup; Hue scene/naming audit
3. Tibber integration + Energi page
4. Media page (Sonos transport, art bleed, grouping)
5. Kcal endpoint + REST sensors + Kcal page (mini card on Hem included in step 1 with placeholder until this lands)
6. HomeKit Bridge allowlist config
7. Final Chrome verification pass, both themes, both resolutions

Each step ends with a Chrome verification pass (§7).

## 10. Out of scope (future)

- Meal planning on the Kcal page (layout reserves space)
- Tibber Pulse real-time power
- Dedicated vacuum control page/card
- Climate/thermostat control (no climate entities exist yet)
- Multi-user presence logic beyond `person.philip_rutberg`
