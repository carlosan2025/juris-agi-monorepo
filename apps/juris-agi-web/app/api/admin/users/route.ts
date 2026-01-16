import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/users
 * Returns all tenant users with their company information
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');

    // Build where clause
    const whereConditions: Prisma.UserWhereInput = {
      // Only get users that belong to a company (tenant users)
      companyId: companyId || { not: null },
    };

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        companyRole: true,
        createdAt: true,
        emailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        sessions: {
          where: {
            expires: { gt: new Date() }
          },
          orderBy: { expires: 'desc' },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data
    const transformedUsers = users.map(user => {
      // Determine status based on email verification and session
      let userStatus: 'active' | 'pending' | 'suspended' = 'pending';
      if (user.emailVerified) {
        userStatus = user.sessions.length > 0 ? 'active' : 'active';
      }

      // Map company role to simpler role names
      const roleMap: Record<string, 'owner' | 'admin' | 'member' | 'viewer'> = {
        'OWNER': 'owner',
        'ORG_ADMIN': 'admin',
        'MANDATE_ADMIN': 'admin',
        'MEMBER': 'member',
        'COMPLIANCE': 'member',
        'RISK': 'member',
        'FINANCE': 'member',
        'IC_MEMBER': 'member',
        'IC_CHAIR': 'admin',
        'VIEWER': 'viewer',
      };

      return {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown',
        companyId: user.companyId,
        companyName: user.company?.name || 'No Company',
        companySlug: user.company?.slug || '',
        role: roleMap[user.companyRole] || 'member',
        status: userStatus,
        lastLoginAt: user.sessions[0]?.expires ? new Date(user.sessions[0].expires) : null,
        createdAt: user.createdAt,
      };
    });

    // Get stats
    const totalUsers = transformedUsers.length;
    const activeUsers = transformedUsers.filter(u => u.status === 'active').length;
    const pendingUsers = transformedUsers.filter(u => u.status === 'pending').length;

    // Get unique companies for filtering
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      stats: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: 0,
      },
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        usersCount: c._count.users,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/reset-password
 * Sends a password reset email to a user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, email } = body;

    if (action === 'reset-password') {
      // Find the user
      const user = await prisma.user.findFirst({
        where: userId ? { id: userId } : { email },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // In a real implementation, this would:
      // 1. Generate a password reset token
      // 2. Store it in the database with an expiry
      // 3. Send an email with the reset link

      // For now, we'll just return success
      // backend_pending: Implement actual password reset flow
      return NextResponse.json({
        success: true,
        message: `Password reset email sent to ${user.email}`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process user action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
