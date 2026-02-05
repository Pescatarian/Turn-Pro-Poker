"""SQLAlchemy Base model.

WHY: Single source of truth for the declarative base.
All models inherit from this to ensure consistent table creation.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass
