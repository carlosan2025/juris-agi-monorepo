-- Migration: Add Baseline Approval Workflow
-- This migration adds the approval workflow to portfolio baselines
-- Key changes:
-- 1. Add PENDING_APPROVAL and REJECTED to PortfolioBaselineStatus enum
-- 2. Add submission tracking fields (submittedAt, submittedById)
-- 3. Add approval tracking fields (approvedAt, approvedById)
-- 4. Add rejection tracking fields (rejectedAt, rejectedById, rejectionReason)

-- Add new values to PortfolioBaselineStatus enum
ALTER TYPE "PortfolioBaselineStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "PortfolioBaselineStatus" ADD VALUE 'REJECTED';

-- Add submission tracking columns
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "submittedById" TEXT;

-- Add approval tracking columns
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "approvedById" TEXT;

-- Add rejection tracking columns
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "PortfolioBaselineVersion" ADD COLUMN "rejectionReason" TEXT;

-- Add foreign key constraints
ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_submittedById_fkey"
FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioBaselineVersion" ADD CONSTRAINT "PortfolioBaselineVersion_rejectedById_fkey"
FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "PortfolioBaselineVersion_submittedById_idx" ON "PortfolioBaselineVersion"("submittedById");
CREATE INDEX "PortfolioBaselineVersion_approvedById_idx" ON "PortfolioBaselineVersion"("approvedById");
