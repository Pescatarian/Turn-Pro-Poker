from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class SyncPullRequest(BaseModel):
    last_pulled_at: Optional[int] = None
    schema_version: Optional[int] = None
    migration: Optional[Any] = None

class SyncPullResponse(BaseModel):
    changes: Dict[str, Dict[str, List[Any]]]
    timestamp: int

class SyncPushRequest(BaseModel):
    changes: Dict[str, Dict[str, List[Any]]]
    last_pulled_at: int
