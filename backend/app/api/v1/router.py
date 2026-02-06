"""API v1 Router - aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, sync, webhooks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(sync.router, prefix="/sync", tags=["Sync"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
