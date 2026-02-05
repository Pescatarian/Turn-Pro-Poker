"""Statistics schemas for analytics responses.

WHY: Pre-calculated stats reduce client-side computation
and ensure consistent calculations across platforms.
"""
from decimal import Decimal
from pydantic import BaseModel


class StatsResponse(BaseModel):
    """Comprehensive stats response."""
    # Session counts
    total_sessions: int
    winning_sessions: int
    losing_sessions: int
    
    # Financial totals
    total_profit: Decimal
    net_profit: Decimal  # After tips & expenses
    total_tips: Decimal
    total_expenses: Decimal
    
    # Time tracking
    total_hours: Decimal
    avg_session_hours: Decimal
    
    # Performance metrics
    hourly_rate: Decimal
    net_hourly_rate: Decimal
    bb_per_100: Decimal
    net_bb_per_100: Decimal
    win_rate_percentage: Decimal
    
    # Bankroll
    current_bankroll: Decimal
    initial_bankroll: Decimal
