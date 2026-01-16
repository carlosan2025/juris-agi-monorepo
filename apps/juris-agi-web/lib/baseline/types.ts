/**
 * Portfolio Baseline Module Type Definitions
 *
 * These types define the JSON schema for each module in the Portfolio Baseline.
 * The baseline is industry-agnostic - industry differences are handled through:
 * - Labels (configurable display names)
 * - Enum options (industry-specific choices)
 * - Help text (contextual guidance)
 * - Validation hints (industry-specific validation)
 *
 * DO NOT create separate types per industry.
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Schema version for tracking module format evolution
 */
export interface SchemaVersioned {
  schemaVersion: number;
}

/**
 * Auditable metadata for module items
 */
export interface AuditableItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// =============================================================================
// MANDATES MODULE
// =============================================================================

/**
 * Mandate type classification
 * - PRIMARY: Core investment mandate
 * - THEMATIC: Specialized focus area
 * - CARVEOUT: Specific allocation carved out from main
 */
export type MandateType = 'PRIMARY' | 'THEMATIC' | 'CARVEOUT';

/**
 * Mandate lifecycle status
 */
export type MandateStatus = 'ACTIVE' | 'RETIRED' | 'DRAFT';

/**
 * Risk posture relative to portfolio baseline
 */
export type RiskPosture = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'ALIGNED';

/**
 * Geographic scope definition
 * Industry examples:
 * - VC: "North America", "Europe", "Global"
 * - Insurance: "US", "EU", "Lloyd's Markets"
 * - Pharma: "FDA Markets", "EMA Markets", "Global"
 */
export interface GeographicScope {
  regions: string[];
  countries?: string[];
  exclusions?: string[];
}

/**
 * Domain scope - industry specific but schema-agnostic
 * Industry examples:
 * - VC: "Enterprise SaaS", "FinTech", "HealthTech"
 * - Insurance: "Cyber", "D&O", "Property"
 * - Pharma: "Oncology", "Rare Disease", "Gene Therapy"
 */
export interface DomainScope {
  included: string[];
  excluded?: string[];
  notes?: string;
}

/**
 * Stage scope - investment/development stage
 * Industry examples:
 * - VC: "Seed", "Series A", "Series B", "Growth"
 * - Insurance: "Primary", "Excess", "Reinsurance"
 * - Pharma: "Preclinical", "Phase 1", "Phase 2", "Phase 3", "Commercial"
 */
export interface StageScope {
  included: string[];
  excluded?: string[];
  notes?: string;
}

/**
 * Sizing parameters - flexible to accommodate industry differences
 * Industry examples:
 * - VC: checkSize, ownershipTarget, reserveRatio
 * - Insurance: minPremium, maxLine, retentionLevel
 * - Pharma: budgetRange, patientCount, siteCount
 */
export interface SizingScope {
  min?: number;
  max?: number;
  target?: number;
  unit?: string;
  currency?: string;
  // Extensible for industry-specific fields
  parameters?: Record<string, number | string | boolean>;
}

/**
 * Mandate scope aggregation
 */
export interface MandateScope {
  geography: GeographicScope;
  domains: DomainScope;
  stages: StageScope;
  sizing?: SizingScope;
}

/**
 * Hard constraint definition
 */
export interface HardConstraint {
  id: string;
  name: string;
  description: string;
  dimension: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS';
  values: (string | number | boolean)[];
  severity: 'BLOCKING' | 'WARNING';
  rationale?: string;
}

/**
 * Mandate objective definition
 */
export interface MandateObjective {
  primary: string;
  secondary: string[];
  metrics?: {
    name: string;
    target?: number | string;
    unit?: string;
  }[];
}

/**
 * Complete mandate definition within the baseline
 */
export interface MandateDefinition extends AuditableItem {
  name: string;
  type: MandateType;
  status: MandateStatus;
  priority: number;
  description?: string;
  objective: MandateObjective;
  scope: MandateScope;
  hardConstraints: HardConstraint[];
  riskPosture?: RiskPosture;
  // Reference to portfolio-level risk appetite
  riskAppetiteOverrides?: Record<string, unknown>;
  // Optional allocation/capacity constraints
  allocation?: {
    minPct?: number;
    maxPct?: number;
    targetPct?: number;
  };
}

/**
 * MANDATES module payload
 */
export interface MandatesModulePayload extends SchemaVersioned {
  mandates: MandateDefinition[];
  // Cross-mandate rules
  allocationRules?: {
    totalMustEqual100: boolean;
    allowOverlap: boolean;
    overlapResolution?: 'FIRST_MATCH' | 'HIGHEST_PRIORITY' | 'SPLIT';
  };
}

// =============================================================================
// EXCLUSIONS MODULE
// =============================================================================

/**
 * Exclusion type
 * - HARD: Absolute exclusion, no exceptions
 * - CONDITIONAL: May be overridden with approval
 */
export type ExclusionType = 'HARD' | 'CONDITIONAL';

/**
 * Exclusion operator type
 */
export type ExclusionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN'
  | 'MATCHES_REGEX'
  | 'IS_TRUE'
  | 'IS_FALSE';

/**
 * Conditional exclusion criteria
 */
export interface ExclusionCondition {
  field: string;
  operator: ExclusionOperator;
  value: string | number | boolean | string[];
  logic?: 'AND' | 'OR';
}

/**
 * Single exclusion item
 */
export interface ExclusionItem extends AuditableItem {
  name: string;
  type: ExclusionType;
  dimension: string;
  operator: ExclusionOperator;
  values: (string | number | boolean)[];
  condition?: ExclusionCondition[];
  rationale: string;
  source?: string;
  effectiveDate?: string;
  expiryDate?: string;
  // For conditional exclusions
  approvalRequired?: {
    roles: string[];
    minApprovers: number;
  };
}

/**
 * EXCLUSIONS module payload
 */
export interface ExclusionsModulePayload extends SchemaVersioned {
  items: ExclusionItem[];
  // Global exclusion settings
  settings?: {
    defaultType: ExclusionType;
    requireRationale: boolean;
    allowTemporaryOverrides: boolean;
  };
}

// =============================================================================
// RISK APPETITE MODULE
// =============================================================================

/**
 * Risk dimension definition
 */
export interface RiskDimension extends AuditableItem {
  name: string;
  description?: string;
  category?: string;
  toleranceMin: number;
  toleranceMax: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
  measurementMethod?: string;
}

/**
 * Portfolio-level constraint
 */
export interface PortfolioConstraint {
  id: string;
  name: string;
  type: 'CONCENTRATION' | 'EXPOSURE' | 'CORRELATION' | 'LIQUIDITY' | 'DURATION' | 'CUSTOM';
  threshold: number;
  operator: 'MAX' | 'MIN' | 'EQUALS' | 'RANGE';
  rangeMin?: number;
  rangeMax?: number;
  unit?: string;
  description?: string;
  breachAction: 'BLOCK' | 'WARN' | 'ESCALATE';
}

/**
 * Risk tradeoff definition
 */
export interface RiskTradeoff {
  id: string;
  dimension1: string;
  dimension2: string;
  relationship: 'INVERSE' | 'CORRELATED' | 'INDEPENDENT';
  priority?: 'DIMENSION_1' | 'DIMENSION_2' | 'BALANCED';
  notes?: string;
}

/**
 * RISK_APPETITE module payload
 */
export interface RiskAppetiteModulePayload extends SchemaVersioned {
  framework: string;
  frameworkVersion?: string;
  dimensions: RiskDimension[];
  portfolioConstraints: PortfolioConstraint[];
  tradeoffs?: RiskTradeoff[];
  // Aggregate risk settings
  aggregateRiskLimit?: {
    metric: string;
    maxValue: number;
    unit?: string;
  };
  reviewCycle?: {
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    nextReviewDate?: string;
  };
}

// =============================================================================
// GOVERNANCE THRESHOLDS MODULE
// =============================================================================

/**
 * Approval tier condition
 */
export interface ApprovalCondition {
  field: string;
  operator: ExclusionOperator;
  value: string | number | boolean | string[];
  logic?: 'AND' | 'OR';
}

/**
 * Required approver specification
 */
export interface RequiredApprover {
  role: string;
  count: number;
  mustInclude?: string[];
  mustExclude?: string[];
}

/**
 * Approval tier definition
 */
export interface ApprovalTier extends AuditableItem {
  name: string;
  description?: string;
  priority: number;
  conditions: ApprovalCondition[];
  requiredApprovers: RequiredApprover[];
  escalationPath?: string;
  timeLimit?: {
    hours: number;
    escalateOnExpiry: boolean;
  };
  // For IC-style decisions
  quorumRequired?: boolean;
  quorumMinimum?: number;
  votingRule?: 'UNANIMOUS' | 'MAJORITY' | 'SUPERMAJORITY';
}

/**
 * Conflict of interest policy
 */
export interface ConflictsPolicy {
  requireDisclosure: boolean;
  disclosureScope: 'ALL' | 'MATERIAL' | 'FINANCIAL';
  recusalRules: {
    condition: string;
    action: 'RECUSE' | 'DISCLOSE' | 'ESCALATE';
  }[];
  coolingOffPeriod?: {
    days: number;
    applicableTo: string[];
  };
}

/**
 * GOVERNANCE_THRESHOLDS module payload
 */
export interface GovernanceThresholdsModulePayload extends SchemaVersioned {
  approvalTiers: ApprovalTier[];
  conflictsPolicy: ConflictsPolicy;
  // Default settings
  defaults?: {
    defaultTier?: string;
    defaultTimeLimit?: number;
    requireJustification: boolean;
  };
  // Delegation rules
  delegation?: {
    allowDelegation: boolean;
    maxDelegationDepth: number;
    delegableRoles: string[];
  };
}

// =============================================================================
// REPORTING OBLIGATIONS MODULE
// =============================================================================

/**
 * Report frequency
 */
export type ReportFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'ANNUALLY'
  | 'AD_HOC';

/**
 * Report section definition
 */
export interface ReportSection {
  id: string;
  name: string;
  type: 'METRICS' | 'NARRATIVE' | 'TABLE' | 'CHART' | 'APPENDIX';
  required: boolean;
  dataSource?: string;
  template?: string;
}

/**
 * Report pack definition
 */
export interface ReportPack extends AuditableItem {
  name: string;
  description?: string;
  frequency: ReportFrequency;
  audience: string[];
  sections: ReportSection[];
  signoffRoles: string[];
  // Delivery settings
  delivery?: {
    format: ('PDF' | 'EXCEL' | 'HTML' | 'API')[];
    channels: ('EMAIL' | 'PORTAL' | 'API')[];
    encryption?: boolean;
  };
  // Schedule
  schedule?: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    deadlineOffset?: number;
  };
  // Regulatory flag
  regulatory?: {
    isRequired: boolean;
    regulatorId?: string;
    submissionDeadline?: string;
  };
}

/**
 * REPORTING_OBLIGATIONS module payload
 */
export interface ReportingObligationsModulePayload extends SchemaVersioned {
  packs: ReportPack[];
  // Global reporting settings
  settings?: {
    defaultFormat: 'PDF' | 'EXCEL' | 'HTML';
    retentionYears: number;
    versionControl: boolean;
  };
  // Calendar
  calendar?: {
    timezone: string;
    holidays?: string[];
    businessDaysOnly: boolean;
  };
}

// =============================================================================
// EVIDENCE ADMISSIBILITY MODULE
// =============================================================================

/**
 * Evidence type definition
 */
export interface EvidenceType {
  id: string;
  name: string;
  description?: string;
  category: 'DOCUMENT' | 'DATA' | 'ATTESTATION' | 'EXTERNAL' | 'SYSTEM';
  format?: string[];
  maxAge?: {
    value: number;
    unit: 'DAYS' | 'MONTHS' | 'YEARS';
  };
  required?: boolean;
}

/**
 * Confidence rule for evidence scoring
 */
export interface ConfidenceRule {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: ExclusionOperator;
    value: string | number | boolean | string[];
  };
  adjustment: {
    type: 'MULTIPLY' | 'ADD' | 'SET';
    value: number;
  };
  rationale?: string;
}

/**
 * Evidence decay rule
 */
export interface DecayRule {
  id: string;
  evidenceType: string;
  decayFunction: 'LINEAR' | 'EXPONENTIAL' | 'STEP';
  parameters: {
    halfLife?: number;
    rate?: number;
    steps?: { age: number; multiplier: number }[];
  };
  floor?: number;
}

/**
 * EVIDENCE_ADMISSIBILITY module payload
 */
export interface EvidenceAdmissibilityModulePayload extends SchemaVersioned {
  allowedEvidenceTypes: EvidenceType[];
  forbiddenEvidenceTypes: string[];
  confidenceRules: ConfidenceRule[];
  decayRules?: DecayRule[];
  // Global evidence settings
  settings?: {
    minimumConfidenceThreshold: number;
    requireCorroboration: boolean;
    corroborationCount?: number;
    allowSelfAttestation: boolean;
    auditTrailRequired: boolean;
  };
}

// =============================================================================
// MODULE PAYLOAD UNION TYPE
// =============================================================================

/**
 * Union type for all module payloads
 */
export type BaselineModulePayload =
  | MandatesModulePayload
  | ExclusionsModulePayload
  | RiskAppetiteModulePayload
  | GovernanceThresholdsModulePayload
  | ReportingObligationsModulePayload
  | EvidenceAdmissibilityModulePayload;

/**
 * Module type to payload mapping
 */
export interface ModulePayloadMap {
  MANDATES: MandatesModulePayload;
  EXCLUSIONS: ExclusionsModulePayload;
  RISK_APPETITE: RiskAppetiteModulePayload;
  GOVERNANCE_THRESHOLDS: GovernanceThresholdsModulePayload;
  REPORTING_OBLIGATIONS: ReportingObligationsModulePayload;
  EVIDENCE_ADMISSIBILITY: EvidenceAdmissibilityModulePayload;
}

/**
 * Module type enum matching Prisma
 */
export type PortfolioBaselineModuleType = keyof ModulePayloadMap;

/**
 * All module types as array
 */
export const ALL_MODULE_TYPES: PortfolioBaselineModuleType[] = [
  'MANDATES',
  'EXCLUSIONS',
  'RISK_APPETITE',
  'GOVERNANCE_THRESHOLDS',
  'REPORTING_OBLIGATIONS',
  'EVIDENCE_ADMISSIBILITY',
];

// =============================================================================
// BASELINE STATUS & APPROVAL WORKFLOW
// =============================================================================

/**
 * Baseline status enum matching Prisma
 */
export type PortfolioBaselineStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'REJECTED';

/**
 * All baseline statuses
 */
export const ALL_BASELINE_STATUSES: PortfolioBaselineStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'PUBLISHED',
  'ARCHIVED',
  'REJECTED',
];

/**
 * Status display configuration
 */
export const BASELINE_STATUS_CONFIG: Record<
  PortfolioBaselineStatus,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  DRAFT: {
    label: 'Draft',
    description: 'In progress, not yet submitted for approval',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    description: 'Submitted and awaiting review',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  PUBLISHED: {
    label: 'Published',
    description: 'Approved and active',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  ARCHIVED: {
    label: 'Archived',
    description: 'Previously published, now superseded',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Returned for revision',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
  },
};

/**
 * Approval workflow user info
 */
export interface ApprovalUserInfo {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Baseline version with approval workflow fields
 */
export interface BaselineVersionWithApproval {
  id: string;
  portfolioId: string;
  versionNumber: number;
  status: PortfolioBaselineStatus;
  schemaVersion: number;
  parentVersionId: string | null;
  createdAt: string;
  createdBy: ApprovalUserInfo;

  // Submission
  submittedAt: string | null;
  submittedBy: ApprovalUserInfo | null;

  // Approval
  approvedAt: string | null;
  approvedBy: ApprovalUserInfo | null;

  // Rejection
  rejectedAt: string | null;
  rejectedBy: ApprovalUserInfo | null;
  rejectionReason: string | null;

  // Publishing
  publishedAt: string | null;
  publishedBy: ApprovalUserInfo | null;
  changeSummary: string | null;
  contentHash: string | null;

  // Derived state
  isActive: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
}

// =============================================================================
// DEFAULT PAYLOADS
// =============================================================================

/**
 * Default empty payload for each module type
 */
export function getDefaultPayload<T extends PortfolioBaselineModuleType>(
  moduleType: T
): ModulePayloadMap[T] {
  const defaults: ModulePayloadMap = {
    MANDATES: {
      schemaVersion: 1,
      mandates: [],
      allocationRules: {
        totalMustEqual100: false,
        allowOverlap: true,
        overlapResolution: 'HIGHEST_PRIORITY',
      },
    },
    EXCLUSIONS: {
      schemaVersion: 1,
      items: [],
      settings: {
        defaultType: 'HARD',
        requireRationale: true,
        allowTemporaryOverrides: false,
      },
    },
    RISK_APPETITE: {
      schemaVersion: 1,
      framework: '',
      dimensions: [],
      portfolioConstraints: [],
      tradeoffs: [],
    },
    GOVERNANCE_THRESHOLDS: {
      schemaVersion: 1,
      approvalTiers: [],
      conflictsPolicy: {
        requireDisclosure: true,
        disclosureScope: 'MATERIAL',
        recusalRules: [],
      },
    },
    REPORTING_OBLIGATIONS: {
      schemaVersion: 1,
      packs: [],
    },
    EVIDENCE_ADMISSIBILITY: {
      schemaVersion: 1,
      allowedEvidenceTypes: [],
      forbiddenEvidenceTypes: [],
      confidenceRules: [],
      decayRules: [],
    },
  };

  return defaults[moduleType];
}

// =============================================================================
// INDUSTRY CONFIGURATION
// =============================================================================

/**
 * Industry-specific labels and options
 * Used for UI display without changing the underlying schema
 */
export interface IndustryConfig {
  portfolio: {
    singular: string;
    plural: string;
  };
  mandate: {
    singular: string;
    plural: string;
  };
  case: {
    singular: string;
    plural: string;
  };
  stages: { value: string; label: string }[];
  domains: { value: string; label: string }[];
  sizingFields: {
    field: string;
    label: string;
    unit: string;
    type: 'currency' | 'number' | 'percentage';
  }[];
}

export const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  VENTURE_CAPITAL: {
    portfolio: { singular: 'Fund', plural: 'Funds' },
    mandate: { singular: 'Mandate', plural: 'Mandates' },
    case: { singular: 'Deal', plural: 'Deals' },
    stages: [
      { value: 'pre-seed', label: 'Pre-Seed' },
      { value: 'seed', label: 'Seed' },
      { value: 'series-a', label: 'Series A' },
      { value: 'series-b', label: 'Series B' },
      { value: 'series-c', label: 'Series C' },
      { value: 'growth', label: 'Growth' },
      { value: 'late-stage', label: 'Late Stage' },
    ],
    domains: [
      { value: 'enterprise-saas', label: 'Enterprise SaaS' },
      { value: 'fintech', label: 'FinTech' },
      { value: 'healthtech', label: 'HealthTech' },
      { value: 'climate', label: 'Climate Tech' },
      { value: 'ai-ml', label: 'AI/ML' },
      { value: 'consumer', label: 'Consumer' },
      { value: 'infrastructure', label: 'Infrastructure' },
    ],
    sizingFields: [
      { field: 'checkSize', label: 'Check Size', unit: 'USD', type: 'currency' },
      { field: 'ownershipTarget', label: 'Ownership Target', unit: '%', type: 'percentage' },
      { field: 'reserveRatio', label: 'Reserve Ratio', unit: 'x', type: 'number' },
    ],
  },
  INSURANCE: {
    portfolio: { singular: 'Book', plural: 'Books' },
    mandate: { singular: 'Program', plural: 'Programs' },
    case: { singular: 'Underwriting', plural: 'Underwritings' },
    stages: [
      { value: 'primary', label: 'Primary' },
      { value: 'excess', label: 'Excess' },
      { value: 'umbrella', label: 'Umbrella' },
      { value: 'quota-share', label: 'Quota Share' },
      { value: 'excess-of-loss', label: 'Excess of Loss' },
      { value: 'facultative', label: 'Facultative' },
    ],
    domains: [
      { value: 'cyber', label: 'Cyber' },
      { value: 'do', label: 'D&O' },
      { value: 'epl', label: 'EPL' },
      { value: 'property', label: 'Property' },
      { value: 'casualty', label: 'Casualty' },
      { value: 'professional', label: 'Professional Liability' },
      { value: 'marine', label: 'Marine' },
    ],
    sizingFields: [
      { field: 'minPremium', label: 'Minimum Premium', unit: 'USD', type: 'currency' },
      { field: 'maxLine', label: 'Maximum Line', unit: 'USD', type: 'currency' },
      { field: 'retentionLevel', label: 'Retention Level', unit: 'USD', type: 'currency' },
    ],
  },
  PHARMA: {
    portfolio: { singular: 'Pipeline', plural: 'Pipelines' },
    mandate: { singular: 'Program', plural: 'Programs' },
    case: { singular: 'Assessment', plural: 'Assessments' },
    stages: [
      { value: 'discovery', label: 'Discovery' },
      { value: 'preclinical', label: 'Preclinical' },
      { value: 'phase-1', label: 'Phase 1' },
      { value: 'phase-2', label: 'Phase 2' },
      { value: 'phase-3', label: 'Phase 3' },
      { value: 'nda-bla', label: 'NDA/BLA' },
      { value: 'commercial', label: 'Commercial' },
    ],
    domains: [
      { value: 'oncology', label: 'Oncology' },
      { value: 'rare-disease', label: 'Rare Disease' },
      { value: 'gene-therapy', label: 'Gene Therapy' },
      { value: 'immunology', label: 'Immunology' },
      { value: 'neurology', label: 'Neurology' },
      { value: 'cardiology', label: 'Cardiology' },
      { value: 'infectious', label: 'Infectious Disease' },
    ],
    sizingFields: [
      { field: 'budgetMin', label: 'Minimum Budget', unit: 'USD', type: 'currency' },
      { field: 'budgetMax', label: 'Maximum Budget', unit: 'USD', type: 'currency' },
      { field: 'patientCount', label: 'Patient Count', unit: 'patients', type: 'number' },
    ],
  },
  GENERIC: {
    portfolio: { singular: 'Portfolio', plural: 'Portfolios' },
    mandate: { singular: 'Mandate', plural: 'Mandates' },
    case: { singular: 'Case', plural: 'Cases' },
    stages: [
      { value: 'early', label: 'Early Stage' },
      { value: 'mid', label: 'Mid Stage' },
      { value: 'late', label: 'Late Stage' },
      { value: 'mature', label: 'Mature' },
    ],
    domains: [
      { value: 'general', label: 'General' },
    ],
    sizingFields: [
      { field: 'minValue', label: 'Minimum Value', unit: 'USD', type: 'currency' },
      { field: 'maxValue', label: 'Maximum Value', unit: 'USD', type: 'currency' },
    ],
  },
};
