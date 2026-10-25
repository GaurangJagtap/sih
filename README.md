# AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System (SIH26262)

An enterprise-grade regulatory workflow and compliance automation platform built for the **All India Council for Technical Education (AICTE)** under Smart India Hackathon (SIH26262).

The platform coordinates technical institution approval processes, scrutiny reviews, Expert Visit Committee (EVC) scheduling, time-bound conditional undertakings, lease and document validity tracking, officer escalations, and features a standout **AI Multilingual Voice Call Reminder Agent**.

---

## 🏛️ Regulatory Safeguard Principle
> **Critical Statutory Notice:** This platform is an **administrative workflow support and monitoring automation system**. In strict compliance with regulatory standards, the software **never** independently grants, denies, or decides approvals or extensions. All scrutiny observations, recommendations, verifications, and approvals remain strictly with authorized human AICTE officials.

---

## 🚀 Key Features

1. **Dual Specialized Portals:**
   - **Institution Portal:** Create & track EoA / new intake proposals, view deficiency observations, upload rectification evidence, track time-bound undertakings, and view document expiry timelines.
   - **AICTE Administrative Portal:** Role-scoped views for **Regional Officers**, **Bureau Officers**, **EVC Committee Chairs**, **Senior Executive Authorities**, and **System Administrators**.
2. **Configurable Workflow Engine:**
   - Supports custom routes (Route A: Scrutiny Only, Route B: Scrutiny + EVC, Route C: EVC + SAC/SHC Hearing).
   - Enforces permitted stage transitions, role authorizations, mandatory deficiency return reasons, and history audit trails.
3. **Time-Bound Undertakings & Compliance Module:**
   - Distinct separation between institutional evidence submission and authorized officer verification.
   - Formal extension review requests (creates an officer review task rather than auto-granting).
4. **Prescribed Documents & Lease Deed Validity:**
   - Automatic 90, 60, and 30-day advance expiry monitoring.
   - Preserves historical expired/expiring records when renewals are submitted.
5. **AI Multilingual Voice Call Reminder Agent:**
   - Automated outbound reminder calls to registered representatives when email/SMS reminders are unacknowledged.
   - Multi-language pipeline support: **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
   - Parses 9 standard regulatory intents: `SUBMITTED`, `NOT_SUBMITTED`, `NEEDS_MORE_TIME`, `NEEDS_HELP`, `WRONG_PERSON`, `REQUESTS_HUMAN`, `UNCLEAR_RESPONSE`, `CALL_FAILED`, `NO_ANSWER`.
   - Extracts promised submission dates and automatically schedules officer follow-up tasks.
   - Transparent simulation console with zero fake carrier credentials.
6. **Consolidated Real-Time Reporting & Digital Audit Trail:**
   - Recharts visual dashboards computed live from database records.
   - Region-wise pendency distribution and stage ageing analytics.
   - Immutable append-only audit trail logging actors, entities, IP addresses, and timestamps.

---

## 👥 Seed Demo Credentials

All demonstration accounts share the same local test password:
🔑 **Password for all demo accounts:** `Demo@1234`

| Role | Email | Region / Scope | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Institution User** | `institution.sunrise@aicte.gov.in` | Western (Pune) | Sunrise Institute of Technology applications, submissions & proof |
| **Institution User 2** | `institution.apex@aicte.gov.in` | Northern (Delhi) | Apex Institute of Engineering & Management |
| **Regional Officer (RO)** | `ro.western@aicte.gov.in` | Western Region | Regional scrutiny, returning deficiencies, scheduling EVC, verifying evidence |
| **Regional Officer 2** | `ro.northern@aicte.gov.in` | Northern Region | Northern Region scrutiny & inspections |
| **Bureau Officer** | `bureau.approvals@aicte.gov.in` | Central / National | Consolidated pendency monitoring, overdue escalations, approval grant |
| **EVC Committee User** | `evc.committee@aicte.gov.in` | Inspection Panel | Conducting physical inspections, filing committee recommendations |
| **Senior Authority** | `senior.authority@aicte.gov.in` | AICTE Executive HQ | Executive oversight, policy review, high-level escalations |
| **Administrator** | `admin@aicte.gov.in` | System-wide | Route configuration, role assignments, audit logs |

---

## 🛠️ Technology Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (AsyncIO), Pydantic v2, SQLite / PostgreSQL, python-jose (JWT), passlib (Bcrypt), pytest, httpx.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Recharts, Lucide React, Axios.
- **Background Engine:** Async deadline checking, automated escalation creation, document validity alerts.

---

## 💻 Installation and Local Startup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to project root
cd SIH26262

# Activate virtual environment
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux/macOS

# Seed realistic database records (8 institutions, 25 applications, undertakings, documents)
cd backend
python -m app.core.seed_data

# Start backend FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
*Backend API Docs will be available at: http://127.0.0.1:8001/docs*

### 3. Frontend Setup
```bash
cd SIH26262/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
*Frontend Portal will be available at: http://localhost:5173*

---

## 🧪 Testing Core Logic
Run the comprehensive automated pytest suite:
```bash
cd SIH26262/backend
..\venv\Scripts\python.exe -m pytest -v
```

---

## 🏆 SIH Jury Demonstration Script (5-Minute Walkthrough)

1. **Step 1: Sign in with One-Click Demo Role Switcher**
   - Go to `http://localhost:5173/login`.
   - Show the one-click demo switcher buttons for Institution, Regional Officer, Bureau Officer, and Senior Authority.
   - Click **Institution Portal** (`institution.sunrise@aicte.gov.in`).
2. **Step 2: Institution Proposal & Status Register**
   - Inspect the **Sunrise Institute of Technology** dashboard.
   - Point out active applications, pending undertakings, and expiring documents.
   - Click **Applications Register** and click **Submit New Application** using `Route A` or `Route B`.
3. **Step 3: Regional Officer Scrutiny & Deficiency Return**
   - Sign out and click **Regional Officer** (`ro.western@aicte.gov.in`).
   - Open an application under `SCRUTINY` (e.g. `AICTE-2026-WES-1002`).
   - Demonstrate the **Authorized Workflow Action Bar**.
   - Return the application with a mandatory deficiency reason: *"Certified land lease deed renewal certificate missing for Campus Block B."*
   - Sign back in as the institution to show the deficiency observation and submit rectification.
4. **Step 4: EVC Scheduling & Deadline Monitoring**
   - Open **EVC Scheduling & Visits**.
   - Show scheduled visits, committee panels, and overdue inspection alerts.
   - Click **Submit Report** on an inspection to enter committee recommendations (`RECOMMENDED` / `DEFICIENT`).
5. **Step 5: Time-Bound Undertakings & Lease Expiry Tracking**
   - Open **Undertakings & Compliance**.
   - Show how institutions upload PDF evidence, and how Regional Officers verify or return evidence with remarks.
   - Demonstrate **Ask Extension**: note that requesting an extension records a review task rather than auto-granting approval.
   - Open **Prescribed Documents & Leases** to show automatic 90d, 60d, and 30d expiry threshold tags.
6. **Step 6: The Innovation — AI Voice Call Reminder Agent**
   - Open **AI Voice Reminder Agent** (`/voice-agent`).
   - Click **Trigger Automated Call** and select *Sunrise Institute of Technology*.
   - Click **Connect AI Voice Session**.
   - Click the test button: `"I will submit the document on Friday"`.
   - Observe the agent in real time:
     - Correctly recognizes intent: `NEEDS_MORE_TIME`.
     - Extracts promised date: upcoming Friday.
     - Generates an auditable, case-linked summary.
     - Automatically creates an officer follow-up task.
7. **Step 7: Executive Oversight & Audit Trail**
   - Log in as **Senior Authority** or **Bureau Officer**.
   - Review live Recharts stage distribution and regional workload charts.
   - Open **Escalations & Overdue** to inspect multi-tier officer escalations and the append-only digital audit trail.
