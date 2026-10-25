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
        language=req.language
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
        ai_summary="Call initiated in simulated mode. Awaiting representative speech/response."
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    return {
        "call_id": call.id,
        "contact_person": institution.contact_person,
        "contact_phone": institution.contact_phone,
        "opening_prompt": call_session["system_opening_prompt"],
        "disclaimer": call_session["disclaimer"]
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
