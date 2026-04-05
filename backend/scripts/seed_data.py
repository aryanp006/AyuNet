"""
AyuNet Seed Data Script
Seeds TigerGraph with comprehensive medical data for hackathon demo.
Run: cd backend && python scripts/seed_data.py
"""
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TG_HOST, TG_GRAPHNAME, TG_SECRET, TG_USERNAME, TG_PASSWORD
import pyTigerGraph as tg


def main():
    print("[Seed] Connecting to TigerGraph...")
    conn = tg.TigerGraphConnection(
        host=TG_HOST,
        graphname=TG_GRAPHNAME,
        username=TG_USERNAME,
        password=TG_PASSWORD,
    )
    if TG_SECRET:
        conn.getToken(TG_SECRET)
    print("[Seed] Connected!")

    # =====================
    # SYMPTOMS (50+)
    # =====================
    print("[Seed] Upserting symptoms...")
    symptoms = {
        "fever": "general", "headache": "neurological", "body_pain": "musculoskeletal",
        "fatigue": "general", "nausea": "gastrointestinal", "vomiting": "gastrointestinal",
        "cough": "respiratory", "shortness_of_breath": "respiratory", "chest_pain": "cardiovascular",
        "abdominal_pain": "gastrointestinal", "diarrhea": "gastrointestinal", "rash": "dermatological",
        "joint_pain": "musculoskeletal", "muscle_pain": "musculoskeletal", "dizziness": "neurological",
        "weight_loss": "general", "night_sweats": "general", "loss_of_appetite": "general",
        "frequent_urination": "urological", "excessive_thirst": "endocrine", "blurred_vision": "ophthalmological",
        "numbness": "neurological", "tingling": "neurological", "swelling": "general",
        "sore_throat": "respiratory", "runny_nose": "respiratory", "sneezing": "respiratory",
        "back_pain": "musculoskeletal", "blood_in_urine": "urological", "blood_in_stool": "gastrointestinal",
        "jaundice": "hepatic", "dark_urine": "hepatic", "pale_skin": "hematological",
        "bruising": "hematological", "bleeding_gums": "hematological", "hair_loss": "dermatological",
        "skin_discoloration": "dermatological", "tremor": "neurological", "mood_changes": "psychiatric",
        "anxiety": "psychiatric", "insomnia": "psychiatric", "confusion": "neurological",
        "memory_loss": "neurological", "seizures": "neurological", "difficulty_swallowing": "gastrointestinal",
        "eye_pain": "ophthalmological", "light_sensitivity": "ophthalmological",
        "stiff_neck": "musculoskeletal", "rapid_heartbeat": "cardiovascular",
        "low_blood_pressure": "cardiovascular", "wheezing": "respiratory",
        "high_blood_pressure": "cardiovascular",
    }
    for name, cat in symptoms.items():
        conn.upsertVertex("Symptom", name, {"name": name, "category": cat})
    print(f"  -> {len(symptoms)} symptoms")

    # =====================
    # DISEASES (22)
    # =====================
    print("[Seed] Upserting diseases...")
    diseases = [
        ("dengue", "Dengue Fever", "A97", 0.05, "Mosquito-borne viral infection causing high fever, severe body aches, and potential bleeding complications"),
        ("diabetes_t2", "Type 2 Diabetes", "E11", 0.08, "Chronic metabolic disorder with insulin resistance leading to high blood sugar"),
        ("hypertension", "Hypertension", "I10", 0.12, "Persistently elevated blood pressure increasing risk of heart disease and stroke"),
        ("malaria", "Malaria", "B50", 0.03, "Parasitic infection transmitted by mosquitoes causing cyclic fevers"),
        ("tuberculosis", "Tuberculosis", "A15", 0.02, "Bacterial lung infection with persistent cough, night sweats, and weight loss"),
        ("common_cold", "Common Cold", "J00", 0.25, "Viral upper respiratory infection with runny nose and sore throat"),
        ("pneumonia", "Pneumonia", "J18", 0.015, "Lung infection causing cough, fever, and difficulty breathing"),
        ("asthma", "Asthma", "J45", 0.04, "Chronic airway inflammation causing wheezing and shortness of breath"),
        ("migraine", "Migraine", "G43", 0.06, "Severe recurring headaches often with nausea and light sensitivity"),
        ("typhoid", "Typhoid", "A01", 0.01, "Bacterial infection from contaminated food/water causing sustained fever"),
        ("anemia", "Anemia", "D50", 0.07, "Low red blood cell count causing fatigue and pale skin"),
        ("gastritis", "Gastritis", "K29", 0.05, "Stomach lining inflammation causing pain and nausea"),
        ("uti", "Urinary Tract Infection", "N39", 0.03, "Bacterial infection of the urinary system"),
        ("hepatitis_b", "Hepatitis B", "B16", 0.008, "Viral liver infection causing jaundice and liver damage"),
        ("chickenpox", "Chickenpox", "B01", 0.02, "Viral infection with itchy rash and fever"),
        ("cad", "Coronary Artery Disease", "I25", 0.03, "Narrowing of coronary arteries reducing blood flow to heart"),
        ("ckd", "Chronic Kidney Disease", "N18", 0.01, "Progressive loss of kidney function over time"),
        ("rheumatoid_arthritis", "Rheumatoid Arthritis", "M06", 0.005, "Autoimmune disorder attacking joint linings"),
        ("depression", "Depression", "F32", 0.04, "Persistent mood disorder affecting daily functioning"),
        # Rare diseases
        ("hlh", "Hemophagocytic Lymphohistiocytosis", "D76.1", 0.00001, "Rare severe systemic inflammatory syndrome where immune cells attack the body's own tissues"),
        ("wilsons", "Wilson's Disease", "E83.0", 0.00003, "Rare genetic disorder causing copper accumulation in liver and brain"),
        ("gbs", "Guillain-Barre Syndrome", "G61.0", 0.0001, "Rare autoimmune disorder where immune system attacks peripheral nerves"),
    ]
    for did, name, icd, prev, desc in diseases:
        conn.upsertVertex("Disease", did, {"name": name, "icd_code": icd, "prevalence": prev, "description": desc})
    print(f"  -> {len(diseases)} diseases")

    # =====================
    # DISEASE-SYMPTOM MAPPINGS (HAS_SYMPTOM)
    # =====================
    print("[Seed] Creating disease-symptom edges...")
    disease_symptoms = {
        "dengue": [("fever", 0.95), ("headache", 0.85), ("body_pain", 0.8), ("joint_pain", 0.75), ("fatigue", 0.7), ("rash", 0.6), ("nausea", 0.5), ("bleeding_gums", 0.3), ("muscle_pain", 0.65)],
        "diabetes_t2": [("frequent_urination", 0.8), ("excessive_thirst", 0.85), ("fatigue", 0.7), ("blurred_vision", 0.5), ("weight_loss", 0.4), ("numbness", 0.3), ("tingling", 0.35)],
        "hypertension": [("headache", 0.5), ("dizziness", 0.4), ("chest_pain", 0.3), ("blurred_vision", 0.25), ("shortness_of_breath", 0.35), ("rapid_heartbeat", 0.3), ("high_blood_pressure", 0.95)],
        "malaria": [("fever", 0.95), ("headache", 0.7), ("nausea", 0.6), ("vomiting", 0.5), ("body_pain", 0.65), ("fatigue", 0.7), ("diarrhea", 0.3)],
        "tuberculosis": [("cough", 0.9), ("night_sweats", 0.8), ("weight_loss", 0.75), ("fever", 0.7), ("fatigue", 0.65), ("chest_pain", 0.4), ("blood_in_stool", 0.15)],
        "common_cold": [("runny_nose", 0.9), ("sneezing", 0.85), ("sore_throat", 0.8), ("cough", 0.6), ("headache", 0.4), ("fever", 0.3), ("fatigue", 0.35)],
        "pneumonia": [("cough", 0.9), ("fever", 0.85), ("shortness_of_breath", 0.8), ("chest_pain", 0.7), ("fatigue", 0.6), ("nausea", 0.3)],
        "asthma": [("shortness_of_breath", 0.9), ("wheezing", 0.85), ("cough", 0.7), ("chest_pain", 0.4)],
        "migraine": [("headache", 0.95), ("nausea", 0.6), ("light_sensitivity", 0.7), ("blurred_vision", 0.4), ("dizziness", 0.35), ("vomiting", 0.3)],
        "typhoid": [("fever", 0.95), ("abdominal_pain", 0.7), ("headache", 0.6), ("loss_of_appetite", 0.65), ("diarrhea", 0.5), ("rash", 0.2)],
        "anemia": [("fatigue", 0.9), ("pale_skin", 0.8), ("dizziness", 0.6), ("shortness_of_breath", 0.5), ("rapid_heartbeat", 0.4), ("headache", 0.35)],
        "gastritis": [("abdominal_pain", 0.9), ("nausea", 0.75), ("vomiting", 0.5), ("loss_of_appetite", 0.6), ("blood_in_stool", 0.2)],
        "uti": [("frequent_urination", 0.9), ("abdominal_pain", 0.5), ("blood_in_urine", 0.4), ("fever", 0.3), ("back_pain", 0.35)],
        "hepatitis_b": [("jaundice", 0.8), ("fatigue", 0.7), ("abdominal_pain", 0.6), ("nausea", 0.55), ("dark_urine", 0.7), ("loss_of_appetite", 0.5), ("joint_pain", 0.3)],
        "chickenpox": [("rash", 0.95), ("fever", 0.7), ("fatigue", 0.5), ("headache", 0.4), ("loss_of_appetite", 0.35)],
        "cad": [("chest_pain", 0.85), ("shortness_of_breath", 0.7), ("fatigue", 0.5), ("dizziness", 0.4), ("rapid_heartbeat", 0.45), ("nausea", 0.2)],
        "ckd": [("fatigue", 0.8), ("swelling", 0.7), ("frequent_urination", 0.6), ("nausea", 0.5), ("loss_of_appetite", 0.55), ("back_pain", 0.3), ("blood_in_urine", 0.25)],
        "rheumatoid_arthritis": [("joint_pain", 0.95), ("swelling", 0.8), ("fatigue", 0.6), ("stiff_neck", 0.4), ("muscle_pain", 0.5), ("fever", 0.2)],
        "depression": [("fatigue", 0.8), ("insomnia", 0.75), ("loss_of_appetite", 0.6), ("mood_changes", 0.9), ("anxiety", 0.7), ("weight_loss", 0.4), ("memory_loss", 0.3), ("confusion", 0.2)],
        # Rare diseases
        "hlh": [("fever", 0.9), ("fatigue", 0.8), ("swelling", 0.6), ("rash", 0.4), ("jaundice", 0.5), ("bleeding_gums", 0.3), ("seizures", 0.2)],
        "wilsons": [("fatigue", 0.7), ("jaundice", 0.8), ("tremor", 0.75), ("dark_urine", 0.6), ("mood_changes", 0.5), ("difficulty_swallowing", 0.3), ("confusion", 0.4)],
        "gbs": [("numbness", 0.85), ("tingling", 0.8), ("muscle_pain", 0.7), ("fatigue", 0.6), ("difficulty_swallowing", 0.4), ("back_pain", 0.5)],
    }
    edge_count = 0
    for did, syms in disease_symptoms.items():
        for sname, weight in syms:
            conn.upsertEdge("Disease", did, "HAS_SYMPTOM", "Symptom", sname, {"weight": weight})
            edge_count += 1
    print(f"  -> {edge_count} disease-symptom edges")

    # =====================
    # DRUGS (28)
    # =====================
    print("[Seed] Upserting drugs...")
    drugs = [
        ("metformin", "Metformin", "Biguanide", "nausea, diarrhea, lactic acidosis (rare)"),
        ("warfarin", "Warfarin", "Anticoagulant", "bruising, bleeding, nausea"),
        ("paracetamol", "Paracetamol", "Analgesic", "liver damage (overdose), rash (rare)"),
        ("aspirin", "Aspirin", "NSAID", "stomach bleeding, bruising, tinnitus"),
        ("ibuprofen", "Ibuprofen", "NSAID", "stomach pain, nausea, dizziness"),
        ("amoxicillin", "Amoxicillin", "Antibiotic", "diarrhea, rash, nausea"),
        ("azithromycin", "Azithromycin", "Antibiotic", "nausea, diarrhea, abdominal pain"),
        ("omeprazole", "Omeprazole", "PPI", "headache, nausea, diarrhea"),
        ("amlodipine", "Amlodipine", "CCB", "swelling, dizziness, fatigue"),
        ("atenolol", "Atenolol", "Beta-blocker", "fatigue, dizziness, low blood pressure"),
        ("lisinopril", "Lisinopril", "ACE Inhibitor", "cough, dizziness, high potassium"),
        ("metoprolol", "Metoprolol", "Beta-blocker", "fatigue, dizziness, slow heartbeat"),
        ("simvastatin", "Simvastatin", "Statin", "muscle pain, nausea, headache"),
        ("insulin", "Insulin", "Hormone", "low blood sugar, weight gain, injection site reaction"),
        ("prednisolone", "Prednisolone", "Corticosteroid", "weight gain, mood changes, high blood sugar"),
        ("chloroquine", "Chloroquine", "Antimalarial", "nausea, headache, blurred vision"),
        ("rifampicin", "Rifampicin", "Anti-TB", "orange urine, nausea, liver toxicity"),
        ("isoniazid", "Isoniazid", "Anti-TB", "numbness, liver toxicity, nausea"),
        ("fluoxetine", "Fluoxetine", "SSRI", "nausea, insomnia, anxiety, headache"),
        ("sertraline", "Sertraline", "SSRI", "nausea, diarrhea, insomnia"),
        ("phenytoin", "Phenytoin", "Anticonvulsant", "dizziness, nausea, rash"),
        ("diclofenac", "Diclofenac", "NSAID", "stomach pain, nausea, headache"),
        ("pantoprazole", "Pantoprazole", "PPI", "headache, diarrhea, nausea"),
        ("losartan", "Losartan", "ARB", "dizziness, fatigue, back pain"),
        ("clopidogrel", "Clopidogrel", "Antiplatelet", "bruising, bleeding, rash"),
        ("salbutamol", "Salbutamol", "Bronchodilator", "tremor, rapid heartbeat, headache"),
        ("montelukast", "Montelukast", "Leukotriene inhibitor", "headache, abdominal pain, fatigue"),
        ("doxycycline", "Doxycycline", "Antibiotic", "nausea, light sensitivity, diarrhea"),
    ]
    for did, name, cls, se in drugs:
        conn.upsertVertex("Drug", did, {"name": name, "drug_class": cls, "common_side_effects": se})
    print(f"  -> {len(drugs)} drugs")

    # =====================
    # DRUG INTERACTIONS (INTERACTS_WITH)
    # =====================
    print("[Seed] Creating drug interactions...")
    interactions = [
        ("warfarin", "aspirin", "severe", "Increased bleeding risk — combined anticoagulant+antiplatelet", "Significantly increases hemorrhage risk. Monitor INR closely."),
        ("warfarin", "ibuprofen", "severe", "NSAID displaces warfarin from protein binding", "Can cause GI bleeding. Use paracetamol instead."),
        ("warfarin", "rifampicin", "severe", "Rifampicin induces warfarin metabolism via CYP enzymes", "INR drops dramatically. Need 2-3x warfarin dose increase."),
        ("fluoxetine", "sertraline", "severe", "Serotonin syndrome risk — dual SSRI", "Never combine two SSRIs. Life-threatening serotonin toxicity."),
        ("metformin", "prednisolone", "moderate", "Corticosteroids increase blood glucose", "May reduce metformin efficacy. Monitor blood sugar closely."),
        ("simvastatin", "amlodipine", "moderate", "Amlodipine increases statin blood levels", "Limit simvastatin to 20mg daily. Risk of myopathy."),
        ("clopidogrel", "omeprazole", "moderate", "Omeprazole reduces clopidogrel activation via CYP2C19", "Use pantoprazole instead for GI protection."),
        ("phenytoin", "isoniazid", "moderate", "Isoniazid inhibits phenytoin metabolism", "Monitor phenytoin levels. Risk of toxicity."),
        ("aspirin", "clopidogrel", "moderate", "Dual antiplatelet increases bleeding risk", "Used intentionally post-stent but needs close monitoring."),
        ("metformin", "lisinopril", "mild", "Possible additive hypoglycemia", "Monitor blood glucose. Usually well tolerated."),
        ("amlodipine", "atenolol", "mild", "Additive blood pressure lowering", "Monitor for hypotension and bradycardia."),
        ("ibuprofen", "lisinopril", "moderate", "NSAIDs reduce ACE inhibitor efficacy", "Can cause kidney damage with prolonged use."),
    ]
    for d1, d2, sev, mech, note in interactions:
        conn.upsertEdge("Drug", d1, "INTERACTS_WITH", "Drug", d2, {"severity": sev, "mechanism": mech, "clinical_note": note})
    print(f"  -> {len(interactions)} drug interactions")

    # =====================
    # DRUG SIDE EFFECTS (CAUSES_SIDE_EFFECT)
    # =====================
    print("[Seed] Creating drug side effects...")
    side_effects = [
        ("metformin", "nausea", "common"), ("metformin", "diarrhea", "common"), ("metformin", "muscle_pain", "rare"),
        ("warfarin", "bruising", "common"), ("warfarin", "bleeding_gums", "uncommon"),
        ("aspirin", "abdominal_pain", "common"), ("aspirin", "bruising", "common"),
        ("ibuprofen", "abdominal_pain", "common"), ("ibuprofen", "nausea", "common"), ("ibuprofen", "dizziness", "uncommon"),
        ("amlodipine", "swelling", "common"), ("amlodipine", "dizziness", "common"), ("amlodipine", "fatigue", "uncommon"),
        ("simvastatin", "muscle_pain", "common"), ("simvastatin", "nausea", "uncommon"),
        ("prednisolone", "mood_changes", "common"), ("prednisolone", "weight_loss", "uncommon"),
        ("fluoxetine", "nausea", "common"), ("fluoxetine", "insomnia", "common"), ("fluoxetine", "anxiety", "uncommon"),
        ("rifampicin", "nausea", "common"), ("rifampicin", "jaundice", "uncommon"),
        ("isoniazid", "numbness", "uncommon"), ("isoniazid", "nausea", "common"),
        ("phenytoin", "dizziness", "common"), ("phenytoin", "rash", "uncommon"),
        ("salbutamol", "tremor", "common"), ("salbutamol", "rapid_heartbeat", "common"),
    ]
    for drug, symptom, freq in side_effects:
        conn.upsertEdge("Drug", drug, "CAUSES_SIDE_EFFECT", "Symptom", symptom, {"frequency": freq})
    print(f"  -> {len(side_effects)} side effect edges")

    # =====================
    # SPECIALISTS (12)
    # =====================
    print("[Seed] Upserting specialists...")
    specialists = [
        ("cardiologist", "Dr. Patel (Cardiologist)", "Cardiology"),
        ("endocrinologist", "Dr. Sharma (Endocrinologist)", "Endocrinology"),
        ("pulmonologist", "Dr. Gupta (Pulmonologist)", "Pulmonology"),
        ("neurologist", "Dr. Reddy (Neurologist)", "Neurology"),
        ("hematologist", "Dr. Iyer (Hematologist)", "Hematology"),
        ("gastroenterologist", "Dr. Das (Gastroenterologist)", "Gastroenterology"),
        ("rheumatologist", "Dr. Nair (Rheumatologist)", "Rheumatology"),
        ("nephrologist", "Dr. Joshi (Nephrologist)", "Nephrology"),
        ("psychiatrist", "Dr. Kapoor (Psychiatrist)", "Psychiatry"),
        ("dermatologist", "Dr. Mehta (Dermatologist)", "Dermatology"),
        ("general_physician", "Dr. Kumar (General Physician)", "General Medicine"),
        ("infectious_disease", "Dr. Singh (Infectious Disease)", "Infectious Disease"),
    ]
    for sid, name, spec in specialists:
        conn.upsertVertex("Specialist", sid, {"name": name, "specialization": spec})
    print(f"  -> {len(specialists)} specialists")

    # =====================
    # TREATMENTS (12)
    # =====================
    print("[Seed] Upserting treatments...")
    treatments = [
        ("iv_fluids", "IV Fluid Therapy", "supportive", "low"),
        ("insulin_therapy", "Insulin Therapy", "medication", "medium"),
        ("antihypertensive", "Antihypertensive Therapy", "medication", "low"),
        ("antibiotic_course", "Antibiotic Course", "medication", "low"),
        ("chemotherapy", "Chemotherapy", "medication", "high"),
        ("physical_therapy", "Physical Therapy", "rehabilitation", "medium"),
        ("cbt", "Cognitive Behavioral Therapy", "therapy", "medium"),
        ("dialysis", "Dialysis", "procedure", "high"),
        ("joint_replacement", "Joint Replacement", "surgery", "high"),
        ("platelet_transfusion", "Platelet Transfusion", "procedure", "medium"),
        ("bronchodilator_therapy", "Bronchodilator Therapy", "medication", "low"),
        ("dots", "Anti-TB DOTS Regimen", "medication", "low"),
    ]
    for tid, name, ttype, cost in treatments:
        conn.upsertVertex("Treatment", tid, {"name": name, "treatment_type": ttype, "cost_tier": cost})
    print(f"  -> {len(treatments)} treatments")

    # =====================
    # RISK FACTORS (10)
    # =====================
    print("[Seed] Upserting risk factors...")
    risk_factors = [
        ("immunosuppression", "Immunosuppression", "medical"),
        ("obesity", "Obesity", "lifestyle"),
        ("smoking", "Smoking", "lifestyle"),
        ("sedentary", "Sedentary Lifestyle", "lifestyle"),
        ("family_diabetes", "Family History of Diabetes", "genetic"),
        ("high_cholesterol", "High Cholesterol", "metabolic"),
        ("chronic_inflammation", "Chronic Inflammation", "medical"),
        ("alcohol_use", "Alcohol Use", "lifestyle"),
        ("age_over_60", "Age Over 60", "demographic"),
        ("malnutrition", "Malnutrition", "nutritional"),
    ]
    for rid, name, cat in risk_factors:
        conn.upsertVertex("RiskFactor", rid, {"name": name, "category": cat})
    print(f"  -> {len(risk_factors)} risk factors")

    # =====================
    # LAB TESTS (14)
    # =====================
    print("[Seed] Upserting lab tests...")
    lab_tests = [
        ("cbc", "Complete Blood Count", "blood"),
        ("fasting_glucose", "Blood Glucose (Fasting)", "blood"),
        ("hba1c", "HbA1c", "blood"),
        ("lft", "Liver Function Test", "blood"),
        ("kft", "Kidney Function Test", "blood"),
        ("inr_pt", "INR/PT", "blood"),
        ("lipid_panel", "Lipid Panel", "blood"),
        ("chest_xray", "Chest X-ray", "imaging"),
        ("dengue_ns1", "Dengue NS1 Antigen", "blood"),
        ("malaria_smear", "Malaria Smear", "blood"),
        ("blood_culture", "Blood Culture", "blood"),
        ("urine_analysis", "Urine Analysis", "urine"),
        ("ecg", "ECG", "cardiac"),
        ("thyroid_panel", "Thyroid Panel", "blood"),
    ]
    for lid, name, ttype in lab_tests:
        conn.upsertVertex("LabTest", lid, {"name": name, "test_type": ttype})
    print(f"  -> {len(lab_tests)} lab tests")

    # =====================
    # PROTOCOLS (3)
    # =====================
    print("[Seed] Upserting protocols...")
    protocols = [
        ("post_surgery", "Post-Surgery Protocol", "1,3,7,14", "How is your pain level? Is the wound healing well? Are you taking your medications regularly?"),
        ("chronic_disease", "Chronic Disease Protocol", "7,14,30,90", "How are your symptoms? Are you taking medications on time? Any new symptoms or concerns?"),
        ("acute_infection", "Acute Infection Protocol", "1,3,7", "Is your fever coming down? Have you completed your medication course? Any new symptoms?"),
    ]
    for pid, name, days, questions in protocols:
        conn.upsertVertex("Protocol", pid, {"name": name, "followup_days": days, "questions_template": questions})
    print(f"  -> {len(protocols)} protocols")

    # =====================
    # DISEASE -> TREATMENT (TREATED_BY)
    # =====================
    print("[Seed] Creating disease-treatment edges...")
    disease_treatments = [
        ("dengue", "iv_fluids", 0.85, 0.9),
        ("dengue", "platelet_transfusion", 0.7, 0.6),
        ("diabetes_t2", "insulin_therapy", 0.8, 0.7),
        ("hypertension", "antihypertensive", 0.85, 0.9),
        ("malaria", "antibiotic_course", 0.9, 0.85),
        ("tuberculosis", "dots", 0.85, 0.8),
        ("pneumonia", "antibiotic_course", 0.8, 0.85),
        ("asthma", "bronchodilator_therapy", 0.8, 0.9),
        ("cad", "antihypertensive", 0.7, 0.8),
        ("ckd", "dialysis", 0.6, 0.4),
        ("rheumatoid_arthritis", "physical_therapy", 0.65, 0.7),
        ("rheumatoid_arthritis", "joint_replacement", 0.75, 0.3),
        ("depression", "cbt", 0.7, 0.8),
        ("gastritis", "antibiotic_course", 0.75, 0.9),
    ]
    for did, tid, sr, acc in disease_treatments:
        conn.upsertEdge("Disease", did, "TREATED_BY", "Treatment", tid, {"success_rate": sr, "accessibility_score": acc})
    print(f"  -> {len(disease_treatments)} disease-treatment edges")

    # =====================
    # TREATMENT -> DRUG (PRESCRIBED)
    # =====================
    print("[Seed] Creating treatment-drug edges...")
    treatment_drugs = [
        ("iv_fluids", "paracetamol", "500mg every 6hrs", "5-7 days"),
        ("insulin_therapy", "insulin", "10 units daily", "ongoing"),
        ("insulin_therapy", "metformin", "500mg twice daily", "ongoing"),
        ("antihypertensive", "amlodipine", "5mg daily", "ongoing"),
        ("antihypertensive", "losartan", "50mg daily", "ongoing"),
        ("antihypertensive", "atenolol", "50mg daily", "ongoing"),
        ("antibiotic_course", "amoxicillin", "500mg 3x daily", "7 days"),
        ("antibiotic_course", "azithromycin", "500mg daily", "5 days"),
        ("antibiotic_course", "doxycycline", "100mg 2x daily", "7 days"),
        ("dots", "rifampicin", "600mg daily", "6 months"),
        ("dots", "isoniazid", "300mg daily", "6 months"),
        ("bronchodilator_therapy", "salbutamol", "2 puffs as needed", "ongoing"),
        ("bronchodilator_therapy", "montelukast", "10mg daily", "ongoing"),
        ("cbt", "fluoxetine", "20mg daily", "6-12 months"),
        ("cbt", "sertraline", "50mg daily", "6-12 months"),
    ]
    for tid, did, dose, dur in treatment_drugs:
        conn.upsertEdge("Treatment", tid, "PRESCRIBED", "Drug", did, {"dosage": dose, "duration": dur})
    print(f"  -> {len(treatment_drugs)} treatment-drug edges")

    # =====================
    # DISEASE -> SPECIALIST (REFERS_TO)
    # =====================
    print("[Seed] Creating disease-specialist edges...")
    disease_specialists = [
        ("dengue", "infectious_disease"), ("dengue", "hematologist"),
        ("diabetes_t2", "endocrinologist"), ("hypertension", "cardiologist"),
        ("malaria", "infectious_disease"), ("tuberculosis", "pulmonologist"),
        ("pneumonia", "pulmonologist"), ("asthma", "pulmonologist"),
        ("migraine", "neurologist"), ("typhoid", "infectious_disease"),
        ("anemia", "hematologist"), ("gastritis", "gastroenterologist"),
        ("uti", "nephrologist"), ("hepatitis_b", "gastroenterologist"),
        ("cad", "cardiologist"), ("ckd", "nephrologist"),
        ("rheumatoid_arthritis", "rheumatologist"), ("depression", "psychiatrist"),
        ("hlh", "hematologist"), ("wilsons", "neurologist"), ("gbs", "neurologist"),
    ]
    for did, sid in disease_specialists:
        conn.upsertEdge("Disease", did, "REFERS_TO", "Specialist", sid)
    print(f"  -> {len(disease_specialists)} disease-specialist edges")

    # =====================
    # DISEASE -> RISK FACTOR (RISK_INCREASES)
    # =====================
    print("[Seed] Creating disease-risk factor edges...")
    disease_risks = [
        ("diabetes_t2", "immunosuppression"), ("diabetes_t2", "obesity"),
        ("diabetes_t2", "sedentary"), ("diabetes_t2", "family_diabetes"),
        ("hypertension", "obesity"), ("hypertension", "smoking"),
        ("hypertension", "high_cholesterol"), ("hypertension", "sedentary"),
        ("cad", "high_cholesterol"), ("cad", "smoking"),
        ("cad", "obesity"), ("cad", "age_over_60"),
        ("ckd", "high_cholesterol"), ("ckd", "age_over_60"),
        ("depression", "chronic_inflammation"), ("depression", "alcohol_use"),
        ("tuberculosis", "immunosuppression"), ("tuberculosis", "malnutrition"),
        ("anemia", "malnutrition"),
    ]
    for did, rid in disease_risks:
        conn.upsertEdge("Disease", did, "RISK_INCREASES", "RiskFactor", rid)
    print(f"  -> {len(disease_risks)} disease-risk edges")

    # =====================
    # RISK FACTOR -> DISEASE (ELEVATES)
    # =====================
    print("[Seed] Creating risk-disease elevation edges...")
    risk_elevations = [
        ("immunosuppression", "tuberculosis", 2.5), ("immunosuppression", "pneumonia", 2.0),
        ("obesity", "diabetes_t2", 2.2), ("obesity", "hypertension", 1.8), ("obesity", "cad", 1.5),
        ("smoking", "cad", 2.5), ("smoking", "pneumonia", 1.8), ("smoking", "asthma", 2.0),
        ("sedentary", "diabetes_t2", 1.6), ("sedentary", "cad", 1.4),
        ("family_diabetes", "diabetes_t2", 2.8),
        ("high_cholesterol", "cad", 2.3), ("high_cholesterol", "hypertension", 1.5),
        ("chronic_inflammation", "rheumatoid_arthritis", 1.8), ("chronic_inflammation", "cad", 1.3),
        ("alcohol_use", "hepatitis_b", 1.7), ("alcohol_use", "gastritis", 1.9),
        ("age_over_60", "cad", 1.6), ("age_over_60", "ckd", 1.8), ("age_over_60", "depression", 1.3),
        ("malnutrition", "anemia", 2.5), ("malnutrition", "tuberculosis", 2.0),
    ]
    for rid, did, mult in risk_elevations:
        conn.upsertEdge("RiskFactor", rid, "ELEVATES", "Disease", did, {"multiplier": mult})
    print(f"  -> {len(risk_elevations)} risk elevation edges")

    # =====================
    # DISEASE -> LAB TEST (REQUIRES_TEST)
    # =====================
    print("[Seed] Creating disease-test edges...")
    disease_tests = [
        ("dengue", "dengue_ns1"), ("dengue", "cbc"),
        ("diabetes_t2", "fasting_glucose"), ("diabetes_t2", "hba1c"),
        ("hypertension", "ecg"), ("hypertension", "lipid_panel"),
        ("malaria", "malaria_smear"), ("malaria", "cbc"),
        ("tuberculosis", "chest_xray"), ("tuberculosis", "blood_culture"),
        ("anemia", "cbc"), ("hepatitis_b", "lft"),
        ("cad", "ecg"), ("cad", "lipid_panel"),
        ("ckd", "kft"), ("ckd", "urine_analysis"),
        ("hlh", "cbc"), ("hlh", "lft"),
        ("wilsons", "lft"), ("wilsons", "urine_analysis"),
    ]
    for did, lid in disease_tests:
        conn.upsertEdge("Disease", did, "REQUIRES_TEST", "LabTest", lid)
    print(f"  -> {len(disease_tests)} disease-test edges")

    # =====================
    # DISEASE -> PROTOCOL (HAS_PROTOCOL)
    # =====================
    print("[Seed] Creating disease-protocol edges...")
    disease_protocols = [
        ("dengue", "acute_infection"), ("malaria", "acute_infection"),
        ("typhoid", "acute_infection"), ("pneumonia", "acute_infection"),
        ("diabetes_t2", "chronic_disease"), ("hypertension", "chronic_disease"),
        ("cad", "chronic_disease"), ("ckd", "chronic_disease"),
        ("rheumatoid_arthritis", "chronic_disease"), ("depression", "chronic_disease"),
    ]
    for did, pid in disease_protocols:
        conn.upsertEdge("Disease", did, "HAS_PROTOCOL", "Protocol", pid)
    print(f"  -> {len(disease_protocols)} disease-protocol edges")

    # =====================
    # DEMO PATIENTS (5)
    # =====================
    print("[Seed] Creating demo patients...")
    today = date.today().isoformat()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    three_days_ago = (date.today() - timedelta(days=3)).isoformat()

    # Patient 1: Priya (Hindi) - Dengue + Diabetes
    conn.upsertVertex("Patient", "priya", {"name": "Priya Devi", "phone": "+919876543210", "language": "hi", "age": 45, "gender": "female"})
    conn.upsertEdge("Patient", "priya", "HAS_CONDITION", "Disease", "dengue", {"diagnosed_date": three_days_ago, "status": "active"})
    conn.upsertEdge("Patient", "priya", "HAS_CONDITION", "Disease", "diabetes_t2", {"diagnosed_date": "2023-01-15", "status": "active"})
    conn.upsertEdge("Patient", "priya", "TAKES_MEDICATION", "Drug", "metformin", {"dosage": "500mg twice daily", "start_date": "2023-01-15"})
    conn.upsertEdge("Patient", "priya", "TAKES_MEDICATION", "Drug", "warfarin", {"dosage": "5mg daily", "start_date": "2024-06-01"})
    conn.upsertEdge("Patient", "priya", "TAKES_MEDICATION", "Drug", "paracetamol", {"dosage": "500mg every 6hrs", "start_date": three_days_ago})
    conn.upsertEdge("Patient", "priya", "PRESENTS_WITH", "Symptom", "fever", {"duration_days": 3, "severity": "moderate", "reported_date": three_days_ago})
    conn.upsertEdge("Patient", "priya", "PRESENTS_WITH", "Symptom", "headache", {"duration_days": 3, "severity": "moderate", "reported_date": three_days_ago})
    conn.upsertEdge("Patient", "priya", "PRESENTS_WITH", "Symptom", "body_pain", {"duration_days": 2, "severity": "moderate", "reported_date": three_days_ago})
    conn.upsertEdge("Patient", "priya", "HAS_COMPLETED_TEST", "LabTest", "fasting_glucose", {"test_date": "2024-12-01", "result": "145 mg/dL"})
    conn.upsertEdge("Patient", "priya", "HAS_COMPLETED_TEST", "LabTest", "cbc", {"test_date": three_days_ago, "result": "Platelets low: 95000"})

    # Patient 2: Karthik (Tamil) - Post-surgery, day 7 follow-up
    conn.upsertVertex("Patient", "karthik", {"name": "Karthik Sundaram", "phone": "+919876543211", "language": "ta", "age": 35, "gender": "male"})
    conn.upsertEdge("Patient", "karthik", "HAS_CONDITION", "Disease", "gastritis", {"diagnosed_date": week_ago, "status": "active"})
    conn.upsertEdge("Patient", "karthik", "TAKES_MEDICATION", "Drug", "amoxicillin", {"dosage": "500mg 3x daily", "start_date": week_ago})
    conn.upsertEdge("Patient", "karthik", "TAKES_MEDICATION", "Drug", "ibuprofen", {"dosage": "400mg as needed", "start_date": week_ago})
    # Follow-up for today
    conn.upsertVertex("FollowUp", "fu_karthik_today", {"status": "pending", "scheduled_date": today, "pain_score": 0, "took_medication": False, "new_symptoms": "", "call_transcript": "", "risk_flag": False})
    conn.upsertEdge("Patient", "karthik", "HAS_FOLLOWUP", "FollowUp", "fu_karthik_today", {"linked_disease": "gastritis"})

    # Patient 3: Ananya (Telugu) - Unusual symptoms, rare disease candidate
    conn.upsertVertex("Patient", "ananya", {"name": "Ananya Reddy", "phone": "+919876543212", "language": "te", "age": 28, "gender": "female"})
    conn.upsertEdge("Patient", "ananya", "PRESENTS_WITH", "Symptom", "fatigue", {"duration_days": 30, "severity": "moderate", "reported_date": today})
    conn.upsertEdge("Patient", "ananya", "PRESENTS_WITH", "Symptom", "jaundice", {"duration_days": 14, "severity": "mild", "reported_date": today})
    conn.upsertEdge("Patient", "ananya", "PRESENTS_WITH", "Symptom", "tremor", {"duration_days": 21, "severity": "moderate", "reported_date": today})
    conn.upsertEdge("Patient", "ananya", "PRESENTS_WITH", "Symptom", "dark_urine", {"duration_days": 14, "severity": "mild", "reported_date": today})

    # Patient 4: Rahul (English) - Multiple chronic conditions
    conn.upsertVertex("Patient", "rahul", {"name": "Rahul Verma", "phone": "+919876543213", "language": "en", "age": 55, "gender": "male"})
    conn.upsertEdge("Patient", "rahul", "HAS_CONDITION", "Disease", "hypertension", {"diagnosed_date": "2020-03-10", "status": "active"})
    conn.upsertEdge("Patient", "rahul", "HAS_CONDITION", "Disease", "diabetes_t2", {"diagnosed_date": "2019-08-22", "status": "active"})
    conn.upsertEdge("Patient", "rahul", "HAS_CONDITION", "Disease", "cad", {"diagnosed_date": "2022-11-05", "status": "active"})
    conn.upsertEdge("Patient", "rahul", "TAKES_MEDICATION", "Drug", "metformin", {"dosage": "1000mg twice daily", "start_date": "2019-08-22"})
    conn.upsertEdge("Patient", "rahul", "TAKES_MEDICATION", "Drug", "amlodipine", {"dosage": "5mg daily", "start_date": "2020-03-10"})
    conn.upsertEdge("Patient", "rahul", "TAKES_MEDICATION", "Drug", "simvastatin", {"dosage": "40mg nightly", "start_date": "2020-03-10"})
    conn.upsertEdge("Patient", "rahul", "TAKES_MEDICATION", "Drug", "aspirin", {"dosage": "75mg daily", "start_date": "2022-11-05"})
    conn.upsertEdge("Patient", "rahul", "HAS_COMPLETED_TEST", "LabTest", "ecg", {"test_date": "2024-06-15", "result": "Mild ST depression"})
    conn.upsertEdge("Patient", "rahul", "HAS_COMPLETED_TEST", "LabTest", "hba1c", {"test_date": "2024-09-01", "result": "7.2%"})

    # Patient 5: Meera (Bengali) - New patient
    conn.upsertVertex("Patient", "meera", {"name": "Meera Banerjee", "phone": "+919876543214", "language": "bn", "age": 32, "gender": "female"})
    conn.upsertEdge("Patient", "meera", "PRESENTS_WITH", "Symptom", "cough", {"duration_days": 21, "severity": "severe", "reported_date": today})
    conn.upsertEdge("Patient", "meera", "PRESENTS_WITH", "Symptom", "fever", {"duration_days": 14, "severity": "moderate", "reported_date": today})
    conn.upsertEdge("Patient", "meera", "PRESENTS_WITH", "Symptom", "night_sweats", {"duration_days": 14, "severity": "moderate", "reported_date": today})
    conn.upsertEdge("Patient", "meera", "PRESENTS_WITH", "Symptom", "weight_loss", {"duration_days": 30, "severity": "moderate", "reported_date": today})

    print("  -> 5 demo patients with full histories")

    # =====================
    # SUMMARY
    # =====================
    print("\n" + "=" * 50)
    print("[Seed] COMPLETE! Summary:")
    print(f"  Symptoms:      {len(symptoms)}")
    print(f"  Diseases:      {len(diseases)}")
    print(f"  Drugs:         {len(drugs)}")
    print(f"  Specialists:   {len(specialists)}")
    print(f"  Treatments:    {len(treatments)}")
    print(f"  Risk Factors:  {len(risk_factors)}")
    print(f"  Lab Tests:     {len(lab_tests)}")
    print(f"  Protocols:     {len(protocols)}")
    print(f"  Patients:      5")
    print(f"  Follow-ups:    1 (pending for today)")
    print(f"  Total edges:   {edge_count + len(interactions) + len(side_effects) + len(disease_treatments) + len(treatment_drugs) + len(disease_specialists) + len(disease_risks) + len(risk_elevations) + len(disease_tests) + len(disease_protocols) + 30}+")
    print("=" * 50)


if __name__ == "__main__":
    main()
