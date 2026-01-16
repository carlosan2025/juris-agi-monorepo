import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';

/**
 * GET /api/portfolios
 * Returns portfolios for a company, filtered by user permissions
 * - Admins (OWNER, ORG_ADMIN) see all portfolios
 * - Regular users see only portfolios they have been granted access to
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
    const mandateId = searchParams.get('mandateId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get current user's role in the company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    // Verify user belongs to this company
    if (currentUser?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);

    const whereConditions: Prisma.PortfolioWhereInput = {
      companyId,
    };

    if (mandateId) {
      whereConditions.mandateId = mandateId;
    }

    // If not an admin, filter to only portfolios the user has access to
    if (!isAdmin) {
      whereConditions.members = {
        some: {
          userId: session.user.id,
        },
      };
    }

    const portfolios = await prisma.portfolio.findMany({
      where: whereConditions,
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        // Include membership info to show user's access level
        members: isAdmin ? false : {
          where: { userId: session.user.id },
          select: { accessLevel: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data to match frontend expectations
    const transformedPortfolios = portfolios.map((portfolio) => {
      const composition = portfolio.composition as {
        totalValue?: number;
        totalCommitted?: number;
        positions?: Array<Record<string, unknown>>;
      } || {};
      const metrics = portfolio.metrics as {
        utilization?: number;
        diversificationScore?: number;
        riskScore?: number;
        performanceIndex?: number;
      } || {};
      const constraints = portfolio.constraints as Record<string, unknown> || {};

      // Get user's access level for this portfolio (for non-admins)
      const portfolioWithMembers = portfolio as typeof portfolio & {
        members?: Array<{ accessLevel: string }>;
      };
      const userAccessLevel = isAdmin
        ? 'ADMIN'
        : portfolioWithMembers.members?.[0]?.accessLevel || null;

      return {
        id: portfolio.id,
        organizationId: portfolio.companyId,
        workspaceId: 'workspace-1',
        name: portfolio.name,
        description: portfolio.description || '',
        type: portfolio.portfolioType.toLowerCase(),
        status: portfolio.status.toLowerCase(),
        industryLabel: portfolio.name,
        userAccessLevel, // Include user's access level in response
        constraints: {
          maxPositions: constraints.maxPositions || 50,
          maxSinglePositionPct: constraints.maxSinglePositionPct || 20,
          maxSectorConcentrationPct: constraints.maxSectorConcentrationPct || 40,
          minDiversification: constraints.minDiversification || 5,
          customConstraints: constraints.customConstraints || [],
        },
        composition: {
          totalValue: composition.totalValue || 0,
          totalCommitted: composition.totalCommitted || 0,
          positions: composition.positions || [],
        },
        metrics: {
          utilization: metrics.utilization || 0,
          diversificationScore: metrics.diversificationScore || 0,
          riskScore: metrics.riskScore || 0.3,
          performanceIndex: metrics.performanceIndex || 1,
          lastCalculatedAt: new Date(),
        },
        industryProfile: constraints.industryProfile || {},
        mandate: portfolio.mandate,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      portfolios: transformedPortfolios,
    });
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios
 * Creates a new portfolio
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyId,
      mandateId,
      name,
      code,
      description,
      baseCurrency,
      timezone,
      jurisdiction,
      startDate,
      endDate,
      tags,
      aumCurrent,
      aumTarget,
      portfolioType,
      userAssignments,
      industryProfile,
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    // Determine portfolio type based on company industry or explicit type
    let type: 'FUND' | 'BOOK' | 'PIPELINE' = 'FUND';
    if (portfolioType) {
      type = portfolioType.toUpperCase() as 'FUND' | 'BOOK' | 'PIPELINE';
    } else {
      // Get company to determine default type
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { industryProfile: true },
      });

      if (company) {
        switch (company.industryProfile) {
          case 'VENTURE_CAPITAL':
            type = 'FUND';
            break;
          case 'INSURANCE':
            type = 'BOOK';
            break;
          case 'PHARMA':
            type = 'PIPELINE';
            break;
          default:
            type = 'FUND';
        }
      }
    }

    // Build composition JSON
    const composition = {
      totalValue: aumCurrent || 0,
      totalCommitted: aumTarget || aumCurrent || 0,
      positions: [],
      baseCurrency: baseCurrency || 'USD',
    };

    // Build constraints JSON
    const constraints = {
      maxPositions: 50,
      maxSinglePositionPct: 20,
      maxSectorConcentrationPct: 40,
      minDiversification: 5,
      customConstraints: [],
      code: code || null,
      jurisdiction: jurisdiction || null,
      timezone: timezone || 'UTC',
      startDate: startDate || null,
      endDate: endDate || null,
      tags: tags || [],
      userAssignments: userAssignments || [],
      // Industry-specific profile data
      industryProfile: industryProfile || {},
    };

    // Build metrics JSON
    const aumCurrentValue = aumCurrent || 0;
    const aumTargetValue = aumTarget || aumCurrentValue;
    const metrics = {
      utilization: aumTargetValue > 0 ? aumCurrentValue / aumTargetValue : 0,
      diversificationScore: 0,
      riskScore: 0.3,
      performanceIndex: 1,
    };

    // Create the portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        companyId,
        mandateId: mandateId || null,
        name: name.trim(),
        description: description?.trim() || null,
        portfolioType: type,
        status: 'ACTIVE',
        constraints,
        composition,
        metrics,
      },
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Transform for frontend
    const transformedPortfolio = {
      id: portfolio.id,
      organizationId: portfolio.companyId,
      workspaceId: 'workspace-1',
      name: portfolio.name,
      description: portfolio.description || '',
      type: portfolio.portfolioType.toLowerCase(),
      status: portfolio.status.toLowerCase(),
      industryLabel: portfolio.name,
      constraints: {
        maxPositions: constraints.maxPositions,
        maxSinglePositionPct: constraints.maxSinglePositionPct,
        maxSectorConcentrationPct: constraints.maxSectorConcentrationPct,
        minDiversification: constraints.minDiversification,
        customConstraints: constraints.customConstraints,
      },
      composition: {
        totalValue: composition.totalValue,
        totalCommitted: composition.totalCommitted,
        positions: composition.positions,
      },
      metrics: {
        utilization: metrics.utilization,
        diversificationScore: metrics.diversificationScore,
        riskScore: metrics.riskScore,
        performanceIndex: metrics.performanceIndex,
        lastCalculatedAt: new Date(),
      },
      industryProfile: constraints.industryProfile,
      mandate: portfolio.mandate,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };

    return NextResponse.json({
      success: true,
      portfolio: transformedPortfolio,
    });
  } catch (error) {
    console.error('Failed to create portfolio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio', details: errorMessage },
      { status: 500 }
    );
  }
}
