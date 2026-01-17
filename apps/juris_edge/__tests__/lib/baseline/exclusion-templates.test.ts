/**
 * Unit Tests: Exclusion Templates Library
 * Tests the exclusion templates, guidance, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  EXCLUSION_TYPE_INFO,
  EXCLUSION_OPERATOR_INFO,
  INDUSTRY_EXCLUSION_GUIDANCE,
  EXCLUSION_TEMPLATES,
  getExclusionTemplatesForIndustry,
  getExclusionGuidance,
  createExclusionFromTemplate,
  getRecommendedDefaultExclusions,
  getAvailableDimensions,
  type ExclusionTemplate,
} from '@/lib/baseline/exclusion-templates';
import type { ExclusionType, ExclusionOperator } from '@/lib/baseline/types';

describe('Exclusion Templates Library', () => {
  // =============================================================================
  // EXCLUSION_TYPE_INFO
  // =============================================================================
  describe('EXCLUSION_TYPE_INFO', () => {
    it('should define info for HARD type', () => {
      expect(EXCLUSION_TYPE_INFO.HARD).toBeDefined();
      expect(EXCLUSION_TYPE_INFO.HARD.label).toBe('Hard');
      expect(EXCLUSION_TYPE_INFO.HARD.description).toContain('Cannot proceed');
      expect(EXCLUSION_TYPE_INFO.HARD.icon).toBe('Ban');
      expect(EXCLUSION_TYPE_INFO.HARD.color).toContain('red');
    });

    it('should define info for CONDITIONAL type', () => {
      expect(EXCLUSION_TYPE_INFO.CONDITIONAL).toBeDefined();
      expect(EXCLUSION_TYPE_INFO.CONDITIONAL.label).toBe('Conditional');
      expect(EXCLUSION_TYPE_INFO.CONDITIONAL.description).toContain('condition');
      expect(EXCLUSION_TYPE_INFO.CONDITIONAL.icon).toBe('AlertTriangle');
      expect(EXCLUSION_TYPE_INFO.CONDITIONAL.color).toContain('amber');
    });

    it('should cover all ExclusionType values', () => {
      const types: ExclusionType[] = ['HARD', 'CONDITIONAL'];
      types.forEach((type) => {
        expect(EXCLUSION_TYPE_INFO[type]).toBeDefined();
        expect(EXCLUSION_TYPE_INFO[type].label).toBeTruthy();
        expect(EXCLUSION_TYPE_INFO[type].description).toBeTruthy();
      });
    });
  });

  // =============================================================================
  // EXCLUSION_OPERATOR_INFO
  // =============================================================================
  describe('EXCLUSION_OPERATOR_INFO', () => {
    it('should define all operators', () => {
      const expectedOperators: ExclusionOperator[] = [
        'EQUALS',
        'NOT_EQUALS',
        'CONTAINS',
        'NOT_CONTAINS',
        'GREATER_THAN',
        'LESS_THAN',
        'IN',
        'NOT_IN',
        'MATCHES_REGEX',
        'IS_TRUE',
        'IS_FALSE',
      ];

      expectedOperators.forEach((op) => {
        expect(EXCLUSION_OPERATOR_INFO[op]).toBeDefined();
        expect(EXCLUSION_OPERATOR_INFO[op].label).toBeTruthy();
        expect(EXCLUSION_OPERATOR_INFO[op].description).toBeTruthy();
        expect(EXCLUSION_OPERATOR_INFO[op].example).toBeTruthy();
        expect(EXCLUSION_OPERATOR_INFO[op].valueType).toMatch(/^(single|multiple|none|numeric)$/);
      });
    });

    it('should have correct valueType for numeric operators', () => {
      expect(EXCLUSION_OPERATOR_INFO.GREATER_THAN.valueType).toBe('numeric');
      expect(EXCLUSION_OPERATOR_INFO.LESS_THAN.valueType).toBe('numeric');
    });

    it('should have correct valueType for list operators', () => {
      expect(EXCLUSION_OPERATOR_INFO.IN.valueType).toBe('multiple');
      expect(EXCLUSION_OPERATOR_INFO.NOT_IN.valueType).toBe('multiple');
    });

    it('should have correct valueType for boolean operators', () => {
      expect(EXCLUSION_OPERATOR_INFO.IS_TRUE.valueType).toBe('none');
      expect(EXCLUSION_OPERATOR_INFO.IS_FALSE.valueType).toBe('none');
    });

    it('should have correct valueType for single-value operators', () => {
      expect(EXCLUSION_OPERATOR_INFO.EQUALS.valueType).toBe('single');
      expect(EXCLUSION_OPERATOR_INFO.NOT_EQUALS.valueType).toBe('single');
      expect(EXCLUSION_OPERATOR_INFO.CONTAINS.valueType).toBe('single');
    });
  });

  // =============================================================================
  // INDUSTRY_EXCLUSION_GUIDANCE
  // =============================================================================
  describe('INDUSTRY_EXCLUSION_GUIDANCE', () => {
    const industries = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'];

    industries.forEach((industry) => {
      describe(`${industry} guidance`, () => {
        it('should have recommendedCount with all required fields', () => {
          const guidance = INDUSTRY_EXCLUSION_GUIDANCE[industry];
          expect(guidance.recommendedCount).toBeDefined();
          expect(guidance.recommendedCount.default).toBeGreaterThan(0);
          expect(guidance.recommendedCount.min).toBeGreaterThan(0);
          expect(guidance.recommendedCount.max).toBeGreaterThan(guidance.recommendedCount.min);
          expect(guidance.recommendedCount.typical).toBeTruthy();
          expect(guidance.recommendedCount.complex).toBeTruthy();
        });

        it('should have exclusionPatterns', () => {
          const guidance = INDUSTRY_EXCLUSION_GUIDANCE[industry];
          expect(guidance.exclusionPatterns).toBeDefined();
          expect(guidance.exclusionPatterns.length).toBeGreaterThan(0);
          guidance.exclusionPatterns.forEach((pattern) => {
            expect(pattern.type).toMatch(/^(HARD|CONDITIONAL)$/);
            expect(pattern.name).toBeTruthy();
            expect(pattern.description).toBeTruthy();
            expect(pattern.whenToUse).toBeTruthy();
          });
        });

        it('should have dimensionHints', () => {
          const guidance = INDUSTRY_EXCLUSION_GUIDANCE[industry];
          expect(guidance.dimensionHints).toBeDefined();
          expect(guidance.dimensionHints.length).toBeGreaterThan(0);
          guidance.dimensionHints.forEach((hint) => {
            expect(hint.dimension).toBeTruthy();
            expect(hint.description).toBeTruthy();
            expect(hint.commonOperators).toBeDefined();
            expect(hint.commonOperators.length).toBeGreaterThan(0);
            expect(hint.examples).toBeDefined();
            expect(hint.examples.length).toBeGreaterThan(0);
          });
        });

        it('should have commonExclusions', () => {
          const guidance = INDUSTRY_EXCLUSION_GUIDANCE[industry];
          expect(guidance.commonExclusions).toBeDefined();
          expect(guidance.commonExclusions.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have industry-specific dimensions for VC', () => {
      const guidance = INDUSTRY_EXCLUSION_GUIDANCE.VENTURE_CAPITAL;
      const dimensions = guidance.dimensionHints.map((h) => h.dimension);
      expect(dimensions).toContain('jurisdiction');
      expect(dimensions).toContain('sector');
      expect(dimensions).toContain('technology');
    });

    it('should have industry-specific dimensions for Insurance', () => {
      const guidance = INDUSTRY_EXCLUSION_GUIDANCE.INSURANCE;
      const dimensions = guidance.dimensionHints.map((h) => h.dimension);
      expect(dimensions).toContain('territory');
      expect(dimensions).toContain('cyberControls');
      expect(dimensions).toContain('contractTerms');
    });

    it('should have industry-specific dimensions for Pharma', () => {
      const guidance = INDUSTRY_EXCLUSION_GUIDANCE.PHARMA;
      const dimensions = guidance.dimensionHints.map((h) => h.dimension);
      expect(dimensions).toContain('safetyProfile');
      expect(dimensions).toContain('ipStatus');
      expect(dimensions).toContain('regulatoryPath');
    });
  });

  // =============================================================================
  // EXCLUSION_TEMPLATES
  // =============================================================================
  describe('EXCLUSION_TEMPLATES', () => {
    it('should have templates for all industries', () => {
      const industries = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA'];
      industries.forEach((industry) => {
        const templates = EXCLUSION_TEMPLATES.filter((t) => t.industry === industry);
        expect(templates.length).toBeGreaterThan(0);
      });
    });

    it('should have valid template structure', () => {
      EXCLUSION_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.type).toMatch(/^(HARD|CONDITIONAL)$/);
        expect(template.description).toBeTruthy();
        expect(template.industry).toBeTruthy();
        expect(typeof template.isDefault).toBe('boolean');
        expect(template.exclusion).toBeDefined();
      });
    });

    it('should have valid exclusion data in each template', () => {
      EXCLUSION_TEMPLATES.forEach((template) => {
        const exclusion = template.exclusion;
        expect(exclusion.name).toBeTruthy();
        expect(exclusion.type).toMatch(/^(HARD|CONDITIONAL)$/);
        expect(exclusion.dimension).toBeTruthy();
        expect(exclusion.operator).toBeTruthy();
        expect(exclusion.values).toBeDefined();
        expect(exclusion.rationale).toBeTruthy();
      });
    });

    it('should have HARD templates', () => {
      const hardTemplates = EXCLUSION_TEMPLATES.filter((t) => t.type === 'HARD');
      expect(hardTemplates.length).toBeGreaterThan(0);
    });

    it('should have CONDITIONAL templates', () => {
      const conditionalTemplates = EXCLUSION_TEMPLATES.filter((t) => t.type === 'CONDITIONAL');
      expect(conditionalTemplates.length).toBeGreaterThan(0);
    });

    it('should have default templates for each industry', () => {
      const industries = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA'];
      industries.forEach((industry) => {
        const defaultTemplates = EXCLUSION_TEMPLATES.filter(
          (t) => t.industry === industry && t.isDefault
        );
        expect(defaultTemplates.length).toBeGreaterThan(0);
      });
    });

    it('should have approvalRequired for CONDITIONAL templates', () => {
      const conditionalTemplates = EXCLUSION_TEMPLATES.filter((t) => t.type === 'CONDITIONAL');
      conditionalTemplates.forEach((template) => {
        if (template.exclusion.approvalRequired) {
          expect(template.exclusion.approvalRequired.roles).toBeDefined();
          expect(template.exclusion.approvalRequired.minApprovers).toBeGreaterThan(0);
        }
      });
    });
  });

  // =============================================================================
  // getExclusionTemplatesForIndustry
  // =============================================================================
  describe('getExclusionTemplatesForIndustry', () => {
    it('should return VC templates for VENTURE_CAPITAL', () => {
      const templates = getExclusionTemplatesForIndustry('VENTURE_CAPITAL');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should return VC templates for short name VC', () => {
      const templates = getExclusionTemplatesForIndustry('VC');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should return Insurance templates', () => {
      const templates = getExclusionTemplatesForIndustry('INSURANCE');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('INSURANCE');
      });
    });

    it('should return Pharma templates', () => {
      const templates = getExclusionTemplatesForIndustry('PHARMA');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('PHARMA');
      });
    });

    it('should handle case-insensitive industry names', () => {
      const lowerCase = getExclusionTemplatesForIndustry('vc');
      const upperCase = getExclusionTemplatesForIndustry('VC');
      const mixedCase = getExclusionTemplatesForIndustry('Vc');

      expect(lowerCase.length).toBe(upperCase.length);
      expect(lowerCase.length).toBe(mixedCase.length);
    });

    it('should return empty array for unknown industry', () => {
      const templates = getExclusionTemplatesForIndustry('UNKNOWN');
      expect(templates).toEqual([]);
    });

    it('should return GENERIC templates for GENERIC industry', () => {
      const templates = getExclusionTemplatesForIndustry('GENERIC');
      expect(templates).toBeDefined();
      // GENERIC may have no specific templates - this is valid
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  // =============================================================================
  // getExclusionGuidance
  // =============================================================================
  describe('getExclusionGuidance', () => {
    it('should return VC guidance for VENTURE_CAPITAL', () => {
      const guidance = getExclusionGuidance('VENTURE_CAPITAL');
      expect(guidance).toBeDefined();
      expect(guidance.recommendedCount.typical).toContain('regulatory');
    });

    it('should return VC guidance for short name VC', () => {
      const guidance = getExclusionGuidance('VC');
      const guidanceFull = getExclusionGuidance('VENTURE_CAPITAL');
      expect(guidance).toEqual(guidanceFull);
    });

    it('should return Insurance guidance', () => {
      const guidance = getExclusionGuidance('INSURANCE');
      expect(guidance).toBeDefined();
      expect(guidance.dimensionHints.some((h) => h.dimension === 'territory')).toBe(true);
    });

    it('should return Pharma guidance', () => {
      const guidance = getExclusionGuidance('PHARMA');
      expect(guidance).toBeDefined();
      expect(guidance.dimensionHints.some((h) => h.dimension === 'safetyProfile')).toBe(true);
    });

    it('should return GENERIC guidance for unknown industries', () => {
      const guidance = getExclusionGuidance('UNKNOWN_INDUSTRY');
      const genericGuidance = getExclusionGuidance('GENERIC');
      expect(guidance).toEqual(genericGuidance);
    });

    it('should handle case-insensitive industry names', () => {
      const lowerCase = getExclusionGuidance('insurance');
      const upperCase = getExclusionGuidance('INSURANCE');
      expect(lowerCase).toEqual(upperCase);
    });
  });

  // =============================================================================
  // createExclusionFromTemplate
  // =============================================================================
  describe('createExclusionFromTemplate', () => {
    it('should create exclusion with unique ID', () => {
      const template = EXCLUSION_TEMPLATES[0];
      const exclusion1 = createExclusionFromTemplate(template);
      const exclusion2 = createExclusionFromTemplate(template);

      expect(exclusion1.id).toBeTruthy();
      expect(exclusion2.id).toBeTruthy();
      expect(exclusion1.id).not.toBe(exclusion2.id);
    });

    it('should copy all template exclusion properties', () => {
      const template = EXCLUSION_TEMPLATES.find((t) => t.type === 'HARD')!;
      const exclusion = createExclusionFromTemplate(template);

      expect(exclusion.name).toBe(template.exclusion.name);
      expect(exclusion.type).toBe(template.exclusion.type);
      expect(exclusion.dimension).toBe(template.exclusion.dimension);
      expect(exclusion.operator).toBe(template.exclusion.operator);
      expect(exclusion.values).toEqual(template.exclusion.values);
      expect(exclusion.rationale).toBe(template.exclusion.rationale);
    });

    it('should copy conditional exclusion properties', () => {
      const conditionalTemplate = EXCLUSION_TEMPLATES.find(
        (t) => t.type === 'CONDITIONAL' && t.exclusion.approvalRequired
      )!;
      const exclusion = createExclusionFromTemplate(conditionalTemplate);

      expect(exclusion.type).toBe('CONDITIONAL');
      if (conditionalTemplate.exclusion.approvalRequired) {
        expect(exclusion.approvalRequired).toEqual(conditionalTemplate.exclusion.approvalRequired);
      }
    });

    it('should generate ID with excl- prefix', () => {
      const template = EXCLUSION_TEMPLATES[0];
      const exclusion = createExclusionFromTemplate(template);
      expect(exclusion.id).toMatch(/^excl-/);
    });
  });

  // =============================================================================
  // getRecommendedDefaultExclusions
  // =============================================================================
  describe('getRecommendedDefaultExclusions', () => {
    it('should return default exclusions for VC', () => {
      const defaults = getRecommendedDefaultExclusions('VENTURE_CAPITAL');
      expect(defaults.length).toBeGreaterThan(0);
      // Verify these are properly formed ExclusionItems
      defaults.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.type).toMatch(/^(HARD|CONDITIONAL)$/);
        expect(item.dimension).toBeTruthy();
        expect(item.operator).toBeTruthy();
        expect(item.rationale).toBeTruthy();
      });
    });

    it('should return default exclusions for Insurance', () => {
      const defaults = getRecommendedDefaultExclusions('INSURANCE');
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should return default exclusions for Pharma', () => {
      const defaults = getRecommendedDefaultExclusions('PHARMA');
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should work with short industry names', () => {
      const vcDefaults = getRecommendedDefaultExclusions('VC');
      const fullDefaults = getRecommendedDefaultExclusions('VENTURE_CAPITAL');
      expect(vcDefaults.length).toBe(fullDefaults.length);
    });

    it('should return unique IDs for each call', () => {
      const defaults1 = getRecommendedDefaultExclusions('VC');
      const defaults2 = getRecommendedDefaultExclusions('VC');

      // Same number of defaults
      expect(defaults1.length).toBe(defaults2.length);

      // But different IDs (freshly generated)
      defaults1.forEach((item1, index) => {
        expect(item1.id).not.toBe(defaults2[index].id);
      });
    });

    it('should include sanctioned jurisdictions for VC', () => {
      const defaults = getRecommendedDefaultExclusions('VC');
      const sanctionsExclusion = defaults.find(
        (e) => e.name.toLowerCase().includes('sanction') || e.dimension === 'jurisdiction'
      );
      expect(sanctionsExclusion).toBeDefined();
    });

    it('should include cyber controls for Insurance', () => {
      const defaults = getRecommendedDefaultExclusions('INSURANCE');
      const cyberExclusion = defaults.find(
        (e) => e.dimension === 'cyberControls' || e.name.toLowerCase().includes('cyber')
      );
      expect(cyberExclusion).toBeDefined();
    });

    it('should include safety profile for Pharma', () => {
      const defaults = getRecommendedDefaultExclusions('PHARMA');
      const safetyExclusion = defaults.find(
        (e) => e.dimension === 'safetyProfile' || e.name.toLowerCase().includes('toxicity')
      );
      expect(safetyExclusion).toBeDefined();
    });
  });

  // =============================================================================
  // getAvailableDimensions
  // =============================================================================
  describe('getAvailableDimensions', () => {
    it('should return dimensions with value, label, and description', () => {
      const dimensions = getAvailableDimensions('VENTURE_CAPITAL');
      expect(dimensions.length).toBeGreaterThan(0);
      dimensions.forEach((dim) => {
        expect(dim.value).toBeTruthy();
        expect(dim.label).toBeTruthy();
        expect(dim.description).toBeTruthy();
      });
    });

    it('should return industry-specific dimensions for VC', () => {
      const dimensions = getAvailableDimensions('VC');
      const values = dimensions.map((d) => d.value);
      expect(values).toContain('jurisdiction');
      expect(values).toContain('sector');
    });

    it('should return industry-specific dimensions for Insurance', () => {
      const dimensions = getAvailableDimensions('INSURANCE');
      const values = dimensions.map((d) => d.value);
      expect(values).toContain('territory');
      expect(values).toContain('cyberControls');
    });

    it('should return industry-specific dimensions for Pharma', () => {
      const dimensions = getAvailableDimensions('PHARMA');
      const values = dimensions.map((d) => d.value);
      expect(values).toContain('safetyProfile');
      expect(values).toContain('ipStatus');
    });

    it('should format label from dimension value', () => {
      const dimensions = getAvailableDimensions('INSURANCE');
      const cyberDim = dimensions.find((d) => d.value === 'cyberControls');
      expect(cyberDim).toBeDefined();
      // Label should be human-readable (capitalized, spaces)
      expect(cyberDim!.label).not.toBe('cyberControls');
    });
  });

  // =============================================================================
  // Template Content Validation
  // =============================================================================
  describe('Template Content Validation', () => {
    describe('VC Templates', () => {
      it('should include sanctions exclusion', () => {
        const templates = getExclusionTemplatesForIndustry('VC');
        const sanctions = templates.find((t) =>
          t.name.toLowerCase().includes('sanction') ||
          t.exclusion.dimension === 'jurisdiction'
        );
        expect(sanctions).toBeDefined();
        expect(sanctions!.type).toBe('HARD');
      });

      it('should include tobacco exclusion', () => {
        const templates = getExclusionTemplatesForIndustry('VC');
        const tobacco = templates.find((t) =>
          t.name.toLowerCase().includes('tobacco')
        );
        expect(tobacco).toBeDefined();
        expect(tobacco!.type).toBe('HARD');
      });

      it('should include crypto conditional exclusion', () => {
        const templates = getExclusionTemplatesForIndustry('VC');
        const crypto = templates.find((t) =>
          t.name.toLowerCase().includes('crypto') ||
          (t.exclusion.values as string[]).some((v) =>
            typeof v === 'string' && v.toLowerCase().includes('crypto')
          )
        );
        expect(crypto).toBeDefined();
        expect(crypto!.type).toBe('CONDITIONAL');
      });
    });

    describe('Insurance Templates', () => {
      it('should include sanctioned territories', () => {
        const templates = getExclusionTemplatesForIndustry('INSURANCE');
        const sanctions = templates.find((t) =>
          t.exclusion.dimension === 'territory' &&
          t.type === 'HARD'
        );
        expect(sanctions).toBeDefined();
      });

      it('should include CAT accumulation', () => {
        const templates = getExclusionTemplatesForIndustry('INSURANCE');
        const cat = templates.find((t) =>
          t.name.toLowerCase().includes('cat') ||
          t.exclusion.dimension === 'riskAggregation'
        );
        expect(cat).toBeDefined();
      });

      it('should include cyber controls conditional', () => {
        const templates = getExclusionTemplatesForIndustry('INSURANCE');
        const cyber = templates.find((t) =>
          t.exclusion.dimension === 'cyberControls'
        );
        expect(cyber).toBeDefined();
        expect(cyber!.type).toBe('CONDITIONAL');
      });
    });

    describe('Pharma Templates', () => {
      it('should include toxicity exclusion', () => {
        const templates = getExclusionTemplatesForIndustry('PHARMA');
        const toxicity = templates.find((t) =>
          t.name.toLowerCase().includes('toxicity') ||
          t.exclusion.dimension === 'safetyProfile'
        );
        expect(toxicity).toBeDefined();
        expect(toxicity!.type).toBe('HARD');
      });

      it('should include IP ownership exclusion', () => {
        const templates = getExclusionTemplatesForIndustry('PHARMA');
        const ip = templates.find((t) =>
          t.exclusion.dimension === 'ipStatus' &&
          t.type === 'HARD'
        );
        expect(ip).toBeDefined();
      });

      it('should include regulatory path conditional', () => {
        const templates = getExclusionTemplatesForIndustry('PHARMA');
        const regulatory = templates.find((t) =>
          t.exclusion.dimension === 'regulatoryPath' ||
          t.name.toLowerCase().includes('regulatory')
        );
        expect(regulatory).toBeDefined();
        expect(regulatory!.type).toBe('CONDITIONAL');
      });
    });
  });
});
