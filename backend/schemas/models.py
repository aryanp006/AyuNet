from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str
    patient_name: str = ""
    phone_number: str = ""
    language: str = ""


class DrugCheckRequest(BaseModel):
    drugs: list[str]


class TreatmentPathRequest(BaseModel):
    disease: str


class RareDiseaseRequest(BaseModel):
    symptoms: list[str]


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class CallInitiateRequest(BaseModel):
    patient_id: str


class CallNumberRequest(BaseModel):
    phone_number: str
    patient_name: str = "Patient"
    language: str = "hi"
    context_notes: str = ""


class FollowUpCompleteRequest(BaseModel):
    followup_id: str
    pain_score: int | None = None
    took_medication: bool | None = None
    new_symptoms: list[str] | None = None


class RegisterPatientRequest(BaseModel):
    patient_name: str
    phone_number: str
    language: str = "hi"
    symptoms_text: str = ""
