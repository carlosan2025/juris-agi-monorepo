import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PortfolioBaselineModuleType } from '@/lib/baseline/types';
import { canPublishBaseline } from '@/lib/baseline/validation';
import crypto from 'crypto';

/**
 * POST /api/portfolios/[id]/baseline/[versionId]/publish
 * Publishes a baseline version, making it the active baseline for the portfolio
 *
 * Business logic guards:
 * 1. Only DRAFT versions can be published
 * 2. All modules must be valid (no validation errors)
 * 3. Required modules (MANDATES, GOVERNANCE_THRESHOLDS) must be complete
 * 4. Previous active baseline is archived
 * 5. Published baselines are immutable
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId, versionId } = await params;
    const body = await request.json().catch(() => ({}));
    const { confirmArchivePrevious = false } = body;

    // Verify user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can publish baseline versions' },
        { status: 403 }
      );
    }

    // Fetch the baseline version with all modules and portfolio info
    const baselineVersion = await prisma.portfolioBaselineVersion.findUnique({
      where: { id: versionId },
      include: {
        portfolio: {
          select: {
            id: true,
            companyId: true,
            name: true,
            activeBaselineVersionId: true,
          },
        },
        modules: true,
      },
    });

    if (!baselineVersion) {
      return NextResponse.json(
        { success: false, error: 'Baseline version not found' },
        { status: 404 }
      );
    }

    // Verify portfolio ID matches
    if (baselineVersion.portfolioId !== portfolioId) {
      return NextResponse.json(
        { success: false, error: 'Baseline version does not belong to this portfolio' },
        { status: 400 }
      );
    }

    // Verify user has access (same company)
    if (baselineVersion.portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if version is in DRAFT status
    if (baselineVersion.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: `Cannot publish a ${baselineVersion.status} baseline version` },
        { status: 400 }
      );
    }

    // Validate all modules using the canPublishBaseline guard
    const modulesForValidation = baselineVersion.modules.map((m) => ({
      moduleType: m.moduleType as PortfolioBaselineModuleType,
      payload: m.payload,
    }));

    const publishCheck = canPublishBaseline(modulesForValidation);

    if (!publishCheck.canPublish) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot publish baseline due to validation errors',
          blockers: publishCheck.blockers,
        },
        { status: 400 }
      );
    }

    // Check if there's a current active baseline that needs to be archived
    const currentActiveBaselineId = baselineVersion.portfolio.activeBaselineVersionId;

    if (currentActiveBaselineId && !confirmArchivePrevious) {
      // Return a confirmation request
      const currentActiveBaseline = await prisma.portfolioBaselineVersion.findUnique({
        where: { id: currentActiveBaselineId },
        select: {
          id: true,
          versionNumber: true,
          publishedAt: true,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'CONFIRMATION_REQUIRED',
          message: 'Publishing this baseline will archive the current active baseline',
          currentActiveBaseline,
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    // Generate content hash for audit trail
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(baselineVersion.modules.map((m) => m.payload)))
      .digest('hex');

    // Perform the publish operation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Archive the current active baseline if exists
      if (currentActiveBaselineId) {
        await tx.portfolioBaselineVersion.update({
          where: { id: currentActiveBaselineId },
          data: { status: 'ARCHIVED' },
        });
      }

      // Publish the new baseline
      const publishedBaseline = await tx.portfolioBaselineVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedById: session.user.id,
          contentHash,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          publishedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          modules: {
            select: {
              moduleType: true,
              isComplete: true,
              isValid: true,
            },
          },
        },
      });

      // Set as the active baseline for the portfolio
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { activeBaselineVersionId: versionId },
      });

      return publishedBaseline;
    });

    return NextResponse.json({
      success: true,
      message: 'Baseline published successfully',
      baselineVersion: {
        id: result.id,
        portfolioId: result.portfolioId,
        versionNumber: result.versionNumber,
        status: result.status,
        publishedAt: result.publishedAt,
        publishedBy: result.publishedBy,
        contentHash: result.contentHash,
        createdBy: result.createdBy,
        createdAt: result.createdAt,
        changeSummary: result.changeSummary,
        modulesSummary: {
          total: result.modules.length,
          complete: result.modules.filter((m) => m.isComplete).length,
          valid: result.modules.filter((m) => m.isValid).length,
        },
      },
      archivedPreviousBaseline: currentActiveBaselineId || null,
    });
  } catch (error) {
    console.error('Failed to publish baseline version:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to publish baseline version', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolios/[id]/baseline/[versionId]/publish
 * Pre-flight check for publishing a baseline
 * Returns validation status and any blockers
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId, versionId } = await params;

    // Verify user has access
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Fetch the baseline version with all modules
    const baselineVersion = await prisma.portfolioBaselineVersion.findUnique({
      where: { id: versionId },
      include: {
        portfolio: {
          select: {
            id: true,
            companyId: true,
            activeBaselineVersionId: true,
          },
        },
        modules: true,
      },
    });

    if (!baselineVersion) {
      return NextResponse.json(
        { success: false, error: 'Baseline version not found' },
        { status: 404 }
      );
    }

    // Verify portfolio ID matches
    if (baselineVersion.portfolioId !== portfolioId) {
      return NextResponse.json(
        { success: false, error: 'Baseline version does not belong to this portfolio' },
        { status: 400 }
      );
    }

    // Verify user has access (same company)
    if (baselineVersion.portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build blockers list
    const blockers: string[] = [];

    // Check status
    if (baselineVersion.status !== 'DRAFT') {
      blockers.push(`Cannot publish a ${baselineVersion.status} baseline version`);
    }

    // Check user role
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      blockers.push('Only administrators can publish baseline versions');
    }

    // Validate all modules
    const modulesForValidation = baselineVersion.modules.map((m) => ({
      moduleType: m.moduleType as PortfolioBaselineModuleType,
      payload: m.payload,
    }));

    const publishCheck = canPublishBaseline(modulesForValidation);
    blockers.push(...publishCheck.blockers);

    // Check if there's a current active baseline
    const willArchiveExisting = baselineVersion.portfolio.activeBaselineVersionId !== null;

    return NextResponse.json({
      success: true,
      canPublish: blockers.length === 0,
      blockers,
      willArchiveExisting,
      currentActiveBaselineId: baselineVersion.portfolio.activeBaselineVersionId,
      modulesSummary: baselineVersion.modules.map((m) => ({
        moduleType: m.moduleType,
        isComplete: m.isComplete,
        isValid: m.isValid,
        hasErrors: m.validationErrors !== null,
      })),
    });
  } catch (error) {
    console.error('Failed to check publish status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check publish status' },
      { status: 500 }
    );
  }
}
