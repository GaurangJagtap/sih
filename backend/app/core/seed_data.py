import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    User, Institution, WorkflowRoute, Application, StageHistory,
    Observation, EVCRecord, Undertaking, Document, Notification,
    Escalation, CallLog, FollowUpTask, AuditEvent, UserRole
)
from app.workflow.engine import DEFAULT_ROUTES

async def seed_all_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[AICTE Seed] Creating Workflow Routes...")
        route_map = {}
        for r_data in DEFAULT_ROUTES:
            route = WorkflowRoute(
                route_code=r_data["route_code"],
                name=r_data["name"],
                description=r_data["description"],
                version=r_data["version"],
                stages_config=r_data["stages_config"]
            )
            db.add(route)
            await db.flush()
            route_map[r_data["route_code"]] = route

        print("[AICTE Seed] Creating 8 Fictional Institutions...")
        institutions_data = [
            ("AICTE-1-000109", "Sunrise Institute of Technology", "Western", "Maharashtra", "Pune", "Dr. Rajesh Sharma", "principal@sunrise.edu.in", "+919822011223"),
            ("AICTE-1-000214", "Apex Institute of Engineering & Management", "Northern", "Delhi", "New Delhi", "Prof. Sunita Verma", "director@apexdelhi.edu.in", "+919811234567"),
            ("AICTE-1-000388", "Royal College of Pharmacy & Research", "Southern", "Karnataka", "Bengaluru", "Dr. K. S. Rao", "principal@royalpharm.edu.in", "+919845112233"),
            ("AICTE-1-000492", "Vanguard Polytechnic & Technology", "Western", "Gujarat", "Ahmedabad", "Prof. Hiren Patel", "head@vanguardtech.edu.in", "+919825123456"),
            ("AICTE-1-000571", "National Institute of Advanced Architecture", "Central", "Madhya Pradesh", "Bhopal", "Ar. Meera Saxena", "dean@niaa.edu.in", "+919826334455"),
            ("AICTE-1-000629", "Heritage Institute of Technology & AI", "Eastern", "West Bengal", "Kolkata", "Dr. Amitava Roy", "director@heritagekolkata.edu.in", "+919831998877"),
            ("AICTE-1-000780", "Evergreen School of Management", "Southern", "Tamil Nadu", "Chennai", "Dr. Lakshmi Raman", "dean@evergreenmgmt.edu.in", "+919840223344"),
            ("AICTE-1-000895", "Galaxy Institute of Science & Technology", "Northern", "Uttar Pradesh", "Lucknow", "Prof. Vivek Mishra", "principal@galaxyst.edu.in", "+919839445566")
        ]

        inst_entities = []
        for pid, name, reg, st, ct, cname, cmail, cph in institutions_data:
            inst = Institution(
                aicte_permanent_id=pid,
                name=name,
                region=reg,
                state=st,
                city=ct,
                address=f"Campus Plot {pid[-3:]}, Sector 4, {ct}, {st}",
                contact_person=cname,
                contact_email=cmail,
                contact_phone=cph,
                institution_type="Engineering & Technology"
            )
            db.add(inst)
            await db.flush()
            inst_entities.append(inst)

        print("[AICTE Seed] Creating Standard Demonstration Users...")
        # Password for all demo accounts: 'Demo@1234'
        demo_pwd_hash = get_password_hash("Demo@1234")

        users_data = [
            ("admin@aicte.gov.in", "System Administrator", UserRole.ADMIN, None, None),
            ("ro.western@aicte.gov.in", "Shri Anand Kulkarni (RO-West)", UserRole.REGIONAL_OFFICER, "Western", None),
            ("ro.northern@aicte.gov.in", "Dr. Neha Kapoor (RO-North)", UserRole.REGIONAL_OFFICER, "Northern", None),
            ("bureau.approvals@aicte.gov.in", "Dr. V. K. Malhotra (Bureau Officer)", UserRole.BUREAU_OFFICER, None, None),
            ("evc.committee@aicte.gov.in", "Prof. R. C. Mathur (EVC Chairman)", UserRole.EVC_COMMITTEE, None, None),
            ("senior.authority@aicte.gov.in", "Member Secretary (AICTE HQ)", UserRole.SENIOR_AUTHORITY, None, None),
            ("institution.sunrise@aicte.gov.in", "Sunrise Institute Registrar", UserRole.INSTITUTION, "Western", inst_entities[0].id),
            ("institution.apex@aicte.gov.in", "Apex Institute Director", UserRole.INSTITUTION, "Northern", inst_entities[1].id),
        ]

        for umail, uname, urole, ureg, uinst in users_data:
            user = User(
                email=umail,
                hashed_password=demo_pwd_hash,
                full_name=uname,
                role=urole,
                region=ureg,
                institution_id=uinst
            )
            db.add(user)

        await db.flush()

        print("[AICTE Seed] Creating 25 Realistic Sample Applications Across Workflow Stages...")
        stages_cycle = [
            ("INTAKE", "DRAFT", "ROUTE_A", 0),
            ("SCRUTINY", "UNDER_SCRUTINY", "ROUTE_A", 0),
            ("SCRUTINY", "DEFICIENCY_RETURNED", "ROUTE_A", 0),
            ("SCRUTINY", "RESUBMITTED", "ROUTE_A", 1),
            ("EVC", "AWAITING_EVC", "ROUTE_B", 0),
            ("EVC", "EVC_SCHEDULED", "ROUTE_B", 1),
            ("DECISION", "AWAITING_DECISION", "ROUTE_B", 2),
            ("AWAITING_COMPLIANCE", "CONDITIONALLY_APPROVED", "ROUTE_A", 0),
            ("CLOSED", "APPROVED", "ROUTE_A", 3),
            ("CLOSED", "REJECTED", "ROUTE_C", 4),
            ("SCRUTINY", "UNDER_SCRUTINY", "ROUTE_A", 5),
            ("EVC", "AWAITING_EVC", "ROUTE_B", 6),
            ("DECISION", "AWAITING_DECISION", "ROUTE_C", 7),
            ("AWAITING_COMPLIANCE", "CONDITIONALLY_APPROVED", "ROUTE_B", 1),
            ("SCRUTINY", "UNDER_SCRUTINY", "ROUTE_B", 2),
            ("SCRUTINY", "UNDER_SCRUTINY", "ROUTE_C", 3),
            ("INTAKE", "DRAFT", "ROUTE_B", 4),
            ("EVC", "EVC_SCHEDULED", "ROUTE_B", 5),
            ("CLOSED", "APPROVED", "ROUTE_A", 6),
            ("SCRUTINY", "DEFICIENCY_RETURNED", "ROUTE_B", 7),
            ("AWAITING_COMPLIANCE", "CONDITIONALLY_APPROVED", "ROUTE_A", 2),
            ("DECISION", "AWAITING_DECISION", "ROUTE_B", 3),
            ("EVC", "AWAITING_EVC", "ROUTE_C", 0),
            ("SCRUTINY", "UNDER_SCRUTINY", "ROUTE_A", 4),
            ("CLOSED", "APPROVED", "ROUTE_B", 5),
        ]

        app_entities = []
        for i, (stg, stus, rcode, inst_idx) in enumerate(stages_cycle):
            inst = inst_entities[inst_idx]
            route = route_map[rcode]
            is_over = (i % 5 == 1) # realistic overdue distribution
            app = Application(
                application_number=f"AICTE-2026-{inst.region[:3].upper()}-{1001 + i}",
                institution_id=inst.id,
                workflow_route_id=route.id,
                route_version=1,
                application_type="Extension of Approval (EoA)" if i % 2 == 0 else "Increase in Intake",
                academic_year="2026-2027",
                current_stage=stg,
                status=stus,
                region=inst.region,
                submitted_at=datetime.utcnow() - timedelta(days=15 - (i % 10)),
                stage_deadline=datetime.utcnow() - timedelta(days=2) if is_over else datetime.utcnow() + timedelta(days=8),
                is_overdue=is_over,
                form_data={
                    "course_name": "B.Tech Computer Science & AI" if i % 2 == 0 else "B.Tech Electronics & VLSI",
                    "intake_capacity": 180 if i % 3 == 0 else 120,
                    "faculty_count": 32 if i % 3 == 0 else 24,
                    "campus_area_acres": 12.5
                }
            )
            db.add(app)
            await db.flush()
            app_entities.append(app)

            # Stage history
            hist = StageHistory(
                application_id=app.id,
                from_stage="INTAKE" if stg != "INTAKE" else None,
                to_stage=stg,
                action=stus,
                actor_name="AICTE Official" if stg != "INTAKE" else inst.contact_person,
                actor_role=UserRole.REGIONAL_OFFICER if stg != "INTAKE" else UserRole.INSTITUTION,
                remarks=f"Transitioned to {stg} state: {stus}"
            )
            db.add(hist)

            # If deficiency returned
            if stus == "DEFICIENCY_RETURNED":
                obs = Observation(
                    application_id=app.id,
                    created_by_id="system-officer",
                    stage="SCRUTINY",
                    deficiency_category="Land Lease & Encumbrance",
                    details="Certified Land Lease deed renewal certificate missing for Campus Block B.",
                    is_resolved=False
                )
                db.add(obs)

        print("[AICTE Seed] Creating Scheduled EVC Records...")
        evc_cases = [a for a in app_entities if "EVC" in a.current_stage or a.status == "EVC_SCHEDULED"]
        for j, ea in enumerate(evc_cases):
            evc_rec = EVCRecord(
                application_id=ea.id,
                scheduled_date=datetime.utcnow() + timedelta(days=3 + j * 2),
                committee_members=[
                    {"name": "Prof. R. C. Mathur", "designation": "EVC Chairman (IIT Bombay)"},
                    {"name": "Dr. Sunita Deshmukh", "designation": "Subject Expert (COEP Pune)"}
                ],
                status="SCHEDULED" if j > 0 else "OVERDUE",
                deadline=datetime.utcnow() + timedelta(days=5),
                is_overdue=(j == 0),
                report_summary="EVC panel configured and physical inspection itinerary confirmed."
            )
            db.add(evc_rec)

        print("[AICTE Seed] Creating Time-Bound Undertakings...")
        for k, ut_app in enumerate(app_entities[:8]):
            ut = Undertaking(
                undertaking_code=f"UT-2026-{100 + k}",
                application_id=ut_app.id,
                institution_id=ut_app.institution_id,
                condition_title="Fire Safety NOC & Evacuation Plan" if k % 2 == 0 else "Faculty Cadre Ratio Rectification",
                condition_description="Submission of updated certified Fire Safety NOC issued by Municipal Fire Department within 60 days.",
                required_evidence_type="Fire Safety NOC",
                due_date=datetime.utcnow() + timedelta(days=12 - k * 3),
                status="NOT_SUBMITTED" if k > 2 else ("SUBMITTED" if k == 2 else "VERIFIED"),
                evidence_filename="Fire_Safety_NOC_Pune_2026.pdf" if k <= 2 else None,
                submission_timestamp=datetime.utcnow() - timedelta(days=2) if k <= 2 else None
            )
            db.add(ut)

        print("[AICTE Seed] Creating Prescribed Documents & Lease Tracking...")
        for m, inst in enumerate(inst_entities):
            # Land lease deed
            lease_expiry = datetime.utcnow() + timedelta(days=25 if m == 0 else (55 if m == 1 else 300))
            doc1 = Document(
                institution_id=inst.id,
                document_type="Registered Land Lease Deed",
                display_name=f"{inst.name} - 30 Year Registered Land Lease",
                file_path="./storage/prescribed_docs/sample_lease.pdf",
                file_size_bytes=452100,
                issue_date=datetime.utcnow() - timedelta(days=10950),
                expiry_date=lease_expiry,
                validity_status="EXPIRING_SOON_30" if m == 0 else ("EXPIRING_SOON_60" if m == 1 else "VALID"),
                verification_status="VERIFIED"
            )
            db.add(doc1)

            # Fire NOC
            doc2 = Document(
                institution_id=inst.id,
                document_type="Fire Safety Certificate / NOC",
                display_name=f"{inst.name} - Annual Fire NOC",
                file_path="./storage/prescribed_docs/sample_fire_noc.pdf",
                file_size_bytes=221500,
                issue_date=datetime.utcnow() - timedelta(days=340),
                expiry_date=datetime.utcnow() + timedelta(days=25 if m % 2 == 0 else 85),
                validity_status="EXPIRING_SOON_30" if m % 2 == 0 else "EXPIRING_SOON_90",
                verification_status="VERIFIED"
            )
            db.add(doc2)

        print("[AICTE Seed] Creating Realistic AI Voice Call Logs & Follow-up Tasks...")
        sample_call = CallLog(
            institution_id=inst_entities[0].id,
            application_id=app_entities[0].id,
            contact_phone=inst_entities[0].contact_phone,
            contact_person=inst_entities[0].contact_person,
            provider_mode="SIMULATED",
            call_status="COMPLETED",
            language="English",
            recognized_intent="NEEDS_MORE_TIME",
            transcript_text=(
                "[AI Assistant]: Namaskar. This is the automated AI compliance reminder assistant from AICTE. "
                "Am I speaking with Dr. Rajesh Sharma from Sunrise Institute of Technology? We are calling regarding your pending Fire Safety NOC.\n"
                "[Representative]: Yes, Dr. Sharma speaking. We have applied for renewal at the Municipal Corporation, I will submit the document on Friday."
            ),
            ai_summary=(
                "[AI Voice Reminder Record - Simulated Call]\n"
                "Institution: Sunrise Institute of Technology\n"
                "Representative Stated: \"I will submit the document on Friday.\"\n"
                "Classified Intent: NEEDS_MORE_TIME\n"
                "Extracted Promised Date: Upcoming Friday\n"
                "Regulatory Safeguard: Verification remains pending until authorized officer approval."
            ),
            promised_date=datetime.utcnow() + timedelta(days=4),
            follow_up_task_created=True,
            follow_up_task_details="Review extension requested during AI call. Representative promised submission by Friday."
        )
        db.add(sample_call)
        await db.flush()

        task = FollowUpTask(
            call_log_id=sample_call.id,
            institution_id=sample_call.institution_id,
            application_id=sample_call.application_id,
            task_type="AI_CALL_FOLLOW_UP",
            task_description="Review extension requested during AI call. Representative promised submission by Friday.",
            due_date=sample_call.promised_date,
            assigned_role=UserRole.REGIONAL_OFFICER
        )
        db.add(task)

        print("[AICTE Seed] Creating Active Escalation & Notification Records...")
        esc = Escalation(
            application_id=app_entities[1].id,
            trigger_type="STAGE_OVERDUE",
            escalation_level=2,
            assigned_role=UserRole.BUREAU_OFFICER,
            summary=f"Application {app_entities[1].application_number} exceeded statutory scrutiny review duration."
        )
        db.add(esc)

        notif = Notification(
            institution_id=inst_entities[0].id,
            event_type="UNDERTAKING_DEADLINE_APPROACHING",
            title="Advance Reminder: Compliance Due in 7 Days",
            message="Your undertaking for Fire Safety NOC is due on 02-Nov-2026. Please upload evidence on the portal."
        )
        db.add(notif)

        await db.commit()
        print("[AICTE Seed] Successfully completed database seeding with all fictional demonstration data!")

if __name__ == "__main__":
    asyncio.run(seed_all_data())
