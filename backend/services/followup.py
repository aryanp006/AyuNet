import asyncio
from datetime import date
from services import graph as graph_service
from services import caller as caller_service

# WebSocket broadcast function — set by main.py
_ws_broadcast = None


def set_ws_broadcast(fn):
    global _ws_broadcast
    _ws_broadcast = fn


async def check_and_trigger_followups():
    """Daily job: find due follow-ups and initiate calls."""
    try:
        due = graph_service.run_due_followups()
        patients = due.get("patients", [])
        print(f"[FollowUp] Found {len(patients)} due follow-ups")

        for patient in patients:
            try:
                call_prep = await caller_service.prepare_call(patient["patient_id"])
                call_sid = await caller_service.initiate_call(call_prep)
                print(f"[FollowUp] Called {patient['patient_name']}: {call_sid}")
            except Exception as e:
                print(f"[FollowUp] Failed to call {patient['patient_name']}: {e}")

    except Exception as e:
        print(f"[FollowUp] Job failed: {e}")


async def process_call_response(call_sid: str, turn: int, speech_result: str):
    """Process patient's verbal response during a call."""
    from services.nlp import extract_followup_response

    state = caller_service.call_states.get(call_sid)
    if not state:
        return

    # Extract structured data from speech
    extracted = await extract_followup_response(speech_result)
    state.setdefault("extracted_data", {}).update(extracted)

    # Check for risk flags
    risk_flag = False
    pain_score = extracted.get("pain_score", 0)
    new_symptoms = extracted.get("new_symptoms", [])

    if pain_score and pain_score > 7:
        risk_flag = True
    if new_symptoms:
        risk_flag = True

    state["risk_flag"] = risk_flag

    # If new symptoms reported in Turn 4, run real-time graph queries
    if turn == 4 and new_symptoms:
        diagnose_result = graph_service.run_diagnose(new_symptoms)
        risk_result = graph_service.run_comorbidity_risk(state["patient_id"])
        state["realtime_diagnosis"] = diagnose_result
        state["realtime_risk"] = risk_result

    # Upsert follow-up data back to Neo4j
    followup_data = {
        "status": "completed",
        "pain_score": pain_score,
        "took_medication": extracted.get("took_medication", False),
        "new_symptoms": ",".join(new_symptoms) if new_symptoms else "",
        "risk_flag": risk_flag,
    }

    try:
        graph_service.upsert_followup(
            state["patient_id"],
            f"fu_{state['patient_id']}_{date.today().isoformat()}",
            followup_data,
        )
    except Exception as e:
        print(f"[FollowUp] Upsert failed: {e}")

    # Broadcast alert via WebSocket if risk flag
    if risk_flag and _ws_broadcast:
        alert = {
            "type": "risk_alert",
            "patient_id": state["patient_id"],
            "patient_name": state["patient_name"],
            "pain_score": pain_score,
            "new_symptoms": new_symptoms,
            "risk_flag": True,
            "source": "followup_call",
            "call_sid": call_sid,
        }
        await _ws_broadcast(alert)

    # Broadcast turn transcript for live dashboard
    if _ws_broadcast:
        await _ws_broadcast({
            "type": "call_transcript",
            "call_sid": call_sid,
            "turn": turn,
            "patient_speech": speech_result,
            "extracted": extracted,
            "risk_flag": risk_flag,
        })
