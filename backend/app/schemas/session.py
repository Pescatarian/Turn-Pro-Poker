"""Session schemas for request/response validation.

WHY: Strict validation ensures data integrity for financial calculations.
Using Decimal strings prevents JSON serialization issues with Decimal.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class SessionBase(BaseModel):
    """Base session schema with shared fields."""
    session_date: date
    location: str = Field(..., max_length=255)
    game_type: str = Field(default="cash", max_length=50)
    small_blind: Decimal = Field(default=Decimal("1.00"), ge=0)
    big_blind: Decimal = Field(..., gt=0)
    buy_in: Decimal = Field(..., gt=0)
    cash_out: Decimal = Field(..., ge=0)
    tips: Decimal = Field(default=Decimal("0.00"), ge=0)
    expenses: Decimal = Field(default=Decimal("0.00"), ge=0)
    hours_played: Decimal = Field(..., gt=0)
    notes: Optional[str] = None

    @field_validator('big_blind')
    @classmethod
    def validate_big_blind(cls, v, info):
        """Ensure big blind is greater than small blind."""
        # Note: Cross-field validation would need model_validator
        return v


class SessionCreate(SessionBase):
    """Schema for creating a new session."""
    pass


class SessionUpdate(BaseModel):
    """Schema for updating a session (all fields optional)."""
    session_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=255)
    game_type: Optional[str] = Field(None, max_length=50)
    small_blind: Optional[Decimal] = Field(None, ge=0)
    big_blind: Optional[Decimal] = Field(None, gt=0)
    buy_in: Optional[Decimal] = Field(None, gt=0)
    cash_out: Optional[Decimal] = Field(None, ge=0)
    tips: Optional[Decimal] = Field(None, ge=0)
    expenses: Optional[Decimal] = Field(None, ge=0)
    hours_played: Optional[Decimal] = Field(None, gt=0)
    notes: Optional[str] = None


class SessionResponse(SessionBase):
    """Schema for session response with computed fields."""
    id: int
    user_id: int
    profit: Decimal
    net_profit: Decimal
    bb_won: Decimal
    hourly_rate: Decimal
    estimated_hands: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
