"""SQLAlchemy Base model.

WHY: Single source of truth for the declarative base.
All models inherit from this to ensure consistent table creation.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Import all models here for Alembic to detect them
from app.models.user import User  # noqa
from app.models.session import Session  # noqa
from app.models.transaction import Transaction  # noqa
from app.models.hand import Hand  # noqa
