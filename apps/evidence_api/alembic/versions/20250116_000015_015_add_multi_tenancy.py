"""Add multi-tenancy support with tenant isolation.

Revision ID: 015
Revises: 014
Create Date: 2025-01-16

This migration adds:
1. New tenants table for organization/company records
2. New tenant_api_keys table for API key authentication
3. tenant_id foreign key column to all data tables for isolation
4. Indexes for efficient tenant-scoped queries
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============================================
    # 1. Create tenants table
    # ============================================
    op.create_table(
        "tenants",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("owner_email", sa.String(255), nullable=False),
        sa.Column("billing_email", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("suspension_reason", sa.Text, nullable=True),
        sa.Column(
            "settings",
            postgresql.JSON,
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("slug", name="uq_tenants_slug"),
    )

    # Indexes for tenants
    op.create_index("ix_tenants_slug", "tenants", ["slug"])
    op.create_index("ix_tenants_is_active", "tenants", ["is_active"])
    op.create_index("ix_tenants_owner_email", "tenants", ["owner_email"])

    # ============================================
    # 2. Create tenant_api_keys table
    # ============================================
    op.create_table(
        "tenant_api_keys",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(64), nullable=False),
        sa.Column("key_prefix", sa.String(12), nullable=False),
        sa.Column(
            "scopes",
            postgresql.JSON,
            nullable=False,
            server_default="[]",
        ),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_by", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("key_hash", name="uq_tenant_api_keys_key_hash"),
    )

    # Indexes for tenant_api_keys
    op.create_index("ix_tenant_api_keys_tenant_id", "tenant_api_keys", ["tenant_id"])
    op.create_index("ix_tenant_api_keys_key_hash", "tenant_api_keys", ["key_hash"])
    op.create_index("ix_tenant_api_keys_key_prefix", "tenant_api_keys", ["key_prefix"])
    op.create_index("ix_tenant_api_keys_is_active", "tenant_api_keys", ["is_active"])

    # ============================================
    # 3. Add tenant_id to documents table
    # ============================================
    op.add_column(
        "documents",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_documents_tenant_id", "documents", ["tenant_id"])
    op.create_index("ix_documents_tenant_created", "documents", ["tenant_id", "created_at"])
    op.create_index("ix_documents_tenant_filename", "documents", ["tenant_id", "filename"])

    # ============================================
    # 4. Add tenant_id to projects table
    # ============================================
    op.add_column(
        "projects",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_projects_tenant_id", "projects", ["tenant_id"])

    # ============================================
    # 5. Add tenant_id to embedding_chunks table
    # ============================================
    op.add_column(
        "embedding_chunks",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_embedding_chunks_tenant_id", "embedding_chunks", ["tenant_id"])
    op.create_index("ix_embedding_chunks_tenant_created", "embedding_chunks", ["tenant_id", "created_at"])

    # ============================================
    # 6. Add tenant_id to ingestion_batches table
    # ============================================
    op.add_column(
        "ingestion_batches",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_ingestion_batches_tenant_id", "ingestion_batches", ["tenant_id"])
    op.create_index("ix_ingestion_batches_tenant_status", "ingestion_batches", ["tenant_id", "status"])

    # ============================================
    # 7. Add tenant_id to integration_keys table
    # ============================================
    op.add_column(
        "integration_keys",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_integration_keys_tenant_id", "integration_keys", ["tenant_id"])
    op.create_index("ix_integration_keys_tenant_provider", "integration_keys", ["tenant_id", "provider"])

    # ============================================
    # 8. Add tenant_id to audit_logs table
    # ============================================
    op.add_column(
        "audit_logs",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_audit_logs_tenant_id", "audit_logs", ["tenant_id"])
    op.create_index("ix_audit_logs_tenant_timestamp", "audit_logs", ["tenant_id", "timestamp"])
    op.create_index("ix_audit_logs_tenant_action", "audit_logs", ["tenant_id", "action"])

    # ============================================
    # 9. Add tenant_id to jobs table
    # ============================================
    op.add_column(
        "jobs",
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_index("ix_jobs_tenant_id", "jobs", ["tenant_id"])
    op.create_index("ix_jobs_tenant_status", "jobs", ["tenant_id", "status"])
    op.create_index("ix_jobs_tenant_type", "jobs", ["tenant_id", "type"])


def downgrade() -> None:
    # ============================================
    # Remove tenant_id from all tables (reverse order)
    # ============================================

    # Jobs
    op.drop_index("ix_jobs_tenant_type", table_name="jobs")
    op.drop_index("ix_jobs_tenant_status", table_name="jobs")
    op.drop_index("ix_jobs_tenant_id", table_name="jobs")
    op.drop_column("jobs", "tenant_id")

    # Audit logs
    op.drop_index("ix_audit_logs_tenant_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_tenant_timestamp", table_name="audit_logs")
    op.drop_index("ix_audit_logs_tenant_id", table_name="audit_logs")
    op.drop_column("audit_logs", "tenant_id")

    # Integration keys
    op.drop_index("ix_integration_keys_tenant_provider", table_name="integration_keys")
    op.drop_index("ix_integration_keys_tenant_id", table_name="integration_keys")
    op.drop_column("integration_keys", "tenant_id")

    # Ingestion batches
    op.drop_index("ix_ingestion_batches_tenant_status", table_name="ingestion_batches")
    op.drop_index("ix_ingestion_batches_tenant_id", table_name="ingestion_batches")
    op.drop_column("ingestion_batches", "tenant_id")

    # Embedding chunks
    op.drop_index("ix_embedding_chunks_tenant_created", table_name="embedding_chunks")
    op.drop_index("ix_embedding_chunks_tenant_id", table_name="embedding_chunks")
    op.drop_column("embedding_chunks", "tenant_id")

    # Projects
    op.drop_index("ix_projects_tenant_id", table_name="projects")
    op.drop_column("projects", "tenant_id")

    # Documents
    op.drop_index("ix_documents_tenant_filename", table_name="documents")
    op.drop_index("ix_documents_tenant_created", table_name="documents")
    op.drop_index("ix_documents_tenant_id", table_name="documents")
    op.drop_column("documents", "tenant_id")

    # Tenant API keys table
    op.drop_index("ix_tenant_api_keys_is_active", table_name="tenant_api_keys")
    op.drop_index("ix_tenant_api_keys_key_prefix", table_name="tenant_api_keys")
    op.drop_index("ix_tenant_api_keys_key_hash", table_name="tenant_api_keys")
    op.drop_index("ix_tenant_api_keys_tenant_id", table_name="tenant_api_keys")
    op.drop_table("tenant_api_keys")

    # Tenants table
    op.drop_index("ix_tenants_owner_email", table_name="tenants")
    op.drop_index("ix_tenants_is_active", table_name="tenants")
    op.drop_index("ix_tenants_slug", table_name="tenants")
    op.drop_table("tenants")
