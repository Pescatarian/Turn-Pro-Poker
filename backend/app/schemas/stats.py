"""Statistics schemas for analytics responses."""
from decimal import Decimal
from pydantic import BaseModel


class StatsResponse(BaseModel):
    """Comprehensive stats response."""
    total_sessions: int
    winning_sessions: int
    losing_sessions: int
    total_profit: Decimal
    net_profit: Decimal
    total_tips: Decimal
    total_expenses: Decimal
    total_hours: Decimal
    avg_session_hours: Decimal
    hourly_rate: Decimal
    net_hourly_rate: Decimal
    bb_per_100: Decimal
    net_bb_per_100: Decimal
    win_rate_percentage: Decimal
    current_bankroll: Decimal
    initial_bankroll: Decimal
