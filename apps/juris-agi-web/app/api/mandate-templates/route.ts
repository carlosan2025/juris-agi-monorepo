import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { IndustryProfile, MandateTemplateType, Prisma } from '@prisma/client';

/**
 * Map short industry names to full enum values
 * Handles both short names (VC, INSURANCE, PHARMA) and full names (VENTURE_CAPITAL, etc.)
 */
function mapIndustryToEnum(industry: string): IndustryProfile | null {
  const industryMap: Record<string, IndustryProfile> = {
    // Short names
    'VC': IndustryProfile.VENTURE_CAPITAL,
    'INSURANCE': IndustryProfile.INSURANCE,
    'PHARMA': IndustryProfile.PHARMA,
    'GENERIC': IndustryProfile.GENERIC,
    // Full names (already valid)
    'VENTURE_CAPITAL': IndustryProfile.VENTURE_CAPITAL,
  };

  return industryMap[industry.toUpperCase()] || null;
}

/**
 * GET /api/mandate-templates
 * Returns mandate templates filtered by industry and/or company.
 * - System templates (isSystem=true) are available to all authenticated users
 * - Company templates are only visible to users of that company
 *
 * Query params:
 * - industry: Filter by industry profile (VC, VENTURE_CAPITAL, INSURANCE, PHARMA, GENERIC)
 * - type: Filter by mandate type (PRIMARY, THEMATIC, CARVEOUT)
 * - includeCompany: If true, include company-specific templates (default: true)
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
    const industryParam = searchParams.get('industry');
    const type = searchParams.get('type') as MandateTemplateType | null;
    const includeCompany = searchParams.get('includeCompany') !== 'false';

    // Map industry parameter to enum
    const industry = industryParam ? mapIndustryToEnum(industryParam) : null;

    // Get current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    // Build query conditions
    const conditions: Prisma.MandateTemplateWhereInput = {};

    // Filter by industry if specified and valid
    if (industry) {
      conditions.industry = industry;
    } else if (industryParam) {
      // If industry was specified but couldn't be mapped, return empty results
      return NextResponse.json({
        success: true,
        templates: [],
        warning: `Unknown industry: ${industryParam}`,
      });
    }

    // Filter by type if specified
    if (type) {
      conditions.type = type;
    }

    // Include system templates + optionally company templates
    if (includeCompany && currentUser?.companyId) {
      conditions.OR = [
        { isSystem: true },
        { companyId: currentUser.companyId },
      ];
    } else {
      conditions.isSystem = true;
    }

    const templates = await prisma.mandateTemplate.findMany({
      where: conditions,
      orderBy: [
        { isDefault: 'desc' },
        { type: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        industry: true,
        isDefault: true,
        isSystem: true,
        mandateData: true,
        version: true,
        category: true,
        tags: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Failed to fetch mandate templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mandate templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mandate-templates
 * Creates a new company-specific mandate template.
 * Only company admins can create templates.
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

    // Get current user's company and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Only admins can create templates
    const isAdmin = ['OWNER', 'ORG_ADMIN', 'MANDATE_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admins can create templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      type,
      description,
      industry,
      mandateData,
      category,
      tags,
    } = body;

    // Validate required fields
    if (!name || !type || !description || !industry || !mandateData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type, description, industry, mandateData' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['PRIMARY', 'THEMATIC', 'CARVEOUT'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be PRIMARY, THEMATIC, or CARVEOUT' },
        { status: 400 }
      );
    }

    // Validate industry
    if (!['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'].includes(industry)) {
      return NextResponse.json(
        { success: false, error: 'Invalid industry profile' },
        { status: 400 }
      );
    }

    const template = await prisma.mandateTemplate.create({
      data: {
        name,
        type: type as MandateTemplateType,
        description,
        industry: industry as IndustryProfile,
        mandateData,
        category: category || null,
        tags: tags || [],
        isDefault: false,
        isSystem: false,
        companyId: currentUser.companyId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Failed to create mandate template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create mandate template', details: errorMessage },
      { status: 500 }
    );
  }
}
