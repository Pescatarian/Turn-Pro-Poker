from datetime import datetime, timedelta
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.user import User, SubscriptionTier

router = APIRouter()

@router.post("/revenuecat")
async def revenuecat_webhook(
    request: Request,
    payload: Dict[str, Any],
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    # Verify auth header if secret is set (skipping for now or using Env var)
    # event = payload.get("event", {}) # RevenueCat v2 format
    
    # Simple handling for immediate integration
    # Depending on RC webhook version, structure differs.
    # Assuming v2: { "event": { "type": "INITIAL_PURCHASE", "app_user_id": "...", "expiration_at_ms": ... } }
    
    event = payload.get("event")
    if not event:
        # v1 or test?
        return {"status": "ignored"}
        
    event_type = event.get("type")
    app_user_id = event.get("app_user_id")
    expiration_at_ms = event.get("expiration_at_ms")
    
    if not app_user_id:
        raise HTTPException(status_code=400, detail="Missing app_user_id")

    # Find user
    # Try by revenuecat_app_user_id first
    query = select(User).where(User.revenuecat_app_user_id == app_user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    # If not found, try by ID if app_user_id acts as ID (if we set it that way)
    if not user and app_user_id.isdigit():
        query = select(User).where(User.id == int(app_user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
    if not user:
        # If user not found, we can't update. 
        # In some flows, we might just log this.
        return {"status": "user_not_found"}

    # Update logic
    if event_type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]:
        # Update subscription
        # Determine tier from product_id?
        product_id = event.get("product_id")
        new_tier = SubscriptionTier.PRO # Default to PRO for now, logic can be refined
        
        if "premium" in product_id:
            new_tier = SubscriptionTier.PREMIUM
            
        expires_at = None
        if expiration_at_ms:
            expires_at = datetime.fromtimestamp(expiration_at_ms / 1000.0)
            
        user.subscription_tier = new_tier
        user.subscription_expires_at = expires_at
        user.is_active = True # Ensure active
        
        if not user.revenuecat_app_user_id:
            user.revenuecat_app_user_id = app_user_id
            
        await db.commit()
        
    elif event_type in ["CANCELLATION", "EXPIRATION"]:
        # Don't immediately downgrade on cancellation (user keeps access until expiry)
        # On Expiration, we downgrade
        if event_type == "EXPIRATION":
            user.subscription_tier = SubscriptionTier.FREE
            user.subscription_expires_at = None # Or keep last expiry
            await db.commit()
            
    return {"status": "success"}
