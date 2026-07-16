# Hue scene & naming audit

Audit of Home Assistant `light.*` and `scene.*` entities against the room mapping in
`glass-cards/scripts/hub-config.mjs`. Data pulled live from `https://home.rutberg.dev/api/states`
and `https://home.rutberg.dev/api/template` (for HA area assignment) on 2026-07-16.

## Lights

| Entity | HA friendly name | HA area | Hub room (hub-config.mjs) | Mismatch? |
|---|---|---|---|---|
| `light.vardagsrum` | Vardagsrum | Vardagsrum | Vardagsrum | OK |
| `light.tv` | Tv | Vardagsrum | Vardagsrum | OK |
| `light.kok` | Kök | Kök | Kök | OK |
| `light.tak_1` | Tak 1 | Kök | Kök | OK |
| `light.tak_2` | Tak 2 | Kök | Kök | OK |
| `light.slinga` | Slinga | Kök | Kök | OK |
| `light.hue_white_luster_1` | Fönster | Kök | **none** (`light.koksfonstret` referenced instead, does not exist) | **MISMATCH — orphan** |
| `light.sovrum` | Sovrum | Sovrum | Sovrum | OK |
| `light.lightstrip` | Lightstrip | Sovrum | Sovrum | OK |
| `light.hue_white_luster_1_2` | Fönster | Sovrum | **none** (`light.sovrumsfonstret` referenced instead, does not exist) | **MISMATCH — orphan** |
| `light.spot_1` | Spot 1 | Sovrum | Sovrum | OK |
| `light.spot_2` | Spot 2 | Sovrum | Sovrum | OK |
| `light.spot_3` | Spot 3 | Sovrum | Sovrum | OK |
| `light.hall` | Hall | Hall | Hall | OK |
| `light.hall_spot_1` | Hall spot 1 | Hall | Hall | OK |
| `light.hall_spot_2` | Hall spot 2 | Hall | Hall | OK |
| `light.hall_spot_3` | Hall spot 3 | Hall | Hall | OK |
| `light.office` | Office | **Bedroom** | Office | Low-severity — HA area registry says "Bedroom", friendly name/usage says Office. Doesn't affect hub-config (keyed by entity_id, not area). |
| `light.badrum` | Badrum | Badrum | Badrum | OK |
| `light.spotlight_top` | Spotlight Top | Badrum | Badrum | OK |
| — | — | — | `light.koksfonstret` (in hub-config, **does not exist in HA**) | **MISMATCH — dangling reference** |
| — | — | — | `light.sovrumsfonstret` (in hub-config, **does not exist in HA**) | **MISMATCH — dangling reference** |

**Total real `light.*` entities in HA:** 20. **Referenced in hub-config.mjs:** 20 slots, but 2 of
them (`light.koksfonstret`, `light.sovrumsfonstret`) point at entity IDs that don't exist — 18 of
the 20 slots resolve correctly.

## Scenes

| Entity | Friendly name | Scope |
|---|---|---|
| `scene.hall_koppla_av` | Hall Koppla av | Hall |
| `scene.hall_klart_ljus` | Hall Klart ljus | Hall |
| `scene.hall_concentrate` | Hall Concentrate | Hall |
| `scene.hall_las` | Hall Läs | Hall |
| `scene.hall_nattlampa` | Hall Nattlampa | Hall |
| `scene.hall_fa_ny_energi` | Hall Få ny energi | Hall |
| `scene.office_las` | Office Läs | Office |
| `scene.office_koppla_av` | Office Koppla av | Office |
| `scene.office_concentrate` | Office Concentrate | Office |
| `scene.office_nattlampa` | Office Nattlampa | Office |
| `scene.office_fa_ny_energi` | Office Få ny energi | Office |
| `scene.badrum_nattljus` | Badrum Nattljus | Badrum |

All 12 scenes are single-room Hue scenes (`group_name` = Hall / Office / Badrum). **None are
whole-home scenes**, and none match `Kvällsläge`/kväll/evening/relax or `Film`/movie/bio semantics
at a whole-home scope. The closest per-room analogues ("Koppla av" = relax, in Hall and Office
only) don't cover the other rooms and aren't the whole-home scenes the wall-hub spec (§5) calls for.

## Findings

### Critical — dangling light references in hub-config.mjs

`hub-config.mjs`'s `kok` room lists `light.koksfonstret` and the `sovrum` room lists
`light.sovrumsfonstret`. **Neither entity exists in Home Assistant.** The real window lights are
`light.hue_white_luster_1` (area: Kök, friendly name "Fönster") and `light.hue_white_luster_1_2`
(area: Sovrum, friendly name "Fönster") — both orphaned, not referenced anywhere in hub-config.
This means the Kök and Sovrum window-light tiles in the current dashboard control a
non-existent entity and are silently broken (no-op).

Likely cause: the Hue integration re-added these two lights under generic
`light.hue_white_luster_1[_2]` IDs (friendly name just "Fönster") at some point, rather than the
originally expected `light.koksfonstret` / `light.sovrumsfonstret` IDs.

This is out of scope for this audit task (scope is limited to adding the `scenes:` block), so it
has **not** been fixed here. Recommend a follow-up fix in hub-config.mjs's `rooms` array:
- `kok.lights`: replace `{ entity: 'light.koksfonstret', name: 'Köksfönstret' }` with
  `{ entity: 'light.hue_white_luster_1', name: 'Köksfönstret' }`
- `sovrum.lights`: replace `{ entity: 'light.sovrumsfonstret', name: 'Fönsterlampa' }` with
  `{ entity: 'light.hue_white_luster_1_2', name: 'Fönsterlampa' }`

### Low — `light.office` HA area mismatch

`light.office` is assigned to HA area "Bedroom" rather than "Office". Cosmetic/registry-only;
hub-config addresses it by entity_id so this doesn't break anything, but worth tidying in the Hue/HA
area registry at some point.

### Scene gaps — whole-home scenes missing

Per spec §5, the wall hub needs three whole-home actions: `Kvällsläge`, `Film`, `Allt släckt`.

- **`Allt släckt`** — not a scene; implemented as a `light.turn_off` service call with
  `entity_id: all`. Handled by the Ljus page (Task 8), no Hue scene needed.
- **`Kvällsläge`** — **does not exist.** No scene with this name, and no scene semantically matching
  "evening/relax" exists at whole-home scope (only per-room "Koppla av" scenes in Hall/Office).
- **`Film`** — **does not exist.** No scene matching movie/film/bio semantics exists at any scope.

**User action needed:** Philip needs to create two whole-home Hue scenes in the Hue app (not the HA
scene editor) so they exist identically in HomeKit too:
1. A scene named **Kvällsläge** covering the whole home (or however Philip wants the warm/evening
   mood lighting set across rooms).
2. A scene named **Film** covering the whole home (movie-watching lighting).

Once created in the Hue app, they'll sync into Home Assistant as new `scene.*` entities. Re-run the
Step 1 dump (`curl … | jq -r '.[] | select(.entity_id|startswith("scene."))…'`) to get their
`entity_id`s, then fill in `hub-config.mjs`'s `scenes:` array (see below — currently an empty
placeholder with a comment).
