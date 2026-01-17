import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PortfolioAccessLevel } from '@prisma/client';

interface PortfolioPermission {
  portfolioId: string;
  accessLevel: 'MAKER' | 'CHECKER' | 'VIEWER';
}

/**
 * GET /api/users/[id]/permissions
 * Fetches a user's portfolio memberships
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

    const { id: targetUserId } = await params;

    // Get current user's company and role
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

    // Check if current user is admin
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can view user permissions' },
        { status: 403 }
      );
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, companyId: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify target user belongs to same company
    if (targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get the user's portfolio memberships
    const memberships = await prisma.portfolioMember.findMany({
      where: { userId: targetUserId },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            status: true,
            portfolioType: true,
          },
        },
      },
    });

    // Get all company portfolios for the assignment UI
    const allPortfolios = await prisma.portfolio.findMany({
      where: { companyId: currentUser.companyId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        portfolioType: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
      memberships: memberships.map((m) => ({
        portfolioId: m.portfolioId,
        portfolioName: m.portfolio.name,
        portfolioStatus: m.portfolio.status,
        portfolioType: m.portfolio.portfolioType,
        accessLevel: m.accessLevel,
        addedAt: m.addedAt,
      })),
      allPortfolios,
    });
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user permissions', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/permissions
 * Updates a user's portfolio memberships
 */
export async function PUT(
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

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { permissions } = body as { permissions: PortfolioPermission[] };

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Permissions array is required' },
        { status: 400 }
      );
    }

    // Validate access levels
    const validAccessLevels = ['MAKER', 'CHECKER', 'VIEWER'];
    for (const perm of permissions) {
      if (!perm.portfolioId || !perm.accessLevel) {
        return NextResponse.json(
          { success: false, error: 'Each permission must have portfolioId and accessLevel' },
          { status: 400 }
        );
      }
      if (!validAccessLevels.includes(perm.accessLevel)) {
        return NextResponse.json(
          { success: false, error: `Invalid access level: ${perm.accessLevel}` },
          { status: 400 }
        );
      }
    }

    // Get current user's company and role
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

    // Check if current user is admin
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can update user permissions' },
        { status: 403 }
      );
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, companyId: true, companyRole: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify target user belongs to same company
    if (targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all company portfolio IDs to validate the permissions
    const companyPortfolios = await prisma.portfolio.findMany({
      where: { companyId: currentUser.companyId },
      select: { id: true },
    });
    const validPortfolioIds = new Set(companyPortfolios.map((p) => p.id));

    // Validate all portfolio IDs belong to the company
    for (const perm of permissions) {
      if (!validPortfolioIds.has(perm.portfolioId)) {
        return NextResponse.json(
          { success: false, error: `Invalid portfolio ID: ${perm.portfolioId}` },
          { status: 400 }
        );
      }
    }

    // Update permissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all existing memberships for this user
      await tx.portfolioMember.deleteMany({
        where: { userId: targetUserId },
      });

      // Create new memberships
      if (permissions.length > 0) {
        await tx.portfolioMember.createMany({
          data: permissions.map((perm) => ({
            userId: targetUserId,
            portfolioId: perm.portfolioId,
            accessLevel: perm.accessLevel as PortfolioAccessLevel,
          })),
        });
      }
    });

    // Fetch the updated memberships to return
    const updatedMemberships = await prisma.portfolioMember.findMany({
      where: { userId: targetUserId },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            status: true,
            portfolioType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User permissions updated successfully',
      memberships: updatedMemberships.map((m) => ({
        portfolioId: m.portfolioId,
        portfolioName: m.portfolio.name,
        portfolioStatus: m.portfolio.status,
        portfolioType: m.portfolio.portfolioType,
        accessLevel: m.accessLevel,
        addedAt: m.addedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to update user permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update user permissions', details: errorMessage },
      { status: 500 }
    );
  }
}
