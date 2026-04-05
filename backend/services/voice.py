import base64
import httpx
from config import SARVAM_API_KEY

SARVAM_BASE = "https://api.sarvam.ai"

_http_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "api-subscription-key": SARVAM_API_KEY,
            },
        )
    return _http_client


LANGUAGE_MAP = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "kn": "kn-IN",
    "mr": "mr-IN",
    "en": "en-IN",
}


async def speech_to_text(audio_bytes: bytes, language: str = "hi") -> str:
    """Transcribe audio using Sarvam saarika:v2 STT."""
    client = _get_client()
    lang_code = LANGUAGE_MAP.get(language, "hi-IN")
    audio_b64 = base64.b64encode(audio_bytes).decode()

    resp = await client.post(
        f"{SARVAM_BASE}/speech-to-text",
        json={
            "input": audio_b64,
            "language_code": lang_code,
            "model": "saarika:v2",
            "with_timestamps": False,
        },
    )
    resp.raise_for_status()
    return resp.json().get("transcript", "")


async def text_to_speech(text: str, language: str = "hi") -> bytes:
    """Convert text to speech using Sarvam bulbul:v1 TTS. Returns audio bytes."""
    client = _get_client()
    lang_code = LANGUAGE_MAP.get(language, "hi-IN")

    resp = await client.post(
        f"{SARVAM_BASE}/text-to-speech",
        json={
            "input": text,
            "target_language_code": lang_code,
            "model": "bulbul:v1",
            "speaker": "meera",
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "enable_preprocessing": True,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    audio_b64 = data.get("audio_base64", data.get("audios", [""])[0])
    return base64.b64decode(audio_b64)


async def generate_filler_audio(language: str = "hi") -> dict[str, bytes]:
    """Pre-generate filler audio clips for a language. Returns dict of filler_name -> audio_bytes."""
    fillers = {
        "hi": ["Accha ji...", "Ek second, main check karti hoon...", "Dhanyavaad, bahut accha..."],
        "ta": ["Sari...", "Oru nimisham paarunga...", "Nandri, romba nalla irukku..."],
        "te": ["Sare...", "Oka second, nenu check chestunna...", "Dhanyavaadalu..."],
        "bn": ["Accha...", "Ek second, ami check korchi...", "Dhonnobad..."],
        "kn": ["Sari...", "Ondu second, nanu check maadtiddeeni...", "Dhanyavaadagalu..."],
        "mr": ["Barobar...", "Ek second, mi check karte...", "Dhanyavaad..."],
        "en": ["Okay...", "One moment, let me check...", "Thank you, that's great..."],
    }

    lang_fillers = fillers.get(language, fillers["en"])
    result = {}
    for i, text in enumerate(lang_fillers):
        audio = await text_to_speech(text, language)
        result[f"filler_{i}"] = audio
    return result
