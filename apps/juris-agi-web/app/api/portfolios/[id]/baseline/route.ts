import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ALL_MODULE_TYPES, getDefaultPayload } from '@/lib/baseline/types';
import crypto from 'crypto';

/**
 * GET /api/portfolios/[id]/baseline
 * Fetches all baseline versions for a portfolio, including status and summary
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId } = await params;

    // Verify user has access to this portfolio
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

    // Fetch portfolio to verify access
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        companyId: true,
        activeBaselineVersionId: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);

    // Fetch all baseline versions for this portfolio
    const baselineVersions = await prisma.portfolioBaselineVersion.findMany({
      where: { portfolioId },
      include: {
        modules: {
          select: {
            moduleType: true,
            isComplete: true,
            isValid: true,
          },
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
      },
      orderBy: { versionNumber: 'desc' },
    });

    // Transform for response with approval workflow fields
    const transformedVersions = baselineVersions.map((version) => {
      const isActive = version.id === portfolio.activeBaselineVersionId;
      const canEdit = version.status === 'DRAFT' || version.status === 'REJECTED';
      const canSubmit = (version.status === 'DRAFT' || version.status === 'REJECTED') &&
        version.modules.every((m) => m.isValid);
      const canApprove = version.status === 'PENDING_APPROVAL' && isAdmin;
      const canReject = version.status === 'PENDING_APPROVAL' && isAdmin;

      return {
        id: version.id,
        portfolioId: version.portfolioId,
        versionNumber: version.versionNumber,
        status: version.status,
        schemaVersion: version.schemaVersion,
        parentVersionId: version.parentVersionId,
        createdAt: version.createdAt,
        createdBy: version.createdBy,
        // Submission
        submittedAt: version.submittedAt,
        submittedBy: version.submittedBy,
        // Approval
        approvedAt: version.approvedAt,
        approvedBy: version.approvedBy,
        // Rejection
        rejectedAt: version.rejectedAt,
        rejectedBy: version.rejectedBy,
        rejectionReason: version.rejectionReason,
        // Publishing
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
        changeSummary: version.changeSummary,
        // State flags
        isActive,
        canEdit,
        canSubmit,
        canApprove,
        canReject,
        modulesSummary: {
          total: version.modules.length,
          complete: version.modules.filter((m) => m.isComplete).length,
          valid: version.modules.filter((m) => m.isValid).length,
          modules: version.modules.map((m) => ({
            type: m.moduleType,
            isComplete: m.isComplete,
            isValid: m.isValid,
          })),
        },
      };
    });

    return NextResponse.json({
      success: true,
      portfolioId,
      activeBaselineVersionId: portfolio.activeBaselineVersionId,
      versions: transformedVersions,
    });
  } catch (error) {
    console.error('Failed to fetch baseline versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch baseline versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios/[id]/baseline
 * Creates a new baseline version (always starts as DRAFT)
 * Optionally copies from an existing version
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId } = await params;
    const body = await request.json();
    const { copyFromVersionId, changeSummary } = body;

    // Verify user has access and is admin
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
        { success: false, error: 'Only administrators can create baseline versions' },
        { status: 403 }
      );
    }

    // Fetch portfolio to verify access
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        companyId: true,
        activeBaselineVersionId: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if there's already a DRAFT version
    const existingDraft = await prisma.portfolioBaselineVersion.findFirst({
      where: {
        portfolioId,
        status: 'DRAFT',
      },
    });

    if (existingDraft) {
      return NextResponse.json(
        {
          success: false,
          error: 'A draft baseline version already exists. Please edit the existing draft or publish/discard it first.',
          existingDraftId: existingDraft.id,
        },
        { status: 409 }
      );
    }

    // Get the next version number
    const latestVersion = await prisma.portfolioBaselineVersion.findFirst({
      where: { portfolioId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // If copying from an existing version, fetch its modules
    let modulePayloads: Record<string, unknown> = {};
    if (copyFromVersionId) {
      const sourceVersion = await prisma.portfolioBaselineVersion.findUnique({
        where: { id: copyFromVersionId },
        include: { modules: true },
      });

      if (!sourceVersion || sourceVersion.portfolioId !== portfolioId) {
        return NextResponse.json(
          { success: false, error: 'Source version not found or does not belong to this portfolio' },
          { status: 400 }
        );
      }

      // Copy module payloads
      for (const module of sourceVersion.modules) {
        modulePayloads[module.moduleType] = module.payload;
      }
    }

    // Create the new baseline version with all modules
    const newVersion = await prisma.portfolioBaselineVersion.create({
      data: {
        portfolioId,
        versionNumber: nextVersionNumber,
        status: 'DRAFT',
        schemaVersion: 1,
        parentVersionId: copyFromVersionId || null,
        createdById: session.user.id,
        changeSummary: changeSummary || null,
        modules: {
          create: ALL_MODULE_TYPES.map((moduleType) => ({
            moduleType,
            schemaVersion: 1,
            payload: modulePayloads[moduleType] || getDefaultPayload(moduleType),
            isComplete: false,
            isValid: true,
            updatedById: session.user.id,
          })),
        },
      },
      include: {
        modules: {
          select: {
            id: true,
            moduleType: true,
            isComplete: true,
            isValid: true,
          },
        },
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
        id: newVersion.id,
        portfolioId: newVersion.portfolioId,
        versionNumber: newVersion.versionNumber,
        status: newVersion.status,
        schemaVersion: newVersion.schemaVersion,
        parentVersionId: newVersion.parentVersionId,
        createdAt: newVersion.createdAt,
        createdBy: newVersion.createdBy,
        changeSummary: newVersion.changeSummary,
        modules: newVersion.modules,
      },
    });
  } catch (error) {
    console.error('Failed to create baseline version:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create baseline version', details: errorMessage },
      { status: 500 }
    );
  }
}
