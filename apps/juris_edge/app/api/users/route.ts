import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/users
 * Returns users for a company (for admins to manage)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Verify user belongs to this company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (currentUser?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner to see all users including suspended
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);

    // Fetch all users for the company with their portfolio membership count
    // Note: Status filtering will be applied after migration adds the status column
    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        companyRole: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        _count: {
          select: {
            portfolioMemberships: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by status in JS if status field exists (after migration)
    // For now, treat all users as ACTIVE
    const filteredUsers = users.map(user => {
      // Try to get status, default to ACTIVE if column doesn't exist yet
      const userWithStatus = user as typeof user & { status?: string };
      const status = userWithStatus.status || 'ACTIVE';

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.companyRole,
        status: status as 'ACTIVE' | 'SUSPENDED' | 'DELETED',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        emailVerified: user.emailVerified,
        portfolioCount: user._count.portfolioMemberships,
      };
    });

    // Apply status filter
    const statusFilteredUsers = includeDeleted
      ? filteredUsers
      : filteredUsers.filter(u => {
          if (u.status === 'DELETED') return false;
          if (u.status === 'SUSPENDED' && !isAdmin) return false;
          return true;
        });

    return NextResponse.json({
      success: true,
      users: statusFilteredUsers,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
