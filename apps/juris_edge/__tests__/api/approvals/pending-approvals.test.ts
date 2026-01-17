/**
 * Unit Tests: Pending Approvals API
 * Tests the /api/approvals/pending endpoint that fetches pending approval items for users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse } from '../../helpers/testHelpers';
import { testUsers, testPortfolios, testBaselineVersions, testPortfolioMembers } from '../../fixtures/testData';

// Mock modules with inline factories (vi.mock is hoisted)
vi.mock('@/lib/prisma', () => {
  const mockFn = () => ({
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    portfolioMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    portfolioBaselineVersion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  });
  return { default: mockFn() };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Import after mocks
import { GET } from '@/app/api/approvals/pending/route';
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
    user: { id: 'user-admin-456', email: 'admin@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  member: {
    user: { id: 'user-member-789', email: 'member@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  checker: {
    user: { id: 'user-checker-999', email: 'checker@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

describe('GET /api/approvals/pending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockStandardRequest('GET', '/api/approvals/pending');
      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    it('should return 400 if user not associated with company', async () => {
      mockAuth.mockResolvedValue(mockSessions.member);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: null,
        companyRole: 'MEMBER',
      } as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not associated with a company');
    });
  });

  describe('Company Admin Access', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSessions.owner);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'OWNER',
      } as any);
    });

    it('should return all pending baselines in company for OWNER', async () => {
      const pendingBaselines = [
        {
          ...testBaselineVersions.pendingApproval,
          portfolio: { id: 'portfolio-1', name: 'Portfolio 1' },
          submittedBy: testUsers.member,
          createdBy: testUsers.member,
        },
        {
          ...testBaselineVersions.pendingApproval,
          id: 'baseline-pending-2',
          portfolioId: 'portfolio-2',
          portfolio: { id: 'portfolio-2', name: 'Portfolio 2' },
          submittedBy: testUsers.admin,
          createdBy: testUsers.admin,
        },
      ];

      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pendingApprovals).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('should return all pending baselines in company for ORG_ADMIN', async () => {
      mockAuth.mockResolvedValue(mockSessions.admin);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'ORG_ADMIN',
      } as any);

      const pendingBaselines = [
        {
          ...testBaselineVersions.pendingApproval,
          portfolio: { id: 'portfolio-1', name: 'Portfolio 1' },
          submittedBy: testUsers.member,
          createdBy: testUsers.member,
        },
      ];

      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pendingApprovals).toHaveLength(1);
    });

    it('should not filter by portfolio for company admins', async () => {
      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([]);

      await GET();

      // Verify the query does not include portfolio ID filter for admins
      expect(mockPrisma.portfolioBaselineVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING_APPROVAL',
            portfolio: expect.objectContaining({
              companyId: 'company-123',
            }),
          }),
        })
      );

      // Should NOT have { id: { in: [...] } } in portfolio filter for admins
      const callArgs = mockPrisma.portfolioBaselineVersion.findMany.mock.calls[0][0];
      expect(callArgs.where.portfolio.id).toBeUndefined();
    });
  });

  describe('Checker Access', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSessions.checker);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'MEMBER', // Not admin
      } as any);
    });

    it('should return only pending baselines from portfolios where user is CHECKER', async () => {
      // User is CHECKER on portfolio-1 only
      mockPrisma.portfolioMember.findMany.mockResolvedValue([
        { portfolioId: 'portfolio-1', accessLevel: 'CHECKER' } as any,
      ]);

      const pendingBaselines = [
        {
          ...testBaselineVersions.pendingApproval,
          portfolioId: 'portfolio-1',
          portfolio: { id: 'portfolio-1', name: 'Portfolio 1' },
          submittedBy: testUsers.member,
          createdBy: testUsers.member,
        },
      ];

      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pendingApprovals).toHaveLength(1);

      // Verify the query filters by portfolio IDs
      expect(mockPrisma.portfolioBaselineVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING_APPROVAL',
            portfolio: expect.objectContaining({
              companyId: 'company-123',
              id: { in: ['portfolio-1'] },
            }),
          }),
        })
      );
    });

    it('should return empty list if user is not CHECKER on any portfolio', async () => {
      // User has no CHECKER access
      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([]);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pendingApprovals).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it('should exclude portfolios where user is MAKER or VIEWER', async () => {
      // User is MAKER on one, VIEWER on another, but not CHECKER
      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([]);

      // The findMany for CHECKER should have accessLevel: 'CHECKER' filter
      await GET();

      expect(mockPrisma.portfolioMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-checker-999',
            accessLevel: 'CHECKER',
          }),
        })
      );
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSessions.owner);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'OWNER',
      } as any);
      mockPrisma.portfolioMember.findMany.mockResolvedValue([]);
    });

    it('should transform pending baselines to approval items', async () => {
      const pendingBaselines = [
        {
          id: 'baseline-pending-123',
          portfolioId: 'portfolio-1',
          versionNumber: 2,
          status: 'PENDING_APPROVAL',
          changeSummary: 'Updated investment thesis',
          submittedAt: new Date('2024-02-10'),
          portfolio: { id: 'portfolio-1', name: 'Growth Fund I' },
          submittedBy: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          createdBy: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        },
      ];

      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.pendingApprovals[0]).toEqual({
        id: 'baseline-pending-123',
        type: 'BASELINE',
        title: 'Baseline v2',
        description: 'Updated investment thesis',
        portfolioId: 'portfolio-1',
        portfolioName: 'Growth Fund I',
        submittedAt: expect.any(String),
        submittedBy: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        href: '/company/portfolios/portfolio-1/baseline/baseline-pending-123',
      });
    });

    it('should use createdBy as fallback when submittedBy is null', async () => {
      const pendingBaselines = [
        {
          id: 'baseline-pending-123',
          portfolioId: 'portfolio-1',
          versionNumber: 1,
          status: 'PENDING_APPROVAL',
          changeSummary: null,
          submittedAt: null,
          portfolio: { id: 'portfolio-1', name: 'Growth Fund I' },
          submittedBy: null,
          createdBy: { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com' },
        },
      ];

      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.pendingApprovals[0].submittedBy).toEqual({
        id: 'user-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });

    it('should provide default description when changeSummary is null', async () => {
      const pendingBaselines = [
        {
          id: 'baseline-pending-123',
          portfolioId: 'portfolio-1',
          versionNumber: 1,
          status: 'PENDING_APPROVAL',
          changeSummary: null,
          submittedAt: null,
          portfolio: { id: 'portfolio-1', name: 'Growth Fund I' },
          submittedBy: null,
          createdBy: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        },
      ];

      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(pendingBaselines as any);

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.pendingApprovals[0].description).toBe('No description provided');
    });

    it('should order results by submittedAt descending', async () => {
      mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.portfolioBaselineVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { submittedAt: 'desc' },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue(mockSessions.owner);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'OWNER',
      } as any);
      mockPrisma.portfolioMember.findMany.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const { status, data } = await parseResponse(response);

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch pending approvals');
    });
  });
});
