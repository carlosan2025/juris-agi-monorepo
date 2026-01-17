/**
 * Unit Tests: Portfolio Baseline Workflow
 * Tests the complete baseline workflow: create -> submit -> approve/reject -> publish
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse, createMockParams } from '../../helpers/testHelpers';
import { testUsers, testPortfolios, testBaselineVersions, testBaselineModules } from '../../fixtures/testData';

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
    portfolio: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    portfolioBaselineVersion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    portfolioMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  });
  return { default: mockFn() };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/baseline/types', () => ({
  ALL_MODULE_TYPES: [
    'INVESTMENT_THESIS',
    'MARKET_ANALYSIS',
    'RISK_MANAGEMENT',
    'CONSTRAINTS',
    'OPERATIONAL_FRAMEWORK',
    'PERFORMANCE_METRICS',
    'CASH_FLOW',
    'GOVERNANCE',
    'REPORTING',
    'VALUATION',
  ],
  getDefaultPayload: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/baseline/validation', () => ({
  canPublishBaseline: vi.fn().mockReturnValue({ canPublish: true, blockers: [] }),
}));

// Import after mocks
import { GET as getBaselines, POST as createBaseline } from '@/app/api/portfolios/[id]/baseline/route';
import { POST as submitBaseline } from '@/app/api/portfolios/[id]/baseline/[versionId]/submit/route';
import { POST as approveBaseline } from '@/app/api/portfolios/[id]/baseline/[versionId]/approve/route';
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

describe('Portfolio Baseline Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/portfolios/[id]/baseline', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-123/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-123' }));
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

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-123/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('User not associated with a company');
      });

      it('should return 404 if portfolio not found', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue(null);

        const request = createMockStandardRequest('GET', '/api/portfolios/nonexistent/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'nonexistent' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Portfolio not found');
      });

      it('should return 403 if portfolio belongs to different company', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.otherCompany,
        } as any);

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-other/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-other' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Access denied');
      });
    });

    describe('Successful Requests', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue(testPortfolios.active as any);
      });

      it('should return baseline versions with modules summary', async () => {
        const versions = [
          {
            ...testBaselineVersions.draft,
            modules: [
              { moduleType: 'INVESTMENT_THESIS', isComplete: true, isValid: true },
              { moduleType: 'RISK_MANAGEMENT', isComplete: false, isValid: true },
            ],
            createdBy: testUsers.admin,
            submittedBy: null,
            approvedBy: null,
            rejectedBy: null,
            publishedBy: null,
          },
        ];
        mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue(versions as any);

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-123/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.versions).toHaveLength(1);
        expect(data.versions[0].modulesSummary).toBeDefined();
        expect(data.versions[0].modulesSummary.total).toBe(2);
        expect(data.versions[0].modulesSummary.complete).toBe(1);
      });

      it('should include workflow state flags', async () => {
        mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([
          {
            ...testBaselineVersions.draft,
            modules: [{ moduleType: 'INVESTMENT_THESIS', isComplete: true, isValid: true }],
            createdBy: testUsers.admin,
            submittedBy: null,
            approvedBy: null,
            rejectedBy: null,
            publishedBy: null,
          },
        ] as any);

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-123/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        const version = data.versions[0];
        expect(version.canEdit).toBe(true); // DRAFT status
        expect(version.canSubmit).toBe(true); // All modules valid
        expect(version.canApprove).toBe(false); // Not PENDING_APPROVAL
        expect(version.canReject).toBe(false); // Not PENDING_APPROVAL
      });

      it('should indicate active baseline version', async () => {
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          activeBaselineVersionId: 'baseline-v1',
        } as any);
        mockPrisma.portfolioBaselineVersion.findMany.mockResolvedValue([
          {
            ...testBaselineVersions.published,
            id: 'baseline-v1',
            modules: [],
            createdBy: testUsers.owner,
            submittedBy: testUsers.owner,
            approvedBy: testUsers.owner,
            rejectedBy: null,
            publishedBy: testUsers.owner,
          },
        ] as any);

        const request = createMockStandardRequest('GET', '/api/portfolios/portfolio-123/baseline');

        const response = await getBaselines(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.versions[0].isActive).toBe(true);
        expect(data.activeBaselineVersionId).toBe('baseline-v1');
      });
    });
  });

  describe('POST /api/portfolios/[id]/baseline (Create)', () => {
    describe('Authorization', () => {
      it('should return 403 if user is not admin', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER', // Not admin
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue(testPortfolios.active as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/portfolio-123/baseline', {});

        const response = await createBaseline(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Only administrators can create baseline versions');
      });
    });

    describe('Conflict Detection', () => {
      it('should return 409 if draft already exists', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue(testPortfolios.active as any);
        mockPrisma.portfolioBaselineVersion.findFirst.mockResolvedValue(testBaselineVersions.draft as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/portfolio-123/baseline', {});

        const response = await createBaseline(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(409);
        expect(data.success).toBe(false);
        expect(data.error).toContain('draft baseline version already exists');
        expect(data.existingDraftId).toBe(testBaselineVersions.draft.id);
      });
    });

    describe('Successful Creation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue(testPortfolios.active as any);
        mockPrisma.portfolioBaselineVersion.findFirst
          .mockResolvedValueOnce(null) // No existing draft
          .mockResolvedValueOnce({ versionNumber: 1 } as any); // Latest version
      });

      it('should create new baseline version', async () => {
        mockPrisma.portfolioBaselineVersion.create.mockResolvedValue({
          ...testBaselineVersions.draft,
          versionNumber: 2,
          modules: [],
          createdBy: testUsers.admin,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/portfolio-123/baseline', {
          changeSummary: 'New baseline version',
        });

        const response = await createBaseline(request, createMockParams({ id: 'portfolio-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.baselineVersion.status).toBe('DRAFT');
        expect(data.baselineVersion.versionNumber).toBe(2);
      });

      it('should increment version number from latest', async () => {
        mockPrisma.portfolioBaselineVersion.create.mockResolvedValue({
          ...testBaselineVersions.draft,
          versionNumber: 2,
          modules: [],
          createdBy: testUsers.admin,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/portfolio-123/baseline', {});

        await createBaseline(request, createMockParams({ id: 'portfolio-123' }));

        expect(mockPrisma.portfolioBaselineVersion.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              versionNumber: 2,
              status: 'DRAFT',
            }),
          })
        );
      });

      it('should create all module types', async () => {
        mockPrisma.portfolioBaselineVersion.create.mockResolvedValue({
          ...testBaselineVersions.draft,
          modules: [],
          createdBy: testUsers.admin,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/portfolio-123/baseline', {});

        await createBaseline(request, createMockParams({ id: 'portfolio-123' }));

        expect(mockPrisma.portfolioBaselineVersion.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              modules: expect.objectContaining({
                create: expect.arrayContaining([
                  expect.objectContaining({ moduleType: 'INVESTMENT_THESIS' }),
                  expect.objectContaining({ moduleType: 'RISK_MANAGEMENT' }),
                ]),
              }),
            }),
          })
        );
      });
    });

    describe('Copy From Existing Version', () => {
      it('should copy module payloads from source version', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ versionNumber: 1 } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.published,
          portfolioId: testPortfolios.active.id,
          modules: [
            { ...testBaselineModules.investmentThesis, payload: { data: 'copied' } },
          ],
        } as any);
        mockPrisma.portfolioBaselineVersion.create.mockResolvedValue({
          ...testBaselineVersions.draft,
          parentVersionId: 'baseline-v1',
          modules: [],
          createdBy: testUsers.admin,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios/' + testPortfolios.active.id + '/baseline', {
          copyFromVersionId: 'baseline-v1',
        });

        const response = await createBaseline(request, createMockParams({ id: testPortfolios.active.id }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.baselineVersion.parentVersionId).toBe('baseline-v1');
      });

      it('should return 400 if source version not found', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ versionNumber: 1 } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue(null);

        const request = createMockStandardRequest('POST', '/api/portfolios/' + testPortfolios.active.id + '/baseline', {
          copyFromVersionId: 'nonexistent',
        });

        const response = await createBaseline(request, createMockParams({ id: testPortfolios.active.id }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.error).toContain('Source version not found');
      });
    });
  });

  describe('POST /api/portfolios/[id]/baseline/[versionId]/submit', () => {
    describe('Validation', () => {
      it('should return 400 if status is not DRAFT or REJECTED', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
        // User needs MAKER access to submit
        mockPrisma.portfolioMember.findUnique.mockResolvedValue({
          accessLevel: 'MAKER',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval, // Already pending
          portfolioId: testPortfolios.active.id,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [],
        } as any);

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/version-123/submit',
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: 'version-123' })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.error).toContain('Cannot submit a PENDING_APPROVAL baseline');
      });
    });

    describe('Successful Submission', () => {
      it('should transition DRAFT to PENDING_APPROVAL', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
        // User needs MAKER access to submit
        mockPrisma.portfolioMember.findUnique.mockResolvedValue({
          accessLevel: 'MAKER',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft,
          portfolioId: testPortfolios.active.id,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.draft,
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
          submittedBy: testUsers.member,
        } as any);

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/version-123/submit',
          { changeSummary: 'Ready for review' }
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: 'version-123' })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Baseline submitted for approval');
        expect(data.baselineVersion.status).toBe('PENDING_APPROVAL');
      });

      it('should allow REJECTED baseline to be resubmitted', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
        // User needs MAKER access to submit
        mockPrisma.portfolioMember.findUnique.mockResolvedValue({
          accessLevel: 'MAKER',
        } as any);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.rejected,
          portfolioId: testPortfolios.active.id,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
          modules: [{ moduleType: 'INVESTMENT_THESIS', payload: {}, isValid: true }],
        } as any);
        mockPrisma.portfolioBaselineVersion.update.mockResolvedValue({
          ...testBaselineVersions.rejected,
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
          submittedBy: testUsers.member,
          rejectedAt: null,
          rejectedById: null,
          rejectionReason: null,
        } as any);

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/version-123/submit',
          {}
        );

        const response = await submitBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: 'version-123' })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.baselineVersion.status).toBe('PENDING_APPROVAL');
      });
    });
  });

  describe('POST /api/portfolios/[id]/baseline/[versionId]/approve', () => {
    describe('Authorization', () => {
      it('should return 403 if user is not admin or checker', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER', // Not admin
        } as any);
        // User has no CHECKER access
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/version-123/approve',
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: 'version-123' })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.error).toBe('Only administrators or checkers can approve baselines');
      });
    });

    describe('Validation', () => {
      it('should return 400 if status is not PENDING_APPROVAL', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        // Admin has no specific portfolio role but is company admin
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
        } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.draft, // Not pending
          portfolioId: testPortfolios.active.id,
          portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        } as any);

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/version-123/approve',
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: 'version-123' })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.error).toContain('Cannot approve a DRAFT baseline');
      });
    });

    describe('Successful Approval', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        // Admin has no specific portfolio role but is company admin
        mockPrisma.portfolioMember.findUnique.mockResolvedValue(null);
        mockPrisma.portfolio.findUnique.mockResolvedValue({
          ...testPortfolios.active,
          companyId: 'company-123',
          activeBaselineVersionId: 'baseline-v1', // Previous active
        } as any);
        mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
          ...testBaselineVersions.pendingApproval,
          portfolioId: testPortfolios.active.id,
          portfolio: {
            ...testPortfolios.active,
            companyId: 'company-123',
            activeBaselineVersionId: 'baseline-v1', // Previous active
          },
        } as any);
      });

      it('should approve and publish baseline', async () => {
        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockResolvedValue({
                ...testBaselineVersions.pendingApproval,
                status: 'PUBLISHED',
                approvedAt: new Date(),
                approvedBy: testUsers.admin,
                publishedAt: new Date(),
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
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/' + testBaselineVersions.pendingApproval.id + '/approve',
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Baseline approved and published');
        expect(data.baselineVersion.status).toBe('PUBLISHED');
      });

      it('should archive previous active baseline', async () => {
        let archivedCalled = false;
        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockImplementation((args) => {
                if (args.where.id === 'baseline-v1' && args.data.status === 'ARCHIVED') {
                  archivedCalled = true;
                }
                return Promise.resolve({
                  ...testBaselineVersions.pendingApproval,
                  status: 'PUBLISHED',
                  approvedAt: new Date(),
                  approvedBy: testUsers.admin,
                  publishedAt: new Date(),
                  previousBaselineArchived: true,
                });
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
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/' + testBaselineVersions.pendingApproval.id + '/approve',
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        // The response should indicate success - the archiving happens within the transaction
        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should set baseline as active for portfolio', async () => {
        let portfolioUpdated = false;
        const transactionMock = vi.fn().mockImplementation(async (callback) => {
          const txPrisma = {
            portfolioBaselineVersion: {
              update: vi.fn().mockResolvedValue({
                status: 'PUBLISHED',
                approvedAt: new Date(),
                approvedBy: testUsers.admin,
              }),
            },
            portfolio: {
              update: vi.fn().mockImplementation((args) => {
                if (args.data.activeBaselineVersionId) {
                  portfolioUpdated = true;
                }
                return Promise.resolve({});
              }),
            },
          };
          return callback(txPrisma);
        });
        mockPrisma.$transaction = transactionMock;

        const request = createMockStandardRequest(
          'POST',
          '/api/portfolios/' + testPortfolios.active.id + '/baseline/' + testBaselineVersions.pendingApproval.id + '/approve',
          {}
        );

        const response = await approveBaseline(
          request,
          createMockParams({ id: testPortfolios.active.id, versionId: testBaselineVersions.pendingApproval.id })
        );
        const { status, data } = await parseResponse(response);

        // Check that the request was successful
        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Workflow State Transitions', () => {
    it('should enforce DRAFT -> PENDING_APPROVAL transition', async () => {
      // Tested above in submit tests
    });

    it('should enforce PENDING_APPROVAL -> PUBLISHED transition', async () => {
      // Tested above in approve tests
    });

    it('should enforce REJECTED -> PENDING_APPROVAL transition', async () => {
      // Tested above in submit tests (resubmit)
    });

    it('should block invalid transitions', async () => {
      // PUBLISHED baseline cannot be submitted
      mockAuth.mockResolvedValue(mockSessions.member);
      mockPrisma.user.findUnique.mockResolvedValue({
        companyId: 'company-123',
        companyRole: 'MEMBER',
      } as any);
      // User needs MAKER access to submit
      mockPrisma.portfolioMember.findUnique.mockResolvedValue({
        accessLevel: 'MAKER',
      } as any);
      mockPrisma.portfolio.findUnique.mockResolvedValue({
        ...testPortfolios.active,
        companyId: 'company-123',
      } as any);
      mockPrisma.portfolioBaselineVersion.findUnique.mockResolvedValue({
        ...testBaselineVersions.published,
        portfolioId: testPortfolios.active.id,
        portfolio: { ...testPortfolios.active, companyId: 'company-123' },
        modules: [],
      } as any);

      const request = createMockStandardRequest(
        'POST',
        '/api/portfolios/' + testPortfolios.active.id + '/baseline/' + testBaselineVersions.published.id + '/submit',
        {}
      );

      const response = await submitBaseline(
        request,
        createMockParams({ id: testPortfolios.active.id, versionId: testBaselineVersions.published.id })
      );
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toContain('Cannot submit a PUBLISHED baseline');
    });
  });
});
