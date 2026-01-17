/**
 * Unit Tests: POST /api/auth/register
 * Tests user registration endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, parseResponse } from '../../helpers/testHelpers';
import { testCompanies, testUsers } from '../../fixtures/testData';

// Mock modules with inline factories (vi.mock is hoisted)
vi.mock('@/lib/prisma', () => {
  const mockFn = () => ({
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  });
  return { default: mockFn() };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$mockedHashedPassword'),
  },
}));

// Import after mocks
import { POST } from '@/app/api/auth/register/route';
import prisma from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 if email is missing', async () => {
      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        password: 'password123',
        company: 'Test Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Name, email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Name, email and password are required');
    });

    it('should return 400 if name is missing', async () => {
      const request = createMockRequest('POST', '/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        company: 'Test Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Name, email and password are required');
    });

    it('should return 400 if company name is missing', async () => {
      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Company name is required');
    });

    it('should return 400 if company name is empty string', async () => {
      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        company: '   ',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Company name is required');
    });
  });

  describe('Company Validation', () => {
    it('should return 400 if company name already exists', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(testCompanies.primary as any);

      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        company: 'Test Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.code).toBe('COMPANY_EXISTS');
      expect(data.error).toContain('company with this name already exists');
    });
  });

  describe('User Validation', () => {
    it('should return 400 if user already exists', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(testUsers.owner as any);

      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'owner@testcompany.com',
        password: 'password123',
        company: 'New Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });
  });

  describe('Successful Registration', () => {
    it('should create company and user successfully', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.company.findUnique.mockResolvedValue(null);

      const newCompany = {
        id: 'new-company-id',
        name: 'New Company',
        slug: 'new-company',
        industryProfile: 'GENERIC',
        settings: {},
      };

      const newUser = {
        id: 'new-user-id',
        name: 'New User',
        email: 'newuser@example.com',
        companyId: newCompany.id,
        companyRole: 'OWNER',
        company: newCompany,
      };

      mockPrisma.company.create.mockResolvedValue(newCompany as any);
      mockPrisma.user.create.mockResolvedValue(newUser as any);

      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        company: 'New Company',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('New User');
      expect(data.user.email).toBe('newuser@example.com');
      expect(data.user.companyRole).toBe('OWNER');
      expect(data.user.companyName).toBe('New Company');
    });

    it('should set first user as OWNER', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.company.create.mockResolvedValue({ id: 'company-id', name: 'Test' } as any);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        companyRole: 'OWNER',
        company: { name: 'Test' },
      } as any);

      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        company: 'Test',
      });

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyRole: 'OWNER',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockPrisma.company.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('POST', '/api/auth/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        company: 'Test',
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(500);
      expect(data.error).toBe('An error occurred during registration');
      expect(data.details).toBeDefined();
    });
  });
});
