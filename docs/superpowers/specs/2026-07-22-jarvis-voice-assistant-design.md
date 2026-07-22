# Jarvis Voice Assistant — Design

**Date:** 2026-07-22
**Status:** Approved (Approach A — "Full Jarvis", phased rollout)

## Goal

A "Jarvis" voice assistant for the home, built on Home Assistant Assist: natural spoken Swedish, answers anything (including current events via web search), controls a curated set of home devices, and speaks through the Sonos Arc. Never speaks unprompted.

## Decisions (from brainstorm)

| Decision | Choice |
|---|---|
| Ears | 1× HA Voice PE satellite in vardagsrummet (~749 kr; m.nu/Kjell/Inet). More rooms later. |
| Wake word | "Hey Jarvis" — stock on-device microWakeWord model on Voice PE |
| Brain | Claude Haiku 4.5 via **core HA Anthropic integration**; budget cap ~100 kr/month |
| Web access | Anthropic server-side web search tool (built into the core integration since HA 2026.5) |
| STT | Self-hosted Wyoming faster-whisper with **KBLab/kb-whisper-small** on the k8s cluster |
| TTS | Google Cloud sv-SE (free tier) to start; **ElevenLabs multilingual v2 as A/B challenger** (~63 kr/mo Starter) |
| Reply output | Smart routing: Sonos Arc when idle, Voice PE's own speaker when Arc is busy (TV/music) |
| Control scope | Curated safe set: lights, Sonos/media, vacuum, scenes, timers, todo, read-only sensors (elpris, CO₂, väder, tåg), calendar readout. **No locks, no car.** |
| Proactive | **Never.** Jarvis only speaks when addressed. No TTS announcements from automations. |

## Constraints learned in research

- **Sonos mics cannot feed HA** — no API exists; Sonos is output-only. Confirmed as of mid-2026.
- **Kök/Sovrum Sonos are bonded surrounds of the Arc** — only `media_player.arc_sub` is addressable.
- **Routing Voice PE replies to a media player is NOT built-in** (open feature request, org discussion #689). The proven community mechanism: adopt Voice PE into ESPHome Builder, intercept the TTS URL in firmware (`on_tts_end`), hand it to an HA script that plays it on Sonos with `announce: true`. Verified working on HA 2026.6.
- Adopting the firmware means **we maintain firmware updates ourselves** (merge upstream releases; no one-click updates).
- Redirected replies **cannot use streaming TTS** (whole clip must exist before Sonos plays it) → keep replies short.
- **Timers are a local-satellite feature**; LLM agents don't handle them. Voice PE's on-device timers cover it.
- **kb-whisper-small beats stock whisper-large-v3 for Swedish** (KBLab, trained on 50k+ h Swedish; CTranslate2 weights load directly in wyoming-faster-whisper via HF model ID). ~0.5–1.5 s per utterance on CPU.
- **Google Chirp3-HD (their best sv-SE tier) is blocked** in the core `google_cloud` integration (core#144824 closed "not planned"); WaveNet sv-SE works but EU voices are being replaced with lower-quality F/G variants. This is why ElevenLabs is the quality challenger.
- Haiku prompt-caching gotcha: minimum cacheable prefix is 4096 tokens — a lean system prompt may not cache. Fine; budget holds regardless.
- ElevenLabs core integration has known intermittent streaming 404/truncation issues in Assist pipelines (core#159242, core#156312) — evaluate during A/B.

## Architecture

```
"Hey Jarvis" ──► Voice PE (vardagsrum)          wake word on-device
                    │ audio stream
                    ▼
              Assist pipeline "Jarvis" (language: sv)
                    ├─ STT:   Wyoming → kb-whisper-small     (k8s Deployment, :10300)
                    ├─ Agent: Anthropic — Haiku 4.5
                    │         · Control Home Assistant: ON (curated exposed entities)
                    │         · Web search tool: ON (max_uses: 3 per request)
                    │         · Prompt caching: ON · max response tokens ~300
                    │         · Prefer handling commands locally: ON
                    └─ TTS:   Google Cloud sv-SE  (ElevenLabs entry configured for A/B)
                    │
                    ▼
              Reply routing (Phase 2 firmware)
                    ├─ input_boolean.jarvis_route_to_sonos ON  → HA script plays TTS URL on
                    │                                            media_player.arc_sub, announce: true
                    └─ boolean OFF (Arc playing TV/music)      → Voice PE's own speaker
```

**Dual wake words = offline resilience** (HA ≥2025.10): "Hey Jarvis" → Claude pipeline; "Okay Nabu" → fully local fallback pipeline (built-in intents + Piper `sv_SE`). Basic light/media/timer commands survive an internet or API outage.

## Components

1. **`wyoming-whisper` Deployment** (`kubernetes/apps/home-automation/wyoming-whisper/`): image `rhasspy/wyoming-whisper`, args `--model KBLab/kb-whisper-small --language sv --uri tcp://0.0.0.0:10300`, PVC for model cache, ClusterIP service. Flux-managed like other apps. HA is hostNetwork → may need a Cilium rule allowing host identity → whisper:10300 (same pattern as kcal :3001).
2. **Anthropic conversation entry**: Haiku 4.5; Swedish system prompt — Jarvis persona, concise spoken-style replies (1–3 sentences unless asked), answer in Swedish; web search for current-events questions only.
3. **Exposed entities (curated)**: lights, scenes, `media_player.arc_sub`, `vacuum.roborock_s8`, `todo.att_gora`, key read-only sensors (elpris_timserie, bryggan_elpris, CO₂, väder, tåg/SL). Scripts exposed to Assist become LLM tools — add narrowly if needed (e.g. calendar readout) with good descriptions.
4. **Two pipelines**: "Jarvis" (Claude) and "Lokal" (built-in intents + Piper), mapped to the two wake words.
5. **Phase-2 firmware** (ESPHome Builder adoption): `on_tts_start` → mute PE (volume 0 **plus** `mixer_speaker.apply_ducking` — volume alone doesn't silence it) *only if* `jarvis_route_to_sonos` is on (synced to the PE as an ESPHome HA binary sensor — no runtime round-trip); `on_tts_end` → pass TTS URL (`!lambda return x;`) to HA script; `on_end` → restore volume/ducking. Device needs "allow device to perform actions".
6. **Routing helper + automation**: `input_boolean.jarvis_route_to_sonos`; automation keeps it OFF while `media_player.arc_sub` is `playing` (TV audio shows as `source: TV`), ON when idle/paused.
7. **HA script `jarvis_reply_route`**: if boolean on → `media_player.play_media` on Arc with `announce: true` (auto-duck/restore); on failure → log + persistent notification (worst case: one silent reply).

## Cost model (monthly)

| Item | Cost |
|---|---|
| Claude Haiku 4.5 (~30 q/day, ~3k in / 150 out tokens) | 35–90 kr |
| Web search (~5/day @ $0.01) | ~15 kr |
| Google Cloud TTS | 0 kr (free tier: 4M WaveNet chars/mo) |
| STT + wake word (local) | 0 kr |
| **Total (Google voice)** | **~50–105 kr** |
| ElevenLabs Starter, if A/B winner | +63 kr |

Guards: spend alert in Anthropic console; `max_uses` on web search; 300-token response cap; "prefer local" removes the most common commands from the API entirely. If sustained cost exceeds ~150 kr/month → rethink (fewer exposed entities, smaller prompt, or drop web search).

## Error handling

- Anthropic API down → "Okay Nabu" local pipeline still works; Jarvis pipeline speaks HA's error message.
- Whisper pod down → k8s restarts; pipeline errors audibly, no hang.
- Redirect script failure → one silent reply max, logged + notified; only possible when Arc was believed idle.
- Misheard destructive commands: scope excludes locks/car, so worst case is wrong lights/vacuum action.
- Prompt injection via web search results: mitigated by the curated scope — the agent cannot touch security devices; web search reserved for informational queries in the system prompt.

## Rollout & testing

- **Phase 0 (no hardware):** deploy Whisper; configure Anthropic + Google Cloud integrations; build both pipelines; test via HA's in-browser Assist mic/chat. Exit: Swedish Q&A + entity control works in browser.
- **Phase 1 (Voice PE, stock firmware):** "Hey Jarvis" replies from PE speaker. Exit: reliable wake word across vardagsrummet, <4 s perceived latency, daily cost in console within budget.
- **Phase 2 (firmware adoption):** redirect + smart routing. Test matrix: Arc idle → reply on Arc; TV playing → reply on PE; music playing → reply on PE; script failure → notification.
- **Phase 3 (voice A/B):** same questions through Google WaveNet vs ElevenLabs multilingual v2; pick by ear; loser stays configured as fallback.
- **Later:** more Voice PE satellites (kök needs its own when unbonded or via PE speaker), Music Assistant for "spela musik" voice commands, wall-hub Assist chat surface.

## Out of scope

Proactive announcements (explicitly never), door locks / car control, full agentic web browsing, Sonos-as-microphone (impossible), custom wake word "Jarvis" alone (higher false-positive rate; revisit via microwakeword.com/train if desired).
