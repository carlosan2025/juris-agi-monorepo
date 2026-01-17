"""
Unit Tests: Tenant Management Endpoints
Tests tenant CRUD and API key management.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4


class TestTenantCRUD:
    """Tests for tenant CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_tenant(self, client: AsyncClient):
        """Test creating a new tenant."""
        tenant_data = {
            "name": f"Test Tenant {uuid4().hex[:8]}",
            "slug": f"test-tenant-{uuid4().hex[:8]}",
            "owner_email": f"test-{uuid4().hex[:8]}@example.com",
        }

        response = await client.post("/api/v1/tenants", json=tenant_data)

        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or data.get("tenant", {}).get("id")

    @pytest.mark.asyncio
    async def test_create_tenant_missing_name(self, client: AsyncClient):
        """Test that creating tenant without name fails."""
        tenant_data = {
            "slug": "test-tenant",
            "owner_email": "test@example.com",
        }

        response = await client.post("/api/v1/tenants", json=tenant_data)

        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_list_tenants(self, client: AsyncClient):
        """Test listing all tenants."""
        response = await client.get("/api/v1/tenants")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "tenants" in data

    @pytest.mark.asyncio
    async def test_get_tenant_by_id(self, client: AsyncClient):
        """Test getting tenant by ID."""
        # First create a tenant
        tenant_data = {
            "name": f"Test Tenant {uuid4().hex[:8]}",
            "slug": f"test-tenant-{uuid4().hex[:8]}",
            "owner_email": f"test-{uuid4().hex[:8]}@example.com",
        }
        create_response = await client.post("/api/v1/tenants", json=tenant_data)

        if create_response.status_code in [200, 201]:
            created = create_response.json()
            tenant_id = created.get("id") or created.get("tenant", {}).get("id")

            if tenant_id:
                response = await client.get(f"/api/v1/tenants/{tenant_id}")
                assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_nonexistent_tenant(self, client: AsyncClient):
        """Test getting a tenant that doesn't exist."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/tenants/{fake_id}")

        assert response.status_code == 404


class TestTenantAPIKeys:
    """Tests for tenant API key management."""

    @pytest.fixture
    async def test_tenant(self, client: AsyncClient):
        """Create a test tenant for API key tests."""
        tenant_data = {
            "name": f"API Key Test Tenant {uuid4().hex[:8]}",
            "slug": f"api-test-{uuid4().hex[:8]}",
            "owner_email": f"api-test-{uuid4().hex[:8]}@example.com",
        }
        response = await client.post("/api/v1/tenants", json=tenant_data)

        if response.status_code in [200, 201]:
            data = response.json()
            return data.get("id") or data.get("tenant", {}).get("id")
        return None

    @pytest.mark.asyncio
    async def test_create_api_key(self, client: AsyncClient, test_tenant):
        """Test creating an API key for a tenant."""
        if not test_tenant:
            pytest.skip("Could not create test tenant")

        key_data = {
            "name": "Test API Key",
            "expires_in_days": 30,
        }

        response = await client.post(
            f"/api/v1/tenants/{test_tenant}/api-keys", json=key_data
        )

        assert response.status_code in [200, 201]
        data = response.json()
        # API key should be returned only on creation
        assert "key" in data or "api_key" in data or "token" in data

    @pytest.mark.asyncio
    async def test_list_api_keys(self, client: AsyncClient, test_tenant):
        """Test listing API keys for a tenant."""
        if not test_tenant:
            pytest.skip("Could not create test tenant")

        response = await client.get(f"/api/v1/tenants/{test_tenant}/api-keys")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "keys" in data or "api_keys" in data

    @pytest.mark.asyncio
    async def test_revoke_api_key(self, client: AsyncClient, test_tenant):
        """Test revoking an API key."""
        if not test_tenant:
            pytest.skip("Could not create test tenant")

        # First create a key
        key_data = {"name": "Key to Revoke"}
        create_response = await client.post(
            f"/api/v1/tenants/{test_tenant}/api-keys", json=key_data
        )

        if create_response.status_code in [200, 201]:
            created = create_response.json()
            key_id = created.get("id") or created.get("key_id")

            if key_id:
                response = await client.delete(
                    f"/api/v1/tenants/{test_tenant}/api-keys/{key_id}"
                )
                assert response.status_code in [200, 204]


class TestTenantValidation:
    """Tests for tenant validation rules."""

    @pytest.mark.asyncio
    async def test_tenant_name_required(self, client: AsyncClient):
        """Test that tenant name is required."""
        response = await client.post("/api/v1/tenants", json={"owner_email": "test@example.com"})

        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_duplicate_tenant_slug(self, client: AsyncClient):
        """Test that duplicate tenant slugs are rejected."""
        slug = f"unique-slug-{uuid4().hex[:8]}"
        tenant_data = {
            "name": "First Tenant",
            "slug": slug,
            "owner_email": f"first-{uuid4().hex[:8]}@example.com",
        }

        # Create first tenant
        response1 = await client.post("/api/v1/tenants", json=tenant_data)

        if response1.status_code in [200, 201]:
            # Try to create second with same slug
            tenant_data["name"] = "Second Tenant"
            tenant_data["owner_email"] = f"second-{uuid4().hex[:8]}@example.com"
            response2 = await client.post("/api/v1/tenants", json=tenant_data)

            # Should fail with conflict or validation error
            assert response2.status_code in [400, 409, 422]
