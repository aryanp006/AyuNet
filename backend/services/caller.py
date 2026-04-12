import asyncio
import base64
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, BASE_URL
from services import graph as graph_service
from services import nlp as nlp_service
from services import voice as voice_service
from services.voice import LANGUAGE_MAP

twilio_client: Client | None = None

# In-memory call state: call_sid -> CallState
call_states: dict[str, dict] = {}

# Pre-generated filler audio per language
filler_cache: dict[str, dict[str, bytes]] = {}


def get_twilio_client() -> Client:
    global twilio_client
    if twilio_client is None:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    return twilio_client


async def prepare_call(patient_id: str) -> dict:
    """Pre-generate the entire call script + audio BEFORE dialing.
    Returns call prep data with all turns ready.
    """
    # 1. Get full patient context from Neo4j
    context = graph_service.run_patient_context(patient_id)

    patient_name = context.get("patient_name", "Patient")
    language = context.get("language", "hi")
    followup_day = context.get("followup_day", 1)

    # 2. Generate all 5 turns via Groq
    script = await nlp_service.generate_followup_script(context, followup_day, language)

    # 3. Convert ALL turn scripts to audio in parallel
    tts_tasks = []
    turn_keys = ["turn_1", "turn_2", "turn_3", "turn_4", "turn_5_safe", "turn_5_alert"]
    for key in turn_keys:
        if key in script:
            text = script[key]["script"]
            tts_tasks.append(voice_service.text_to_speech(text, language))

    audio_results = await asyncio.gather(*tts_tasks, return_exceptions=True)

    audio_map = {}
    for key, audio in zip(turn_keys, audio_results):
        if isinstance(audio, Exception):
            print(f"[TTS] FAILED for {key}: {audio}")
        elif isinstance(audio, bytes) and len(audio) > 0:
            audio_map[key] = base64.b64encode(audio).decode()
        else:
            print(f"[TTS] Empty audio for {key}")

    if not audio_map:
        print(f"[TTS] WARNING: No audio generated for any turn! Script will use Twilio <Say> fallback.")

    call_prep = {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "language": language,
        "phone": context.get("phone", ""),
        "script": script,
        "audio": audio_map,
        "current_turn": 0,
        "extracted_data": {},
    }
    return call_prep


async def initiate_call(call_prep: dict) -> str:
    """Initiate the Twilio call with pre-generated Turn 1 audio ready."""
    client = get_twilio_client()
    patient_phone = call_prep["phone"]

    call = client.calls.create(
        to=patient_phone,
        from_=TWILIO_PHONE_NUMBER,
        url=f"{BASE_URL}/api/calls/webhook/start",
        status_callback=f"{BASE_URL}/api/calls/status",
        status_callback_event=["completed", "failed", "no-answer"],
    )

    call_sid = call.sid
    call_prep["call_sid"] = call_sid
    call_prep["current_turn"] = 1
    call_states[call_sid] = call_prep

    return call_sid


def build_turn_twiml(call_sid: str, turn_num: int) -> str:
    """Build TwiML response for a specific turn using pre-generated audio."""
    state = call_states.get(call_sid, {})
    language = state.get("language", "hi")

    # For turn 5, pick safe or alert variant based on risk_flag
    if turn_num == 5:
        turn_key = "turn_5_alert" if state.get("risk_flag") else "turn_5_safe"
    else:
        turn_key = f"turn_{turn_num}"

    audio_b64 = state.get("audio", {}).get(turn_key)

    response = VoiceResponse()

    if audio_b64:
        # Play pre-generated audio
        response.play(f"{BASE_URL}/api/calls/audio/{call_sid}/{turn_key}")
    else:
        # Fallback: use Twilio's built-in TTS if Sarvam audio is missing
        script_text = state.get("script", {}).get(turn_key, {}).get("script", "")
        if script_text:
            twilio_lang = LANGUAGE_MAP.get(language, "hi-IN")
            response.say(script_text, language=twilio_lang)
            print(f"[TwiML] Using <Say> fallback for {turn_key}")
        else:
            print(f"[TwiML] WARNING: No audio AND no script for {turn_key}")

    if turn_num < 5:
        # Map language to Twilio speech recognition locale
        twilio_lang = LANGUAGE_MAP.get(language, "hi-IN")
        # Gather patient response
        gather = Gather(
            input="speech",
            action=f"{BASE_URL}/api/calls/webhook/{call_sid}/{turn_num + 1}",
            language=twilio_lang,
            speech_timeout="auto",
            timeout=10,
        )
        response.append(gather)
    else:
        response.hangup()

    return str(response)


def get_filler_twiml(call_sid: str, next_action_url: str) -> str:
    """Return TwiML that plays a filler while processing."""
    state = call_states.get(call_sid, {})
    language = state.get("language", "hi")

    response = VoiceResponse()
    response.play(f"{BASE_URL}/api/calls/audio/{call_sid}/filler_0")
    response.pause(length=1)
    response.redirect(next_action_url)
    return str(response)


async def pre_generate_fillers():
    """Pre-generate filler audio for all supported languages on startup."""
    global filler_cache
    languages = ["hi", "ta", "te", "bn", "kn", "mr", "en"]
    for lang in languages:
        try:
            filler_cache[lang] = await voice_service.generate_filler_audio(lang)
            print(f"[Filler] Generated fillers for {lang}")
        except Exception as e:
            print(f"[Filler] Failed for {lang}: {e}")
