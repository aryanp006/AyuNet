import json
from groq import AsyncGroq
from config import GROQ_API_KEY

client = AsyncGroq(api_key=GROQ_API_KEY)

MODEL = "llama-3.3-70b-versatile"


async def extract_symptoms(text: str) -> dict:
    """Extract structured symptoms from natural language (any Indic language or English)."""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a medical NLP engine. Extract symptoms from patient text in any language "
                    "(Hindi, Tamil, Telugu, Bengali, Kannada, Marathi, English). "
                    "Return ONLY valid JSON: "
                    '{"symptoms": ["symptom1", "symptom2"], "duration_days": <int or null>, '
                    '"severity": "<mild|moderate|severe>", "language": "<detected 2-letter code: hi/ta/te/bn/kn/mr/en>"}'
                    "\nTranslate symptom names to English. Be precise and clinical."
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.1,
        max_tokens=500,
    )
    raw = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(raw)


async def extract_followup_response(text: str) -> dict:
    """Extract structured data from patient follow-up verbal response."""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract structured data from a patient's verbal follow-up response. "
                    "The patient may speak in any Indian language. Return ONLY valid JSON: "
                    '{"pain_score": <1-10 int>, "took_medication": <bool>, '
                    '"new_symptoms": ["symptom1"], "feeling_better": <bool>, "language": "<2-letter code>"}'
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.1,
        max_tokens=300,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(raw)


async def generate_followup_script(patient_context: dict, followup_day: int, language: str) -> dict:
    """Generate a full multi-turn empathetic follow-up call script from graph context."""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are AyuNet's caring health assistant. Generate a 5-turn follow-up call script. "
                    f"The patient speaks {language}. Use their language throughout. Be warm, respectful, empathetic. "
                    "You have the patient's full medical context from a graph database. "
                    "Ask SPECIFIC questions about their conditions, medications, side effects — NOT generic questions. "
                    "Return ONLY valid JSON:\n"
                    "{\n"
                    '  "turn_1": {"script": "greeting + identity verify", "expect": "identity_confirm"},\n'
                    '  "turn_2": {"script": "condition-specific check question", "expect": "symptom_update"},\n'
                    '  "turn_3": {"script": "medication adherence + side effect check", "expect": "medication_check"},\n'
                    '  "turn_4": {"script": "open-ended new symptoms question", "expect": "open_ended"},\n'
                    '  "turn_5_safe": {"script": "reassurance + goodbye (if all ok)"},\n'
                    '  "turn_5_alert": {"script": "reassurance + doctor escalation (if concerning symptoms)"}\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Patient context from TigerGraph:\n{json.dumps(patient_context, indent=2)}\n\n"
                    f"This is follow-up day {followup_day}."
                ),
            },
        ],
        temperature=0.7,
        max_tokens=1500,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(raw)


async def generate_diagnosis_response(diagnoses: list, language: str) -> str:
    """Generate a patient-friendly diagnosis explanation in their language."""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are a caring medical assistant. Explain diagnoses to a patient in {language}. "
                    "Be simple, reassuring, and clear. 2-3 sentences max."
                ),
            },
            {
                "role": "user",
                "content": f"Diagnoses found: {json.dumps(diagnoses)}",
            },
        ],
        temperature=0.5,
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()
