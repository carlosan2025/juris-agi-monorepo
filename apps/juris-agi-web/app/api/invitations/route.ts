import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

// Initialize Resend for sending emails (if API key is configured)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * GET /api/invitations
 * Returns invitations for a company
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Verify user belongs to this company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (user?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const invitations = await prisma.invitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // Update expired invitations
    const now = new Date();
    const expiredIds = invitations
      .filter(inv => inv.status === 'PENDING' && inv.expiresAt < now)
      .map(inv => inv.id);

    if (expiredIds.length > 0) {
      await prisma.invitation.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'EXPIRED' },
      });
    }

    return NextResponse.json({
      success: true,
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        portfolioAccess: inv.portfolioAccess,
        status: expiredIds.includes(inv.id) ? 'EXPIRED' : inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations
 * Creates a new invitation and sends email
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, email, name, role, portfolioAccess } = body;

    if (!companyId || !email) {
      return NextResponse.json(
        { success: false, error: 'companyId and email are required' },
        { status: 400 }
      );
    }

    // Verify user belongs to this company and has admin rights
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (inviter?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner
    if (!['OWNER', 'ORG_ADMIN'].includes(inviter.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can invite users' },
        { status: 403 }
      );
    }

    // Check if user with this email already exists in the company
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists in your company' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'An invitation has already been sent to this email', code: 'INVITE_EXISTS' },
        { status: 400 }
      );
    }

    // Map frontend role to database role
    const dbRole = role === 'admin' ? 'ORG_ADMIN' : 'MEMBER';

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        companyId,
        email: email.toLowerCase(),
        name: name || null,
        role: dbRole,
        portfolioAccess: portfolioAccess || [],
        invitedById: session.user.id,
        expiresAt,
      },
    });

    // Generate invite URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    // Send invitation email
    let emailSent = false;
    let emailError = null;

    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Juris <noreply@juris.ai>',
          to: email,
          subject: `You're invited to join ${inviter.company?.name} on Juris`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're Invited!</h2>
              <p>Hi${name ? ` ${name}` : ''},</p>
              <p><strong>${inviter.name}</strong> has invited you to join <strong>${inviter.company?.name}</strong> on Juris.</p>
              <p>You've been assigned the role of <strong>${role === 'admin' ? 'Admin' : 'Member'}</strong>.</p>
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
      console.log('📧 Email would be sent (Resend not configured):');
      console.log(`   To: ${email}`);
      console.log(`   Subject: You're invited to join ${inviter.company?.name} on Juris`);
      console.log(`   Invite URL: ${inviteUrl}`);
      emailSent = false;
      emailError = 'Email service not configured (RESEND_API_KEY missing)';
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviteUrl, // Include for dev/testing purposes
      },
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error('Failed to create invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation', details: errorMessage },
      { status: 500 }
    );
  }
}
