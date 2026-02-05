"""Authentication schemas for Turn Pro Poker."""
from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request schema."""
    refresh_token: str
