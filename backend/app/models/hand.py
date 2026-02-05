"""Hand history model for the replayer feature.

WHY: Storing hand histories allows users to review and analyze
specific hands. JSON fields provide flexibility for complex hand data.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Hand(Base):
    """Poker hand history model."""
    __tablename__ = "hands"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("sessions.id"),
        nullable=True,
        index=True
    )
    
    # Hand metadata
    stakes: Mapped[str] = mapped_column(String(50))  # e.g., "$1/$2"
    
    # Hand data stored as JSON for flexibility
    # Contains: hero_cards, community_cards, actions, seat_data, pot
    hand_data: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="hands")
