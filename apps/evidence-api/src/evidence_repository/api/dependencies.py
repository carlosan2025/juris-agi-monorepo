"""FastAPI dependency injection with multi-tenancy support."""

import hashlib
import uuid
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from evidence_repository.config import get_settings
from evidence_repository.db.session import get_db_session
from evidence_repository.models import Tenant, TenantAPIKey
from evidence_repository.storage import StorageBackend, get_storage_backend


@dataclass
class User:
    """Represents an authenticated user/API client with tenant context.

    All authenticated users are bound to a specific tenant for data isolation.
    """

    id: str
    tenant_id: uuid.UUID
    tenant_slug: str
    api_key: str | None = None
    # JWT fields (for future use)
    email: str | None = None
    name: str | None = None
    roles: list[str] = field(default_factory=list)
    scopes: list[str] = field(default_factory=list)

    @property
    def is_api_key_auth(self) -> bool:
        """Check if authenticated via API key."""
        return self.api_key is not None

    def has_scope(self, scope: str) -> bool:
        """Check if user has a specific scope/permission."""
        return scope in self.scopes or "*" in self.scopes


async def verify_api_key_db(api_key: str, db: AsyncSession) -> User:
    """Verify an API key against the database and return a User with tenant context.

    Args:
        api_key: The API key to verify.
        db: Database session.

    Returns:
        User object with tenant_id if valid.

    Raises:
        HTTPException: If API key is invalid or tenant is suspended.
    """
    # Hash the API key for lookup
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    # Query for the API key with tenant info
    stmt = (
        select(TenantAPIKey, Tenant)
        .join(Tenant, TenantAPIKey.tenant_id == Tenant.id)
        .where(TenantAPIKey.key_hash == key_hash)
        .where(TenantAPIKey.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    api_key_record, tenant = row

    # Check if API key has expired
    if api_key_record.expires_at and api_key_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Check if tenant is active
    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is suspended",
        )

    if tenant.suspended_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant account is suspended: {tenant.suspension_reason or 'Contact support'}",
        )

    # Update last_used_at timestamp (fire and forget)
    await db.execute(
        update(TenantAPIKey)
        .where(TenantAPIKey.id == api_key_record.id)
        .values(last_used_at=datetime.now(timezone.utc))
    )
    await db.commit()

    # Create user with tenant context
    return User(
        id=f"apikey:{api_key_record.key_prefix}",
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        api_key=api_key_record.key_prefix,  # Only store prefix for logging
        name=api_key_record.name,
        scopes=api_key_record.scopes or [],
    )


async def verify_api_key_legacy(api_key: str) -> User | None:
    """Verify against legacy environment-based API keys.

    This provides backwards compatibility during migration.
    Returns None if key is not in legacy config.
    """
    settings = get_settings()

    if api_key in settings.api_keys:
        # Legacy keys get a default tenant context
        # This should be updated to use a real tenant after migration
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:12]
        return User(
            id=f"legacy:{key_hash}",
            tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),  # Placeholder
            tenant_slug="legacy",
            api_key=api_key[:8] if len(api_key) > 8 else api_key,
            scopes=["*"],  # Full access for legacy keys
        )

    return None


async def verify_api_key(api_key: str, db: AsyncSession) -> User:
    """Verify an API key and return a User with tenant context.

    Tries database lookup first, falls back to legacy env-based keys.

    Args:
        api_key: The API key to verify.
        db: Database session.

    Returns:
        User object if valid.

    Raises:
        HTTPException: If API key is invalid.
    """
    # Try database-backed API key first
    try:
        return await verify_api_key_db(api_key, db)
    except HTTPException as e:
        # If it's a 401 (invalid key), try legacy
        if e.status_code == status.HTTP_401_UNAUTHORIZED:
            legacy_user = await verify_api_key_legacy(api_key)
            if legacy_user:
                return legacy_user
        # Re-raise the original exception
        raise


async def verify_jwt(token: str) -> User:
    """Verify a JWT token and return a User.

    This is a placeholder for future JWT authentication.

    Args:
        token: JWT token to verify.

    Returns:
        User object if valid.

    Raises:
        HTTPException: If token is invalid.
    """
    # TODO: Implement JWT verification when upgrading auth
    # JWT tokens should include tenant_id in claims
    # from jose import JWTError, jwt
    # settings = get_settings()
    # try:
    #     payload = jwt.decode(
    #         token,
    #         settings.jwt_secret_key,
    #         algorithms=[settings.jwt_algorithm],
    #     )
    #     return User(
    #         id=payload["sub"],
    #         tenant_id=uuid.UUID(payload["tenant_id"]),
    #         tenant_slug=payload["tenant_slug"],
    #         email=payload.get("email"),
    #         name=payload.get("name"),
    #         roles=payload.get("roles", []),
    #         scopes=payload.get("scopes", []),
    #     )
    # except JWTError as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail=f"Invalid token: {e}",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="JWT authentication not yet implemented",
    )


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> User:
    """Dependency to get the current authenticated user with tenant context.

    Supports both API key and JWT authentication (JWT for future use).
    API key takes precedence for backwards compatibility.

    Args:
        request: FastAPI request object.
        db: Database session.
        x_api_key: API key from X-API-Key header.
        authorization: Authorization header (for Bearer token).

    Returns:
        Authenticated User object with tenant_id.

    Raises:
        HTTPException: If authentication fails.
    """
    # Try API key first
    if x_api_key:
        user = await verify_api_key(x_api_key, db)
        # Store user in request state for audit logging
        request.state.user = user
        request.state.tenant_id = user.tenant_id
        return user

    # Try JWT Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        user = await verify_jwt(token)
        request.state.user = user
        request.state.tenant_id = user.tenant_id
        return user

    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide X-API-Key header or Bearer token.",
        headers={"WWW-Authenticate": 'ApiKey, Bearer realm="evidence-repository"'},
    )


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> User | None:
    """Dependency to optionally get the current user with tenant context.

    Returns None if no authentication is provided (for public endpoints).
    """
    if not x_api_key and not authorization:
        return None

    return await get_current_user(request, db, x_api_key, authorization)


def get_tenant_id(user: User = Depends(get_current_user)) -> uuid.UUID:
    """Dependency to extract tenant_id from the authenticated user.

    Use this when you only need the tenant_id for filtering.
    """
    return user.tenant_id


@lru_cache
def get_storage() -> StorageBackend:
    """Dependency to get the configured storage backend.

    Cached to ensure single instance across requests.
    """
    return get_storage_backend()


async def get_db(db: AsyncSession = Depends(get_db_session)) -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session.

    This is a pass-through to make the dependency injection cleaner.
    """
    yield db
