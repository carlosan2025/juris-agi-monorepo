import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * POST /api/companies/setup
 * Creates a company for a user who doesn't have one, or updates an existing company
 * Used during the company setup wizard
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

    const body = await request.json();
    const { companyName, industryProfile } = body;

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Validate industry profile
    const validProfiles = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'];
    const profile = industryProfile && validProfiles.includes(industryProfile)
      ? industryProfile
      : 'GENERIC';

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let company;

    if (user.companyId && user.company) {
      // User already has a company - update it
      company = await prisma.company.update({
        where: { id: user.companyId },
        data: {
          name: companyName.trim(),
          industryProfile: profile,
        },
      });
    } else {
      // User doesn't have a company - create one
      // Generate a unique slug
      let slug = generateSlug(companyName);
      let slugSuffix = 0;

      while (await prisma.company.findUnique({ where: { slug } })) {
        slugSuffix++;
        slug = `${generateSlug(companyName)}-${slugSuffix}`;
      }

      // Create company and link user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const newCompany = await tx.company.create({
          data: {
            name: companyName.trim(),
            slug,
            industryProfile: profile,
            settings: {},
          },
        });

        // Update user to link to company and make them owner
        await tx.user.update({
          where: { id: user.id },
          data: {
            companyId: newCompany.id,
            companyRole: 'OWNER',
          },
        });

        return newCompany;
      });

      company = result;
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industryProfile: company.industryProfile,
      },
    });
  } catch (error) {
    console.error('Failed to setup company:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to setup company', details: errorMessage },
      { status: 500 }
    );
  }
}
