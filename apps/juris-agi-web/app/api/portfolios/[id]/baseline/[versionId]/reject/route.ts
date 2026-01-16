import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/portfolios/[id]/baseline/[versionId]/reject
 * Rejects a baseline that's pending approval
 *
 * Workflow:
 * 1. PENDING_APPROVAL -> REJECTED (reject)
 * 2. User can then edit and resubmit the baseline
 *
 * Only OWNER or ORG_ADMIN can reject baselines
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
    const { rejectionReason } = body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

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

    // Only OWNER or ORG_ADMIN can reject
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can reject baselines' },
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

    // Check if status allows rejection
    if (baselineVersion.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { success: false, error: `Cannot reject a ${baselineVersion.status} baseline. Only PENDING_APPROVAL baselines can be rejected.` },
        { status: 400 }
      );
    }

    // Update the baseline to REJECTED
    const updatedVersion = await prisma.portfolioBaselineVersion.update({
      where: { id: versionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: session.user.id,
        rejectionReason: rejectionReason.trim(),
        // Clear approval fields if any
        approvedAt: null,
        approvedById: null,
      },
      include: {
        rejectedBy: {
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
      message: 'Baseline rejected',
      baselineVersion: {
        id: updatedVersion.id,
        status: updatedVersion.status,
        rejectedAt: updatedVersion.rejectedAt,
        rejectedBy: updatedVersion.rejectedBy,
        rejectionReason: updatedVersion.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Failed to reject baseline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to reject baseline', details: errorMessage },
      { status: 500 }
    );
  }
}
