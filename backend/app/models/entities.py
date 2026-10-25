import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str):
    INSTITUTION = "INSTITUTION"
    REGIONAL_OFFICER = "REGIONAL_OFFICER"
    BUREAU_OFFICER = "BUREAU_OFFICER"
    EVC_COMMITTEE = "EVC_COMMITTEE"
    SENIOR_AUTHORITY = "SENIOR_AUTHORITY"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default=UserRole.INSTITUTION)
    region = Column(String, nullable=True)  # E.g., 'Northern', 'Western', 'Southern', 'Central'
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String, primary_key=True, default=generate_uuid)
    aicte_permanent_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    contact_person = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)
    institution_type = Column(String, default="Engineering & Technology") # E.g., Engineering, Management, Pharmacy
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    applications = relationship("Application", back_populates="institution")
    undertakings = relationship("Undertaking", back_populates="institution")
    documents = relationship("Document", back_populates="institution")
    call_logs = relationship("CallLog", back_populates="institution")

class WorkflowRoute(Base):
    __tablename__ = "workflow_routes"

    id = Column(String, primary_key=True, default=generate_uuid)
    route_code = Column(String, unique=True, nullable=False)  # ROUTE_A, ROUTE_B, ROUTE_C
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    stages_config = Column(JSON, nullable=False)  # List of stages with allowed actions, roles, deadlines
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="workflow_route")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_number = Column(String, unique=True, index=True, nullable=False) # e.g. AICTE-2026-AP-0101
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    workflow_route_id = Column(String, ForeignKey("workflow_routes.id"), nullable=False)
    route_version = Column(Integer, default=1)
    application_type = Column(String, nullable=False)  # Extension of Approval (EoA), New Institute, Increase in Intake
    academic_year = Column(String, default="2026-2027")
    current_stage = Column(String, nullable=False)  # INTAKE, SCRUTINY, EVC, SAC_SHC, DECISION, CLOSED
    status = Column(String, nullable=False)  # DRAFT, SUBMITTED, UNDER_SCRUTINY, DEFICIENCY_RETURNED, RESUBMITTED, AWAITING_EVC, EVC_SCHEDULED, AWAITING_DECISION, APPROVED, REJECTED, CONDITIONALLY_APPROVED
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    region = Column(String, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    current_stage_started_at = Column(DateTime, default=datetime.utcnow)
    stage_deadline = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False)
    form_data = Column(JSON, nullable=True) # Course details, student intake, faculty count, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="applications")
    workflow_route = relationship("WorkflowRoute", back_populates="applications")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    stage_history = relationship("StageHistory", back_populates="application", order_by="StageHistory.created_at")
    observations = relationship("Observation", back_populates="application")
    evc_records = relationship("EVCRecord", back_populates="application")
    undertakings = relationship("Undertaking", back_populates="application")
    documents = relationship("Document", back_populates="application")
    call_logs = relationship("CallLog", back_populates="application")

class StageHistory(Base):
    __tablename__ = "stage_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    from_stage = Column(String, nullable=True)
    to_stage = Column(String, nullable=False)
    action = Column(String, nullable=False)  # SUBMIT, PASS_SCRUTINY, RETURN_DEFICIENCY, RESUBMIT, SCHEDULE_EVC, COMPLETE_EVC, APPROVE, REJECT
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="stage_history")

class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    stage = Column(String, nullable=False)
    deficiency_category = Column(String, nullable=False) # Land/Lease, Faculty, Infrastructure, Financial, Undertaking
    details = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    institution_response = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="observations")
    created_by = relationship("User", foreign_keys=[created_by_id])

class EVCRecord(Base):
    __tablename__ = "evc_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=True)
    committee_members = Column(JSON, nullable=True) # List of member names, roles
    lead_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="PENDING_SCHEDULE") # PENDING_SCHEDULE, SCHEDULED, IN_PROGRESS, COMPLETED, RESCHEDULED, OVERDUE
    reschedule_reason = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False)
    report_summary = Column(Text, nullable=True)
    recommendation = Column(String, nullable=True) # RECOMMENDED, DEFICIENT, REJECTED
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="evc_records")
    lead_officer = relationship("User", foreign_keys=[lead_officer_id])

class Undertaking(Base):
    __tablename__ = "undertakings"

    id = Column(String, primary_key=True, default=generate_uuid)
    undertaking_code = Column(String, unique=True, nullable=False) # E.g., UT-2026-0042
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    condition_title = Column(String, nullable=False)
    condition_description = Column(Text, nullable=False)
    required_evidence_type = Column(String, nullable=False) # Fire Safety NOC, Land Lease Deed, Building Plan Approval, Corpus Fund Deposit
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="NOT_SUBMITTED") # NOT_SUBMITTED, SUBMITTED, UNDER_REVIEW, RETURNED_FOR_CORRECTION, VERIFIED, OVERDUE, CLOSED
    evidence_file_path = Column(String, nullable=True)
    evidence_filename = Column(String, nullable=True)
    submission_timestamp = Column(DateTime, nullable=True)
    verified_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_remarks = Column(Text, nullable=True)
    extension_requested = Column(Boolean, default=False)
    extension_requested_until = Column(DateTime, nullable=True)
    extension_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="undertakings")
    institution = relationship("Institution", back_populates="undertakings")
    verified_by = relationship("User", foreign_keys=[verified_by_id])

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    undertaking_id = Column(String, ForeignKey("undertakings.id"), nullable=True)
    document_type = Column(String, nullable=False) # Land Lease Deed, Fire NOC, Occupancy Certificate, AICTE Trust Deed, Faculty Roster
    display_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String, default="application/pdf")
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    validity_status = Column(String, default="VALID") # VALID, EXPIRING_SOON_90, EXPIRING_SOON_60, EXPIRING_SOON_30, EXPIRED, NO_EXPIRY
    verification_status = Column(String, default="UNVERIFIED") # UNVERIFIED, VERIFIED, REJECTED
    verified_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    verification_remarks = Column(Text, nullable=True)
    previous_document_id = Column(String, nullable=True) # Linked historical renewal chain
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="documents")
    application = relationship("Application", back_populates="documents")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    recipient_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    event_type = Column(String, nullable=False) # APPLICATION_SUBMITTED, DEFICIENCY_RETURNED, RESUBMISSION_RECEIVED, STAGE_APPROACHING_DEADLINE, OVERDUE, EVC_SCHEDULED, UNDERTAKING_DEADLINE_APPROACHING, DOCUMENT_EXPIRING, AI_VOICE_CALL_COMPLETED, ESCALATION_TRIGGERED
    channel = Column(String, default="IN_APP") # IN_APP, EMAIL, SMS, VOICE
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    delivery_status = Column(String, default="DELIVERED") # DELIVERED, SIMULATED, PENDING, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String, primary_key=True, default=generate_uuid)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    undertaking_id = Column(String, ForeignKey("undertakings.id"), nullable=True)
    evc_id = Column(String, ForeignKey("evc_records.id"), nullable=True)
    trigger_type = Column(String, nullable=False) # STAGE_OVERDUE, EVC_OVERDUE, COMPLIANCE_OVERDUE, LEASE_EXPIRED
    escalation_level = Column(Integer, default=1) # 1: Regional Officer, 2: Bureau Officer, 3: Senior Authority
    assigned_role = Column(String, nullable=False) # BUREAU_OFFICER, SENIOR_AUTHORITY
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    summary = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, RESOLVED, DISMISSED
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    undertaking_id = Column(String, ForeignKey("undertakings.id"), nullable=True)
    contact_phone = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    provider_mode = Column(String, default="SIMULATED") # SIMULATED, TWILIO, EXOTEL
    call_status = Column(String, default="COMPLETED") # INITIATED, RINGING, COMPLETED, NO_ANSWER, FAILED
    language = Column(String, default="English") # English, Hindi, Marathi
    recognized_intent = Column(String, nullable=False) # SUBMITTED, NOT_SUBMITTED, NEEDS_MORE_TIME, NEEDS_HELP, WRONG_PERSON, REQUESTS_HUMAN, UNCLEAR_RESPONSE, CALL_FAILED, NO_ANSWER
    transcript_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=False)
    promised_date = Column(DateTime, nullable=True)
    follow_up_task_created = Column(Boolean, default=False)
    follow_up_task_details = Column(Text, nullable=True)
    human_escalation_required = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="call_logs")
    application = relationship("Application", back_populates="call_logs")

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    call_log_id = Column(String, ForeignKey("call_logs.id"), nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    undertaking_id = Column(String, ForeignKey("undertakings.id"), nullable=True)
    task_type = Column(String, nullable=False) # PROMISED_DATE_CHECK, HUMAN_OFFICER_REVIEW, EXTENSION_REVIEW, CONTACT_UPDATE_REQUIRED
    task_description = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=True)
    assigned_role = Column(String, default=UserRole.REGIONAL_OFFICER)
    status = Column(String, default="PENDING") # PENDING, IN_PROGRESS, COMPLETED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=True)
    actor_name = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False) # USER_LOGIN, APPLICATION_CREATED, STAGE_TRANSITION, DEFICIENCY_RAISED, RESUBMISSION, EVC_SCHEDULED, COMPLIANCE_VERIFIED, CALL_TRIGGERED, ESCALATION_RESOLVED
    target_entity = Column(String, nullable=False) # Application, Undertaking, Document, EVCRecord, User
    target_id = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow)
