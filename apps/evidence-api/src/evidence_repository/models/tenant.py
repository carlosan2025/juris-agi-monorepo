"""Tenant model for multi-tenancy support."""
import uuid
import hashlib
import secrets
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from evidence_repository.models.base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from evidence_repository.models.document import Document
    from evidence_repository.models.project import Project


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
    api_keys: Mapped[list["TenantAPIKey"]] = relationship(
        "TenantAPIKey",
        back_populates="tenant",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Tenant {self.slug} ({self.id})>"


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
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="api_keys")

    # Indexes
    __table_args__ = (
        Index("ix_tenant_api_keys_tenant_active", "tenant_id", "is_active"),
    )

    @classmethod
    def hash_key(cls, api_key: str) -> str:
        """Hash an API key for storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()

    @classmethod
    def generate_key(cls) -> str:
        """Generate a new secure API key."""
        return secrets.token_hex(32)  # 64 character hex string

    @classmethod
    def create_for_tenant(
        cls,
        tenant_id: uuid.UUID,
        name: str,
        scopes: list[str] | None = None,
        created_by: str | None = None,
        expires_at: datetime | None = None,
    ) -> tuple["TenantAPIKey", str]:
        """Create a new API key for a tenant.

        Returns:
            Tuple of (TenantAPIKey instance, plaintext_key)
            Note: The plaintext key is only returned once and should be shown to the user.
        """
        plaintext_key = cls.generate_key()

        key = cls(
            tenant_id=tenant_id,
            name=name,
            key_hash=cls.hash_key(plaintext_key),
            key_prefix=plaintext_key[:12],
            scopes=scopes or ["read", "write", "delete"],
            created_by=created_by,
            expires_at=expires_at,
        )

        return key, plaintext_key

    def __repr__(self) -> str:
        return f"<TenantAPIKey {self.key_prefix}... ({self.tenant_id})>"
