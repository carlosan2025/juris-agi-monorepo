import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PortfolioBaselineModuleType, ALL_MODULE_TYPES } from '@/lib/baseline/types';
import { validateModule } from '@/lib/baseline/validation';

/**
 * GET /api/portfolios/[id]/baseline/[versionId]/modules/[moduleType]
 * Fetches a single module from a baseline version
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string; moduleType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId, versionId, moduleType } = await params;

    // Validate module type
    if (!ALL_MODULE_TYPES.includes(moduleType as PortfolioBaselineModuleType)) {
      return NextResponse.json(
        { success: false, error: `Invalid module type: ${moduleType}` },
        { status: 400 }
      );
    }

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

    // Fetch the module with baseline and portfolio info
    const module = await prisma.portfolioBaselineModule.findFirst({
      where: {
        baselineVersionId: versionId,
        moduleType: moduleType as PortfolioBaselineModuleType,
      },
      include: {
        baselineVersion: {
          select: {
            id: true,
            portfolioId: true,
            versionNumber: true,
            status: true,
            portfolio: {
              select: {
                id: true,
                companyId: true,
                name: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Verify portfolio ID matches
    if (module.baselineVersion.portfolioId !== portfolioId) {
      return NextResponse.json(
        { success: false, error: 'Module does not belong to this portfolio' },
        { status: 400 }
      );
    }

    // Verify user has access (same company)
    if (module.baselineVersion.portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        moduleType: module.moduleType,
        schemaVersion: module.schemaVersion,
        payload: module.payload,
        isComplete: module.isComplete,
        isValid: module.isValid,
        validationErrors: module.validationErrors,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        updatedBy: module.updatedBy,
        baselineVersion: {
          id: module.baselineVersion.id,
          versionNumber: module.baselineVersion.versionNumber,
          status: module.baselineVersion.status,
        },
        canEdit: module.baselineVersion.status === 'DRAFT',
      },
    });
  } catch (error) {
    console.error('Failed to fetch module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id]/baseline/[versionId]/modules/[moduleType]
 * Updates a module's payload
 * Automatically validates and updates isValid/isComplete flags
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string; moduleType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: portfolioId, versionId, moduleType } = await params;
    const body = await request.json();
    const { payload } = body;

    // Validate module type
    if (!ALL_MODULE_TYPES.includes(moduleType as PortfolioBaselineModuleType)) {
      return NextResponse.json(
        { success: false, error: `Invalid module type: ${moduleType}` },
        { status: 400 }
      );
    }

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
        { success: false, error: 'Only administrators can update modules' },
        { status: 403 }
      );
    }

    // Fetch the module with baseline info
    const existingModule = await prisma.portfolioBaselineModule.findFirst({
      where: {
        baselineVersionId: versionId,
        moduleType: moduleType as PortfolioBaselineModuleType,
      },
      include: {
        baselineVersion: {
          select: {
            id: true,
            portfolioId: true,
            status: true,
            portfolio: {
              select: {
                id: true,
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!existingModule) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Verify portfolio ID matches
    if (existingModule.baselineVersion.portfolioId !== portfolioId) {
      return NextResponse.json(
        { success: false, error: 'Module does not belong to this portfolio' },
        { status: 400 }
      );
    }

    // Verify user has access (same company)
    if (existingModule.baselineVersion.portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if baseline is editable
    if (existingModule.baselineVersion.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only DRAFT baseline versions can be edited' },
        { status: 400 }
      );
    }

    // Validate the payload
    const validationResult = validateModule(
      moduleType as PortfolioBaselineModuleType,
      payload
    );

    // Update the module
    const updatedModule = await prisma.portfolioBaselineModule.update({
      where: { id: existingModule.id },
      data: {
        payload,
        isValid: validationResult.isValid,
        isComplete: validationResult.isComplete,
        validationErrors: validationResult.errors.length > 0 ? validationResult.errors : null,
        updatedById: session.user.id,
      },
      include: {
        updatedBy: {
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
      module: {
        id: updatedModule.id,
        moduleType: updatedModule.moduleType,
        schemaVersion: updatedModule.schemaVersion,
        payload: updatedModule.payload,
        isComplete: updatedModule.isComplete,
        isValid: updatedModule.isValid,
        validationErrors: updatedModule.validationErrors,
        updatedAt: updatedModule.updatedAt,
        updatedBy: updatedModule.updatedBy,
      },
      validation: {
        isValid: validationResult.isValid,
        isComplete: validationResult.isComplete,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
    });
  } catch (error) {
    console.error('Failed to update module:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update module', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios/[id]/baseline/[versionId]/modules/[moduleType]/validate
 * Validates a module payload without saving
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string; moduleType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { moduleType } = await params;
    const body = await request.json();
    const { payload } = body;

    // Validate module type
    if (!ALL_MODULE_TYPES.includes(moduleType as PortfolioBaselineModuleType)) {
      return NextResponse.json(
        { success: false, error: `Invalid module type: ${moduleType}` },
        { status: 400 }
      );
    }

    // Validate the payload
    const validationResult = validateModule(
      moduleType as PortfolioBaselineModuleType,
      payload
    );

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        isComplete: validationResult.isComplete,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
    });
  } catch (error) {
    console.error('Failed to validate module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate module' },
      { status: 500 }
    );
  }
}
