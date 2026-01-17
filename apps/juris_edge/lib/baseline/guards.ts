/**
 * Portfolio Baseline Business Logic Guards
 *
 * These functions implement critical governance rules:
 * 1. No Cases can be created unless a Baseline is PUBLISHED
 * 2. Only DRAFT baselines can be edited
 * 3. Only one active (PUBLISHED) baseline per portfolio
 * 4. Published baselines are immutable
 */

import prisma from '@/lib/prisma';

/**
 * Result of a guard check
 */
export interface GuardResult {
  allowed: boolean;
  reason?: string;
  data?: unknown;
}

/**
 * Guard: Check if a portfolio has a published baseline
 *
 * Used to:
 * - Prevent case creation without a baseline
 * - Determine if portfolio is "operational"
 */
export async function portfolioHasPublishedBaseline(
  portfolioId: string
): Promise<GuardResult> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: {
      id: true,
      name: true,
      activeBaselineVersionId: true,
      activeBaselineVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!portfolio) {
    return {
      allowed: false,
      reason: 'Portfolio not found',
    };
  }

  if (!portfolio.activeBaselineVersionId) {
    return {
      allowed: false,
      reason: `Portfolio "${portfolio.name}" does not have a published baseline. Create and publish a baseline before creating cases.`,
    };
  }

  if (portfolio.activeBaselineVersion?.status !== 'PUBLISHED') {
    return {
      allowed: false,
      reason: `Portfolio "${portfolio.name}" has no active published baseline.`,
    };
  }

  return {
    allowed: true,
    data: {
      baselineId: portfolio.activeBaselineVersionId,
      baselineVersion: portfolio.activeBaselineVersion?.versionNumber,
    },
  };
}

/**
 * Guard: Check if a baseline can be edited
 *
 * Only DRAFT baselines can be edited
 */
export async function canEditBaseline(
  baselineVersionId: string
): Promise<GuardResult> {
  const baseline = await prisma.portfolioBaselineVersion.findUnique({
    where: { id: baselineVersionId },
    select: {
      id: true,
      versionNumber: true,
      status: true,
    },
  });

  if (!baseline) {
    return {
      allowed: false,
      reason: 'Baseline version not found',
    };
  }

  if (baseline.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Baseline v${baseline.versionNumber} is ${baseline.status} and cannot be edited. Only DRAFT baselines can be modified.`,
    };
  }

  return {
    allowed: true,
    data: { baseline },
  };
}

/**
 * Guard: Check if a baseline can be deleted
 *
 * Only DRAFT baselines can be deleted
 */
export async function canDeleteBaseline(
  baselineVersionId: string
): Promise<GuardResult> {
  const baseline = await prisma.portfolioBaselineVersion.findUnique({
    where: { id: baselineVersionId },
    select: {
      id: true,
      versionNumber: true,
      status: true,
      portfolio: {
        select: {
          activeBaselineVersionId: true,
        },
      },
    },
  });

  if (!baseline) {
    return {
      allowed: false,
      reason: 'Baseline version not found',
    };
  }

  if (baseline.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Baseline v${baseline.versionNumber} is ${baseline.status} and cannot be deleted. Only DRAFT baselines can be deleted.`,
    };
  }

  // Additional safety check - should never happen for DRAFT
  if (baseline.portfolio.activeBaselineVersionId === baselineVersionId) {
    return {
      allowed: false,
      reason: 'Cannot delete the active baseline version.',
    };
  }

  return {
    allowed: true,
    data: { baseline },
  };
}

/**
 * Guard: Check if a new baseline can be created for a portfolio
 *
 * Only one DRAFT baseline can exist at a time
 */
export async function canCreateNewBaseline(
  portfolioId: string
): Promise<GuardResult> {
  const existingDraft = await prisma.portfolioBaselineVersion.findFirst({
    where: {
      portfolioId,
      status: 'DRAFT',
    },
    select: {
      id: true,
      versionNumber: true,
    },
  });

  if (existingDraft) {
    return {
      allowed: false,
      reason: `A draft baseline (v${existingDraft.versionNumber}) already exists. Please edit the existing draft or publish/delete it first.`,
      data: { existingDraftId: existingDraft.id },
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Guard: Check if a baseline can be published
 *
 * Requirements:
 * 1. Must be in DRAFT status
 * 2. All modules must be valid (no validation errors)
 * 3. Required modules (MANDATES, GOVERNANCE_THRESHOLDS) must be complete
 */
export async function canPublishBaseline(
  baselineVersionId: string
): Promise<GuardResult> {
  const baseline = await prisma.portfolioBaselineVersion.findUnique({
    where: { id: baselineVersionId },
    include: {
      modules: {
        select: {
          moduleType: true,
          isValid: true,
          isComplete: true,
          validationErrors: true,
        },
      },
    },
  });

  if (!baseline) {
    return {
      allowed: false,
      reason: 'Baseline version not found',
    };
  }

  if (baseline.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Cannot publish a ${baseline.status} baseline. Only DRAFT baselines can be published.`,
    };
  }

  const blockers: string[] = [];

  // Check all modules are valid
  for (const module of baseline.modules) {
    if (!module.isValid) {
      blockers.push(`${module.moduleType}: Has validation errors`);
    }
  }

  // Check required modules are complete
  const requiredModules = ['MANDATES', 'GOVERNANCE_THRESHOLDS'];
  for (const required of requiredModules) {
    const module = baseline.modules.find((m) => m.moduleType === required);
    if (!module || !module.isComplete) {
      blockers.push(`${required}: Module must be complete before publishing`);
    }
  }

  if (blockers.length > 0) {
    return {
      allowed: false,
      reason: 'Cannot publish baseline due to validation issues',
      data: { blockers },
    };
  }

  return {
    allowed: true,
    data: { baseline },
  };
}

/**
 * Guard: Get the active baseline for case operations
 *
 * This is the main guard for case-related operations.
 * Returns the active baseline or throws an error if none exists.
 */
export async function getActiveBaselineForCase(
  portfolioId: string
): Promise<{
  baselineId: string;
  versionNumber: number;
  modules: {
    moduleType: string;
    payload: unknown;
  }[];
} | null> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: {
      activeBaselineVersionId: true,
      activeBaselineVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          modules: {
            select: {
              moduleType: true,
              payload: true,
            },
          },
        },
      },
    },
  });

  if (!portfolio?.activeBaselineVersionId || !portfolio.activeBaselineVersion) {
    return null;
  }

  if (portfolio.activeBaselineVersion.status !== 'PUBLISHED') {
    return null;
  }

  return {
    baselineId: portfolio.activeBaselineVersion.id,
    versionNumber: portfolio.activeBaselineVersion.versionNumber,
    modules: portfolio.activeBaselineVersion.modules,
  };
}

/**
 * Check if a user can access a portfolio for baseline operations
 */
export async function canAccessPortfolioBaseline(
  userId: string,
  portfolioId: string
): Promise<GuardResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
      companyRole: true,
    },
  });

  if (!user?.companyId) {
    return {
      allowed: false,
      reason: 'User not associated with a company',
    };
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: {
      companyId: true,
    },
  });

  if (!portfolio) {
    return {
      allowed: false,
      reason: 'Portfolio not found',
    };
  }

  if (portfolio.companyId !== user.companyId) {
    return {
      allowed: false,
      reason: 'Access denied - portfolio belongs to different company',
    };
  }

  return {
    allowed: true,
    data: {
      isAdmin: ['OWNER', 'ORG_ADMIN'].includes(user.companyRole),
    },
  };
}

/**
 * Check if a user can modify baselines (requires admin role)
 */
export async function canModifyBaseline(
  userId: string,
  portfolioId: string
): Promise<GuardResult> {
  const accessResult = await canAccessPortfolioBaseline(userId, portfolioId);

  if (!accessResult.allowed) {
    return accessResult;
  }

  const data = accessResult.data as { isAdmin: boolean };

  if (!data.isAdmin) {
    return {
      allowed: false,
      reason: 'Only administrators can modify baselines',
    };
  }

  return {
    allowed: true,
    data,
  };
}
