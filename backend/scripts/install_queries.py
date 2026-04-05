"""Reinstall fixed GSQL queries — drops drafts first, then creates + installs."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TG_HOST, TG_GRAPHNAME, TG_SECRET, TG_USERNAME
import pyTigerGraph as tg

def main():
    print("[1/4] Connecting...")
    conn = tg.TigerGraphConnection(host=TG_HOST, graphname=TG_GRAPHNAME, username=TG_USERNAME, password="")
    token = conn.getToken(TG_SECRET)[0]
    gsql = tg.TigerGraphConnection(host=TG_HOST, graphname=TG_GRAPHNAME, username=TG_USERNAME, password="", jwtToken=token)

    # Drop all existing queries (drafts + installed)
    print("\n[2/4] Dropping existing queries...")
    drop_names = [
        "checkDrugInteractions", "findTreatmentPath",
        "predictComorbidityRisk", "rankDiseases", "getPatientContext",
        "diagnoseFromSymptoms", "detectRareDiseases", "getDueFollowups"
    ]
    for qname in drop_names:
        try:
            result = gsql.gsql(f"USE GRAPH {TG_GRAPHNAME}\nDROP QUERY {qname}")
            print(f"  Dropped {qname}: {result.strip()}")
        except Exception as e:
            print(f"  {qname}: {e}")

    print("\n[3/4] Creating queries...")
    queries_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gsql")
    query_files = [
        "q1_diagnose.gsql", "q2_drug_interactions.gsql", "q3_treatment_path.gsql",
        "q4_rare_diseases.gsql", "q5_comorbidity_risk.gsql", "q6_pagerank.gsql",
        "q7_patient_context.gsql", "q8_due_followups.gsql",
    ]

    for qf in query_files:
        filepath = os.path.join(queries_dir, qf)
        print(f"\n  >> {qf}")
        try:
            with open(filepath, "r") as f:
                query_text = f.read()
            result = gsql.gsql(f"USE GRAPH {TG_GRAPHNAME}\n{query_text}")
            print(f"     {result.strip()}")
        except Exception as e:
            print(f"     ERROR: {e}")

    print("\n[4/4] INSTALL QUERY ALL...")
    try:
        result = gsql.gsql(f"USE GRAPH {TG_GRAPHNAME}\nINSTALL QUERY ALL")
        print(result)
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\nDone!")

if __name__ == "__main__":
    main()
