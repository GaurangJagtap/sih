from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import Application, Undertaking, Document, Notification, Escalation, UserRole

async def check_deadlines_and_generate_alerts(db: AsyncSession):
    now = datetime.utcnow()

    # 1. Check Application Stage Deadlines
    apps_result = await db.execute(
        select(Application).where(Application.status.not_in(["APPROVED", "REJECTED", "CLOSED"]))
    )
    applications = apps_result.scalars().all()
    for app in applications:
        if app.stage_deadline and app.stage_deadline < now and not app.is_overdue:
            app.is_overdue = True
            # Create Escalation
            esc = Escalation(
                application_id=app.id,
                trigger_type="STAGE_OVERDUE",
                escalation_level=2,
                assigned_role=UserRole.BUREAU_OFFICER,
                summary=f"Application {app.application_number} exceeded stage deadline for '{app.current_stage}'."
            )
            db.add(esc)
            # Create Notification
            notif = Notification(
                institution_id=app.institution_id,
                application_id=app.id,
                event_type="OVERDUE",
                channel="IN_APP",
                title=f"Application {app.application_number} Overdue",
                message=f"Your application is overdue at stage {app.current_stage}."
            )
            db.add(notif)

    # 2. Check Undertakings Deadlines
    uts_result = await db.execute(
        select(Undertaking).where(Undertaking.status.in_(["NOT_SUBMITTED", "RETURNED_FOR_CORRECTION"]))
    )
    undertakings = uts_result.scalars().all()
    for ut in undertakings:
        days_left = (ut.due_date - now).days
        if days_left < 0 and ut.status != "OVERDUE":
            ut.status = "OVERDUE"
            esc = Escalation(
                undertaking_id=ut.id,
                trigger_type="COMPLIANCE_OVERDUE",
                escalation_level=1,
                assigned_role=UserRole.REGIONAL_OFFICER,
                summary=f"Undertaking {ut.undertaking_code} '{ut.condition_title}' is overdue."
            )
            db.add(esc)
        elif 0 <= days_left <= 7:
            # Advance reminder
            notif = Notification(
                institution_id=ut.institution_id,
                event_type="UNDERTAKING_DEADLINE_APPROACHING",
                channel="IN_APP",
                title=f"Compliance Due in {days_left} days",
                message=f"Undertaking '{ut.condition_title}' is due on {ut.due_date.strftime('%d-%b-%Y')}."
            )
            db.add(notif)

    # 3. Check Document Validity & Expiry
    docs_result = await db.execute(select(Document))
    documents = docs_result.scalars().all()
    for doc in documents:
        if doc.expiry_date:
            days_until_expiry = (doc.expiry_date - now).days
            if days_until_expiry < 0:
                doc.validity_status = "EXPIRED"
            elif days_until_expiry <= 30:
                doc.validity_status = "EXPIRING_SOON_30"
            elif days_until_expiry <= 60:
                doc.validity_status = "EXPIRING_SOON_60"
            elif days_until_expiry <= 90:
                doc.validity_status = "EXPIRING_SOON_90"
            else:
                doc.validity_status = "VALID"

    await db.commit()
