import pytest
from app.api.deps import validate_last_pulled_at
from fastapi import HTTPException
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_validate_last_pulled_at():
    # Valid timestamp
    ts = int(datetime.utcnow().timestamp() * 1000)
    dt = await validate_last_pulled_at(ts)
    assert dt is not None
    
    # None timestamp
    assert await validate_last_pulled_at(None) is None
    assert await validate_last_pulled_at(0) is None
    
    # Future timestamp (should fail)
    future_ts = int((datetime.utcnow() + timedelta(hours=1)).timestamp() * 1000)
    with pytest.raises(HTTPException):
        await validate_last_pulled_at(future_ts)

@pytest.mark.asyncio
async def test_pull_changes_endpoints(client, auth_headers):
    """Test standard pull flow."""
    # 1. Initial Pull (no timestamp)
    response = await client.post("/api/v1/sync/pull", json={}, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "changes" in data
    assert "timestamp" in data
    assert "sessions" in data["changes"]
    
    # 2. Pull with timestamp
    ts = int(datetime.utcnow().timestamp() * 1000)
    response_ts = await client.post(
        "/api/v1/sync/pull", 
        json={"last_pulled_at": ts}, 
        headers=auth_headers
    )
    assert response_ts.status_code == 200

@pytest.mark.asyncio
async def test_push_changes_endpoint(client, auth_headers):
    """Test standard push flow."""
    payload = {
        "changes": {
            "sessions": {
                "created": [],
                "updated": [],
                "deleted": []
            },
            "hands": {
                "created": [],
                "updated": [],
                "deleted": []
            },
            "transactions": {
                "created": [],
                "updated": [],
                "deleted": []
            }
        },
        "last_pulled_at": int(datetime.utcnow().timestamp() * 1000)
    }
    response = await client.post("/api/v1/sync/push", json=payload, headers=auth_headers)
    assert response.status_code == 200, response.text
