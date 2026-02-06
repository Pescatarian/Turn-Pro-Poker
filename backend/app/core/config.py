from pydantic_settings import BaseSettings
from typing import Optional, List
from pathlib import Path

# Get the absolute path to the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Turn Pro Poker"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/poker.db"
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    FREE_SESSION_LIMIT: int = 50
    PREMIUM_SESSION_LIMIT: int = 500
    PRO_SESSION_LIMIT: int = -1
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
