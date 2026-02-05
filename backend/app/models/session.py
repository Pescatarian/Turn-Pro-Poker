"""Poker session model for tracking live poker sessions."""
from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Session(Base):
    """Poker session tracking model."""
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_date: Mapped[date] = mapped_column(Date, index=True)
    location: Mapped[str] = mapped_column(String(255))
    game_type: Mapped[str] = mapped_column(String(50), default="cash")
    small_blind: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1.00"))
    big_blind: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    buy_in: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    cash_out: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    tips: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    expenses: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    hours_played: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @property
    def profit(self) -> Decimal:
        """Calculate raw profit (cash_out - buy_in)."""
        return self.cash_out - self.buy_in

    @property
    def net_profit(self) -> Decimal:
        """Calculate net profit after tips and expenses."""
        return self.profit - self.tips - self.expenses

    @property
    def bb_won(self) -> Decimal:
        """Calculate big blinds won."""
        if self.big_blind == 0:
            return Decimal("0")
        return self.profit / self.big_blind

    @property
    def hourly_rate(self) -> Decimal:
        """Calculate hourly rate ($/hour)."""
        if self.hours_played == 0:
            return Decimal("0")
        return self.profit / self.hours_played

    @property
    def estimated_hands(self) -> int:
        """Estimate hands played (25 hands/hour for live poker)."""
        return int(self.hours_played * 25)
