import base64
from fastapi import APIRouter, Request, Form
from fastapi.responses import Response
from schemas.models import CallInitiateRequest
from services import caller as caller_service
from services import followup as followup_service
from services import graph as graph_service

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.post("/initiate")
async def initiate_call(req: CallInitiateRequest):
    """Prepare + initiate a Twilio follow-up call to a patient."""
    call_prep = await caller_service.prepare_call(req.patient_id)
    call_sid = await caller_service.initiate_call(call_prep)
    return {
        "call_sid": call_sid,
        "patient_id": req.patient_id,
        "patient_name": call_prep["patient_name"],
        "status": "initiated",
        "script_preview": call_prep.get("script", {}),
    }


@router.post("/webhook/start")
async def webhook_start(request: Request):
    """Twilio hits this when the call connects. Play Turn 1."""
    form = await request.form()
    call_sid = form.get("CallSid", "")
    twiml = caller_service.build_turn_twiml(call_sid, 1)
    return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/{call_sid}/{turn}")
async def webhook_turn(call_sid: str, turn: int, request: Request):
    """Twilio hits this after each patient response. Process + play next turn."""
    form = await request.form()
    speech_result = form.get("SpeechResult", "")

    # Process the patient's response in the background
    await followup_service.process_call_response(call_sid, turn - 1, speech_result)

    state = caller_service.call_states.get(call_sid, {})

    # Determine which turn to play
    if turn == 5:
        # Final turn — choose safe or alert version
        turn_key = "turn_5_alert" if state.get("risk_flag") else "turn_5_safe"
        twiml = caller_service.build_turn_twiml(call_sid, 5)
    else:
        twiml = caller_service.build_turn_twiml(call_sid, turn)

    return Response(content=twiml, media_type="application/xml")


@router.get("/audio/{call_sid}/{turn_key}")
async def get_call_audio(call_sid: str, turn_key: str):
    """Serve pre-generated audio for a specific call turn."""
    state = caller_service.call_states.get(call_sid, {})

    # Check pre-generated audio
    audio_b64 = state.get("audio", {}).get(turn_key)

    # Check filler cache
    if not audio_b64 and turn_key.startswith("filler_"):
        language = state.get("language", "hi")
        filler = caller_service.filler_cache.get(language, {}).get(turn_key)
        if filler:
            audio_b64 = base64.b64encode(filler).decode()

    if not audio_b64:
        return Response(status_code=404)

    audio_bytes = base64.b64decode(audio_b64)
    return Response(content=audio_bytes, media_type="audio/wav")


@router.post("/status")
async def call_status(request: Request):
    """Twilio status callback — call completed/failed."""
    form = await request.form()
    call_sid = form.get("CallSid", "")
    status = form.get("CallStatus", "")

    state = caller_service.call_states.pop(call_sid, None)
    if state:
        print(f"[Call] {call_sid} → {status} (patient: {state.get('patient_name')})")

    return {"status": "ok"}


@router.post("/demo-trigger")
async def demo_trigger():
    """One-click: find first due follow-up, prepare, and initiate call."""
    due = graph_service.run_due_followups()
    patients = due.get("patients", [])

    if not patients:
        return {"error": "No follow-ups due today", "patients": []}

    patient = patients[0]
    call_prep = await caller_service.prepare_call(patient["patient_id"])
    call_sid = await caller_service.initiate_call(call_prep)

    return {
        "call_sid": call_sid,
        "patient": patient,
        "status": "initiated",
    }


@router.get("/followups/due")
async def get_due_followups():
    """Get today's due follow-ups."""
    result = graph_service.run_due_followups()
    return {"followups": result}
