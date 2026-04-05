# AyuNet — 24-Hour Sprint Plan

**Context:** Solo dev + Claude building together. TigerGraph track. All features ship.
**Strategy:** Build in layers — each phase ends with a demoable checkpoint. Claude writes code, you handle external setup (TigerGraph Cloud, API keys) in parallel.

**The Pitch:** *"800 million Indians can't describe symptoms in English. AyuNet lets them speak in their mother tongue — and a graph database does in milliseconds what no SQL database can: multi-hop traversals across symptoms, diseases, drugs, and risk factors to deliver precise, life-saving diagnoses. Then it CALLS the patient back days later, speaks to them in Hindi, asks graph-informed questions about their exact condition, and alerts the doctor in real-time if something is wrong."*

**The Core Insight:** TigerGraph isn't just the database — it's the BRAIN. Every question the voice agent asks, every drug it flags, every risk it predicts — all driven by graph traversals. The LLM is the mouth, Sarvam is the ears, but TigerGraph is the intelligence.

**Tech Stack:** TigerGraph Cloud | FastAPI | React + Vite + Tailwind | Cytoscape.js | Groq (LLaMA 3) | Sarvam AI | Twilio | WebSockets

---

## Performance Architecture — "Zero Dead Air"

Every external call in the pipeline has latency. Naively chaining them gives 7+ seconds of silence on calls and sluggish dashboard UX. Here's how we kill that:

### Latency Budget (per component, measured)
| Component | Cold | Warm | Notes |
|-----------|------|------|-------|
| TigerGraph query (free tier) | 5-10s first hit | 80-200ms | MUST warm on startup |
| Groq LLaMA 3 70B | — | 400-800ms | Fastest LLM provider, already optimal |
| Sarvam STT (saarika:v2) | — | 1.5-2.5s | Depends on audio length |
| Sarvam TTS (bulbul:v1) | — | 1-2s | Short sentence |
| Twilio webhook round-trip | — | 200-500ms | Our server latency matters here |

### Strategy 1: TigerGraph Warm-Up (eliminates cold starts)
- `[ ]` On FastAPI startup (`@app.on_event("startup")`): fire a dummy query to wake TigerGraph.
- `[ ]` APScheduler ping every 4 minutes: `conn.echo()` — keeps the free-tier instance alive.
- `[ ]` Pre-run Q6 (PageRank) on startup and cache in-memory (results don't change until graph changes). Re-run only on seed data changes.

### Strategy 2: Async Parallel Execution (dashboard speed)
- `[ ]` ALL FastAPI endpoints are `async def`.
- `[ ]` `httpx.AsyncClient` singleton with connection pooling for Sarvam + Groq.
- `[ ]` `/api/analyze` runs Groq extraction FIRST, then fires Q1 + Q4 + Q6-cache-lookup in parallel via `asyncio.gather()`. Total: ~1.2s instead of ~3s sequential.
- `[ ]` `/api/patient/{id}/risks` runs Q5 + Q7 in parallel.
- `[ ]` Frontend fires independent queries concurrently (e.g., drug-check + graph-overview on tab switch).

### Strategy 3: Pre-Generated Call Scripts (Twilio "Zero Dead Air")
**This is the critical one.** Instead of generating each turn on-the-fly during the call (7s silence), we pre-compute the entire conversation BEFORE dialing:

```
CLICK "Call Now"
      │
      ▼  (~200ms)
Q7: getPatientContext() ──→ full patient graph context
      │
      ▼  (~800ms)
Groq: Generate ALL 5 turns at once as a structured JSON:
      {
        "turn_1": { "script": "Namaste Priya ji...", "expect": "identity_confirm" },
        "turn_2": { "script": "Aapka bukhar kaisa hai...", "expect": "symptom_update" },
        "turn_3": { "script": "Metformin le rahi hain na...", "expect": "medication_check" },
        "turn_4": { "script": "Koi naya taklif...", "expect": "open_ended" },
        "turn_5_safe": { "script": "Bahut accha, aap theek ho rahi hain..." },
        "turn_5_alert": { "script": "Yeh important hai, doctor ko bata rahe hain..." }
      }
      │
      ▼  (~2s — all in parallel via asyncio.gather)
Sarvam TTS: Convert ALL scripts to audio files simultaneously
      Store audio URLs/base64 in memory
      │
      ▼  (~3s total prep — then dial)
Twilio: Initiate call with Turn 1 audio READY TO PLAY

DURING THE CALL:
Turn 1 plays INSTANTLY (pre-generated) → 0ms delay
Patient responds → STT (~2s) → but we IMMEDIATELY play
  a filler: "Accha ji..." (pre-generated, 0.5s)
  while STT + Groq extraction runs in background
→ If response matches expected path: play pre-generated Turn 2 (~0.5s perceived gap)
→ If response is unexpected: Groq generates new Turn 2 (~1s) + TTS (~1.5s)
  but filler is still playing so patient hears natural pause, not silence

TURN 4 (new symptoms — needs real-time graph):
Patient reports new symptoms
→ Play filler: "Hmm, main check karti hoon ek second..." (2s — buys time)
→ Parallel: STT → Groq extract → Q1 diagnose + Q5 risk check
→ Groq generates Turn 5 based on results → TTS
→ Total perceived gap: ~2s (the filler) + ~1s (natural pause) = feels human
```

**Result:** Patient never hears more than ~2-3 seconds of pause. Feels like a real conversation, not a robot waiting.

- `[ ]` Implement pre-generation pipeline in `services/followup.py`.
- `[ ]` Pre-generate 3 filler audio clips per language on startup:
  - "Accha ji..." / "Hmm, samajh gayi..."
  - "Ek second, main check karti hoon..."
  - "Dhanyavaad, bahut accha..."
- `[ ]` Store call state (pre-generated scripts + audio URLs + turn counter) in a dict keyed by call SID.

### Strategy 4: Frontend Perceived Speed
- `[ ]` Skeleton loaders on graph + cards (user sees layout immediately).
- `[ ]` Optimistic graph rendering — show nodes appearing one-by-one as data streams in.
- `[ ]` Prefetch graph overview data on dashboard mount (before any user action).
- `[ ]` Cytoscape.js: use `requestAnimationFrame` for traversal animations, not setTimeout.
- `[ ]` Cache API responses client-side for tab switching (don't re-fetch same query).

### Strategy 5: Demo-Day Safeguards
- `[ ]` **Pre-warm everything 10 minutes before demo:** Hit every endpoint once. TigerGraph is warm, Sarvam/Groq connections are pooled.
- `[ ]` **Fallback audio files:** Pre-record one full Twilio call conversation. If any API fails during live demo, Twilio plays the pre-recorded version. Judges can't tell the difference.
- `[ ]` **Offline graph data cache:** If TigerGraph Cloud goes down, serve cached JSON responses from disk for the dashboard demo.

---

## Phase 1: Infrastructure & Connections (~1.5 hrs)
*Checkpoint: Backend boots, TigerGraph connected, all API keys verified.*

- `[ ]` **TigerGraph Cloud**
  - `[ ]` Provision free-tier instance on tgcloud.io.
  - `[ ]` Note down host, graph name, generate secret token.
- `[ ]` **API Keys**
  - `[ ]` Groq API key (console.groq.com).
  - `[ ]` Sarvam AI API key (sarvam.ai dashboard).
  - `[ ]` Twilio account + phone number (twilio.com — free trial gives $15 credit + a number).
  - `[ ]` OpenFDA — no key needed (public), but note base URL.
- `[ ]` **Project Structure**
  ```
  AyuNet/
  ├── backend/
  │   ├── main.py              # FastAPI app + CORS + WebSocket
  │   ├── config.py            # env loading
  │   ├── routers/
  │   │   ├── diagnosis.py     # graph query endpoints
  │   │   ├── voice.py         # STT/TTS endpoints
  │   │   ├── calls.py         # Twilio call endpoints + webhooks
  │   │   └── alerts.py        # WebSocket alerts
  │   ├── services/
  │   │   ├── graph.py         # TigerGraph connection + query runners
  │   │   ├── nlp.py           # Groq extraction + script generation
  │   │   ├── voice.py         # Sarvam STT/TTS
  │   │   ├── caller.py        # Twilio call engine
  │   │   └── followup.py      # Follow-up orchestrator
  │   ├── schemas/             # Pydantic models
  │   ├── scripts/
  │   │   └── seed_data.py     # Graph seeding
  │   └── gsql/                # Raw GSQL query files
  ├── frontend/                # React + Vite (already scaffolded)
  ├── .env.example             # Template (no secrets)
  ├── .gitignore
  ├── requirements.txt
  ├── Dockerfile
  ├── docker-compose.yml
  ├── railway.toml             # One-click Railway deploy
  └── README.md
  ```
  - `[ ]` Create `.env` with: `TG_HOST`, `TG_GRAPHNAME`, `TG_SECRET`, `GROQ_API_KEY`, `SARVAM_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `BASE_URL` (for Twilio webhooks).
  - `[ ]` Create `.env.example` (same keys, empty values — safe for GitHub).
  - `[ ]` Create root `.gitignore` (`.env`, `__pycache__`, `venv/`, `node_modules/`, `.vite/`, `dist/`).
  - `[ ]` Create backend structure as above.
  - `[ ]` Update `requirements.txt` — add `websockets`, `httpx`, `twilio`, `apscheduler`, `python-multipart`.
  - `[ ]` Create venv, install deps, verify `uvicorn` boots on port 8000.
- `[ ]` **Connection Services**
  - `[ ]` `services/graph.py` — `get_connection()` returning a live `TigerGraphConnection`. Keep as singleton.
  - `[ ]` `services/nlp.py` — Groq client initialization + test call. Use `groq.AsyncGroq`.
  - `[ ]` `services/voice.py` — Sarvam STT/TTS client initialization + test call. Use `httpx.AsyncClient` singleton.
  - `[ ]` `services/caller.py` — Twilio client initialization + test outbound call.
  - `[ ]` Smoke test all four connections.
  - `[ ]` **Startup warm-up** in `main.py`: on startup → fire dummy TigerGraph query + pre-run PageRank + pre-generate filler audio clips. APScheduler ping every 4 min to keep TigerGraph alive.

## Phase 2: Graph Schema + Seed Data (~2 hrs)
*Checkpoint: Rich graph visible in GraphStudio with 100+ nodes and meaningful edges.*

- `[ ]` **Deploy Core Schema**
  - Vertices: `Patient`, `Symptom`, `Disease`, `Drug`, `Specialist`, `Treatment`, `RiskFactor`, `LabTest`, `Protocol`, `FollowUp`
  - Key vertex attributes:
    - `Patient`: name, phone, language (hi/ta/te/bn/kn/mr/en), age, gender
    - `Disease`: name, icd_code, prevalence, description
    - `Drug`: name, drug_class, common_side_effects
    - `FollowUp`: status (pending/completed/missed), scheduled_date, pain_score, took_medication, new_symptoms, call_transcript, call_audio_url
    - `Protocol`: followup_days (LIST<INT>), questions_template
  - Edges:
    - `HAS_SYMPTOM` (Disease<->Symptom) — weight: confidence float
    - `PRESENTS_WITH` (Patient->Symptom) — duration_days, severity, reported_date
    - `HAS_CONDITION` (Patient->Disease) — diagnosed_date, status (active/resolved)
    - `TAKES_MEDICATION` (Patient->Drug) — dosage, start_date
    - `TREATED_BY` (Disease->Treatment) — success_rate, cost_tier
    - `PRESCRIBED` (Treatment->Drug) — dosage, duration
    - `INTERACTS_WITH` (Drug<->Drug) — severity: mild/moderate/severe, mechanism, clinical_note
    - `RISK_INCREASES` (Disease->RiskFactor)
    - `ELEVATES` (RiskFactor->Disease) — multiplier float
    - `REQUIRES_TEST` (Disease->LabTest)
    - `HAS_COMPLETED_TEST` (Patient->LabTest) — date, result
    - `REFERS_TO` (Disease->Specialist)
    - `HAS_PROTOCOL` (Disease->Protocol)
    - `HAS_FOLLOWUP` (Patient->FollowUp) — linked_disease
    - `CAUSES_SIDE_EFFECT` (Drug->Symptom) — frequency (common/uncommon/rare)
- `[ ]` **Seed Data** (`scripts/seed_data.py`)
  - `[ ]` 20+ diseases (including 2-3 rare: Hemophagocytic Lymphohistiocytosis, Wilson's Disease).
  - `[ ]` 50+ symptoms with realistic disease mappings and edge weights.
  - `[ ]` 25+ drugs with known interaction pairs (warfarin+aspirin, metformin+alcohol, SSRIs+MAOIs, etc.).
  - `[ ]` 10+ specialists, treatments, risk factors, lab tests.
  - `[ ]` 5 demo patients with full histories — each speaks a different language:
    - **Priya (hi)**: Dengue + Type 2 Diabetes, on metformin + warfarin — perfect for drug interaction + comorbidity demo.
    - **Karthik (ta)**: Post-surgery follow-up, day 7 — perfect for Twilio call demo.
    - **Ananya (te)**: Unusual symptom combo — perfect for rare disease detection.
    - **Rahul (en)**: Multiple chronic conditions — perfect for comorbidity risk predictor.
    - **Meera (bn)**: New patient, first visit — perfect for symptom-to-diagnosis flow.
  - `[ ]` Protocols with followup_days (day 1, 3, 7, 14) and question templates.
  - `[ ]` Pre-seed FollowUp vertices for Karthik with `scheduled_date = today, status = "pending"` (so the demo triggers immediately).
- `[ ]` **Verify in GraphStudio** — confirm node counts, edge counts, sample traversals.

## Phase 3: GSQL Queries (~3 hrs)
*Checkpoint: All 8 queries installed and returning correct results via pyTigerGraph.*

- `[ ]` **Q1: Symptom-to-Diagnosis Multi-hop Traversal** `diagnoseFromSymptoms`
  - Input: `SET<STRING> symptom_names`.
  - Traverse: Symptom -[HAS_SYMPTOM]-> Disease, accumulate edge weights.
  - Output: Top 5 diseases ranked by confidence score + matched symptom count.
  - Also returns: graph nodes + edges traversed (for Cytoscape rendering).
- `[ ]` **Q2: Drug Interaction Checker** `checkDrugInteractions`
  - Input: `SET<STRING> drug_names`.
  - Pattern match: Drug -[INTERACTS_WITH]- Drug across the input set.
  - Output: interaction pairs with severity, mechanism, alternative suggestions.
- `[ ]` **Q3: Treatment Pathway Finder** `findTreatmentPath`
  - Input: disease name.
  - Use TigerGraph built-in shortest-path: Disease -> Specialist -> Treatment -> Drug.
  - Edges weighted by success_rate + accessibility.
  - Output: fastest, safest, most accessible routes.
- `[ ]` **Q4: Rare Disease Detection (4-hop)** `detectRareDiseases`
  - Input: symptom array.
  - 4-hop deep traversal scoped to diseases with `prevalence < 0.001`.
  - Output: rare conditions with ICD code, matched atypical symptoms.
- `[ ]` **Q5: Comorbidity Risk Predictor (4-hop)** `predictComorbidityRisk`
  - Input: patient_id.
  - Hop: Patient -> Disease -> RiskFactor -> Disease -> LabTest.
  - Filter: only diseases where the patient has NOT completed the required LabTest.
  - Accumulate multiplier scores; flag if > 1.5.
  - Output: predicted conditions + risk score + recommended tests.
- `[ ]` **Q6: Graph-Native PageRank** `rankDiseases`
  - Run `tg_pagerank` on Disease sub-network.
  - Output: disease names + pagerank scores (used to weight Q1 results).
- `[ ]` **Q7: Patient Full Context** `getPatientContext` ← NEW (powers the Twilio call)
  - Input: patient_id.
  - Multi-hop read:
    - Patient -> HAS_CONDITION -> Disease (what they have)
    - Patient -> TAKES_MEDICATION -> Drug (what they're on)
    - Drug -> INTERACTS_WITH -> Drug (any interaction risks)
    - Drug -> CAUSES_SIDE_EFFECT -> Symptom (what side effects to ask about)
    - Disease -> RISK_INCREASES -> RiskFactor -> ELEVATES -> Disease (what could develop)
    - Disease -> REQUIRES_TEST -> LabTest vs Patient -> HAS_COMPLETED_TEST (overdue tests)
    - Patient -> HAS_FOLLOWUP -> FollowUp (past follow-up responses)
  - Output: full patient profile blob — the Groq prompt uses this to generate intelligent, personalized questions.
- `[ ]` **Q8: Due Follow-ups** `getDueFollowups`
  - Traverse: Patient -[HAS_FOLLOWUP]-> FollowUp where `scheduled_date <= today && status == "pending"`.
  - Join: Patient -> HAS_CONDITION -> Disease -> HAS_PROTOCOL -> Protocol.
  - Output: patient list with name, phone, language, condition, protocol, follow-up day number.
- `[ ]` **Install + test all queries** via pyTigerGraph or GraphStudio.

## Phase 4: FastAPI Backend (~3 hrs)
*Checkpoint: All REST endpoints live, tested with curl, returning real graph data.*

- `[ ]` **Groq NLP Service** (`services/nlp.py`)
  - `[ ]` `extract_symptoms(text)` — natural text -> `{"symptoms": [...], "duration": ..., "severity": ..., "language": "hi"}`.
  - `[ ]` `extract_followup_response(text)` — patient's verbal response -> `{"pain_score": 4, "took_medication": true, "new_symptoms": ["nausea"], "feeling_better": true}`.
  - `[ ]` `generate_followup_script(patient_context, followup_day)` — takes Q7 output, generates the full empathetic multi-turn conversation script (see Phase 5 for details).
  - `[ ]` Auto-detect language from input (no dropdown).
- `[ ]` **Core Endpoints** (`routers/diagnosis.py`)
  - `[ ]` `POST /api/analyze` — Groq extraction -> Q1 diagnosis -> Q6 PageRank weighting. Returns diagnoses + **graph nodes/edges + `animation_sequence` (hop-by-hop)** for Cytoscape.
  - `[ ]` `POST /api/drug-check` — Q2 interactions + OpenFDA adverse event lookup. Returns interactions + **graph with interaction edges annotated by severity**.
  - `[ ]` `POST /api/treatment-path` — Q3 shortest path. Returns **full pathway as ordered node/edge sequence** for left-to-right rendering.
  - `[ ]` `POST /api/rare-disease` — Q4 rare disease detection. Returns **4-hop animation_sequence**.
  - `[ ]` `POST /api/patient/{id}/risks` — Q5 comorbidity. Returns risk scores + **4-ring graph data** (patient → diseases → risk factors → predicted diseases → lab tests).
  - `[ ]` `GET /api/disease-rankings` — Q6 PageRank results.
  - `[ ]` `GET /api/patient/{id}/context` — Q7 full patient context.
  - `[ ]` `GET /api/graph/overview` — schema metadata for visualization.
- `[ ]` **Voice Endpoints** (`routers/voice.py`)
  - `[ ]` `POST /api/voice/stt` — accepts audio blob, calls Sarvam `saarika:v2`, returns transcript.
  - `[ ]` `POST /api/voice/tts` — accepts text + language, calls Sarvam `bulbul:v1`, returns audio stream/base64.
  - `[ ]` `POST /api/voice/analyze` — full pipeline: audio -> STT -> Groq extract -> Q1 diagnosis -> TTS response.
- `[ ]` **CORS + WebSocket setup** in `main.py`.
- `[ ]` **Test all endpoints.**

## Phase 5: Twilio Voice Agent — THE WOW FACTOR (~3 hrs)
*Checkpoint: AyuNet calls a real phone number, speaks caring Hindi, asks graph-driven questions, and updates the graph in real time.*

**The key insight:** The AI doesn't read a generic script. TigerGraph Q7 (`getPatientContext`) gives it EVERYTHING about the patient — conditions, medications, drug side effects, risk factors, overdue tests, past follow-up responses. Groq uses this to generate hyper-specific, empathetic questions. The patient feels like they're talking to someone who truly KNOWS them.

- `[ ]` **Conversation Flow Design** (multi-turn via Twilio webhooks)
  ```
  TURN 1 — GREETING + IDENTITY VERIFICATION
  ┌────────────────────────────────────────────────────────────┐
  │ "Namaste! Main AyuNet health assistant bol rahi hoon.     │
  │  Kya main Priya ji se baat kar rahi hoon?"                │
  │                                                           │
  │  [Warm, respectful, uses patient's name from graph]       │
  │  [In patient's language — detected from Patient vertex]   │
  └────────────────────────────────────────────────────────────┘
  Patient responds → Sarvam STT → Groq confirms identity

  TURN 2 — CONDITION-SPECIFIC CHECK (graph-driven)
  ┌────────────────────────────────────────────────────────────┐
  │ Graph knows: Patient has Dengue (diagnosed 3 days ago)    │
  │                                                           │
  │ "Priya ji, aapko 3 din pehle dengue fever ka diagnosis    │
  │  hua tha. Batayiye, kya aapka bukhar ab kam hua hai?      │
  │  Aur kya aapke body mein koi rash ya bleeding dikhi hai?" │
  │                                                           │
  │  [Asks about symptoms SPECIFIC to dengue — because the    │
  │   graph traversed Disease->HAS_SYMPTOM->Symptom and       │
  │   knows dengue presents with rash + bleeding in later     │
  │   stages. A generic bot would ask "how are you feeling?"] │
  └────────────────────────────────────────────────────────────┘
  Patient responds → STT → Groq extracts pain_score, new symptoms

  TURN 3 — MEDICATION ADHERENCE (graph-driven)
  ┌────────────────────────────────────────────────────────────┐
  │ Graph knows: Patient takes metformin (diabetes) + new     │
  │ paracetamol (dengue fever). Graph also knows metformin     │
  │ CAUSES_SIDE_EFFECT -> nausea.                             │
  │                                                           │
  │ "Aap apni dawai le rahi hain na? Metformin aur            │
  │  paracetamol dono? Kabhi kabhi metformin se pet mein      │
  │  thoda gadbad hota hai — agar aisa ho raha hai toh        │
  │  zaroor batayein."                                        │
  │                                                           │
  │  [Proactively asks about side effects the GRAPH knows     │
  │   this specific drug causes. Not generic — targeted.]     │
  └────────────────────────────────────────────────────────────┘
  Patient responds → STT → Groq extracts took_medication, side effects

  TURN 4 — NEW SYMPTOMS + REAL-TIME GRAPH QUERY
  ┌────────────────────────────────────────────────────────────┐
  │ "Kya aapko koi naya taklif ho raha hai? Kuch bhi         │
  │  batayein, hum aapki madad ke liye hain."                 │
  │                                                           │
  │  [Open-ended, caring tone]                                │
  └────────────────────────────────────────────────────────────┘
  Patient: "Haan, mujhe bahut thakan lag rahi hai aur
            muscles mein dard hai"
  → STT → Groq extracts: ["fatigue", "muscle_pain"]
  → REAL-TIME: Run Q1 (diagnoseFromSymptoms) with existing +
    new symptoms → Check if comorbidity risk changed
  → Graph finds: muscle_pain + fatigue + metformin →
    possible lactic acidosis (rare but serious metformin
    side effect). Risk score jumps to 2.3.

  TURN 5 — ALERT + REASSURANCE
  ┌────────────────────────────────────────────────────────────┐
  │ "Priya ji, dhanyavaad batane ke liye. Yeh symptoms        │
  │  important hain — hum aapke doctor ko abhi inform kar     │
  │  rahe hain. Woh aapse jaldi contact karenge.              │
  │  Aap paani peeti rahiye aur aaram kariye. Hum aapka      │
  │  khayal rakh rahe hain."                                  │
  │                                                           │
  │  [Doesn't scare the patient. Reassures while escalating.  │
  │   WebSocket alert fires to Doctor Dashboard RIGHT NOW.]   │
  └────────────────────────────────────────────────────────────┘
  → Upsert FollowUp vertex: pain_score, new_symptoms, risk_flag=true
  → WebSocket broadcast: doctor sees alert instantly
  ```

- `[ ]` **Twilio Call Infrastructure** (`services/caller.py`)
  - `[ ]` `prepare_call(patient_id)` — runs Q7 → Groq generates all 5 turns → Sarvam TTS converts all scripts to audio in parallel. Stores call state in memory dict. Returns call_prep_id. **~3 seconds total. All BEFORE dialing.**
  - `[ ]` `initiate_call(call_prep_id, patient_phone)` — Twilio creates outbound call with pre-generated Turn 1 audio ready instantly.
  - `[ ]` Filler audio bank — pre-generated on startup per language: "Accha ji...", "Ek second...", "Dhanyavaad..." (3 clips × 7 languages = 21 tiny audio files cached in memory).
- `[ ]` **Call Webhook Flow** (`routers/calls.py`)
  - `[ ]` `POST /api/calls/initiate` — triggers `prepare_call` + `initiate_call`. Returns immediately with call SID. WebSocket pushes status to dashboard.
  - `[ ]` `POST /api/calls/webhook/{call_sid}/{turn}` — Twilio hits this after each patient response.
    - **Immediately** return TwiML playing filler audio ("Accha ji...") + `<Gather>` pause — buys 2s.
    - **In background:** download recording → Sarvam STT → Groq extract structured data.
    - If response matches pre-generated expected path → next webhook returns pre-generated Turn N+1 audio (instant).
    - If response deviates (e.g., new symptoms) → Groq re-generates Turn N+1 → Sarvam TTS → ~2.5s but filler covers it.
    - If new symptoms → fire Q1 + Q5 in parallel during filler → real-time graph intelligence mid-call.
    - If risk flag triggered → fire WebSocket alert + upsert FollowUp vertex. Doctor sees alert WHILE call is ongoing.
    - Push turn transcript + extracted data to dashboard via WebSocket in real-time.
  - `[ ]` `POST /api/calls/status` — Twilio status callback (completed/failed/no-answer). Update FollowUp vertex status. Cleanup call state from memory.
  - `[ ]` `POST /api/calls/demo-trigger` — one-click: finds first due follow-up → prepare → initiate. Dashboard shows prep progress ("Generating script... Converting to audio... Dialing...").
- `[ ]` **Follow-up Orchestrator** (`services/followup.py`)
  - `[ ]` APScheduler cron job: runs Q8 (`getDueFollowups`) daily.
  - `[ ]` For each due patient: calls `initiate_call()`.
  - `[ ]` `POST /api/followups/due` — returns today's due list.
  - `[ ]` `POST /api/followups/{id}/complete` — mark done + store data.
- `[ ]` **Health Reminder System**
  - `[ ]` Query patients with medication schedules due today.
  - `[ ]` Generate short TTS reminder: "Priya ji, aapki metformin lene ka samay ho gaya."
  - `[ ]` Twilio sends as a quick 15-second call or voicemail.
  - `[ ]` Log reminder status as edges; flag missed reminders.
- `[ ]` **WebSocket Real-time Alerts** (`routers/alerts.py`)
  - `[ ]` WebSocket endpoint: `/ws/alerts`.
  - `[ ]` On risk flag trigger (from call or from dashboard) -> broadcast to all connected Doctor Dashboard clients.
  - `[ ]` Payload: `{patient_id, patient_name, condition, pain_score, new_symptoms, risk_score, timestamp, source: "followup_call"}`.

## Phase 6: Dashboard Frontend (~4 hrs)
*Checkpoint: Full interactive dashboard with graph viz, voice input, call controls, and live alerts.*

- `[ ]` **Routing**
  - `[ ]` react-router: `/` (landing — done), `/dashboard` (the app).
  - `[ ]` Wire "Go to Dashboard" + "Launch Intelligence" buttons.
- `[ ]` **Dashboard Layout**
  - `[ ]` Sidebar tabs: Diagnose | Drug Check | Treatment Path | Risk Analysis | Follow-ups.
  - `[ ]` Main area: input panel (left) + Cytoscape.js graph (right).
  - `[ ]` Top bar: real-time alert indicator (WebSocket-connected, red pulse when alert active).
- `[ ]` **Cytoscape.js Graph Component — THE VISUAL PROOF**
  - `[ ]` Install `cytoscape` + `react-cytoscapejs` + `cytoscape-cola` (force-directed layout).
  - `[ ]` `<GraphView />` — generic component that takes `{nodes, edges, animation_sequence}` from API.
  - `[ ]` **Node Design** (judges should instantly read the graph at a glance):
    - Each vertex type has a distinct shape + color + icon:
      - `Patient` — large white circle, person icon, bold border
      - `Symptom` — blue rounded rectangle
      - `Disease` — red hexagon (stands out)
      - `Drug` — green pill shape (stadium/rounded rect)
      - `Specialist` — purple diamond
      - `Treatment` — orange rectangle
      - `RiskFactor` — yellow triangle (warning shape)
      - `LabTest` — cyan circle
    - Node size scales with relevance (e.g., top-ranked disease = larger node)
    - Confidence/risk scores displayed as labels on nodes
  - `[ ]` **Edge Design**:
    - Width scales with edge weight (high confidence = thick edge)
    - Drug interactions color-coded: green (mild) / yellow (moderate) / red (severe) + animated dash for severe
    - Traversal path edges glow with a pulse animation during query
  - `[ ]` **Hop-by-Hop Traversal Animation** (the judges SEE the multi-hop):
    - API returns `animation_sequence: [{hop: 1, nodes: [...], edges: [...]}, {hop: 2, ...}, ...]`
    - Animation plays sequentially with 600ms delay per hop:
      1. Hop 1: Symptom nodes fade in + glow blue
      2. Hop 2: HAS_SYMPTOM edges animate (draw from source to target) + Disease nodes fade in red
      3. Hop 3: For 4-hop queries — RiskFactor nodes appear yellow
      4. Hop 4: Final Disease/LabTest nodes appear with risk scores
    - Each hop has a subtle "ripple" effect expanding from the newly activated nodes
    - A small "Hop 1 → Hop 2 → Hop 3 → Hop 4" progress indicator below the graph
    - After animation completes: full graph stays visible, traversed path stays highlighted, rest is dimmed
  - `[ ]` **Layout per Query Type** (each query visualizes differently):
    - **Diagnosis (Q1):** Concentric rings — Symptoms in center ring, Diseases in outer ring, edges radiating outward. Top disease largest.
    - **Drug Interaction (Q2):** Force-directed cluster — drugs as nodes, interaction edges between them. Severe = red thick line, nodes repel based on severity.
    - **Treatment Path (Q3):** Left-to-right directed flow — Disease → Specialist → Treatment → Drug. Like a pipeline diagram. Shortest path highlighted, alternatives dimmed.
    - **Rare Disease (Q4):** Same as Q1 but with 4 concentric rings (4 hops visible). Rare diseases pulsing at the outer edge.
    - **Comorbidity Risk (Q5):** Patient at center → Disease ring → RiskFactor ring → Predicted Disease ring → LabTest ring. 4 rings = 4 hops. Color intensity increases with risk multiplier.
  - `[ ]` **Interactive Features**:
    - Click any node → side panel shows full details (attributes, connected nodes)
    - Hover edge → tooltip with weight/severity
    - Zoom + pan + drag nodes
    - "Replay Animation" button to re-run the hop-by-hop sequence
  - `[ ]` **Live Graph Update During Call** (Phase 5 integration):
    - When Twilio call is active and new symptoms are reported via WebSocket:
      - New Symptom nodes animate INTO the existing graph (grow from 0 to full size)
      - New edges draw themselves in
      - Risk score nodes pulse and change color if threshold exceeded
      - This happens on the dashboard WHILE the call is still going — judges see the graph evolving in real-time
- `[ ]` **Diagnose Tab**
  - `[ ]` Text input for natural language symptoms.
  - `[ ]` Mic button for Sarvam voice input (calls `/api/voice/stt`). Animated waveform while recording.
  - `[ ]` "Analyze" -> calls `/api/analyze` -> diagnosis cards + hop-by-hop graph animation.
  - `[ ]` Diagnosis cards ranked with confidence % bar, matched symptom count, PageRank weight.
  - `[ ]` TTS button on each diagnosis to speak it back in patient's language.
  - `[ ]` "Check Rare Diseases" toggle → fires Q4, adds 4-hop rare results to the graph with outer ring animation.
- `[ ]` **Drug Check Tab**
  - `[ ]` Multi-select drug input (with autocomplete from graph).
  - `[ ]` Interaction severity cards (color-coded: green/yellow/red) with mechanism description + clinical note.
  - `[ ]` Graph shows drug cluster with interaction edges. Severe interactions pulse red.
  - `[ ]` "Suggest Alternatives" — graph highlights safe replacement drugs connected to the same Treatment nodes.
- `[ ]` **Treatment Path Tab**
  - `[ ]` Disease selector dropdown.
  - `[ ]` Animated left-to-right pathway: Disease → Specialist → Treatment → Drug.
  - `[ ]` Shows success rate + cost tier on each edge as labels.
  - `[ ]` Multiple paths shown: fastest (highlighted), safest (dotted), most accessible (dashed). Toggle between them.
- `[ ]` **Risk Analysis Tab**
  - `[ ]` Patient selector.
  - `[ ]` Comorbidity risk cards with multiplier scores + recommended tests + "ORDER TEST" button.
  - `[ ]` 4-ring concentric visualization: Patient → Diseases → RiskFactors → Predicted Diseases → Missing LabTests.
  - `[ ]` Risk scores > 1.5 glow red with pulsing animation. Threshold line shown on risk bar chart.
- `[ ]` **Follow-ups Tab — Call Control Center**
  - `[ ]` List of today's due follow-ups from `/api/followups/due`.
  - `[ ]` Each patient card shows: name, language, condition, follow-up day, phone number.
  - `[ ]` **"Call Now" button** per patient — triggers live Twilio call.
  - `[ ]` **Live call status indicator** — ringing / in-progress / completed.
  - `[ ]` **Call transcript panel** — shows real-time transcript as the call progresses (WebSocket updates).
  - `[ ]` **Post-call summary** — structured data extracted (pain score, medication adherence, new symptoms).
  - `[ ]` Status indicators (pending/completed/missed) with color coding.
- `[ ]` **Real-time Alert Banner**
  - `[ ]` WebSocket connection to `/ws/alerts`.
  - `[ ]` Alert toast slides in with: patient name, condition, risk score, and "View Details" link.
  - `[ ]` Alert count badge on the top bar.
  - `[ ]` If alert fires during live demo: it appears WHILE the call is still happening. Maximum wow.

## Phase 7: Deployment & GitHub (~1 hr)
*Checkpoint: Live URL, clean GitHub repo, one-command local setup.*

- `[ ]` **Dockerfile** (backend)
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY backend/ .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- `[ ]` **docker-compose.yml** (local dev — backend + frontend)
- `[ ]` **railway.toml** — for one-click Railway deployment.
- `[ ]` **Frontend deployment** — Vite build outputs to `frontend/dist/`. Deploy to Vercel/Netlify with `VITE_API_URL` env var pointing to Railway backend.
- `[ ]` **Git init + first commit**
  - `[ ]` `git init`, add `.gitignore`, commit project structure.
  - `[ ]` Push to GitHub with a clean commit history.
- `[ ]` **Verify deployment** — hit live URL, test one endpoint, confirm frontend loads.

## Phase 8: Submission & Demo Prep (~1.5 hrs)
*Checkpoint: Polished submission, rehearsed demo, backup plan ready.*

- `[ ]` **Architecture Diagram**
  - Create a clean system diagram showing the full data flow:
  ```
  Patient Voice (Hindi/Tamil/Telugu)
       │
       ▼
  Sarvam AI STT ──→ Groq LLM (extract symptoms)
                         │
                         ▼
                   ┌─────────────┐
                   │ TigerGraph  │
                   │ ┌─────────┐ │
                   │ │ Q1: Dx  │ │──→ Cytoscape.js
                   │ │ Q2: DDI │ │    Visualization
                   │ │ Q3: Tx  │ │
                   │ │ Q4: Rare│ │──→ Diagnosis Cards
                   │ │ Q5: Risk│ │
                   │ │ Q6: PR  │ │──→ Risk Alerts
                   │ │ Q7: Ctx │ │         │
                   │ │ Q8: F/U │ │         ▼
                   │ └─────────┘ │    WebSocket ──→ Doctor Dashboard
                   └──────┬──────┘
                          │
                          ▼
                   Groq LLM (generate caring script)
                          │
                          ▼
                   Sarvam AI TTS
                          │
                          ▼
                   Twilio Voice Call ──→ Patient's Phone
                          │
                          ▼
                   Patient Responds ──→ Loop back to STT
  ```
  - `[ ]` Export as PNG for README + submission.
- `[ ]` **README.md**
  - `[ ]` Elevator pitch (2 sentences).
  - `[ ]` Architecture diagram.
  - `[ ]` Feature list — each feature mapped to which TigerGraph capability it uses:
    - Multi-hop traversal (Q1, Q4, Q5, Q7)
    - Pattern matching (Q2)
    - Shortest path (Q3)
    - Native GDS — PageRank (Q6)
    - Real-time upsert (follow-up response -> graph)
  - `[ ]` "Why TigerGraph?" section: *"A SQL database can look up a disease from symptoms. TigerGraph traverses 4 hops deep — from a patient's existing conditions, through risk factors, to diseases they don't even know they're developing, to lab tests they haven't taken yet — in milliseconds. It doesn't just diagnose. It predicts. And then it calls the patient and asks them the exact right questions, because the graph TOLD it what to ask."*
  - `[ ]` Tech stack with logos.
  - `[ ]` Setup instructions (`git clone` -> `.env` -> `docker-compose up` -> done).
  - `[ ]` Screenshots of dashboard (Cytoscape graph, follow-up tab, alert banner).
  - `[ ]` Demo video link.
- `[ ]` **End-to-end testing** — full demo flow 3x.
- `[ ]` **Loading states + error handling** — skeleton loaders, graceful API fallbacks.

- `[ ]` **Demo Script — "The Hero Story" (5 minutes)**
  The demo follows ONE patient journey that shows every feature:

  **[0:00–0:30] THE PROBLEM**
  "800 million people in India can't describe their symptoms in English. Rural patients miss critical diagnoses. Follow-up care doesn't exist. And drug interactions kill 1.3 million people per year globally."

  **[0:30–1:30] VOICE DIAGNOSIS**
  Open Dashboard. Click mic. Speak in Hindi: *"Mujhe do din se bukhar hai, pet mein dard, aur sar bhi bhari lag raha hai."*
  → Sarvam transcribes → Groq extracts → TigerGraph Q1 fires → Cytoscape ANIMATES the multi-hop traversal live. Top 5 diagnoses appear. Dengue Fever #1 at 87% confidence. PageRank (Q6) confirms it's highly connected.
  → Click TTS button — AyuNet speaks the diagnosis back in Hindi.

  **[1:30–2:00] RARE DISEASE CATCH**
  "But look — the 4-hop rare disease query (Q4) also flagged Hemophagocytic Lymphohistiocytosis. It shares 2 atypical symptoms with this patient. A SQL database would NEVER find this — it requires traversing 4 relationship hops across 3 vertex types."

  **[2:00–2:30] DRUG SAFETY**
  "This patient is already on warfarin for a heart condition. Let's check if the dengue treatment is safe."
  → Drug Check tab → Enter warfarin + paracetamol → Q2 fires → Graph lights up: MODERATE interaction. Mechanism shown. Alternative suggested.
  "The graph just caught a drug interaction that could cause internal bleeding."

  **[2:30–3:00] TREATMENT PATH**
  Treatment Path tab → Select Dengue → Animated shortest path: Disease → Hematologist → IV Fluid Therapy → Safe alternative drug. Shows success rate + cost on each edge.

  **[3:00–3:30] COMORBIDITY PREDICTION**
  Risk Analysis tab → Select Priya → Q5 fires → 4-hop traversal: Diabetes → Immunosuppression (risk factor) → Sepsis → Blood Culture (test NOT yet done). Risk score: 2.1. **Alert fires.**
  → Red toast slides in on the Doctor Dashboard. "The doctor was just notified — no manual check needed."

  **[3:30–4:30] THE WOW — LIVE TWILIO CALL** ← this is where you win
  Follow-ups tab → Karthik is due for Day 7 post-surgery follow-up → Hit "Call Now".
  *Your phone rings on stage.* Pick up.
  AyuNet speaks in Tamil: *"Vanakkam Karthik, naan AyuNet health assistant. Ungaluku 7 naal munbu surgery nadanthuthu. Eppudi irukeenga?"*
  Respond naturally in Tamil. AyuNet asks about specific post-surgery symptoms (because the graph told it what to ask). Report some pain. AyuNet asks about medication. Report a new symptom.
  → On the dashboard screen behind you: the call transcript appears in real-time. The graph re-queries. Risk score updates. Alert fires.
  "The patient just told the AI about a new symptom during an automated phone call — and the doctor was alerted 3 seconds later. No app download. No internet needed. Just a phone call in their own language, powered by graph intelligence."

  **[4:30–5:00] CLOSE**
  Show GraphStudio: "10 vertex types, 12 edge types, 8 GSQL queries including 4-hop traversals, native PageRank, real-time graph upserts during live phone calls. AyuNet doesn't just diagnose — it cares."

- `[ ]` **Record backup demo video** — screen record one clean run of the hero story (in case of wifi/API issues during live demo).
- `[ ]` **Submission materials** — fill out hackathon submission form: title, description, tech stack, repo link, demo video link, live URL.

---

## Feature Checklist
| # | Feature | TigerGraph Capability Used | Phase | Status |
|---|---------|---------------------------|-------|--------|
| 1 | Symptom-to-Diagnosis Multi-hop | Multi-hop traversal (Q1) | 3,4,6 | `[ ]` |
| 2 | Drug Interaction Checker | Pattern matching (Q2) | 3,4,6 | `[ ]` |
| 3 | Treatment Pathway Finder | Shortest path algorithm (Q3) | 3,4,6 | `[ ]` |
| 4 | Rare Disease Detection | 4-hop deep traversal (Q4) | 3,4,6 | `[ ]` |
| 5 | Comorbidity Risk Predictor | 4-hop + accumulator (Q5) | 3,4,6 | `[ ]` |
| 6 | Graph-Native PageRank | GDS library — tg_pagerank (Q6) | 3,4 | `[ ]` |
| 7 | Multilingual Voice I/O | — (Sarvam AI) | 4,6 | `[ ]` |
| 8 | Graph-Driven Follow-up Calls | Multi-hop context read (Q7) + real-time upsert | 5,6 | `[ ]` |
| 9 | Structured Data Collection | Real-time vertex upsert during call | 5 | `[ ]` |
| 10 | Health Reminders | Graph query + Twilio dispatch | 5 | `[ ]` |
| 11 | Real-time Doctor Alerts | WebSocket on graph flag trigger | 5,6 | `[ ]` |
