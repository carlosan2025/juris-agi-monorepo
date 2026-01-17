/**
 * Unit Tests: GET /api/users
 * Tests user listing endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse, createMockParams } from '../../helpers/testHelpers';
import { testUsers, testCompanies } from '../../fixtures/testData';

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

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Import after mocks
import { GET } from '@/app/api/users/route';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

// Mock sessions
const mockSessions = {
  owner: {
    user: { id: 'user-owner-123', email: 'owner@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  admin: {
    user: { id: 'user-admin-123', email: 'admin@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  member: {
    user: { id: 'user-member-123', email: 'member@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should return 400 if companyId is missing', async () => {
      mockAuth.mockResolvedValue(mockSessions.member);

      const request = createMockStandardRequest('GET', '/api/users');

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('companyId is required');
    });
  });

  describe('Authorization', () => {
    it('should return 403 if user belongs to different company', async () => {
      mockAuth.mockResolvedValue(mockSessions.member);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...testUsers.member,
        companyId: 'different-company-id',
      } as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });
  });

  describe('Successful Requests', () => {
    it('should return users for the company', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      const usersWithCounts = [
        { ...testUsers.owner, _count: { portfolioMemberships: 5 } },
        { ...testUsers.admin, _count: { portfolioMemberships: 3 } },
        { ...testUsers.member, _count: { portfolioMemberships: 2 } },
      ];
      mockPrisma.user.findMany.mockResolvedValue(usersWithCounts as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(3);
      expect(data.users[0].portfolioCount).toBe(5);
    });

    it('should include portfolio membership count for each user', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.member, _count: { portfolioMemberships: 10 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users[0].portfolioCount).toBe(10);
    });

    it('should map companyRole to role in response', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.owner, _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users[0].role).toBe('OWNER');
    });

    it('should default status to ACTIVE if not present', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.member, _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users[0].status).toBe('ACTIVE');
    });
  });

  describe('Status Filtering', () => {
    it('should filter out DELETED users by default', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.owner, status: 'ACTIVE', _count: { portfolioMemberships: 0 } },
        { ...testUsers.member, status: 'DELETED', _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].email).toBe(testUsers.owner.email);
    });

    it('should include DELETED users when includeDeleted=true', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.owner, status: 'ACTIVE', _count: { portfolioMemberships: 0 } },
        { ...testUsers.member, status: 'DELETED', _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123&includeDeleted=true'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users).toHaveLength(2);
    });

    it('should show SUSPENDED users to admins', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.owner, status: 'ACTIVE', _count: { portfolioMemberships: 0 } },
        { ...testUsers.member, status: 'SUSPENDED', _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users).toHaveLength(2);
    });

    it('should hide SUSPENDED users from non-admins', async () => {
      mockAuth.mockResolvedValue(mockSessions.member);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'MEMBER', // Not admin
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([
        { ...testUsers.owner, status: 'ACTIVE', _count: { portfolioMemberships: 0 } },
        { ...testUsers.member, status: 'SUSPENDED', _count: { portfolioMemberships: 0 } },
      ] as any);

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].status).toBe('ACTIVE');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const request = createMockStandardRequest(
        'GET',
        '/api/users?companyId=company-123'
      );

      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch users');
    });
  });
});
