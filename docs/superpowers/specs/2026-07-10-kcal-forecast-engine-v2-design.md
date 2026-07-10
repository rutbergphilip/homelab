# kcal-assistant v0.9.0 — Prognosmotor v2 (trendvikt, ärlig osäkerhet, träffsäkerhet, scenarier)

Date: 2026-07-10
Status: design approved in brainstorming with Philip; this document is the spec for the implementation plan.
Scope: one release (one PR), migration 5, no new MCP tools and **no MCP input-schema
or tool-description changes** (response payloads only grow → no new chat needed).
Builds on v0.6.0 forecast (spec `2026-07-09-kcal-time-and-forecast-design.md`) and
v0.7.0 what-if previews (spec `2026-07-10-kcal-ui-profile-editing-design.md`).

## Goal

Four upgrades to the weight forecast, all chosen by Philip:

1. **Trendvikt** — smooth noisy daily weigh-ins (EWMA) and drive display + forecast
   start from the trend, not raw points.
2. **Ärlig osäkerhet** — replace the hardcoded ±150 kcal band with a data-driven
   error budget; goal-ETA becomes a range instead of a point.
3. **Träffsäkerhet** — persist daily forecast snapshots and measure past forecasts
   against actual (trend) weight; show the error.
4. **Scenariojämförelse** — pin up to two what-if previews next to the saved
   baseline on the Vikt chart (UI-only).

Ordering rationale: snapshots only accumulate from the day they ship, and the
smoother trend/TDEE feeds every later feature (målrekommendation, veckobalans,
veckorapport — separate future releases).

## 1. Trendvikt (EWMA)

New pure function in `src/lib/trend.ts`:

```
computeTrendWeight(weights: WeightEntry[]): Array<{ date, weight_kg, trend_kg }>
```

- Hacker's Diet-style exponential smoothing adapted for irregular weigh-ins:
  `trend_i = trend_{i-1} + α_eff × (weight_i − trend_{i-1})` with
  `α_eff = 1 − 0.9^gap_days` (α = 0.10/day). Seed: `trend_0 = weight_0`.
  Computed at weigh-in dates only; `trend_kg` rounded to 2 decimals.
- **Used in three places:**
  1. **Vikt chart** — raw weigh-ins become dots, the trend is the drawn line;
     hover shows both values. The UI weights payload gains `trend_kg` per point
     (computed server-side; the chart never re-implements the math).
  2. **Forecast start weight** — `computeForecast` starts from the trend value at
     the latest weigh-in instead of the 7-day mean. `start.weighins_smoothed` is
     removed from `ForecastResult`; UI copy says "trendvikt". `start.stale`
     logic unchanged.
  3. **`get_trend`** — response's `latest` gains `trend_kg`.
- **Deliberately NOT used for the TDEE calculation.** `computeTrend`'s
  two-half-window means already smooth both endpoints; EWMA lags by design and
  would bias the measured rate (and TDEE) toward zero. The TDEE math is untouched.

## 2. Ärlig osäkerhet (error budget + ETA range)

`BAND_KCAL = 150` is replaced by a computed budget. New pure function in
`src/lib/forecast.ts`:

```
computeBand(input: {
  calibration: "mätdata" | "formel",
  intake_source: "targets" | "recent" | "explicit",
  weighins_last_28d: number,
}): { kcal: number, reasons: string[] }
```

| Contribution | Condition | kcal |
|---|---|---|
| Bas (modell- + loggbrus) | alltid | 100 |
| Kalibrering | mätdata | +50 |
| | formel (ingen/osäker mätning) | +200 |
| Intagsantagande | recent (uppmätt beteende) | +25 |
| | targets / explicit (antar framtida följsamhet) | +75 |
| Glesa vägningar | < 10 vägningar senaste 28 d | +50 |

Clamped to **[125, 400]**. The low/high curves re-simulate at `intake ∓ band`
exactly as today, so kg-uncertainty keeps growing with horizon naturally.

- `assumptions.band_kcal` added to `ForecastResult`; a Swedish note explains the
  budget ("osäkerhet ±350 kcal/dag: formelkalibrering, glesa vägningar").
- **ETA range:** goal ETA is additionally computed on the low and high curves →
  `goal.eta_range = { earliest: string | null, latest: string | null }`.
  When losing toward the goal the low curve (larger deficit) gives `earliest`,
  the high curve gives `latest`; `latest: null` = "möjligen bortom horisonten".
  `eta_range` is present whenever `goal` is (null members allowed); the point
  `eta` stays for compatibility. UI ETA tile shows "~24 sep (12 sep – 18 okt)";
  chat gets the same fields via `get_forecast`.
- Considered and rejected: Monte Carlo (unexplainable overkill). Deferred:
  empirically fitted band from measured forecast error — becomes possible once
  §3's snapshots accumulate; the budget function is the single place to re-base.

## 3. Träffsäkerhet (snapshots + accuracy)

### Storage (migration 5)

```sql
CREATE TABLE forecast_snapshots (
  date               TEXT PRIMARY KEY,  -- snapshot day (Stockholm)
  created_at         TEXT NOT NULL,
  start_date         TEXT NOT NULL,
  start_kg           REAL NOT NULL,
  intake_kcal        INTEGER NOT NULL,
  intake_source      TEXT NOT NULL,
  tdee_start         INTEGER NOT NULL,
  calibration_offset INTEGER NOT NULL,
  band_kcal          INTEGER NOT NULL,
  curve_json         TEXT NOT NULL      -- weekly points [{date, kg, low, high}]
);
```

One row per day, upsert (last write of the day wins). Weekly curve ≈ 53 points,
a few KB/row. New module `src/db/snapshots.ts` (save + read + prune-nothing —
data is small and precious).

### Write policy

Only **canonical** forecasts snapshot: stored profile, `intake_source =
"targets"`, no overrides (`intake_kcal`/`goal_weight`/`activity_factor`/
`goal_date`/`target_date` all absent). Previews never write. Triggers:

- `log_weight` — after insert, compute canonical forecast → snapshot,
  **best-effort**: a snapshot failure must never fail the weight log (try/catch;
  weight write commits regardless).
- `get_forecast` (MCP) and `GET /ui/api/forecast` when called canonically.
- No profile / no weigh-ins → `buildForecast` returns null → skip silently.

### Accuracy math

New pure module `src/lib/accuracy.ts`:

```
computeForecastAccuracy(
  snapshots, trendWeights, today
): { per_age: Array<{ days, n, mae_kg, bias_kg }> } | null
```

For each snapshot and each age `a ∈ {7, 14, 28, 56}` days: predicted weight =
linear interpolation of the snapshot curve at `snapshot.date + a`; actual =
`trend_kg` of the weigh-in nearest that date within ±3 days (else skip).
`bias_kg` = mean(predicted − actual): positive = forecasts run heavy
(pessimistic for weight loss). An age bucket reports only with `n ≥ 3`;
returns null when no bucket qualifies.

### Surfaces

- **`get_forecast` / `/ui/api/forecast` response** gains, when data qualifies
  (omitted otherwise — never empty objects):
  - `accuracy: { per_age: [...] }`
  - `ghost: { snapshot_date, curve }` — the snapshot nearest 28 days ago
    (only when one ≥ 21 days old exists), for the UI overlay.
- **Vikt page:** "Träffsäkerhet" section under the chart (per-age tiles:
  "28 d: ±0.4 kg, bias −0.2 kg" with a one-line explanation), hidden entirely
  until data exists. Ghost curve: faint dashed overlay drawn **only from its
  start to today** (never into the future — the live projection owns that side),
  toggleable via chip ("prognos för 28 d sedan").

## 4. Scenariojämförelse (UI-only)

No server changes — `/ui/api/forecast` already takes preview params; comparison
is parallel fetches.

- The live preview in Prognos-inställningar gains **"Fäst scenario"**: pins the
  current param set as a chip. Max 2 pinned; a third pin replaces the oldest.
- Chart: the saved baseline is the only curve with a band; pinned scenarios are
  thin solid lines in distinct colorblind-safe colors from the existing chart
  palette. Hover tooltip lists every visible curve's kg.
- Chips show a params summary + that scenario's goal-ETA; removable (×).
- Pins persist in `localStorage` (param sets, refetched on load) with the
  existing in-flight guard / keep-last-good-on-failure pattern.
- Deliberately **no** scenario batching in `get_forecast` (MCP): Claude can
  already call it with explicit intake; comparison is a visual activity.

## Testing

- **Unit (pure fns):** EWMA — single point, regular series, gap α_eff, lag
  behavior; band — every contribution, combinations, clamps; ETA range —
  losing/gaining/never-reaches, null latest; accuracy — synthetic snapshots vs
  synthetic actuals, bias sign, ±3-day matching, n < 3 gate, null result.
- **db:** migration 5 applies; same-day upsert; canonical-only writes (preview
  params → no row); `log_weight` succeeds even when snapshotting throws.
- **API:** `/ui/api/forecast` new fields present/omitted correctly; auth matrix
  untouched (read-only additions).
- **Playwright:** trend line + dots render; pin/unpin + reload persistence;
  träffsäkerhet hidden when empty; ghost toggle.
- Build gotcha (standing): `bun run build:ui` must use `--production`; verify UI
  in a real browser, not just tests.

## Rollout

Same-PR: `package.json` 0.9.0 + `deployment.yaml` image tag → merge → CI builds
→ Flux (`cluster-apps` Kustomization, lags ~1 min; pods match label
`app=kcal-assistant`; ~10 s ingress 503 after Recreate). Verify: pod v0.9.0,
healthz 200, `tools/list` = 24, Vikt page in browser (trend line, band note,
pinned scenario). **No new chat needed** — tool inputs and descriptions are
frozen this release. Träffsäkerhet stays empty for ~a week by design; first
snapshot lands with Philip's first post-deploy weigh-in.
