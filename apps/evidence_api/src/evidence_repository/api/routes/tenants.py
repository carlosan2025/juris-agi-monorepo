"""Tenant management API routes.

These endpoints are for system administrators to manage tenants and their API keys.
"""

import hashlib
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from evidence_repository.api.dependencies import User, get_current_user
from evidence_repository.db.session import get_db_session
from evidence_repository.models import Tenant, TenantAPIKey

router = APIRouter()


# =============================================================================
# Pydantic Schemas
# =============================================================================


class TenantCreate(BaseModel):
    """Request schema for creating a tenant."""

    name: str = Field(..., min_length=1, max_length=255, description="Tenant/organization name")
    slug: str = Field(
        ...,
        min_length=1,
        max_length=100,
        pattern=r"^[a-z0-9-]+$",
        description="URL-safe slug (lowercase, alphanumeric, hyphens only)",
    )
    owner_email: str = Field(..., description="Primary contact email")
    billing_email: str | None = Field(None, description="Billing contact email")


class TenantResponse(BaseModel):
    """Response schema for tenant details."""

    id: uuid.UUID
    name: str
    slug: str
    owner_email: str
    billing_email: str | None
    is_active: bool
    created_at: str
    api_keys_count: int = 0

    class Config:
        from_attributes = True


class TenantAPIKeyCreate(BaseModel):
    """Request schema for creating a tenant API key."""

    name: str = Field(..., min_length=1, max_length=255, description="API key name/label")
    scopes: list[str] = Field(
        default=["*"],
        description="Permission scopes (e.g., ['documents:read', 'documents:write'])",
    )


class TenantAPIKeyResponse(BaseModel):
    """Response schema for tenant API key (includes full key only on creation)."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    created_at: str
    # Only populated on creation
    api_key: str | None = Field(None, description="Full API key (only shown once on creation)")


# =============================================================================
# Tenant Management Endpoints
# =============================================================================


@router.post(
    "",
    response_model=TenantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Tenant",
    description="Create a new tenant/organization. Requires admin privileges.",
)
async def create_tenant(
    data: TenantCreate,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> TenantResponse:
    """Create a new tenant."""
    # Check if slug already exists
    existing = await db.execute(select(Tenant).where(Tenant.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tenant with slug '{data.slug}' already exists",
        )

    # Create tenant
    tenant = Tenant(
        name=data.name,
        slug=data.slug,
        owner_email=data.owner_email,
        billing_email=data.billing_email,
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)

    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        owner_email=tenant.owner_email,
        billing_email=tenant.billing_email,
        is_active=tenant.is_active,
        created_at=tenant.created_at.isoformat(),
        api_keys_count=0,
    )


@router.get(
    "",
    response_model=list[TenantResponse],
    summary="List Tenants",
    description="List all tenants. Requires admin privileges.",
)
async def list_tenants(
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> list[TenantResponse]:
    """List all tenants."""
    query = select(Tenant).order_by(Tenant.created_at.desc())
    if is_active is not None:
        query = query.where(Tenant.is_active == is_active)

    result = await db.execute(query)
    tenants = result.scalars().all()

    # Get API key counts
    responses = []
    for tenant in tenants:
        key_count_result = await db.execute(
            select(TenantAPIKey).where(TenantAPIKey.tenant_id == tenant.id)
        )
        key_count = len(key_count_result.scalars().all())

        responses.append(
            TenantResponse(
                id=tenant.id,
                name=tenant.name,
                slug=tenant.slug,
                owner_email=tenant.owner_email,
                billing_email=tenant.billing_email,
                is_active=tenant.is_active,
                created_at=tenant.created_at.isoformat(),
                api_keys_count=key_count,
            )
        )

    return responses


@router.get(
    "/{tenant_id}",
    response_model=TenantResponse,
    summary="Get Tenant",
    description="Get tenant details by ID.",
)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> TenantResponse:
    """Get tenant by ID."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found",
        )

    # Get API key count
    key_count_result = await db.execute(
        select(TenantAPIKey).where(TenantAPIKey.tenant_id == tenant.id)
    )
    key_count = len(key_count_result.scalars().all())

    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        owner_email=tenant.owner_email,
        billing_email=tenant.billing_email,
        is_active=tenant.is_active,
        created_at=tenant.created_at.isoformat(),
        api_keys_count=key_count,
    )


# =============================================================================
# Tenant API Key Management Endpoints
# =============================================================================


@router.post(
    "/{tenant_id}/api-keys",
    response_model=TenantAPIKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Tenant API Key",
    description="""
Create a new API key for a tenant.

**IMPORTANT**: The full API key is only returned once in the response.
Store it securely as it cannot be retrieved again.
    """,
)
async def create_tenant_api_key(
    tenant_id: uuid.UUID,
    data: TenantAPIKeyCreate,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> TenantAPIKeyResponse:
    """Create a new API key for a tenant."""
    # Verify tenant exists
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found",
        )

    # Generate secure API key
    # Format: jrs_{random_32_chars} (total 36 chars)
    raw_key = f"jrs_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12]  # "jrs_" + first 8 chars of random part

    # Create API key record
    api_key = TenantAPIKey(
        tenant_id=tenant_id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scopes=data.scopes,
        created_by=user.id,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return TenantAPIKeyResponse(
        id=api_key.id,
        tenant_id=api_key.tenant_id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        scopes=api_key.scopes,
        is_active=api_key.is_active,
        created_at=api_key.created_at.isoformat(),
        api_key=raw_key,  # Only returned on creation!
    )


@router.get(
    "/{tenant_id}/api-keys",
    response_model=list[TenantAPIKeyResponse],
    summary="List Tenant API Keys",
    description="List all API keys for a tenant (keys are not returned, only prefixes).",
)
async def list_tenant_api_keys(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> list[TenantAPIKeyResponse]:
    """List all API keys for a tenant."""
    # Verify tenant exists
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found",
        )

    # Get API keys
    keys_result = await db.execute(
        select(TenantAPIKey)
        .where(TenantAPIKey.tenant_id == tenant_id)
        .order_by(TenantAPIKey.created_at.desc())
    )
    keys = keys_result.scalars().all()

    return [
        TenantAPIKeyResponse(
            id=key.id,
            tenant_id=key.tenant_id,
            name=key.name,
            key_prefix=key.key_prefix,
            scopes=key.scopes,
            is_active=key.is_active,
            created_at=key.created_at.isoformat(),
            api_key=None,  # Never return the full key after creation
        )
        for key in keys
    ]


@router.delete(
    "/{tenant_id}/api-keys/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke Tenant API Key",
    description="Revoke (deactivate) a tenant API key.",
)
async def revoke_tenant_api_key(
    tenant_id: uuid.UUID,
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> None:
    """Revoke a tenant API key."""
    result = await db.execute(
        select(TenantAPIKey).where(
            TenantAPIKey.id == key_id,
            TenantAPIKey.tenant_id == tenant_id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key {key_id} not found for tenant {tenant_id}",
        )

    api_key.is_active = False
    await db.commit()
