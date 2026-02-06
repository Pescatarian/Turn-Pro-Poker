from __future__ import annotations

from datetime import datetime
import uuid
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    game_type: Mapped[str] = mapped_column(String(50), default="cash")
    stakes: Mapped[str] = mapped_column(String(20))
    small_blind: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    big_blind: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    buy_in: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    cash_out: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    table_info: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    hours_played: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @property
    def profit(self) -> Decimal:
        return self.cash_out - self.buy_in

    @property
    def hourly_rate(self) -> Optional[Decimal]:
        if self.hours_played and self.hours_played > 0:
            return self.profit / self.hours_played
        return None

    @property
    def bb_per_100(self) -> Optional[Decimal]:
        if self.hours_played and self.hours_played > 0 and self.big_blind > 0:
            hands_estimated = self.hours_played * 30
            bb_won = self.profit / self.big_blind
            return (bb_won / hands_estimated) * 100
        return None
