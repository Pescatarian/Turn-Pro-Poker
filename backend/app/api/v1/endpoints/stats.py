"""Statistics and analytics endpoints."""
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.user import User
from app.models.session import Session
from app.models.transaction import Transaction, TransactionType
from app.schemas.stats import StatsResponse
from app.api.deps import get_current_user

router = APIRouter()

HANDS_PER_HOUR = 25


@router.get("/", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive statistics."""
    result = await db.execute(select(Session).where(Session.user_id == current_user.id))
    sessions = result.scalars().all()
    
    deposits_result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == current_user.id, Transaction.transaction_type == TransactionType.DEPOSIT)
    )
    total_deposits = deposits_result.scalar() or Decimal("0")
    
    withdrawals_result = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == current_user.id, Transaction.transaction_type == TransactionType.WITHDRAWAL)
    )
    total_withdrawals = withdrawals_result.scalar() or Decimal("0")
    
    initial_bankroll = total_deposits - total_withdrawals
    
    if not sessions:
        return StatsResponse(
            total_sessions=0,
            winning_sessions=0,
            losing_sessions=0,
            total_profit=Decimal("0"),
            net_profit=Decimal("0"),
            total_tips=Decimal("0"),
            total_expenses=Decimal("0"),
            total_hours=Decimal("0"),
            avg_session_hours=Decimal("0"),
            hourly_rate=Decimal("0"),
            net_hourly_rate=Decimal("0"),
            bb_per_100=Decimal("0"),
            net_bb_per_100=Decimal("0"),
            win_rate_percentage=Decimal("0"),
            current_bankroll=initial_bankroll,
            initial_bankroll=initial_bankroll
        )
    
    total_profit = sum(s.profit for s in sessions)
    total_tips = sum(s.tips for s in sessions)
    total_expenses = sum(s.expenses for s in sessions)
    net_profit = total_profit - total_tips - total_expenses
    total_hours = sum(s.hours_played for s in sessions)
    total_hands = total_hours * HANDS_PER_HOUR
    
    total_bb_won = sum(s.bb_won for s in sessions)
    tips_in_bb = sum(s.tips / s.big_blind for s in sessions if s.big_blind > 0)
    expenses_in_bb = sum(s.expenses / s.big_blind for s in sessions if s.big_blind > 0)
    
    bb_per_100 = (total_bb_won / total_hands * 100) if total_hands > 0 else Decimal("0")
    net_bb_per_100 = ((total_bb_won - tips_in_bb - expenses_in_bb) / total_hands * 100) if total_hands > 0 else Decimal("0")
    
    winning_sessions = sum(1 for s in sessions if s.profit > 0)
    losing_sessions = sum(1 for s in sessions if s.profit < 0)
    
    return StatsResponse(
        total_sessions=len(sessions),
        winning_sessions=winning_sessions,
        losing_sessions=losing_sessions,
        total_profit=total_profit,
        net_profit=net_profit,
        total_tips=total_tips,
        total_expenses=total_expenses,
        total_hours=total_hours,
        avg_session_hours=total_hours / len(sessions) if sessions else Decimal("0"),
        hourly_rate=total_profit / total_hours if total_hours > 0 else Decimal("0"),
        net_hourly_rate=net_profit / total_hours if total_hours > 0 else Decimal("0"),
        bb_per_100=bb_per_100,
        net_bb_per_100=net_bb_per_100,
        win_rate_percentage=Decimal(winning_sessions / len(sessions) * 100) if sessions else Decimal("0"),
        current_bankroll=initial_bankroll + net_profit,
        initial_bankroll=initial_bankroll
    )
