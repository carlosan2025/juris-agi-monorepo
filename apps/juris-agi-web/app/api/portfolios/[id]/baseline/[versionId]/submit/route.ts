import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canPublishBaseline } from '@/lib/baseline/validation';
import type { PortfolioBaselineModuleType } from '@/lib/baseline/types';

/**
 * POST /api/portfolios/[id]/baseline/[versionId]/submit
 * Submits a baseline for approval
 *
 * Workflow:
 * 1. DRAFT -> PENDING_APPROVAL (submit for review)
 * 2. REJECTED -> PENDING_APPROVAL (resubmit after fixes)
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
    const { changeSummary } = body;

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

    // Fetch the baseline version with modules
    const baselineVersion = await prisma.portfolioBaselineVersion.findUnique({
      where: { id: versionId },
      include: {
        portfolio: {
          select: {
            id: true,
            companyId: true,
            name: true,
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

    // Check if status allows submission
    if (baselineVersion.status !== 'DRAFT' && baselineVersion.status !== 'REJECTED') {
      return NextResponse.json(
        { success: false, error: `Cannot submit a ${baselineVersion.status} baseline. Only DRAFT or REJECTED baselines can be submitted.` },
        { status: 400 }
      );
    }

    // Validate all modules
    const modulesForValidation = baselineVersion.modules.map((m) => ({
      moduleType: m.moduleType as PortfolioBaselineModuleType,
      payload: m.payload,
    }));

    const publishCheck = canPublishBaseline(modulesForValidation);

    if (!publishCheck.canPublish) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot submit baseline due to validation errors',
          blockers: publishCheck.blockers,
        },
        { status: 400 }
      );
    }

    // Update the baseline to PENDING_APPROVAL
    const updatedVersion = await prisma.portfolioBaselineVersion.update({
      where: { id: versionId },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        submittedById: session.user.id,
        changeSummary: changeSummary || baselineVersion.changeSummary,
        // Clear rejection fields if resubmitting
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Baseline submitted for approval',
      baselineVersion: {
        id: updatedVersion.id,
        status: updatedVersion.status,
        submittedAt: updatedVersion.submittedAt,
        submittedBy: updatedVersion.submittedBy,
      },
    });
  } catch (error) {
    console.error('Failed to submit baseline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to submit baseline', details: errorMessage },
      { status: 500 }
    );
  }
}
