import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MandateTemplateType, IndustryProfile } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mandate-templates/[id]
 * Returns a single mandate template by ID.
 * - System templates are accessible to all authenticated users
 * - Company templates are only accessible to users of that company
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the template
    const template = await prisma.mandateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // System templates are accessible to all
    if (template.isSystem) {
      return NextResponse.json({
        success: true,
        template,
      });
    }

    // Company templates require company membership
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (template.companyId !== currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Failed to fetch mandate template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mandate template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mandate-templates/[id]
 * Updates a company-specific mandate template.
 * System templates cannot be updated.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the template
    const template = await prisma.mandateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // System templates cannot be modified
    if (template.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System templates cannot be modified' },
        { status: 403 }
      );
    }

    // Verify user belongs to the template's company and is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (template.companyId !== currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const isAdmin = ['OWNER', 'ORG_ADMIN', 'MANDATE_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admins can update templates' },
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

    // Build update data
    const updateData: Parameters<typeof prisma.mandateTemplate.update>[0]['data'] = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) {
      if (!['PRIMARY', 'THEMATIC', 'CARVEOUT'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
      }
      updateData.type = type as MandateTemplateType;
    }
    if (description !== undefined) updateData.description = description;
    if (industry !== undefined) {
      if (!['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'].includes(industry)) {
        return NextResponse.json(
          { success: false, error: 'Invalid industry profile' },
          { status: 400 }
        );
      }
      updateData.industry = industry as IndustryProfile;
    }
    if (mandateData !== undefined) updateData.mandateData = mandateData;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    // Increment version on significant updates
    if (mandateData !== undefined) {
      updateData.version = template.version + 1;
    }

    const updatedTemplate = await prisma.mandateTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('Failed to update mandate template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update mandate template', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mandate-templates/[id]
 * Deletes a company-specific mandate template.
 * System templates cannot be deleted.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the template
    const template = await prisma.mandateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // System templates cannot be deleted
    if (template.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System templates cannot be deleted' },
        { status: 403 }
      );
    }

    // Verify user belongs to the template's company and is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (template.companyId !== currentUser?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const isAdmin = ['OWNER', 'ORG_ADMIN', 'MANDATE_ADMIN'].includes(currentUser.companyRole);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete templates' },
        { status: 403 }
      );
    }

    await prisma.mandateTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete mandate template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mandate template' },
      { status: 500 }
    );
  }
}
