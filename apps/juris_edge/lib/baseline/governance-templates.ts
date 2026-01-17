/**
 * Governance Templates Library
 *
 * Pre-built governance templates for different industries.
 * Each template defines roles, committees, approval tiers, exception policies, and audit settings.
 *
 * Templates follow the canonical GovernanceThresholdsModulePayload structure.
 */

import type {
  GovernanceThresholdsModulePayload,
  GovernanceRole,
  GovernanceCommittee,
  GovernanceApprovalTier,
  GovernanceExceptionPolicy,
  GovernanceConflictsPolicy,
  GovernanceAuditPolicy,
  GovernanceOperator,
} from './types';

// =============================================================================
// GOVERNANCE INFO CONSTANTS
// =============================================================================

/**
 * Display information for governance operators
 */
export const GOVERNANCE_OPERATOR_INFO: Record<GovernanceOperator, {
  label: string;
  description: string;
  applicableTo: ('number' | 'string' | 'boolean' | 'array')[];
}> = {
  EQUALS: {
    label: 'Equals',
    description: 'Value exactly matches',
    applicableTo: ['number', 'string', 'boolean'],
  },
  NOT_EQUALS: {
    label: 'Not Equals',
    description: 'Value does not match',
    applicableTo: ['number', 'string', 'boolean'],
  },
  GT: {
    label: 'Greater Than',
    description: 'Value is greater than threshold',
    applicableTo: ['number'],
  },
  GTE: {
    label: 'Greater Than or Equal',
    description: 'Value is greater than or equal to threshold',
    applicableTo: ['number'],
  },
  LT: {
    label: 'Less Than',
    description: 'Value is less than threshold',
    applicableTo: ['number'],
  },
  LTE: {
    label: 'Less Than or Equal',
    description: 'Value is less than or equal to threshold',
    applicableTo: ['number'],
  },
  IN: {
    label: 'In List',
    description: 'Value is in the specified list',
    applicableTo: ['string', 'number'],
  },
  NOT_IN: {
    label: 'Not In List',
    description: 'Value is not in the specified list',
    applicableTo: ['string', 'number'],
  },
  CONTAINS: {
    label: 'Contains',
    description: 'Value contains the specified text',
    applicableTo: ['string', 'array'],
  },
};

/**
 * Available condition fields per industry
 */
export const GOVERNANCE_CONDITION_FIELDS: Record<string, {
  field: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  unit?: string;
  description: string;
}[]> = {
  VENTURE_CAPITAL: [
    { field: 'case.proposedCommitment', label: 'Proposed Commitment', type: 'number', unit: 'currency', description: 'The proposed investment amount' },
    { field: 'case.exclusionOverrides', label: 'Exclusion Overrides', type: 'number', description: 'Number of exclusion overrides requested' },
    { field: 'case.hardRiskBreaches', label: 'Hard Risk Breaches', type: 'number', description: 'Number of hard risk appetite breaches' },
    { field: 'case.ownershipTarget', label: 'Ownership Target', type: 'number', unit: 'percentage', description: 'Target ownership percentage' },
    { field: 'case.stage', label: 'Investment Stage', type: 'string', description: 'Stage of the investment (Seed, Series A, etc.)' },
    { field: 'exception.hardBreach', label: 'Exception Hard Breach', type: 'boolean', description: 'Whether exception involves a hard breach' },
    { field: 'exception.count', label: 'Exception Count', type: 'number', description: 'Number of exception items' },
  ],
  INSURANCE: [
    { field: 'policy.limit', label: 'Policy Limit', type: 'number', unit: 'currency', description: 'The policy limit amount' },
    { field: 'policy.premium', label: 'Premium', type: 'number', unit: 'currency', description: 'The premium amount' },
    { field: 'policy.exclusionOverrides', label: 'Exclusion Overrides', type: 'number', description: 'Number of exclusion overrides' },
    { field: 'policy.pricingAdequacyFlag', label: 'Pricing Adequacy Flag', type: 'boolean', description: 'Whether pricing meets adequacy standards' },
    { field: 'policy.lineOfBusiness', label: 'Line of Business', type: 'string', description: 'Insurance line of business' },
    { field: 'policy.daFailures', label: 'DA Failures', type: 'number', description: 'Number of delegated authority failures' },
    { field: 'exception.hardBreach', label: 'Exception Hard Breach', type: 'boolean', description: 'Whether exception involves a hard breach' },
    { field: 'exception.count', label: 'Exception Count', type: 'number', description: 'Number of exception items' },
  ],
  PHARMA: [
    { field: 'program.stageGate', label: 'Stage Gate', type: 'string', description: 'Current stage gate (INITIATION, IND_CTA, PHASE_2, etc.)' },
    { field: 'program.budget', label: 'Program Budget', type: 'number', unit: 'currency', description: 'Total program budget' },
    { field: 'program.exclusionOverrides', label: 'Exclusion Overrides', type: 'number', description: 'Number of exclusion overrides' },
    { field: 'program.patientCount', label: 'Patient Count', type: 'number', description: 'Expected patient enrollment' },
    { field: 'program.territoryDeal', label: 'Territory Deal', type: 'boolean', description: 'Whether this is a territory licensing deal' },
    { field: 'program.therapeuticArea', label: 'Therapeutic Area', type: 'string', description: 'Therapeutic area of the program' },
    { field: 'exception.hardBreach', label: 'Exception Hard Breach', type: 'boolean', description: 'Whether exception involves a hard breach' },
    { field: 'exception.count', label: 'Exception Count', type: 'number', description: 'Number of exception items' },
  ],
  GENERIC: [
    { field: 'case.value', label: 'Case Value', type: 'number', unit: 'currency', description: 'The value of the case' },
    { field: 'case.exclusionOverrides', label: 'Exclusion Overrides', type: 'number', description: 'Number of exclusion overrides' },
    { field: 'case.hardRiskBreaches', label: 'Hard Risk Breaches', type: 'number', description: 'Number of hard risk breaches' },
    { field: 'exception.hardBreach', label: 'Exception Hard Breach', type: 'boolean', description: 'Whether exception involves a hard breach' },
    { field: 'exception.count', label: 'Exception Count', type: 'number', description: 'Number of exception items' },
  ],
};

/**
 * Standard governance roles available in templates
 */
export const STANDARD_GOVERNANCE_ROLES: Record<string, GovernanceRole> = {
  IC_MEMBER: { id: 'IC_MEMBER', name: 'Investment Committee Member', description: 'Voting member of the Investment Committee' },
  IC_CHAIR: { id: 'IC_CHAIR', name: 'Investment Committee Chair', description: 'Chair of the Investment Committee' },
  COMPLIANCE: { id: 'COMPLIANCE', name: 'Compliance Officer', description: 'Responsible for compliance oversight' },
  RISK: { id: 'RISK', name: 'Risk Officer', description: 'Responsible for risk assessment and management' },
  LEGAL: { id: 'LEGAL', name: 'Legal Counsel', description: 'Provides legal review and sign-off' },
  DEAL_LEAD: { id: 'DEAL_LEAD', name: 'Deal Lead', description: 'Lead responsible for the deal/case' },
  CASE_OWNER: { id: 'CASE_OWNER', name: 'Case Owner', description: 'Owner of the case record' },
  PORTFOLIO_MANAGER: { id: 'PORTFOLIO_MANAGER', name: 'Portfolio Manager', description: 'Manages the portfolio' },
  UNDERWRITER: { id: 'UNDERWRITER', name: 'Underwriter', description: 'Primary underwriting authority' },
  SENIOR_UNDERWRITER: { id: 'SENIOR_UNDERWRITER', name: 'Senior Underwriter', description: 'Senior underwriting authority' },
  CHIEF_UNDERWRITER: { id: 'CHIEF_UNDERWRITER', name: 'Chief Underwriter', description: 'Chief underwriting officer' },
  ACTUARIAL: { id: 'ACTUARIAL', name: 'Actuarial', description: 'Actuarial review and sign-off' },
  MEDICAL: { id: 'MEDICAL', name: 'Medical Officer', description: 'Medical/scientific review' },
  IP_COUNSEL: { id: 'IP_COUNSEL', name: 'IP Counsel', description: 'Intellectual property legal counsel' },
  SCIENTIFIC: { id: 'SCIENTIFIC', name: 'Scientific Advisor', description: 'Scientific/technical advisor' },
};

// =============================================================================
// INDUSTRY GUIDANCE
// =============================================================================

/**
 * Industry-specific guidance for governance configuration
 */
export interface IndustryGovernanceGuidance {
  industry: string;
  description: string;
  recommendedRoles: string[];
  recommendedCommittees: string[];
  approvalTierPatterns: {
    name: string;
    description: string;
    typicalThreshold?: string;
  }[];
  exceptionHandling: string;
  auditRequirements: string;
  commonFields: string[];
}

export const INDUSTRY_GOVERNANCE_GUIDANCE: Record<string, IndustryGovernanceGuidance> = {
  VENTURE_CAPITAL: {
    industry: 'Venture Capital',
    description: 'VC governance typically centers on Investment Committee (IC) approval with tiered thresholds based on commitment size.',
    recommendedRoles: ['IC_MEMBER', 'IC_CHAIR', 'COMPLIANCE', 'RISK', 'DEAL_LEAD'],
    recommendedCommittees: ['Investment Committee'],
    approvalTierPatterns: [
      { name: 'Standard', description: 'Standard investments within normal parameters', typicalThreshold: '< €2M commitment' },
      { name: 'Enhanced', description: 'Larger or more complex investments', typicalThreshold: '€2M - €5M commitment' },
      { name: 'Full IC', description: 'Major investments requiring full committee', typicalThreshold: '> €5M commitment' },
      { name: 'Exception', description: 'Investments with exclusion overrides or risk breaches' },
    ],
    exceptionHandling: 'Exceptions require IC approval with enhanced quorum. Hard breaches require unanimous consent.',
    auditRequirements: 'Electronic signatures required. Decision rationale must be documented.',
    commonFields: ['case.proposedCommitment', 'case.exclusionOverrides', 'case.hardRiskBreaches'],
  },
  INSURANCE: {
    industry: 'Insurance',
    description: 'Insurance governance uses underwriting authority bands with escalation based on limit, premium, and risk factors.',
    recommendedRoles: ['UNDERWRITER', 'SENIOR_UNDERWRITER', 'CHIEF_UNDERWRITER', 'ACTUARIAL', 'COMPLIANCE', 'RISK'],
    recommendedCommittees: ['Underwriting Committee', 'Risk Committee'],
    approvalTierPatterns: [
      { name: 'Within Authority', description: 'Within underwriter delegated authority', typicalThreshold: 'Limit < $1M, standard pricing' },
      { name: 'Referral', description: 'Requires senior review', typicalThreshold: 'Limit $1M-$5M or pricing deviation' },
      { name: 'Committee', description: 'Requires committee approval', typicalThreshold: 'Limit > $5M or complex risks' },
      { name: 'DA Override', description: 'Delegated authority failures or bordereaux issues' },
    ],
    exceptionHandling: 'Pricing adequacy issues require actuarial sign-off. DA failures require Risk + Compliance review.',
    auditRequirements: 'Full audit trail required. Regulatory reporting obligations apply.',
    commonFields: ['policy.limit', 'policy.premium', 'policy.pricingAdequacyFlag', 'policy.daFailures'],
  },
  PHARMA: {
    industry: 'Pharmaceutical',
    description: 'Pharma governance follows stage-gate processes with scientific, regulatory, and commercial review.',
    recommendedRoles: ['SCIENTIFIC', 'MEDICAL', 'COMPLIANCE', 'LEGAL', 'IP_COUNSEL', 'RISK', 'PORTFOLIO_MANAGER'],
    recommendedCommittees: ['Portfolio Committee', 'Scientific Advisory Board', 'Licensing Committee'],
    approvalTierPatterns: [
      { name: 'Initiation', description: 'Project initiation and early research', typicalThreshold: 'INITIATION stage' },
      { name: 'IND/CTA', description: 'IND or CTA filing decision', typicalThreshold: 'IND_CTA stage' },
      { name: 'Phase Transition', description: 'Phase 2/3 progression decision', typicalThreshold: 'PHASE_2, PHASE_3 stages' },
      { name: 'Licensing', description: 'Territory or licensing deals', typicalThreshold: 'Any licensing transaction' },
    ],
    exceptionHandling: 'Regulatory exceptions require Medical + Compliance sign-off. Licensing exceptions require Legal + IP review.',
    auditRequirements: 'Regulatory audit trail required. GxP compliance for clinical decisions.',
    commonFields: ['program.stageGate', 'program.budget', 'program.territoryDeal'],
  },
  GENERIC: {
    industry: 'Generic',
    description: 'Standard governance structure with approval tiers based on value and risk.',
    recommendedRoles: ['PORTFOLIO_MANAGER', 'COMPLIANCE', 'RISK', 'CASE_OWNER'],
    recommendedCommittees: ['Approval Committee'],
    approvalTierPatterns: [
      { name: 'Standard', description: 'Standard approvals', typicalThreshold: 'Value < threshold' },
      { name: 'Enhanced', description: 'Enhanced review required', typicalThreshold: 'Value > threshold' },
      { name: 'Exception', description: 'Cases with exceptions or breaches' },
    ],
    exceptionHandling: 'Exceptions require committee review.',
    auditRequirements: 'Electronic signatures and audit trail required.',
    commonFields: ['case.value', 'case.exclusionOverrides', 'case.hardRiskBreaches'],
  },
};

// =============================================================================
// GOVERNANCE TEMPLATE TYPE
// =============================================================================

export interface GovernanceTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  isDefault: boolean;
  governance: GovernanceThresholdsModulePayload;
}

// =============================================================================
// VENTURE CAPITAL TEMPLATES
// =============================================================================

/**
 * VC Template 1: Lean (Early-stage small fund)
 * Simple 2-person unanimous IC for smaller/nimble funds
 */
const VC_LEAN_TEMPLATE: GovernanceTemplate = {
  id: 'vc-lean',
  name: 'VC – Lean (Early-Stage Small Fund)',
  description: 'Streamlined governance for smaller early-stage funds with 2-person unanimous IC approval.',
  industry: 'VENTURE_CAPITAL',
  isDefault: false,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'IC_CHAIR', name: 'IC Chair' },
      { id: 'IC_MEMBER', name: 'IC Member' },
      { id: 'CASE_OWNER', name: 'Case Owner' },
      { id: 'COMPLIANCE', name: 'Compliance' },
    ],
    committees: [
      {
        id: 'IC',
        name: 'Investment Committee',
        roleIds: ['IC_CHAIR', 'IC_MEMBER'],
        quorum: { minVotes: 2, minYesVotes: 2, voteType: 'UNANIMOUS' },
      },
    ],
    approvalTiers: [
      {
        id: 'VC_T1',
        name: 'Standard Deal Approval',
        conditions: [{ field: 'case.proposedCommitment', operator: 'LTE', value: 2000000, currency: 'EUR' }],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 2 }],
        requiredSignoffs: [],
      },
      {
        id: 'VC_T2',
        name: 'Large Ticket / Higher Scrutiny',
        conditions: [{ field: 'case.proposedCommitment', operator: 'GT', value: 2000000, currency: 'EUR' }],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 2 }],
        requiredSignoffs: [{ roleId: 'COMPLIANCE', required: true }],
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'VC_E_MINOR',
          name: 'Minor Exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 2 }],
          requiredSignoffs: [],
        },
        {
          id: 'VC_E_MAJOR',
          name: 'Major Exception (Hard Breach)',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 2 }],
          requiredSignoffs: [{ roleId: 'IC_CHAIR', required: true }],
        },
      ],
      expiryDefaultDays: 365,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: ['CASE_OWNER'],
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
    },
  },
};

/**
 * VC Template 2: Institutional (bigger fund / more controls)
 * Majority IC voting with Risk, Compliance, Finance sign-offs
 */
const VC_INSTITUTIONAL_TEMPLATE: GovernanceTemplate = {
  id: 'vc-institutional',
  name: 'VC – Institutional (Larger Fund)',
  description: 'Comprehensive governance for institutional funds with majority IC voting and enhanced oversight.',
  industry: 'VENTURE_CAPITAL',
  isDefault: true,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'IC_CHAIR', name: 'IC Chair' },
      { id: 'IC_MEMBER', name: 'IC Member' },
      { id: 'RISK', name: 'Risk' },
      { id: 'COMPLIANCE', name: 'Compliance' },
      { id: 'FINANCE', name: 'Finance' },
      { id: 'CASE_OWNER', name: 'Case Owner' },
    ],
    committees: [
      {
        id: 'IC',
        name: 'Investment Committee',
        roleIds: ['IC_CHAIR', 'IC_MEMBER'],
        quorum: { minVotes: 4, minYesVotes: 3, voteType: 'MAJORITY' },
      },
    ],
    approvalTiers: [
      {
        id: 'VC_INST_T1',
        name: 'Standard Deal Approval',
        conditions: [
          { field: 'case.proposedCommitment', operator: 'LTE', value: 3000000, currency: 'EUR' },
          { field: 'case.exclusionOverrides', operator: 'LTE', value: 0 },
        ],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 3 }],
        requiredSignoffs: [{ roleId: 'FINANCE', required: true }],
      },
      {
        id: 'VC_INST_T2',
        name: 'Exclusion Override or Hard Risk Breach',
        conditions: [
          { field: 'case.exclusionOverrides', operator: 'GT', value: 0 },
        ],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
        requiredSignoffs: [
          { roleId: 'RISK', required: true },
          { roleId: 'COMPLIANCE', required: true },
        ],
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'VC_INST_E1',
          name: 'Soft Breach',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 3 }],
          requiredSignoffs: [],
        },
        {
          id: 'VC_INST_E2',
          name: 'Hard Breach',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
          requiredSignoffs: [{ roleId: 'RISK', required: true }],
        },
      ],
      expiryDefaultDays: 365,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: ['CASE_OWNER'],
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
    },
  },
};

// =============================================================================
// INSURANCE TEMPLATES
// =============================================================================

/**
 * Insurance Template 1: Underwriting Authority Bands
 * Standard authority bands with escalation based on limit and pricing
 */
const INSURANCE_AUTHORITY_TEMPLATE: GovernanceTemplate = {
  id: 'ins-authority',
  name: 'Insurance – Underwriting Authority Bands',
  description: 'Standard underwriting authority bands with escalation based on limit and pricing adequacy.',
  industry: 'INSURANCE',
  isDefault: true,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'UW', name: 'Underwriter' },
      { id: 'UW_MANAGER', name: 'Underwriting Manager' },
      { id: 'RISK', name: 'Risk' },
      { id: 'COMPLIANCE', name: 'Compliance' },
      { id: 'ACTUARY', name: 'Actuarial' },
    ],
    committees: [
      {
        id: 'UW_REFERRAL',
        name: 'Referral Committee',
        roleIds: ['UW_MANAGER', 'RISK'],
        quorum: { minVotes: 2, minYesVotes: 2, voteType: 'UNANIMOUS' },
      },
    ],
    approvalTiers: [
      {
        id: 'INS_T1',
        name: 'Standard Authority',
        conditions: [
          { field: 'policy.limit', operator: 'LTE', value: 5000000, currency: 'GBP' },
          { field: 'policy.pricingAdequacyFlag', operator: 'EQUALS', value: true },
        ],
        requiredApprovals: [],
        requiredSignoffs: [{ roleId: 'UW', required: true }],
      },
      {
        id: 'INS_T2',
        name: 'Referral – Large Limit or Pricing Deviation',
        conditions: [
          { field: 'policy.limit', operator: 'GT', value: 5000000, currency: 'GBP' },
        ],
        requiredApprovals: [{ committeeId: 'UW_REFERRAL', minYesVotes: 2 }],
        requiredSignoffs: [{ roleId: 'ACTUARY', required: true }],
      },
      {
        id: 'INS_T3',
        name: 'Referral – Exclusion Override or Aggregation Breach',
        conditions: [
          { field: 'policy.exclusionOverrides', operator: 'GT', value: 0 },
        ],
        requiredApprovals: [{ committeeId: 'UW_REFERRAL', minYesVotes: 2 }],
        requiredSignoffs: [
          { roleId: 'RISK', required: true },
          { roleId: 'COMPLIANCE', required: true },
        ],
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'INS_E1',
          name: 'Soft Policy Exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'UW_REFERRAL', minYesVotes: 2 }],
          requiredSignoffs: [],
        },
        {
          id: 'INS_E2',
          name: 'Hard Policy Exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [{ committeeId: 'UW_REFERRAL', minYesVotes: 2 }],
          requiredSignoffs: [{ roleId: 'RISK', required: true }],
        },
      ],
      expiryDefaultDays: 365,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: [],
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
    },
  },
};

/**
 * Insurance Template 2: Delegated Authority Heavy
 * Enhanced governance for delegated authority with Risk + Compliance oversight
 * (Placeholder for specialty high-limit and DA-heavy templates)
 */
const INSURANCE_DELEGATED_TEMPLATE: GovernanceTemplate = {
  id: 'ins-delegated',
  name: 'Insurance – Delegated Authority Heavy',
  description: 'Enhanced governance for delegated authority with Risk + Compliance oversight on DA and bordereaux failures.',
  industry: 'INSURANCE',
  isDefault: false,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'UW', name: 'Underwriter' },
      { id: 'UW_MANAGER', name: 'Underwriting Manager' },
      { id: 'CHIEF_UW', name: 'Chief Underwriter' },
      { id: 'RISK', name: 'Risk' },
      { id: 'COMPLIANCE', name: 'Compliance' },
      { id: 'ACTUARY', name: 'Actuarial' },
      { id: 'DA_MANAGER', name: 'DA Manager' },
    ],
    committees: [
      {
        id: 'UW_COMMITTEE',
        name: 'Underwriting Committee',
        roleIds: ['UW_MANAGER', 'CHIEF_UW'],
        quorum: { minVotes: 3, minYesVotes: 2, voteType: 'MAJORITY' },
      },
      {
        id: 'DA_COMMITTEE',
        name: 'Delegated Authority Committee',
        roleIds: ['DA_MANAGER', 'COMPLIANCE', 'RISK'],
        quorum: { minVotes: 3, minYesVotes: 3, voteType: 'UNANIMOUS' },
      },
    ],
    approvalTiers: [
      {
        id: 'INS_DA_T1',
        name: 'Standard DA',
        conditions: [
          { field: 'policy.limit', operator: 'LTE', value: 2000000, currency: 'GBP' },
          { field: 'policy.daFailures', operator: 'EQUALS', value: 0 },
          { field: 'policy.pricingAdequacyFlag', operator: 'EQUALS', value: true },
        ],
        requiredApprovals: [],
        requiredSignoffs: [{ roleId: 'DA_MANAGER', required: true }],
      },
      {
        id: 'INS_DA_T2',
        name: 'DA Failure Referral',
        conditions: [
          { field: 'policy.daFailures', operator: 'GT', value: 0 },
        ],
        requiredApprovals: [{ committeeId: 'DA_COMMITTEE', minYesVotes: 3 }],
        requiredSignoffs: [
          { roleId: 'COMPLIANCE', required: true },
          { roleId: 'RISK', required: true },
        ],
      },
      {
        id: 'INS_DA_T3',
        name: 'Large Risk Referral',
        conditions: [
          { field: 'policy.limit', operator: 'GT', value: 2000000, currency: 'GBP' },
        ],
        requiredApprovals: [{ committeeId: 'UW_COMMITTEE', minYesVotes: 2 }],
        requiredSignoffs: [
          { roleId: 'CHIEF_UW', required: true },
          { roleId: 'DA_MANAGER', required: true },
        ],
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'INS_DA_E1',
          name: 'DA Exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'DA_COMMITTEE', minYesVotes: 3 }],
          requiredSignoffs: [
            { roleId: 'COMPLIANCE', required: true },
            { roleId: 'RISK', required: true },
          ],
        },
        {
          id: 'INS_DA_E2',
          name: 'Major DA Exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [
            { committeeId: 'DA_COMMITTEE', minYesVotes: 3 },
            { committeeId: 'UW_COMMITTEE', minYesVotes: 2 },
          ],
          requiredSignoffs: [
            { roleId: 'COMPLIANCE', required: true },
            { roleId: 'RISK', required: true },
            { roleId: 'CHIEF_UW', required: true },
          ],
        },
      ],
      expiryDefaultDays: 90,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: ['DA_MANAGER', 'UW'],
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
    },
  },
};

// =============================================================================
// PHARMA TEMPLATES
// =============================================================================

/**
 * Pharma Template 1: Stage Gate Governance
 * Standard stage-gate governance for pharmaceutical development programs
 */
const PHARMA_STAGEGATE_TEMPLATE: GovernanceTemplate = {
  id: 'pharma-stagegate',
  name: 'Pharma – Stage Gate Governance',
  description: 'Standard stage-gate governance for pharmaceutical development programs with IND/CTA and Phase transitions.',
  industry: 'PHARMA',
  isDefault: true,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'DEV_LEAD', name: 'Development Lead' },
      { id: 'CLINICAL', name: 'Clinical' },
      { id: 'REGULATORY', name: 'Regulatory' },
      { id: 'CMC', name: 'CMC' },
      { id: 'SAFETY', name: 'Safety' },
      { id: 'IC_MEMBER', name: 'Investment Committee Member' },
    ],
    committees: [
      {
        id: 'PDC',
        name: 'Program Decision Committee',
        roleIds: ['IC_MEMBER', 'REGULATORY', 'CMC'],
        quorum: { minVotes: 3, minYesVotes: 2, voteType: 'MAJORITY' },
      },
    ],
    approvalTiers: [
      {
        id: 'PH_T1',
        name: 'Program Initiation / In-licensing',
        conditions: [{ field: 'program.stageGate', operator: 'EQUALS', value: 'INITIATION' }],
        requiredApprovals: [{ committeeId: 'PDC', minYesVotes: 2 }],
        requiredSignoffs: [
          { roleId: 'REGULATORY', required: true },
          { roleId: 'CMC', required: true },
        ],
      },
      {
        id: 'PH_T2',
        name: 'IND/CTA Submission',
        conditions: [{ field: 'program.stageGate', operator: 'EQUALS', value: 'IND_CTA' }],
        requiredApprovals: [{ committeeId: 'PDC', minYesVotes: 3 }],
        requiredSignoffs: [
          { roleId: 'SAFETY', required: true },
          { roleId: 'REGULATORY', required: true },
          { roleId: 'CMC', required: true },
        ],
      },
      {
        id: 'PH_T3',
        name: 'Advance to Phase 2',
        conditions: [{ field: 'program.stageGate', operator: 'EQUALS', value: 'PHASE_2' }],
        requiredApprovals: [{ committeeId: 'PDC', minYesVotes: 3 }],
        requiredSignoffs: [
          { roleId: 'CLINICAL', required: true },
          { roleId: 'SAFETY', required: true },
        ],
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'PH_E1',
          name: 'Soft Deviation',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'PDC', minYesVotes: 2 }],
          requiredSignoffs: [],
        },
        {
          id: 'PH_E2',
          name: 'Hard Breach (Safety/CMC/Regulatory)',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [{ committeeId: 'PDC', minYesVotes: 3 }],
          requiredSignoffs: [{ roleId: 'SAFETY', required: true }],
        },
      ],
      expiryDefaultDays: 365,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: [],
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
    },
  },
};

/**
 * Pharma Template 2: Licensing Committee Heavy
 * Enhanced governance for licensing and territory deals with Legal/IP review
 */
const PHARMA_LICENSING_TEMPLATE: GovernanceTemplate = {
  id: 'pharma-licensing',
  name: 'Pharma – Licensing Committee Heavy',
  description: 'Enhanced governance for licensing and territory deals with Legal/IP review and dedicated Licensing Committee.',
  industry: 'PHARMA',
  isDefault: false,
  governance: {
    schemaVersion: 1,
    roles: [
      { id: 'SCIENTIFIC', name: 'Scientific Advisor', description: 'Scientific/technical review' },
      { id: 'MEDICAL', name: 'Medical Officer', description: 'Medical/clinical review' },
      { id: 'COMPLIANCE', name: 'Compliance Officer', description: 'Regulatory compliance' },
      { id: 'RISK', name: 'Risk Officer', description: 'Risk assessment' },
      { id: 'PORTFOLIO_MANAGER', name: 'Portfolio Manager', description: 'Portfolio oversight' },
      { id: 'FINANCE', name: 'Finance', description: 'Financial review' },
      { id: 'LEGAL', name: 'Legal Counsel', description: 'Legal review' },
      { id: 'IP_COUNSEL', name: 'IP Counsel', description: 'Intellectual property review' },
    ],
    committees: [
      {
        id: 'PORTFOLIO_COMMITTEE',
        name: 'Portfolio Committee',
        description: 'Portfolio investment decisions',
        roleIds: ['PORTFOLIO_MANAGER', 'SCIENTIFIC', 'FINANCE'],
        quorum: {
          minVotes: 4,
          minYesVotes: 3,
          voteType: 'MAJORITY',
        },
      },
      {
        id: 'LICENSING_COMMITTEE',
        name: 'Licensing Committee',
        description: 'Licensing and partnership decisions',
        roleIds: ['LEGAL', 'IP_COUNSEL', 'FINANCE', 'PORTFOLIO_MANAGER'],
        quorum: {
          minVotes: 4,
          minYesVotes: 3,
          voteType: 'MAJORITY',
        },
      },
    ],
    approvalTiers: [
      {
        id: 'T1_STANDARD',
        name: 'Standard Program',
        description: 'Non-licensing program decisions',
        conditions: [
          { field: 'program.territoryDeal', operator: 'EQUALS', value: false },
        ],
        requiredApprovals: [{ committeeId: 'PORTFOLIO_COMMITTEE', minYesVotes: 3 }],
        requiredSignoffs: [{ roleId: 'SCIENTIFIC', required: true }],
        timeLimit: { hours: 168, escalateOnExpiry: true },
      },
      {
        id: 'T2_LICENSING',
        name: 'Territory Licensing',
        description: 'Territory or licensing deal',
        conditions: [
          { field: 'program.territoryDeal', operator: 'EQUALS', value: true },
        ],
        requiredApprovals: [
          { committeeId: 'PORTFOLIO_COMMITTEE', minYesVotes: 3 },
          { committeeId: 'LICENSING_COMMITTEE', minYesVotes: 3 },
        ],
        requiredSignoffs: [
          { roleId: 'LEGAL', required: true },
          { roleId: 'IP_COUNSEL', required: true },
          { roleId: 'FINANCE', required: true },
        ],
        timeLimit: { hours: 336, escalateOnExpiry: true },
      },
      {
        id: 'T3_LARGE_LICENSING',
        name: 'Major Licensing Deal',
        description: 'Large licensing deal (>$50M)',
        conditions: [
          { field: 'program.territoryDeal', operator: 'EQUALS', value: true },
          { field: 'program.budget', operator: 'GT', value: 50000000, currency: 'USD', logic: 'AND' },
        ],
        requiredApprovals: [
          { committeeId: 'PORTFOLIO_COMMITTEE', minYesVotes: 4 },
          { committeeId: 'LICENSING_COMMITTEE', minYesVotes: 4 },
        ],
        requiredSignoffs: [
          { roleId: 'LEGAL', required: true },
          { roleId: 'IP_COUNSEL', required: true },
          { roleId: 'FINANCE', required: true },
          { roleId: 'RISK', required: true },
        ],
        timeLimit: { hours: 504, escalateOnExpiry: true },
      },
    ],
    exceptionPolicy: {
      requiresExceptionRecord: true,
      exceptionSeverity: [
        {
          id: 'E1',
          name: 'IP Exception',
          description: 'IP or patent-related exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
          requiredApprovals: [{ committeeId: 'LICENSING_COMMITTEE', minYesVotes: 3 }],
          requiredSignoffs: [
            { roleId: 'IP_COUNSEL', required: true },
            { roleId: 'LEGAL', required: true },
          ],
        },
        {
          id: 'E2',
          name: 'Major Licensing Exception',
          description: 'Major licensing or territory exception',
          conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
          requiredApprovals: [
            { committeeId: 'PORTFOLIO_COMMITTEE', minYesVotes: 4 },
            { committeeId: 'LICENSING_COMMITTEE', minYesVotes: 4 },
          ],
          requiredSignoffs: [
            { roleId: 'LEGAL', required: true },
            { roleId: 'IP_COUNSEL', required: true },
            { roleId: 'COMPLIANCE', required: true },
            { roleId: 'RISK', required: true },
          ],
        },
      ],
      expiryDefaultDays: 365,
      allowExtensions: true,
      maxExtensions: 2,
    },
    conflictsPolicy: {
      requiresDisclosure: true,
      recusalRequired: true,
      blockedRoles: ['PORTFOLIO_MANAGER'],
      disclosureScope: 'ALL',
      coolingOffPeriod: {
        days: 180,
        applicableTo: ['LEGAL', 'IP_COUNSEL'],
      },
    },
    audit: {
      decisionRecordRequired: true,
      signoffCapture: 'ELECTRONIC',
      retainVersions: true,
      auditTrailRequired: true,
      retentionYears: 20,
    },
  },
};

// =============================================================================
// TEMPLATE COLLECTIONS
// =============================================================================

export const VENTURE_CAPITAL_TEMPLATES: GovernanceTemplate[] = [
  VC_LEAN_TEMPLATE,
  VC_INSTITUTIONAL_TEMPLATE,
];

export const INSURANCE_TEMPLATES: GovernanceTemplate[] = [
  INSURANCE_AUTHORITY_TEMPLATE,
  INSURANCE_DELEGATED_TEMPLATE,
];

export const PHARMA_TEMPLATES: GovernanceTemplate[] = [
  PHARMA_STAGEGATE_TEMPLATE,
  PHARMA_LICENSING_TEMPLATE,
];

export const ALL_GOVERNANCE_TEMPLATES: GovernanceTemplate[] = [
  ...VENTURE_CAPITAL_TEMPLATES,
  ...INSURANCE_TEMPLATES,
  ...PHARMA_TEMPLATES,
];

// =============================================================================
// TEMPLATE ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all governance templates
 */
export function getAllGovernanceTemplates(): GovernanceTemplate[] {
  return ALL_GOVERNANCE_TEMPLATES;
}

/**
 * Get governance templates for a specific industry
 */
export function getGovernanceTemplatesForIndustry(industry: string): GovernanceTemplate[] {
  const normalizedIndustry = industry.toUpperCase();

  // Handle industry aliases
  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'VENTURE_CAPITAL': 'VENTURE_CAPITAL',
    'INS': 'INSURANCE',
    'INSURANCE': 'INSURANCE',
    'PHARMA': 'PHARMA',
    'PHARMACEUTICAL': 'PHARMA',
    'GENERIC': 'GENERIC',
  };

  const mappedIndustry = industryMap[normalizedIndustry] || normalizedIndustry;

  switch (mappedIndustry) {
    case 'VENTURE_CAPITAL':
      return VENTURE_CAPITAL_TEMPLATES;
    case 'INSURANCE':
      return INSURANCE_TEMPLATES;
    case 'PHARMA':
      return PHARMA_TEMPLATES;
    default:
      return [];
  }
}

/**
 * Get a governance template by ID
 */
export function getGovernanceTemplateById(id: string): GovernanceTemplate | undefined {
  return ALL_GOVERNANCE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get the default governance template for an industry
 */
export function getDefaultGovernanceTemplate(industry: string): GovernanceTemplate | undefined {
  const templates = getGovernanceTemplatesForIndustry(industry);
  return templates.find((t) => t.isDefault) || templates[0];
}

/**
 * Get industry guidance
 */
export function getGovernanceGuidance(industry: string): IndustryGovernanceGuidance {
  const normalizedIndustry = industry.toUpperCase();

  const industryMap: Record<string, string> = {
    'VC': 'VENTURE_CAPITAL',
    'VENTURE_CAPITAL': 'VENTURE_CAPITAL',
    'INS': 'INSURANCE',
    'INSURANCE': 'INSURANCE',
    'PHARMA': 'PHARMA',
    'PHARMACEUTICAL': 'PHARMA',
    'GENERIC': 'GENERIC',
  };

  const mappedIndustry = industryMap[normalizedIndustry] || normalizedIndustry;

  return INDUSTRY_GOVERNANCE_GUIDANCE[mappedIndustry] || INDUSTRY_GOVERNANCE_GUIDANCE.GENERIC;
}

/**
 * Create a governance payload from a template
 */
export function createGovernanceFromTemplate(template: GovernanceTemplate): GovernanceThresholdsModulePayload {
  return JSON.parse(JSON.stringify(template.governance));
}

/**
 * Get the recommended default governance for an industry
 */
export function getRecommendedDefaultGovernance(industry: string): GovernanceThresholdsModulePayload | null {
  const template = getDefaultGovernanceTemplate(industry);
  if (!template) return null;
  return createGovernanceFromTemplate(template);
}
