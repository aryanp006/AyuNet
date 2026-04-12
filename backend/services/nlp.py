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

    # Build a concise medication summary for the prompt
    meds_summary = ""
    for med in patient_context.get("medications", []):
        meds_summary += f"  - {med.get('name', 'Unknown')}: {med.get('dosage', '')}\n"
    if not meds_summary:
        meds_summary = "  (no medications recorded)\n"

    conditions_summary = ", ".join(
        c.get("name", "") for c in patient_context.get("conditions", []) if c.get("name")
    ) or "general follow-up"

    symptoms_summary = ", ".join(patient_context.get("symptoms", [])) or "none recorded"

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are AyuNet's caring health assistant making a follow-up phone call. "
                    f"The patient speaks {language}. Use their language throughout. Be warm, respectful, empathetic. "
                    "You have the patient's full medical context from a graph database. "
                    "\n\nIMPORTANT RULES FOR THE CALL SCRIPT:\n"
                    "1. Turn 1: Greet the patient BY NAME. Introduce yourself as AyuNet Health Assistant. "
                    "Verify identity (ask them to confirm their name).\n"
                    "2. Turn 2: Ask SPECIFICALLY about their current condition — reference their ACTUAL diagnosis. "
                    "Ask how they're feeling, if fever has come down, pain level (1-10), appetite, energy level.\n"
                    "3. Turn 3: Check medication adherence — mention EACH prescribed medication BY NAME and DOSAGE. "
                    "Ask if they're taking them on time, any side effects experienced. "
                    "Also suggest next recovery steps: rest, hydration, when to get next blood test, "
                    "when to see the doctor again.\n"
                    "4. Turn 4: Ask if the patient would like to hear some home remedies and tips "
                    "for faster recovery from their specific condition. Wait for their response.\n"
                    "5. Turn 5 (safe version — if patient is recovering well): Share 3-4 specific, safe, "
                    "evidence-based home remedies relevant to their condition (e.g., for dengue: papaya leaf juice "
                    "for platelets, tulsi/giloy kadha for immunity, light khichdi diet, coconut water for hydration). "
                    "End with warm wishes and remind them to call if any new symptoms appear.\n"
                    "6. Turn 5 (alert version — if concerning symptoms): Urgently advise them to visit the hospital. "
                    "Tell them a doctor has been alerted. Reassure them not to panic but to act quickly.\n"
                    "\nReturn ONLY valid JSON:\n"
                    "{\n"
                    '  "turn_1": {"script": "...", "expect": "identity_confirm"},\n'
                    '  "turn_2": {"script": "...", "expect": "condition_update"},\n'
                    '  "turn_3": {"script": "...", "expect": "medication_check"},\n'
                    '  "turn_4": {"script": "...", "expect": "home_remedy_consent"},\n'
                    '  "turn_5_safe": {"script": "...with home remedies and goodbye..."},\n'
                    '  "turn_5_alert": {"script": "...urgent doctor escalation..."}\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Patient context from Neo4j graph:\n"
                    f"Name: {patient_context.get('patient_name', 'Patient')}\n"
                    f"Age: {patient_context.get('age', 'unknown')}, Gender: {patient_context.get('gender', '')}\n"
                    f"Diagnosis: {conditions_summary}\n"
                    f"Current symptoms: {symptoms_summary}\n"
                    f"Prescribed medications:\n{meds_summary}"
                    f"This is follow-up day {followup_day}."
                ),
            },
        ],
        temperature=0.7,
        max_tokens=2000,
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
