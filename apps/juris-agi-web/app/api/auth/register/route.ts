import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, company } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Company name is required - all users must belong to a tenant
    if (!company || !company.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const companyName = company.trim();

    // Check if a company with this name already exists
    // If it does, the user needs to be invited to join rather than creating a new one
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: companyName,
          mode: 'insensitive', // Case-insensitive comparison
        },
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          error: 'A company with this name already exists. Please contact your administrator to request an invitation, or use a different company name.',
          code: 'COMPANY_EXISTS',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company - all users must belong to a tenant
    // Generate a unique slug
    let slug = generateSlug(companyName);
    let slugSuffix = 0;

    // Check if slug exists and make it unique if needed
    while (await prisma.company.findUnique({ where: { slug } })) {
      slugSuffix++;
      slug = `${generateSlug(companyName)}-${slugSuffix}`;
    }

    const companyRecord = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        industryProfile: 'GENERIC', // Will be set during company setup wizard
        settings: {},
      },
    });

    // Create user with company relationship - first user of company is OWNER
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId: companyRecord.id,
        companyRole: 'OWNER',
        legacyRole: 'analyst',
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        companyName: user.company?.name,
        companyRole: user.companyRole,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'An error occurred during registration', details: errorMessage },
      { status: 500 }
    );
  }
}
