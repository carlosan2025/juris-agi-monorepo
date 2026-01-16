-- Migration: Add Portfolio Baseline (Constitution) Models
-- This migration creates the governance layer for portfolio baselines
--
-- Key invariants enforced:
-- 1. One Portfolio has exactly ONE active Baseline at any time (unique constraint)
-- 2. A Baseline is versioned (v1, v2, v3…) per portfolio
-- 3. A Baseline is portfolio-wide (not per mandate)
-- 4. Mandates live inside the Baseline (MANDATES module)
-- 5. No Cases can be created unless a Baseline is PUBLISHED
-- 6. Old Baselines are immutable (enforced by application logic)

-- Create the PortfolioBaselineStatus enum
CREATE TYPE "PortfolioBaselineStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Create the PortfolioBaselineModuleType enum
CREATE TYPE "PortfolioBaselineModuleType" AS ENUM (
    'MANDATES',
    'EXCLUSIONS',
    'RISK_APPETITE',
    'GOVERNANCE_THRESHOLDS',
    'REPORTING_OBLIGATIONS',
    'EVIDENCE_ADMISSIBILITY'
);

-- Create the PortfolioBaselineVersion table
CREATE TABLE "PortfolioBaselineVersion" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "PortfolioBaselineStatus" NOT NULL DEFAULT 'DRAFT',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "parentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "changeSummary" TEXT,
    "contentHash" TEXT,

    CONSTRAINT "PortfolioBaselineVersion_pkey" PRIMARY KEY ("id")
);

-- Create the PortfolioBaselineModule table
CREATE TABLE "PortfolioBaselineModule" (
    "id" TEXT NOT NULL,
    "baselineVersionId" TEXT NOT NULL,
    "moduleType" "PortfolioBaselineModuleType" NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PortfolioBaselineModule_pkey" PRIMARY KEY ("id")
);

-- Add activeBaselineVersionId to Portfolio
ALTER TABLE "Portfolio" ADD COLUMN "activeBaselineVersionId" TEXT;

-- Create unique constraints
-- Ensure only one version number per portfolio
CREATE UNIQUE INDEX "PortfolioBaselineVersion_portfolioId_versionNumber_key"
ON "PortfolioBaselineVersion"("portfolioId", "versionNumber");

-- Ensure only one module of each type per baseline version
CREATE UNIQUE INDEX "PortfolioBaselineModule_baselineVersionId_moduleType_key"
ON "PortfolioBaselineModule"("baselineVersionId", "moduleType");

-- Ensure only one active baseline per portfolio (enforced by unique FK)
CREATE UNIQUE INDEX "Portfolio_activeBaselineVersionId_key"
ON "Portfolio"("activeBaselineVersionId");

-- Create indexes for performance
CREATE INDEX "PortfolioBaselineVersion_portfolioId_idx" ON "PortfolioBaselineVersion"("portfolioId");
CREATE INDEX "PortfolioBaselineVersion_status_idx" ON "PortfolioBaselineVersion"("status");
CREATE INDEX "PortfolioBaselineVersion_createdById_idx" ON "PortfolioBaselineVersion"("createdById");
CREATE INDEX "PortfolioBaselineModule_baselineVersionId_idx" ON "PortfolioBaselineModule"("baselineVersionId");
CREATE INDEX "PortfolioBaselineModule_moduleType_idx" ON "PortfolioBaselineModule"("moduleType");

-- Add foreign key constraints
ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_parentVersionId_fkey"
FOREIGN KEY ("parentVersionId") REFERENCES "PortfolioBaselineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_publishedById_fkey"
FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineModule" ADD CONSTRAINT "PortfolioBaselineModule_baselineVersionId_fkey"
FOREIGN KEY ("baselineVersionId") REFERENCES "PortfolioBaselineVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineModule" ADD CONSTRAINT "PortfolioBaselineModule_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_activeBaselineVersionId_fkey"
FOREIGN KEY ("activeBaselineVersionId") REFERENCES "PortfolioBaselineVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
