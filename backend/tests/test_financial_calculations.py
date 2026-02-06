import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from app.models.session import Session
from app.models.user import User, SubscriptionTier

@pytest.mark.asyncio
async def test_session_profit():
    # Test positive profit
    s1 = Session(buy_in=Decimal("100.00"), cash_out=Decimal("150.00"))
    assert s1.profit == Decimal("50.00")
    
    # Test negative profit
    s2 = Session(buy_in=Decimal("100.00"), cash_out=Decimal("0.00"))
    assert s2.profit == Decimal("-100.00")
    
    # Test break even
    s3 = Session(buy_in=Decimal("100.00"), cash_out=Decimal("100.00"))
    assert s3.profit == Decimal("0.00")

@pytest.mark.asyncio
async def test_session_hourly_rate():
    # Normal case
    s1 = Session(
        buy_in=Decimal("100"), 
        cash_out=Decimal("200"), 
        hours_played=Decimal("2.0")
    )
    # Profit 100 / 2 hours = 50/hr
    assert s1.hourly_rate == Decimal("50.00")
    
    # Zero hours (avoid division by zero if handled, usually returns None)
    s2 = Session(
        buy_in=Decimal("100"), 
        cash_out=Decimal("200"), 
        hours_played=Decimal("0")
    )
    assert s2.hourly_rate is None
    
    # None hours
    s3 = Session(buy_in=Decimal("100"), cash_out=Decimal("200"), hours_played=None)
    assert s3.hourly_rate is None

@pytest.mark.asyncio
async def test_session_bb_per_100():
    # Profit 200, BB 2 -> 100 BBs won.
    # Hours 2 -> ~60 hands (est 30 hands/hr)
    # BB/100 = (100 BB / 60 hands) * 100 = 166.66...
    
    s1 = Session(
        buy_in=Decimal("0"),
        cash_out=Decimal("200"),
        big_blind=Decimal("2.0"),
        hours_played=Decimal("2.0")
    )
    # Profit = 200
    # BB won = 100
    # Est hands = 60
    # 100/60 * 100 = 166.666
    
    bb_100 = s1.bb_per_100
    assert bb_100 is not None
    assert round(bb_100, 2) == Decimal("166.67")
    
    # Zero BB
    s2 = Session(
        buy_in=Decimal("0"),
        cash_out=Decimal("200"),
        big_blind=Decimal("0"), # Should not happen usually
        hours_played=Decimal("2.0")
    )
    assert s2.bb_per_100 is None

@pytest.mark.asyncio
async def test_user_subscription_active():
    # Free is always active
    u_free = User(subscription_tier=SubscriptionTier.FREE)
    assert u_free.is_subscription_active() is True
    
    # Pro with future expiry
    future = datetime.utcnow() + timedelta(days=30)
    u_pro = User(
        subscription_tier=SubscriptionTier.PRO,
        subscription_expires_at=future
    )
    assert u_pro.is_subscription_active() is True
    
    # Pro with past expiry
    past = datetime.utcnow() - timedelta(days=1)
    u_expired = User(
        subscription_tier=SubscriptionTier.PRO,
        subscription_expires_at=past
    )
    assert u_expired.is_subscription_active() is False
    
    # Pro with no expiry (invalid state usually, should be False)
    u_invalid = User(
        subscription_tier=SubscriptionTier.PRO,
        subscription_expires_at=None
    )
    assert u_invalid.is_subscription_active() is False
