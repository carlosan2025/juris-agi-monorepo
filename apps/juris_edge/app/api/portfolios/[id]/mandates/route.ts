import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/portfolios/[id]/mandates
 * Fetches mandates for a specific portfolio
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

    // Get current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user's company
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { id: true, companyId: true },
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

    // Fetch mandates for this portfolio
    const mandates = await prisma.mandate.findMany({
      where: {
        portfolios: {
          some: { id: portfolioId },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      mandates,
    });
  } catch (error) {
    console.error('Failed to fetch portfolio mandates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mandates' },
      { status: 500 }
    );
  }
}
