# Jarvis Voice Assistant — Phase 0 Config Mirror

Repo-side record of everything configured live in Home Assistant for the Jarvis voice
assistant project. HA stores all of this in its own storage (`.storage/*`, Assist Pipeline
store) — nothing here is consumed by Flux/HA directly except the two Wyoming Kubernetes
deployments. This file exists so the config survives outside HA's SQLite/JSON storage and
so a future session doesn't have to re-derive it from the live API.

Written after Tasks 1–9 (2026-07-22). **No secrets or API keys anywhere below** — keys
live in HA's config-flow storage and, where relevant, `.claude/ha-token`.

---

## Cluster services (Flux-managed)

Two Wyoming-protocol services run in-cluster, both under
`kubernetes/apps/home-automation/`, wired into HA as `wyoming` config-entries.

### wyoming-whisper (Swedish STT)

- Flux path: `kubernetes/apps/home-automation/wyoming-whisper/` (`deployment.yaml`,
  `service.yaml`, `kustomization.yaml`), referenced from the parent
  `kubernetes/apps/home-automation/kustomization.yaml`.
- Image: `rhasspy/wyoming-whisper:3.5.0`.
- Model: `KBLab/kb-whisper-small` (Swedish STT).
- Endpoint: `wyoming-whisper.home-automation.svc.cluster.local:10300`.
- Resources: requests 2Gi memory / limits 4Gi memory (raised from the original 1Gi/2Gi
  brief spec — 2Gi limit OOMKilled during model load; fixed forward in commit `a7dce5d`).
- HA config entry: domain `wyoming`, title **faster-whisper**, entry_id
  `01KY5ADWJVGSPZD38XT3TVERTK` → produces entity **`stt.faster_whisper`**.

### wyoming-piper (Swedish TTS, offline fallback)

- Flux path: `kubernetes/apps/home-automation/wyoming-piper/` (`deployment.yaml`,
  `service.yaml`, `kustomization.yaml`).
- Image: `rhasspy/wyoming-piper:2.3.1`.
- Voice: `sv_SE-nst-medium` (medium quality, robotic but free/fully offline).
- Endpoint: `wyoming-piper.home-automation.svc.cluster.local:10200`.
- Resources: requests 100m CPU/256Mi memory, limits 1 CPU/512Mi memory (no OOM issues —
  brief spec unchanged).
- HA config entry: domain `wyoming`, title **piper**, entry_id
  `01KY5AE4589D52475MGQ09TSN7` → produces entity **`tts.piper`**.

---

## HA version requirement

- Home Assistant upgraded **2025.12 → 2026.7.3** (commit `8d9a067`) — required because the
  Anthropic integration's web-search tool needs 2026.x.
- Post-upgrade config backup (the only one that actually persisted — see gotcha below):
  `/config/backups/config-backup-2026.7.3-post-upgrade.tgz` inside the HA pod.
- No `configuration.yaml` edits were required by any 2026.1–2026.7 breaking change for
  this stack (checked template/rest/command_line/homekit/sonos/caldav/google_calendar/
  volvo/roborock/hasl3/tibber/anthropic/google_cloud/wyoming specifically).

---

## Anthropic agent — Jarvis's brain

Config entry: domain `anthropic`, title "Claude", entry_id `01KY5AY9J7ZGSHY60HX4T3JD1K`.
No options flow on the entry itself in this HA build — configured via a **conversation
subentry** (`subentry_id 01KY5AY9J7PRYRP80RKX1FQAHF`, title "Claude conversation") using
the subentry reconfigure-flow REST endpoints
(`POST /api/config/config_entries/subentries/flow`). Produces conversation entity
**`conversation.claude_conversation`**.

### System prompt (verbatim, byte-for-byte verified against HA's saved value)

```
Du är Jarvis, hemmets röstassistent. Du pratar naturlig, avslappnad svenska.

Regler:
- Svara kort och talvänligt: 1–3 meningar. Inga listor, ingen markdown, inga emojis — ditt svar läses upp högt.
- Styr bara enheter när användaren tydligt ber om det. Gissa aldrig en åtgärd.
- Använd webbsökning endast för dagsaktuella frågor (nyheter, sport, öppettider, priser). Använd hemmets sensorer för elpris, väder, tåg och CO₂ — sök inte på webben efter sådant du redan kan läsa av.
- Om en fråga är tvetydig: ställ en kort motfråga i stället för att chansa.
- Svara alltid på svenska.
```

### Every option value set

| Step | Field | Value |
|---|---|---|
| `init` | `prompt` | (verbatim above) |
| `init` | `llm_hass_api` | `["assist"]` (Control Home Assistant / Assist API) |
| `init` | `recommended` | `false` |
| `advanced` | `chat_model` | `claude-haiku-4-5` |
| `advanced` | `prompt_caching` | `prompt` (system-prompt caching strategy; options were off/prompt/automatic) |
| `model` | `max_tokens` | `300` |
| `model` | `thinking_budget` | `0` (not in brief; must be < max_tokens, so disabled — Jarvis wants fast/cheap replies, not extended thinking) |
| `model` | `code_execution` | `false` |
| `model` | `web_search` | `true` |
| `model` | `web_search_max_uses` | `3` |
| `model` | `user_location` | `false` |
| `model` | `web_fetch` | `false` |
| `model` | `web_fetch_max_uses` | `5` (default, unused — web_fetch is off) |

Note: this integration build's subentry schema has **no `tool_search` field at all** — only
`code_execution`/`web_search`/`web_fetch` toggles exist, so there was nothing to disable
for "tool search."

### Anthropic spend-alert setting

Not configurable from HA's side — spend alerts/limits are set on the Anthropic console
against the API key itself, not through the HA integration. Philip should set a spend
alert on the `ha-jarvis` key in the Anthropic console directly (out of scope for this repo
mirror; nothing to record here beyond the reminder).

### Known-broken right now

The `anthropic` config entry is in `state: setup_error` — **401, "API key is invalid,
Reauthentication required"** — pending Philip topping up/fixing credits on the Anthropic
console for the `ha-jarvis` key. The pipeline wiring (below) is correct and will start
working the moment the key is fixed; no HA-side change needed then.

---

## Google Cloud TTS

Config entry: domain `google_cloud`, title "Google Cloud", entry_id
`01KY5BAC09C53ZH4BG33BDWSSZ` (service account
`ha-jarvis@centering-dock-503211-i4.iam.gserviceaccount.com`, project
`centering-dock-503211-i4`; credential/auth handled by Philip in Steps 1–2, out of repo
scope).

**Entity produced is `tts.ha_jarvis`** (friendly name "HA Jarvis") — *not* `tts.google_cloud`
as the original brief assumed; the underlying device/entry is named "HA Jarvis." Sibling STT
entity `stt.ha_jarvis` also exists (Google Cloud STT, unused by either pipeline — Wyoming
faster-whisper is used for STT instead).

Options set:

```json
{
  "language": "sv-SE",
  "gender": "NEUTRAL",
  "voice": "sv-SE-Wavenet-F",
  "encoding": "MP3",
  "speed": 1.0,
  "pitch": 0,
  "gain": 0,
  "profiles": [],
  "text_type": "text",
  "stt_model": "latest_short"
}
```

`sv-SE-Wavenet-F` was chosen as the default after auditioning Wavenet-F/G/D aloud on
`media_player.arc_sub`. Per-call override available via `tts.speak`'s `options: {"voice": "..."}`.

**Gotcha — avoid Chirp3-HD voices for this integration**: HA's `google_cloud` TTS always
sends a `pitch` parameter, which Chirp3-HD voices reject outright. Stick to Standard/Wavenet
tiers for `sv-SE` (no Neural2/Studio/News/Polyglot tiers exist for this locale anyway).

---

## ElevenLabs TTS

Config entry: domain `elevenlabs`, title "ElevenLabs", entry_id
`01KY5DHZRSWMFWFGFRM7DAC3DX`. Produces entity **`tts.elevenlabs_text_till_tal`** (friendly
name "ElevenLabs Text-till-tal"). Model: `eleven_multilingual_v2` (confirmed selected, not
a Flash/Turbo tier). Language codes for this engine are bare ISO (`sv`, not `sv-SE`/`sv_SE`).

**Current live voice: George** (`JBFqnCBsd6RMkjVDRZzb`) — a premade/default voice, working
on the free tier today. Used as an interim stand-in.

**Target voice: James** (`EkK5I93UQWFDigLMpZcX`, "Husky, Engaging and Bold") — pending
ElevenLabs **Starter plan** upgrade. James is a community/library voice (in Philip's "My
Voices" but not one of ElevenLabs' own premade voices); the free tier returns `402
payment_required` / `paid_plan_required` for any library-sourced voice via the TTS API,
even though it's saved to the account. Premade voices (George, Sarah, Daniel — all
auditioned and confirmed working) are unaffected by this restriction.

To flip back to James once upgraded: re-run `assist_pipeline/pipeline/update` on the Jarvis
pipeline with the full current pipeline object, changing only `"tts_voice":
"EkK5I93UQWFDigLMpZcX"`.

Other auditioned voices (all premade, all free-tier-safe): Sarah (`EXAVITQu4vr4xnSDxMaL`),
Daniel (`onwK4e9ZLuTAKqWW03F9`), plus 17 more (Adam, Alice, Bella, Bill, Brian, Callum,
Charlie, Chris, Eric, Harry, Jessica, Laura, Liam, Lily, Matilda, River, Roger, Will).

---

## Assist pipelines

Two pipelines exist, managed via the Assist Pipeline WebSocket API
(`assist_pipeline/pipeline/{list,create,update,set_preferred}`).

### Jarvis (preferred)

id `01jtzbkjvqanm8dtdc1jb1r3er`. **Preferred pipeline** (`set_preferred` called explicitly).

| Field | Value |
|---|---|
| `name` | Jarvis |
| `language` | `sv` |
| `conversation_engine` | `conversation.claude_conversation` |
| `conversation_language` | `sv` |
| `stt_engine` | `stt.faster_whisper` |
| `stt_language` | `sv` |
| `tts_engine` | `tts.elevenlabs_text_till_tal` (originally set to `tts.ha_jarvis` in Task 8; switched to ElevenLabs during the voice audition — this is the current live value) |
| `tts_language` | `sv` |
| `tts_voice` | `JBFqnCBsd6RMkjVDRZzb` (George — interim; target `EkK5I93UQWFDigLMpZcX`/James pending Starter upgrade) |
| `wake_word_entity` / `wake_word_id` | `null` / `null` (no on-device wake word yet — Phase 0, no hardware) |
| `prefer_local_intents` | `true` |

### Lokal (offline fallback)

id `01ky5c4vw2s2123fbk63vt8xda`. Built entirely from local/free components — no cloud LLM,
no ElevenLabs — so it needs no hardware and works even if Anthropic/ElevenLabs billing is
broken.

| Field | Value |
|---|---|
| `name` | Lokal |
| `language` | `sv` |
| `conversation_engine` | `conversation.home_assistant` (built-in, not Claude) |
| `conversation_language` | `sv` |
| `stt_engine` | `stt.faster_whisper` |
| `stt_language` | `sv` |
| `tts_engine` | `tts.piper` |
| `tts_language` | `sv_SE` |
| `tts_voice` | `null` (engine default, `sv_SE-nst-medium`) |
| `wake_word_entity` / `wake_word_id` | `null` / `null` |
| `prefer_local_intents` | `false` |

---

## Exposed entities (Assist / `conversation` assistant) — 43 total

Curated via `homeassistant/expose_entity` (WS API), touching only the `"conversation"`
assistant. Confirmed by exact set-equality re-read after changes — no missing, no extras.

**Lights (20):** `light.vardagsrum`, `light.tv`, `light.sovrum`, `light.lightstrip`,
`light.sovrumsfonstret`, `light.spot_1`, `light.spot_2`, `light.spot_3`, `light.kok`,
`light.tak_1`, `light.tak_2`, `light.slinga`, `light.koksfonstret`, `light.hall`,
`light.hall_spot_1`, `light.hall_spot_2`, `light.hall_spot_3`, `light.office`,
`light.badrum`, `light.spotlight_top`

**Media/vacuum/todo (3):** `media_player.arc_sub`, `vacuum.roborock_s8`, `todo.att_gora`

**Scenes (12):**
- Hall (6): `scene.hall_koppla_av`, `scene.hall_klart_ljus`, `scene.hall_concentrate`,
  `scene.hall_las`, `scene.hall_nattlampa`, `scene.hall_fa_ny_energi`
- Office (5): `scene.office_koppla_av`, `scene.office_concentrate`, `scene.office_las`,
  `scene.office_nattlampa`, `scene.office_fa_ny_energi`
- Badrum (1): `scene.badrum_nattljus`

**Read-only sensors (6):** `sensor.bryggan_elpris`, `sensor.elpris_timserie`,
`sensor.electricity_maps_co2_intensitet`, `weather.forecast_home`,
`sensor.avgangar_next_departure`, `sensor.sl_kullstaplan`

**Calendars (2):** `calendar.hem`, `calendar.philiprutberg00_gmail_com`

**Explicitly left unexposed** (previously had `conversation: true`, removed): the 12
`binary_sensor.volvo_s60_polestar_engineered_*` entities (doors/windows/hood/trunk/fuel
flap — car should not be voice-controllable), `media_player.bedroom`,
`media_player.kitchen`, `switch.qbittorrent_alternativ_hastighet`, `todo.shopping_list`.

Everything else (locks, alarm, covers, `person.*`, `device_tracker.*`, climate, most
`binary_sensor.*`/`switch.*`) has no exposure entry at all — already unexposed under HA's
domain-default rules.

---

## Known gotchas

- **`subPath`-mounted `/config` breaks `/config/../` backups** — the HA pod's config mount
  is a `subPath` bind of one NFS subdirectory, so `tar czf /config/../backup.tgz` lands on
  the pod's ephemeral rootfs and is destroyed on pod recreate. Always back up to a real path
  *inside* `/config` (e.g. `/config/backups/`) or `kubectl cp` out immediately.
- **Anthropic `thinking_budget` must be `< max_tokens`** — the integration rejects the
  default (1024) when `max_tokens` is 300; set to `0` to disable extended thinking.
- **This Anthropic integration build has no `tool_search` option** — only
  `code_execution`/`web_search`/`web_fetch` toggles exist in the subentry schema.
- **Google Cloud TTS's HA entity is named after the device/entry (`tts.ha_jarvis`), not the
  integration (`tts.google_cloud`)** — check `/api/states` rather than assuming the domain
  name.
- **Google Cloud `google_cloud` TTS always sends `pitch`, breaking Chirp3-HD voices** — use
  Standard/Wavenet tiers for `sv-SE`.
- **ElevenLabs free tier blocks *any* library/community voice via the API** (`402
  paid_plan_required`), even voices saved to "My Voices" — only ElevenLabs' own premade
  voices (George, Sarah, Daniel, etc.) work on free tier. This is separate from the earlier
  API-key-scope issue (`voices_read`/`models_read` missing) that blocked initial setup.
- **ElevenLabs voice-picker caches are stale until the config entry is reloaded** — adding/
  removing a voice in My Voices requires
  `POST /api/config/config_entries/entry/<id>/reload` before HA's `tts/engine/voices` /
  pipeline voice pickers see it (the options-flow schema call itself is live and doesn't
  need this).
- **Pipeline `conversation_engine`/`tts_engine`/`stt_engine` are entity_ids, not
  config-entry/subentry ids** — e.g. `conversation.claude_conversation`, `tts.piper`.
- **`assist_pipeline/pipeline/update` is a full-replace call** — always re-fetch the current
  pipeline object first and post back every field, changing only the ones you intend to
  change (a single-field payload will null out the rest).
- **hasl legacy YAML sensor (`platform: hasl`) is dead/orphaned**, pre-dating this project —
  unrelated to Jarvis, left untouched; the wall hub uses the separate `sensor.sl_kullstaplan`
  / `sensor.sl_storningar` REST sensors instead.

---

## Open items

- **Anthropic API key has no credit balance** (`ha-jarvis` key, console-side) — blocks the
  Claude conversation agent end-to-end. Philip needs to add credits/a payment method, then
  re-run the two curl smoke tests from Task 5 (Swedish general-knowledge question + light
  control probe via `conversation.claude_conversation`). Also recommend setting a spend
  alert on the key once it's live.
- **ElevenLabs Starter plan upgrade** — needed before James (`EkK5I93UQWFDigLMpZcX`) can
  actually speak; the Jarvis pipeline is already wired to James's voice ID but currently
  runs George (`JBFqnCBsd6RMkjVDRZzb`) as a working stand-in. Flip `tts_voice` back to James
  after upgrading (see ElevenLabs section above for the exact call).
- **Periodic exposure-list re-check** — HA's "expose new entities by default" behavior can
  silently re-expose new entities in default-exposed domains (light, media_player, vacuum,
  scene, etc.) as new integrations are added. Re-run
  `homeassistant/expose_entity/list` against the 43-entity target list above periodically.
- **Tibber core integration needs re-auth** (`sensor.bryggan_elpris`, `data_api_reauth_required`)
  — unrelated to Jarvis (the wall hub uses the separate `sensor.elpris_timserie` REST
  sensor), but flagged here since it surfaced during the same HA upgrade. Fix in Settings →
  Devices & Services when convenient.
- **Step 3 of Task 10 (gate decision) is Philip's call**, not part of this file — review the
  Task 9 loop-quality matrix together; if good, order the Voice PE (~749 kr) and Phase 1
  begins on arrival (stock firmware, "Hey Jarvis"). If not, diagnose before spending money:
  voice quality → ElevenLabs A/B early; latency → whisper model size; answer quality →
  prompt/entity tuning.
