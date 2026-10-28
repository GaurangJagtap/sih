from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, applications, compliance, evc, documents, voice, reports, notifications, routes

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Integrated AICTE Approval Workflow Automation, Compliance Monitoring, and AI Voice Alert Management System"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(compliance.router, prefix=settings.API_V1_STR)
app.include_router(evc.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(routes.router, prefix=settings.API_V1_STR)

import os
from app.core.seed_data import seed_all_data

@app.on_event("startup")
async def startup_event():
    db_path = "aicte_workflow.db"
    if not os.path.exists(db_path) or os.path.getsize(db_path) == 0:
        print("[Startup] Initializing and seeding demo database...")
        await seed_all_data()

@app.get("/")
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "regulatory_notice": "Administrative automation support platform. Regulatory decisions remain with authorized human officials."
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

