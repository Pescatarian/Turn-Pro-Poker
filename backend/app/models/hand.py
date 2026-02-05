from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Hand(Base):
    __tablename__ = "hands"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    
    pot: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    street: Mapped[str] = mapped_column(String(20), default="preflop")
    actions: Mapped[dict] = mapped_column(JSON, default=list)
    hero_cards: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    community_cards: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="hands")
