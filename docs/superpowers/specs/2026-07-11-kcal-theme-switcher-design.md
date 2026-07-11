# kcal-assistant v0.9.1 — Temaväxlare (mörkt/ljust/system) + v0.9.0-fast-follows

Date: 2026-07-11
Status: design approved in brainstorming with Philip; this document is the spec for the implementation plan.
Scope: one release (one PR), UI-only — no migration, no MCP changes (24 tools,
schemas untouched, no new chat needed), no new API endpoints. The UI's
read-only-except-profile-PUT posture is unchanged.

## Goal

A manual theme switcher for KCAL·DB. Today the UI is dark-first with light
overrides via `@media (prefers-color-scheme: light)` — OS-following only.
Philip wants a manual toggle: a **3-state cycle** (system → ljust → mörkt)
where "system" preserves today's OS-following behavior. Bundled: three tiny
ship-triaged fast-follows from the v0.9.0 final review.

## 1. CSS: `light-dark()` + `color-scheme` (approach A, approved)

Rewrite the `:root` palette block in `src/ui/static/app.css` so every themed
variable holds both values via `light-dark(<light>, <dark>)`, taking the
light values from today's media-query block and dark values from today's
`:root`:

```css
:root {
  color-scheme: dark light;              /* system: follow the OS */
  --bg: light-dark(#f4efe5, #131110);
  --surface: light-dark(#fbf8f1, #1b1815);
  /* … all 12 themed vars; --mono/--sans stay as-is … */
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
```

- The `@media (prefers-color-scheme: light)` block is DELETED — `light-dark()`
  + `color-scheme` replace it entirely. No duplicated variables; system mode
  keeps switching live at OS theme changes with zero JS.
- Audit during implementation: grep for any other `prefers-color-scheme`
  usage or hardcoded theme colors outside the variable block (the scenario
  line colors #0072b2/#e69f00 and ghost opacity are deliberately theme-fixed).
- `<meta name="color-scheme" content="dark light">` in index.html stays (the
  CSS property governs; the meta is a pre-CSS hint).
- Browser floor: `light-dark()` is 2024-era CSS — fine for this single-user
  app on Philip's evergreen browsers.

## 2. Zero-flash startup: `theme.js`

Strict CSP forbids inline scripts, and `app.js` is a deferred end-of-body
module — so a React-side stamp would flash the OS theme when the saved choice
differs. Fix: a tiny EXTERNAL classic script, loaded blocking in `<head>` of
`src/ui/static/index.html` (same-origin = CSP-clean):

```html
<script src="/ui/static/theme.js"></script>
```

```js
// theme.js — stamp the saved theme before first paint. System = no attribute.
try {
  var t = localStorage.getItem("kcal.theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
```

Must be served exactly like `app.js`/`app.css` (same static handler, correct
`text/javascript` content type) — the implementation verifies how
`src/server.ts` serves `/ui/static/*` and registers the file if the handler
whitelists names.

## 3. Masthead cycle button

In `src/ui/app/index.tsx`'s `App` masthead, right of the date span: a small
mono-styled button cycling **system → ljust → mörkt → system**.

- Label shows the current state: `tema: system` / `tema: ljust` /
  `tema: mörkt`. `aria-label="växla tema"`.
- State: `useState<"system" | "light" | "dark">` initialized from
  `localStorage["kcal.theme"]` (absent/invalid → "system").
- On click: advance the cycle; for explicit themes set
  `localStorage["kcal.theme"]` + `document.documentElement.dataset.theme`;
  for system REMOVE both (key deleted, attribute deleted) so the OS rules.
  localStorage access wrapped in try/catch (private-mode safety), state still
  updates so the button label never sticks.
- Styling: new `.theme-toggle` class in app.css following the masthead's
  kvitto conventions (mono font, hairline border, --ink-2 text, accent on
  hover) — visually a sibling of the existing chip idiom, sized to not crowd
  the masthead on mobile (`font-size` ≈ label-small, padding tight).

## 4. Bundled v0.9.0 fast-follows (all ship-triaged in the final review)

1. **`loadPinned` value-validation** (`src/ui/app/views/Vikt.tsx`): reject an
   entry when any present override value is not a string or any key is
   outside {activity, intake, goal, goal_date} — a hand-edited
   `localStorage["kcal.scenarios"]` must never crash the Vikt render.
2. **Suppress empty scenario tooltip lines** (`src/ui/app/components/WeightChart.tsx`):
   when `kgAt` returns null for a hovered date, skip that scenario's tooltip
   line entirely (today it renders "S1 ≈ — kg"); the tooltip rect height
   counts only rendered lines.
3. **Shared weekly-sampling helper**: export `weeklyCurve(curve)` from
   `src/lib/forecast.ts`; `src/db/snapshots.ts` and `src/tools/profile.ts`
   both use it (today the `i % 7 === 0 || i === curve.length - 1` one-liner
   is duplicated). One trivial unit test pins the sampling.

## Testing & rollout

- Suite stays green (`bun test`, `bunx tsc --noEmit`); new unit test only for
  `weeklyCurve`. Theme behavior and the two UI fast-follows are verified by a
  browser walk: cycle changes theme instantly on every view, reload persists,
  hard-reload shows NO wrong-theme flash with an explicit theme + opposite OS
  setting, system mode follows an OS toggle live, corrupted
  `kcal.scenarios` no longer breaks Vikt, no "S≈—" tooltip lines.
- Release: `package.json` 0.9.1 + `deployment.yaml` image tag `v0.9.1` in the
  same PR → merge → CI → Flux. Verify: pod v0.9.1, healthz 200, `/ui` gated,
  toggle live behind Authentik.
