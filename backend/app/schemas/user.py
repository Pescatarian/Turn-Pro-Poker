from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import SubscriptionTier


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    display_name: Optional[str] = Field(None, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    display_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    """Schema for user response - never expose password."""
    id: int
    email: str
    display_name: Optional[str]
    is_active: bool
    is_verified: bool
    subscription_tier: SubscriptionTier
    subscription_expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
