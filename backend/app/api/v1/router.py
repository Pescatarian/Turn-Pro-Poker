"""API v1 router aggregating all endpoint modules.

WHY: Centralized route registration makes it easy to manage
API versioning and see all available endpoints at a glance.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, sessions, transactions, stats, users

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# User management
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

# Session tracking
api_router.include_router(
    sessions.router,
    prefix="/sessions",
    tags=["Sessions"]
)

# Bankroll transactions
api_router.include_router(
    transactions.router,
    prefix="/transactions",
    tags=["Transactions"]
)

# Statistics & Analytics
api_router.include_router(
    stats.router,
    prefix="/stats",
    tags=["Statistics"]
)
