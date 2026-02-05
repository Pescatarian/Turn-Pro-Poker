"""User management endpoints.

WHY: Users need to view and update their profile,
and check their subscription status.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile."""
    return current_user


@router.get("/me/subscription")
async def get_subscription_status(
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription details."""
    return {
        "tier": current_user.subscription_tier,
        "is_active": current_user.is_subscription_active(),
        "expires_at": current_user.subscription_expires_at
    }
