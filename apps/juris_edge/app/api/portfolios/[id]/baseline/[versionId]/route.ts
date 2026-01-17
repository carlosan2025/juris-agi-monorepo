import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/portfolios/[id]/baseline/[versionId]
 * Fetches a single baseline version with all its modules
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

    // Fetch the baseline version with all related data
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
        modules: {
          orderBy: { moduleType: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rejectedBy: {
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
        parentVersion: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
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

    // Get user's portfolio access level
    const portfolioMembership = await prisma.portfolioMember.findUnique({
      where: {
        portfolioId_userId: {
          portfolioId,
          userId: session.user.id,
        },
      },
      select: { accessLevel: true },
    });

    // Determine user's effective role
    const isCompanyAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    const isMaker = portfolioMembership?.accessLevel === 'MAKER';
    const isChecker = portfolioMembership?.accessLevel === 'CHECKER';
    const userAccessLevel = portfolioMembership?.accessLevel || (isCompanyAdmin ? 'ADMIN' : 'VIEWER');

    // Compute permission flags based on status and user role
    const isDraftOrRejected = baselineVersion.status === 'DRAFT' || baselineVersion.status === 'REJECTED';
    const isPendingApproval = baselineVersion.status === 'PENDING_APPROVAL';

    // canEdit: DRAFT or REJECTED status + is maker or admin
    const canEdit = isDraftOrRejected && (isCompanyAdmin || isMaker);

    // canSubmit: DRAFT or REJECTED status + is maker or admin (requires all modules valid)
    const canSubmit = isDraftOrRejected && (isCompanyAdmin || isMaker);

    // canApprove: PENDING_APPROVAL status + is checker or admin
    const canApprove = isPendingApproval && (isCompanyAdmin || isChecker);

    // canReject: PENDING_APPROVAL status + is checker or admin
    const canReject = isPendingApproval && (isCompanyAdmin || isChecker);

    // Transform for response
    const transformedVersion = {
      id: baselineVersion.id,
      portfolioId: baselineVersion.portfolioId,
      portfolioName: baselineVersion.portfolio.name,
      versionNumber: baselineVersion.versionNumber,
      status: baselineVersion.status,
      schemaVersion: baselineVersion.schemaVersion,
      parentVersionId: baselineVersion.parentVersionId,
      parentVersion: baselineVersion.parentVersion,
      createdAt: baselineVersion.createdAt,
      createdBy: baselineVersion.createdBy,
      // Submission tracking
      submittedAt: baselineVersion.submittedAt,
      submittedBy: baselineVersion.submittedBy,
      // Approval tracking
      approvedAt: baselineVersion.approvedAt,
      approvedBy: baselineVersion.approvedBy,
      // Rejection tracking
      rejectedAt: baselineVersion.rejectedAt,
      rejectedBy: baselineVersion.rejectedBy,
      rejectionReason: baselineVersion.rejectionReason,
      // Publishing
      publishedAt: baselineVersion.publishedAt,
      publishedBy: baselineVersion.publishedBy,
      changeSummary: baselineVersion.changeSummary,
      contentHash: baselineVersion.contentHash,
      isActive: baselineVersion.id === baselineVersion.portfolio.activeBaselineVersionId,
      // Role-based permission flags
      canEdit,
      canSubmit,
      canApprove,
      canReject,
      // User's access level for UI display
      userAccessLevel,
      modules: baselineVersion.modules.map((module) => ({
        id: module.id,
        moduleType: module.moduleType,
        schemaVersion: module.schemaVersion,
        payload: module.payload,
        isComplete: module.isComplete,
        isValid: module.isValid,
        validationErrors: module.validationErrors,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      })),
    };

    return NextResponse.json({
      success: true,
      baselineVersion: transformedVersion,
    });
  } catch (error) {
    console.error('Failed to fetch baseline version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch baseline version' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id]/baseline/[versionId]
 * Updates baseline version metadata (change summary, etc.)
 * Cannot update modules through this endpoint - use module-specific endpoint
 */
export async function PUT(
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
    const body = await request.json();
    const { changeSummary } = body;

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
        { success: false, error: 'Only administrators can update baseline versions' },
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

    // Check if version is editable
    if (baselineVersion.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only DRAFT baseline versions can be edited' },
        { status: 400 }
      );
    }

    // Update the baseline version
    const updatedVersion = await prisma.portfolioBaselineVersion.update({
      where: { id: versionId },
      data: {
        changeSummary: changeSummary !== undefined ? changeSummary : undefined,
      },
      include: {
        createdBy: {
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
      baselineVersion: {
        id: updatedVersion.id,
        portfolioId: updatedVersion.portfolioId,
        versionNumber: updatedVersion.versionNumber,
        status: updatedVersion.status,
        changeSummary: updatedVersion.changeSummary,
        createdAt: updatedVersion.createdAt,
        createdBy: updatedVersion.createdBy,
      },
    });
  } catch (error) {
    console.error('Failed to update baseline version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update baseline version' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolios/[id]/baseline/[versionId]
 * Deletes a DRAFT baseline version
 * Cannot delete PUBLISHED or ARCHIVED versions
 */
export async function DELETE(
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
        { success: false, error: 'Only administrators can delete baseline versions' },
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

    // Check if version is deletable
    if (baselineVersion.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only DRAFT baseline versions can be deleted' },
        { status: 400 }
      );
    }

    // Cannot delete if it's the active version (shouldn't happen for DRAFT, but be safe)
    if (baselineVersion.id === baselineVersion.portfolio.activeBaselineVersionId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the active baseline version' },
        { status: 400 }
      );
    }

    // Delete the baseline version (modules cascade delete automatically)
    await prisma.portfolioBaselineVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Baseline version deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete baseline version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete baseline version' },
      { status: 500 }
    );
  }
}
