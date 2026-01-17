import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { IndustryProfile, ExclusionType, Prisma } from '@prisma/client';
import {
  getTemplatesForIndustry as getFileTemplates,
  getAllTemplates as getAllFileTemplates,
  type ExclusionTemplate,
} from '@/lib/baseline/exclusion-templates';

/**
 * Map short industry names to full enum values
 */
function mapIndustryToEnum(industry: string): IndustryProfile | null {
  const industryMap: Record<string, IndustryProfile> = {
    'VC': IndustryProfile.VENTURE_CAPITAL,
    'INSURANCE': IndustryProfile.INSURANCE,
    'PHARMA': IndustryProfile.PHARMA,
    'GENERIC': IndustryProfile.GENERIC,
    'VENTURE_CAPITAL': IndustryProfile.VENTURE_CAPITAL,
    'PHARMACEUTICAL': IndustryProfile.PHARMA,
  };

  return industryMap[industry.toUpperCase()] || null;
}

/**
 * Transform file-based templates to API response format
 */
function transformFileTemplates(templates: ExclusionTemplate[]) {
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    description: t.description,
    industry: t.industry,
    isDefault: t.isDefault,
    isSystem: true,
    exclusionData: t.exclusion,
    version: 1,
    category: null,
    tags: [],
    companyId: null,
    createdAt: null,
    updatedAt: null,
    source: 'file' as const,
  }));
}

/**
 * GET /api/exclusion-templates
 * Returns exclusion templates filtered by industry, type, and/or company.
 * - System templates from database take priority
 * - Falls back to file-based templates if database is empty or unavailable
 * - Company templates are only visible to users of that company
 *
 * Query params:
 * - industry: Filter by industry profile (VC, VENTURE_CAPITAL, INSURANCE, PHARMA, GENERIC)
 * - type: Filter by exclusion type (HARD, CONDITIONAL)
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
    const typeParam = searchParams.get('type') as ExclusionType | null;
    const includeCompany = searchParams.get('includeCompany') !== 'false';

    // Map industry parameter to enum
    const industry = industryParam ? mapIndustryToEnum(industryParam) : null;

    // Get current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    // Build query conditions
    const conditions: Prisma.ExclusionTemplateWhereInput = {};

    // Filter by industry if specified and valid
    if (industry) {
      conditions.industry = industry;
    } else if (industryParam) {
      // If industry was specified but couldn't be mapped, use file templates
      let fileTemplates = industryParam
        ? getFileTemplates(industryParam)
        : getAllFileTemplates();
      if (typeParam && ['HARD', 'CONDITIONAL'].includes(typeParam)) {
        fileTemplates = fileTemplates.filter((t) => t.type === typeParam);
      }
      return NextResponse.json({
        success: true,
        templates: transformFileTemplates(fileTemplates),
        source: 'file',
      });
    }

    // Filter by type if specified
    if (typeParam && ['HARD', 'CONDITIONAL'].includes(typeParam)) {
      conditions.type = typeParam;
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

    // Try to fetch from database first
    let templates = await prisma.exclusionTemplate.findMany({
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
        exclusionData: true,
        version: true,
        category: true,
        tags: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If no templates in database, fall back to file-based templates
    if (templates.length === 0) {
      let fileTemplates = industryParam
        ? getFileTemplates(industryParam)
        : getAllFileTemplates();
      if (typeParam && ['HARD', 'CONDITIONAL'].includes(typeParam)) {
        fileTemplates = fileTemplates.filter((t) => t.type === typeParam);
      }
      return NextResponse.json({
        success: true,
        templates: transformFileTemplates(fileTemplates),
        source: 'file',
      });
    }

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({ ...t, source: 'database' })),
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch exclusion templates from database, using file fallback:', error);

    // Fallback to file-based templates on any error
    const { searchParams } = new URL(request.url);
    const industryParam = searchParams.get('industry');
    const typeParam = searchParams.get('type') as ExclusionType | null;
    let fileTemplates = industryParam
      ? getFileTemplates(industryParam)
      : getAllFileTemplates();
    if (typeParam && ['HARD', 'CONDITIONAL'].includes(typeParam)) {
      fileTemplates = fileTemplates.filter((t) => t.type === typeParam);
    }

    return NextResponse.json({
      success: true,
      templates: transformFileTemplates(fileTemplates),
      source: 'file',
    });
  }
}

/**
 * POST /api/exclusion-templates
 * Creates a new company-specific exclusion template.
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
      exclusionData,
      category,
      tags,
    } = body;

    // Validate required fields
    if (!name || !type || !description || !industry || !exclusionData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type, description, industry, exclusionData' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['HARD', 'CONDITIONAL'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be HARD or CONDITIONAL' },
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

    const template = await prisma.exclusionTemplate.create({
      data: {
        name,
        type: type as ExclusionType,
        description,
        industry: industry as IndustryProfile,
        exclusionData,
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
    console.error('Failed to create exclusion template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create exclusion template', details: errorMessage },
      { status: 500 }
    );
  }
}
