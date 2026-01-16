import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/companies
 * Returns all companies (tenants) with their statistics
 */
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        industryProfile: true,
        domain: true,
        timezone: true,
        currency: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            portfolios: true,
            mandates: true,
            documents: true,
          }
        },
        users: {
          select: {
            id: true,
            sessions: {
              where: {
                expires: { gt: new Date() }
              },
              take: 1,
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data
    const transformedCompanies = companies.map(company => {
      // Count active users (those with active sessions)
      const activeUsersCount = company.users.filter(u => u.sessions.length > 0).length;

      // Determine company status based on activity
      let status: 'active' | 'inactive' | 'pending' = 'inactive';
      if (activeUsersCount > 0) {
        status = 'active';
      } else if (company.users.length === 0) {
        status = 'pending';
      }

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industryProfile: company.industryProfile,
        domain: company.domain,
        timezone: company.timezone,
        currency: company.currency,
        logoUrl: company.logoUrl,
        status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        stats: {
          users: company._count.users,
          activeUsers: activeUsersCount,
          portfolios: company._count.portfolios,
          mandates: company._count.mandates,
          documents: company._count.documents,
        },
      };
    });

    // Get summary stats
    const totalCompanies = transformedCompanies.length;
    const activeCompanies = transformedCompanies.filter(c => c.status === 'active').length;
    const pendingCompanies = transformedCompanies.filter(c => c.status === 'pending').length;

    return NextResponse.json({
      success: true,
      companies: transformedCompanies,
      stats: {
        total: totalCompanies,
        active: activeCompanies,
        inactive: totalCompanies - activeCompanies - pendingCompanies,
        pending: pendingCompanies,
      },
    });
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
