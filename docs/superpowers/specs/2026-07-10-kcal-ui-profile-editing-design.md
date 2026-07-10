# kcal-assistant v0.7.0 — Redigerbar profil + prognos-what-if i UI

Date: 2026-07-10
Status: design approved in brainstorming with Philip; this document is the spec for the implementation plan.
Scope: one release (one PR), no migration, no new MCP tools. Builds on v0.6.0
(spec `2026-07-09-kcal-time-and-forecast-design.md`).

## Goal

Profile and forecast inputs become editable from the KCAL·DB UI (today they are
chat-only via `set_profile`), and the Vikt page's projection updates in real time
while editing. Chat (MCP) and UI edit the same profile through the same code path.

Per Philip's scope decisions: **editable in UI** = profile + goals, and live
what-if controls. **Stays chat-only** = day targets, preferences/rules.

## Security model (the one posture change)

The UI has been read-only by construction. v0.7 amends that to:
**read-only except `PUT /ui/api/profile`** — a single, narrow write endpoint.

- Same Authentik forward-auth + server-side verification as all `/ui` traffic
  (single user). The auth layer must gate the PUT exactly as it gates GETs.
- CSRF hardening (auth is cookie-based): the PUT requires
  `Content-Type: application/json` AND `Sec-Fetch-Site: same-origin` exactly
  (not `same-site` — other rutberg.dev subdomains must not be able to write);
  otherwise 403. Non-browser clients without the header are rejected; tests
  and local curl set it explicitly.
- Body is a JSON subset of `ProfileInput`; the handler calls the existing
  `setProfile` (Swedish validation, partial updates, null clears goals).
  Validation failure → 400 `{ error: <setProfile's Swedish message> }` —
  these strings are user-facing by design; no internals leak.
- The "Read-only by construction" comment in `src/ui/api.ts` is updated to
  state the exception explicitly.

## Server changes

1. **`buildForecast` overrides** (`src/db/forecast.ts`): opts gain
   `activity_factor?: number` and `goal_date?: string | null` (applied on top of
   the stored profile before `computeForecast`; `goal_weight` and `intake_kcal`
   overrides already exist). Overrides never touch the database.
2. **`GET /ui/api/forecast`** accepts optional override params in addition to
   `source`: `intake` (kcal, positive number), `activity` (1.2–2.5),
   `goal` (kg, positive), `goal_date` (YYYY-MM-DD). Each validated; invalid →
   400 `{ error: "ogiltig <param>" }`. Still strictly read-only.
3. **`GET /ui/api/profile`** → `{ profile: Profile | null }` (populates the form).
4. **`PUT /ui/api/profile`** → as above; success returns the updated profile.
   Methods other than GET and PUT on `/ui/api/profile` → 405. The UI-API
   dispatch (`handleUiApi`) gains method + body awareness (today it is GET-only).

MCP surface unchanged (24 tools; `set_profile` remains).

## UI changes (Vikt page)

- **Prognos-inställningar panel** (next to the chart): aktivitetsfaktor
  (number input 1.2–2.5), intag-override (kcal; tomt = automatiskt enligt vald
  källa), målvikt (kg), måldatum (date) + the existing planmål/senaste-28d
  source toggle.
  - Any change → debounced (~200 ms) preview fetch with override query params →
    chart, tiles, ETA and date-picker curve all redraw.
  - While any unsaved override is active, the chart shows a **förhandsvisning**
    chip so saved vs what-if state is never ambiguous.
- **Spara** persists aktivitetsfaktor, målvikt, måldatum via the PUT, then
  re-fetches the canonical forecast (no overrides) and clears preview state.
  Button disabled while in flight; failure shows the server's Swedish message
  in the existing error-banner style; success re-renders from canonical data.
  Clearing målvikt/måldatum fields saves as explicit `null` (removes the goal).
- **Intag-override is what-if only** (explicit decision): there is no persistent
  intake field — real intake comes from plan targets or logs. The override
  resets on save and on reload.
- **Profil collapsible** (same `details/summary` pattern as product cards):
  födelsedatum, kön (man/kvinna), längd — populated from `GET /ui/api/profile`,
  saved through the same PUT and the same Spara flow.
- **No profile yet**: the panel doubles as the create form. First save requires
  the four physiological fields; `setProfile` enforces this and its Swedish
  error is surfaced verbatim.
- CSP posture unchanged: vanilla JS, `el()`/`addEventListener`, no inline
  handlers, Swedish copy, labbkvitto aesthetic.

## Failure modes

- PUT without auth → blocked by the auth layer (must be covered by ui-auth tests).
- PUT with wrong Content-Type or cross-site fetch signal → 403.
- PUT with invalid values → 400 + Swedish message shown in the panel.
- Preview fetch failure → keep last good render + error note (v0.6 behavior
  extends to preview fetches).
- Override params out of range on GET → 400 (the UI never sends invalid values;
  this is API hygiene).

## Tests

- `ui-api`: GET profile (null and present); PUT happy path / partial update /
  null-clears-goal / validation 400 / malformed JSON 400 / missing same-origin
  signal 403 / wrong method 405; forecast override params (each param changes
  the result as expected; invalid values 400).
- `ui-auth`: the PUT path added to the auth matrix — the write endpoint must be
  provably behind auth (this is the security-critical test of the release).
- No UI unit tests (consistent with the codebase); manual dev-server
  verification of the live-preview loop.

## Release

v0.7.0. No migration. Version bump in `package.json` + image tag in
`deployment.yaml`, same PR/CI/Flux flow. No connector/chat impact
(tool list unchanged — no new-chat requirement this time).

## Out of scope (deliberate)

- Editing day targets or preferences/rules from the UI (chat-only, per Philip).
- Persistent intake override (would be a new profile concept — YAGNI).
- Client-side simulation (server stays the single source of math truth).
- Any second write endpoint.
