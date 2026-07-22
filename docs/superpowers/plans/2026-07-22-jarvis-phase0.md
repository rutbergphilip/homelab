# Jarvis Phase 0 (Proof of Possibility) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the full Swedish Jarvis voice loop (STT → Claude → TTS → HA control + web search) works end-to-end via HA's in-browser Assist mic, before buying any hardware.

**Architecture:** Two new Flux-managed Wyoming services on the cluster (kb-whisper STT, Piper TTS fallback), an HA core upgrade to 2026.7.x (required for the Anthropic integration's web-search option), then HA-side configuration: Anthropic conversation agent (Haiku 4.5, Swedish Jarvis persona), Google Cloud TTS, curated exposed entities, and two Assist pipelines ("Jarvis" + "Lokal").

**Tech Stack:** Kubernetes + Flux + kustomize, `rhasspy/wyoming-whisper:3.5.0` with `KBLab/kb-whisper-small`, `rhasspy/wyoming-piper:2.3.1` with `sv_SE-nst-medium`, Home Assistant `2026.7.3`, HA core integrations: `wyoming`, `anthropic`, `google_cloud`.

**Spec:** `docs/superpowers/specs/2026-07-22-jarvis-voice-assistant-design.md`

## Global Constraints

- All k8s changes go through git + Flux (`task reconcile`) — never `kubectl apply` manifests by hand.
- Namespace: `home-automation`. Follow the kcal-assistant manifest style (plain Deployment/Service + kustomization, shared `homelab-nfs-pvc` with subPath).
- Image tags pinned exactly (Renovate handles bumps): `rhasspy/wyoming-whisper:3.5.0`, `rhasspy/wyoming-piper:2.3.1`, `homeassistant/home-assistant:2026.7.3`.
- Secrets (Anthropic API key, GCP service-account JSON) enter via HA config flows only — never committed to git.
- Cost guards are non-negotiable: model `claude-haiku-4-5`, max response tokens **300**, web search **max_uses 3**, prompt caching on, "prefer handling commands locally" on.
- Exposed entities: ONLY the curated list in Task 7. No locks, no car, nothing security-adjacent.
- Jarvis never speaks unprompted — no TTS automations anywhere in this plan.
- HA UI steps are done in the HA web UI at `https://home.rutberg.dev` (token at `.claude/ha-token` for API verification steps). Steps marked **[PHILIP]** need account credentials only he has.

---

### Task 1: Deploy wyoming-whisper (Swedish STT) to the cluster

**Files:**
- Create: `kubernetes/apps/home-automation/wyoming-whisper/deployment.yaml`
- Create: `kubernetes/apps/home-automation/wyoming-whisper/service.yaml`
- Create: `kubernetes/apps/home-automation/wyoming-whisper/kustomization.yaml`
- Modify: `kubernetes/apps/home-automation/kustomization.yaml` (add resource entry)

**Interfaces:**
- Produces: Wyoming STT endpoint at `wyoming-whisper.home-automation.svc.cluster.local:10300` (consumed by Task 4's HA Wyoming integration).

- [ ] **Step 1: Write the manifests**

`kubernetes/apps/home-automation/wyoming-whisper/deployment.yaml`:

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: wyoming-whisper
  labels:
    app: wyoming-whisper

spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: wyoming-whisper
  template:
    metadata:
      labels:
        app: wyoming-whisper

    spec:
      containers:
        - name: wyoming-whisper
          image: rhasspy/wyoming-whisper:3.5.0
          imagePullPolicy: IfNotPresent

          # KB-Whisper: Swedish National Library fine-tune; the small model
          # beats stock whisper-large-v3 on Swedish at ~1s CPU latency.
          # Model (~500MB) downloads from HuggingFace on first start into /data.
          args:
            - "--model"
            - "KBLab/kb-whisper-small"
            - "--language"
            - "sv"

          env:
            - name: TZ
              value: "Europe/Stockholm"

          ports:
            - name: wyoming
              containerPort: 10300

          volumeMounts:
            - name: homelab-storage
              mountPath: /data
              subPath: wyoming-whisper/data

          readinessProbe:
            tcpSocket:
              port: 10300
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 10300
            initialDelaySeconds: 60
            periodSeconds: 30

          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: "3"
              memory: 2Gi

      volumes:
        - name: homelab-storage
          persistentVolumeClaim:
            claimName: homelab-nfs-pvc
```

`kubernetes/apps/home-automation/wyoming-whisper/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: wyoming-whisper
  labels:
    app: wyoming-whisper

spec:
  type: ClusterIP
  selector:
    app: wyoming-whisper
  ports:
    - name: wyoming
      port: 10300
      targetPort: 10300
```

`kubernetes/apps/home-automation/wyoming-whisper/kustomization.yaml`:

```yaml
---
# yaml-language-server: $schema=https://json.schemastore.org/kustomization
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ./deployment.yaml
  - ./service.yaml
```

In `kubernetes/apps/home-automation/kustomization.yaml`, append to `resources:` after `- ./kcal-assistant`:

```yaml
  - ./wyoming-whisper
```

- [ ] **Step 2: Validate the kustomize build**

Run: `kubectl kustomize kubernetes/apps/home-automation | grep -A2 "name: wyoming-whisper"`
Expected: rendered Deployment + Service named `wyoming-whisper`, no errors.

- [ ] **Step 3: Commit and reconcile**

```bash
git add kubernetes/apps/home-automation/wyoming-whisper kubernetes/apps/home-automation/kustomization.yaml
git commit -m "feat(voice): wyoming-whisper STT with KB-Whisper small (Swedish) for Jarvis"
git push
task reconcile
```

- [ ] **Step 4: Verify the pod comes up and the model downloads**

Run: `kubectl -n home-automation rollout status deploy/wyoming-whisper --timeout=300s && kubectl -n home-automation logs deploy/wyoming-whisper --tail=20`
Expected: `successfully rolled out`; logs show the KBLab model download then `Ready` (Wyoming server listening). First start may take a few minutes (~500MB model on NFS).

- [ ] **Step 5: Verify HA can reach it (host-network path)**

Run: `kubectl -n home-automation exec deploy/home-assistant -- python3 -c "import socket; s=socket.create_connection(('wyoming-whisper.home-automation.svc.cluster.local',10300),timeout=5); print('OK'); s.close()"`
Expected: `OK`. (HA is hostNetwork with `ClusterFirstWithHostNet`, so service DNS + ClusterIP must work from it. If this fails with a timeout, a Cilium policy is blocking host identity → add one modeled on `kcal-assistant/networkpolicy.yaml` allowing `host`/`remote-node` entities to port 10300, plain L4.)

---

### Task 2: Deploy wyoming-piper (local Swedish TTS fallback)

**Files:**
- Create: `kubernetes/apps/home-automation/wyoming-piper/deployment.yaml`
- Create: `kubernetes/apps/home-automation/wyoming-piper/service.yaml`
- Create: `kubernetes/apps/home-automation/wyoming-piper/kustomization.yaml`
- Modify: `kubernetes/apps/home-automation/kustomization.yaml`

**Interfaces:**
- Produces: Wyoming TTS endpoint at `wyoming-piper.home-automation.svc.cluster.local:10200` (consumed by Task 4 and the "Lokal" pipeline in Task 8).

- [ ] **Step 1: Write the manifests**

`kubernetes/apps/home-automation/wyoming-piper/deployment.yaml`:

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: wyoming-piper
  labels:
    app: wyoming-piper

spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: wyoming-piper
  template:
    metadata:
      labels:
        app: wyoming-piper

    spec:
      containers:
        - name: wyoming-piper
          image: rhasspy/wyoming-piper:2.3.1
          imagePullPolicy: IfNotPresent

          # Offline-resilience voice for the "Lokal" pipeline. Robotic but free
          # and instant; the daily "Jarvis" pipeline uses cloud TTS instead.
          args:
            - "--voice"
            - "sv_SE-nst-medium"

          env:
            - name: TZ
              value: "Europe/Stockholm"

          ports:
            - name: wyoming
              containerPort: 10200

          volumeMounts:
            - name: homelab-storage
              mountPath: /data
              subPath: wyoming-piper/data

          readinessProbe:
            tcpSocket:
              port: 10200
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 10200
            initialDelaySeconds: 30
            periodSeconds: 30

          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi

      volumes:
        - name: homelab-storage
          persistentVolumeClaim:
            claimName: homelab-nfs-pvc
```

`kubernetes/apps/home-automation/wyoming-piper/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: wyoming-piper
  labels:
    app: wyoming-piper

spec:
  type: ClusterIP
  selector:
    app: wyoming-piper
  ports:
    - name: wyoming
      port: 10200
      targetPort: 10200
```

`kubernetes/apps/home-automation/wyoming-piper/kustomization.yaml`:

```yaml
---
# yaml-language-server: $schema=https://json.schemastore.org/kustomization
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ./deployment.yaml
  - ./service.yaml
```

In `kubernetes/apps/home-automation/kustomization.yaml`, append after `- ./wyoming-whisper`:

```yaml
  - ./wyoming-piper
```

- [ ] **Step 2: Validate, commit, reconcile, verify**

```bash
kubectl kustomize kubernetes/apps/home-automation > /dev/null && echo BUILD-OK
git add kubernetes/apps/home-automation/wyoming-piper kubernetes/apps/home-automation/kustomization.yaml
git commit -m "feat(voice): wyoming-piper sv_SE fallback TTS for Lokal pipeline"
git push
task reconcile
kubectl -n home-automation rollout status deploy/wyoming-piper --timeout=180s
```

Expected: `BUILD-OK`, then `successfully rolled out`.

---

### Task 3: Upgrade Home Assistant 2025.12 → 2026.7.3

The Anthropic integration's web-search option needs a 2026.x core. This is the riskiest task in the plan — it jumps 7 monthly releases on a production home. Do it deliberately.

**Files:**
- Modify: `kubernetes/apps/home-automation/home-assistant/deployment.yaml` (both `image:` lines, ~29 and ~47)

**Interfaces:**
- Produces: HA 2026.7.3 running, with `anthropic` integration exposing the web-search advanced option (consumed by Task 5).

- [ ] **Step 1: Back up /config (excluding the recorder DB)**

Run: `kubectl -n home-automation exec deploy/home-assistant -- sh -c "tar czf /config/../config-backup-2025.12.tgz -C /config --exclude=home-assistant_v2.db --exclude='*.log*' . && ls -lh /config/../config-backup-2025.12.tgz"`
Expected: a tarball a few MB in size. (DB schema migrates forward on upgrade; if we ever roll back the image, restore this tarball too.)

- [ ] **Step 2: Review breaking changes**

Fetch and skim the "Backward-incompatible changes" sections of the release notes for 2026.1 → 2026.7 (`https://www.home-assistant.io/blog/categories/core/`). Check specifically for changes affecting: `template:` sensors, `rest:` sensors, `command_line:`, `homekit:`, `sonos`, `caldav`, `google_calendar`, `volvo`, `roborock`, `hasl3`/SL, `tibber` — everything the wall hub depends on. Note anything requiring config edits and apply those edits in the same change.

- [ ] **Step 3: Bump the image**

In `kubernetes/apps/home-automation/home-assistant/deployment.yaml`, change **both** occurrences of:

```yaml
          image: homeassistant/home-assistant:2025.12
```

to:

```yaml
          image: homeassistant/home-assistant:2026.7.3
```

- [ ] **Step 4: Commit, reconcile, wait for rollout**

```bash
git add kubernetes/apps/home-automation/home-assistant/deployment.yaml
git commit -m "feat(home-assistant): upgrade 2025.12 -> 2026.7.3 (Anthropic web search needs 2026.x)"
git push
task reconcile
kubectl -n home-automation rollout status deploy/home-assistant --timeout=600s
```

Expected: `successfully rolled out` (Recreate strategy = brief downtime; first boot after 7-version jump runs DB migrations, allow several minutes).

- [ ] **Step 5: Verify the house still works**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/config | jq -r .version
for e in sensor.elpris_timserie sensor.kcal_idag sensor.avgangar_next_departure light.vardagsrum media_player.arc_sub calendar.hem todo.att_gora; do
  curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states/$e | jq -r '"\(.entity_id): \(.state)"'
done
```

Expected: version `2026.7.3`; every entity returns a real state (not `null`/`unavailable` — `unavailable` for Roborock is pre-existing, see memory). Then open `https://home.rutberg.dev/wall-hub/main` in a browser and confirm the hub renders (unregister the service worker if stale). If anything regressed, fix forward using the breaking-changes notes from Step 2 before continuing.

---

### Task 4: Add the Wyoming integrations to HA

**Interfaces:**
- Consumes: endpoints from Tasks 1–2.
- Produces: STT entity `stt.faster_whisper` and TTS entity `tts.piper` selectable in pipelines (Task 8).

- [ ] **Step 1: Add whisper** — HA UI: *Settings → Devices & services → Add integration → Wyoming Protocol*. Host: `wyoming-whisper.home-automation.svc.cluster.local`, Port: `10300`. Expected: a "Faster Whisper" service appears.

- [ ] **Step 2: Add piper** — same flow. Host: `wyoming-piper.home-automation.svc.cluster.local`, Port: `10200`. Expected: a "Piper" service appears.

- [ ] **Step 3: Verify entities**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '.[].entity_id' | grep -E '^(stt|tts)\.'
```

Expected: one `stt.*` entity (whisper) and one `tts.*` entity (piper) in the list.

---

### Task 5: Anthropic integration — Jarvis's brain

**Interfaces:**
- Consumes: **[PHILIP]** an Anthropic API key from `console.anthropic.com` (a fresh key scoped to this use is cleanest, so its spend is trackable).
- Produces: conversation agent entity (Claude) for the "Jarvis" pipeline (Task 8).

- [ ] **Step 1 [PHILIP]: Create API key + spend guard** — in the Anthropic console: create key `ha-jarvis`; under limits/notifications set a monthly spend alert at **$10**.

- [ ] **Step 2: Add the integration** — HA UI: *Settings → Devices & services → Add integration → Anthropic*. Paste the API key.

- [ ] **Step 3: Configure the conversation agent** — open the integration's options (⚙ on the conversation entry):
  - Model: `claude-haiku-4-5`
  - Instructions/prompt — paste exactly:

```text
Du är Jarvis, hemmets röstassistent. Du pratar naturlig, avslappnad svenska.

Regler:
- Svara kort och talvänligt: 1–3 meningar. Inga listor, ingen markdown, inga emojis — ditt svar läses upp högt.
- Styr bara enheter när användaren tydligt ber om det. Gissa aldrig en åtgärd.
- Använd webbsökning endast för dagsaktuella frågor (nyheter, sport, öppettider, priser). Använd hemmets sensorer för elpris, väder, tåg och CO₂ — sök inte på webben efter sådant du redan kan läsa av.
- Om en fråga är tvetydig: ställ en kort motfråga i stället för att chansa.
- Svara alltid på svenska.
```

  - Control Home Assistant: **enabled** (Assist API)
  - Max tokens: `300`
  - Caching strategy: `System prompt`
  - Web search tool: **enabled**, max uses `3` (leave web fetch / code execution / tool search **off**)
  - Recommended settings toggle: off (we set our own)

- [ ] **Step 4: Smoke-test the agent (text only, no pipeline yet)**

```bash
HA_TOKEN=$(cat .claude/ha-token)
AGENT=$(curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '[.[].entity_id | select(startswith("conversation."))] | map(select(. != "conversation.home_assistant")) | first')
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"text\": \"Vem är Sveriges statsminister?\", \"language\": \"sv\", \"agent_id\": \"$AGENT\"}" \
  https://home.rutberg.dev/api/conversation/process | jq -r '.response.speech.plain.speech'
```

Expected: a short Swedish answer naming the current statsminister (proves API key + Swedish + possibly web search). Then check the Anthropic console: the request should show `claude-haiku-4-5` usage.

---

### Task 6: Google Cloud TTS — Jarvis's voice

**Interfaces:**
- Consumes: **[PHILIP]** a GCP project with billing enabled, Cloud Text-to-Speech API turned on, and a service-account JSON key (role: nothing beyond default; the API key file is what HA needs). Free tier: 4M WaveNet chars/month — household use never exceeds it, but billing must be attached for the API to work.
- Produces: `tts.google_cloud` entity (the "Jarvis" pipeline voice, Task 8).

- [ ] **Step 1 [PHILIP]: GCP setup** — console.cloud.google.com: create project `jarvis-tts` → enable "Cloud Text-to-Speech API" → IAM → Service account → create key (JSON) → download.

- [ ] **Step 2: Add the integration** — HA UI: *Settings → Devices & services → Add integration → Google Cloud*. Upload the JSON key.

- [ ] **Step 3: Pick the Swedish voice** — integration options: language `sv-SE`, voice: pick the best available WaveNet variant (list will show e.g. `sv-SE-Wavenet-…`; EU replacements F/G may be the only ones — pick by ear in Step 4). Leave rate/pitch at defaults, encoding MP3.

- [ ] **Step 4: Verify by ear**

HA UI: *Developer tools → Actions → `tts.speak`* — target `tts.google_cloud`, media player `media_player.arc_sub`, message: `Hej Philip, jag heter Jarvis. Så här kommer jag att låta.` Expected: natural Swedish from the Arc. Try 2–3 voice variants; keep the best. (This is a manual one-off test action, not an automation — the "never unprompted" rule applies to production config only.)

---

### Task 7: Curate the exposed entities

**Interfaces:**
- Produces: the exact entity set Claude can see/control — this is both the safety boundary and the per-query token cost.

- [ ] **Step 1: Set exposure** — HA UI: *Settings → Voice assistants → Expose*. Make the exposed list **exactly**:
  - All `light.*` from the key-entities list (vardagsrum, tv, sovrum, lightstrip, sovrumsfonstret, spot_1/2/3, kok, tak_1/2, slinga, koksfonstret, hall, hall_spot_1/2/3, office, badrum, spotlight_top)
  - `media_player.arc_sub`
  - `vacuum.roborock_s8`
  - `todo.att_gora`
  - Scenes: any `scene.*` currently used by the hub's scene chips
  - Read-only sensors: `sensor.bryggan_elpris`, `sensor.elpris_timserie`, `sensor.electricity_maps_co2_intensitet`, `weather.forecast_home`, `sensor.avgangar_next_departure`, `sensor.sl_kullstaplan`
  - Calendars: `calendar.hem`, `calendar.philiprutberg00_gmail_com`
  - **Remove/leave unexposed:** everything else — especially anything car (`*volvo*`), locks, alarm, covers, and person/device trackers.

- [ ] **Step 2: Verify the boundary via the agent**

```bash
HA_TOKEN=$(cat .claude/ha-token)
AGENT=$(curl -s -H "Authorization: Bearer $HA_TOKEN" https://home.rutberg.dev/api/states | jq -r '[.[].entity_id | select(startswith("conversation."))] | map(select(. != "conversation.home_assistant")) | first')
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"text\": \"Lås upp bilen\", \"language\": \"sv\", \"agent_id\": \"$AGENT\"}" \
  https://home.rutberg.dev/api/conversation/process | jq -r '.response.speech.plain.speech'
```

Expected: a refusal/"jag kan inte styra bilen"-style answer — NOT a success. Also ask `"Tänd ljuset i vardagsrummet"` and confirm `light.vardagsrum` turns on (then off again).

---

### Task 8: Create the two Assist pipelines

**Interfaces:**
- Consumes: `stt` whisper entity (Task 4), Claude agent (Task 5), `tts.google_cloud` (Task 6), `tts.piper` + built-in "Home Assistant" agent (local).
- Produces: pipelines "Jarvis" (preferred) and "Lokal" — the objects the browser mic and, later, the Voice PE bind to.

- [ ] **Step 1: Create "Jarvis"** — HA UI: *Settings → Voice assistants → Add assistant*: Name `Jarvis`, Language `Svenska`, Conversation agent = the Claude/Anthropic agent with **"Prefer handling commands locally" enabled**, STT = the whisper entity, TTS = `tts.google_cloud` (`sv-SE`). Set as preferred (star it).

- [ ] **Step 2: Create "Lokal"** — Add assistant: Name `Lokal`, Language `Svenska`, Conversation agent = `Home Assistant` (built-in), STT = whisper, TTS = the Piper entity.

- [ ] **Step 3: Verify both exist**

```bash
HA_TOKEN=$(cat .claude/ha-token)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" -d '{"type":"assist_pipeline/pipeline/list","id":1}' \
  https://home.rutberg.dev/api/websocket 2>/dev/null || echo "verify in UI instead"
```

If the WS one-shot is awkward, verify in the UI: both pipelines listed, Jarvis starred.

---

### Task 9: End-to-end verification via the in-browser mic (the possibility gate)

**Interfaces:**
- Consumes: everything above. This task is the Phase-0 exit criterion from the spec: *Swedish Q&A + entity control works in browser*.

- [ ] **Step 1: Voice test matrix** — open `https://home.rutberg.dev`, click the Assist icon (top right), select the **Jarvis** pipeline, use the mic button, speak each of these; record pass/fail and rough latency:

| # | Utterance (sv) | Expected |
|---|---|---|
| 1 | "Tänd ljuset i vardagsrummet" | `light.vardagsrum` on; handled locally (fast, free) |
| 2 | "Släck ljuset i vardagsrummet" | light off, fast |
| 3 | "Vad kostar elen just nu?" | Swedish answer citing dagens elpris from the Tibber sensors |
| 4 | "Hur blir vädret imorgon?" | answer from `weather.forecast_home`, no web search |
| 5 | "Vad hände i nyheterna idag?" | web search fires; current-events answer in Swedish |
| 6 | "Lägg till mjölk på att göra-listan" | item appears in `todo.att_gora` |
| 7 | "Vem regisserade Oppenheimer?" | general-knowledge answer, no tools |
| 8 | "Starta dammsugaren" → then "Stoppa dammsugaren" | Roborock reacts (skip if still unavailable pre-re-auth) |

- [ ] **Step 2: Lokal pipeline sanity** — switch the Assist dialog to **Lokal**, say "Tänd ljuset i vardagsrummet". Expected: works, Piper's (robotic) Swedish reply — proves the offline path.

- [ ] **Step 3: Cost check** — Anthropic console after the test session: confirm per-query cost is in the expected range (~3–5k input tokens, ≤300 output; no runaway loops). Multiply out to ~30 q/day and sanity-check against the 35–90 kr/month model.

- [ ] **Step 4: Latency check** — utterances 3/7 should feel ≤4 s from end-of-speech to start-of-reply in the browser. If STT is the bottleneck (watch `kubectl -n home-automation logs deploy/wyoming-whisper -f` timestamps), try `KBLab/kb-whisper-base` as a faster variant before concluding.

---

### Task 10: Document, remember, and gate

**Files:**
- Create: `.claude/ha-jarvis.md` (config mirror: integration settings, prompt text, exposed-entity list, pipeline defs — HA stores all of it in its own storage, so this is the repo-side record)
- Modify: memory (`wall-hub-dashboard-project.md` future-track note → new `jarvis-voice-assistant` project memory)

- [ ] **Step 1: Write `.claude/ha-jarvis.md`** — record: both Wyoming endpoints, HA version requirement, the exact system prompt, agent options (model/max-tokens/caching/web-search max_uses 3), the curated exposed-entity list, both pipeline configs, and the Anthropic spend-alert setting.

- [ ] **Step 2: Commit**

```bash
git add .claude/ha-jarvis.md
git commit -m "docs(jarvis): phase-0 config mirror (pipelines, prompt, exposed entities)"
git push
```

- [ ] **Step 3: Gate decision with Philip** — review the Task 9 matrix together. If the loop feels good: order the Voice PE (~749 kr — m.nu / Kjell / Inet) and Phase 1 begins when it arrives (stock firmware, "Hey Jarvis"). If not: diagnose (voice quality → ElevenLabs A/B early; latency → whisper model size; answer quality → prompt/entity tuning) before spending money on hardware.

---

## Self-Review Notes

- Spec coverage: Phase 0 scope only (per approved gate). Firmware adoption, Sonos routing, dual wake words on hardware, and the ElevenLabs A/B are Phases 1–3 and intentionally absent; the "Lokal" pipeline is built now because it needs no hardware.
- The HA upgrade (Task 3) is the largest risk; it is fronted by a backup and a breaking-changes review, and verified against the wall hub's load-bearing entities.
- No secrets in git; all API keys via HA config flows; `[PHILIP]` marks the two steps requiring his accounts (Anthropic key, GCP project).
