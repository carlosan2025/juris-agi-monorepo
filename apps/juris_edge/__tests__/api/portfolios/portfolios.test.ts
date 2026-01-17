/**
 * Unit Tests: /api/portfolios
 * Tests portfolio GET and POST endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse } from '../../helpers/testHelpers';
import { testUsers, testCompanies, testPortfolios, testMandates } from '../../fixtures/testData';

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
  });
  return { default: mockFn() };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Import after mocks
import { GET, POST } from '@/app/api/portfolios/route';
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

describe('/api/portfolios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/portfolios', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
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
        mockAuth.mockResolvedValue(mockSessions.admin);

        const request = createMockStandardRequest('GET', '/api/portfolios');

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
          companyId: 'different-company',
          companyRole: 'MEMBER',
        } as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Access denied');
      });
    });

    describe('Successful Requests - Admin', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
      });

      it('should return all portfolios for admin', async () => {
        const portfolios = [
          { ...testPortfolios.active, mandate: testMandates.primary },
          { ...testPortfolios.draft, mandate: null },
        ];
        mockPrisma.portfolio.findMany.mockResolvedValue(portfolios as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.portfolios).toHaveLength(2);
      });

      it('should set userAccessLevel to ADMIN for admin users', async () => {
        mockPrisma.portfolio.findMany.mockResolvedValue([
          { ...testPortfolios.active, mandate: null },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.portfolios[0].userAccessLevel).toBe('ADMIN');
      });

      it('should filter by mandateId when provided', async () => {
        mockPrisma.portfolio.findMany.mockResolvedValue([
          { ...testPortfolios.active, mandate: testMandates.primary },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123&mandateId=mandate-123'
        );

        await GET(request);

        expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              mandateId: 'mandate-123',
            }),
          })
        );
      });
    });

    describe('Successful Requests - Non-Admin', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER',
        } as any);
      });

      it('should only return portfolios where user is a member', async () => {
        mockPrisma.portfolio.findMany.mockResolvedValue([
          {
            ...testPortfolios.active,
            mandate: null,
            members: [{ accessLevel: 'MAKER' }],
          },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        await GET(request);

        expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              members: {
                some: {
                  userId: expect.any(String),
                },
              },
            }),
          })
        );
      });

      it('should return user access level from membership', async () => {
        mockPrisma.portfolio.findMany.mockResolvedValue([
          {
            ...testPortfolios.active,
            mandate: null,
            members: [{ accessLevel: 'CHECKER' }],
          },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.portfolios[0].userAccessLevel).toBe('CHECKER');
      });
    });

    describe('Response Transformation', () => {
      it('should transform portfolio data correctly', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'OWNER',
        } as any);
        mockPrisma.portfolio.findMany.mockResolvedValue([
          { ...testPortfolios.active, mandate: testMandates.primary },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        const portfolio = data.portfolios[0];

        expect(portfolio.id).toBe('portfolio-active-123');
        expect(portfolio.name).toBe('Active Portfolio');
        expect(portfolio.type).toBe('fund'); // Lowercased
        expect(portfolio.status).toBe('active'); // Lowercased
        expect(portfolio.constraints).toBeDefined();
        expect(portfolio.composition).toBeDefined();
        expect(portfolio.metrics).toBeDefined();
        expect(portfolio.mandate).toBeDefined();
      });

      it('should provide default values for missing constraints', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'OWNER',
        } as any);
        mockPrisma.portfolio.findMany.mockResolvedValue([
          { ...testPortfolios.draft, constraints: {}, mandate: null },
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        const portfolio = data.portfolios[0];
        expect(portfolio.constraints.maxPositions).toBe(50);
        expect(portfolio.constraints.maxSinglePositionPct).toBe(20);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'OWNER',
        } as any);
        mockPrisma.portfolio.findMany.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest(
          'GET',
          '/api/portfolios?companyId=company-123'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch portfolios');
      });
    });
  });

  describe('POST /api/portfolios', () => {
    describe('Validation', () => {
      it('should return 400 if companyId is missing', async () => {
        const request = createMockStandardRequest('POST', '/api/portfolios', {
          name: 'New Portfolio',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('companyId is required');
      });

      it('should return 400 if name is missing', async () => {
        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('name is required');
      });

      it('should return 400 if name is empty', async () => {
        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: '   ',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('name is required');
      });
    });

    describe('Successful Creation', () => {
      it('should create portfolio with provided data', async () => {
        const newPortfolio = {
          ...testPortfolios.active,
          id: 'new-portfolio-id',
          name: 'New Portfolio',
          mandate: testMandates.primary,
        };
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockResolvedValue(newPortfolio as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'New Portfolio',
          description: 'A new test portfolio',
          mandateId: 'mandate-123',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.portfolio.name).toBe('New Portfolio');
      });

      it('should default portfolio type based on company industry - VC', async () => {
        mockPrisma.company.findUnique.mockResolvedValue({
          ...testCompanies.primary,
          industryProfile: 'VENTURE_CAPITAL',
        } as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          portfolioType: 'FUND',
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'VC Fund',
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              portfolioType: 'FUND',
            }),
          })
        );
      });

      it('should default portfolio type based on company industry - Insurance', async () => {
        mockPrisma.company.findUnique.mockResolvedValue({
          ...testCompanies.insurance,
          industryProfile: 'INSURANCE',
        } as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          portfolioType: 'BOOK',
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-insurance',
          name: 'Insurance Book',
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              portfolioType: 'BOOK',
            }),
          })
        );
      });

      it('should default portfolio type based on company industry - Pharma', async () => {
        mockPrisma.company.findUnique.mockResolvedValue({
          ...testCompanies.pharma,
          industryProfile: 'PHARMA',
        } as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          portfolioType: 'PIPELINE',
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-pharma',
          name: 'Drug Pipeline',
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              portfolioType: 'PIPELINE',
            }),
          })
        );
      });

      it('should use explicit portfolioType if provided', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          portfolioType: 'BOOK',
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'Test Portfolio',
          portfolioType: 'book',
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              portfolioType: 'BOOK',
            }),
          })
        );
      });

      it('should calculate utilization from aumCurrent and aumTarget', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'Test Portfolio',
          aumCurrent: 5000000,
          aumTarget: 10000000,
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              metrics: expect.objectContaining({
                utilization: 0.5,
              }),
            }),
          })
        );
      });

      it('should store optional fields in constraints', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'Test Portfolio',
          code: 'FUND-001',
          jurisdiction: 'US',
          timezone: 'America/New_York',
          tags: ['growth', 'tech'],
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              constraints: expect.objectContaining({
                code: 'FUND-001',
                jurisdiction: 'US',
                timezone: 'America/New_York',
                tags: ['growth', 'tech'],
              }),
            }),
          })
        );
      });

      it('should set status to ACTIVE by default', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockResolvedValue({
          ...testPortfolios.active,
          status: 'ACTIVE',
          mandate: null,
        } as any);

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'Test Portfolio',
        });

        await POST(request);

        expect(mockPrisma.portfolio.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'ACTIVE',
            }),
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(testCompanies.primary as any);
        mockPrisma.portfolio.create.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest('POST', '/api/portfolios', {
          companyId: 'company-123',
          name: 'Test Portfolio',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create portfolio');
        expect(data.details).toBeDefined();
      });
    });
  });
});
