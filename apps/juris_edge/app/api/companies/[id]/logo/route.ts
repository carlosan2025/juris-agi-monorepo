import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Maximum file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/companies/[id]/logo
 * Upload a company logo
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;

    // Verify user belongs to this company and has admin rights
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (user?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner
    if (!['OWNER', 'ORG_ADMIN'].includes(user.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can upload company logo' },
        { status: 403 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size: 2MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${companyId}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate the public URL
    const logoUrl = `/uploads/logos/${filename}`;

    // Update company with new logo URL
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl },
    });

    return NextResponse.json({
      success: true,
      logoUrl,
    });
  } catch (error) {
    console.error('Failed to upload logo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]/logo
 * Remove company logo
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;

    // Verify user belongs to this company and has admin rights
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyRole: true },
    });

    if (user?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user is admin/owner
    if (!['OWNER', 'ORG_ADMIN'].includes(user.companyRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can remove company logo' },
        { status: 403 }
      );
    }

    // Clear logo URL from company
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: null },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to remove logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove logo' },
      { status: 500 }
    );
  }
}
