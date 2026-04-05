# AyuNet — Graph-Powered Multilingual Health Intelligence

> **800 million Indians can't describe symptoms in English.** AyuNet lets them speak in their mother tongue — and a graph database does in milliseconds what no SQL database can: multi-hop traversals across symptoms, diseases, drugs, and risk factors to deliver precise, life-saving diagnoses. Then it *calls* the patient back, speaks to them in their language, and alerts the doctor in real-time.

## Architecture

```
Patient Voice (Hindi/Tamil/Telugu/Bengali/Kannada/Marathi)
     |
     v
Sarvam AI STT --> Groq LLM (extract symptoms)
                       |
                       v
                 +-------------+
                 | TigerGraph  |
                 | Q1: Diagnose|-->  Cytoscape.js
                 | Q2: Drug    |    Visualization
                 | Q3: Treat   |
                 | Q4: Rare    |-->  Diagnosis Cards
                 | Q5: Risk    |
                 | Q6: PageRank|-->  Risk Alerts
                 | Q7: Context |         |
                 | Q8: FollowUp|         v
                 +------+------+   WebSocket --> Doctor Dashboard
                        |
                        v
                 Groq LLM (generate caring script)
                        |
                        v
                 Sarvam AI TTS
                        |
                        v
                 Twilio Voice Call --> Patient's Phone
```

## Why TigerGraph?

A SQL database can look up a disease from symptoms. TigerGraph traverses **4 hops deep** — from a patient's existing conditions, through risk factors, to diseases they don't even know they're developing, to lab tests they haven't taken yet — in milliseconds.

It doesn't just diagnose. It **predicts**. And then it **calls** the patient and asks them the exact right questions, because the graph TOLD it what to ask.

### TigerGraph Capabilities Used

| Feature | TigerGraph Capability | Query |
|---------|----------------------|-------|
| Symptom-to-Diagnosis | Multi-hop traversal | Q1 |
| Drug Interaction Check | Pattern matching | Q2 |
| Treatment Pathway | Shortest path algorithm | Q3 |
| Rare Disease Detection | 4-hop deep traversal | Q4 |
| Comorbidity Risk | 4-hop + accumulator | Q5 |
| Disease Ranking | Native GDS PageRank | Q6 |
| Patient Context (Calls) | Multi-hop context read | Q7 |
| Follow-up Scheduling | Graph query + traversal | Q8 |

## Tech Stack

- **Graph Database:** TigerGraph Cloud (8 GSQL queries, 10 vertex types, 15 edge types)
- **Backend:** FastAPI (async), WebSockets
- **Frontend:** React + Vite + Tailwind CSS + Cytoscape.js
- **LLM:** Groq (LLaMA 3 70B) — symptom extraction + script generation
- **Voice:** Sarvam AI (saarika:v2 STT + bulbul:v1 TTS) — 7 Indic languages
- **Calls:** Twilio — automated follow-up phone calls
- **Visualization:** Cytoscape.js with hop-by-hop traversal animation

## Features

1. **Multilingual Voice Diagnosis** — Speak symptoms in any Indian language
2. **Drug Interaction Checker** — Pattern matching across drug combinations
3. **Treatment Pathway Finder** — Shortest path from disease to treatment
4. **Rare Disease Detection** — 4-hop deep traversal catches uncommon conditions
5. **Comorbidity Risk Predictor** — 4-hop risk accumulation with alert threshold
6. **Graph-Native PageRank** — Disease network analysis for differential diagnosis
7. **Automated Follow-up Calls** — Graph-driven, empathetic, multilingual phone calls
8. **Real-time Doctor Alerts** — WebSocket alerts when risk flags trigger during calls
9. **Live Graph Visualization** — Hop-by-hop animation proving multi-hop traversals

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/AyuNet.git
cd AyuNet

# Backend
cp .env.example .env  # fill in your API keys
pip install -r requirements.txt
cd backend && uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Or use Docker
docker-compose up
```

## Demo Patients

| Name | Language | Conditions | Demo Purpose |
|------|----------|-----------|--------------|
| Priya | Hindi | Dengue + Diabetes | Drug interaction + comorbidity |
| Karthik | Tamil | Post-surgery | Twilio follow-up call |
| Ananya | Telugu | Unusual symptoms | Rare disease detection |
| Rahul | English | Multiple chronic | Risk prediction |
| Meera | Bengali | New patient | Symptom-to-diagnosis flow |

## License

MIT
