/**
 * Unit Tests: /api/mandate-templates
 * Tests mandate template GET and POST endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse } from '../../helpers/testHelpers';
import { testUsers, testMandateTemplates } from '../../fixtures/testData';

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
    mandateTemplate: {
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
import { GET, POST } from '@/app/api/mandate-templates/route';
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
  mandateAdmin: {
    user: { id: 'user-mandate-admin-123', email: 'mandateadmin@testcompany.com' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

describe('/api/mandate-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/mandate-templates', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest('GET', '/api/mandate-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Successful Requests', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
        } as any);
      });

      it('should return system and company templates by default', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
          testMandateTemplates.companyCustom,
        ] as any);

        const request = createMockStandardRequest('GET', '/api/mandate-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.templates).toHaveLength(2);
      });

      it('should filter by industry when provided', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/mandate-templates?industry=VENTURE_CAPITAL'
        );

        await GET(request);

        expect(mockPrisma.mandateTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              industry: 'VENTURE_CAPITAL',
            }),
          })
        );
      });

      it('should map short industry name VC to VENTURE_CAPITAL', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/mandate-templates?industry=VC'
        );

        await GET(request);

        expect(mockPrisma.mandateTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              industry: 'VENTURE_CAPITAL',
            }),
          })
        );
      });

      it('should filter by type when provided', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/mandate-templates?type=PRIMARY'
        );

        await GET(request);

        expect(mockPrisma.mandateTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: 'PRIMARY',
            }),
          })
        );
      });

      it('should return only system templates when includeCompany=false', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
        ] as any);

        const request = createMockStandardRequest(
          'GET',
          '/api/mandate-templates?includeCompany=false'
        );

        await GET(request);

        expect(mockPrisma.mandateTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isSystem: true,
            }),
          })
        );
      });

      it('should return warning for unknown industry', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/mandate-templates?industry=UNKNOWN'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.templates).toHaveLength(0);
        expect(data.warning).toContain('Unknown industry');
      });

      it('should return template fields correctly', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([
          testMandateTemplates.systemVC,
        ] as any);

        const request = createMockStandardRequest('GET', '/api/mandate-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        const template = data.templates[0];
        expect(template.name).toBe('VC Primary Fund Template');
        expect(template.type).toBe('PRIMARY');
        expect(template.industry).toBe('VENTURE_CAPITAL');
        expect(template.isDefault).toBe(true);
        expect(template.isSystem).toBe(true);
        expect(template.mandateData).toBeDefined();
      });

      it('should order by isDefault descending, then type, then name', async () => {
        mockPrisma.mandateTemplate.findMany.mockResolvedValue([]);

        const request = createMockStandardRequest('GET', '/api/mandate-templates');

        await GET(request);

        expect(mockPrisma.mandateTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [
              { isDefault: 'desc' },
              { type: 'asc' },
              { name: 'asc' },
            ],
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
        } as any);
        mockPrisma.mandateTemplate.findMany.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest('GET', '/api/mandate-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch mandate templates');
      });
    });
  });

  describe('POST /api/mandate-templates', () => {
    describe('Authentication', () => {
      it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Authorization', () => {
      it('should return 403 if user has no company', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: null,
          companyRole: 'MEMBER',
        } as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('No company associated with user');
      });

      it('should return 403 if user is not admin', async () => {
        mockAuth.mockResolvedValue(mockSessions.member);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MEMBER', // Not admin
        } as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Only admins can create templates');
      });

      it('should allow OWNER to create templates', async () => {
        mockAuth.mockResolvedValue(mockSessions.owner);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'OWNER',
        } as any);
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'PRIMARY',
          description: 'Test description',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should allow ORG_ADMIN to create templates', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'PRIMARY',
          description: 'Test description',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should allow MANDATE_ADMIN to create templates', async () => {
        mockAuth.mockResolvedValue(mockSessions.mandateAdmin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'MANDATE_ADMIN',
        } as any);
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'PRIMARY',
          description: 'Test description',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
      });

      it('should return 400 if required fields are missing', async () => {
        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          // Missing type, description, industry, mandateData
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Missing required fields');
      });

      it('should return 400 for invalid type', async () => {
        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'INVALID',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid type');
      });

      it('should accept PRIMARY type', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should accept THEMATIC type', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'THEMATIC',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should accept CARVEOUT type', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'CARVEOUT',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      });

      it('should return 400 for invalid industry', async () => {
        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'New Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'INVALID_INDUSTRY',
          mandateData: {},
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid industry profile');
      });
    });

    describe('Successful Creation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
      });

      it('should create company template with provided data', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue({
          ...testMandateTemplates.companyCustom,
          name: 'Custom Template',
        } as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'Custom Template',
          type: 'THEMATIC',
          description: 'A custom template',
          industry: 'VENTURE_CAPITAL',
          mandateData: { custom: 'data' },
          category: 'Thematic',
          tags: ['AI', 'custom'],
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.template.name).toBe('Custom Template');
      });

      it('should set isSystem and isDefault to false for company templates', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'Custom Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        await POST(request);

        expect(mockPrisma.mandateTemplate.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isSystem: false,
              isDefault: false,
            }),
          })
        );
      });

      it('should associate template with user company', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'Custom Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        await POST(request);

        expect(mockPrisma.mandateTemplate.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              companyId: 'company-123',
            }),
          })
        );
      });

      it('should track createdById', async () => {
        mockPrisma.mandateTemplate.create.mockResolvedValue(testMandateTemplates.companyCustom as any);

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'Custom Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        await POST(request);

        expect(mockPrisma.mandateTemplate.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              createdById: expect.any(String),
            }),
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockAuth.mockResolvedValue(mockSessions.admin);
        mockPrisma.user.findUnique.mockResolvedValue({
          companyId: 'company-123',
          companyRole: 'ORG_ADMIN',
        } as any);
        mockPrisma.mandateTemplate.create.mockRejectedValue(new Error('Database error'));

        const request = createMockStandardRequest('POST', '/api/mandate-templates', {
          name: 'Custom Template',
          type: 'PRIMARY',
          description: 'Test',
          industry: 'VENTURE_CAPITAL',
          mandateData: {},
        });

        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create mandate template');
      });
    });
  });
});
