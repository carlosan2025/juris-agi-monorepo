import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/approvals/pending
 * Fetches all items pending approval for the current user
 *
 * Returns baselines that are PENDING_APPROVAL where user is:
 * - Company OWNER or ORG_ADMIN
 * - Portfolio CHECKER
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's company info
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

    const isCompanyAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);

    // Get portfolios where user is a CHECKER
    const checkerMemberships = await prisma.portfolioMember.findMany({
      where: {
        userId: session.user.id,
        accessLevel: 'CHECKER',
      },
      select: { portfolioId: true },
    });

    const checkerPortfolioIds = checkerMemberships.map((m) => m.portfolioId);

    // Build the query for pending baselines
    // If company admin: all pending baselines in company
    // If checker: only pending baselines in portfolios where user is checker
    const pendingBaselines = await prisma.portfolioBaselineVersion.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        portfolio: {
          companyId: currentUser.companyId,
          // If not company admin, filter to checker portfolios only
          ...(isCompanyAdmin ? {} : { id: { in: checkerPortfolioIds } }),
        },
      },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Transform for response
    const pendingApprovals = pendingBaselines.map((baseline) => ({
      id: baseline.id,
      type: 'BASELINE' as const,
      title: `Baseline v${baseline.versionNumber}`,
      description: baseline.changeSummary || 'No description provided',
      portfolioId: baseline.portfolioId,
      portfolioName: baseline.portfolio.name,
      submittedAt: baseline.submittedAt,
      submittedBy: baseline.submittedBy || baseline.createdBy,
      href: `/company/portfolios/${baseline.portfolioId}/baseline/${baseline.id}`,
    }));

    return NextResponse.json({
      success: true,
      pendingApprovals,
      count: pendingApprovals.length,
    });
  } catch (error) {
    console.error('Failed to fetch pending approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}
