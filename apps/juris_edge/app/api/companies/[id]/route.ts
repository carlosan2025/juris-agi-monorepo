import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/companies/[id]
 * Returns company details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            portfolios: true,
            mandates: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industryProfile: company.industryProfile,
        settings: company.settings,
        logoUrl: company.logoUrl,
        domain: company.domain,
        timezone: company.timezone,
        currency: company.currency,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        counts: company._count,
      },
    });
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/companies/[id]
 * Updates company details (including industry profile during setup)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, industryProfile, settings, logoUrl, domain, timezone, currency } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (industryProfile !== undefined) {
      // Validate industry profile
      const validProfiles = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'];
      if (!validProfiles.includes(industryProfile)) {
        return NextResponse.json(
          { success: false, error: 'Invalid industry profile' },
          { status: 400 }
        );
      }
      updateData.industryProfile = industryProfile;
    }

    if (settings !== undefined) {
      updateData.settings = settings;
    }

    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl;
    }

    if (domain !== undefined) {
      updateData.domain = domain;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    if (currency !== undefined) {
      updateData.currency = currency;
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industryProfile: company.industryProfile,
        settings: company.settings,
        logoUrl: company.logoUrl,
        domain: company.domain,
        timezone: company.timezone,
        currency: company.currency,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update company:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update company', details: errorMessage },
      { status: 500 }
    );
  }
}
