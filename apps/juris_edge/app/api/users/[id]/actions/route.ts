import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/users/[id]/actions
 * Performs actions on a user (suspend, reactivate, delete)
 * Only accessible by OWNER or ORG_ADMIN of the same company
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

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['suspend', 'reactivate', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "suspend", "reactivate", or "delete"' },
        { status: 400 }
      );
    }

    // Fetch the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        companyRole: true,
        status: true,
        isPlatformAdmin: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Cannot modify platform admins via this endpoint
    if (targetUser.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify platform administrators' },
        { status: 403 }
      );
    }

    // Fetch the current user (admin performing the action)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true, id: true },
    });

    // Verify both users are in the same company
    if (currentUser?.companyId !== targetUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied - user is not in your company' },
        { status: 403 }
      );
    }

    // Only OWNER or ORG_ADMIN can perform user management actions
    if (!['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can manage users' },
        { status: 403 }
      );
    }

    // Cannot perform actions on yourself
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'You cannot perform this action on yourself' },
        { status: 400 }
      );
    }

    // ORG_ADMIN cannot modify OWNER
    if (currentUser.companyRole === 'ORG_ADMIN' && targetUser.companyRole === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Organization admins cannot modify company owners' },
        { status: 403 }
      );
    }

    // ORG_ADMIN cannot modify other ORG_ADMINs
    if (currentUser.companyRole === 'ORG_ADMIN' && targetUser.companyRole === 'ORG_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Organization admins cannot modify other organization admins' },
        { status: 403 }
      );
    }

    // Handle actions
    if (action === 'suspend') {
      if (targetUser.status === 'SUSPENDED') {
        return NextResponse.json(
          { success: false, error: 'User is already suspended' },
          { status: 400 }
        );
      }

      if (targetUser.status === 'DELETED') {
        return NextResponse.json(
          { success: false, error: 'Cannot suspend a deleted user' },
          { status: 400 }
        );
      }

      // Suspend the user
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'SUSPENDED' },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      // Optionally: Invalidate user sessions
      await prisma.session.deleteMany({
        where: { userId: targetUserId },
      });

      return NextResponse.json({
        success: true,
        message: 'User suspended successfully',
        user: updatedUser,
        reason: reason || null,
      });
    }

    if (action === 'reactivate') {
      if (targetUser.status === 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'User is already active' },
          { status: 400 }
        );
      }

      if (targetUser.status === 'DELETED') {
        return NextResponse.json(
          { success: false, error: 'Cannot reactivate a deleted user. Contact support.' },
          { status: 400 }
        );
      }

      // Reactivate the user
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'ACTIVE' },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User reactivated successfully',
        user: updatedUser,
      });
    }

    if (action === 'delete') {
      if (targetUser.status === 'DELETED') {
        return NextResponse.json(
          { success: false, error: 'User is already deleted' },
          { status: 400 }
        );
      }

      // Soft delete the user (change status to DELETED)
      // We don't actually delete the user record to preserve audit trail
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'DELETED' },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      // Invalidate all user sessions
      await prisma.session.deleteMany({
        where: { userId: targetUserId },
      });

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
        user: updatedUser,
        reason: reason || null,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to perform user action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to perform action', details: errorMessage },
      { status: 500 }
    );
  }
}
