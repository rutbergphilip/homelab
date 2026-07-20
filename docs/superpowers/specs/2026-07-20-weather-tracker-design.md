# Weather Tracker — Wall Hub Design

**Date:** 2026-07-20
**Status:** Approved
**Scope:** glass-cards wall-hub dashboard (`glass-cards/src/hub/`)

## Summary

Apple Weather-grade weather experience on the wall hub: an upgraded clock+weather
hero on the Hem page, a tappable full-forecast popup (hourly today + 7-day week,
Nynäshamn primary with Stockholm toggle), and an optional animated weather
background behind the Hem page (rain, snow, clouds, sun, lightning, fog) that can
be switched off for a plain background.

**Quality bar:** the animations must look cinematic/realistic — layered depth,
motion blur, easing — not "homemade particle demo". Every condition is visually
verified in Chrome before the feature is considered done.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Where does the full forecast live? | Popup (transit-popup pattern), opened by tapping the clock/weather hero |
| Hem page display | Upgrade existing `hub-clock` into a clock+weather hero — no new grid tile |
| Animated background scope | Hem page only; other pages keep plain theme background |
| Setting UI | "Animerad bakgrund" toggle inside the weather popup, persisted in localStorage |
| Animation implementation | Hand-rolled canvas engine (no library) — purpose-built for realism; tsParticles/Lottie rejected (generic/canned look, bundle weight) |
| Verification | Thorough visual pass with Claude-in-Chrome, forcing every condition in both themes |

## Architecture

### 1. Data layer — `src/hub/weather-model.ts` (pure) + fetch glue

- **Entities:** primary `weather.forecast_home` (Met.no, Nynäshamn); secondary
  Stockholm entity added via a second Met.no location in HA. Config keys:
  `weather_entity` (existing), `weather_locations: [{ entity, name }]` (new;
  first entry = primary/Hem entity).
- **Current conditions:** entity state (condition) + attributes (temperature,
  wind_speed, humidity, etc.). This is all the Hem background needs — no
  forecast calls while idle.
- **Forecasts:** `weather.get_forecasts` WS service call with
  `type: 'hourly'` (day view) and `type: 'daily'` (week view), fetched on popup
  open per location, cached ~15 minutes.
- **Pure mapping module** (vitest-tested): HA condition state → scene descriptor
  `{ sky palette, particle config, effects }`. HA states covered: `sunny`,
  `clear-night`, `partlycloudy`, `cloudy`, `rainy`, `pouring`, `snowy`,
  `snowy-rainy`, `lightning`, `lightning-rainy`, `fog`, `hail`, `windy`,
  `exceptional` (fallback → cloudy).
- Also pure: forecast parsing/normalization, hi/lo extraction, precipitation-hint
  logic ("Regn börjar ~14:00"-style one-liner from hourly data).

### 2. Hem hero — upgrade `src/hub/widgets/hub-clock.ts`

- Clock corner becomes a hero block: large time (as today), below it current
  temp + condition icon + today's hi/lo, replacing the current plain-text
  weather suffix.
- Optional one-line precipitation hint when rain/snow is starting or stopping
  within the visible hours; otherwise nothing (no filler).
- Entire block tappable → opens `hub-weather-popup`.
- Hem grid/no-scroll layout untouched — no new tile.

### 3. Weather popup — `src/hub/widgets/hub-weather-popup.ts`

Same glass popup shell/pattern as `hub-transit-popup`. Content top-to-bottom:

1. Location toggle pills: **Nynäshamn** / **Stockholm** (from `weather_locations`).
2. Current-conditions hero: large temp, condition label, feels-like, wind.
3. Hourly strip (horizontally scrollable, ~24 h): hour, condition icon, temp,
   precipitation amount/chance.
4. 7-day list: day name, icon, precip chance, lo–hi with a temp-range bar
   (Apple-style relative range bars across the week).
5. `Animerad bakgrund` toggle switch.

The popup backdrop carries a subtle version of the current condition's sky so it
feels part of the same scene.

### 4. Animated background — `src/hub/widgets/hub-weather-bg.ts`

Layered behind Hem page content:

- **Sky layer:** CSS gradient keyed to condition × theme × sun elevation
  (`sun.sun` refines dawn/dusk tints). Crossfades ~1.5 s on change.
- **Particle canvas:** one full-viewport `<canvas>`, `requestAnimationFrame`
  loop, `devicePixelRatio` capped at 1.5.

**Realism requirements (the quality bar):**

- 3 parallax depth layers per effect — far: small/slow/faint; near:
  large/fast/sharper.
- **Rain/pouring:** slanted motion-blurred streaks, slight per-drop wind-angle
  jitter, faint splash flickers along the bottom edge; `pouring` = denser,
  faster, longer streaks.
- **Snow:** soft-edged sprites, sinusoidal horizontal drift, per-flake rotation;
  `snowy-rainy` mixes both. `hail` = fast small bouncy particles.
- **Clouds:** 4–6 blurred blob sprites pre-rendered once to offscreen canvases,
  drifting at per-layer speeds; density scales sunny→partlycloudy→cloudy.
- **Sun:** radial bloom + subtle slow-rotating rays; dag/daylight only.
- **Lightning:** randomized full-frame flash curve (fast attack, eased decay)
  that also momentarily brightens the cloud layer.
- **Fog:** slow horizontal haze bands. **Windy:** faster cloud drift + streak lean.
- Everything eased; nothing moves linearly.

**Theme handling:** natt stays OLED-dark — near-black skies, dim particles
("night rain"); never a bright sky at night. Dag gets Apple-style bright
gradients.

**Performance/lifecycle:** particle counts tuned per condition (~150 rain,
~80 snow); rAF loop fully stops when Hem is not the active swipe page, the tab
is hidden, or the toggle is off. Toggle off = component unmounted, not paused.
No visible jank on the wall panel.

**Debug forcing:** `?weather=<condition>` URL param and
`window.__hubForceWeather('<condition>')` override the entity state — required
for exhaustive visual verification.

### 5. Setting

- localStorage key `glass-hub-weather-bg`: `'on'` / `'off'`, default `'on'`.
- Same persistence pattern as the theme override (`glass-hub-theme`).

### 6. Config additions (`scripts/hub-config.mjs`)

```js
weather_locations: [
  { entity: 'weather.forecast_home', name: 'Nynäshamn' },
  { entity: 'weather.<stockholm>', name: 'Stockholm' },
],
```

**HA-side task:** add a second Met.no location "Stockholm" via the Met.no
integration so the entity exists.

## Testing & verification

- **vitest (pure logic):** condition→scene mapping for all HA states, palette
  selection per theme/elevation, forecast parsing, hi/lo extraction,
  precipitation-hint logic.
- **Claude-in-Chrome visual pass (mandatory):** for each of the ~13 conditions ×
  both themes: force via `?weather=`, screenshot, judge against the
  "Apple-grade or homemade?" bar, iterate until it passes. Additionally verify:
  - popup shows correct hourly + daily data for both locations;
  - `Animerad bakgrund` toggle persists across reload;
  - swipe gestures remain axis-locked over the canvas;
  - rAF loop halts when leaving Hem / hiding tab (console instrumentation);
  - service-worker cache bypassed when verifying deploys (known HA gotcha).

## Out of scope

- Weather on other hub pages or in the popup-open state of other cards.
- Weather-driven automations/alerts.
- Radar/precipitation maps.
- More than two locations (config array supports it, UI designed for 2 pills).

## Addendum (2026-07-20 late): volumetric cloud shader

Philip's verdict on the shipped sprite clouds: "chopped", not aesthetic. Reference: Apple
Weather's full-bleed turbulent cloud fields (Hamilton cloudy screenshot et al.).

Replacement: a dependency-free WebGL fragment shader rendering multi-octave fBm
(domain-warped value noise) as a continuous cloud layer on its own half-resolution
canvas between the sky gradient and the particle canvas. Coverage/turbulence driven by
scene.clouds + wind; colors per sky-kind × theme (natt stays near-black with faint
texture); lightning flash brightens the field via uniform. Clouds render at ~30 fps
(they move slowly); particles stay 60. Sprite clouds remain as automatic fallback when
WebGL is unavailable or the context is lost. Fog bands, sun bloom, stars unchanged.

## Addendum 2 (2026-07-21): shader is final; video loops removed

A video-loop experiment (stock Pexels sky footage, seamless baked loops) was
built and deployed, but a side-by-side comparison — enabled by a stale service
worker accidentally A/B-ing the two engines in different browsers — showed
Philip prefers the cleaner, flatter fBm-shader look over photographic footage.
The video path, clips, and fetch script were removed. The shader scene gained a
procedural moon disc (clear/partly nights) to close the "no moon/sun" gap, and
kept the adaptive-contrast work from the video round: always-light hero ink
over the scene, clock-corner scrim (0.26), ~86% card alpha on Hem.
