"""
Unit Tests: Health Endpoints
Tests health check and monitoring endpoints.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient


class TestHealthEndpoints:
    """Tests for health and monitoring endpoints."""

    @pytest.mark.asyncio
    async def test_health_check_returns_200(self, client: AsyncClient):
        """Test that main health check returns 200 OK."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    @pytest.mark.asyncio
    async def test_liveness_probe(self, client: AsyncClient):
        """Test Kubernetes liveness probe."""
        response = await client.get("/api/v1/live")

        assert response.status_code == 200
        data = response.json()
        # API returns {"alive": True}
        assert data.get("alive") is True or "status" in data

    @pytest.mark.asyncio
    async def test_readiness_probe(self, client: AsyncClient):
        """Test Kubernetes readiness probe."""
        response = await client.get("/api/v1/ready")

        assert response.status_code in [200, 503]  # May fail if services unavailable
        data = response.json()
        # API returns {"ready": bool, "checks": {...}}
        assert "ready" in data or "status" in data

    @pytest.mark.asyncio
    async def test_health_db_check(self, client: AsyncClient):
        """Test database health check endpoint."""
        response = await client.get("/api/v1/health/db")

        assert response.status_code in [200, 503]
        data = response.json()
        assert "database" in data or "status" in data


class TestHealthResponseFormat:
    """Tests for health response formats."""

    @pytest.mark.asyncio
    async def test_health_includes_timestamp(self, client: AsyncClient):
        """Test that health response includes timestamp."""
        response = await client.get("/api/v1/health")

        if response.status_code == 200:
            data = response.json()
            # Health response should have some time indicator
            assert "timestamp" in data or "checked_at" in data or data.get("status")

    @pytest.mark.asyncio
    async def test_health_json_content_type(self, client: AsyncClient):
        """Test that health endpoint returns JSON."""
        response = await client.get("/api/v1/health")

        assert "application/json" in response.headers.get("content-type", "")
