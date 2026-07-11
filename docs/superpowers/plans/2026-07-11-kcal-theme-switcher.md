# kcal-assistant v0.9.1 — Temaväxlare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 3-state theme switcher (system → ljust → mörkt) for KCAL·DB with zero-flash startup, plus three ship-triaged v0.9.0 fast-follows.

**Architecture:** The CSS palette collapses to single `light-dark()` variables switched by the `color-scheme` property; a tiny external blocking `theme.js` in `<head>` stamps the saved choice before first paint (strict CSP — no inline scripts); a masthead button cycles the state and persists it in `localStorage["kcal.theme"]`. UI-only release: no migration, no MCP changes.

**Tech Stack:** Bun + TypeScript, React 19, plain CSS custom properties, `bun test`.

**Spec:** `docs/superpowers/specs/2026-07-11-kcal-theme-switcher-design.md` (approved). Branch: `kcal-v0.9.1-theme-switcher`.

## Global Constraints

- All commands run from `kcal-assistant/`; repo root is `homelab/`.
- Swedish user-facing copy; English code/comments.
- Strict CSP: NO inline scripts or styles — theme.js must be an external same-origin file.
- MCP surface frozen: 24 tools, zero schema/description changes this release.
- UI stays read-only except the pre-existing `PUT /ui/api/profile` — no new endpoints; static serving stays a hardcoded whitelist (no filesystem-derived paths).
- `bun run build:ui` uses `--production` (never build without it); full `bun test` + `bunx tsc --noEmit` green at every commit.
- localStorage keys: theme = `"kcal.theme"` (values `"light"`/`"dark"`; ABSENT = system), scenarios = `"kcal.scenarios"` (existing).
- Commit style `feat(kcal-assistant): …`; end commit bodies with the Claude-Session trailer used on this branch.

---

### Task 1: Shared `weeklyCurve` helper

**Files:**
- Modify: `kcal-assistant/src/lib/forecast.ts`, `kcal-assistant/src/db/snapshots.ts:16-18`, `kcal-assistant/src/tools/profile.ts:43-45`
- Test: `kcal-assistant/tests/forecast.test.ts`

**Interfaces:**
- Produces: `export function weeklyCurve<T>(curve: T[]): T[]` in `src/lib/forecast.ts` — weekly sampling (every 7th point + always the last). Both call sites import it; the duplicated one-liners are deleted.

- [ ] **Step 1: Write the failing test** — append to `tests/forecast.test.ts`:

```ts
import { weeklyCurve } from "../src/lib/forecast";

describe("weeklyCurve", () => {
  test("keeps every 7th point and always the last", () => {
    const days = Array.from({ length: 16 }, (_, i) => i); // 0..15
    expect(weeklyCurve(days)).toEqual([0, 7, 14, 15]);
  });
  test("single point and empty pass through", () => {
    expect(weeklyCurve([42])).toEqual([42]);
    expect(weeklyCurve([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/forecast.test.ts`
Expected: FAIL — `weeklyCurve` not exported.

- [ ] **Step 3: Implement**
  - Add to `src/lib/forecast.ts` (near the other small helpers):

```ts
// Weekly curve sampling shared by snapshot storage and the MCP get_forecast
// response (token economy): every 7th point plus always the endpoint.
export function weeklyCurve<T>(curve: T[]): T[] {
  return curve.filter((_, i) => i % 7 === 0 || i === curve.length - 1);
}
```

  - `src/db/snapshots.ts`: delete the local `weekly` const (lines 16-18) and its comment; import `weeklyCurve` from `../lib/forecast` (extend the existing import line) and use `weeklyCurve(forecast.curve)` in `saveSnapshot`.
  - `src/tools/profile.ts`: in the `get_forecast` handler, replace `const weekly = curve.filter((_, i) => i % 7 === 0 || i === curve.length - 1);` with `const weekly = weeklyCurve(curve);` and import `weeklyCurve` from `../lib/forecast`.

- [ ] **Step 4: Run the full suite**

Run: `bun test && bunx tsc --noEmit`
Expected: all pass (existing snapshot/roundtrip tests prove the call sites still sample identically).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecast.ts src/db/snapshots.ts src/tools/profile.ts tests/forecast.test.ts
git commit -m "refactor(kcal-assistant): delad weeklyCurve-helper för veckosampling"
```

---

### Task 2: `theme.js` + static route + index.html

**Files:**
- Create: `kcal-assistant/src/ui/static/theme.js`
- Modify: `kcal-assistant/src/server.ts:21-25` (STATIC_ROUTES), `kcal-assistant/src/ui/static/index.html`
- Test: `kcal-assistant/tests/ui-api.test.ts:94-102` (the existing "static routes serve with security headers" test)

**Interfaces:**
- Produces: `GET /ui/static/theme.js` served with `text/javascript; charset=utf-8`; `<html>` carries `data-theme="light"|"dark"` before first paint when a choice is saved, no attribute for system. Tasks 3-4 rely on the attribute name `data-theme` and storage key `kcal.theme` exactly.

- [ ] **Step 1: Extend the failing test** — in `tests/ui-api.test.ts`, inside the "static routes serve with security headers" test, add alongside the app.js/app.css assertions:

```ts
    expect((await get("/ui/static/theme.js")).headers.get("content-type")).toContain("javascript");
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test tests/ui-api.test.ts`
Expected: FAIL — theme.js 404s (content-type `application/json`).

- [ ] **Step 3: Implement**
  - Create `src/ui/static/theme.js` (classic script, ES5-safe, no modules):

```js
// Stamp the saved theme before first paint (CSP forbids inline scripts, and
// app.js is a deferred module — too late). System preference = no attribute.
try {
  var t = localStorage.getItem("kcal.theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
```

  - `src/server.ts` STATIC_ROUTES gains one entry (keeping the whitelist-only comment true):

```ts
  "/ui/static/theme.js": { file: new URL("./ui/static/theme.js", import.meta.url), type: "text/javascript; charset=utf-8" },
```

  - `src/ui/static/index.html` `<head>`, after the stylesheet link:

```html
  <script src="/ui/static/theme.js"></script>
```

    (classic blocking script — no `defer`, no `type="module"` — that's what guarantees the stamp lands before first paint).

- [ ] **Step 4: Run the full suite**

Run: `bun test && bunx tsc --noEmit`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/static/theme.js src/server.ts src/ui/static/index.html tests/ui-api.test.ts
git commit -m "feat(kcal-assistant): theme.js — temastämpel före första målningen"
```

---

### Task 3: CSS — `light-dark()` palette + toggle styling

**Files:**
- Modify: `kcal-assistant/src/ui/static/app.css:1-36` (palette block) + append `.theme-toggle` rules

**Interfaces:**
- Produces: `:root[data-theme="light"|"dark"]` forces a side; no attribute = OS. CSS class `.theme-toggle` for Task 4's button.

- [ ] **Step 1: Rewrite the palette block** — replace lines 1-36 of `src/ui/static/app.css` (header comment, `:root`, and the whole `@media (prefers-color-scheme: light)` block) with:

```css
/* KCAL·DB — labbkvitto: precise mono numerals, hairline rules, dotted leaders.
   Theme via light-dark(): color-scheme picks the side. No data-theme attribute
   = follow the OS; theme.js stamps an explicit choice before first paint.
   Strict CSP: no inline. */

:root {
  color-scheme: dark light;
  --bg: light-dark(#f4efe5, #131110);
  --surface: light-dark(#fbf8f1, #1b1815);
  --surface-2: light-dark(#efe9dc, #221e1a);
  --ink: light-dark(#27221a, #ece5d8);
  --ink-2: light-dark(#6b6455, #a89f90);
  --ink-3: light-dark(#99917f, #6f685c);
  --hair: light-dark(#ddd5c4, #2f2a23);
  --hair-2: light-dark(#c4bba6, #453e33);
  --accent: light-dark(#9a7414, #e0b84b);
  --accent-dim: light-dark(#c7a94e, #8a7330);
  --ok: light-dark(#1e7a60, #3fa486);
  --under: light-dark(#ab3f36, #c4534a);
  --mono: ui-monospace, "SF Mono", "Cascadia Mono", "JetBrains Mono", Menlo, monospace;
  --sans: system-ui, -apple-system, "Segoe UI", sans-serif;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

- [ ] **Step 2: Audit for stragglers**

Run: `grep -n "prefers-color-scheme" src/ui/static/app.css src/ui/app -r`
Expected: no hits. Also confirm `grep -c "light-dark" src/ui/static/app.css` = 12 (one per themed variable). The scenario colors #0072b2/#e69f00 and ghost opacity stay theme-fixed by design.

- [ ] **Step 3: Add the toggle styling** — append to `app.css` after the `.masthead-meta` rule (~line 75):

```css
.theme-toggle {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-2);
  background: none;
  border: 1px solid var(--hair-2);
  border-radius: 3px;
  padding: 2px 8px;
  cursor: pointer;
}
.theme-toggle:hover { color: var(--accent); border-color: var(--accent-dim); }
```

- [ ] **Step 4: Verify build**

Run: `bun run build:ui && bun test`
Expected: build clean, suite green (CSS is not bundled by build:ui, but the command pair is the release gate).

- [ ] **Step 5: Commit**

```bash
git add src/ui/static/app.css
git commit -m "feat(kcal-assistant): light-dark()-palett + color-scheme-styrning"
```

---

### Task 4: Masthead cycle button

**Files:**
- Modify: `kcal-assistant/src/ui/app/index.tsx:44-56` (App component area)

**Interfaces:**
- Consumes: `data-theme` attribute + `kcal.theme` key (Task 2), `.theme-toggle` class (Task 3).

- [ ] **Step 1: Implement** — in `src/ui/app/index.tsx`, above `function App()` add:

```tsx
type Theme = "system" | "light" | "dark";
const THEME_LABEL: Record<Theme, string> = { system: "system", light: "ljust", dark: "mörkt" };
const THEME_NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem("kcal.theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function applyTheme(t: Theme): void {
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try {
    if (t === "system") localStorage.removeItem("kcal.theme");
    else localStorage.setItem("kcal.theme", t);
  } catch {
    // private mode etc — the attribute still applied, only persistence is lost
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const cycle = () => {
    const next = THEME_NEXT[theme];
    applyTheme(next);
    setTheme(next);
  };
  return (
    <button className="theme-toggle" aria-label="växla tema" onClick={cycle}>
      tema: {THEME_LABEL[theme]}
    </button>
  );
}
```

  In the masthead JSX, after the `masthead-meta` span:

```tsx
        <ThemeToggle />
```

- [ ] **Step 2: Verify build + suite**

Run: `bun run build:ui && bun test && bunx tsc --noEmit`
Expected: all clean.

- [ ] **Step 3: Quick dev-server sanity check** — from kcal-assistant/:

```bash
UI_DEV_NO_AUTH=1 MCP_TOKEN=dev DB_PATH=/tmp/kcal-theme-dev.db PORT=3998 bun run start & SERVER_PID=$!
sleep 2 && curl -s http://localhost:3998/ui/static/theme.js | head -2 && curl -s http://localhost:3998/ui | grep -c theme.js; kill $SERVER_PID
```

Expected: theme.js source echoed; index.html references it once.

- [ ] **Step 4: Commit**

```bash
git add src/ui/app/index.tsx
git commit -m "feat(kcal-assistant): temaväxlare i mastheaden (system/ljust/mörkt)"
```

---

### Task 5: Fast-follows — loadPinned validation + tooltip suppression

**Files:**
- Modify: `kcal-assistant/src/ui/app/views/Vikt.tsx:14-24` (loadPinned), `kcal-assistant/src/ui/app/components/WeightChart.tsx:145-165` (tooltip block)

**Interfaces:**
- Consumes: existing `PrognosParams { source, overrides }` and the tooltip's `kgAt(curve, t): number | null`.

- [ ] **Step 1: Harden `loadPinned`** — replace the filter in `src/ui/app/views/Vikt.tsx` with:

```tsx
const OVERRIDE_KEYS = ["activity", "intake", "goal", "goal_date"] as const;

function loadPinned(): PrognosParams[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is PrognosParams =>
      p !== null && typeof p === "object" &&
      (p.source === "targets" || p.source === "recent") &&
      typeof p.overrides === "object" && p.overrides !== null &&
      Object.entries(p.overrides).every(
        ([k, v]) => (OVERRIDE_KEYS as readonly string[]).includes(k) && (v === undefined || typeof v === "string"),
      ),
    ).slice(0, 2);
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Suppress empty scenario tooltip lines** — in `src/ui/app/components/WeightChart.tsx`, the tooltip currently sizes its rect with `34 + scenarios.length * 10` and maps all scenarios. Compute visible lines first (at component body level, right after the `kgAt` definition — the ternary guards the null-hover case):

```tsx
  const scenarioHits = hover
    ? scenarios
        .map((s) => ({ slot: s.slot, kg: kgAt(s.curve, hover.t) }))
        .filter((s): s is { slot: 0 | 1; kg: number } => s.kg !== null)
    : [];
```

  Then: rect height becomes `34 + scenarioHits.length * 10`, and the scenario `<text>` map iterates `scenarioHits` (`S{s.slot + 1} ≈ {sv(s.kg)} kg`, `y={13 + i * 10}`). A hovered date outside every pinned curve shows no scenario lines at all.

- [ ] **Step 3: Verify build + suite, plus a manual corruption check**

Run: `bun run build:ui && bun test && bunx tsc --noEmit`
Then in the Task 4 dev server (or the Task 6 walk): set `localStorage["kcal.scenarios"] = '[{"source":"targets","overrides":{"activity":1.55}}]'` in the console, reload → Vikt renders with zero pinned scenarios (no crash).

- [ ] **Step 4: Commit**

```bash
git add src/ui/app/views/Vikt.tsx src/ui/app/components/WeightChart.tsx
git commit -m "fix(kcal-assistant): validera scenario-storage + dölj tomma tooltip-rader"
```

---

### Task 6: Browser walk, version bump, PR

**Files:**
- Modify: `kcal-assistant/package.json` (0.9.1), `kubernetes/apps/home-automation/kcal-assistant/deployment.yaml:26` (image `v0.9.1`)

- [ ] **Step 1: Browser walk** (dev server, seeded db from the v0.9.0 walk works):
1. Toggle cycles system → ljust → mörkt with instant restyle on every view (Idag, Vikt, Recept).
2. Reload with "mörkt" while OS is light: NO flash of light theme (theme.js stamp).
3. "tema: system" follows a live OS appearance change.
4. Corrupted `kcal.scenarios` (number value) → Vikt renders, pins dropped.
5. Hover an actual dot with a pinned scenario whose curve doesn't cover that date → no "S≈" line; hover the projection → scenario line present.
6. Console: no new errors beyond the known favicon 404 / Radix CSP notes.

- [ ] **Step 2: Bump** — `package.json` `"version": "0.9.1"`; deployment.yaml image `rutbergphilip/kcal-assistant:v0.9.1`.

- [ ] **Step 3: Final gates**

Run: `bun test && bunx tsc --noEmit && bun run build:ui`
Expected: all green.

- [ ] **Step 4: Commit + PR**

```bash
git add package.json ../kubernetes/apps/home-automation/kcal-assistant/deployment.yaml
git commit -m "feat(kcal-assistant): v0.9.1 — temaväxlare + fast-follows"
git push -u origin kcal-v0.9.1-theme-switcher
gh pr create --title "feat(kcal-assistant): v0.9.1 — temaväxlare + fast-follows" --body "$(cat <<'EOF'
Temaväxlare per spec docs/superpowers/specs/2026-07-11-kcal-theme-switcher-design.md:

- **Temaväxlare**: 3-lägescykel (system → ljust → mörkt) i mastheaden; light-dark()-palett styrd av color-scheme (ingen duplicerad variabelblock); externt blockerande theme.js i <head> ger noll-flash utan att bryta strikt CSP; valet i localStorage["kcal.theme"].
- **Fast-follows från v0.9.0**: värde-validering av scenario-storage (korrupt localStorage kan inte krascha Vikt), tomma scenario-tooltiprader döljs, delad weeklyCurve-helper.

UI-only: ingen migration, MCP oförändrat (24 verktyg). Ingen ny chatt behövs.

Plan: docs/superpowers/plans/2026-07-11-kcal-theme-switcher.md

https://claude.ai/code/session_018bdcBb7HJ6UUj8LXCt18qD
EOF
)"
```

After merge: CI builds → Flux deploys; verify pod v0.9.1, healthz 200, toggle live behind Authentik.
