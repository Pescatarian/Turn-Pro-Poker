"""API v1 router."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, sessions, transactions, stats, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistics"])
