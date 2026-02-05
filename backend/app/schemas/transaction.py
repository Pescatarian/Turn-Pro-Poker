"""Transaction schemas for bankroll management."""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    """Schema for creating a new transaction."""
    transaction_type: TransactionType
    amount: Decimal = Field(..., gt=0)
    note: Optional[str] = None


class TransactionResponse(BaseModel):
    """Schema for transaction response."""
    id: int
    user_id: int
    transaction_type: TransactionType
    amount: Decimal
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
