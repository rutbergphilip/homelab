# kcal-assistant v0.7.1 — Aktivitetsnivå som namngivna val

Date: 2026-07-10. Status: approved (design presented and accepted verbatim).
Scope: UI-only patch; one file (`src/ui/static/app.js`) + version bump.

Philip's feedback: the raw aktivitetsfaktor number input (1.2 etc.) is unclear;
he wants named levels ("stillasittande" osv).

## Change

In `buildPrognosPanel`, the aktivitetsfaktor `number` input becomes a `select`
labeled **Aktivitetsnivå** with the five canonical levels (same scale
`set_profile`'s tool description documents):

- stillasittande (1,2) → 1.2 — "kontorsjobb, lite eller ingen träning"
- lätt aktiv (1,375) → 1.375 — "lätt träning 1–3 dagar i veckan"
- måttligt aktiv (1,55) → 1.55 — "träning 3–5 dagar i veckan"
- mycket aktiv (1,725) → 1.725 — "hård träning 6–7 dagar i veckan"
- extremt aktiv (1,9) → 1.9 — "mycket hård träning och fysiskt arbete"

Labels show name + factor (comma-decimal, sv-SE); option values stay
dot-decimal numerics sent to the API unchanged. A small description line
(k-sub style) under the select shows the selected level's example (per
Philip's follow-up: "typ gym 3–5 dagar i veckan") and updates on change;
for "anpassad" it reads "eget värde satt via chatten". Selecting a level previews
live (same `state.overrides.activity` + debounce path) and Spara persists the
numeric factor. No server, API, or MCP changes — chat can still set any
1.2–2.5 factor.

## Non-preset stored values

If the stored factor isn't one of the five presets (Philip's current 1.5),
the select shows a **disabled, selected** "anpassad (1,5)" option so the UI
displays the saved truth; choosing any named level replaces it and the
anpassad entry can't be re-selected. With no profile, a disabled
"välj nivå …" placeholder with empty value keeps the existing
first-save semantics (activity omitted from the PUT until chosen;
`setProfile`'s Swedish first-insert error already covers it).

## Out of scope

Any change to `set_profile`, the forecast endpoints, or the stored data model.
