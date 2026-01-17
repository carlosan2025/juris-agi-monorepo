/**
 * Unit Tests: /api/risk-appetite-templates
 * Tests risk appetite template GET endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStandardRequest, parseResponse } from '../../helpers/testHelpers';

// Mock the risk-appetite-templates library
vi.mock('@/lib/baseline/risk-appetite-templates', () => {
  const mockTemplates = [
    {
      id: 'vc-conservative',
      name: 'VC – Conservative Seed Fund',
      description: 'Lower-risk profile suitable for conservative seed-stage funds',
      industry: 'VENTURE_CAPITAL',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: { name: 'Standard Risk Framework', scale: { type: 'numeric_0_1', min: 0, max: 1 } },
        dimensions: [],
        portfolioConstraints: [],
        breachPolicy: { onHardBreach: 'block_and_escalate', onSoftBreach: 'warn_and_log' },
      },
    },
    {
      id: 'vc-balanced',
      name: 'VC – Balanced Core Fund',
      description: 'Balanced risk profile for diversified VC funds',
      industry: 'VENTURE_CAPITAL',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: { name: 'Standard Risk Framework', scale: { type: 'numeric_0_1', min: 0, max: 1 } },
        dimensions: [],
        portfolioConstraints: [],
        breachPolicy: { onHardBreach: 'block_and_escalate', onSoftBreach: 'warn_and_log' },
      },
    },
    {
      id: 'ins-conservative',
      name: 'Insurance – Conservative Core',
      description: 'Low-risk profile suitable for conservative insurance portfolios',
      industry: 'INSURANCE',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: { name: 'Standard Risk Framework', scale: { type: 'numeric_0_1', min: 0, max: 1 } },
        dimensions: [],
        portfolioConstraints: [],
        breachPolicy: { onHardBreach: 'block_and_escalate', onSoftBreach: 'warn_and_log' },
      },
    },
    {
      id: 'pharma-balanced',
      name: 'Pharma – Balanced Pipeline',
      description: 'Balanced risk profile for diversified pharmaceutical portfolios',
      industry: 'PHARMA',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: { name: 'Standard Risk Framework', scale: { type: 'numeric_0_1', min: 0, max: 1 } },
        dimensions: [],
        portfolioConstraints: [],
        breachPolicy: { onHardBreach: 'block_and_escalate', onSoftBreach: 'warn_and_log' },
      },
    },
  ];

  return {
    getAllTemplates: vi.fn(() => mockTemplates),
    getTemplatesForIndustry: vi.fn((industry: string) =>
      mockTemplates.filter(t => t.industry === industry)
    ),
    getTemplateById: vi.fn((id: string) =>
      mockTemplates.find(t => t.id === id) || null
    ),
    getDefaultTemplate: vi.fn((industry: string) =>
      mockTemplates.find(t => t.industry === industry && t.isDefault) || null
    ),
  };
});

// Import after mocks
import { GET } from '@/app/api/risk-appetite-templates/route';
import { GET as GET_BY_ID } from '@/app/api/risk-appetite-templates/[id]/route';
import {
  getAllTemplates,
  getTemplatesForIndustry,
  getTemplateById,
} from '@/lib/baseline/risk-appetite-templates';

describe('/api/risk-appetite-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/risk-appetite-templates', () => {
    describe('Successful Requests', () => {
      it('should return all templates when no industry filter provided', async () => {
        const request = createMockStandardRequest('GET', '/api/risk-appetite-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.templates).toHaveLength(4);
        expect(data.count).toBe(4);
        expect(data.industry).toBeNull();
        expect(getAllTemplates).toHaveBeenCalled();
      });

      it('should filter templates by industry', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=VENTURE_CAPITAL'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.templates.every((t: { industry: string }) => t.industry === 'VENTURE_CAPITAL')).toBe(true);
        expect(data.industry).toBe('VENTURE_CAPITAL');
        expect(getTemplatesForIndustry).toHaveBeenCalledWith('VENTURE_CAPITAL');
      });

      it('should normalize industry code VC to VENTURE_CAPITAL', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=VC'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.industry).toBe('VENTURE_CAPITAL');
        expect(getTemplatesForIndustry).toHaveBeenCalledWith('VENTURE_CAPITAL');
      });

      it('should normalize industry code INS to INSURANCE', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=INS'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.industry).toBe('INSURANCE');
        expect(getTemplatesForIndustry).toHaveBeenCalledWith('INSURANCE');
      });

      it('should handle case-insensitive industry codes', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=vc'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.industry).toBe('VENTURE_CAPITAL');
      });

      it('should handle PHARMA industry', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=PHARMA'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.industry).toBe('PHARMA');
        expect(getTemplatesForIndustry).toHaveBeenCalledWith('PHARMA');
      });

      it('should include proper template fields in response', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=VENTURE_CAPITAL'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        const template = data.templates[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('industry');
        expect(template).toHaveProperty('isDefault');
        expect(template).toHaveProperty('riskAppetiteData');
        expect(template).toHaveProperty('source', 'file');
      });

      it('should return empty array for unknown industry', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=UNKNOWN_INDUSTRY'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.templates).toHaveLength(0);
      });

      it('should accept includeCompany parameter (for future use)', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=VC&includeCompany=true'
        );

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Response Format', () => {
      it('should return success true with templates array', async () => {
        const request = createMockStandardRequest('GET', '/api/risk-appetite-templates');

        const response = await GET(request);
        const { data } = await parseResponse(response);

        expect(data).toMatchObject({
          success: true,
          templates: expect.any(Array),
          count: expect.any(Number),
        });
      });

      it('should transform riskAppetite to riskAppetiteData in response', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates?industry=VENTURE_CAPITAL'
        );

        const response = await GET(request);
        const { data } = await parseResponse(response);

        const template = data.templates[0];
        expect(template).toHaveProperty('riskAppetiteData');
        expect(template).not.toHaveProperty('riskAppetite');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on unexpected error', async () => {
        // Make the mock throw an error
        vi.mocked(getAllTemplates).mockImplementationOnce(() => {
          throw new Error('Unexpected error');
        });

        const request = createMockStandardRequest('GET', '/api/risk-appetite-templates');

        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch templates');
        expect(data.message).toBe('Unexpected error');
      });
    });
  });
});

describe('/api/risk-appetite-templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/risk-appetite-templates/[id]', () => {
    describe('Successful Requests', () => {
      it('should return template by ID', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/vc-balanced'
        );
        const params = Promise.resolve({ id: 'vc-balanced' });

        const response = await GET_BY_ID(request, { params });
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.template).toBeDefined();
        expect(data.template.id).toBe('vc-balanced');
        expect(data.template.name).toBe('VC – Balanced Core Fund');
        expect(getTemplateById).toHaveBeenCalledWith('vc-balanced');
      });

      it('should include proper fields in single template response', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/vc-conservative'
        );
        const params = Promise.resolve({ id: 'vc-conservative' });

        const response = await GET_BY_ID(request, { params });
        const { status, data } = await parseResponse(response);

        expect(status).toBe(200);
        expect(data.template).toHaveProperty('id');
        expect(data.template).toHaveProperty('name');
        expect(data.template).toHaveProperty('description');
        expect(data.template).toHaveProperty('industry');
        expect(data.template).toHaveProperty('isDefault');
        expect(data.template).toHaveProperty('riskAppetiteData');
        expect(data.template).toHaveProperty('source', 'file');
      });

      it('should transform riskAppetite to riskAppetiteData', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/ins-conservative'
        );
        const params = Promise.resolve({ id: 'ins-conservative' });

        const response = await GET_BY_ID(request, { params });
        const { data } = await parseResponse(response);

        expect(data.template).toHaveProperty('riskAppetiteData');
        expect(data.template).not.toHaveProperty('riskAppetite');
      });
    });

    describe('Not Found', () => {
      it('should return 404 for non-existent template', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/non-existent'
        );
        const params = Promise.resolve({ id: 'non-existent' });

        const response = await GET_BY_ID(request, { params });
        const { status, data } = await parseResponse(response);

        expect(status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Template not found');
      });
    });

    describe('Validation', () => {
      it('should return 400 for missing ID', async () => {
        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/'
        );
        const params = Promise.resolve({ id: '' });

        const response = await GET_BY_ID(request, { params });
        const { status, data } = await parseResponse(response);

        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Template ID is required');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on unexpected error', async () => {
        vi.mocked(getTemplateById).mockImplementationOnce(() => {
          throw new Error('Database error');
        });

        const request = createMockStandardRequest(
          'GET',
          '/api/risk-appetite-templates/vc-balanced'
        );
        const params = Promise.resolve({ id: 'vc-balanced' });

        const response = await GET_BY_ID(request, { params });
        const { status, data } = await parseResponse(response);

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch template');
        expect(data.message).toBe('Database error');
      });
    });
  });
});
