from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import Undertaking, Application, AuditEvent, Notification, User, UserRole
from app.storage.service import StorageService

router = APIRouter(prefix="/compliance", tags=["Undertakings & Compliance"])

@router.get("")
async def get_compliance_items(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Undertaking).options(
        selectinload(Undertaking.institution),
        selectinload(Undertaking.application)
    )

    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.where(Undertaking.institution_id == current_user.institution_id)

    if status_filter:
        query = query.where(Undertaking.status == status_filter)

    query = query.order_by(Undertaking.due_date.asc())
    result = await db.execute(query)
    items = result.scalars().all()

    return [
        {
            "id": u.id,
            "undertaking_code": u.undertaking_code,
            "application_id": u.application_id,
            "application_number": u.application.application_number if u.application else "N/A",
            "institution_name": u.institution.name if u.institution else "N/A",
            "condition_title": u.condition_title,
            "condition_description": u.condition_description,
            "required_evidence_type": u.required_evidence_type,
            "due_date": u.due_date.isoformat(),
            "status": u.status,
            "evidence_filename": u.evidence_filename,
            "submission_timestamp": u.submission_timestamp.isoformat() if u.submission_timestamp else None,
            "verified_at": u.verified_at.isoformat() if u.verified_at else None,
            "verification_remarks": u.verification_remarks,
            "extension_requested": u.extension_requested,
            "extension_reason": u.extension_reason
        }
        for u in items
    ]

@router.post("/{item_id}/submit-evidence")
async def submit_compliance_evidence(
    item_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Undertaking).where(Undertaking.id == item_id))
    ut = result.scalars().first()
    if not ut:
        raise HTTPException(status_code=404, detail="Undertaking not found")

    if current_user.role == UserRole.INSTITUTION and ut.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Unauthorized institution access")

    saved = await StorageService.save_file(file, subfolder="compliance")

    ut.status = "SUBMITTED"
    ut.evidence_file_path = saved["file_path"]
    ut.evidence_filename = saved["filename"]
    ut.submission_timestamp = datetime.utcnow()

    # Create notification for Regional Officer
    notif = Notification(
        institution_id=ut.institution_id,
        application_id=ut.application_id,
        event_type="COMPLIANCE_EVIDENCE_SUBMITTED",
        title=f"Compliance Evidence Uploaded: {ut.undertaking_code}",
        message=f"Evidence '{saved['filename']}' submitted for condition: {ut.condition_title}. Verification required."
    )
    db.add(notif)

    # Audit event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="COMPLIANCE_SUBMITTED",
        target_entity="Undertaking",
        target_id=ut.id,
        details={"filename": saved["filename"], "undertaking_code": ut.undertaking_code}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Evidence submitted successfully. Pending regulatory verification.", "status": ut.status}

@router.post("/{item_id}/verify")
async def verify_compliance_evidence(
    item_id: str,
    action: str = Form(...),  # ACCEPT, RETURN
    remarks: str = Form(...),
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Undertaking).where(Undertaking.id == item_id))
    ut = result.scalars().first()
    if not ut:
        raise HTTPException(status_code=404, detail="Undertaking not found")

    if action == "ACCEPT":
        ut.status = "VERIFIED"
        ut.verified_by_id = current_user.id
        ut.verified_at = datetime.utcnow()
        ut.verification_remarks = remarks
        notif_msg = f"Evidence for condition '{ut.condition_title}' has been VERIFIED by AICTE officer."
    elif action == "RETURN":
        ut.status = "RETURNED_FOR_CORRECTION"
        ut.verification_remarks = remarks
        notif_msg = f"Evidence for condition '{ut.condition_title}' was RETURNED with deficiency: {remarks}. Please upload revised proof."
    else:
        raise HTTPException(status_code=400, detail="Action must be ACCEPT or RETURN")

    # Notify Institution
    notif = Notification(
        institution_id=ut.institution_id,
        application_id=ut.application_id,
        event_type="COMPLIANCE_VERIFIED" if action == "ACCEPT" else "COMPLIANCE_RETURNED",
        title=f"Compliance Review: {ut.undertaking_code}",
        message=notif_msg
    )
    db.add(notif)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="COMPLIANCE_VERIFICATION_DECISION",
        target_entity="Undertaking",
        target_id=ut.id,
        details={"action": action, "remarks": remarks}
    )
    db.add(audit)
    await db.commit()

    return {"message": f"Compliance item status updated to {ut.status}", "status": ut.status}

@router.post("/{item_id}/request-extension")
async def request_compliance_extension(
    item_id: str,
    days: int = Form(15),
    reason: str = Form(...),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Undertaking).where(Undertaking.id == item_id))
    ut = result.scalars().first()
    if not ut:
        raise HTTPException(status_code=404, detail="Undertaking not found")

    ut.extension_requested = True
    ut.extension_requested_until = ut.due_date + timedelta(days=days)
    ut.extension_reason = reason

    notif = Notification(
        institution_id=ut.institution_id,
        application_id=ut.application_id,
        event_type="EXTENSION_REQUESTED",
        title=f"Extension Requested: {ut.undertaking_code}",
        message=f"Institution requested {days} days extension. Reason: {reason}. Subject to officer approval."
    )
    db.add(notif)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="EXTENSION_REQUESTED",
        target_entity="Undertaking",
        target_id=ut.id,
        details={"requested_days": days, "reason": reason}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Extension request recorded. It does not automatically grant extension until officer review."}
