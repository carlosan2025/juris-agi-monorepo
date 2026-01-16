import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/invitations/[token]
 * Fetches invitation details by token (for the accept invitation page)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industryProfile: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    if (invitation.status === 'PENDING' && invitation.expiresAt < now) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { success: false, error: 'This invitation has expired. Please ask your administrator to send a new one.' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted.' },
        { status: 410 }
      );
    }

    // Check if revoked
    if (invitation.status === 'REVOKED') {
      return NextResponse.json(
        { success: false, error: 'This invitation has been revoked.' },
        { status: 410 }
      );
    }

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedById },
      select: { name: true, email: true },
    });

    // Get portfolio names for portfolio access
    const portfolioAccess = invitation.portfolioAccess as Array<{
      portfolioId: string;
      accessLevel: string;
    }>;

    let portfolioDetails: Array<{
      portfolioId: string;
      portfolioName: string;
      accessLevel: string;
    }> = [];

    if (portfolioAccess && portfolioAccess.length > 0) {
      const portfolioIds = portfolioAccess.map(p => p.portfolioId);
      const portfolios = await prisma.portfolio.findMany({
        where: { id: { in: portfolioIds } },
        select: { id: true, name: true },
      });

      portfolioDetails = portfolioAccess.map(access => {
        const portfolio = portfolios.find(p => p.id === access.portfolioId);
        return {
          portfolioId: access.portfolioId,
          portfolioName: portfolio?.name || 'Unknown Portfolio',
          accessLevel: access.accessLevel,
        };
      });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        companyId: invitation.companyId,
        companyName: invitation.company.name,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role === 'ORG_ADMIN' ? 'admin' : 'member',
        portfolioAccess: portfolioDetails,
        inviterName: inviter?.name || 'A team member',
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
    });
  } catch (error) {
    console.error('Failed to fetch invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/[token]
 * Accepts an invitation and creates the user account
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json(
        { success: false, error: 'Name and password are required' },
        { status: 400 }
      );
    }

    // Validate password requirements
    const passwordErrors: string[] = [];
    if (password.length < 8) {
      passwordErrors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('a number');
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: `Password must contain ${passwordErrors.join(', ')}` },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    // Check status
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `This invitation is ${invitation.status.toLowerCase()}` },
        { status: 410 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      // If user exists but in a different company, we can't proceed
      if (existingUser.companyId && existingUser.companyId !== invitation.companyId) {
        return NextResponse.json(
          { success: false, error: 'This email is already registered with another company' },
          { status: 400 }
        );
      }

      // If user exists in same company, just mark invitation as accepted
      if (existingUser.companyId === invitation.companyId) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'You already have an account. Please log in.',
          redirect: '/login',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and update invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: name.trim(),
          password: hashedPassword,
          companyId: invitation.companyId,
          companyRole: invitation.role,
        },
        include: {
          company: {
            select: { id: true, name: true, industryProfile: true },
          },
        },
      });

      // Update invitation
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        companyId: result.companyId,
        companyName: result.company?.name,
        companyRole: result.companyRole,
      },
      redirect: '/login',
    });
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation', details: errorMessage },
      { status: 500 }
    );
  }
}
