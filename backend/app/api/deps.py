"""API Dependencies for authentication and authorization.

WHY: Centralized dependency injection for consistent auth across all endpoints.
Handles token validation, user lookup, and subscription tier checking.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_token
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, SubscriptionTier

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Validate access token and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id: int = int(payload.get("sub"))
    if user_id is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_premium_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure user has premium or pro subscription."""
    if current_user.subscription_tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required for this feature"
        )
    
    if not current_user.is_subscription_active():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription has expired"
        )
    
    return current_user


async def get_pro_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure user has pro subscription."""
    if current_user.subscription_tier != SubscriptionTier.PRO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required for this feature"
        )
    
    if not current_user.is_subscription_active():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription has expired"
        )
    
    return current_user


async def validate_last_pulled_at(
    last_pulled_at: Optional[int] = Query(
        None, 
        ge=0, 
        description="Timestamp of last sync in milliseconds (WatermelonDB format)"
    )
) -> Optional[datetime]:
    """
    Validate and convert last_pulled_at timestamp from WatermelonDB.
    Returns datetime object or None.
    """
    if last_pulled_at is None or last_pulled_at == 0:
        return None
        
    try:
        # WatermelonDB sends timestamps in milliseconds
        # Treat as UTC
        dt = datetime.fromtimestamp(last_pulled_at / 1000.0, tz=timezone.utc)
        
        # Sanity check: timestamp shouldn't be significantly in the future
        # allowing 5 minutes for clock skew
        if dt > datetime.now(timezone.utc) + timedelta(minutes=5):
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST, 
                 detail="Invalid timestamp: future date detected"
             )
        return dt
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid timestamp format"
        )
