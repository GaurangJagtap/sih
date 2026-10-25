import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE Approval Workflow Automation & Compliance System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite+aiosqlite:///./aicte_workflow.db"
    SECRET_KEY: str = "sih26262-aicte-workflow-production-grade-secret-key-32bytes-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    STORAGE_LOCAL_DIR: str = "./storage"
    SIMULATE_VOICE_CALLS: bool = True
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
