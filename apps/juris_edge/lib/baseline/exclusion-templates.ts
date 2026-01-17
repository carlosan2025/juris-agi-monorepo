/**
 * Exclusion Templates and Industry Guidance
 *
 * This file contains:
 * 1. Industry-specific exclusion templates with pre-filled data
 * 2. Guidance on typical exclusion patterns per industry
 * 3. Dimension and operator explanations per industry
 * 4. Default exclusion sets for quick setup
 *
 * Exclusions define what is NOT admissible into the decision universe unless explicitly overridden.
 * - HARD exclusions: Cannot proceed without exception
 * - CONDITIONAL exclusions: Allowed only if condition met
 */

import type { ExclusionItem, ExclusionType, ExclusionOperator } from './types';

// =============================================================================
// EXCLUSION TYPE DESCRIPTIONS
// =============================================================================

export const EXCLUSION_TYPE_INFO: Record<ExclusionType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  HARD: {
    label: 'Hard',
    description: 'Cannot proceed under any circumstances without formal exception approval. Creates full stop in workflow.',
    icon: 'Ban',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  CONDITIONAL: {
    label: 'Conditional',
    description: 'May proceed only if specific conditions are met and documented. Requires approval and creates audit trail.',
    icon: 'AlertTriangle',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

// =============================================================================
// EXCLUSION OPERATOR INFO
// =============================================================================

export const EXCLUSION_OPERATOR_INFO: Record<ExclusionOperator, {
  label: string;
  description: string;
  example: string;
  valueType: 'single' | 'multiple' | 'none' | 'numeric';
}> = {
  EQUALS: {
    label: 'Equals',
    description: 'Value must exactly match',
    example: 'jurisdiction EQUALS "RU"',
    valueType: 'single',
  },
  NOT_EQUALS: {
    label: 'Not Equals',
    description: 'Value must not match',
    example: 'status NOT_EQUALS "approved"',
    valueType: 'single',
  },
  CONTAINS: {
    label: 'Contains',
    description: 'Value contains the specified text/element',
    example: 'technology CONTAINS "cryptocurrency"',
    valueType: 'single',
  },
  NOT_CONTAINS: {
    label: 'Does Not Contain',
    description: 'Value does not contain the specified text/element',
    example: 'controls NOT_CONTAINS "MFA"',
    valueType: 'single',
  },
  GREATER_THAN: {
    label: 'Greater Than',
    description: 'Numeric value exceeds threshold',
    example: 'exposure GREATER_THAN 50000000',
    valueType: 'numeric',
  },
  LESS_THAN: {
    label: 'Less Than',
    description: 'Numeric value below threshold',
    example: 'recurring_revenue LESS_THAN 50',
    valueType: 'numeric',
  },
  IN: {
    label: 'In List',
    description: 'Value is one of the specified values',
    example: 'country IN ["RU", "IR", "KP"]',
    valueType: 'multiple',
  },
  NOT_IN: {
    label: 'Not In List',
    description: 'Value is not one of the specified values',
    example: 'controls NOT_IN ["MFA", "Backups"]',
    valueType: 'multiple',
  },
  MATCHES_REGEX: {
    label: 'Matches Pattern',
    description: 'Value matches regular expression pattern',
    example: 'domain MATCHES_REGEX "^gambling.*"',
    valueType: 'single',
  },
  IS_TRUE: {
    label: 'Is True',
    description: 'Boolean field is true',
    example: 'hasUnresolvedLitigation IS_TRUE',
    valueType: 'none',
  },
  IS_FALSE: {
    label: 'Is False',
    description: 'Boolean field is false',
    example: 'hasRequiredCertifications IS_FALSE',
    valueType: 'none',
  },
};

// =============================================================================
// INDUSTRY EXCLUSION GUIDANCE
// =============================================================================

export interface IndustryExclusionGuidance {
  recommendedCount: {
    default: number;
    min: number;
    max: number;
    typical: string;
    complex: string;
  };
  exclusionPatterns: {
    type: ExclusionType;
    name: string;
    description: string;
    whenToUse: string;
  }[];
  dimensionHints: {
    dimension: string;
    description: string;
    commonOperators: ExclusionOperator[];
    examples: string[];
  }[];
  commonExclusions: string[];
}

export const INDUSTRY_EXCLUSION_GUIDANCE: Record<string, IndustryExclusionGuidance> = {
  VENTURE_CAPITAL: {
    recommendedCount: {
      default: 5,
      min: 3,
      max: 15,
      typical: '5-8 exclusions (regulatory + sector + ethics)',
      complex: '10-15 exclusions for ESG-focused or regulated funds',
    },
    exclusionPatterns: [
      {
        type: 'HARD',
        name: 'Regulatory/Sanctions',
        description: 'Jurisdictions and entities under sanctions or regulatory prohibition',
        whenToUse: 'Always include. Non-negotiable compliance requirements.',
      },
      {
        type: 'HARD',
        name: 'Sector Ban',
        description: 'Industries completely off-limits (tobacco, weapons, etc.)',
        whenToUse: 'When fund documents or LP agreements prohibit specific sectors.',
      },
      {
        type: 'CONDITIONAL',
        name: 'Risk Factors',
        description: 'High-risk factors that require additional scrutiny',
        whenToUse: 'For areas requiring expert review or risk mitigation plans.',
      },
    ],
    dimensionHints: [
      {
        dimension: 'jurisdiction',
        description: 'Country or region where the company operates or is incorporated',
        commonOperators: ['IN', 'NOT_IN', 'EQUALS'],
        examples: ['Sanctioned countries', 'High-risk jurisdictions', 'Tax havens'],
      },
      {
        dimension: 'sector',
        description: 'Industry or business sector classification',
        commonOperators: ['IN', 'EQUALS', 'CONTAINS'],
        examples: ['Tobacco', 'Weapons', 'Gambling', 'Adult content'],
      },
      {
        dimension: 'businessModel',
        description: 'Type of business model or revenue approach',
        commonOperators: ['EQUALS', 'CONTAINS'],
        examples: ['Consumer social network', 'Pure crypto speculation', 'Advertising-only'],
      },
      {
        dimension: 'technology',
        description: 'Core technology or technical approach',
        commonOperators: ['CONTAINS', 'IN'],
        examples: ['Cryptocurrency', 'Surveillance tech', 'Autonomous weapons'],
      },
      {
        dimension: 'ethics',
        description: 'Ethical concerns or practices',
        commonOperators: ['CONTAINS', 'IN'],
        examples: ['Dark patterns', 'Deceptive UX', 'Privacy violations'],
      },
      {
        dimension: 'revenueQuality',
        description: 'Revenue sustainability and quality metrics',
        commonOperators: ['LESS_THAN', 'GREATER_THAN'],
        examples: ['% recurring revenue', 'Customer concentration', 'Churn rate'],
      },
    ],
    commonExclusions: [
      'Sanctioned jurisdictions (RU, IR, KP)',
      'Tobacco & nicotine products',
      'Weapons & defense contractors',
      'Adult content & gambling',
      'Cryptocurrency without regulatory compliance',
      'Companies with unresolved litigation',
      'Dark patterns / deceptive UX',
      'Data privacy violations',
    ],
  },

  INSURANCE: {
    recommendedCount: {
      default: 7,
      min: 5,
      max: 20,
      typical: '7-12 exclusions (regulatory + risk + contractual)',
      complex: '15-20 for specialty lines or high-risk territories',
    },
    exclusionPatterns: [
      {
        type: 'HARD',
        name: 'Regulatory/Sanctions',
        description: 'Sanctioned territories and prohibited activities',
        whenToUse: 'Mandatory for all books. Regulatory compliance.',
      },
      {
        type: 'HARD',
        name: 'Aggregation Limits',
        description: 'CAT accumulation and portfolio concentration controls',
        whenToUse: 'When exposure thresholds would breach risk appetite.',
      },
      {
        type: 'CONDITIONAL',
        name: 'Underwriting Controls',
        description: 'Risks requiring remediation or additional review',
        whenToUse: 'For borderline risks with remediation potential.',
      },
    ],
    dimensionHints: [
      {
        dimension: 'territory',
        description: 'Geographic location of risk',
        commonOperators: ['IN', 'NOT_IN', 'EQUALS'],
        examples: ['Sanctioned territories', 'CAT-exposed zones', 'War zones'],
      },
      {
        dimension: 'industry',
        description: 'Insured\'s industry classification',
        commonOperators: ['IN', 'EQUALS', 'CONTAINS'],
        examples: ['Illegal gambling', 'Unlicensed financial services', 'Mining'],
      },
      {
        dimension: 'cyberControls',
        description: 'Cybersecurity controls and practices',
        commonOperators: ['NOT_IN', 'NOT_CONTAINS', 'IS_FALSE'],
        examples: ['MFA absent', 'No offline backups', 'Unpatched systems'],
      },
      {
        dimension: 'riskAggregation',
        description: 'Portfolio accumulation metrics',
        commonOperators: ['GREATER_THAN', 'LESS_THAN'],
        examples: ['CAT threshold', 'Single risk limit', 'Event limit'],
      },
      {
        dimension: 'contractTerms',
        description: 'Policy terms and conditions',
        commonOperators: ['CONTAINS', 'IN'],
        examples: ['Unlimited liability', 'Punitive damages', 'No subrogation'],
      },
      {
        dimension: 'claimsHistory',
        description: 'Historical claims experience',
        commonOperators: ['GREATER_THAN', 'IS_TRUE'],
        examples: ['Loss ratio > threshold', 'Fraud history', 'Prior coverage denial'],
      },
    ],
    commonExclusions: [
      'Sanctioned territories',
      'Illegal or unlicensed activities',
      'CAT accumulation breach',
      'Missing cyber controls (MFA, backups)',
      'Unlimited liability clauses',
      'Unacceptable contract terms',
      'Prior fraud or misrepresentation',
      'Known attritional loss sources',
    ],
  },

  PHARMA: {
    recommendedCount: {
      default: 6,
      min: 4,
      max: 15,
      typical: '6-10 exclusions (safety + IP + regulatory + commercial)',
      complex: '12-15 for high-risk therapeutic areas or novel modalities',
    },
    exclusionPatterns: [
      {
        type: 'HARD',
        name: 'Safety/Toxicity',
        description: 'Unresolved safety signals or unacceptable toxicity profiles',
        whenToUse: 'When patient safety cannot be assured.',
      },
      {
        type: 'HARD',
        name: 'IP/FTO Issues',
        description: 'Unclear IP ownership or freedom-to-operate concerns',
        whenToUse: 'When chain of title is disputed or blocking patents exist.',
      },
      {
        type: 'CONDITIONAL',
        name: 'Development Risk',
        description: 'High development risk requiring expert validation',
        whenToUse: 'For novel pathways or unprecedented regulatory strategies.',
      },
    ],
    dimensionHints: [
      {
        dimension: 'safetyProfile',
        description: 'Safety and toxicity data',
        commonOperators: ['CONTAINS', 'IS_TRUE', 'EQUALS'],
        examples: ['Unresolved toxicity', 'Black box warning risk', 'Off-target effects'],
      },
      {
        dimension: 'ipStatus',
        description: 'Intellectual property and freedom-to-operate status',
        commonOperators: ['EQUALS', 'IN', 'CONTAINS'],
        examples: ['Unclear ownership', 'Blocking patents', 'License disputes'],
      },
      {
        dimension: 'regulatoryPath',
        description: 'Regulatory approval pathway clarity',
        commonOperators: ['EQUALS', 'CONTAINS'],
        examples: ['No precedent', 'Unclear endpoints', 'Regulatory pushback'],
      },
      {
        dimension: 'clinicalDesign',
        description: 'Clinical trial design and endpoints',
        commonOperators: ['CONTAINS', 'IN', 'IS_TRUE'],
        examples: ['Non-measurable endpoints', 'Unethical design', 'Underpowered trials'],
      },
      {
        dimension: 'manufacturing',
        description: 'CMC and manufacturing feasibility',
        commonOperators: ['EQUALS', 'CONTAINS'],
        examples: ['Unscalable CMC', 'Unstable formulation', 'Supply chain risk'],
      },
      {
        dimension: 'commercialViability',
        description: 'Commercial and market viability',
        commonOperators: ['LESS_THAN', 'GREATER_THAN', 'CONTAINS'],
        examples: ['Market too small', 'Pricing pressure', 'Generic competition'],
      },
    ],
    commonExclusions: [
      'Unresolved severe toxicity',
      'Unclear IP ownership',
      'No regulatory precedent',
      'Non-measurable clinical endpoints',
      'Unscalable manufacturing',
      'Insufficient commercial potential',
      'Unethical trial design',
      'Platform technology without validation',
    ],
  },

  GENERIC: {
    recommendedCount: {
      default: 3,
      min: 1,
      max: 10,
      typical: '3-5 basic exclusions',
      complex: '6-10 for specialized requirements',
    },
    exclusionPatterns: [
      {
        type: 'HARD',
        name: 'Compliance',
        description: 'Regulatory and legal compliance requirements',
        whenToUse: 'For non-negotiable regulatory requirements.',
      },
      {
        type: 'CONDITIONAL',
        name: 'Risk Assessment',
        description: 'Areas requiring additional review or mitigation',
        whenToUse: 'For borderline cases requiring expert judgment.',
      },
    ],
    dimensionHints: [
      {
        dimension: 'compliance',
        description: 'Regulatory and legal compliance status',
        commonOperators: ['IS_FALSE', 'EQUALS', 'CONTAINS'],
        examples: ['Missing licenses', 'Pending litigation', 'Regulatory violations'],
      },
      {
        dimension: 'risk',
        description: 'General risk indicators',
        commonOperators: ['GREATER_THAN', 'LESS_THAN', 'IN'],
        examples: ['Risk score', 'Quality rating', 'Concentration'],
      },
    ],
    commonExclusions: [
      'Regulatory non-compliance',
      'Unacceptable risk level',
      'Insufficient documentation',
    ],
  },
};

// =============================================================================
// EXCLUSION TEMPLATE TYPE
// =============================================================================

export interface ExclusionTemplate {
  id: string;
  name: string;
  type: ExclusionType;
  description: string;
  industry: string;
  isDefault: boolean;
  exclusion: Omit<ExclusionItem, 'id'>;
}

// =============================================================================
// VC EXCLUSION TEMPLATES
// =============================================================================

const VC_EXCLUSION_TEMPLATES: ExclusionTemplate[] = [
  // HARD Exclusions
  {
    id: 'vc-excl-sanctions',
    name: 'Sanctioned Jurisdictions',
    type: 'HARD',
    description: 'Companies incorporated in or primarily operating from sanctioned countries',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Sanctioned Jurisdictions',
      type: 'HARD',
      dimension: 'jurisdiction',
      operator: 'IN',
      values: ['RU', 'IR', 'KP', 'CU', 'SY', 'BY'],
      rationale: 'Sanctions compliance and regulatory requirements. Investments in these jurisdictions are prohibited by law.',
    },
  },
  {
    id: 'vc-excl-tobacco',
    name: 'Tobacco & Nicotine',
    type: 'HARD',
    description: 'Companies primarily involved in tobacco or nicotine products',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Tobacco & Nicotine Products',
      type: 'HARD',
      dimension: 'sector',
      operator: 'IN',
      values: ['tobacco', 'nicotine', 'vaping', 'e-cigarettes'],
      rationale: 'ESG policy exclusion. Health and regulatory risks, reputational concerns.',
    },
  },
  {
    id: 'vc-excl-weapons',
    name: 'Weapons & Defense',
    type: 'HARD',
    description: 'Companies manufacturing weapons or controversial defense systems',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Weapons & Defense Contractors',
      type: 'HARD',
      dimension: 'sector',
      operator: 'IN',
      values: ['weapons manufacturing', 'cluster munitions', 'landmines', 'autonomous weapons'],
      rationale: 'ESG policy exclusion. Ethical concerns and LP restrictions.',
    },
  },
  {
    id: 'vc-excl-gambling',
    name: 'Gambling & Adult Content',
    type: 'HARD',
    description: 'Companies in gambling or adult entertainment sectors',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'Gambling & Adult Content',
      type: 'HARD',
      dimension: 'sector',
      operator: 'IN',
      values: ['gambling', 'casino', 'adult content', 'pornography'],
      rationale: 'Regulatory complexity and LP restrictions.',
    },
  },
  {
    id: 'vc-excl-dark-patterns',
    name: 'Deceptive UX Practices',
    type: 'HARD',
    description: 'Companies using dark patterns or deceptive user interfaces',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'Deceptive UX / Dark Patterns',
      type: 'HARD',
      dimension: 'ethics',
      operator: 'CONTAINS',
      values: ['dark patterns', 'deceptive UX', 'manipulative design'],
      rationale: 'Reputational risk and regulatory scrutiny. Increasingly targeted by regulators.',
    },
  },

  // CONDITIONAL Exclusions
  {
    id: 'vc-excl-crypto',
    name: 'Cryptocurrency (Conditional)',
    type: 'CONDITIONAL',
    description: 'Crypto-related companies require additional regulatory review',
    industry: 'VENTURE_CAPITAL',
    isDefault: true,
    exclusion: {
      name: 'Cryptocurrency / Web3',
      type: 'CONDITIONAL',
      dimension: 'technology',
      operator: 'CONTAINS',
      values: ['cryptocurrency', 'web3', 'defi', 'token'],
      condition: [{
        field: 'regulatoryStatus',
        operator: 'EQUALS',
        value: 'compliant',
        logic: 'AND',
      }],
      rationale: 'Regulatory uncertainty and volatility. Allowed only with clear regulatory compliance and non-speculative primary revenue.',
      approvalRequired: {
        roles: ['partner', 'compliance'],
        minApprovers: 2,
      },
    },
  },
  {
    id: 'vc-excl-low-recurring',
    name: 'Low Recurring Revenue',
    type: 'CONDITIONAL',
    description: 'Companies with less than 50% recurring revenue',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'Low Recurring Revenue',
      type: 'CONDITIONAL',
      dimension: 'revenueQuality',
      operator: 'LESS_THAN',
      values: [50],
      condition: [{
        field: 'recurringRevenuePath',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Business model sustainability concern. Allowed only with clear path to recurring revenue within 18 months.',
      approvalRequired: {
        roles: ['partner'],
        minApprovers: 1,
      },
    },
  },
  {
    id: 'vc-excl-consumer-social',
    name: 'Consumer Social Networks',
    type: 'CONDITIONAL',
    description: 'Consumer social networks face defensibility and regulatory challenges',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'Consumer Social Network',
      type: 'CONDITIONAL',
      dimension: 'businessModel',
      operator: 'EQUALS',
      values: ['consumer_social_network'],
      condition: [{
        field: 'networkEffectsValidated',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Low defensibility and adverse regulatory dynamics. Requires validated network effects.',
      approvalRequired: {
        roles: ['partner'],
        minApprovers: 2,
      },
    },
  },
  {
    id: 'vc-excl-high-customer-concentration',
    name: 'High Customer Concentration',
    type: 'CONDITIONAL',
    description: 'Companies with >30% revenue from single customer',
    industry: 'VENTURE_CAPITAL',
    isDefault: false,
    exclusion: {
      name: 'High Customer Concentration',
      type: 'CONDITIONAL',
      dimension: 'revenueQuality',
      operator: 'GREATER_THAN',
      values: [30],
      condition: [{
        field: 'diversificationPlan',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Revenue concentration risk. Allowed only with credible diversification plan.',
      approvalRequired: {
        roles: ['partner'],
        minApprovers: 1,
      },
    },
  },
];

// =============================================================================
// INSURANCE EXCLUSION TEMPLATES
// =============================================================================

const INSURANCE_EXCLUSION_TEMPLATES: ExclusionTemplate[] = [
  // HARD Exclusions
  {
    id: 'ins-excl-sanctioned',
    name: 'Sanctioned Territories',
    type: 'HARD',
    description: 'Risks located in or involving sanctioned territories',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Sanctioned Territories',
      type: 'HARD',
      dimension: 'territory',
      operator: 'IN',
      values: ['Sanctioned', 'RU', 'IR', 'KP', 'CU', 'SY'],
      rationale: 'Regulatory and sanctions compliance. Non-negotiable.',
    },
  },
  {
    id: 'ins-excl-illegal-activities',
    name: 'Illegal/Unlicensed Activities',
    type: 'HARD',
    description: 'Insureds engaged in illegal or unlicensed activities',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Illegal/Unlicensed Activities',
      type: 'HARD',
      dimension: 'industry',
      operator: 'IN',
      values: ['illegal gambling', 'unlicensed financial services', 'money laundering'],
      rationale: 'Unacceptable legal and moral hazard. Coverage void ab initio risk.',
    },
  },
  {
    id: 'ins-excl-cat-breach',
    name: 'CAT Accumulation Breach',
    type: 'HARD',
    description: 'Risk would breach catastrophe accumulation limits',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'CAT Accumulation Breach',
      type: 'HARD',
      dimension: 'riskAggregation',
      operator: 'GREATER_THAN',
      values: ['CAT_THRESHOLD'],
      rationale: 'Catastrophe accumulation management. Portfolio protection.',
    },
  },
  {
    id: 'ins-excl-war-zones',
    name: 'Active War Zones',
    type: 'HARD',
    description: 'Risks located in active conflict zones',
    industry: 'INSURANCE',
    isDefault: false,
    exclusion: {
      name: 'Active War/Conflict Zones',
      type: 'HARD',
      dimension: 'territory',
      operator: 'IN',
      values: ['active conflict zone', 'war zone', 'civil war'],
      rationale: 'Uninsurable risk profile. Standard war exclusion.',
    },
  },

  // CONDITIONAL Exclusions
  {
    id: 'ins-excl-cyber-controls',
    name: 'Missing Cyber Controls',
    type: 'CONDITIONAL',
    description: 'Insureds lacking basic cybersecurity controls',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Missing Cyber Controls',
      type: 'CONDITIONAL',
      dimension: 'cyberControls',
      operator: 'NOT_IN',
      values: ['MFA', 'Offline backups', 'EDR'],
      condition: [{
        field: 'remediationPlan',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Cyber loss frequency and severity control. Allowed only with remediation plan agreed and verified prior to inception.',
      approvalRequired: {
        roles: ['underwriter', 'cyber_specialist'],
        minApprovers: 1,
      },
    },
  },
  {
    id: 'ins-excl-unlimited-liability',
    name: 'Unlimited Liability Terms',
    type: 'CONDITIONAL',
    description: 'Contracts containing unlimited liability clauses',
    industry: 'INSURANCE',
    isDefault: true,
    exclusion: {
      name: 'Unlimited Liability Terms',
      type: 'CONDITIONAL',
      dimension: 'contractTerms',
      operator: 'CONTAINS',
      values: ['unlimited liability', 'uncapped exposure'],
      condition: [{
        field: 'legalReviewApproved',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Tail risk control. Allowed only with legal review and pricing uplift.',
      approvalRequired: {
        roles: ['senior_underwriter', 'legal'],
        minApprovers: 2,
      },
    },
  },
  {
    id: 'ins-excl-poor-claims-history',
    name: 'Poor Claims History',
    type: 'CONDITIONAL',
    description: 'Insureds with adverse claims experience',
    industry: 'INSURANCE',
    isDefault: false,
    exclusion: {
      name: 'Adverse Claims History',
      type: 'CONDITIONAL',
      dimension: 'claimsHistory',
      operator: 'GREATER_THAN',
      values: [150],
      condition: [{
        field: 'riskImprovementPlan',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Loss ratio control. Requires documented risk improvement plan.',
      approvalRequired: {
        roles: ['senior_underwriter'],
        minApprovers: 1,
      },
    },
  },
  {
    id: 'ins-excl-punitive-damages',
    name: 'Punitive Damages Coverage',
    type: 'CONDITIONAL',
    description: 'Requests for punitive damages coverage',
    industry: 'INSURANCE',
    isDefault: false,
    exclusion: {
      name: 'Punitive Damages Coverage',
      type: 'CONDITIONAL',
      dimension: 'contractTerms',
      operator: 'CONTAINS',
      values: ['punitive damages', 'exemplary damages'],
      condition: [{
        field: 'jurisdictionPermits',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Legal and public policy concerns. Only where jurisdiction permits and priced appropriately.',
      approvalRequired: {
        roles: ['senior_underwriter', 'legal'],
        minApprovers: 2,
      },
    },
  },
];

// =============================================================================
// PHARMA EXCLUSION TEMPLATES
// =============================================================================

const PHARMA_EXCLUSION_TEMPLATES: ExclusionTemplate[] = [
  // HARD Exclusions
  {
    id: 'ph-excl-toxicity',
    name: 'Unresolved Severe Toxicity',
    type: 'HARD',
    description: 'Assets with unresolved severe toxicity signals',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'Unresolved Severe Toxicity',
      type: 'HARD',
      dimension: 'safetyProfile',
      operator: 'CONTAINS',
      values: ['unresolved severe toxicity', 'fatal adverse events', 'black box warning'],
      rationale: 'Unacceptable patient risk. Safety signals must be resolved or mitigated.',
    },
  },
  {
    id: 'ph-excl-ip-unclear',
    name: 'Unclear IP Ownership',
    type: 'HARD',
    description: 'Assets with disputed or unclear intellectual property',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'Unclear IP Ownership',
      type: 'HARD',
      dimension: 'ipStatus',
      operator: 'EQUALS',
      values: ['unclear ownership', 'disputed', 'pending litigation'],
      rationale: 'Chain-of-title and freedom-to-operate risk. Cannot proceed without clear IP position.',
    },
  },
  {
    id: 'ph-excl-non-measurable',
    name: 'Non-Measurable Endpoints',
    type: 'HARD',
    description: 'Clinical programs with non-measurable primary endpoints',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'Non-Measurable Clinical Endpoints',
      type: 'HARD',
      dimension: 'clinicalDesign',
      operator: 'CONTAINS',
      values: ['non-measurable endpoints', 'subjective endpoints without validation'],
      rationale: 'Inability to demonstrate efficacy. Regulatory approval risk.',
    },
  },
  {
    id: 'ph-excl-unethical-design',
    name: 'Unethical Trial Design',
    type: 'HARD',
    description: 'Clinical trials with ethical concerns',
    industry: 'PHARMA',
    isDefault: false,
    exclusion: {
      name: 'Unethical Clinical Design',
      type: 'HARD',
      dimension: 'clinicalDesign',
      operator: 'CONTAINS',
      values: ['unethical design', 'no equipoise', 'inappropriate placebo'],
      rationale: 'Ethical and regulatory concerns. IRB/Ethics committee rejection risk.',
    },
  },

  // CONDITIONAL Exclusions
  {
    id: 'ph-excl-no-precedent',
    name: 'No Regulatory Precedent',
    type: 'CONDITIONAL',
    description: 'Novel regulatory pathways without precedent',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'No Regulatory Precedent',
      type: 'CONDITIONAL',
      dimension: 'regulatoryPath',
      operator: 'EQUALS',
      values: ['no precedent', 'first-in-class pathway'],
      condition: [{
        field: 'regulatoryStrategyValidated',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Approval feasibility risk. Allowed only with written regulatory strategy and external expert opinion.',
      approvalRequired: {
        roles: ['regulatory_expert', 'medical_director'],
        minApprovers: 2,
      },
    },
  },
  {
    id: 'ph-excl-unscalable-cmc',
    name: 'Unscalable Manufacturing',
    type: 'CONDITIONAL',
    description: 'Manufacturing processes that cannot scale commercially',
    industry: 'PHARMA',
    isDefault: true,
    exclusion: {
      name: 'Unscalable CMC',
      type: 'CONDITIONAL',
      dimension: 'manufacturing',
      operator: 'EQUALS',
      values: ['unscalable CMC', 'process not transferable'],
      condition: [{
        field: 'cmcRemediationPlan',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Commercial viability risk. Allowed only with credible CMC remediation and cost-of-goods plan.',
      approvalRequired: {
        roles: ['cmc_expert'],
        minApprovers: 1,
      },
    },
  },
  {
    id: 'ph-excl-small-market',
    name: 'Insufficient Market Size',
    type: 'CONDITIONAL',
    description: 'Markets too small for commercial viability',
    industry: 'PHARMA',
    isDefault: false,
    exclusion: {
      name: 'Insufficient Market Size',
      type: 'CONDITIONAL',
      dimension: 'commercialViability',
      operator: 'LESS_THAN',
      values: [500],
      condition: [{
        field: 'orphanDrugDesignation',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Commercial viability concern. May proceed with orphan drug designation or premium pricing strategy.',
      approvalRequired: {
        roles: ['commercial_lead'],
        minApprovers: 1,
      },
    },
  },
  {
    id: 'ph-excl-blocking-patents',
    name: 'Blocking Patents',
    type: 'CONDITIONAL',
    description: 'Third-party patents that may block commercialization',
    industry: 'PHARMA',
    isDefault: false,
    exclusion: {
      name: 'Potential Blocking Patents',
      type: 'CONDITIONAL',
      dimension: 'ipStatus',
      operator: 'CONTAINS',
      values: ['blocking patents', 'FTO concerns'],
      condition: [{
        field: 'licensingStrategyDefined',
        operator: 'IS_TRUE',
        value: true,
      }],
      rationale: 'Freedom-to-operate risk. Requires defined licensing strategy or design-around plan.',
      approvalRequired: {
        roles: ['ip_counsel', 'bd_lead'],
        minApprovers: 2,
      },
    },
  },
];

// =============================================================================
// COMBINED TEMPLATES ARRAY
// =============================================================================

export const EXCLUSION_TEMPLATES: ExclusionTemplate[] = [
  ...VC_EXCLUSION_TEMPLATES,
  ...INSURANCE_EXCLUSION_TEMPLATES,
  ...PHARMA_EXCLUSION_TEMPLATES,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all exclusion templates
 */
export function getAllTemplates(): ExclusionTemplate[] {
  return EXCLUSION_TEMPLATES;
}

/**
 * Get templates for a specific industry
 * @alias getExclusionTemplatesForIndustry
 */
export function getTemplatesForIndustry(industry: string): ExclusionTemplate[] {
  return getExclusionTemplatesForIndustry(industry);
}

/**
 * Get templates for a specific industry
 */
export function getExclusionTemplatesForIndustry(industry: string): ExclusionTemplate[] {
  const normalizedIndustry = industry.toUpperCase();
  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'VENTURE_CAPITAL': 'VENTURE_CAPITAL',
    'INSURANCE': 'INSURANCE',
    'PHARMA': 'PHARMA',
    'GENERIC': 'GENERIC',
  };
  const mappedIndustry = industryMap[normalizedIndustry] || 'GENERIC';
  return EXCLUSION_TEMPLATES.filter((t) => t.industry === mappedIndustry);
}

/**
 * Get industry guidance for exclusions
 */
export function getExclusionGuidance(industry: string): IndustryExclusionGuidance {
  const normalizedIndustry = industry.toUpperCase();
  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'VENTURE_CAPITAL': 'VENTURE_CAPITAL',
    'INSURANCE': 'INSURANCE',
    'PHARMA': 'PHARMA',
  };
  const mappedIndustry = industryMap[normalizedIndustry] || 'GENERIC';
  return INDUSTRY_EXCLUSION_GUIDANCE[mappedIndustry] || INDUSTRY_EXCLUSION_GUIDANCE.GENERIC;
}

/**
 * Create an ExclusionItem from a template
 */
export function createExclusionFromTemplate(template: ExclusionTemplate): ExclusionItem {
  return {
    id: `excl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...template.exclusion,
  };
}

/**
 * Get recommended default exclusions for an industry
 */
export function getRecommendedDefaultExclusions(industry: string): ExclusionItem[] {
  const templates = getExclusionTemplatesForIndustry(industry);
  const defaultTemplates = templates.filter((t) => t.isDefault);
  return defaultTemplates.map(createExclusionFromTemplate);
}

/**
 * Get all available dimensions for an industry
 */
export function getAvailableDimensions(industry: string): { value: string; label: string; description: string }[] {
  const guidance = getExclusionGuidance(industry);
  return guidance.dimensionHints.map((hint) => ({
    value: hint.dimension,
    label: hint.dimension.charAt(0).toUpperCase() + hint.dimension.slice(1).replace(/([A-Z])/g, ' $1'),
    description: hint.description,
  }));
}
