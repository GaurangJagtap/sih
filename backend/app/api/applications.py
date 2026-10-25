import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import (
    Application, Institution, WorkflowRoute, StageHistory, Observation,
    AuditEvent, Notification, User, UserRole
)
from app.schemas.schemas import ApplicationCreate, ApplicationTransitionRequest
from app.workflow.engine import WorkflowEngine

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("")
async def get_applications(
    stage: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Application).options(
        selectinload(Application.institution),
        selectinload(Application.workflow_route)
    )

    # Role-based scoping
    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.where(Application.institution_id == current_user.institution_id)
    elif current_user.role == UserRole.REGIONAL_OFFICER:
        if current_user.region:
            query = query.where(Application.region == current_user.region)

    if stage:
        query = query.where(Application.current_stage == stage)
    if status_filter:
        query = query.where(Application.status == status_filter)
    if region and current_user.role in [UserRole.BUREAU_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.ADMIN]:
        query = query.where(Application.region == region)

    query = query.order_by(Application.created_at.desc())
    result = await db.execute(query)
    apps = result.scalars().all()

    response = []
    for app in apps:
        response.append({
            "id": app.id,
            "application_number": app.application_number,
            "institution_id": app.institution_id,
            "institution_name": app.institution.name if app.institution else "N/A",
            "permanent_id": app.institution.aicte_permanent_id if app.institution else "N/A",
            "region": app.region,
            "application_type": app.application_type,
            "academic_year": app.academic_year,
            "current_stage": app.current_stage,
            "status": app.status,
            "route_code": app.workflow_route.route_code if app.workflow_route else "N/A",
            "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
            "stage_deadline": app.stage_deadline.isoformat() if app.stage_deadline else None,
            "is_overdue": app.is_overdue,
            "created_at": app.created_at.isoformat(),
            "form_data": app.form_data
        })
    return response

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_roles(UserRole.INSTITUTION, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User is not linked to any registered institution")

    # Fetch institution
    inst_res = await db.execute(select(Institution).where(Institution.id == current_user.institution_id))
    institution = inst_res.scalars().first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution record not found")

    # Fetch route
    route_res = await db.execute(select(WorkflowRoute).where(WorkflowRoute.route_code == app_in.workflow_route_code))
    route = route_res.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail=f"Workflow route '{app_in.workflow_route_code}' not found")

    # Generate sequential or unique application number
    app_num = f"AICTE-2026-{institution.region[:3].upper()}-{str(uuid.uuid4())[:6].upper()}"

    new_app = Application(
        application_number=app_num,
        institution_id=institution.id,
        workflow_route_id=route.id,
        route_version=route.version,
        application_type=app_in.application_type,
        academic_year=app_in.academic_year,
        current_stage="INTAKE",
        status="DRAFT",
        region=institution.region,
        form_data={
            "course_name": app_in.course_name,
            "intake_capacity": app_in.intake_capacity,
            "faculty_count": app_in.faculty_count,
            "campus_area_acres": app_in.campus_area_acres
        }
    )
    db.add(new_app)
    await db.flush()

    # Stage history
    history = StageHistory(
        application_id=new_app.id,
        from_stage=None,
        to_stage="INTAKE",
        action="DRAFT_CREATED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        remarks="Application draft initialized"
    )
    db.add(history)

    # Audit event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="APPLICATION_CREATED",
        target_entity="Application",
        target_id=new_app.id,
        details={"application_number": app_num, "route": route.route_code}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_app)

    return {"message": "Application created successfully", "id": new_app.id, "application_number": app_num}

@router.get("/{application_id}")
async def get_application_details(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Application).where(Application.id == application_id).options(
        selectinload(Application.institution),
        selectinload(Application.workflow_route),
        selectinload(Application.stage_history),
        selectinload(Application.observations),
        selectinload(Application.evc_records),
        selectinload(Application.undertakings),
        selectinload(Application.documents),
        selectinload(Application.call_logs)
    )
    result = await db.execute(query)
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Institution access restriction
    if current_user.role == UserRole.INSTITUTION and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to another institution's application")

    return {
        "id": app.id,
        "application_number": app.application_number,
        "institution": {
            "id": app.institution.id,
            "name": app.institution.name,
            "permanent_id": app.institution.aicte_permanent_id,
            "region": app.institution.region,
            "state": app.institution.state,
            "city": app.institution.city,
            "contact_person": app.institution.contact_person,
            "contact_email": app.institution.contact_email,
            "contact_phone": app.institution.contact_phone
        },
        "workflow_route": {
            "id": app.workflow_route.id,
            "route_code": app.workflow_route.route_code,
            "name": app.workflow_route.name,
            "version": app.workflow_route.version,
            "stages_config": app.workflow_route.stages_config
        },
        "application_type": app.application_type,
        "academic_year": app.academic_year,
        "current_stage": app.current_stage,
        "status": app.status,
        "region": app.region,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "stage_deadline": app.stage_deadline.isoformat() if app.stage_deadline else None,
        "is_overdue": app.is_overdue,
        "form_data": app.form_data,
        "created_at": app.created_at.isoformat(),
        "stage_history": [
            {
                "id": h.id,
                "from_stage": h.from_stage,
                "to_stage": h.to_stage,
                "action": h.action,
                "actor_name": h.actor_name,
                "actor_role": h.actor_role,
                "remarks": h.remarks,
                "created_at": h.created_at.isoformat()
            } for h in app.stage_history
        ],
        "observations": [
            {
                "id": o.id,
                "stage": o.stage,
                "deficiency_category": o.deficiency_category,
                "details": o.details,
                "is_resolved": o.is_resolved,
                "institution_response": o.institution_response,
                "created_at": o.created_at.isoformat()
            } for o in app.observations
        ],
        "undertakings": [
            {
                "id": u.id,
                "undertaking_code": u.undertaking_code,
                "condition_title": u.condition_title,
                "condition_description": u.condition_description,
                "required_evidence_type": u.required_evidence_type,
                "due_date": u.due_date.isoformat(),
                "status": u.status,
                "evidence_filename": u.evidence_filename,
                "verification_remarks": u.verification_remarks
            } for u in app.undertakings
        ],
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "display_name": d.display_name,
                "validity_status": d.validity_status,
                "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
                "verification_status": d.verification_status
            } for d in app.documents
        ],
        "evc_records": [
            {
                "id": e.id,
                "scheduled_date": e.scheduled_date.isoformat() if e.scheduled_date else None,
                "status": e.status,
                "is_overdue": e.is_overdue,
                "recommendation": e.recommendation,
                "report_summary": e.report_summary
            } for e in app.evc_records
        ],
        "call_logs": [
            {
                "id": c.id,
                "contact_person": c.contact_person,
                "recognized_intent": c.recognized_intent,
                "ai_summary": c.ai_summary,
                "promised_date": c.promised_date.isoformat() if c.promised_date else None,
                "created_at": c.created_at.isoformat()
            } for c in app.call_logs
        ]
    }

@router.post("/{application_id}/transition")
async def transition_application_stage(
    application_id: str,
    req: ApplicationTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Application).where(Application.id == application_id).options(
        selectinload(Application.workflow_route),
        selectinload(Application.institution)
    )
    result = await db.execute(query)
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Scoping check
    if current_user.role == UserRole.INSTITUTION and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Institution cannot modify another institution's case")

    # Validate transition using configurable engine
    transition_info = WorkflowEngine.validate_transition(
        route=app.workflow_route,
        application=app,
        action=req.action,
        actor=current_user
    )

    from_stage = transition_info["from_stage"]
    to_stage = transition_info["to_stage"]
    new_status = transition_info["new_status"]
    deadline_days = transition_info["deadline_days"]

    # Special logic for return deficiency: require mandatory reason
    if req.action == "RETURN_DEFICIENCY":
        if not req.deficiency_details:
            raise HTTPException(status_code=400, detail="Mandatory deficiency reason is required to return application")
        obs = Observation(
            application_id=app.id,
            created_by_id=current_user.id,
            stage=from_stage,
            deficiency_category=req.deficiency_category or "Documentation Deficiencies",
            details=req.deficiency_details
        )
        db.add(obs)
        # Notify institution
        notif = Notification(
            institution_id=app.institution_id,
            application_id=app.id,
            event_type="DEFICIENCY_RETURNED",
            title=f"Deficiency Returned: {app.application_number}",
            message=f"Regional officer noted: {req.deficiency_details}. Please rectify and resubmit."
        )
        db.add(notif)

    # Special logic for resubmit: mark observations resolved
    if req.action == "RESUBMIT":
        obs_res = await db.execute(select(Observation).where(Observation.application_id == app.id, Observation.is_resolved == False))
        open_obs = obs_res.scalars().all()
        for o in open_obs:
            o.is_resolved = True
            o.institution_response = req.remarks or "Evidence uploaded and rectified."
            o.resolved_at = datetime.utcnow()

    # Update application state
    app.current_stage = to_stage
    app.status = new_status
    app.current_stage_started_at = datetime.utcnow()
    app.stage_deadline = datetime.utcnow() + timedelta(days=deadline_days) if deadline_days > 0 else None
    app.is_overdue = False

    if req.action == "SUBMIT" and not app.submitted_at:
        app.submitted_at = datetime.utcnow()

    # Record stage history
    history = StageHistory(
        application_id=app.id,
        from_stage=from_stage,
        to_stage=to_stage,
        action=req.action,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        remarks=req.remarks or f"Transition via {req.action}"
    )
    db.add(history)

    # Record audit event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="STAGE_TRANSITION",
        target_entity="Application",
        target_id=app.id,
        details={"from_stage": from_stage, "to_stage": to_stage, "action": req.action, "status": new_status}
    )
    db.add(audit)

    await db.commit()

    return {
        "message": f"Application successfully transitioned to {to_stage}",
        "current_stage": to_stage,
        "status": new_status,
        "stage_deadline": app.stage_deadline.isoformat() if app.stage_deadline else None
    }
