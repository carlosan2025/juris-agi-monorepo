/**
 * Single Risk Appetite Template API
 *
 * Returns a specific risk appetite template by ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/baseline/risk-appetite-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template ID is required',
        },
        { status: 400 }
      );
    }

    const template = getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        industry: template.industry,
        isDefault: template.isDefault,
        riskAppetiteData: template.riskAppetite,
        source: 'file',
      },
    });
  } catch (error) {
    console.error('Error fetching risk appetite template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
