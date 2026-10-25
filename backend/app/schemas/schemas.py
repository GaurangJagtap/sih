from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    full_name: str
    email: str
    role: str
    region: Optional[str] = None
    institution_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    region: Optional[str] = None
    institution_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    region: Optional[str] = None
    institution_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class InstitutionResponse(BaseModel):
    id: str
    aicte_permanent_id: str
    name: str
    region: str
    state: str
    city: str
    contact_person: str
    contact_email: str
    contact_phone: str
    institution_type: str

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    workflow_route_code: str = "ROUTE_A"
    application_type: str = "Extension of Approval (EoA)"
    academic_year: str = "2026-2027"
    course_name: Optional[str] = "B.Tech Computer Science & Engineering"
    intake_capacity: Optional[int] = 120
    faculty_count: Optional[int] = 24
    campus_area_acres: Optional[float] = 10.5

class ApplicationTransitionRequest(BaseModel):
    action: str  # SUBMIT, PASS_SCRUTINY, RETURN_DEFICIENCY, RESUBMIT, COMPLETE_EVC, APPROVE, REJECT
    remarks: Optional[str] = None
    deficiency_category: Optional[str] = None
    deficiency_details: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    application_number: str
    institution_id: str
    workflow_route_id: str
    route_version: int
    application_type: str
    academic_year: str
    current_stage: str
    status: str
    region: str
    submitted_at: Optional[datetime] = None
    stage_deadline: Optional[datetime] = None
    is_overdue: bool
    form_data: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EVCRecordCreate(BaseModel):
    application_id: str
    scheduled_date: datetime
    committee_members: List[dict]
    deadline: Optional[datetime] = None

class EVCCompleteRequest(BaseModel):
    report_summary: str
    recommendation: str  # RECOMMENDED, DEFICIENT, REJECTED

class UndertakingCreate(BaseModel):
    application_id: str
    condition_title: str
    condition_description: str
    required_evidence_type: str
    due_date: datetime

class UndertakingVerifyRequest(BaseModel):
    action: str  # VERIFY, RETURN
    remarks: str

class DocumentCreate(BaseModel):
    document_type: str
    display_name: str
    expiry_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None

class VoiceCallInitiateRequest(BaseModel):
    institution_id: str
    application_id: Optional[str] = None
    undertaking_id: Optional[str] = None
    pending_item_description: str
    language: str = "English"

class VoiceCallSimulateResponseRequest(BaseModel):
    user_spoken_response: str
