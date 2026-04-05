import pyTigerGraph as tg
from config import TG_HOST, TG_GRAPHNAME, TG_SECRET, TG_USERNAME, TG_PASSWORD

_conn = None
_gsql_conn = None


def get_connection() -> tg.TigerGraphConnection:
    """REST API connection (for runInstalledQuery, upsert, echo)."""
    global _conn
    if _conn is None:
        _conn = tg.TigerGraphConnection(
            host=TG_HOST,
            graphname=TG_GRAPHNAME,
            username=TG_USERNAME,
            password="",
        )
        if TG_SECRET:
            _conn.getToken(TG_SECRET)
    return _conn


def get_gsql_connection() -> tg.TigerGraphConnection:
    """GSQL connection with jwtToken (for gsql() calls on Savanna)."""
    global _gsql_conn
    if _gsql_conn is None:
        rest = get_connection()
        token = rest.getToken(TG_SECRET)[0] if TG_SECRET else ""
        _gsql_conn = tg.TigerGraphConnection(
            host=TG_HOST,
            graphname=TG_GRAPHNAME,
            username=TG_USERNAME,
            password="",
            jwtToken=token,
        )
    return _gsql_conn


async def warm_up():
    """Fire a dummy query to wake TigerGraph free-tier instance."""
    conn = get_connection()
    try:
        conn.echo()
        print("[TigerGraph] Warm-up ping successful")
    except Exception as e:
        print(f"[TigerGraph] Warm-up failed: {e}")


async def keep_alive():
    """Ping TigerGraph to prevent free-tier sleep."""
    conn = get_connection()
    try:
        conn.echo()
    except Exception:
        pass


# --- Query runners ---

def run_diagnose(symptoms: list[str]) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("diagnoseFromSymptoms", {"symptom_names": symptoms})[0]


def run_drug_interactions(drugs: list[str]) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("checkDrugInteractions", {"drug_names": drugs})[0]


def run_treatment_path(disease_name: str) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("findTreatmentPath", {"disease_name": disease_name})[0]


def run_rare_diseases(symptoms: list[str]) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("detectRareDiseases", {"symptom_names": symptoms})[0]


def run_comorbidity_risk(patient_id: str) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("predictComorbidityRisk", {"patient_id": patient_id})[0]


def run_pagerank() -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("rankDiseases")[0]


def run_patient_context(patient_id: str) -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("getPatientContext", {"patient_id": patient_id})[0]


def run_due_followups() -> dict:
    conn = get_connection()
    return conn.runInstalledQuery("getDueFollowups")[0]


def upsert_followup(patient_id: str, followup_id: str, data: dict):
    conn = get_connection()
    conn.upsertVertex("FollowUp", followup_id, data)


# --- PageRank cache ---

_pagerank_cache: dict | None = None


def get_cached_pagerank() -> dict:
    global _pagerank_cache
    if _pagerank_cache is None:
        _pagerank_cache = run_pagerank()
    return _pagerank_cache


def refresh_pagerank():
    global _pagerank_cache
    _pagerank_cache = run_pagerank()
