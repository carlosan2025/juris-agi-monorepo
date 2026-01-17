/**
 * Unit Tests: Risk Appetite Templates Library
 * Tests the risk appetite templates, guidance, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  BREACH_SEVERITY_INFO,
  DIMENSION_CATEGORY_INFO,
  INDUSTRY_RISK_APPETITE_GUIDANCE,
  getTemplatesForIndustry,
  getAllTemplates,
  getTemplateById,
  getDefaultTemplate,
  getIndustryGuidance,
  createRiskAppetiteFromTemplate,
  getRecommendedDefaultRiskAppetite,
  type RiskAppetiteTemplate,
} from '@/lib/baseline/risk-appetite-templates';
import type { BreachSeverity } from '@/lib/baseline/types';

describe('Risk Appetite Templates Library', () => {
  // =============================================================================
  // BREACH_SEVERITY_INFO
  // =============================================================================
  describe('BREACH_SEVERITY_INFO', () => {
    it('should define info for HARD severity', () => {
      expect(BREACH_SEVERITY_INFO.HARD).toBeDefined();
      expect(BREACH_SEVERITY_INFO.HARD.label).toBe('Hard Breach');
      expect(BREACH_SEVERITY_INFO.HARD.description).toContain('governance escalation');
      expect(BREACH_SEVERITY_INFO.HARD.color).toContain('red');
    });

    it('should define info for SOFT severity', () => {
      expect(BREACH_SEVERITY_INFO.SOFT).toBeDefined();
      expect(BREACH_SEVERITY_INFO.SOFT.label).toBe('Soft Breach');
      expect(BREACH_SEVERITY_INFO.SOFT.description).toContain('warning');
      expect(BREACH_SEVERITY_INFO.SOFT.color).toContain('amber');
    });

    it('should cover all BreachSeverity values', () => {
      const severities: BreachSeverity[] = ['HARD', 'SOFT'];
      severities.forEach((severity) => {
        expect(BREACH_SEVERITY_INFO[severity]).toBeDefined();
        expect(BREACH_SEVERITY_INFO[severity].label).toBeTruthy();
        expect(BREACH_SEVERITY_INFO[severity].description).toBeTruthy();
        expect(BREACH_SEVERITY_INFO[severity].color).toBeTruthy();
      });
    });
  });

  // =============================================================================
  // DIMENSION_CATEGORY_INFO
  // =============================================================================
  describe('DIMENSION_CATEGORY_INFO', () => {
    const expectedCategories = [
      'EXECUTION',
      'TECHNICAL',
      'MARKET',
      'REGULATORY',
      'FINANCIAL',
      'OPERATIONAL',
    ];

    it('should define all expected categories', () => {
      expectedCategories.forEach((category) => {
        expect(DIMENSION_CATEGORY_INFO[category]).toBeDefined();
        expect(DIMENSION_CATEGORY_INFO[category].label).toBeTruthy();
        expect(DIMENSION_CATEGORY_INFO[category].description).toBeTruthy();
        expect(DIMENSION_CATEGORY_INFO[category].icon).toBeTruthy();
      });
    });

    it('should have descriptive labels', () => {
      expect(DIMENSION_CATEGORY_INFO.EXECUTION.label).toBe('Execution Risk');
      expect(DIMENSION_CATEGORY_INFO.TECHNICAL.label).toBe('Technical Risk');
      expect(DIMENSION_CATEGORY_INFO.MARKET.label).toBe('Market Risk');
      expect(DIMENSION_CATEGORY_INFO.REGULATORY.label).toBe('Regulatory Risk');
      expect(DIMENSION_CATEGORY_INFO.FINANCIAL.label).toBe('Financial Risk');
      expect(DIMENSION_CATEGORY_INFO.OPERATIONAL.label).toBe('Operational Risk');
    });
  });

  // =============================================================================
  // INDUSTRY_RISK_APPETITE_GUIDANCE
  // =============================================================================
  describe('INDUSTRY_RISK_APPETITE_GUIDANCE', () => {
    const industries = ['VENTURE_CAPITAL', 'INSURANCE', 'PHARMA', 'GENERIC'];

    industries.forEach((industry) => {
      describe(`${industry} guidance`, () => {
        it('should have recommendedCount with all required fields', () => {
          const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE[industry];
          expect(guidance.recommendedCount).toBeDefined();
          expect(guidance.recommendedCount.default).toBeGreaterThan(0);
          expect(guidance.recommendedCount.min).toBeGreaterThan(0);
          expect(guidance.recommendedCount.max).toBeGreaterThan(guidance.recommendedCount.min);
          expect(guidance.recommendedCount.typical).toBeTruthy();
        });

        it('should have dimensionPatterns', () => {
          const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE[industry];
          expect(guidance.dimensionPatterns).toBeDefined();
          expect(guidance.dimensionPatterns.length).toBeGreaterThan(0);
          guidance.dimensionPatterns.forEach((pattern) => {
            expect(pattern.id).toBeTruthy();
            expect(pattern.name).toBeTruthy();
            expect(pattern.description).toBeTruthy();
            expect(pattern.category).toBeTruthy();
            expect(pattern.defaultTolerance).toBeDefined();
            expect(pattern.defaultTolerance.min).toBe(0);
            expect(pattern.defaultTolerance.max).toBeGreaterThan(0);
            expect(pattern.defaultTolerance.max).toBeLessThanOrEqual(1);
            expect(pattern.defaultBreach).toBeDefined();
            expect(pattern.defaultBreach.hardMax).toBeGreaterThan(pattern.defaultTolerance.max);
            expect(pattern.defaultBreach.severity).toMatch(/^(HARD|SOFT)$/);
          });
        });

        it('should have constraintPatterns', () => {
          const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE[industry];
          expect(guidance.constraintPatterns).toBeDefined();
          expect(guidance.constraintPatterns.length).toBeGreaterThan(0);
          guidance.constraintPatterns.forEach((pattern) => {
            expect(pattern.name).toBeTruthy();
            expect(pattern.type).toBeTruthy();
            expect(pattern.description).toBeTruthy();
            expect(pattern.defaultThreshold).toBeGreaterThan(0);
          });
        });

        it('should have fieldHints', () => {
          const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE[industry];
          expect(guidance.fieldHints).toBeDefined();
          expect(guidance.fieldHints.dimensions).toBeTruthy();
          expect(guidance.fieldHints.toleranceBand).toBeTruthy();
          expect(guidance.fieldHints.breachThreshold).toBeTruthy();
          expect(guidance.fieldHints.portfolioConstraints).toBeTruthy();
          expect(guidance.fieldHints.tradeoffs).toBeTruthy();
        });
      });
    });

    it('should have VC-specific dimensions', () => {
      const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE.VENTURE_CAPITAL;
      const dimensionIds = guidance.dimensionPatterns.map((d) => d.id);
      expect(dimensionIds).toContain('TEAM');
      expect(dimensionIds).toContain('TECHNICAL');
      expect(dimensionIds).toContain('MARKET');
      expect(dimensionIds).toContain('REGULATORY');
    });

    it('should have Insurance-specific dimensions', () => {
      const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE.INSURANCE;
      const dimensionIds = guidance.dimensionPatterns.map((d) => d.id);
      expect(dimensionIds).toContain('PRICING');
      expect(dimensionIds).toContain('AGGREGATION');
      expect(dimensionIds).toContain('CAT');
      expect(dimensionIds).toContain('COUNTERPARTY');
    });

    it('should have Pharma-specific dimensions', () => {
      const guidance = INDUSTRY_RISK_APPETITE_GUIDANCE.PHARMA;
      const dimensionIds = guidance.dimensionPatterns.map((d) => d.id);
      expect(dimensionIds).toContain('BIOLOGY');
      expect(dimensionIds).toContain('TRANSLATION');
      expect(dimensionIds).toContain('SAFETY');
      expect(dimensionIds).toContain('CMC');
      expect(dimensionIds).toContain('REGULATORY');
    });
  });

  // =============================================================================
  // getAllTemplates
  // =============================================================================
  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const templates = getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have templates from all industries', () => {
      const templates = getAllTemplates();
      const industries = new Set(templates.map((t) => t.industry));
      expect(industries.has('VENTURE_CAPITAL')).toBe(true);
      expect(industries.has('INSURANCE')).toBe(true);
      expect(industries.has('PHARMA')).toBe(true);
    });

    it('should have valid template structure', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.industry).toBeTruthy();
        expect(typeof template.isDefault).toBe('boolean');
        expect(template.riskAppetite).toBeDefined();
      });
    });
  });

  // =============================================================================
  // getTemplatesForIndustry
  // =============================================================================
  describe('getTemplatesForIndustry', () => {
    it('should return VC templates for VENTURE_CAPITAL', () => {
      const templates = getTemplatesForIndustry('VENTURE_CAPITAL');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should return VC templates for short name VC', () => {
      const templates = getTemplatesForIndustry('VC');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should return Insurance templates', () => {
      const templates = getTemplatesForIndustry('INSURANCE');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('INSURANCE');
      });
    });

    it('should return Insurance templates for short name INS', () => {
      const templates = getTemplatesForIndustry('INS');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('INSURANCE');
      });
    });

    it('should return Pharma templates', () => {
      const templates = getTemplatesForIndustry('PHARMA');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('PHARMA');
      });
    });

    it('should return Pharma templates for PHARMACEUTICAL', () => {
      const templates = getTemplatesForIndustry('PHARMACEUTICAL');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach((t) => {
        expect(t.industry).toBe('PHARMA');
      });
    });

    it('should handle case-insensitive industry names', () => {
      const lowerCase = getTemplatesForIndustry('vc');
      const upperCase = getTemplatesForIndustry('VC');
      const mixedCase = getTemplatesForIndustry('Vc');

      expect(lowerCase.length).toBe(upperCase.length);
      expect(lowerCase.length).toBe(mixedCase.length);
    });

    it('should return empty array for unknown industry', () => {
      const templates = getTemplatesForIndustry('UNKNOWN');
      expect(templates).toEqual([]);
    });

    it('should have 4 VC templates', () => {
      const templates = getTemplatesForIndustry('VC');
      expect(templates.length).toBe(4);
    });

    it('should have 4 Insurance templates', () => {
      const templates = getTemplatesForIndustry('INSURANCE');
      expect(templates.length).toBe(4);
    });

    it('should have 4 Pharma templates', () => {
      const templates = getTemplatesForIndustry('PHARMA');
      expect(templates.length).toBe(4);
    });
  });

  // =============================================================================
  // getTemplateById
  // =============================================================================
  describe('getTemplateById', () => {
    it('should return template by ID', () => {
      const template = getTemplateById('vc-balanced');
      expect(template).toBeDefined();
      expect(template!.id).toBe('vc-balanced');
      expect(template!.name).toContain('Balanced');
    });

    it('should return undefined for non-existent ID', () => {
      const template = getTemplateById('non-existent-id');
      expect(template).toBeUndefined();
    });

    it('should find all expected VC template IDs', () => {
      const expectedIds = ['vc-conservative', 'vc-balanced', 'vc-aggressive', 'vc-opportunistic'];
      expectedIds.forEach((id) => {
        const template = getTemplateById(id);
        expect(template).toBeDefined();
        expect(template!.industry).toBe('VENTURE_CAPITAL');
      });
    });

    it('should find all expected Insurance template IDs', () => {
      const expectedIds = ['ins-conservative', 'ins-balanced', 'ins-growth', 'ins-cyber'];
      expectedIds.forEach((id) => {
        const template = getTemplateById(id);
        expect(template).toBeDefined();
        expect(template!.industry).toBe('INSURANCE');
      });
    });

    it('should find all expected Pharma template IDs', () => {
      const expectedIds = ['pharma-balanced', 'pharma-early-stage', 'pharma-late-stage', 'pharma-conservative'];
      expectedIds.forEach((id) => {
        const template = getTemplateById(id);
        expect(template).toBeDefined();
        expect(template!.industry).toBe('PHARMA');
      });
    });
  });

  // =============================================================================
  // getDefaultTemplate
  // =============================================================================
  describe('getDefaultTemplate', () => {
    it('should return default VC template', () => {
      const template = getDefaultTemplate('VC');
      expect(template).toBeDefined();
      expect(template!.isDefault).toBe(true);
      expect(template!.industry).toBe('VENTURE_CAPITAL');
      expect(template!.id).toBe('vc-balanced');
    });

    it('should return default Insurance template', () => {
      const template = getDefaultTemplate('INSURANCE');
      expect(template).toBeDefined();
      expect(template!.isDefault).toBe(true);
      expect(template!.industry).toBe('INSURANCE');
      expect(template!.id).toBe('ins-conservative');
    });

    it('should return default Pharma template', () => {
      const template = getDefaultTemplate('PHARMA');
      expect(template).toBeDefined();
      expect(template!.isDefault).toBe(true);
      expect(template!.industry).toBe('PHARMA');
      expect(template!.id).toBe('pharma-balanced');
    });

    it('should return undefined for unknown industry', () => {
      const template = getDefaultTemplate('UNKNOWN');
      expect(template).toBeUndefined();
    });

    it('should work with case-insensitive industry names', () => {
      const lower = getDefaultTemplate('vc');
      const upper = getDefaultTemplate('VC');
      expect(lower).toEqual(upper);
    });
  });

  // =============================================================================
  // getIndustryGuidance
  // =============================================================================
  describe('getIndustryGuidance', () => {
    it('should return VC guidance for VENTURE_CAPITAL', () => {
      const guidance = getIndustryGuidance('VENTURE_CAPITAL');
      expect(guidance).toBeDefined();
      expect(guidance.dimensionPatterns.some((d) => d.id === 'TEAM')).toBe(true);
    });

    it('should return VC guidance for short name VC', () => {
      const guidance = getIndustryGuidance('VC');
      const guidanceFull = getIndustryGuidance('VENTURE_CAPITAL');
      expect(guidance).toEqual(guidanceFull);
    });

    it('should return Insurance guidance', () => {
      const guidance = getIndustryGuidance('INSURANCE');
      expect(guidance).toBeDefined();
      expect(guidance.dimensionPatterns.some((d) => d.id === 'PRICING')).toBe(true);
    });

    it('should return Pharma guidance', () => {
      const guidance = getIndustryGuidance('PHARMA');
      expect(guidance).toBeDefined();
      expect(guidance.dimensionPatterns.some((d) => d.id === 'BIOLOGY')).toBe(true);
    });

    it('should return GENERIC guidance for unknown industries', () => {
      const guidance = getIndustryGuidance('UNKNOWN_INDUSTRY');
      const genericGuidance = getIndustryGuidance('GENERIC');
      expect(guidance).toEqual(genericGuidance);
    });

    it('should handle case-insensitive industry names', () => {
      const lowerCase = getIndustryGuidance('insurance');
      const upperCase = getIndustryGuidance('INSURANCE');
      expect(lowerCase).toEqual(upperCase);
    });
  });

  // =============================================================================
  // createRiskAppetiteFromTemplate
  // =============================================================================
  describe('createRiskAppetiteFromTemplate', () => {
    it('should create valid RiskAppetiteModulePayload from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.schemaVersion).toBe(1);
      expect(payload.framework).toBeDefined();
      expect(payload.dimensions).toBeDefined();
      expect(payload.portfolioConstraints).toBeDefined();
      expect(payload.breachPolicy).toBeDefined();
    });

    it('should copy framework from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.framework.name).toBe('VC – Balanced Core Fund');
      expect(payload.framework.scale.type).toBe('numeric_0_1');
      expect(payload.framework.scale.min).toBe(0);
      expect(payload.framework.scale.max).toBe(1);
    });

    it('should copy dimensions from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.dimensions.length).toBe(5);
      const teamDim = payload.dimensions.find((d) => d.id === 'TEAM');
      expect(teamDim).toBeDefined();
      expect(teamDim!.name).toBe('Team Risk');
      expect(teamDim!.tolerance.max).toBe(0.65);
      expect(teamDim!.breach.hardMax).toBe(0.75);
      expect(teamDim!.breach.severity).toBe('HARD');
    });

    it('should copy portfolioConstraints from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.portfolioConstraints.length).toBe(3);
      const concentrationConstraint = payload.portfolioConstraints.find(
        (c) => c.name === 'Max Single Case Exposure'
      );
      expect(concentrationConstraint).toBeDefined();
      expect(concentrationConstraint!.threshold).toBe(12);
      expect(concentrationConstraint!.unit).toBe('%');
    });

    it('should copy breachPolicy from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.breachPolicy.onHardBreach).toBe('BLOCK_UNLESS_EXCEPTION');
      expect(payload.breachPolicy.onSoftBreach).toBe('ALLOW_WITH_WARNING');
      expect(payload.breachPolicy.requiredActions).toContain('LOG_EXCEPTION');
      expect(payload.breachPolicy.requiredActions).toContain('ESCALATE_APPROVAL');
    });

    it('should copy tradeoffs from template', () => {
      const template = getTemplateById('vc-balanced')!;
      const payload = createRiskAppetiteFromTemplate(template);

      expect(payload.tradeoffs).toBeDefined();
      expect(payload.tradeoffs!.length).toBe(1);
      expect(payload.tradeoffs![0].id).toBe('VC_TO_1');
      expect(payload.tradeoffs![0].if.dimension).toBe('REGULATORY');
      expect(payload.tradeoffs![0].if.max).toBe(0.30);
      expect(payload.tradeoffs![0].then.dimension).toBe('TECHNICAL');
      expect(payload.tradeoffs![0].then.maxAllowedIncrease).toBe(0.10);
    });

    it('should provide defaults for missing fields', () => {
      // Create a minimal template
      const minimalTemplate: RiskAppetiteTemplate = {
        id: 'test-minimal',
        name: 'Minimal Test',
        description: 'Test template',
        industry: 'GENERIC',
        isDefault: false,
        riskAppetite: {},
      };

      const payload = createRiskAppetiteFromTemplate(minimalTemplate);

      expect(payload.schemaVersion).toBe(1);
      expect(payload.framework).toBeDefined();
      expect(payload.breachPolicy).toBeDefined();
    });
  });

  // =============================================================================
  // getRecommendedDefaultRiskAppetite
  // =============================================================================
  describe('getRecommendedDefaultRiskAppetite', () => {
    it('should return default risk appetite for VC', () => {
      const payload = getRecommendedDefaultRiskAppetite('VC');
      expect(payload).not.toBeNull();
      expect(payload!.framework.name).toContain('Balanced');
    });

    it('should return default risk appetite for Insurance', () => {
      const payload = getRecommendedDefaultRiskAppetite('INSURANCE');
      expect(payload).not.toBeNull();
      expect(payload!.framework.name).toContain('Conservative');
    });

    it('should return default risk appetite for Pharma', () => {
      const payload = getRecommendedDefaultRiskAppetite('PHARMA');
      expect(payload).not.toBeNull();
      expect(payload!.framework.name).toContain('Balanced');
    });

    it('should return null for unknown industry', () => {
      const payload = getRecommendedDefaultRiskAppetite('UNKNOWN');
      expect(payload).toBeNull();
    });

    it('should work with case-insensitive industry names', () => {
      const lower = getRecommendedDefaultRiskAppetite('vc');
      const upper = getRecommendedDefaultRiskAppetite('VC');
      expect(lower).toEqual(upper);
    });
  });

  // =============================================================================
  // Template Content Validation
  // =============================================================================
  describe('Template Content Validation', () => {
    describe('VC Templates', () => {
      it('should have Conservative template with lower tolerances', () => {
        const template = getTemplateById('vc-conservative')!;
        const balanced = getTemplateById('vc-balanced')!;

        const conservativeTeam = template.riskAppetite.dimensions!.find((d) => d.id === 'TEAM');
        const balancedTeam = balanced.riskAppetite.dimensions!.find((d) => d.id === 'TEAM');

        expect(conservativeTeam!.tolerance.max).toBeLessThan(balancedTeam!.tolerance.max);
      });

      it('should have Aggressive template with higher tolerances', () => {
        const template = getTemplateById('vc-aggressive')!;
        const balanced = getTemplateById('vc-balanced')!;

        const aggressiveTech = template.riskAppetite.dimensions!.find((d) => d.id === 'TECHNICAL');
        const balancedTech = balanced.riskAppetite.dimensions!.find((d) => d.id === 'TECHNICAL');

        expect(aggressiveTech!.tolerance.max).toBeGreaterThan(balancedTech!.tolerance.max);
      });

      it('should have appropriate concentration limits', () => {
        const conservative = getTemplateById('vc-conservative')!;
        const aggressive = getTemplateById('vc-aggressive')!;

        const conservativeConcentration = conservative.riskAppetite.portfolioConstraints!.find(
          (c) => c.name === 'Max Single Case Exposure'
        );
        const aggressiveConcentration = aggressive.riskAppetite.portfolioConstraints!.find(
          (c) => c.name === 'Max Single Case Exposure'
        );

        expect(conservativeConcentration!.threshold).toBeLessThan(aggressiveConcentration!.threshold);
      });
    });

    describe('Insurance Templates', () => {
      it('should have Cyber template with vendor aggregation constraint', () => {
        const template = getTemplateById('ins-cyber')!;
        const vendorConstraint = template.riskAppetite.portfolioConstraints!.find(
          (c) => c.name === 'Max Vendor Aggregation'
        );
        expect(vendorConstraint).toBeDefined();
        expect(vendorConstraint!.threshold).toBe(10);
      });

      it('should have strict pricing tolerance for conservative book', () => {
        const template = getTemplateById('ins-conservative')!;
        const pricingDim = template.riskAppetite.dimensions!.find((d) => d.id === 'PRICING');
        expect(pricingDim!.tolerance.max).toBe(0.35);
        expect(pricingDim!.breach.hardMax).toBe(0.45);
      });

      it('should have tradeoff for balanced book', () => {
        const template = getTemplateById('ins-balanced')!;
        expect(template.riskAppetite.tradeoffs).toBeDefined();
        expect(template.riskAppetite.tradeoffs!.length).toBeGreaterThan(0);
      });
    });

    describe('Pharma Templates', () => {
      it('should have strict safety tolerance across all templates', () => {
        const templates = getTemplatesForIndustry('PHARMA');
        templates.forEach((template) => {
          const safetyDim = template.riskAppetite.dimensions!.find(
            (d) => d.id === 'SAFETY' || d.name.includes('Safety')
          );
          if (safetyDim) {
            // Safety should always have low tolerance
            expect(safetyDim.tolerance.max).toBeLessThanOrEqual(0.50);
            expect(safetyDim.breach.severity).toBe('HARD');
          }
        });
      });

      it('should have higher biology tolerance in early-stage', () => {
        const earlyStage = getTemplateById('pharma-early-stage')!;
        const balanced = getTemplateById('pharma-balanced')!;

        const earlyBiology = earlyStage.riskAppetite.dimensions!.find((d) => d.id === 'BIOLOGY');
        const balancedBiology = balanced.riskAppetite.dimensions!.find((d) => d.id === 'BIOLOGY');

        expect(earlyBiology!.tolerance.max).toBeGreaterThan(balancedBiology!.tolerance.max);
      });

      it('should have REQUIRE_RISK_SIGNOFF in late-stage breach policy', () => {
        const lateStage = getTemplateById('pharma-late-stage')!;
        expect(lateStage.riskAppetite.breachPolicy!.requiredActions).toContain('REQUIRE_RISK_SIGNOFF');
      });
    });
  });

  // =============================================================================
  // Canonical Structure Validation
  // =============================================================================
  describe('Canonical Structure Validation', () => {
    it('should have orthogonal dimensions (no duplicate IDs)', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        const dimensionIds = template.riskAppetite.dimensions!.map((d) => d.id);
        const uniqueIds = new Set(dimensionIds);
        expect(uniqueIds.size).toBe(dimensionIds.length);
      });
    });

    it('should have hardMax greater than tolerance.max for all dimensions', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        template.riskAppetite.dimensions!.forEach((dim) => {
          expect(dim.breach.hardMax).toBeGreaterThan(dim.tolerance.max);
        });
      });
    });

    it('should have valid breach severity values', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        template.riskAppetite.dimensions!.forEach((dim) => {
          expect(['HARD', 'SOFT']).toContain(dim.breach.severity);
        });
      });
    });

    it('should have valid breach policy actions', () => {
      const validActions = [
        'LOG_EXCEPTION',
        'ESCALATE_APPROVAL',
        'DOCUMENT_MITIGATIONS',
        'REQUIRE_RISK_SIGNOFF',
      ];
      const templates = getAllTemplates();
      templates.forEach((template) => {
        template.riskAppetite.breachPolicy!.requiredActions.forEach((action) => {
          expect(validActions).toContain(action);
        });
      });
    });

    it('should have valid constraint types', () => {
      const validTypes = [
        'CONCENTRATION',
        'EXPOSURE',
        'CORRELATION',
        'LIQUIDITY',
        'DURATION',
        'GEOGRAPHIC',
        'SECTOR',
        'CUSTOM',
      ];
      const templates = getAllTemplates();
      templates.forEach((template) => {
        template.riskAppetite.portfolioConstraints!.forEach((constraint) => {
          expect(validTypes).toContain(constraint.type);
        });
      });
    });

    it('should have numeric_0_1 scale for all templates', () => {
      const templates = getAllTemplates();
      templates.forEach((template) => {
        expect(template.riskAppetite.framework!.scale.type).toBe('numeric_0_1');
        expect(template.riskAppetite.framework!.scale.min).toBe(0);
        expect(template.riskAppetite.framework!.scale.max).toBe(1);
      });
    });
  });
});
