from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import (
    CallLog, FollowUpTask, Institution, Application, Undertaking,
    Notification, AuditEvent, User, UserRole
)
from app.schemas.schemas import VoiceCallInitiateRequest, VoiceCallSimulateResponseRequest
from app.voice.agent import SimulatedVoiceAgent

router = APIRouter(prefix="/voice", tags=["AI Voice Call Reminder Agent"])
voice_agent = SimulatedVoiceAgent()

@router.get("/calls")
async def get_call_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(CallLog).options(
        selectinload(CallLog.institution),
        selectinload(CallLog.application)
    )

    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.where(CallLog.institution_id == current_user.institution_id)

    query = query.order_by(CallLog.created_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": c.id,
            "institution_id": c.institution_id,
            "institution_name": c.institution.name if c.institution else "N/A",
            "application_number": c.application.application_number if c.application else "N/A",
            "contact_phone": c.contact_phone,
            "contact_person": c.contact_person,
            "provider_mode": c.provider_mode,
            "call_status": c.call_status,
            "language": c.language,
            "recognized_intent": c.recognized_intent,
            "transcript_text": c.transcript_text,
            "ai_summary": c.ai_summary,
            "promised_date": c.promised_date.isoformat() if c.promised_date else None,
            "follow_up_task_created": c.follow_up_task_created,
            "follow_up_task_details": c.follow_up_task_details,
            "human_escalation_required": c.human_escalation_required,
            "created_at": c.created_at.isoformat()
        }
        for c in logs
    ]

@router.post("/initiate-call")
async def initiate_voice_call(
    req: VoiceCallInitiateRequest,
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Fetch institution
    inst_res = await db.execute(select(Institution).where(Institution.id == req.institution_id))
    institution = inst_res.scalars().first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    call_session = await voice_agent.initiate_call(
        contact_person=institution.contact_person,
        contact_phone=institution.contact_phone,
        institution_name=institution.name,
        pending_item=req.pending_item_description,
        language=req.language,
        submission_deadline=req.submission_deadline
    )

    # Create initial CallLog record
    call = CallLog(
        institution_id=institution.id,
        application_id=req.application_id,
        undertaking_id=req.undertaking_id,
        contact_phone=institution.contact_phone,
        contact_person=institution.contact_person,
        provider_mode="SIMULATED",
        call_status="INITIATED",
        language=req.language,
        recognized_intent="UNCLEAR_RESPONSE",
        transcript_text=f"[AI Assistant]: {call_session['system_opening_prompt']}",
        ai_summary=(
            f"Call initiated to primary number {institution.contact_phone} regarding pending: "
            f"'{req.pending_item_description}'. Prescribed deadline: {req.submission_deadline or 'N/A'}."
        )
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    return {
        "call_id": call.id,
        "contact_person": institution.contact_person,
        "contact_phone": institution.contact_phone,
        "opening_prompt": call_session["system_opening_prompt"],
        "disclaimer": call_session["disclaimer"],
        "submission_deadline": req.submission_deadline
    }

@router.post("/calls/{call_id}/simulate-response")
async def simulate_call_response(
    call_id: str,
    req: VoiceCallSimulateResponseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CallLog).where(CallLog.id == call_id).options(selectinload(CallLog.institution)))
    call = result.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    # Classify intent & extract promised date
    classification = await voice_agent.classify_intent(req.user_spoken_response)
    intent = classification["intent"]
    promised_date = classification["promised_date"]

    institution_name = call.institution.name if call.institution else "Institution"
    ai_summary = await voice_agent.generate_summary(
        institution_name=institution_name,
        pending_item=call.ai_summary or "Compliance submission",
        user_response_text=req.user_spoken_response,
        intent=intent,
        promised_date=promised_date
    )

    call.transcript_text += f"\n[Representative]: {req.user_spoken_response}"
    call.recognized_intent = intent
    call.promised_date = promised_date
    call.ai_summary = ai_summary
    call.call_status = "COMPLETED"

    # Follow-up task & escalation rules based on intent
    task_created = False
    task_description = ""
    human_escalation = False

    if intent == "SUBMITTED":
        # Critical rule: An intent of SUBMITTED retains an officer verification task; does not mark verified.
        task_created = True
        task_description = f"Verify evidence claimed submitted during AI call by representative of {institution_name}."
    elif intent == "NEEDS_MORE_TIME":
        # Critical rule: An intent of NEEDS_MORE_TIME creates an extension-review task; does not auto-grant extension.
        task_created = True
        date_str = promised_date.strftime('%d-%b-%Y') if promised_date else "upcoming date"
        task_description = f"Review extension requested during AI call. Representative promised submission by {date_str}."
    elif intent in ["WRONG_PERSON", "REQUESTS_HUMAN"]:
        human_escalation = True
        task_created = True
        task_description = f"Direct Officer Contact Required: {intent} raised during AI automated call."
    elif intent == "UNCLEAR_RESPONSE":
        task_created = True
        task_description = "Follow up with institution: AI voice agent received ambiguous response."

    call.follow_up_task_created = task_created
    call.follow_up_task_details = task_description
    call.human_escalation_required = human_escalation

    if task_created:
        task = FollowUpTask(
            call_log_id=call.id,
            institution_id=call.institution_id,
            application_id=call.application_id,
            undertaking_id=call.undertaking_id,
            task_type="AI_CALL_FOLLOW_UP",
            task_description=task_description,
            due_date=promised_date or (datetime.utcnow() + timedelta(days=3)),
            assigned_role=UserRole.REGIONAL_OFFICER
        )
        db.add(task)

    # Notification
    notif = Notification(
        institution_id=call.institution_id,
        application_id=call.application_id,
        event_type="AI_VOICE_CALL_COMPLETED",
        channel="VOICE",
        title=f"AI Voice Call Completed ({intent})",
        message=f"Voice call summary: {ai_summary[:160]}..."
    )
    db.add(notif)

    # Audit event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="AI_VOICE_CALL_RECORDED",
        target_entity="CallLog",
        target_id=call.id,
        details={"intent": intent, "promised_date": promised_date.isoformat() if promised_date else None}
    )
    db.add(audit)

    await db.commit()

    return {
        "call_id": call.id,
        "recognized_intent": intent,
        "promised_date": promised_date.isoformat() if promised_date else None,
        "ai_summary": ai_summary,
        "follow_up_task_created": task_created,
        "follow_up_task_details": task_description,
        "human_escalation_required": human_escalation
    }

@router.get("/follow-up-tasks")
async def get_follow_up_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(FollowUpTask)
    if current_user.role == UserRole.INSTITUTION:
        if not current_user.institution_id:
            return []
        query = query.where(FollowUpTask.institution_id == current_user.institution_id)

    query = query.order_by(FollowUpTask.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [
        {
            "id": t.id,
            "call_log_id": t.call_log_id,
            "task_type": t.task_type,
            "task_description": t.task_description,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "assigned_role": t.assigned_role,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        }
        for t in tasks
    ]

@router.get("/pending-deficiencies")
async def get_pending_deficiencies_for_voice(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all items where deadlines have been missed or approaching:
    1. Overdue/pending undertakings from institutions
    2. Overdue application stages (e.g., deficiency return unaddressed)
    3. Expiring critical documents
    """
    now = datetime.utcnow()
    items = []

    # 1. Undertakings
    ut_query = select(Undertaking).options(
        selectinload(Undertaking.institution),
        selectinload(Undertaking.application)
    ).where(Undertaking.status.in_(["NOT_SUBMITTED", "RETURNED_FOR_CORRECTION", "OVERDUE"]))
    
    if current_user.role == UserRole.INSTITUTION:
        ut_query = ut_query.where(Undertaking.institution_id == current_user.institution_id)

    ut_res = await db.execute(ut_query)
    for u in ut_res.scalars().all():
        is_overdue = u.due_date < now or u.status == "OVERDUE"
        days_diff = (u.due_date - now).days
        items.append({
            "type": "UNDERTAKING",
            "id": u.id,
            "institution_id": u.institution_id,
            "institution_name": u.institution.name if u.institution else "N/A",
            "contact_phone": u.institution.contact_phone if u.institution else "N/A",
            "contact_person": u.institution.contact_person if u.institution else "N/A",
            "application_id": u.application_id,
            "application_number": u.application.application_number if u.application else "N/A",
            "pending_item": f"{u.condition_title} ({u.required_evidence_type})",
            "deadline": u.due_date.strftime("%d-%b-%Y"),
            "is_overdue": is_overdue,
            "status_label": "DEADLINE MISSED" if is_overdue else f"Due in {days_diff} days",
            "category": "Institutional Undertaking Compliance"
        })

    # 2. Overdue Application stages (e.g. DEFICIENCY_RETURNED or pending scrutiny)
    app_query = select(Application).options(
        selectinload(Application.institution)
    ).where(Application.status.not_in(["APPROVED", "REJECTED", "CLOSED"]))

    if current_user.role == UserRole.INSTITUTION:
        app_query = app_query.where(Application.institution_id == current_user.institution_id)

    app_res = await db.execute(app_query)
    for a in app_res.scalars().all():
        if a.is_overdue or (a.stage_deadline and a.stage_deadline < now):
            deadline_str = a.stage_deadline.strftime("%d-%b-%Y") if a.stage_deadline else "Overdue"
            items.append({
                "type": "APPLICATION_STAGE",
                "id": a.id,
                "institution_id": a.institution_id,
                "institution_name": a.institution.name if a.institution else "N/A",
                "contact_phone": a.institution.contact_phone if a.institution else "N/A",
                "contact_person": a.institution.contact_person if a.institution else "N/A",
                "application_id": a.id,
                "application_number": a.application_number,
                "pending_item": f"Stage '{a.current_stage}' Resolution / Deficiency Clearance",
                "deadline": deadline_str,
                "is_overdue": True,
                "status_label": "OFFICER & INSTITUTION STAGE MISSED",
                "category": "Application Stage Pendency"
            })

    # 3. Expired or Expiring soon critical documents
    doc_query = select(Document).options(
        selectinload(Document.institution)
    ).where(Document.validity_status.in_(["EXPIRED", "EXPIRING_SOON_30"]))

    if current_user.role == UserRole.INSTITUTION:
        doc_query = doc_query.where(Document.institution_id == current_user.institution_id)

    doc_res = await db.execute(doc_query)
    for d in doc_res.scalars().all():
        items.append({
            "type": "DOCUMENT_RENEWAL",
            "id": d.id,
            "institution_id": d.institution_id,
            "institution_name": d.institution.name if d.institution else "N/A",
            "contact_phone": d.institution.contact_phone if d.institution else "N/A",
            "contact_person": d.institution.contact_person if d.institution else "N/A",
            "application_id": d.application_id,
            "application_number": "N/A",
            "pending_item": f"Mandatory Document Renewal: {d.display_name} ({d.document_type})",
            "deadline": d.expiry_date.strftime("%d-%b-%Y") if d.expiry_date else "Immediate Renewal Required",
            "is_overdue": d.validity_status == "EXPIRED",
            "status_label": "EXPIRED" if d.validity_status == "EXPIRED" else "Expiring Soon",
            "category": "Statutory Document Expiry"
        })

    return items


@router.post("/trigger-automated-deadline-calls")
async def trigger_automated_deadline_calls(
    current_user: User = Depends(require_roles(UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Automated Voice Calling Engine:
    Detects all missed deadlines from the officer/institution side and automatically schedules & initiates
    AI voice calls directly to each institution's registered primary contact number.
    """
    now = datetime.utcnow()
    calls_created = []

    # 1. Fetch all overdue undertakings
    ut_query = select(Undertaking).options(
        selectinload(Undertaking.institution),
        selectinload(Undertaking.application)
    ).where(Undertaking.status.in_(["NOT_SUBMITTED", "RETURNED_FOR_CORRECTION", "OVERDUE"]))
    
    ut_res = await db.execute(ut_query)
    for u in ut_res.scalars().all():
        if u.due_date < now or u.status == "OVERDUE":
            inst = u.institution
            if not inst:
                continue
            
            # Check rate limiting: max 2 calls per undertaking
            existing_call_res = await db.execute(
                select(CallLog).where(
                    CallLog.undertaking_id == u.id,
                    CallLog.call_status.in_(["INITIATED", "CONNECTED", "COMPLETED"])
                )
            )
            existing_calls = existing_call_res.scalars().all()
            if len(existing_calls) > 2:
                continue
            
            deadline_str = u.due_date.strftime("%d-%b-%Y")
            pending_desc = f"{u.condition_title} (Evidence: {u.required_evidence_type})"
            
            call_session = await voice_agent.initiate_call(
                contact_person=inst.contact_person,
                contact_phone=inst.contact_phone,
                institution_name=inst.name,
                pending_item=pending_desc,
                language="English",
                submission_deadline=deadline_str
            )

            call = CallLog(
                institution_id=inst.id,
                application_id=u.application_id,
                undertaking_id=u.id,
                contact_phone=inst.contact_phone,
                contact_person=inst.contact_person,
                provider_mode="SIMULATED",
                call_status="INITIATED",
                language="English",
                recognized_intent="UNCLEAR_RESPONSE",
                transcript_text=f"[Automated AI Voice Reminder to {inst.contact_phone}]: {call_session['system_opening_prompt']}",
                ai_summary=(
                    f"Automated Deadline Voice Alert dispatched to primary contact {inst.contact_phone} ({inst.contact_person}). "
                    f"Condition: '{u.condition_title}'. Prescribed submission deadline: {deadline_str}."
                )
            )
            db.add(call)
            calls_created.append({
                "institution_name": inst.name,
                "phone": inst.contact_phone,
                "contact_person": inst.contact_person,
                "pending_item": pending_desc,
                "deadline": deadline_str,
                "type": "UNDERTAKING_OVERDUE"
            })

    # 2. Fetch overdue application stages
    app_query = select(Application).options(
        selectinload(Application.institution)
    ).where(
        Application.status.not_in(["APPROVED", "REJECTED", "CLOSED"]),
        Application.is_overdue == True
    )
    app_res = await db.execute(app_query)
    for a in app_res.scalars().all():
        inst = a.institution
        if not inst:
            continue
        
        deadline_str = a.stage_deadline.strftime("%d-%b-%Y") if a.stage_deadline else "Past Due"
        pending_desc = f"Application {a.application_number} ({a.current_stage} submission)"
        
        call_session = await voice_agent.initiate_call(
            contact_person=inst.contact_person,
            contact_phone=inst.contact_phone,
            institution_name=inst.name,
            pending_item=pending_desc,
            language="English",
            submission_deadline=deadline_str
        )

        call = CallLog(
            institution_id=inst.id,
            application_id=a.id,
            contact_phone=inst.contact_phone,
            contact_person=inst.contact_person,
            provider_mode="SIMULATED",
            call_status="INITIATED",
            language="English",
            recognized_intent="UNCLEAR_RESPONSE",
            transcript_text=f"[Automated AI Voice Reminder to {inst.contact_phone}]: {call_session['system_opening_prompt']}",
            ai_summary=(
                f"Automated Stage Deadline Voice Alert dispatched to {inst.contact_phone}. "
                f"Application {a.application_number} overdue at stage {a.current_stage}. Prescribed deadline: {deadline_str}."
            )
        )
        db.add(call)
        calls_created.append({
            "institution_name": inst.name,
            "phone": inst.contact_phone,
            "contact_person": inst.contact_person,
            "pending_item": pending_desc,
            "deadline": deadline_str,
            "type": "STAGE_OVERDUE"
        })

    # Audit log
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="AUTOMATED_VOICE_CALLS_TRIGGERED",
        target_entity="CallLog",
        target_id="BATCH",
        details={"calls_count": len(calls_created)}
    )
    db.add(audit)

    await db.commit()

    return {
        "success": True,
        "dispatched_count": len(calls_created),
        "dispatched_calls": calls_created,
        "message": f"Successfully triggered {len(calls_created)} automated voice call reminders to institutional primary contact numbers."
    }

