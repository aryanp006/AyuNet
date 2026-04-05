"""
AyuNet Graph Setup Script
Installs schema + all 8 GSQL queries on TigerGraph Cloud.
Run: cd backend && python scripts/setup_graph.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TG_HOST, TG_GRAPHNAME, TG_SECRET, TG_USERNAME, TG_PASSWORD
import pyTigerGraph as tg


def main():
    print("[Setup] Connecting to TigerGraph Cloud...")
    conn = tg.TigerGraphConnection(
        host=TG_HOST,
        graphname="",  # connect without graph first for schema creation
        username=TG_USERNAME,
        password=TG_PASSWORD,
    )

    # =============================
    # STEP 1: CREATE SCHEMA
    # =============================
    print("\n[Step 1] Creating schema (vertices + edges)...")

    schema_gsql = """
USE GLOBAL

CREATE VERTEX Patient (PRIMARY_ID patient_id STRING, name STRING, phone STRING, language STRING, age INT, gender STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Symptom (PRIMARY_ID symptom_id STRING, name STRING, category STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Disease (PRIMARY_ID disease_id STRING, name STRING, icd_code STRING, prevalence FLOAT, description STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Drug (PRIMARY_ID drug_id STRING, name STRING, drug_class STRING, common_side_effects STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Specialist (PRIMARY_ID specialist_id STRING, name STRING, specialization STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Treatment (PRIMARY_ID treatment_id STRING, name STRING, treatment_type STRING, cost_tier STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX RiskFactor (PRIMARY_ID risk_factor_id STRING, name STRING, category STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX LabTest (PRIMARY_ID lab_test_id STRING, name STRING, test_type STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX Protocol (PRIMARY_ID protocol_id STRING, name STRING, followup_days STRING, questions_template STRING) WITH primary_id_as_attribute="true"
CREATE VERTEX FollowUp (PRIMARY_ID followup_id STRING, status STRING, scheduled_date STRING, pain_score INT, took_medication BOOL, new_symptoms STRING, call_transcript STRING, risk_flag BOOL) WITH primary_id_as_attribute="true"

CREATE UNDIRECTED EDGE HAS_SYMPTOM (FROM Disease, TO Symptom, weight FLOAT)
CREATE DIRECTED EDGE PRESENTS_WITH (FROM Patient, TO Symptom, duration_days INT, severity STRING, reported_date STRING)
CREATE DIRECTED EDGE HAS_CONDITION (FROM Patient, TO Disease, diagnosed_date STRING, status STRING)
CREATE DIRECTED EDGE TAKES_MEDICATION (FROM Patient, TO Drug, dosage STRING, start_date STRING)
CREATE DIRECTED EDGE TREATED_BY (FROM Disease, TO Treatment, success_rate FLOAT, accessibility_score FLOAT)
CREATE DIRECTED EDGE PRESCRIBED (FROM Treatment, TO Drug, dosage STRING, duration STRING)
CREATE UNDIRECTED EDGE INTERACTS_WITH (FROM Drug, TO Drug, severity STRING, mechanism STRING, clinical_note STRING)
CREATE DIRECTED EDGE RISK_INCREASES (FROM Disease, TO RiskFactor)
CREATE DIRECTED EDGE ELEVATES (FROM RiskFactor, TO Disease, multiplier FLOAT)
CREATE DIRECTED EDGE REQUIRES_TEST (FROM Disease, TO LabTest)
CREATE DIRECTED EDGE HAS_COMPLETED_TEST (FROM Patient, TO LabTest, test_date STRING, result STRING)
CREATE DIRECTED EDGE REFERS_TO (FROM Disease, TO Specialist)
CREATE DIRECTED EDGE HAS_PROTOCOL (FROM Disease, TO Protocol)
CREATE DIRECTED EDGE HAS_FOLLOWUP (FROM Patient, TO FollowUp, linked_disease STRING)
CREATE DIRECTED EDGE CAUSES_SIDE_EFFECT (FROM Drug, TO Symptom, frequency STRING)

CREATE GRAPH AyuNet (Patient, Symptom, Disease, Drug, Specialist, Treatment, RiskFactor, LabTest, Protocol, FollowUp, HAS_SYMPTOM, PRESENTS_WITH, HAS_CONDITION, TAKES_MEDICATION, TREATED_BY, PRESCRIBED, INTERACTS_WITH, RISK_INCREASES, ELEVATES, REQUIRES_TEST, HAS_COMPLETED_TEST, REFERS_TO, HAS_PROTOCOL, HAS_FOLLOWUP, CAUSES_SIDE_EFFECT)
"""

    try:
        result = conn.gsql(schema_gsql)
        print(result)
        print("[Step 1] Schema created!")
    except Exception as e:
        print(f"[Step 1] Error: {e}")
        print("         If the graph already exists, that's fine — continuing...")

    # =============================
    # STEP 2: INSTALL QUERIES
    # =============================
    print("\n[Step 2] Installing GSQL queries...")

    # Reconnect with graph name
    conn = tg.TigerGraphConnection(
        host=TG_HOST,
        graphname=TG_GRAPHNAME,
        username=TG_USERNAME,
        password=TG_PASSWORD,
    )
    if TG_SECRET:
        conn.getToken(TG_SECRET)

    queries_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gsql")

    query_files = [
        "q1_diagnose.gsql",
        "q2_drug_interactions.gsql",
        "q3_treatment_path.gsql",
        "q4_rare_diseases.gsql",
        "q5_comorbidity_risk.gsql",
        "q6_pagerank.gsql",
        "q7_patient_context.gsql",
        "q8_due_followups.gsql",
    ]

    for qf in query_files:
        filepath = os.path.join(queries_dir, qf)
        print(f"\n  Installing {qf}...")
        try:
            with open(filepath, "r") as f:
                query_text = f.read()
            # Wrap in USE GRAPH
            gsql_cmd = f"USE GRAPH {TG_GRAPHNAME}\n{query_text}"
            result = conn.gsql(gsql_cmd)
            print(f"    {result}")
        except Exception as e:
            print(f"    Error: {e}")

    # =============================
    # STEP 3: INSTALL ALL QUERIES
    # =============================
    print("\n[Step 3] Running INSTALL QUERY ALL...")
    try:
        result = conn.gsql(f"USE GRAPH {TG_GRAPHNAME}\nINSTALL QUERY ALL")
        print(result)
    except Exception as e:
        print(f"  Error: {e}")

    print("\n" + "=" * 50)
    print("[Setup] DONE! Schema + 8 queries installed.")
    print("Next: run 'python scripts/seed_data.py' to populate data.")
    print("=" * 50)


if __name__ == "__main__":
    main()
