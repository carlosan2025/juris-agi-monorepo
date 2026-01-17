"""Pytest configuration and fixtures."""

import asyncio
import os
from collections.abc import AsyncGenerator
from typing import Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (requires running services)"
    )
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Set test environment before importing app
# Use production database for integration tests (Neon PostgreSQL) if not overridden
os.environ["DATABASE_URL"] = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://neondb_owner:npg_2CEUanONTfh7@ep-polished-tooth-abunznsm-pooler.eu-west-2.aws.neon.tech/neondb?ssl=require"
)
os.environ["STORAGE_BACKEND"] = "local"
os.environ["FILE_STORAGE_ROOT"] = "./data/test_files"
os.environ["API_KEYS"] = os.environ.get("API_KEYS", "test-api-key,f5da5dea2484337c4efbc784bfd5f6458b04049827337a598f360f7a73ea8ee1")
os.environ["DEBUG"] = "true"
# Use NullPool to avoid event loop issues when running multiple async tests
# This is the same setting used for serverless deployments
os.environ["VERCEL"] = "1"

from evidence_repository.db.session import get_db_session
from evidence_repository.db.engine import dispose_engine
from evidence_repository.main import app
from evidence_repository.models.base import Base
from evidence_repository.storage import LocalFilesystemStorage


@pytest.fixture(scope="function")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create a new event loop for each test function.

    Using function scope prevents event loop issues where async connections
    get attached to different loops when running tests sequentially.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    # Dispose the SQLAlchemy engine to clean up connection pool
    # This prevents "Future attached to a different loop" errors
    try:
        loop.run_until_complete(dispose_engine())
    except Exception:
        pass  # Ignore errors during cleanup
    # Clean up pending tasks
    pending = asyncio.all_tasks(loop)
    for task in pending:
        task.cancel()
    # Allow cancelled tasks to complete
    if pending:
        try:
            loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        except Exception:
            pass
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client.

    Uses a fresh connection for each test to avoid async conflicts.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-API-Key": "f5da5dea2484337c4efbc784bfd5f6458b04049827337a598f360f7a73ea8ee1"},
    ) as ac:
        yield ac


@pytest.fixture
def storage() -> LocalFilesystemStorage:
    """Create test storage backend."""
    return LocalFilesystemStorage(base_path="./data/test_files")


@pytest.fixture
def sample_pdf_content() -> bytes:
    """Sample PDF content for testing."""
    # Minimal valid PDF
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Test PDF) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF"""


@pytest.fixture
def sample_text_content() -> bytes:
    """Sample text content for testing."""
    return b"""This is a sample legal document for testing.

Section 1: Introduction
This document contains important legal information.

Section 2: Terms and Conditions
The following terms apply to all parties involved.

Section 3: Conclusion
In conclusion, this document serves as evidence."""


@pytest.fixture
def api_headers() -> dict:
    """Default API headers for testing."""
    return {
        "X-API-Key": "test-api-key",
        "Content-Type": "application/json",
    }
