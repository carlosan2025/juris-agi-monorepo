/**
 * Unit Tests: Maker-Checker Workflow
 * Tests the role-based access control for baseline submission, approval, and rejection
 *
 * Roles:
 * - MAKER: Can create/edit baselines and submit for approval
 * - CHECKER: Can approve or reject pending baselines
 * - Company Admins (OWNER/ORG_ADMIN): Have all permissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse, createMockParams } from '../../helpers/testHelpers';
import { testUsers, testPortfolios, testBaselineVersions, testPortfolioMembers } from '../../fixtures/testData';

// Mock modules with inline factories (vi.mock is hoisted)
vi.mock('@/lib/prisma', () => {
  const mockFn = () => ({
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    portfolio: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
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
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  });
  return { default: mockFn() };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/baseline/validation', () => ({
  canPublishBaseline: vi.fn().mockReturnValue({ canPublish: true, blockers: [] }),
}));

// Import after mocks
import { GET as getBaselineVersion } from '@/app/api/portfolios/[id]/baseline/[versionId]/route';
import { POST as submitBaseline } from '@/app/api/portfolios/[id]/baseline/[versionId]/submit/route';
import { POST as approveBaseline } from '@/app/api/portfolios/[id]/baseline/[versionId]/approve/route';
import { POST as rejectBaseline } from '@/app/api/portfolios/[id]/baseline/[versionId]/reject/route';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

// Mock sessions for different user types
const mockSessions = {
  owner: {
    user: { id: 'user-owner-123', email: 'owner@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  orgAdmin: {
    user: { id: 'user-admin-456', email: 'admin@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  maker: {
    user: { id: 'user-maker-789', email: 'maker@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  checker: {
    user: { id: 'user-checker-111', email: 'checker@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  viewer: {
    user: { id: 'user-viewer-222', email: 'viewer@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  memberNoAccess: {
    user: { id: 'user-no-access-333', email: 'noaccess@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

// Helper to setup common mocks
function setupUserMock(companyRole: string) {
  return {
    companyId: 'company-123',
    companyRole,
  };
}

function setupPortfolioMemberMock(accessLevel: string | null) {
  if (accessLevel === null) return null;
  return { accessLevel };
}

describe('Maker-Checker Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/portfolios/[id]/baseline/[versionId]/submit', () => {
    const portfolioId = testPortfolios.active.id;
    const versionId = testBaselineVersions.draft.id;

    describe('MAKER Role Authorization', () => {
      it('should allow MAKER to submit a DRAFT baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.draft,
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
          submittedBy: { id: 'user-maker-789', name: 'Maker User' },
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          { changeSummary: 'Ready for review' }
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.baselineVersion.status).toBe('PENDING_APPROVAL');
      });

      it('should allow MAKER to resubmit a REJECTED baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.rejected,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.rejected,
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
          rejectedAt: null,
          rejectedById: null,
          rejectionReason: null,
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should deny CHECKER from submitting a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Only administrators or makers can submit');
      });

      it('should deny VIEWER from submitting a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.viewer);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('VIEWER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
      });

      it('should deny user with no portfolio access from submitting', async () => {
        mockAuth.mockResolvedValue(mockSessions.memberNoAccess);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null); // No portfolio membership

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
      });
    });

    describe('Company Admin Override', () => {
      it('should allow OWNER to submit regardless of portfolio access level', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('OWNER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null); // No specific portfolio role
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.draft,
          status: 'PENDING_APPROVAL',
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should allow ORG_ADMIN to submit regardless of portfolio access level', async () => {
        mockAuth.mockResolvedValue(mockSessions.orgAdmin);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('ORG_ADMIN') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.draft,
          status: 'PENDING_APPROVAL',
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('POST /api/portfolios/[id]/baseline/[versionId]/approve', () => {
    const portfolioId = testPortfolios.active.id;
    const versionId = testBaselineVersions.pendingApproval.id;

    describe('CHECKER Role Authorization', () => {
      it('should allow CHECKER to approve a pending baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            ...testPortfolios.active,
            companyId: 'company-123',
            activeBaselineVersionId: 'baseline-v1',
          },
        } as any);

        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockResolvedValue({
                ...testBaselineVersions.pendingApproval,
                status: 'PUBLISHED',
                approvedAt: new Date(),
                approvedBy: { id: 'user-checker-111', name: 'Checker User' },
              }),
            },
            portfolio: {
              update: vi.fn().mockResolvedValue({}),
            },
          };
          return callback(txPrisma);
        });
        mockPrisma.$transaction = transactionMock;

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Baseline approved and published');
      });

      it('should deny MAKER from approving a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Only administrators or checkers can approve');
      });

      it('should deny VIEWER from approving a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.viewer);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('VIEWER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
      });
    });

    describe('Company Admin Override', () => {
      it('should allow OWNER to approve regardless of portfolio access level', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('OWNER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            ...testPortfolios.active,
            companyId: 'company-123',
            activeBaselineVersionId: null,
          },
        } as any);

        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockResolvedValue({
                status: 'PUBLISHED',
                approvedAt: new Date(),
              }),
            },
            portfolio: {
              update: vi.fn().mockResolvedValue({}),
            },
          };
          return callback(txPrisma);
        });
        mockPrisma.$transaction = transactionMock;

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should allow ORG_ADMIN to approve regardless of portfolio access level', async () => {
        mockAuth.mockResolvedValue(mockSessions.orgAdmin);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('ORG_ADMIN') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            ...testPortfolios.active,
            companyId: 'company-123',
            activeBaselineVersionId: null,
          },
        } as any);

        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockResolvedValue({
                status: 'PUBLISHED',
                approvedAt: new Date(),
              }),
            },
            portfolio: {
              update: vi.fn().mockResolvedValue({}),
            },
          };
          return callback(txPrisma);
        });
        mockPrisma.$transaction = transactionMock;

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('POST /api/portfolios/[id]/baseline/[versionId]/reject', () => {
    const portfolioId = testPortfolios.active.id;
    const versionId = testBaselineVersions.pendingApproval.id;

    describe('CHECKER Role Authorization', () => {
      it('should allow CHECKER to reject a pending baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: 'Missing required information',
          rejectedBy: { id: 'user-checker-111', name: 'Checker User' },
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          { rejectionReason: 'Missing required information' }
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Baseline rejected');
        expect(data.baselineVersion.status).toBe('REJECTED');
      });

      it('should deny MAKER from rejecting a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          { rejectionReason: 'Test rejection' }
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Only administrators or checkers can reject');
      });

      it('should deny VIEWER from rejecting a baseline', async () => {
        mockAuth.mockResolvedValue(mockSessions.viewer);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('VIEWER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          { rejectionReason: 'Test rejection' }
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
      });
    });

    describe('Rejection Reason Validation', () => {
      it('should require a rejection reason', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          {} // No rejection reason
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Rejection reason is required');
      });

      it('should reject empty rejection reason', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          { rejectionReason: '   ' } // Whitespace only
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Company Admin Override', () => {
      it('should allow OWNER to reject regardless of portfolio access level', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('OWNER') as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: 'Admin rejection',
        } as any);

        const request = createMockStandardRequest(
          'POST',
          `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
          { rejectionReason: 'Admin rejection' }
        );

        const response = await rejectBaseline(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('GET /api/portfolios/[id]/baseline/[versionId] - Permission Flags', () => {
    const portfolioId = testPortfolios.active.id;
    const versionId = testBaselineVersions.draft.id;

    describe('MAKER Permission Flags', () => {
      it('should return canEdit=true and canSubmit=true for MAKER on DRAFT', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: null,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${versionId}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.baselineVersion.canEdit).toBe(true);
        expect(data.baselineVersion.canSubmit).toBe(true);
        expect(data.baselineVersion.canApprove).toBe(false);
        expect(data.baselineVersion.canReject).toBe(false);
        expect(data.baselineVersion.userAccessLevel).toBe('MAKER');
      });

      it('should return canApprove=false and canReject=false for MAKER on PENDING_APPROVAL', async () => {
        mockAuth.mockResolvedValue(mockSessions.maker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: testUsers.member,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.pendingApproval.id}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(false);
        expect(data.baselineVersion.canSubmit).toBe(false);
        expect(data.baselineVersion.canApprove).toBe(false);
        expect(data.baselineVersion.canReject).toBe(false);
      });
    });

    describe('CHECKER Permission Flags', () => {
      it('should return canApprove=true and canReject=true for CHECKER on PENDING_APPROVAL', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: testUsers.member,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.pendingApproval.id}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(false);
        expect(data.baselineVersion.canSubmit).toBe(false);
        expect(data.baselineVersion.canApprove).toBe(true);
        expect(data.baselineVersion.canReject).toBe(true);
        expect(data.baselineVersion.userAccessLevel).toBe('CHECKER');
      });

      it('should return canEdit=false for CHECKER on DRAFT', async () => {
        mockAuth.mockResolvedValue(mockSessions.checker);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: null,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${versionId}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(false);
        expect(data.baselineVersion.canSubmit).toBe(false);
      });
    });

    describe('VIEWER Permission Flags', () => {
      it('should return all permissions as false for VIEWER', async () => {
        mockAuth.mockResolvedValue(mockSessions.viewer);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: null,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('VIEWER') as any);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${versionId}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(false);
        expect(data.baselineVersion.canSubmit).toBe(false);
        expect(data.baselineVersion.canApprove).toBe(false);
        expect(data.baselineVersion.canReject).toBe(false);
        expect(data.baselineVersion.userAccessLevel).toBe('VIEWER');
      });
    });

    describe('Company Admin Permission Flags', () => {
      it('should return all relevant permissions for OWNER', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('OWNER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: null,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null); // No specific portfolio role

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${versionId}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(true);
        expect(data.baselineVersion.canSubmit).toBe(true);
        expect(data.baselineVersion.canApprove).toBe(false); // Only on PENDING_APPROVAL
        expect(data.baselineVersion.canReject).toBe(false); // Only on PENDING_APPROVAL
        expect(data.baselineVersion.userAccessLevel).toBe('ADMIN');
      });

      it('should return approve/reject for OWNER on PENDING_APPROVAL', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('OWNER') as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId,
          portfolio: {
            id: portfolioId,
            companyId: 'company-123',
            name: 'Test Portfolio',
            activeBaselineVersionId: null,
          },
          modules: [],
          createdBy: testUsers.admin,
          submittedBy: testUsers.member,
          approvedBy: null,
          rejectedBy: null,
          publishedBy: null,
          parentVersion: null,
        } as any);
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);

        const request = createMockStandardRequest(
          'GET',
          `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.pendingApproval.id}`
        );

        const response = await getBaselineVersion(
          request,
          createMockParams({ id: portfolioId, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.canEdit).toBe(false);
        expect(data.baselineVersion.canSubmit).toBe(false);
        expect(data.baselineVersion.canApprove).toBe(true);
        expect(data.baselineVersion.canReject).toBe(true);
      });
    });
  });

  describe('Workflow Integration', () => {
    const portfolioId = testPortfolios.active.id;

    it('should enforce complete maker-checker flow', async () => {
      // Step 1: MAKER creates and submits
      mockAuth.mockResolvedValue(mockSessions.maker);
      mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
      mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);
      mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
        ...testBaselineVersions.draft,
        portfolioId,
        portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
      } as any);
      mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
        ...testBaselineVersions.draft,
        status: 'PENDING_APPROVAL',
      } as any);

      const submitRequest = createMockStandardRequest(
        'POST',
        `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.draft.id}/submit`,
        {}
      );

      const submitResponse = await submitBaseline(
        submitRequest,
        createMockParams({ id: portfolioId, versionId: testBaselineVersions.draft.id })
      );
      const submitResult = await parseResponse(submitResponse);

      expect(submitResult.status).toBe(200);
      expect(submitResult.data.baselineVersion.status).toBe('PENDING_APPROVAL');

      // Step 2: CHECKER approves
      vi.clearAllMocks();
      mockAuth.mockResolvedValue(mockSessions.checker);
      mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
      mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);
      mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
        ...testBaselineVersions.pendingApproval,
        portfolioId,
        portfolio: {
          ...testPortfolios.active,
          companyId: 'company-123',
          activeBaselineVersionId: null,
        },
      } as any);

      const transactionMock = vi.fn().mockImplementation(async (callback) => {
        const txPrisma = {
          portfolioBaselineVersion: {
            update: vi.fn().mockResolvedValue({
              ...testBaselineVersions.pendingApproval,
              status: 'PUBLISHED',
            }),
          },
          portfolio: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txPrisma);
      });
      mockPrisma.$transaction = transactionMock;

      const approveRequest = createMockStandardRequest(
        'POST',
        `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.pendingApproval.id}/approve`,
        {}
      );

      const approveResponse = await approveBaseline(
        approveRequest,
        createMockParams({ id: portfolioId, versionId: testBaselineVersions.pendingApproval.id })
      );
      const approveResult = await parseResponse(approveResponse);

      expect(approveResult.status).toBe(200);
      expect(approveResult.data.baselineVersion.status).toBe('PUBLISHED');
    });

    it('should enforce rejection and resubmission flow', async () => {
      // Step 1: CHECKER rejects
      mockAuth.mockResolvedValue(mockSessions.checker);
      mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
      mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('CHECKER') as any);
      mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
        ...testBaselineVersions.pendingApproval,
        portfolioId,
        portfolio: { ...testPortfolios.active, companyId: 'company-123' },
      } as any);
      mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
        ...testBaselineVersions.pendingApproval,
        status: 'REJECTED',
        rejectionReason: 'Missing information',
      } as any);

      const rejectRequest = createMockStandardRequest(
        'POST',
        `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.pendingApproval.id}/reject`,
        { rejectionReason: 'Missing information' }
      );

      const rejectResponse = await rejectBaseline(
        rejectRequest,
        createMockParams({ id: portfolioId, versionId: testBaselineVersions.pendingApproval.id })
      );
      const rejectResult = await parseResponse(rejectResponse);

      expect(rejectResult.status).toBe(200);
      expect(rejectResult.data.baselineVersion.status).toBe('REJECTED');

      // Step 2: MAKER resubmits
      vi.clearAllMocks();
      mockAuth.mockResolvedValue(mockSessions.maker);
      mockPrisma.user.findUnique.mockResolvedValue(setupUserMock('MEMBER') as any);
      mockPrisma.portfolioMember.findUnique.mockResolvedValue(setupPortfolioMemberMock('MAKER') as any);
      mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
        ...testBaselineVersions.rejected,
        portfolioId,
        portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
      } as any);
      mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
        ...testBaselineVersions.rejected,
        status: 'PENDING_APPROVAL',
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      } as any);

      const resubmitRequest = createMockStandardRequest(
        'POST',
        `/api/portfolios/${portfolioId}/baseline/${testBaselineVersions.rejected.id}/submit`,
        { changeSummary: 'Fixed issues' }
      );

      const resubmitResponse = await submitBaseline(
        resubmitRequest,
        createMockParams({ id: portfolioId, versionId: testBaselineVersions.rejected.id })
      );
      const resubmitResult = await parseResponse(resubmitResponse);

      expect(resubmitResult.status).toBe(200);
      expect(resubmitResult.data.baselineVersion.status).toBe('PENDING_APPROVAL');
    });
  });
});
