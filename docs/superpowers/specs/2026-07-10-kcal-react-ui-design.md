# kcal-assistant v0.8.0 — KCAL·DB på React (Radix, Bun-bundlat)

Date: 2026-07-10. Status: design approved in brainstorming with Philip
(framework choice and sequencing decided via explicit questions).
Scope: one release (one PR). UI rewrite only — zero server/API/MCP changes.

## Goal

Rebuild the KCAL·DB UI (currently ~880 lines of vanilla JS) on React so a
component library can provide richer controls — starting with a select whose
options carry inline descriptions — and add the chart details Philip asked
for: hover tooltip with date + estimated weight (including on the projection)
and a denser x-axis. The labbkvitto aesthetic, Swedish copy, strict self-only
CSP, and every v0.7.1 behavior survive 1:1.

## Decisions (Philip's picks)

- **React + Radix primitives, shadcn-STYLE** (own styled components on top of
  headless Radix) — chosen over Vue/reka-ui and Svelte/bits-ui.
- **Chart improvements ship inside the migration** (no interim vanilla v0.7.2).

## Stack & build

- React 19 + TypeScript. Bundled by **Bun's built-in bundler** — no
  Vite/webpack. Dev loop: `bun build --watch` + the existing
  `UI_DEV_NO_AUTH=1` server.
- Dependencies added to package.json: `react`, `react-dom`,
  `@radix-ui/react-select`, `@radix-ui/react-collapsible`, `@types/react`,
  `@types/react-dom`. All bundled and self-hosted — **CSP stays exactly
  `default-src 'self'; img-src 'self' data:`**, no CDN, no inline scripts.
- **No Tailwind.** The existing `app.css` (tokens, kvitto components) remains
  the single stylesheet and is extended; Radix primitives are unstyled by
  design and receive kvitto classes.
- **Build contract unchanged:** the bundle is emitted as `app.js`; styles stay
  in `app.css`; `index.html` gets a React root div. The hardened static-route
  map in `server.ts` (3 fixed paths, traversal-proof by construction) is not
  touched. Bundle target ~60–70 KB gzip; the build step prints the size.
- **Dockerfile** gains a UI build step (install dev deps → `bun build` →
  runtime image serves the emitted files). CI workflow otherwise unchanged.
- Source layout:

```
kcal-assistant/src/ui/app/
  index.tsx            # mount + hash router hook (~20 lines, no router dep)
  api.ts               # typed fetch client (mirrors server response shapes)
  views/               # Idag, Dagar, DagDetalj, Produkter, Recept,
                       # ReceptDetalj, Vikt, Regler
  components/ui/       # kvitto-styled Radix wrappers (Select, Collapsible)
  components/          # Tile, Kvitto, Meter, ChipRow, WeightChart,
                       # PrognosPanel
  lib/chart.ts         # PURE: scales, tick computation, nearest-point lookup
src/ui/static/         # index.html (react root) + app.css remain;
                       # app.js becomes the build OUTPUT (gitignored),
                       # old handwritten app.js deleted
```

## Feature-parity contract (the port is 1:1)

All six views and every v0.7.1 behavior, verified against running v0.7.1 as
facit: hash routes (`#/idag` default, `#/dagar/:date`, `#/recept/:id`, …),
navigation tabs, dagblock/kvitton/meters, product search, recipe times,
the Vikt page (trend tiles, Prognos panel with aktivitetsnivå-select,
intag-what-if [never persisted], målvikt/måldatum, källa-chips,
förhandsvisning chip, 200 ms debounced preview, Spara → PUT → canonical
re-render, error handling with Swedish messages, create-form when no
profile), date picker with instant curve lookup, notes rendering,
auth-expiry reload-on-HTML behavior, empty states, Swedish copy throughout.
Fetch races handled with AbortController in effects (React idiom replacing
the seq guard — same observable behavior: stale responses never render).

## New behavior

1. **Aktivitetsnivå-select med beskrivningar i menyn** (Radix Select):
   each option renders two lines — "måttligt aktiv (1,55)" + dämpad
   beskrivning "träning 3–5 dagar i veckan" — inside the dropdown. Same five
   levels + "anpassad" handling as v0.7.1. Keyboard/touch accessible via
   Radix.
2. **Chart hover**: a pointer overlay on the SVG finds the nearest point by x
   across BOTH the actual weigh-in series and the projection curve; renders a
   crosshair line + kvitto-styled tooltip with the date and value — actual
   points as `82,5 kg`, projection points as `≈ 74,2 kg (73,1–75,3)` using
   the exact daily curve (no interpolation needed). Pointer events → works
   with touch drag. Tooltip clamps inside the chart frame.
3. **Tätare x-axel**: 4–6 evenly distributed date ticks (MM-DD) computed by a
   pure `tickDates(x0, x1, n)` helper.

## Testing

- Server suite (163 tests) untouched and must stay green — no server changes.
- `lib/chart.ts` pure functions (scale mapping, tickDates, nearestPoint
  across two series) get bun tests.
- Final verification: Playwright pass over all six views against the dev
  server (parity walk + the three new behaviors), then Philip's phone check
  post-deploy.

## Release & rollback

v0.8.0, one PR: UI app, Dockerfile build step, old `app.js` deleted,
version bump. Server untouched → rollback is a plain revert/redeploy of the
previous image. No new-chat requirement (MCP unchanged).

## Out of scope (deliberate)

- Tailwind or any restyling beyond porting the kvitto CSS.
- Chart libraries (the hand-drawn SVG is the identity; it is ported, not
  replaced).
- Server/API/MCP changes of any kind.
- UI unit-test framework beyond bun tests for the pure chart helpers
  (component testing can come later if wanted).
