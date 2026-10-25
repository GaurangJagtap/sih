import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_and_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        assert "AICTE" in res.json()["system"]

        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Valid login
        login_res = await client.post("/api/auth/login", json={
            "email": "institution.sunrise@aicte.gov.in",
            "password": "Demo@1234"
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        assert data["role"] == "INSTITUTION"

        # Invalid password
        bad_login = await client.post("/api/auth/login", json={
            "email": "institution.sunrise@aicte.gov.in",
            "password": "WrongPassword"
        })
        assert bad_login.status_code == 401

@pytest.mark.asyncio
async def test_reports_and_kpis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as Bureau officer
        login_res = await client.post("/api/auth/login", json={
            "email": "bureau.approvals@aicte.gov.in",
            "password": "Demo@1234"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        rep_res = await client.get("/api/reports/summary", headers=headers)
        assert rep_res.status_code == 200
        kpis = rep_res.json()["kpis"]
        assert kpis["total_applications"] >= 25
        assert len(rep_res.json()["stage_distribution"]) > 0

@pytest.mark.asyncio
async def test_voice_agent_intent_and_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as RO
        ro_login = await client.post("/api/auth/login", json={
            "email": "ro.western@aicte.gov.in",
            "password": "Demo@1234"
        })
        token = ro_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch calls
        calls_res = await client.get("/api/voice/calls", headers=headers)
        assert calls_res.status_code == 200
        calls = calls_res.json()
        assert len(calls) > 0
        call_id = calls[0]["id"]

        # Simulate voice response with promised date
        sim_res = await client.post(
            f"/api/voice/calls/{call_id}/simulate-response",
            json={"user_spoken_response": "We will submit the fire safety certificate on Friday"},
            headers=headers
        )
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["recognized_intent"] == "NEEDS_MORE_TIME"
        assert sim_data["promised_date"] is not None
        assert sim_data["follow_up_task_created"] is True
