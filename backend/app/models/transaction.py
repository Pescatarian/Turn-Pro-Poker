"""Bankroll transaction model.

WHY: Separate from sessions to track deposits/withdrawals to the bankroll.
This enables accurate bankroll history independent of session results.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base


class TransactionType(str, enum.Enum):
    """Types of bankroll transactions."""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"


class Transaction(Base):
    """Bankroll transaction model."""
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Transaction details
    transaction_type: Mapped[TransactionType] = mapped_column(
        SQLEnum(TransactionType)
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="transactions")
