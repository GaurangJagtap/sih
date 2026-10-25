from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import (
    Application, Undertaking, Document, EVCRecord, Escalation,
    Notification, AuditEvent, Institution, User, UserRole
)

router = APIRouter(prefix="/reports", tags=["Consolidated Reporting & Dashboards"])

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total counts calculated directly from real database records
    apps_query = select(Application)
    if current_user.role == UserRole.INSTITUTION:
        apps_query = apps_query.where(Application.institution_id == current_user.institution_id)
    elif current_user.role == UserRole.REGIONAL_OFFICER and current_user.region:
        apps_query = apps_query.where(Application.region == current_user.region)

    apps_res = await db.execute(apps_query)
    all_apps = apps_res.scalars().all()

    total_apps = len(all_apps)
    pending_apps = sum(1 for a in all_apps if a.status not in ["APPROVED", "REJECTED", "CLOSED"])
    overdue_apps = sum(1 for a in all_apps if a.is_overdue)
    approved_apps = sum(1 for a in all_apps if a.status in ["APPROVED", "CONDITIONALLY_APPROVED"])

    # Stage distribution
    stage_counts = {}
    for a in all_apps:
        stage_counts[a.current_stage] = stage_counts.get(a.current_stage, 0) + 1

    stage_distribution = [{"stage": k, "count": v} for k, v in stage_counts.items()]

    # Region pendency
    region_counts = {}
    for a in all_apps:
        if a.is_overdue or a.status not in ["APPROVED", "REJECTED", "CLOSED"]:
            region_counts[a.region] = region_counts.get(a.region, 0) + 1

    region_pendency = [{"region": k, "pending_count": v} for k, v in region_counts.items()]

    # Undertakings summary
    ut_query = select(Undertaking)
    if current_user.role == UserRole.INSTITUTION:
        ut_query = ut_query.where(Undertaking.institution_id == current_user.institution_id)
    ut_res = await db.execute(ut_query)
    all_uts = ut_res.scalars().all()

    pending_compliance = sum(1 for u in all_uts if u.status in ["NOT_SUBMITTED", "RETURNED_FOR_CORRECTION", "OVERDUE"])
    verified_compliance = sum(1 for u in all_uts if u.status == "VERIFIED")

    # Expiring documents
    doc_query = select(Document)
    if current_user.role == UserRole.INSTITUTION:
        doc_query = doc_query.where(Document.institution_id == current_user.institution_id)
    doc_res = await db.execute(doc_query)
    all_docs = doc_res.scalars().all()

    expiring_docs = sum(1 for d in all_docs if d.validity_status in ["EXPIRING_SOON_30", "EXPIRING_SOON_60", "EXPIRING_SOON_90"])
    expired_docs = sum(1 for d in all_docs if d.validity_status == "EXPIRED")

    # Active escalations
    esc_res = await db.execute(select(Escalation).where(Escalation.status == "ACTIVE"))
    active_escalations = len(esc_res.scalars().all())

    return {
        "kpis": {
            "total_applications": total_apps,
            "pending_applications": pending_apps,
            "overdue_applications": overdue_apps,
            "approved_applications": approved_apps,
            "pending_compliance": pending_compliance,
            "verified_compliance": verified_compliance,
            "expiring_documents": expiring_docs,
            "expired_documents": expired_docs,
            "active_escalations": active_escalations
        },
        "stage_distribution": stage_distribution,
        "region_pendency": region_pendency
    }

@router.get("/audit-events")
async def get_audit_trail(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "actor_name": e.actor_name or "System",
            "actor_role": e.actor_role or "SYSTEM",
            "action": e.action,
            "target_entity": e.target_entity,
            "target_id": e.target_id,
            "details": e.details,
            "ip_address": e.ip_address,
            "created_at": e.created_at.isoformat()
        }
        for e in events
    ]

@router.get("/escalations")
async def get_escalations(
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Escalation).order_by(Escalation.created_at.desc())
    result = await db.execute(query)
    escalations = result.scalars().all()
    return [
        {
            "id": esc.id,
            "trigger_type": esc.trigger_type,
            "escalation_level": esc.escalation_level,
            "assigned_role": esc.assigned_role,
            "summary": esc.summary,
            "status": esc.status,
            "created_at": esc.created_at.isoformat(),
            "resolved_at": esc.resolved_at.isoformat() if esc.resolved_at else None
        }
        for esc in escalations
    ]
