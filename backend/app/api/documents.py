from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import Document, AuditEvent, Notification, User, UserRole
from app.storage.service import StorageService

router = APIRouter(prefix="/documents", tags=["Prescribed Documents & Lease Deeds"])

@router.get("")
async def get_documents(
    validity_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).options(
        selectinload(Document.institution),
        selectinload(Document.application)
    )

    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.where(Document.institution_id == current_user.institution_id)

    if validity_status:
        query = query.where(Document.validity_status == validity_status)

    query = query.order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()

    return [
        {
            "id": d.id,
            "document_type": d.document_type,
            "display_name": d.display_name,
            "institution_name": d.institution.name if d.institution else "N/A",
            "file_size_bytes": d.file_size_bytes,
            "issue_date": d.issue_date.isoformat() if d.issue_date else None,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "validity_status": d.validity_status,
            "verification_status": d.verification_status,
            "verification_remarks": d.verification_remarks,
            "previous_document_id": d.previous_document_id,
            "created_at": d.created_at.isoformat()
        }
        for d in docs
    ]

@router.post("/upload")
async def upload_document(
    document_type: str = Form(...),
    display_name: str = Form(...),
    issue_date_str: Optional[str] = Form(None),
    expiry_date_str: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.institution_id and current_user.role == UserRole.INSTITUTION:
        raise HTTPException(status_code=400, detail="User not linked to institution")

    saved = await StorageService.save_file(file, subfolder="prescribed_docs")

    issue_date = datetime.fromisoformat(issue_date_str) if issue_date_str else None
    expiry_date = datetime.fromisoformat(expiry_date_str) if expiry_date_str else None

    # Calculate initial validity
    validity = "NO_EXPIRY"
    if expiry_date:
        days = (expiry_date - datetime.utcnow()).days
        if days < 0:
            validity = "EXPIRED"
        elif days <= 30:
            validity = "EXPIRING_SOON_30"
        elif days <= 60:
            validity = "EXPIRING_SOON_60"
        elif days <= 90:
            validity = "EXPIRING_SOON_90"
        else:
            validity = "VALID"

    doc = Document(
        institution_id=current_user.institution_id or "inst-demo",
        document_type=document_type,
        display_name=display_name,
        file_path=saved["file_path"],
        file_size_bytes=saved["file_size"],
        mime_type=saved["mime_type"],
        issue_date=issue_date,
        expiry_date=expiry_date,
        validity_status=validity,
        verification_status="UNVERIFIED"
    )
    db.add(doc)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="DOCUMENT_UPLOADED",
        target_entity="Document",
        target_id=doc.id,
        details={"type": document_type, "filename": saved["filename"]}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Document uploaded successfully", "id": doc.id, "validity_status": validity}

@router.post("/{document_id}/renew")
async def renew_document(
    document_id: str,
    new_expiry_date_str: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    old_doc = result.scalars().first()
    if not old_doc:
        raise HTTPException(status_code=404, detail="Original document not found")

    saved = await StorageService.save_file(file, subfolder="prescribed_docs")
    new_expiry = datetime.fromisoformat(new_expiry_date_str)

    days = (new_expiry - datetime.utcnow()).days
    validity = "VALID" if days > 90 else "EXPIRING_SOON_90"

    # Create new renewed document record and link to historical record
    new_doc = Document(
        institution_id=old_doc.institution_id,
        application_id=old_doc.application_id,
        document_type=old_doc.document_type,
        display_name=f"{old_doc.display_name} (Renewed)",
        file_path=saved["file_path"],
        file_size_bytes=saved["file_size"],
        mime_type=saved["mime_type"],
        issue_date=datetime.utcnow(),
        expiry_date=new_expiry,
        validity_status=validity,
        verification_status="UNVERIFIED",
        previous_document_id=old_doc.id
    )
    db.add(new_doc)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="DOCUMENT_RENEWAL_UPLOADED",
        target_entity="Document",
        target_id=new_doc.id,
        details={"old_doc_id": old_doc.id, "new_expiry": new_expiry.isoformat()}
    )
    db.add(audit)
    await db.commit()

    return {"message": "Document renewal submitted successfully. Historical record preserved.", "id": new_doc.id}
