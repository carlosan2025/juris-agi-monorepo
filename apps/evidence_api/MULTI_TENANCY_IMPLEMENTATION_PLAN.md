# Multi-Tenancy Implementation Plan for Evidence API

## Executive Summary

This document outlines the implementation plan to add full multi-tenancy support to the Evidence API, ensuring complete data isolation between tenants across all storage layers (PostgreSQL, pgvector embeddings, and Cloudflare R2).

---

## Phase 1: Database Schema Changes (Critical)

### 1.1 Create Tenant Model

**File:** `src/evidence_repository/models/tenant.py`

```python
"""Tenant model for multi-tenancy support."""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from evidence_repository.models.base import Base, UUIDMixin, TimestampMixin


class Tenant(Base, UUIDMixin, TimestampMixin):
    """Represents a tenant/organization in the system."""
    __tablename__ = "tenants"

    # Core fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    # Contact/billing
    owner_email: Mapped[str] = mapped_column(String(255), nullable=False)
    billing_email: Mapped[str | None] = mapped_column(String(255))

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    suspension_reason: Mapped[str | None] = mapped_column(Text)

    # Settings (JSON for flexibility)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    documents: Mapped[list["Document"]] = relationship(back_populates="tenant")
    projects: Mapped[list["Project"]] = relationship(back_populates="tenant")
    api_keys: Mapped[list["TenantAPIKey"]] = relationship(back_populates="tenant")
```

### 1.2 Create TenantAPIKey Model

**File:** `src/evidence_repository/models/tenant_api_key.py`

```python
"""API Key model bound to tenants."""
import uuid
import hashlib
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from evidence_repository.models.base import Base, UUIDMixin, TimestampMixin


class TenantAPIKey(Base, UUIDMixin, TimestampMixin):
    """API key bound to a specific tenant."""
    __tablename__ = "tenant_api_keys"

    # Tenant binding (REQUIRED)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Key info
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g., "Production Key"
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)  # First 12 chars for display

    # Permissions
    scopes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)  # ["read", "write", "delete"]

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Audit
    created_by: Mapped[str | None] = mapped_column(String(255))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_by: Mapped[str | None] = mapped_column(String(255))

    # Relationships
    tenant: Mapped["Tenant"] = relationship(back_populates="api_keys")

    @classmethod
    def hash_key(cls, api_key: str) -> str:
        """Hash an API key for storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()
```

### 1.3 Add tenant_id to ALL Existing Models

**Migration file:** `alembic/versions/xxxx_add_tenant_id_to_all_models.py`

Add `tenant_id` column to these models:

| Model | File | Foreign Key |
|-------|------|-------------|
| Document | `models/document.py` | `ForeignKey("tenants.id")` |
| DocumentVersion | `models/document.py` | Via Document (cascade) |
| Project | `models/project.py` | `ForeignKey("tenants.id")` |
| Span | `models/evidence.py` | Via DocumentVersion (cascade) |
| EmbeddingChunk | `models/embedding.py` | `ForeignKey("tenants.id")` + Via Span |
| Claim | `models/facts.py` | Via DocumentVersion (cascade) |
| Metric | `models/facts.py` | Via DocumentVersion (cascade) |
| EvidencePack | `models/evidence.py` | `ForeignKey("tenants.id")` |
| IngestionBatch | `models/ingestion.py` | `ForeignKey("tenants.id")` |
| IngestionItem | `models/ingestion.py` | Via IngestionBatch (cascade) |
| Folder | `models/folder.py` | `ForeignKey("tenants.id")` |
| IntegrationKey | `models/integration_key.py` | `ForeignKey("tenants.id")` |
| AuditLog | `models/audit.py` | `ForeignKey("tenants.id")` |
| Job | `models/job.py` | `ForeignKey("tenants.id")` |

**Example modification for Document model:**

```python
# In models/document.py
class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"

    # ADD: Tenant binding (REQUIRED for all tenant-scoped data)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Existing fields...
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    # ...

    # ADD: Relationship
    tenant: Mapped["Tenant"] = relationship()

    # ADD: Composite index for efficient tenant-scoped queries
    __table_args__ = (
        Index("ix_documents_tenant_created", "tenant_id", "created_at"),
        Index("ix_documents_tenant_filename", "tenant_id", "filename"),
    )
```

### 1.4 Database Migration Strategy

```sql
-- Step 1: Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    suspended_at TIMESTAMPTZ,
    suspension_reason TEXT,
    settings JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Create default tenant for existing data
INSERT INTO tenants (id, name, slug, owner_email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default', 'admin@example.com');

-- Step 3: Add tenant_id to documents (example)
ALTER TABLE documents ADD COLUMN tenant_id UUID;

-- Step 4: Backfill existing data to default tenant
UPDATE documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Step 5: Make tenant_id NOT NULL and add FK
ALTER TABLE documents
    ALTER COLUMN tenant_id SET NOT NULL,
    ADD CONSTRAINT fk_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 6: Create index
CREATE INDEX ix_documents_tenant_id ON documents(tenant_id);

-- Repeat steps 3-6 for all other tables...
```

---

## Phase 2: Authentication & Authorization

### 2.1 Update User Model

**File:** `src/evidence_repository/api/dependencies.py`

```python
from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class User:
    """Represents an authenticated user/API client with tenant context."""
    id: str
    tenant_id: uuid.UUID  # REQUIRED - tenant isolation
    api_key: str | None = None
    email: str | None = None
    name: str | None = None
    roles: list[str] = field(default_factory=list)
    scopes: list[str] = field(default_factory=list)  # ["read", "write", "delete", "admin"]

    def has_scope(self, scope: str) -> bool:
        """Check if user has a specific permission scope."""
        return scope in self.scopes or "admin" in self.scopes

    def can_read(self) -> bool:
        return self.has_scope("read")

    def can_write(self) -> bool:
        return self.has_scope("write")

    def can_delete(self) -> bool:
        return self.has_scope("delete")
```

### 2.2 Update API Key Verification

**File:** `src/evidence_repository/api/dependencies.py`

```python
async def verify_api_key(
    api_key: str,
    db: AsyncSession,
) -> User:
    """Verify an API key and return a User with tenant context."""
    from evidence_repository.models.tenant_api_key import TenantAPIKey
    from evidence_repository.models.tenant import Tenant

    # Hash the provided key
    key_hash = TenantAPIKey.hash_key(api_key)

    # Look up the key in database
    result = await db.execute(
        select(TenantAPIKey)
        .options(joinedload(TenantAPIKey.tenant))
        .where(
            TenantAPIKey.key_hash == key_hash,
            TenantAPIKey.is_active == True,
            TenantAPIKey.revoked_at.is_(None),
        )
    )
    api_key_record = result.scalar_one_or_none()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
        )

    # Check expiration
    if api_key_record.expires_at and api_key_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired",
        )

    # Check tenant is active
    if not api_key_record.tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is suspended",
        )

    # Update last_used_at
    api_key_record.last_used_at = datetime.utcnow()
    await db.commit()

    return User(
        id=f"apikey:{api_key_record.key_prefix}",
        tenant_id=api_key_record.tenant_id,
        api_key=api_key,
        scopes=api_key_record.scopes,
    )
```

### 2.3 Create Tenant Context Middleware

**File:** `src/evidence_repository/api/middleware.py`

```python
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
import uuid

# Context variable for current tenant
current_tenant_id: ContextVar[uuid.UUID | None] = ContextVar("current_tenant_id", default=None)


def get_current_tenant_id() -> uuid.UUID:
    """Get the current tenant ID from context."""
    tenant_id = current_tenant_id.get()
    if tenant_id is None:
        raise RuntimeError("No tenant context set - this should not happen in authenticated routes")
    return tenant_id


class TenantContextMiddleware(BaseHTTPMiddleware):
    """Middleware to set tenant context from authenticated user."""

    async def dispatch(self, request, call_next):
        # Tenant ID is set by the authentication dependency
        # This middleware ensures it's available via context var
        response = await call_next(request)
        return response
```

---

## Phase 3: Update All Database Queries

### 3.1 Create Base Query Helper

**File:** `src/evidence_repository/db/tenant_queries.py`

```python
"""Tenant-scoped query helpers."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid


def tenant_filter(model, tenant_id: uuid.UUID):
    """Create a tenant filter for a model."""
    if not hasattr(model, 'tenant_id'):
        raise ValueError(f"Model {model.__name__} does not have tenant_id field")
    return model.tenant_id == tenant_id


async def get_tenant_scoped(
    db: AsyncSession,
    model,
    tenant_id: uuid.UUID,
    entity_id: uuid.UUID,
):
    """Get a single entity scoped to tenant."""
    result = await db.execute(
        select(model).where(
            model.id == entity_id,
            model.tenant_id == tenant_id,
        )
    )
    return result.scalar_one_or_none()


async def list_tenant_scoped(
    db: AsyncSession,
    model,
    tenant_id: uuid.UUID,
    **filters,
):
    """List entities scoped to tenant."""
    query = select(model).where(model.tenant_id == tenant_id)

    for field, value in filters.items():
        if hasattr(model, field):
            query = query.where(getattr(model, field) == value)

    result = await db.execute(query)
    return result.scalars().all()
```

### 3.2 Update Document Routes (Example)

**File:** `src/evidence_repository/api/routes/documents.py`

```python
@router.get("")
async def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    include_deleted: bool = Query(default=False),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),  # Now includes tenant_id
) -> PaginatedResponse[DocumentResponse]:
    """List documents for the current tenant."""

    # CRITICAL: Filter by tenant_id
    query = (
        select(Document)
        .where(Document.tenant_id == user.tenant_id)  # <-- TENANT FILTER
        .options(selectinload(Document.versions))
    )

    if not include_deleted:
        query = query.where(Document.deleted_at.is_(None))

    # Count total
    count_query = select(func.count()).select_from(
        query.subquery()
    )
    total = await db.scalar(count_query)

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    documents = result.scalars().all()

    return PaginatedResponse(
        items=[DocumentResponse.from_orm(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{document_id}")
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> DocumentResponse:
    """Get a document by ID (tenant-scoped)."""

    result = await db.execute(
        select(Document)
        .where(
            Document.id == document_id,
            Document.tenant_id == user.tenant_id,  # <-- TENANT FILTER
        )
        .options(selectinload(Document.versions))
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",  # Don't reveal if it exists for other tenant
        )

    return DocumentResponse.from_orm(document)


@router.post("")
async def upload_document(
    file: UploadFile,
    profile_code: str = Form(default="general"),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    storage: StorageBackend = Depends(get_storage),
) -> DocumentUploadResponse:
    """Upload a document (assigned to current tenant)."""

    # Create document with tenant_id
    document = Document(
        tenant_id=user.tenant_id,  # <-- ASSIGN TO TENANT
        filename=file.filename,
        original_filename=file.filename,
        content_type=file.content_type,
        profile_code=profile_code,
        # ...
    )

    db.add(document)
    await db.commit()

    # Storage path includes tenant_id
    storage_path = f"{user.tenant_id}/documents/{document.id}/v1/{file.filename}"
    await storage.upload(storage_path, file)

    return DocumentUploadResponse(...)
```

### 3.3 Update ALL Route Files

Apply the same pattern to ALL route files:

| File | Entities | Changes Required |
|------|----------|------------------|
| `routes/documents.py` | Document, DocumentVersion | Add tenant filter to all queries |
| `routes/projects.py` | Project | Add tenant filter to all queries |
| `routes/search.py` | Span, EmbeddingChunk | Add tenant filter to vector search |
| `routes/evidence.py` | EvidencePack, Span | Add tenant filter |
| `routes/extraction.py` | ExtractionRun | Add tenant filter via DocumentVersion |
| `routes/jobs.py` | Job | Add tenant filter |
| `routes/folders.py` | Folder | Add tenant filter |
| `routes/ingest.py` | IngestionBatch | Add tenant filter |
| `routes/admin.py` | IntegrationKey | Add tenant filter |
| `routes/worker.py` | Job, DocumentVersion | Add tenant filter |

---

## Phase 4: Update Storage Layer

### 4.1 Modify Storage Path Structure

**Current:**
```
documents/{document_id}/v{version}/{filename}
```

**New (tenant-prefixed):**
```
{tenant_id}/documents/{document_id}/v{version}/{filename}
```

### 4.2 Update S3 Storage Backend

**File:** `src/evidence_repository/storage/s3.py`

```python
class S3StorageBackend(StorageBackend):
    """S3/R2 storage with tenant isolation."""

    def _get_tenant_key(self, tenant_id: uuid.UUID, path_key: str) -> str:
        """Prefix path with tenant_id for isolation."""
        return f"{tenant_id}/{path_key}"

    async def upload(
        self,
        tenant_id: uuid.UUID,
        path_key: str,
        data: bytes | BinaryIO,
        content_type: str,
        metadata: dict[str, str] | None = None,
    ) -> str:
        """Upload file to tenant-scoped path."""
        full_key = self._get_tenant_key(tenant_id, path_key)
        # ... upload logic
        return full_key

    async def download(
        self,
        tenant_id: uuid.UUID,
        path_key: str,
    ) -> bytes:
        """Download file from tenant-scoped path."""
        full_key = self._get_tenant_key(tenant_id, path_key)
        # Validate tenant prefix to prevent path traversal
        if not full_key.startswith(f"{tenant_id}/"):
            raise PermissionError("Access denied: invalid storage path")
        # ... download logic

    async def delete(
        self,
        tenant_id: uuid.UUID,
        path_key: str,
    ) -> bool:
        """Delete file from tenant-scoped path."""
        full_key = self._get_tenant_key(tenant_id, path_key)
        # Validate tenant prefix
        if not full_key.startswith(f"{tenant_id}/"):
            raise PermissionError("Access denied: invalid storage path")
        # ... delete logic
```

### 4.3 Migration for Existing Files

```python
# Script to migrate existing files to tenant-prefixed paths
async def migrate_storage_paths(db: AsyncSession, storage: StorageBackend, default_tenant_id: uuid.UUID):
    """Move existing files to tenant-prefixed paths."""

    # Get all document versions
    result = await db.execute(select(DocumentVersion))
    versions = result.scalars().all()

    for version in versions:
        old_path = version.storage_path
        new_path = f"{default_tenant_id}/{old_path}"

        # Copy to new location
        data = await storage.download_raw(old_path)
        await storage.upload_raw(new_path, data)

        # Update database
        version.storage_path = new_path

        # Delete old file (optional, do after verification)
        # await storage.delete_raw(old_path)

    await db.commit()
```

---

## Phase 5: Update Vector Search

### 5.1 Add Tenant Filter to Embedding Queries

**File:** `src/evidence_repository/services/search_service.py`

```python
async def semantic_search(
    self,
    query: str,
    tenant_id: uuid.UUID,  # REQUIRED
    limit: int = 10,
    similarity_threshold: float = 0.7,
    project_id: uuid.UUID | None = None,
) -> list[SearchResult]:
    """Perform semantic search scoped to tenant."""

    # Generate query embedding
    query_embedding = await self.embedding_client.embed(query)

    # Build query with tenant filter
    search_query = (
        select(
            EmbeddingChunk,
            EmbeddingChunk.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .where(EmbeddingChunk.tenant_id == tenant_id)  # <-- TENANT FILTER
        .order_by("distance")
        .limit(limit)
    )

    # Optional project filter
    if project_id:
        search_query = search_query.join(
            Span, EmbeddingChunk.span_id == Span.id
        ).join(
            DocumentVersion, Span.document_version_id == DocumentVersion.id
        ).join(
            Document, DocumentVersion.document_id == Document.id
        ).where(
            Document.project_id == project_id
        )

    result = await self.db.execute(search_query)
    # ... process results
```

### 5.2 Update Search Routes

**File:** `src/evidence_repository/api/routes/search.py`

```python
@router.post("")
async def search_documents(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> SearchResult:
    """Perform search scoped to current tenant."""

    service = SearchService(db=db)

    result = await service.search(
        query=query.query,
        tenant_id=user.tenant_id,  # <-- PASS TENANT
        limit=query.limit,
        mode=query.mode,
        project_id=query.project_id,
        similarity_threshold=query.similarity_threshold,
    )

    return result
```

---

## Phase 6: Update Background Jobs

### 6.1 Add Tenant Context to Job Payloads

**File:** `src/evidence_repository/queue/tasks.py`

```python
@dataclass
class ProcessDocumentPayload:
    """Payload for document processing job."""
    tenant_id: uuid.UUID  # REQUIRED
    document_id: uuid.UUID
    version_id: uuid.UUID
    profile_code: str
    extraction_level: int = 2


async def enqueue_document_processing(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    profile_code: str,
) -> Job:
    """Create a document processing job with tenant context."""

    job = Job(
        tenant_id=tenant_id,  # TENANT BINDING
        job_type=JobType.PROCESS_DOCUMENT_VERSION,
        payload={
            "tenant_id": str(tenant_id),  # Include in payload for worker
            "document_id": str(document_id),
            "version_id": str(version_id),
            "profile_code": profile_code,
        },
    )

    db.add(job)
    await db.commit()

    return job
```

### 6.2 Update Worker to Respect Tenant Context

**File:** `src/evidence_repository/api/routes/worker.py`

```python
async def process_pending_sync(
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    batch_size: int = Query(3),
) -> dict:
    """Process pending documents for current tenant only."""

    # Find pending documents FOR THIS TENANT ONLY
    result = await db.execute(
        select(DocumentVersion)
        .join(Document)
        .where(
            Document.tenant_id == user.tenant_id,  # <-- TENANT FILTER
            DocumentVersion.extraction_status == ExtractionStatus.PENDING,
        )
        .order_by(DocumentVersion.created_at.asc())
        .limit(batch_size)
    )
    pending_versions = result.scalars().all()

    # ... process documents
```

---

## Phase 7: Update Audit Logging

### 7.1 Add Tenant to Audit Logs

**File:** `src/evidence_repository/models/audit.py`

```python
class AuditLog(Base, UUIDMixin):
    """Immutable audit log entry with tenant context."""
    __tablename__ = "audit_logs"

    # REQUIRED: Tenant context
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )

    # Existing fields
    action: Mapped[AuditAction] = mapped_column(nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column()
    actor_id: Mapped[str | None] = mapped_column(String(255))
    actor_ip: Mapped[str | None] = mapped_column(String(45))
    changes: Mapped[dict | None] = mapped_column(JSON)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
```

---

## Phase 8: Row-Level Security (Optional but Recommended)

### 8.1 PostgreSQL RLS Policies

```sql
-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_documents ON documents
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create policy for service accounts (bypass RLS)
CREATE POLICY service_bypass_documents ON documents
    USING (current_setting('app.is_service_account', true)::boolean = true);
```

### 8.2 Set Tenant Context in Queries

```python
async def set_tenant_context(db: AsyncSession, tenant_id: uuid.UUID):
    """Set tenant context for RLS policies."""
    await db.execute(text(f"SET app.current_tenant_id = '{tenant_id}'"))
```

---

## Phase 9: Testing

### 9.1 Multi-Tenant Test Fixtures

```python
@pytest.fixture
async def tenant_a(db: AsyncSession) -> Tenant:
    """Create test tenant A."""
    tenant = Tenant(name="Tenant A", slug="tenant-a", owner_email="a@test.com")
    db.add(tenant)
    await db.commit()
    return tenant


@pytest.fixture
async def tenant_b(db: AsyncSession) -> Tenant:
    """Create test tenant B."""
    tenant = Tenant(name="Tenant B", slug="tenant-b", owner_email="b@test.com")
    db.add(tenant)
    await db.commit()
    return tenant


@pytest.fixture
async def user_a(tenant_a: Tenant) -> User:
    """Create user for tenant A."""
    return User(id="user-a", tenant_id=tenant_a.id, scopes=["read", "write", "delete"])


@pytest.fixture
async def user_b(tenant_b: Tenant) -> User:
    """Create user for tenant B."""
    return User(id="user-b", tenant_id=tenant_b.id, scopes=["read", "write", "delete"])
```

### 9.2 Cross-Tenant Access Tests

```python
async def test_tenant_a_cannot_access_tenant_b_documents(
    client: AsyncClient,
    db: AsyncSession,
    user_a: User,
    tenant_b: Tenant,
):
    """Verify tenant A cannot access tenant B's documents."""

    # Create document for tenant B
    doc = Document(
        tenant_id=tenant_b.id,
        filename="secret.pdf",
        content_type="application/pdf",
    )
    db.add(doc)
    await db.commit()

    # Try to access as user A
    response = await client.get(
        f"/api/v1/documents/{doc.id}",
        headers={"X-API-Key": user_a.api_key},
    )

    # Should return 404 (not 403 to avoid information disclosure)
    assert response.status_code == 404


async def test_tenant_a_cannot_search_tenant_b_embeddings(
    client: AsyncClient,
    db: AsyncSession,
    user_a: User,
    tenant_b: Tenant,
):
    """Verify tenant A cannot find tenant B's documents via vector search."""

    # Create document and embeddings for tenant B
    # ...

    # Search as user A
    response = await client.post(
        "/api/v1/search",
        json={"query": "secret content from tenant B"},
        headers={"X-API-Key": user_a.api_key},
    )

    # Should return empty results
    assert response.json()["total"] == 0
```

---

## Implementation Order

1. **Week 1: Database Schema**
   - Create Tenant and TenantAPIKey models
   - Create migration to add tenant_id to all models
   - Backfill existing data to default tenant

2. **Week 2: Authentication**
   - Update User model with tenant_id
   - Update API key verification to use TenantAPIKey
   - Add tenant context middleware

3. **Week 3: Route Updates**
   - Update all routes to filter by tenant_id
   - Update document upload to include tenant prefix
   - Update all queries to be tenant-scoped

4. **Week 4: Storage & Search**
   - Update storage paths to include tenant prefix
   - Migrate existing files (script)
   - Update vector search with tenant filter

5. **Week 5: Background Jobs & Audit**
   - Update job payloads with tenant context
   - Update worker to respect tenant boundaries
   - Update audit logging with tenant context

6. **Week 6: Testing & Validation**
   - Create multi-tenant test fixtures
   - Write cross-tenant access tests
   - Penetration testing for tenant isolation

---

## Files to Modify

### New Files
- `src/evidence_repository/models/tenant.py`
- `src/evidence_repository/models/tenant_api_key.py`
- `src/evidence_repository/db/tenant_queries.py`
- `alembic/versions/xxxx_add_multi_tenancy.py`
- `tests/test_multi_tenancy.py`

### Modified Files
- `src/evidence_repository/models/document.py`
- `src/evidence_repository/models/project.py`
- `src/evidence_repository/models/evidence.py`
- `src/evidence_repository/models/embedding.py`
- `src/evidence_repository/models/facts.py`
- `src/evidence_repository/models/ingestion.py`
- `src/evidence_repository/models/folder.py`
- `src/evidence_repository/models/integration_key.py`
- `src/evidence_repository/models/audit.py`
- `src/evidence_repository/models/job.py`
- `src/evidence_repository/api/dependencies.py`
- `src/evidence_repository/api/routes/documents.py`
- `src/evidence_repository/api/routes/projects.py`
- `src/evidence_repository/api/routes/search.py`
- `src/evidence_repository/api/routes/evidence.py`
- `src/evidence_repository/api/routes/extraction.py`
- `src/evidence_repository/api/routes/jobs.py`
- `src/evidence_repository/api/routes/folders.py`
- `src/evidence_repository/api/routes/ingest.py`
- `src/evidence_repository/api/routes/admin.py`
- `src/evidence_repository/api/routes/worker.py`
- `src/evidence_repository/storage/s3.py`
- `src/evidence_repository/storage/local.py`
- `src/evidence_repository/services/search_service.py`
- `src/evidence_repository/queue/tasks.py`

---

## Risk Mitigation

1. **Data Migration Risk**: Run migration during maintenance window, backup first
2. **Performance Impact**: Add indexes on tenant_id columns before going live
3. **Breaking API Changes**: Version the API (v2) for tenant-aware endpoints
4. **Backwards Compatibility**: Keep default tenant for existing integrations during transition
