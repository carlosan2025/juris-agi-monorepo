/**
 * Single Governance Template API
 *
 * Returns a specific governance template by ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGovernanceTemplateById } from '@/lib/baseline/governance-templates';

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

    const template = getGovernanceTemplateById(id);

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
        governanceData: template.governance,
        source: 'file',
      },
    });
  } catch (error) {
    console.error('Error fetching governance template:', error);
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
