import os
from dotenv import load_dotenv

load_dotenv()

# TigerGraph
TG_HOST = os.getenv("TG_HOST", "")
TG_GRAPHNAME = os.getenv("TG_GRAPHNAME", "AyuNet")
TG_SECRET = os.getenv("TG_SECRET", "")
TG_USERNAME = os.getenv("TG_USERNAME", "tigergraph")
TG_PASSWORD = os.getenv("TG_PASSWORD", "")

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Sarvam AI
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")

# Twilio
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# App
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
