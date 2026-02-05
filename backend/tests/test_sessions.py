"""Session endpoint tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session(client: AsyncClient, auth_headers):
    """Test creating a new session."""
    response = await client.post(
        "/api/v1/sessions/",
        headers=auth_headers,
        json={
            "session_date": "2025-02-01",
            "location": "Bellagio 2/5",
            "big_blind": "5.00",
            "buy_in": "500.00",
            "cash_out": "850.00",
            "hours_played": "5.0",
            "tips": "25.00",
            "expenses": "15.00"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["location"] == "Bellagio 2/5"


@pytest.mark.asyncio
async def test_get_sessions_empty(client: AsyncClient, auth_headers):
    """Test getting sessions when none exist."""
    response = await client.get("/api/v1/sessions/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test that sessions require authentication."""
    response = await client.get("/api/v1/sessions/")
    assert response.status_code == 403
