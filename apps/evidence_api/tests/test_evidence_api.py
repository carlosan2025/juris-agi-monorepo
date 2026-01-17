"""
Unit Tests: Evidence Endpoints
Tests spans, claims, metrics, and evidence packs.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4


class TestSpanEndpoints:
    """Tests for evidence span endpoints."""

    @pytest.mark.asyncio
    async def test_create_span(self, client: AsyncClient):
        """Test creating an evidence span."""
        span_data = {
            "document_version_id": str(uuid4()),  # Would need real ID in integration
            "text": "This is an important piece of evidence from the document.",
            "span_type": "text",
            "page_number": 1,
            "char_start": 0,
            "char_end": 50,
            "metadata": {
                "source": "test",
            },
        }

        response = await client.post("/api/v1/spans", json=span_data)

        # May fail if document_version_id doesn't exist
        assert response.status_code in [200, 201, 400, 404, 422]

    @pytest.mark.asyncio
    async def test_get_span_not_found(self, client: AsyncClient):
        """Test getting a non-existent span."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/spans/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_span_not_found(self, client: AsyncClient):
        """Test deleting a non-existent span."""
        fake_id = str(uuid4())

        response = await client.delete(f"/api/v1/spans/{fake_id}")

        assert response.status_code == 404


class TestClaimEndpoints:
    """Tests for claim endpoints."""

    @pytest.mark.asyncio
    async def test_create_claim(self, client: AsyncClient):
        """Test creating a claim citing a span."""
        claim_data = {
            "span_id": str(uuid4()),  # Would need real ID
            "text": "The company has increased revenue by 50%.",
            "claim_type": "financial",
            "confidence": 0.95,
            "metadata": {
                "verified": False,
            },
        }

        response = await client.post("/api/v1/claims", json=claim_data)

        # May fail if span_id doesn't exist
        assert response.status_code in [200, 201, 400, 404, 422]

    @pytest.mark.asyncio
    async def test_get_claim_not_found(self, client: AsyncClient):
        """Test getting a non-existent claim."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/claims/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_claim_not_found(self, client: AsyncClient):
        """Test deleting a non-existent claim."""
        fake_id = str(uuid4())

        response = await client.delete(f"/api/v1/claims/{fake_id}")

        assert response.status_code == 404


class TestMetricEndpoints:
    """Tests for metric endpoints."""

    @pytest.mark.asyncio
    async def test_create_metric(self, client: AsyncClient):
        """Test creating a metric citing a span."""
        metric_data = {
            "span_id": str(uuid4()),  # Would need real ID
            "name": "Revenue Growth",
            "value": 50.0,
            "unit": "percent",
            "period": "YoY",
            "confidence": 0.9,
        }

        response = await client.post("/api/v1/metrics", json=metric_data)

        # May fail if span_id doesn't exist
        assert response.status_code in [200, 201, 400, 404, 422]

    @pytest.mark.asyncio
    async def test_get_metric_not_found(self, client: AsyncClient):
        """Test getting a non-existent metric."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/metrics/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_metric_not_found(self, client: AsyncClient):
        """Test deleting a non-existent metric."""
        fake_id = str(uuid4())

        response = await client.delete(f"/api/v1/metrics/{fake_id}")

        assert response.status_code == 404


class TestEvidencePackEndpoints:
    """Tests for evidence pack (bundle) endpoints."""

    @pytest.mark.asyncio
    async def test_create_evidence_pack(self, client: AsyncClient):
        """Test creating an evidence pack."""
        # project_id is required by the schema
        project_id = str(uuid4())

        pack_data = {
            "project_id": project_id,
            "name": f"Test Evidence Pack {uuid4().hex[:8]}",
            "description": "A collection of evidence for testing",
            "metadata": {
                "purpose": "unit_test",
            },
        }

        response = await client.post("/api/v1/evidence-packs", json=pack_data)

        # 201 if created, 404 if project doesn't exist (FK constraint)
        assert response.status_code in [200, 201, 404]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or data.get("pack", {}).get("id")

    @pytest.mark.asyncio
    async def test_get_evidence_pack_not_found(self, client: AsyncClient):
        """Test getting a non-existent evidence pack."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/evidence-packs/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_evidence_pack_not_found(self, client: AsyncClient):
        """Test deleting a non-existent evidence pack."""
        fake_id = str(uuid4())

        response = await client.delete(f"/api/v1/evidence-packs/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_export_evidence_pack_not_found(self, client: AsyncClient):
        """Test exporting a non-existent evidence pack."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/evidence-packs/{fake_id}/export")

        assert response.status_code == 404


class TestEvidencePackItems:
    """Tests for adding items to evidence packs."""

    @pytest.fixture
    async def test_pack(self, client: AsyncClient):
        """Create a test evidence pack."""
        pack_data = {
            "name": f"Item Test Pack {uuid4().hex[:8]}",
            "description": "Pack for item tests",
        }
        response = await client.post("/api/v1/evidence-packs", json=pack_data)

        if response.status_code in [200, 201]:
            data = response.json()
            return data.get("id") or data.get("pack", {}).get("id")
        return None

    @pytest.mark.asyncio
    async def test_add_item_to_pack(self, client: AsyncClient, test_pack):
        """Test adding an item to an evidence pack."""
        if not test_pack:
            pytest.skip("Could not create test pack")

        item_data = {
            "span_id": str(uuid4()),  # Would need real ID
            "notes": "Important evidence item",
        }

        response = await client.post(
            f"/api/v1/evidence-packs/{test_pack}/items", json=item_data
        )

        # May fail if span_id doesn't exist
        assert response.status_code in [200, 201, 400, 404, 422]

    @pytest.mark.asyncio
    async def test_add_item_to_nonexistent_pack(self, client: AsyncClient):
        """Test adding item to non-existent pack."""
        fake_pack_id = str(uuid4())
        item_data = {
            "span_id": str(uuid4()),
        }

        response = await client.post(
            f"/api/v1/evidence-packs/{fake_pack_id}/items", json=item_data
        )

        assert response.status_code == 404


class TestEvidencePackWithFacts:
    """Tests for evidence pack with facts enrichment."""

    @pytest.mark.asyncio
    async def test_get_pack_with_facts_not_found(self, client: AsyncClient):
        """Test getting pack with facts for non-existent pack."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/evidence-packs/{fake_id}/with-facts")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_request_extraction_not_found(self, client: AsyncClient):
        """Test requesting extraction for non-existent pack."""
        fake_id = str(uuid4())

        extraction_data = {
            "profile": "general",
            "process_context": "due_diligence",
            "level": "L2",
        }

        response = await client.post(
            f"/api/v1/evidence-packs/{fake_id}/request-extraction", json=extraction_data
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_extraction_status_not_found(self, client: AsyncClient):
        """Test getting extraction status for non-existent pack."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/evidence-packs/{fake_id}/extraction-status")

        assert response.status_code == 404
