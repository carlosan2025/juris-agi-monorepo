import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * Returns platform-wide statistics for the administration dashboard
 */
export async function GET() {
  try {
    // Fetch all stats in parallel for performance
    const [
      totalCompanies,
      totalUsers,
      activeUsers,
      totalPortfolios,
      totalCases,
      totalMandates,
      totalDocuments,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.user.count({
        where: {
          sessions: {
            some: {
              expires: { gt: new Date() }
            }
          }
        }
      }),
      prisma.portfolio.count(),
      prisma.case.count(),
      prisma.mandate.count(),
      prisma.document.count(),
    ]);

    // Get companies with user counts
    const companiesWithUsers = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            portfolios: true,
            mandates: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate active companies (companies with at least one user who has an active session)
    const activeCompanies = await prisma.company.count({
      where: {
        users: {
          some: {
            sessions: {
              some: {
                expires: { gt: new Date() }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
        totalPortfolios,
        totalCases,
        totalMandates,
        totalDocuments,
        // For email stats, we'd need to track this separately
        emailsSent: 0,
        // Storage would come from actual storage metrics
        storageUsedGB: 0,
      },
      recentCompanies: companiesWithUsers.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        createdAt: c.createdAt,
        usersCount: c._count.users,
        portfoliosCount: c._count.portfolios,
        mandatesCount: c._count.mandates,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
