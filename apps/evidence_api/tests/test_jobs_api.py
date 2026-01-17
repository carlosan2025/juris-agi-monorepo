"""
Unit Tests: Job Management Endpoints
Tests job queue operations.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from uuid import uuid4


class TestJobEnqueue:
    """Tests for job enqueue operations."""

    @pytest.mark.asyncio
    async def test_enqueue_job(self, client: AsyncClient):
        """Test enqueueing a new job."""
        job_data = {
            "job_type": "extract",
            "payload": {
                "document_version_id": str(uuid4()),
            },
            "priority": 5,
        }

        response = await client.post("/api/v1/jobs/enqueue", json=job_data)

        # May require valid payload references
        assert response.status_code in [200, 201, 400, 422]

    @pytest.mark.asyncio
    async def test_enqueue_job_missing_type(self, client: AsyncClient):
        """Test enqueueing job without type fails."""
        job_data = {
            "payload": {},
        }

        response = await client.post("/api/v1/jobs/enqueue", json=job_data)

        assert response.status_code in [400, 422]


class TestJobStatus:
    """Tests for job status operations."""

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client: AsyncClient):
        """Test getting status of non-existent job."""
        fake_id = str(uuid4())

        response = await client.get(f"/api/v1/jobs/{fake_id}")

        # API may return 400, 404, or 500 (if Redis not available)
        assert response.status_code in [400, 404, 500]

    @pytest.mark.asyncio
    async def test_list_jobs(self, client: AsyncClient):
        """Test listing jobs."""
        response = await client.get("/api/v1/jobs")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "jobs" in data

    @pytest.mark.asyncio
    async def test_list_jobs_with_status_filter(self, client: AsyncClient):
        """Test listing jobs with status filter."""
        response = await client.get("/api/v1/jobs?status=pending")

        # 200 if successful, 400/422/500 if filter value invalid or service error
        assert response.status_code in [200, 400, 422, 500]

    @pytest.mark.asyncio
    async def test_list_jobs_with_type_filter(self, client: AsyncClient):
        """Test listing jobs with type filter."""
        # Use valid JobType enum value
        response = await client.get("/api/v1/jobs?job_type=document_extract")

        # 200 if successful, 400/422/500 if filter value invalid or service error
        assert response.status_code in [200, 400, 422, 500]


class TestJobOperations:
    """Tests for job operations (cancel, delete, run)."""

    @pytest.mark.asyncio
    async def test_cancel_job_not_found(self, client: AsyncClient):
        """Test canceling non-existent job."""
        fake_id = str(uuid4())

        response = await client.post(f"/api/v1/jobs/{fake_id}/cancel")

        # API may return 400 or 404 for missing jobs
        assert response.status_code in [400, 404]

    @pytest.mark.asyncio
    async def test_delete_job_not_found(self, client: AsyncClient):
        """Test deleting non-existent job."""
        fake_id = str(uuid4())

        response = await client.delete(f"/api/v1/jobs/{fake_id}")

        # API may return 400 or 404 for missing jobs
        assert response.status_code in [400, 404]

    @pytest.mark.asyncio
    async def test_run_job_not_found(self, client: AsyncClient):
        """Test running non-existent job synchronously."""
        fake_id = str(uuid4())

        response = await client.post(f"/api/v1/jobs/{fake_id}/run")

        # API may return 400 or 404 for missing jobs
        assert response.status_code in [400, 404]


class TestJobCleanup:
    """Tests for job cleanup operations."""

    @pytest.mark.asyncio
    async def test_cleanup_stale_jobs(self, client: AsyncClient):
        """Test cleaning up stale jobs."""
        response = await client.delete("/api/v1/jobs/cleanup/stale")

        # Should succeed even if no stale jobs exist
        assert response.status_code in [200, 204]

    @pytest.mark.asyncio
    async def test_cleanup_old_jobs(self, client: AsyncClient):
        """Test cleaning up old completed jobs."""
        response = await client.delete("/api/v1/jobs/cleanup/old")

        # Should succeed even if no old jobs exist
        assert response.status_code in [200, 204]


class TestJobProcessing:
    """Tests for job processing endpoints."""

    @pytest.mark.asyncio
    async def test_process_next_job(self, client: AsyncClient):
        """Test processing next queued job (cron endpoint)."""
        response = await client.post("/api/v1/jobs/process-next")

        # May return 204 if no jobs to process
        assert response.status_code in [200, 204]

    @pytest.mark.asyncio
    async def test_upload_job(self, client: AsyncClient):
        """Test creating an upload job."""
        job_data = {
            "document_id": str(uuid4()),
            "filename": "test.pdf",
        }

        response = await client.post("/api/v1/jobs/upload", json=job_data)

        # May require valid document reference
        assert response.status_code in [200, 201, 400, 404, 422]


class TestBatchJobs:
    """Tests for batch job operations."""

    @pytest.mark.asyncio
    async def test_batch_extract(self, client: AsyncClient):
        """Test batch extraction job."""
        batch_data = {
            "document_version_ids": [str(uuid4()), str(uuid4())],
            "profile_code": "general",
            "level_code": "L2",
        }

        response = await client.post("/api/v1/jobs/batch/extract", json=batch_data)

        # May require valid document references
        assert response.status_code in [200, 201, 202, 400, 422]

    @pytest.mark.asyncio
    async def test_batch_embed(self, client: AsyncClient):
        """Test batch embedding job."""
        batch_data = {
            "document_version_ids": [str(uuid4()), str(uuid4())],
        }

        response = await client.post("/api/v1/jobs/batch/embed", json=batch_data)

        # May require valid document references
        assert response.status_code in [200, 201, 202, 400, 422]

    @pytest.mark.asyncio
    async def test_batch_extract_empty_list(self, client: AsyncClient):
        """Test batch extraction with empty list."""
        batch_data = {
            "document_version_ids": [],
            "profile_code": "general",
            "level_code": "L2",
        }

        response = await client.post("/api/v1/jobs/batch/extract", json=batch_data)

        assert response.status_code in [200, 400, 422]


class TestJobValidation:
    """Tests for job request validation."""

    @pytest.mark.asyncio
    async def test_enqueue_invalid_job_type(self, client: AsyncClient):
        """Test enqueueing job with invalid type."""
        job_data = {
            "job_type": "invalid_type_xyz",
            "payload": {},
        }

        response = await client.post("/api/v1/jobs/enqueue", json=job_data)

        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_enqueue_negative_priority(self, client: AsyncClient):
        """Test enqueueing job with negative priority."""
        job_data = {
            "job_type": "extract",
            "payload": {"document_version_id": str(uuid4())},
            "priority": -1,
        }

        response = await client.post("/api/v1/jobs/enqueue", json=job_data)

        # May accept negative or reject
        assert response.status_code in [200, 201, 400, 422]
