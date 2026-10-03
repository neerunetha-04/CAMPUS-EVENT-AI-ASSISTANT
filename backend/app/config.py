import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent # /backend
ROOT_DIR = BASE_DIR.parent
DATA_DIR = ROOT_DIR / "data"
UPLOAD_DIR = DATA_DIR / "documents"
DATABASE_DIR = DATA_DIR / "database"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_DB_FILE = (DATABASE_DIR / "campusflow.db").resolve().as_posix()
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_FILE}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusFlow - Campus Event Planning Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Absolute Database URL so it resolves properly from any CWD
    DATABASE_URL: str = DEFAULT_DB_URL
    
    # LLM Settings (optional - app operates in grounded mode with fallback)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    
    class Config:
        env_file = ROOT_DIR / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# If the env file provided a relative sqlite path, resolve it to absolute
if settings.DATABASE_URL.startswith("sqlite:///") and "./data/" in settings.DATABASE_URL:
    settings.DATABASE_URL = DEFAULT_DB_URL
