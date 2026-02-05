"""Authentication request/response schemas."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration data."""
    email: EmailStr
    password: str
    username: str | None = None


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request schema."""
    refresh_token: str
