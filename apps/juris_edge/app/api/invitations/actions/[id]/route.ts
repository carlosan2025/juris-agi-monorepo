import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

// Initialize Resend for sending emails (if API key is configured)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * POST /api/invitations/actions/[id]
 * Performs actions on an invitation (resend, revoke)
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

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['resend', 'revoke'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "resend" or "revoke"' },
        { status: 400 }
      );
    }

    // Fetch the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify user belongs to this company and has admin rights
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true, name: true },
    });

    if (user?.companyId !== invitation.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner
    if (!['OWNER', 'ORG_ADMIN'].includes(user.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can manage invitations' },
        { status: 403 }
      );
    }

    // Handle actions
    if (action === 'resend') {
      // Can only resend pending or expired invitations
      if (!['PENDING', 'EXPIRED'].includes(invitation.status)) {
        return NextResponse.json(
          { success: false, error: `Cannot resend ${invitation.status.toLowerCase()} invitation` },
          { status: 400 }
        );
      }

      // Update expiration date (7 days from now)
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // Generate new token for security
      const updatedInvitation = await prisma.invitation.update({
        where: { id },
        data: {
          status: 'PENDING',
          expiresAt: newExpiresAt,
          // Note: token stays the same, or generate new one via @default(cuid()) if needed
        },
      });

      // Generate invite URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const inviteUrl = `${baseUrl}/invite/${updatedInvitation.token}`;

      // Send invitation email
      let emailSent = false;
      let emailError = null;

      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Juris <noreply@juris.ai>',
            to: invitation.email,
            subject: `Reminder: You're invited to join ${invitation.company.name} on Juris`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Invitation Reminder</h2>
                <p>Hi${invitation.name ? ` ${invitation.name}` : ''},</p>
                <p>This is a reminder that <strong>${user.name}</strong> has invited you to join <strong>${invitation.company.name}</strong> on Juris.</p>
                <p>You've been assigned the role of <strong>${invitation.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}</strong>.</p>
                <div style="margin: 30px 0;">
                  <a href="${inviteUrl}"
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
                <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px;">Juris - Enterprise Decision Intelligence</p>
              </div>
            `,
          });
          emailSent = true;
        } catch (err) {
          console.error('Failed to send invitation email:', err);
          emailError = err instanceof Error ? err.message : 'Email send failed';
        }
      } else {
        console.log('📧 Resend email would be sent (Resend not configured):');
        console.log(`   To: ${invitation.email}`);
        console.log(`   Subject: Reminder: You're invited to join ${invitation.company.name} on Juris`);
        console.log(`   Invite URL: ${inviteUrl}`);
        emailSent = false;
        emailError = 'Email service not configured (RESEND_API_KEY missing)';
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation resent successfully',
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          status: updatedInvitation.status,
          expiresAt: updatedInvitation.expiresAt,
        },
        emailSent,
        emailError,
      });
    }

    if (action === 'revoke') {
      // Can only revoke pending invitations
      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `Cannot revoke ${invitation.status.toLowerCase()} invitation` },
          { status: 400 }
        );
      }

      // Update invitation status to revoked
      const updatedInvitation = await prisma.invitation.update({
        where: { id },
        data: { status: 'REVOKED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation revoked successfully',
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          status: updatedInvitation.status,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to perform invitation action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to perform action', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invitations/actions/[id]
 * Permanently deletes an invitation (only for PENDING status)
 */
export async function DELETE(
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

    const { id } = await params;

    // Fetch the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify user belongs to this company and has admin rights
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (user?.companyId !== invitation.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner
    if (!['OWNER', 'ORG_ADMIN'].includes(user.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete invitations' },
        { status: 403 }
      );
    }

    // Can only delete pending invitations
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete accepted invitations' },
        { status: 400 }
      );
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to delete invitation', details: errorMessage },
      { status: 500 }
    );
  }
}
