import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/portfolios/[id]/baseline/[versionId]/approve
 * Approves a baseline that's pending approval
 *
 * Workflow:
 * 1. PENDING_APPROVAL -> PUBLISHED (approve)
 * 2. Sets the approved baseline as the active baseline
 * 3. Archives the previous active baseline (if any)
 *
 * Only OWNER or ORG_ADMIN can approve baselines
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

    // Verify user has admin access
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

    // Only OWNER or ORG_ADMIN can approve
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can approve baselines' },
        { status: 403 }
      );
    }

    // Fetch the baseline version
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

    // Check if status allows approval
    if (baselineVersion.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { success: false, error: `Cannot approve a ${baselineVersion.status} baseline. Only PENDING_APPROVAL baselines can be approved.` },
        { status: 400 }
      );
    }

    const previousActiveBaselineId = baselineVersion.portfolio.activeBaselineVersionId;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Archive the previous active baseline if it exists and is different
      if (previousActiveBaselineId && previousActiveBaselineId !== versionId) {
        await tx.portfolioBaselineVersion.update({
          where: { id: previousActiveBaselineId },
          data: {
            status: 'ARCHIVED',
          },
        });
      }

      // Approve and publish the new baseline
      const updatedVersion = await tx.portfolioBaselineVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          approvedAt: new Date(),
          approvedById: session.user.id,
          publishedAt: new Date(),
        },
        include: {
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Set as the active baseline for the portfolio
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
          activeBaselineVersionId: versionId,
        },
      });

      return updatedVersion;
    });

    return NextResponse.json({
      success: true,
      message: 'Baseline approved and published',
      baselineVersion: {
        id: result.id,
        status: result.status,
        approvedAt: result.approvedAt,
        approvedBy: result.approvedBy,
        publishedAt: result.publishedAt,
      },
      previousBaselineArchived: previousActiveBaselineId && previousActiveBaselineId !== versionId,
    });
  } catch (error) {
    console.error('Failed to approve baseline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to approve baseline', details: errorMessage },
      { status: 500 }
    );
  }
}
