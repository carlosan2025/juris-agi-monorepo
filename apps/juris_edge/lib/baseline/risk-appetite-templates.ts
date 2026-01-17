/**
 * Risk Appetite Templates and Industry Guidance
 *
 * This file contains:
 * 1. Industry-specific risk appetite templates with pre-filled dimensions
 * 2. Guidance on typical dimension counts per industry
 * 3. Default portfolio constraints per industry
 * 4. Default breach policies and tradeoffs
 *
 * Templates are UI-only helpers - they create valid RiskAppetiteModulePayload objects
 * but don't change the underlying baseline schema.
 *
 * CANONICAL STRUCTURE:
 * - Dimensions are orthogonal (no duplicates)
 * - hardMax is a constitutional ceiling
 * - Mandates may only tighten, never loosen
 * - Breaches always create exceptions + audit trail
 */

import type {
  RiskAppetiteModulePayload,
  RiskDimension,
  PortfolioConstraint,
  RiskTradeoff,
  BreachPolicy,
  RiskFramework,
  BreachSeverity,
} from './types';

// =============================================================================
// BREACH SEVERITY DESCRIPTIONS
// =============================================================================

export const BREACH_SEVERITY_INFO: Record<BreachSeverity, {
  label: string;
  description: string;
  color: string;
}> = {
  HARD: {
    label: 'Hard Breach',
    description: 'Triggers exception & requires governance escalation. Cannot proceed without explicit approval.',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  SOFT: {
    label: 'Soft Breach',
    description: 'Allows proceeding with warning and required commentary. Must be documented.',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

// =============================================================================
// RISK DIMENSION CATEGORY INFO
// =============================================================================

export const DIMENSION_CATEGORY_INFO: Record<string, {
  label: string;
  description: string;
  icon: string;
}> = {
  EXECUTION: {
    label: 'Execution Risk',
    description: 'Risks related to team capability and operational delivery',
    icon: 'Users',
  },
  TECHNICAL: {
    label: 'Technical Risk',
    description: 'Risks related to technology, R&D, and feasibility',
    icon: 'Cpu',
  },
  MARKET: {
    label: 'Market Risk',
    description: 'Risks related to demand, competition, and market dynamics',
    icon: 'TrendingUp',
  },
  REGULATORY: {
    label: 'Regulatory Risk',
    description: 'Risks related to compliance, licensing, and regulatory requirements',
    icon: 'Shield',
  },
  FINANCIAL: {
    label: 'Financial Risk',
    description: 'Risks related to capital, funding, and financial exposure',
    icon: 'DollarSign',
  },
  OPERATIONAL: {
    label: 'Operational Risk',
    description: 'Risks related to processes, controls, and operational failures',
    icon: 'Settings',
  },
};

// =============================================================================
// RISK APPETITE TEMPLATE INTERFACE
// =============================================================================

export interface RiskAppetiteTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  isDefault: boolean;
  // The pre-filled risk appetite data
  riskAppetite: Partial<RiskAppetiteModulePayload>;
}

// =============================================================================
// INDUSTRY GUIDANCE
// =============================================================================

export interface IndustryRiskAppetiteGuidance {
  recommendedCount: {
    default: number;
    min: number;
    max: number;
    typical: string;
  };
  dimensionPatterns: {
    id: string;
    name: string;
    description: string;
    category: string;
    defaultTolerance: { min: number; max: number };
    defaultBreach: { hardMax: number; severity: BreachSeverity };
  }[];
  constraintPatterns: {
    name: string;
    type: PortfolioConstraint['type'];
    description: string;
    defaultThreshold: number;
    unit?: string;
    currency?: string;
  }[];
  fieldHints: {
    dimensions: string;
    toleranceBand: string;
    breachThreshold: string;
    portfolioConstraints: string;
    tradeoffs: string;
  };
}

export const INDUSTRY_RISK_APPETITE_GUIDANCE: Record<string, IndustryRiskAppetiteGuidance> = {
  VENTURE_CAPITAL: {
    recommendedCount: {
      default: 5,
      min: 4,
      max: 7,
      typical: '4-7 dimensions covering team, tech, market, regulatory, and financing risks',
    },
    dimensionPatterns: [
      {
        id: 'TEAM',
        name: 'Team Risk',
        description: 'Execution capability, cohesion, hiring, founder-market fit.',
        category: 'EXECUTION',
        defaultTolerance: { min: 0, max: 0.65 },
        defaultBreach: { hardMax: 0.75, severity: 'HARD' },
      },
      {
        id: 'TECHNICAL',
        name: 'Technical Risk',
        description: 'Feasibility, R&D uncertainty, performance vs benchmarks.',
        category: 'TECHNICAL',
        defaultTolerance: { min: 0, max: 0.70 },
        defaultBreach: { hardMax: 0.80, severity: 'HARD' },
      },
      {
        id: 'MARKET',
        name: 'Market Risk',
        description: 'Demand uncertainty, competitive intensity, pricing power.',
        category: 'MARKET',
        defaultTolerance: { min: 0, max: 0.65 },
        defaultBreach: { hardMax: 0.75, severity: 'HARD' },
      },
      {
        id: 'REGULATORY',
        name: 'Regulatory Risk',
        description: 'Regulatory burden, data/privacy issues, licensing barriers.',
        category: 'REGULATORY',
        defaultTolerance: { min: 0, max: 0.45 },
        defaultBreach: { hardMax: 0.55, severity: 'HARD' },
      },
      {
        id: 'FINANCING',
        name: 'Financing Risk',
        description: 'Capital intensity and probability of future funding at acceptable terms.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.65 },
        defaultBreach: { hardMax: 0.75, severity: 'SOFT' },
      },
      {
        id: 'LIQUIDITY',
        name: 'Liquidity / Exit Timing Risk',
        description: 'Risk that liquidity takes longer than fund model assumptions.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.65 },
        defaultBreach: { hardMax: 0.75, severity: 'SOFT' },
      },
    ],
    constraintPatterns: [
      { name: 'Max Single Case Exposure', type: 'CONCENTRATION', description: 'Maximum % of fund in a single deal', defaultThreshold: 12, unit: '%' },
      { name: 'Max Top 5 Exposure', type: 'CONCENTRATION', description: 'Maximum % of fund in top 5 deals', defaultThreshold: 45, unit: '%' },
      { name: 'Max Single Theme Exposure', type: 'SECTOR', description: 'Maximum % in any single theme/vertical', defaultThreshold: 30, unit: '%' },
    ],
    fieldHints: {
      dimensions: 'Define risk categories that matter for venture investments (team, tech, market, execution)',
      toleranceBand: 'The range of risk scores that are normally acceptable (higher = more risk tolerance)',
      breachThreshold: 'The hard limit that triggers exception & governance escalation',
      portfolioConstraints: 'Portfolio-level concentration limits to ensure diversification',
      tradeoffs: 'Define when exceeding one dimension can be offset by another being low',
    },
  },

  INSURANCE: {
    recommendedCount: {
      default: 4,
      min: 4,
      max: 8,
      typical: '4-8 dimensions covering pricing, aggregation, cat, and counterparty risks',
    },
    dimensionPatterns: [
      {
        id: 'PRICING',
        name: 'Pricing Adequacy Risk',
        description: 'Risk that premium is insufficient vs technical price.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.35 },
        defaultBreach: { hardMax: 0.45, severity: 'HARD' },
      },
      {
        id: 'AGGREGATION',
        name: 'Aggregation / Correlation Risk',
        description: 'Risk of correlated losses (vendor/systemic/cat accumulation).',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.40 },
        defaultBreach: { hardMax: 0.50, severity: 'HARD' },
      },
      {
        id: 'CAT',
        name: 'Catastrophe Risk',
        description: 'Exposure to catastrophe events and tail severity.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.35 },
        defaultBreach: { hardMax: 0.45, severity: 'HARD' },
      },
      {
        id: 'COUNTERPARTY',
        name: 'Counterparty / Reinsurance Credit Risk',
        description: 'Default or dispute risk with reinsurers / counterparties.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.30 },
        defaultBreach: { hardMax: 0.40, severity: 'HARD' },
      },
    ],
    constraintPatterns: [
      { name: 'Max Single Insured Exposure', type: 'CONCENTRATION', description: 'Maximum % exposure to any single insured', defaultThreshold: 5, unit: '%' },
      { name: 'Max Top 10 Exposure', type: 'CONCENTRATION', description: 'Maximum % in top 10 insureds', defaultThreshold: 35, unit: '%' },
      { name: 'Max CAT Zone Exposure', type: 'GEOGRAPHIC', description: 'Maximum % in any single CAT zone', defaultThreshold: 20, unit: '%' },
    ],
    fieldHints: {
      dimensions: 'Define risk categories for underwriting (pricing, aggregation, cat, counterparty)',
      toleranceBand: 'The range of risk scores acceptable for underwriting authority',
      breachThreshold: 'The hard limit that triggers referral to senior underwriters',
      portfolioConstraints: 'Book-level limits for concentration and accumulation',
      tradeoffs: 'Define when strong pricing can offset higher reserving uncertainty',
    },
  },

  PHARMA: {
    recommendedCount: {
      default: 5,
      min: 4,
      max: 8,
      typical: '4-8 dimensions covering biology, translation, safety, CMC, and regulatory risks',
    },
    dimensionPatterns: [
      {
        id: 'BIOLOGY',
        name: 'Biology / MoA Risk',
        description: 'Risk mechanism is not valid or not sufficiently predictive of clinical benefit.',
        category: 'TECHNICAL',
        defaultTolerance: { min: 0, max: 0.65 },
        defaultBreach: { hardMax: 0.75, severity: 'HARD' },
      },
      {
        id: 'TRANSLATION',
        name: 'Translational Risk',
        description: 'Risk preclinical models/biomarkers won\'t translate to humans.',
        category: 'TECHNICAL',
        defaultTolerance: { min: 0, max: 0.60 },
        defaultBreach: { hardMax: 0.70, severity: 'HARD' },
      },
      {
        id: 'SAFETY',
        name: 'Safety Risk',
        description: 'Known or plausible safety liabilities, tolerability constraints.',
        category: 'TECHNICAL',
        defaultTolerance: { min: 0, max: 0.45 },
        defaultBreach: { hardMax: 0.55, severity: 'HARD' },
      },
      {
        id: 'CMC',
        name: 'CMC / Manufacturability Risk',
        description: 'Scale-up, quality, cost of goods, formulation, comparability risk.',
        category: 'TECHNICAL',
        defaultTolerance: { min: 0, max: 0.50 },
        defaultBreach: { hardMax: 0.60, severity: 'HARD' },
      },
      {
        id: 'REGULATORY',
        name: 'Regulatory Path Risk',
        description: 'Uncertainty in regulatory pathway, precedent, endpoint acceptability.',
        category: 'REGULATORY',
        defaultTolerance: { min: 0, max: 0.50 },
        defaultBreach: { hardMax: 0.60, severity: 'HARD' },
      },
    ],
    constraintPatterns: [
      { name: 'Max Single Program Budget', type: 'EXPOSURE', description: 'Maximum budget for any single program', defaultThreshold: 60000000, currency: 'EUR' },
      { name: 'Max Concurrent Programs', type: 'CONCENTRATION', description: 'Maximum number of concurrent programs', defaultThreshold: 8 },
    ],
    fieldHints: {
      dimensions: 'Define risk categories for drug development (biology, translation, safety, CMC, regulatory)',
      toleranceBand: 'The range of risk scores acceptable for program advancement',
      breachThreshold: 'The hard limit that triggers senior governance review',
      portfolioConstraints: 'Pipeline-level limits for budget and program concentration',
      tradeoffs: 'Define when low safety risk can offset higher biology uncertainty',
    },
  },

  GENERIC: {
    recommendedCount: {
      default: 5,
      min: 4,
      max: 8,
      typical: '4-8 dimensions covering key risk categories',
    },
    dimensionPatterns: [
      {
        id: 'EXECUTION',
        name: 'Execution Risk',
        description: 'Risk of failure to deliver expected outcomes.',
        category: 'EXECUTION',
        defaultTolerance: { min: 0, max: 0.60 },
        defaultBreach: { hardMax: 0.70, severity: 'HARD' },
      },
      {
        id: 'MARKET',
        name: 'Market Risk',
        description: 'Risk from market conditions and external factors.',
        category: 'MARKET',
        defaultTolerance: { min: 0, max: 0.55 },
        defaultBreach: { hardMax: 0.65, severity: 'HARD' },
      },
      {
        id: 'FINANCIAL',
        name: 'Financial Risk',
        description: 'Risk of financial loss or capital impairment.',
        category: 'FINANCIAL',
        defaultTolerance: { min: 0, max: 0.50 },
        defaultBreach: { hardMax: 0.60, severity: 'HARD' },
      },
      {
        id: 'OPERATIONAL',
        name: 'Operational Risk',
        description: 'Risk from internal processes and controls.',
        category: 'OPERATIONAL',
        defaultTolerance: { min: 0, max: 0.55 },
        defaultBreach: { hardMax: 0.65, severity: 'SOFT' },
      },
      {
        id: 'REGULATORY',
        name: 'Regulatory Risk',
        description: 'Risk from regulatory and compliance requirements.',
        category: 'REGULATORY',
        defaultTolerance: { min: 0, max: 0.45 },
        defaultBreach: { hardMax: 0.55, severity: 'HARD' },
      },
    ],
    constraintPatterns: [
      { name: 'Max Single Exposure', type: 'CONCENTRATION', description: 'Maximum % in any single position', defaultThreshold: 15, unit: '%' },
      { name: 'Max Top 5 Exposure', type: 'CONCENTRATION', description: 'Maximum % in top 5 positions', defaultThreshold: 50, unit: '%' },
    ],
    fieldHints: {
      dimensions: 'Define the key risk categories relevant to your portfolio',
      toleranceBand: 'The range of risk scores that are normally acceptable',
      breachThreshold: 'The hard limit that triggers exception & escalation',
      portfolioConstraints: 'Portfolio-level concentration limits',
      tradeoffs: 'Define when exceeding one dimension can be offset by another',
    },
  },
};

// =============================================================================
// VC TEMPLATES (Conservative, Balanced, Aggressive)
// =============================================================================

function createVCRiskAppetiteTemplates(): RiskAppetiteTemplate[] {
  return [
    // VC — Conservative Core Fund
    {
      id: 'vc-conservative',
      name: 'VC – Conservative Core Fund',
      description: 'Capital preservation oriented early-stage fund with strict regulatory and concentration controls.',
      industry: 'VENTURE_CAPITAL',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'VC – Conservative Core Fund',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Capital preservation oriented early-stage fund with strict regulatory and concentration controls.',
        },
        dimensions: [
          { id: 'TEAM', name: 'Team Risk', description: 'Execution capability and cohesion.', category: 'EXECUTION', tolerance: { min: 0, max: 0.55 }, breach: { hardMax: 0.65, severity: 'HARD' } },
          { id: 'TECHNICAL', name: 'Technical Risk', description: 'Feasibility and R&D uncertainty.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.60 }, breach: { hardMax: 0.70, severity: 'HARD' } },
          { id: 'MARKET', name: 'Market Risk', description: 'Demand and competition uncertainty.', category: 'MARKET', tolerance: { min: 0, max: 0.55 }, breach: { hardMax: 0.65, severity: 'HARD' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Compliance and regulatory burden.', category: 'REGULATORY', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'LIQUIDITY', name: 'Liquidity Risk', description: 'Exit timing uncertainty.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.55 }, breach: { hardMax: 0.65, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Case Exposure', type: 'CONCENTRATION', threshold: 10, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Top 5 Exposure', type: 'CONCENTRATION', threshold: 40, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c3', name: 'Max Single Theme Exposure', type: 'SECTOR', threshold: 25, operator: 'MAX', unit: '%', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [],
      },
    },

    // VC — Balanced Core Fund (DEFAULT)
    {
      id: 'vc-balanced',
      name: 'VC – Balanced Core Fund',
      description: 'Balanced early-stage fund with selective appetite for technical and market risk.',
      industry: 'VENTURE_CAPITAL',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'VC – Balanced Core Fund',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Balanced early-stage fund with selective appetite for technical and market risk.',
        },
        dimensions: [
          { id: 'TEAM', name: 'Team Risk', description: 'Execution capability.', category: 'EXECUTION', tolerance: { min: 0, max: 0.65 }, breach: { hardMax: 0.75, severity: 'HARD' } },
          { id: 'TECHNICAL', name: 'Technical Risk', description: 'R&D and performance uncertainty.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'HARD' } },
          { id: 'MARKET', name: 'Market Risk', description: 'Demand and competition.', category: 'MARKET', tolerance: { min: 0, max: 0.65 }, breach: { hardMax: 0.75, severity: 'HARD' } },
          { id: 'FINANCING', name: 'Financing Risk', description: 'Future funding dependency.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.65 }, breach: { hardMax: 0.75, severity: 'SOFT' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Compliance exposure.', category: 'REGULATORY', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Case Exposure', type: 'CONCENTRATION', threshold: 12, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Top 5 Exposure', type: 'CONCENTRATION', threshold: 45, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c3', name: 'Max Single Theme Exposure', type: 'SECTOR', threshold: 30, operator: 'MAX', unit: '%', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'DOCUMENT_MITIGATIONS'],
        },
        tradeoffs: [
          {
            id: 'VC_TO_1',
            if: { dimension: 'REGULATORY', max: 0.30 },
            then: { dimension: 'TECHNICAL', maxAllowedIncrease: 0.10 },
            rationale: 'Low regulatory risk allows higher technical uncertainty.',
          },
        ],
      },
    },

    // VC — Aggressive / Frontier Tech
    {
      id: 'vc-aggressive',
      name: 'VC – Aggressive / Frontier Tech',
      description: 'High-risk deeptech and frontier technology fund with elevated technical tolerance.',
      industry: 'VENTURE_CAPITAL',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'VC – Aggressive / Frontier Tech',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'High-risk deeptech and frontier technology fund with elevated technical tolerance.',
        },
        dimensions: [
          { id: 'TEAM', name: 'Team Risk', description: 'Execution capability for deeptech.', category: 'EXECUTION', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'HARD' } },
          { id: 'TECHNICAL', name: 'Technical Risk', description: 'Novel technology feasibility.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.80 }, breach: { hardMax: 0.90, severity: 'HARD' } },
          { id: 'MARKET', name: 'Market Risk', description: 'New market creation uncertainty.', category: 'MARKET', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'SOFT' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Emerging regulatory landscape.', category: 'REGULATORY', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'TIMELINE', name: 'Timeline Risk', description: 'Extended development timelines.', category: 'EXECUTION', tolerance: { min: 0, max: 0.75 }, breach: { hardMax: 0.85, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Case Exposure', type: 'CONCENTRATION', threshold: 15, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Single Theme Exposure', type: 'SECTOR', threshold: 40, operator: 'MAX', unit: '%', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [
          {
            id: 'VC_AG_TO_1',
            if: { dimension: 'TEAM', max: 0.50 },
            then: { dimension: 'TECHNICAL', maxAllowedIncrease: 0.10 },
            rationale: 'Strong team allows higher technical risk tolerance.',
          },
        ],
      },
    },

    // VC — Opportunistic / Special Situations
    {
      id: 'vc-opportunistic',
      name: 'VC – Opportunistic / Special Situations',
      description: 'Flexible fund for special situations with high conviction bets.',
      industry: 'VENTURE_CAPITAL',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'VC – Opportunistic / Special Situations',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Flexible fund for special situations with high conviction bets.',
        },
        dimensions: [
          { id: 'TEAM', name: 'Team Risk', description: 'Execution and track record.', category: 'EXECUTION', tolerance: { min: 0, max: 0.60 }, breach: { hardMax: 0.70, severity: 'HARD' } },
          { id: 'TECHNICAL', name: 'Technical Risk', description: 'Technology maturity.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.65 }, breach: { hardMax: 0.75, severity: 'HARD' } },
          { id: 'MARKET', name: 'Market Risk', description: 'Market timing and opportunity.', category: 'MARKET', tolerance: { min: 0, max: 0.75 }, breach: { hardMax: 0.85, severity: 'SOFT' } },
          { id: 'FINANCING', name: 'Financing Risk', description: 'Capital structure complexity.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Case Exposure', type: 'CONCENTRATION', threshold: 20, operator: 'MAX', unit: '%', breachAction: 'WARN' },
          { id: 'c2', name: 'Max Top 3 Exposure', type: 'CONCENTRATION', threshold: 50, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [],
      },
    },
  ];
}

// =============================================================================
// INSURANCE TEMPLATES (Conservative, Balanced, Growth)
// =============================================================================

function createInsuranceRiskAppetiteTemplates(): RiskAppetiteTemplate[] {
  return [
    // Insurance — Conservative Book (DEFAULT)
    {
      id: 'ins-conservative',
      name: 'Insurance – Conservative Book',
      description: 'Capital protection and underwriting discipline focused book.',
      industry: 'INSURANCE',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Insurance – Conservative Book',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Capital protection and underwriting discipline focused book.',
        },
        dimensions: [
          { id: 'PRICING', name: 'Pricing Adequacy Risk', description: 'Risk of underpricing.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'AGGREGATION', name: 'Aggregation Risk', description: 'Correlation and accumulation.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'CAT', name: 'Catastrophe Risk', description: 'Tail catastrophe exposure.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'COUNTERPARTY', name: 'Counterparty Risk', description: 'Reinsurance and credit risk.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.30 }, breach: { hardMax: 0.40, severity: 'HARD' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Insured', type: 'CONCENTRATION', threshold: 5, operator: 'MAX', unit: '%', currency: 'GBP', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Top 10 Exposure', type: 'CONCENTRATION', threshold: 35, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c3', name: 'Max CAT Zone Exposure', type: 'GEOGRAPHIC', threshold: 20, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [],
      },
    },

    // Insurance — Balanced Book
    {
      id: 'ins-balanced',
      name: 'Insurance – Balanced Book',
      description: 'Balanced underwriting appetite for diversified specialty lines.',
      industry: 'INSURANCE',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Insurance – Balanced Book',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Balanced underwriting appetite for diversified specialty lines.',
        },
        dimensions: [
          { id: 'PRICING', name: 'Pricing Adequacy Risk', description: 'Premium adequacy vs technical price.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'AGGREGATION', name: 'Aggregation Risk', description: 'Correlated loss accumulation.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
          { id: 'CAT', name: 'Catastrophe Risk', description: 'Cat event exposure.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'COUNTERPARTY', name: 'Counterparty Risk', description: 'Reinsurance credit risk.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'RESERVING', name: 'Reserving Risk', description: 'Claims reserve uncertainty.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Insured', type: 'CONCENTRATION', threshold: 7, operator: 'MAX', unit: '%', currency: 'GBP', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Top 10 Exposure', type: 'CONCENTRATION', threshold: 40, operator: 'MAX', unit: '%', breachAction: 'WARN' },
          { id: 'c3', name: 'Max CAT Zone Exposure', type: 'GEOGRAPHIC', threshold: 25, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'REQUIRE_RISK_SIGNOFF'],
        },
        tradeoffs: [
          {
            id: 'INS_TO_1',
            if: { dimension: 'PRICING', max: 0.25 },
            then: { dimension: 'RESERVING', maxAllowedIncrease: 0.10 },
            rationale: 'Strong pricing allows higher reserving uncertainty.',
          },
        ],
      },
    },

    // Insurance — Growth / Innovation Book
    {
      id: 'ins-growth',
      name: 'Insurance – Growth / Innovation Book',
      description: 'Growth-oriented book for new products, MGAs, and parametric insurance.',
      industry: 'INSURANCE',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Insurance – Growth / Innovation Book',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Growth-oriented book for new products, MGAs, and parametric insurance.',
        },
        dimensions: [
          { id: 'PRICING', name: 'Pricing Risk', description: 'New product pricing uncertainty.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'AGGREGATION', name: 'Aggregation Risk', description: 'New correlation patterns.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'MODEL', name: 'Model Risk', description: 'Limited historical data and model uncertainty.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.55 }, breach: { hardMax: 0.65, severity: 'HARD' } },
          { id: 'OPERATIONAL', name: 'Operational Risk', description: 'New processes and controls.', category: 'OPERATIONAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Product Line', type: 'SECTOR', threshold: 30, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max New Product Allocation', type: 'EXPOSURE', threshold: 25, operator: 'MAX', unit: '%', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [],
      },
    },

    // Insurance — Cyber Book
    {
      id: 'ins-cyber',
      name: 'Insurance – Cyber Book',
      description: 'Risk appetite tailored for cyber insurance with aggregation focus.',
      industry: 'INSURANCE',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Insurance – Cyber Book',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Focus on aggregation and systemic risk given correlation in cyber events.',
        },
        dimensions: [
          { id: 'PRICING', name: 'Pricing Risk', description: 'Premium adequacy vs rapidly evolving loss experience.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'AGGREGATION', name: 'Aggregation Risk', description: 'Systemic exposure to common vendors/software.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'SECURITY_CONTROLS', name: 'Security Controls Risk', description: 'Insured\'s security posture and maturity.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'RANSOMWARE', name: 'Ransomware Risk', description: 'Exposure to ransomware and extortion events.', category: 'FINANCIAL', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Insured', type: 'CONCENTRATION', threshold: 3, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Vendor Aggregation', type: 'CORRELATION', threshold: 10, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'REQUIRE_RISK_SIGNOFF'],
        },
        tradeoffs: [],
      },
    },
  ];
}

// =============================================================================
// PHARMA TEMPLATES (Balanced, Early-Stage, Late-Stage)
// =============================================================================

function createPharmaRiskAppetiteTemplates(): RiskAppetiteTemplate[] {
  return [
    // Pharma — Balanced Pipeline (DEFAULT)
    {
      id: 'pharma-balanced',
      name: 'Pharma – Balanced Pipeline',
      description: 'Balanced mix of early and mid-stage assets with strict safety and regulatory controls.',
      industry: 'PHARMA',
      isDefault: true,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Pharma – Balanced Pipeline',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Balanced mix of early and mid-stage assets with strict safety and regulatory controls.',
        },
        dimensions: [
          { id: 'BIOLOGY', name: 'Biology Risk', description: 'MoA validity.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.65 }, breach: { hardMax: 0.75, severity: 'HARD' } },
          { id: 'TRANSLATION', name: 'Translational Risk', description: 'Preclinical-to-human translation.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.60 }, breach: { hardMax: 0.70, severity: 'HARD' } },
          { id: 'SAFETY', name: 'Safety Risk', description: 'Toxicity and tolerability.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
          { id: 'CMC', name: 'CMC Risk', description: 'Manufacturability and scale-up.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Approval pathway uncertainty.', category: 'REGULATORY', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Program Budget', type: 'EXPOSURE', threshold: 60000000, operator: 'MAX', currency: 'EUR', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Concurrent Programs', type: 'CONCENTRATION', threshold: 8, operator: 'MAX', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'DOCUMENT_MITIGATIONS'],
        },
        tradeoffs: [
          {
            id: 'PH_TO_1',
            if: { dimension: 'SAFETY', max: 0.30 },
            then: { dimension: 'BIOLOGY', maxAllowedIncrease: 0.10 },
            rationale: 'Low safety risk allows higher biology uncertainty early.',
          },
        ],
      },
    },

    // Pharma — Early-Stage Biotech
    {
      id: 'pharma-early-stage',
      name: 'Pharma – Early-Stage Biotech',
      description: 'Higher tolerance for biology/translation risk in discovery and preclinical.',
      industry: 'PHARMA',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Pharma – Early-Stage Biotech',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Higher tolerance for scientific risk, strict on safety.',
        },
        dimensions: [
          { id: 'BIOLOGY', name: 'Biology / MoA Risk', description: 'Novel biology with limited validation.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.75 }, breach: { hardMax: 0.85, severity: 'HARD' } },
          { id: 'TRANSLATION', name: 'Translational Risk', description: 'Uncertainty in human translation.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'HARD' } },
          { id: 'SAFETY', name: 'Safety Risk', description: 'Known or plausible safety liabilities.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'PLATFORM', name: 'Platform Risk', description: 'Novel platform/modality uncertainty.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.70 }, breach: { hardMax: 0.80, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Program', type: 'EXPOSURE', threshold: 40000000, operator: 'MAX', currency: 'EUR', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Single Platform', type: 'SECTOR', threshold: 60, operator: 'MAX', unit: '%', breachAction: 'WARN' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'ALLOW_WITH_WARNING',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
        },
        tradeoffs: [
          {
            id: 'PH_ES_TO_1',
            if: { dimension: 'SAFETY', max: 0.25 },
            then: { dimension: 'BIOLOGY', maxAllowedIncrease: 0.15 },
            rationale: 'Very low safety risk allows significantly higher biology uncertainty.',
          },
        ],
      },
    },

    // Pharma — Late-Stage / Commercial
    {
      id: 'pharma-late-stage',
      name: 'Pharma – Late-Stage / Commercial',
      description: 'Lower risk tolerance for Phase 3 and commercial stage assets.',
      industry: 'PHARMA',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Pharma – Late-Stage / Commercial',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Lower risk tolerance for late-stage clinical and commercial programs.',
        },
        dimensions: [
          { id: 'CLINICAL', name: 'Clinical Execution Risk', description: 'Phase 3 trial execution and endpoints.', category: 'EXECUTION', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
          { id: 'SAFETY', name: 'Safety Risk', description: 'Post-marketing and long-term safety.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'CMC', name: 'CMC Risk', description: 'Commercial scale manufacturing.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Approval and labeling.', category: 'REGULATORY', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'COMMERCIAL', name: 'Commercial Risk', description: 'Market access and competition.', category: 'MARKET', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'SOFT' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Program Budget', type: 'EXPOSURE', threshold: 150000000, operator: 'MAX', currency: 'EUR', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Single TA', type: 'SECTOR', threshold: 40, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'REQUIRE_COMMENTARY',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'DOCUMENT_MITIGATIONS', 'REQUIRE_RISK_SIGNOFF'],
        },
        tradeoffs: [],
      },
    },

    // Pharma — Conservative
    {
      id: 'pharma-conservative',
      name: 'Pharma – Conservative Pipeline',
      description: 'Capital preservation focused with strict controls across all dimensions.',
      industry: 'PHARMA',
      isDefault: false,
      riskAppetite: {
        schemaVersion: 1,
        framework: {
          name: 'Pharma – Conservative Pipeline',
          scale: { type: 'numeric_0_1', min: 0, max: 1 },
          notes: 'Capital preservation focused with strict controls across all dimensions.',
        },
        dimensions: [
          { id: 'BIOLOGY', name: 'Biology Risk', description: 'Validated MoA required.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.50 }, breach: { hardMax: 0.60, severity: 'HARD' } },
          { id: 'TRANSLATION', name: 'Translational Risk', description: 'Proven translation markers.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.45 }, breach: { hardMax: 0.55, severity: 'HARD' } },
          { id: 'SAFETY', name: 'Safety Risk', description: 'Clean safety profile.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.35 }, breach: { hardMax: 0.45, severity: 'HARD' } },
          { id: 'CMC', name: 'CMC Risk', description: 'Proven manufacturing.', category: 'TECHNICAL', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
          { id: 'REGULATORY', name: 'Regulatory Risk', description: 'Clear regulatory pathway.', category: 'REGULATORY', tolerance: { min: 0, max: 0.40 }, breach: { hardMax: 0.50, severity: 'HARD' } },
        ],
        portfolioConstraints: [
          { id: 'c1', name: 'Max Single Program Budget', type: 'EXPOSURE', threshold: 40000000, operator: 'MAX', currency: 'EUR', breachAction: 'BLOCK' },
          { id: 'c2', name: 'Max Concurrent Programs', type: 'CONCENTRATION', threshold: 6, operator: 'MAX', breachAction: 'BLOCK' },
          { id: 'c3', name: 'Max Single TA', type: 'SECTOR', threshold: 35, operator: 'MAX', unit: '%', breachAction: 'BLOCK' },
        ],
        breachPolicy: {
          onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
          onSoftBreach: 'REQUIRE_COMMENTARY',
          requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL', 'DOCUMENT_MITIGATIONS'],
        },
        tradeoffs: [],
      },
    },
  ];
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

const ALL_TEMPLATES: RiskAppetiteTemplate[] = [
  ...createVCRiskAppetiteTemplates(),
  ...createInsuranceRiskAppetiteTemplates(),
  ...createPharmaRiskAppetiteTemplates(),
];

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get templates for a specific industry
 */
export function getTemplatesForIndustry(industry: string): RiskAppetiteTemplate[] {
  const normalizedIndustry = industry.toUpperCase();
  // Map common aliases
  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'INSURANCE': 'INSURANCE',
    'INS': 'INSURANCE',
    'PHARMA': 'PHARMA',
    'PHARMACEUTICAL': 'PHARMA',
  };
  const mappedIndustry = industryMap[normalizedIndustry] || normalizedIndustry;
  return ALL_TEMPLATES.filter(t => t.industry === mappedIndustry);
}

/**
 * Get industry guidance
 */
export function getIndustryGuidance(industry: string): IndustryRiskAppetiteGuidance {
  const normalizedIndustry = industry.toUpperCase();
  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'INSURANCE': 'INSURANCE',
    'INS': 'INSURANCE',
    'PHARMA': 'PHARMA',
    'PHARMACEUTICAL': 'PHARMA',
  };
  const mappedIndustry = industryMap[normalizedIndustry] || normalizedIndustry;
  return INDUSTRY_RISK_APPETITE_GUIDANCE[mappedIndustry] || INDUSTRY_RISK_APPETITE_GUIDANCE.GENERIC;
}

/**
 * Get all templates
 */
export function getAllTemplates(): RiskAppetiteTemplate[] {
  return ALL_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RiskAppetiteTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get default template for industry
 */
export function getDefaultTemplate(industry: string): RiskAppetiteTemplate | undefined {
  return getTemplatesForIndustry(industry).find(t => t.isDefault);
}

/**
 * Create a complete RiskAppetiteModulePayload from a template
 */
export function createRiskAppetiteFromTemplate(template: RiskAppetiteTemplate): RiskAppetiteModulePayload {
  const defaultPayload: RiskAppetiteModulePayload = {
    schemaVersion: 1,
    framework: {
      name: '',
      scale: { type: 'numeric_0_1', min: 0, max: 1 },
    },
    dimensions: [],
    portfolioConstraints: [],
    breachPolicy: {
      onHardBreach: 'BLOCK_UNLESS_EXCEPTION',
      onSoftBreach: 'ALLOW_WITH_WARNING',
      requiredActions: ['LOG_EXCEPTION', 'ESCALATE_APPROVAL'],
    },
  };

  return {
    ...defaultPayload,
    ...template.riskAppetite,
  } as RiskAppetiteModulePayload;
}

/**
 * Get recommended default risk appetite for an industry
 */
export function getRecommendedDefaultRiskAppetite(industry: string): RiskAppetiteModulePayload | null {
  const defaultTemplate = getDefaultTemplate(industry);
  if (!defaultTemplate) return null;
  return createRiskAppetiteFromTemplate(defaultTemplate);
}
