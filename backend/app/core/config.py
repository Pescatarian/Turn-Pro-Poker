"""Application configuration.

WHY: Centralized settings management using Pydantic for validation.
Environment variables override defaults for different deployment environments.
"""
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Settings
    PROJECT_NAME: str = "Turn Pro Poker"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./turn_pro_poker.db"
    # For PostgreSQL: "postgresql+asyncpg://user:password@localhost/turn_pro_poker"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]
    
    # Subscription Tiers (configurable, not hardcoded)
    FREE_TIER_SESSION_LIMIT: int = 50
    FREE_TIER_EXPORT_ENABLED: bool = False
    PREMIUM_TIER_SESSION_LIMIT: int = -1  # unlimited
    PREMIUM_TIER_EXPORT_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
