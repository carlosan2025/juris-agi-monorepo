/**
 * Unit Tests: /api/companies/[id]
 * Tests company GET and PATCH endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse, createMockParams } from '../../helpers/testHelpers';
import { testCompanies } from '../../fixtures/testData';

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
      update: vi.fn(),
    },
  });
  return { default: mockFn() };
});

// Import after mocks
import { GET, PATCH } from '@/app/api/companies/[id]/route';
import prisma from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);

describe('/api/companies/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/companies/[id]', () => {
    describe('Successful Requests', () => {
      it('should return company details with counts', async () => {
        const companyWithCounts = {
          ...testCompanies.primary,
          _count: {
            users: 10,
            portfolios: 5,
            mandates: 3,
          },
        };
        mockPrisma.company.findUnique.mockResolvedValue(companyWithCounts as any);

        const request = createMockStandardRequest('GET', '/api/companies/company-123');

        const response = await GET(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.company.id).toBe('company-123');
        expect(data.company.name).toBe('Test Company');
        expect(data.company.industryProfile).toBe('VENTURE_CAPITAL');
        expect(data.company.counts).toEqual({
          users: 10,
          portfolios: 5,
          mandates: 3,
        });
      });

      it('should return all company fields', async () => {
        const fullCompany = {
          ...testCompanies.primary,
          logoUrl: 'https://example.com/logo.png',
          domain: 'testcompany.com',
          timezone: 'America/New_York',
          currency: 'USD',
          _count: { users: 1, portfolios: 1, mandates: 1 },
        };
        mockPrisma.company.findUnique.mockResolvedValue(fullCompany as any);

        const request = createMockStandardRequest('GET', '/api/companies/company-123');

        const response = await GET(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.logoUrl).toBe('https://example.com/logo.png');
        expect(data.company.domain).toBe('testcompany.com');
        expect(data.company.timezone).toBe('America/New_York');
        expect(data.company.currency).toBe('USD');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 if company not found', async () => {
        mockPrisma.company.findUnique.mockResolvedValue(null);

        const request = createMockStandardRequest('GET', '/api/companies/nonexistent');

        const response = await GET(request, createMockParams({ id: 'nonexistent' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Company not found');
      });

      it('should return 500 on database error', async () => {
        mockPrisma.company.findUnique.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest('GET', '/api/companies/company-123');

        const response = await GET(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch company');
      });
    });
  });

  describe('PATCH /api/companies/[id]', () => {
    describe('Successful Updates', () => {
      it('should update company name', async () => {
        const updatedCompany = {
          ...testCompanies.primary,
          name: 'Updated Company Name',
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          name: 'Updated Company Name',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.company.name).toBe('Updated Company Name');
      });

      it('should update industry profile', async () => {
        const updatedCompany = {
          ...testCompanies.primary,
          industryProfile: 'INSURANCE',
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'INSURANCE',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.industryProfile).toBe('INSURANCE');
      });

      it('should update settings', async () => {
        const newSettings = { feature1: true, feature2: 'value' };
        const updatedCompany = {
          ...testCompanies.primary,
          settings: newSettings,
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          settings: newSettings,
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.settings).toEqual(newSettings);
      });

      it('should update multiple fields at once', async () => {
        const updatedCompany = {
          ...testCompanies.primary,
          name: 'New Name',
          timezone: 'Europe/London',
          currency: 'GBP',
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          name: 'New Name',
          timezone: 'Europe/London',
          currency: 'GBP',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.name).toBe('New Name');
        expect(data.company.timezone).toBe('Europe/London');
        expect(data.company.currency).toBe('GBP');
      });

      it('should update logoUrl', async () => {
        const updatedCompany = {
          ...testCompanies.primary,
          logoUrl: 'https://newlogo.com/logo.png',
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          logoUrl: 'https://newlogo.com/logo.png',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.logoUrl).toBe('https://newlogo.com/logo.png');
      });

      it('should update domain', async () => {
        const updatedCompany = {
          ...testCompanies.primary,
          domain: 'newdomain.com',
        };
        mockPrisma.company.update.mockResolvedValue(updatedCompany as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          domain: 'newdomain.com',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.company.domain).toBe('newdomain.com');
      });
    });

    describe('Validation', () => {
      it('should return 400 for invalid industry profile', async () => {
        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'INVALID_PROFILE',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid industry profile');
      });

      it('should accept VENTURE_CAPITAL as valid profile', async () => {
        mockPrisma.company.update.mockResolvedValue({
          ...testCompanies.primary,
          industryProfile: 'VENTURE_CAPITAL',
        } as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'VENTURE_CAPITAL',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should accept INSURANCE as valid profile', async () => {
        mockPrisma.company.update.mockResolvedValue({
          ...testCompanies.insurance,
        } as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'INSURANCE',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should accept PHARMA as valid profile', async () => {
        mockPrisma.company.update.mockResolvedValue({
          ...testCompanies.pharma,
        } as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'PHARMA',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should accept GENERIC as valid profile', async () => {
        mockPrisma.company.update.mockResolvedValue({
          ...testCompanies.other,
        } as any);

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          industryProfile: 'GENERIC',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockPrisma.company.update.mockRejectedValue(new Error('Update failed'));

        const request = createMockStandardRequest('PATCH', '/api/companies/company-123', {
          name: 'New Name',
        });

        const response = await PATCH(request, createMockParams({ id: 'company-123' }));
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to update company');
        expect(data.details).toBeDefined();
      });
    });
  });
});
