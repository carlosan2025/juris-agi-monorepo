import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/portfolios/[id]
 * Fetches a single portfolio by ID with all details
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
      select: { companyId: true, companyRole: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Fetch the portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            industryProfile: true,
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Verify user has access (same company)
    if (portfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Extract all stored data
    const composition = (portfolio.composition as Record<string, unknown>) || {};
    const metrics = (portfolio.metrics as Record<string, unknown>) || {};
    const constraints = (portfolio.constraints as Record<string, unknown>) || {};

    // Transform the data to include all fields
    const transformedPortfolio = {
      id: portfolio.id,
      companyId: portfolio.companyId,
      mandateId: portfolio.mandateId,
      name: portfolio.name,
      description: portfolio.description || '',
      portfolioType: portfolio.portfolioType,
      status: portfolio.status,

      // Configuration fields from constraints
      code: constraints.code || '',
      baseCurrency: (composition.baseCurrency as string) || 'USD',
      timezone: constraints.timezone || 'UTC',
      jurisdiction: constraints.jurisdiction || '',
      startDate: constraints.startDate || null,
      endDate: constraints.endDate || null,
      tags: (constraints.tags as string[]) || [],

      // AUM fields from composition
      aumCurrent: composition.totalValue || 0,
      aumTarget: composition.totalCommitted || 0,

      // Industry-specific profile
      industryProfile: constraints.industryProfile || {},

      // User assignments
      userAssignments: constraints.userAssignments || [],

      // Related entities
      mandate: portfolio.mandate,
      company: portfolio.company,

      // Metrics
      metrics: {
        utilization: metrics.utilization || 0,
        diversificationScore: metrics.diversificationScore || 0,
        riskScore: metrics.riskScore || 0.3,
        performanceIndex: metrics.performanceIndex || 1,
      },

      // Timestamps
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };

    return NextResponse.json({
      success: true,
      portfolio: transformedPortfolio,
    });
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id]
 * Updates a portfolio with all its fields
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

    const { id: portfolioId } = await params;
    const body = await request.json();

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

    // Check if user is admin
    const isAdmin = ['OWNER', 'ORG_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can update portfolios' },
        { status: 403 }
      );
    }

    // Fetch existing portfolio
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Verify same company
    if (existingPortfolio.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Extract update fields from body
    const {
      name,
      description,
      code,
      baseCurrency,
      timezone,
      jurisdiction,
      startDate,
      endDate,
      tags,
      aumCurrent,
      aumTarget,
      userAssignments,
      industryProfile,
      status,
    } = body;

    // Get existing constraints and composition
    const existingConstraints = (existingPortfolio.constraints as Record<string, unknown>) || {};
    const existingComposition = (existingPortfolio.composition as Record<string, unknown>) || {};
    const existingMetrics = (existingPortfolio.metrics as Record<string, unknown>) || {};

    // Build updated composition
    const updatedComposition = {
      ...existingComposition,
      totalValue: aumCurrent !== undefined ? aumCurrent : existingComposition.totalValue,
      totalCommitted: aumTarget !== undefined ? aumTarget : existingComposition.totalCommitted,
      baseCurrency: baseCurrency !== undefined ? baseCurrency : existingComposition.baseCurrency,
    };

    // Build updated constraints
    const updatedConstraints = {
      ...existingConstraints,
      code: code !== undefined ? code : existingConstraints.code,
      timezone: timezone !== undefined ? timezone : existingConstraints.timezone,
      jurisdiction: jurisdiction !== undefined ? jurisdiction : existingConstraints.jurisdiction,
      startDate: startDate !== undefined ? startDate : existingConstraints.startDate,
      endDate: endDate !== undefined ? endDate : existingConstraints.endDate,
      tags: tags !== undefined ? tags : existingConstraints.tags,
      userAssignments: userAssignments !== undefined ? userAssignments : existingConstraints.userAssignments,
      industryProfile: industryProfile !== undefined ? industryProfile : existingConstraints.industryProfile,
    };

    // Calculate updated metrics
    const aumCurrentValue = updatedComposition.totalValue || 0;
    const aumTargetValue = updatedComposition.totalCommitted || aumCurrentValue;
    const updatedMetrics = {
      ...existingMetrics,
      utilization: aumTargetValue > 0 ? (aumCurrentValue as number) / (aumTargetValue as number) : 0,
    };

    // Update the portfolio
    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        status: status !== undefined ? status : undefined,
        constraints: updatedConstraints,
        composition: updatedComposition,
        metrics: updatedMetrics,
      },
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            industryProfile: true,
          },
        },
      },
    });

    // Transform for response
    const transformedPortfolio = {
      id: updatedPortfolio.id,
      companyId: updatedPortfolio.companyId,
      mandateId: updatedPortfolio.mandateId,
      name: updatedPortfolio.name,
      description: updatedPortfolio.description || '',
      portfolioType: updatedPortfolio.portfolioType,
      status: updatedPortfolio.status,

      // Configuration fields
      code: updatedConstraints.code || '',
      baseCurrency: updatedComposition.baseCurrency || 'USD',
      timezone: updatedConstraints.timezone || 'UTC',
      jurisdiction: updatedConstraints.jurisdiction || '',
      startDate: updatedConstraints.startDate || null,
      endDate: updatedConstraints.endDate || null,
      tags: (updatedConstraints.tags as string[]) || [],

      // AUM fields
      aumCurrent: updatedComposition.totalValue || 0,
      aumTarget: updatedComposition.totalCommitted || 0,

      // Industry-specific profile
      industryProfile: updatedConstraints.industryProfile || {},

      // User assignments
      userAssignments: updatedConstraints.userAssignments || [],

      // Related entities
      mandate: updatedPortfolio.mandate,
      company: updatedPortfolio.company,

      // Metrics
      metrics: {
        utilization: updatedMetrics.utilization || 0,
        diversificationScore: existingMetrics.diversificationScore || 0,
        riskScore: existingMetrics.riskScore || 0.3,
        performanceIndex: existingMetrics.performanceIndex || 1,
      },

      // Timestamps
      createdAt: updatedPortfolio.createdAt,
      updatedAt: updatedPortfolio.updatedAt,
    };

    return NextResponse.json({
      success: true,
      portfolio: transformedPortfolio,
    });
  } catch (error) {
    console.error('Failed to update portfolio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update portfolio', details: errorMessage },
      { status: 500 }
    );
  }
}
