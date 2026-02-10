from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import hmac
import hashlib
import os

from app.db.session import get_db
from app.models.user import User, SubscriptionTier

router = APIRouter()

# RevenueCat webhook secret (configure in Render environment)
WEBHOOK_SECRET = os.getenv("REVENUECAT_WEBHOOK_SECRET", "")


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify webhook signature from RevenueCat."""
    if not WEBHOOK_SECRET:
        print("⚠️ WARNING: REVENUECAT_WEBHOOK_SECRET not configured - skipping verification")
        return True
    
    expected = hmac.new(
        WEEKEND_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


@router.post("/revenuecat")
async def revenuecat_webhook(
    request: Request,
    payload: Dict[str, Any],
    authorization: str = Header(None),
    x_revenuecat_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle RevenueCat webhook events.
    
    Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, PRODUCT_CHANGE
    Docs: https://www.revenuecat.com/docs/webhooks
    """
    # Verify signature (if provided)
    if x_revenuecat_signature:
        body = await request.body()
        if not verify_webhook_signature(body, x_revenuecat_signature):
            print("❌ Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    event = payload.get("event")
    if not event:
        print("⚠️ No event in payload")
        return {"status": "ignored"}
        
    event_type = event.get("type")
    app_user_id = event.get("app_user_id")
    product_id = event.get("product_id", "")
    expiration_at_ms = event.get("expiration_at_ms")
    
    print(f"📩 RevenueCat Event: {event_type} | User: {app_user_id} | Product: {product_id}")
    
    if not app_user_id:
        raise HTTPException(status_code=400, detail="Missing app_user_id")

    # Find user by revenuecat_app_user_id first
    query = select(User).where(User.revenuecat_app_user_id == app_user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    # If not found, try by ID (if app_user_id is numeric)
    if not user and app_user_id.isdigit():
        query = select(User).where(User.id == int(app_user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
    if not user:
        print(f"❌ User not found: {app_user_id}")
        return {"status": "user_not_found"}

    # Determine tier from product_id
    new_tier = SubscriptionTier.FREE
    product_lower = product_id.lower()
    if "pro" in product_lower:
        new_tier = SubscriptionTier.PRO
    elif "premium" in product_lower:
        new_tier = SubscriptionTier.PREMIUM
    
    # Handle event types
    if event_type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"]:
        # Subscription active
        expires_at = None
        if expiration_at_ms:
            expires_at = datetime.fromtimestamp(expiration_at_ms / 1000.0)
            
        user.subscription_tier = new_tier
        user.subscription_expires_at = expires_at
        user.is_active = True
        
        if not user.revenuecat_app_user_id:
            user.revenuecat_app_user_id = app_user_id
            
        await db.commit()
        print(f"✅ Updated {user.email} to {new_tier.value} (expires: {expires_at})")
        
    elif event_type == "CANCELLATION":
        # Keep tier until expiration
        print(f"⏸️ Subscription cancelled for {user.email}, keeping access until expiry")
        # Don't change tier yet, let EXPIRATION event handle it
        
    elif event_type == "EXPIRATION":
        # Downgrade to free
        user.subscription_tier = SubscriptionTier.FREE
        user.subscription_expires_at = None
        await db.commit()
        print(f"🔻 Downgraded {user.email} to FREE")
            
    return {"status": "success", "user_email": user.email, "tier": user.subscription_tier.value}


@router.get("/revenuecat/test")
async def test_webhook():
    """Test endpoint for webhook verification."""
    return {
        "status": "ok",
        "message": "RevenueCat webhook endpoint is working!",
        "secret_configured": bool(WEBHOOK_SECRET),
    }
