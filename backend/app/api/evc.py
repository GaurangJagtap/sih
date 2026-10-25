from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import EVCRecord, Application, AuditEvent, Notification, User, UserRole
from app.schemas.schemas import EVCRecordCreate, EVCCompleteRequest

router = APIRouter(prefix="/evc", tags=["Expert Visit Committee (EVC)"])

@router.get("")
async def get_evc_records(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(EVCRecord).options(
        selectinload(EVCRecord.application).selectinload(Application.institution),
        selectinload(EVCRecord.lead_officer)
    )

    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.join(Application).where(Application.institution_id == current_user.institution_id)

    if status_filter:
        query = query.where(EVCRecord.status == status_filter)

    query = query.order_by(EVCRecord.created_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()

    return [
        {
            "id": r.id,
            "application_id": r.application_id,
            "application_number": r.application.application_number if r.application else "N/A",
            "institution_name": r.application.institution.name if r.application and r.application.institution else "N/A",
            "region": r.application.region if r.application else "N/A",
            "scheduled_date": r.scheduled_date.isoformat() if r.scheduled_date else None,
            "committee_members": r.committee_members,
            "lead_officer_name": r.lead_officer.full_name if r.lead_officer else "Assigned EVC Panel",
            "status": r.status,
            "reschedule_reason": r.reschedule_reason,
            "is_overdue": r.is_overdue,
            "report_summary": r.report_summary,
            "recommendation": r.recommendation,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]

@router.post("/schedule")
async def schedule_evc(
    req: EVCRecordCreate,
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    app_res = await db.execute(select(Application).where(Application.id == req.application_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    evc = EVCRecord(
        application_id=app.id,
        scheduled_date=req.scheduled_date,
        committee_members=req.committee_members,
        lead_officer_id=current_user.id,
        status="SCHEDULED",
        deadline=req.scheduled_date + timedelta(days=3)
    )
    db.add(evc)

    app.status = "EVC_SCHEDULED"

    # Notification
    notif = Notification(
        institution_id=app.institution_id,
        application_id=app.id,
        event_type="EVC_SCHEDULED",
        title=f"EVC Inspection Scheduled: {app.application_number}",
        message=f"Expert Visit Committee inspection has been scheduled for {req.scheduled_date.strftime('%d-%b-%Y')}."
    )
    db.add(notif)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="EVC_SCHEDULED",
        target_entity="EVCRecord",
        target_id=app.id,
        details={"scheduled_date": req.scheduled_date.isoformat()}
    )
    db.add(audit)
    await db.commit()

    return {"message": "EVC inspection scheduled successfully", "id": evc.id}

@router.post("/{evc_id}/complete")
async def complete_evc(
    evc_id: str,
    req: EVCCompleteRequest,
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.EVC_COMMITTEE, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EVCRecord).where(EVCRecord.id == evc_id).options(selectinload(EVCRecord.application)))
    evc = result.scalars().first()
    if not evc:
        raise HTTPException(status_code=404, detail="EVC record not found")

    evc.status = "COMPLETED"
    evc.report_summary = req.report_summary
    evc.recommendation = req.recommendation
    evc.completed_at = datetime.utcnow()

    # If application is in EVC stage, update status
    if evc.application:
        evc.application.status = "AWAITING_DECISION"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="EVC_COMPLETED",
        target_entity="EVCRecord",
        target_id=evc.id,
        details={"recommendation": req.recommendation, "summary": req.report_summary}
    )
    db.add(audit)
    await db.commit()

    return {"message": "EVC report submitted successfully", "recommendation": req.recommendation}
