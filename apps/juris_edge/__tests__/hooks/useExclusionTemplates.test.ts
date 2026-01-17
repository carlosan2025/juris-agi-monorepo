/**
 * Unit Tests: useExclusionTemplates Hook Functions
 * Tests the helper functions and module exports used by the hook
 * Note: Full React hook testing requires @testing-library/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getExclusionTemplatesForIndustry,
  getExclusionGuidance,
  getAvailableDimensions,
  createExclusionFromTemplate,
  getRecommendedDefaultExclusions,
  EXCLUSION_TEMPLATES,
  type ExclusionTemplate,
} from '@/lib/baseline/exclusion-templates';

// Sample test templates that mirror real data structure
const sampleVCTemplate: ExclusionTemplate = {
  id: 'test-vc-sanctions',
  name: 'Test Sanctioned Jurisdictions',
  type: 'HARD',
  description: 'Test template for VC sanctions',
  industry: 'VENTURE_CAPITAL',
  isDefault: true,
  exclusion: {
    name: 'Sanctioned Jurisdictions',
    type: 'HARD',
    dimension: 'jurisdiction',
    operator: 'IN',
    values: ['RU', 'IR', 'KP'],
    rationale: 'Sanctions compliance test',
  },
};

const sampleConditionalTemplate: ExclusionTemplate = {
  id: 'test-vc-crypto',
  name: 'Test Cryptocurrency',
  type: 'CONDITIONAL',
  description: 'Test conditional template',
  industry: 'VENTURE_CAPITAL',
  isDefault: true,
  exclusion: {
    name: 'Cryptocurrency',
    type: 'CONDITIONAL',
    dimension: 'technology',
    operator: 'CONTAINS',
    values: ['cryptocurrency'],
    rationale: 'Regulatory uncertainty',
    condition: 'Partner approval required',
    approvalRequired: { roles: ['partner'], minApprovers: 1 },
  },
};

describe('Exclusion Templates Hook Dependencies', () => {
  describe('getExclusionTemplatesForIndustry', () => {
    it('should return templates for VENTURE_CAPITAL', () => {
      const templates = getExclusionTemplatesForIndustry('VENTURE_CAPITAL');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should return templates for INSURANCE', () => {
      const templates = getExclusionTemplatesForIndustry('INSURANCE');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('INSURANCE');
      });
    });

    it('should return templates for PHARMA', () => {
      const templates = getExclusionTemplatesForIndustry('PHARMA');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('PHARMA');
      });
    });

    it('should return empty array for unknown industry', () => {
      const templates = getExclusionTemplatesForIndustry('UNKNOWN_INDUSTRY');
      expect(templates).toEqual([]);
    });

    it('should handle generic industry mapping', () => {
      // GENERIC should fall back to VC templates
      const templates = getExclusionTemplatesForIndustry('GENERIC');
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('getExclusionGuidance', () => {
    it('should return guidance for VC industry', () => {
      const guidance = getExclusionGuidance('VC');
      expect(guidance).toBeDefined();
      expect(guidance.recommendedCount).toBeDefined();
      expect(typeof guidance.recommendedCount.default).toBe('number');
    });

    it('should return guidance for INSURANCE', () => {
      const guidance = getExclusionGuidance('INSURANCE');
      expect(guidance).toBeDefined();
      expect(guidance.recommendedCount).toBeDefined();
    });

    it('should return guidance for PHARMA', () => {
      const guidance = getExclusionGuidance('PHARMA');
      expect(guidance).toBeDefined();
      expect(guidance.recommendedCount).toBeDefined();
    });

    it('should have required guidance properties', () => {
      const guidance = getExclusionGuidance('VC');
      expect(guidance.recommendedCount).toHaveProperty('default');
      expect(guidance.recommendedCount).toHaveProperty('min');
      expect(guidance.recommendedCount).toHaveProperty('max');
      expect(guidance).toHaveProperty('exclusionPatterns');
      expect(guidance).toHaveProperty('dimensionHints');
      expect(guidance).toHaveProperty('commonExclusions');
    });

    it('should return default guidance for unknown industry', () => {
      const guidance = getExclusionGuidance('UNKNOWN');
      expect(guidance).toBeDefined();
      expect(guidance.recommendedCount).toBeDefined();
    });
  });

  describe('getAvailableDimensions', () => {
    it('should return dimensions for VC industry', () => {
      const dimensions = getAvailableDimensions('VC');
      expect(Array.isArray(dimensions)).toBe(true);
      expect(dimensions.length).toBeGreaterThan(0);
    });

    it('should return dimensions with proper structure', () => {
      const dimensions = getAvailableDimensions('VC');
      dimensions.forEach((dim) => {
        expect(dim).toHaveProperty('value');
        expect(dim).toHaveProperty('label');
        expect(dim).toHaveProperty('description');
      });
    });

    it('should include common dimensions like jurisdiction', () => {
      const dimensions = getAvailableDimensions('VC');
      const jurisdictionDim = dimensions.find((d) => d.value === 'jurisdiction');
      expect(jurisdictionDim).toBeDefined();
    });

    it('should include sector dimension', () => {
      const dimensions = getAvailableDimensions('VC');
      const sectorDim = dimensions.find((d) => d.value === 'sector');
      expect(sectorDim).toBeDefined();
    });
  });

  describe('createExclusionFromTemplate', () => {
    it('should create an exclusion item from a template', () => {
      const exclusion = createExclusionFromTemplate(sampleVCTemplate);
      expect(exclusion).toBeDefined();
      expect(exclusion.id).toBeDefined();
      expect(exclusion.name).toBe(sampleVCTemplate.exclusion.name);
      expect(exclusion.type).toBe(sampleVCTemplate.exclusion.type);
      expect(exclusion.dimension).toBe(sampleVCTemplate.exclusion.dimension);
    });

    it('should generate a unique ID', () => {
      const exclusion1 = createExclusionFromTemplate(sampleVCTemplate);
      const exclusion2 = createExclusionFromTemplate(sampleVCTemplate);
      expect(exclusion1.id).not.toBe(exclusion2.id);
    });

    it('should preserve conditional settings', () => {
      const exclusion = createExclusionFromTemplate(sampleConditionalTemplate);
      expect(exclusion.type).toBe('CONDITIONAL');
      expect(exclusion.condition).toBe(sampleConditionalTemplate.exclusion.condition);
      expect(exclusion.approvalRequired).toEqual(sampleConditionalTemplate.exclusion.approvalRequired);
    });

    it('should copy all exclusion properties', () => {
      const exclusion = createExclusionFromTemplate(sampleVCTemplate);
      expect(exclusion.operator).toBe(sampleVCTemplate.exclusion.operator);
      expect(exclusion.values).toEqual(sampleVCTemplate.exclusion.values);
      expect(exclusion.rationale).toBe(sampleVCTemplate.exclusion.rationale);
    });
  });

  describe('getRecommendedDefaultExclusions', () => {
    it('should return default exclusions for VC', () => {
      const defaults = getRecommendedDefaultExclusions('VENTURE_CAPITAL');
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should return default exclusions for INSURANCE', () => {
      const defaults = getRecommendedDefaultExclusions('INSURANCE');
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should return default exclusions for PHARMA', () => {
      const defaults = getRecommendedDefaultExclusions('PHARMA');
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should return exclusion items with IDs', () => {
      const defaults = getRecommendedDefaultExclusions('VENTURE_CAPITAL');
      defaults.forEach((excl) => {
        expect(excl.id).toBeDefined();
        expect(excl.name).toBeDefined();
        expect(excl.type).toBeDefined();
      });
    });

    it('should return empty array for unknown industry', () => {
      const defaults = getRecommendedDefaultExclusions('UNKNOWN');
      expect(defaults).toEqual([]);
    });
  });
});

describe('Template Data Validation for Hook Usage', () => {
  describe('EXCLUSION_TEMPLATES structure', () => {
    it('should have templates for all supported industries', () => {
      const vcTemplates = EXCLUSION_TEMPLATES.filter((t) => t.industry === 'VENTURE_CAPITAL');
      const insuranceTemplates = EXCLUSION_TEMPLATES.filter((t) => t.industry === 'INSURANCE');
      const pharmaTemplates = EXCLUSION_TEMPLATES.filter((t) => t.industry === 'PHARMA');

      expect(vcTemplates.length).toBeGreaterThan(0);
      expect(insuranceTemplates.length).toBeGreaterThan(0);
      expect(pharmaTemplates.length).toBeGreaterThan(0);
    });

    it('should have both HARD and CONDITIONAL types', () => {
      const hardTemplates = EXCLUSION_TEMPLATES.filter((t) => t.type === 'HARD');
      const conditionalTemplates = EXCLUSION_TEMPLATES.filter((t) => t.type === 'CONDITIONAL');

      expect(hardTemplates.length).toBeGreaterThan(0);
      expect(conditionalTemplates.length).toBeGreaterThan(0);
    });

    it('should have some default templates', () => {
      const defaultTemplates = EXCLUSION_TEMPLATES.filter((t) => t.isDefault);
      expect(defaultTemplates.length).toBeGreaterThan(0);
    });

    it('all templates should have required fields', () => {
      EXCLUSION_TEMPLATES.forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.type).toMatch(/^(HARD|CONDITIONAL)$/);
        expect(template.description).toBeDefined();
        expect(template.industry).toBeDefined();
        expect(typeof template.isDefault).toBe('boolean');
        expect(template.exclusion).toBeDefined();
      });
    });

    it('all template exclusions should have required fields', () => {
      EXCLUSION_TEMPLATES.forEach((template) => {
        const { exclusion } = template;
        expect(exclusion.name).toBeDefined();
        expect(exclusion.type).toMatch(/^(HARD|CONDITIONAL)$/);
        expect(exclusion.dimension).toBeDefined();
        expect(exclusion.operator).toBeDefined();
        expect(Array.isArray(exclusion.values)).toBe(true);
        expect(exclusion.rationale).toBeDefined();
      });
    });
  });

  describe('Template filtering logic', () => {
    it('should support filtering by type HARD', () => {
      const allTemplates = getExclusionTemplatesForIndustry('VENTURE_CAPITAL');
      const hardOnly = allTemplates.filter((t) => t.type === 'HARD');
      expect(hardOnly.every((t) => t.type === 'HARD')).toBe(true);
    });

    it('should support filtering by type CONDITIONAL', () => {
      const allTemplates = getExclusionTemplatesForIndustry('VENTURE_CAPITAL');
      const conditionalOnly = allTemplates.filter((t) => t.type === 'CONDITIONAL');
      expect(conditionalOnly.every((t) => t.type === 'CONDITIONAL')).toBe(true);
    });

    it('should support filtering defaults only', () => {
      const allTemplates = getExclusionTemplatesForIndustry('VENTURE_CAPITAL');
      const defaultsOnly = allTemplates.filter((t) => t.isDefault);
      expect(defaultsOnly.every((t) => t.isDefault === true)).toBe(true);
    });
  });
});

describe('Hook Interface Contract Tests', () => {
  /**
   * These tests verify the contract that the hook expects from its dependencies.
   * They ensure the underlying functions return the correct shapes for the hook.
   */

  it('getExclusionTemplatesForIndustry returns ExclusionTemplate[]', () => {
    const result = getExclusionTemplatesForIndustry('VC');
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const template = result[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('industry');
      expect(template).toHaveProperty('isDefault');
      expect(template).toHaveProperty('exclusion');
    }
  });

  it('getExclusionGuidance returns IndustryExclusionGuidance', () => {
    const result = getExclusionGuidance('VC');
    expect(result).toHaveProperty('recommendedCount');
    expect(result).toHaveProperty('exclusionPatterns');
    expect(result).toHaveProperty('dimensionHints');
    expect(result).toHaveProperty('commonExclusions');
  });

  it('getAvailableDimensions returns dimension options', () => {
    const result = getAvailableDimensions('VC');
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const dimension = result[0];
      expect(dimension).toHaveProperty('value');
      expect(dimension).toHaveProperty('label');
      expect(dimension).toHaveProperty('description');
    }
  });

  it('createExclusionFromTemplate returns ExclusionItem', () => {
    const template = EXCLUSION_TEMPLATES[0];
    const result = createExclusionFromTemplate(template);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('dimension');
    expect(result).toHaveProperty('operator');
    expect(result).toHaveProperty('values');
  });

  it('getRecommendedDefaultExclusions returns ExclusionItem[]', () => {
    const result = getRecommendedDefaultExclusions('VENTURE_CAPITAL');
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const exclusion = result[0];
      expect(exclusion).toHaveProperty('id');
      expect(exclusion).toHaveProperty('name');
      expect(exclusion).toHaveProperty('type');
    }
  });
});
