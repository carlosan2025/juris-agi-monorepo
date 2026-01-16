/**
 * Portfolio Baseline Module Validation Functions
 *
 * Each module has a validation function that:
 * 1. Validates the structure matches the expected schema
 * 2. Validates business rules specific to the module
 * 3. Returns validation errors with clear messages
 *
 * Validation is strict for governance purposes - better to reject than allow invalid data.
 */

import {
  PortfolioBaselineModuleType,
  MandatesModulePayload,
  ExclusionsModulePayload,
  RiskAppetiteModulePayload,
  GovernanceThresholdsModulePayload,
  ReportingObligationsModulePayload,
  EvidenceAdmissibilityModulePayload,
  MandateDefinition,
  ExclusionItem,
  RiskDimension,
  ApprovalTier,
  ReportPack,
  EvidenceType,
  BaselineModulePayload,
} from './types';

// =============================================================================
// VALIDATION RESULT TYPE
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createError(
  field: string,
  message: string,
  code: string,
  severity: 'ERROR' | 'WARNING' = 'ERROR'
): ValidationError {
  return { field, message, code, severity };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function hasUniqueIds(items: { id: string }[]): boolean {
  const ids = items.map((item) => item.id);
  return new Set(ids).size === ids.length;
}

// =============================================================================
// MANDATES MODULE VALIDATION
// =============================================================================

function validateMandate(
  mandate: MandateDefinition,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `mandates[${index}]`;

  // Required fields
  if (!isValidId(mandate.id)) {
    errors.push(createError(`${prefix}.id`, 'Mandate must have a valid ID', 'MANDATE_INVALID_ID'));
  }
  if (!isNonEmptyString(mandate.name)) {
    errors.push(createError(`${prefix}.name`, 'Mandate must have a name', 'MANDATE_NAME_REQUIRED'));
  }
  if (!['PRIMARY', 'THEMATIC', 'CARVEOUT'].includes(mandate.type)) {
    errors.push(createError(`${prefix}.type`, 'Invalid mandate type', 'MANDATE_INVALID_TYPE'));
  }
  if (!['ACTIVE', 'RETIRED', 'DRAFT'].includes(mandate.status)) {
    errors.push(createError(`${prefix}.status`, 'Invalid mandate status', 'MANDATE_INVALID_STATUS'));
  }
  if (!isPositiveNumber(mandate.priority)) {
    errors.push(createError(`${prefix}.priority`, 'Priority must be a positive number', 'MANDATE_INVALID_PRIORITY'));
  }

  // Objective validation
  if (!mandate.objective) {
    errors.push(createError(`${prefix}.objective`, 'Mandate must have an objective', 'MANDATE_OBJECTIVE_REQUIRED'));
  } else {
    if (!isNonEmptyString(mandate.objective.primary)) {
      errors.push(createError(`${prefix}.objective.primary`, 'Primary objective is required', 'MANDATE_PRIMARY_OBJECTIVE_REQUIRED'));
    }
    if (!isValidArray(mandate.objective.secondary)) {
      errors.push(createError(`${prefix}.objective.secondary`, 'Secondary objectives must be an array', 'MANDATE_SECONDARY_OBJECTIVES_INVALID'));
    }
  }

  // Scope validation
  if (!mandate.scope) {
    errors.push(createError(`${prefix}.scope`, 'Mandate must have a scope', 'MANDATE_SCOPE_REQUIRED'));
  } else {
    // Geography
    if (!mandate.scope.geography || !isValidArray(mandate.scope.geography.regions)) {
      errors.push(createError(`${prefix}.scope.geography.regions`, 'At least one geographic region is required', 'MANDATE_GEOGRAPHY_REQUIRED'));
    }
    // Domains
    if (!mandate.scope.domains || !isValidArray(mandate.scope.domains.included)) {
      errors.push(createError(`${prefix}.scope.domains.included`, 'At least one domain is required', 'MANDATE_DOMAINS_REQUIRED'));
    }
    // Stages
    if (!mandate.scope.stages || !isValidArray(mandate.scope.stages.included)) {
      errors.push(createError(`${prefix}.scope.stages.included`, 'At least one stage is required', 'MANDATE_STAGES_REQUIRED'));
    }
  }

  // Hard constraints validation
  if (!isValidArray(mandate.hardConstraints)) {
    errors.push(createError(`${prefix}.hardConstraints`, 'Hard constraints must be an array', 'MANDATE_CONSTRAINTS_INVALID'));
  } else {
    mandate.hardConstraints.forEach((constraint, i) => {
      if (!isValidId(constraint.id)) {
        errors.push(createError(`${prefix}.hardConstraints[${i}].id`, 'Constraint must have a valid ID', 'CONSTRAINT_INVALID_ID'));
      }
      if (!isNonEmptyString(constraint.name)) {
        errors.push(createError(`${prefix}.hardConstraints[${i}].name`, 'Constraint must have a name', 'CONSTRAINT_NAME_REQUIRED'));
      }
    });
  }

  return errors;
}

export function validateMandatesModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as MandatesModulePayload;

  // Schema version check
  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  // Mandates array validation
  if (!isValidArray(data.mandates)) {
    errors.push(createError('mandates', 'Mandates must be an array', 'MANDATES_ARRAY_REQUIRED'));
  } else {
    // Check for unique IDs
    if (!hasUniqueIds(data.mandates)) {
      errors.push(createError('mandates', 'Mandate IDs must be unique', 'MANDATE_IDS_NOT_UNIQUE'));
    }

    // Validate each mandate
    data.mandates.forEach((mandate, index) => {
      errors.push(...validateMandate(mandate, index));
    });

    // Business rules
    const activeMandates = data.mandates.filter((m) => m.status === 'ACTIVE');
    const primaryMandates = activeMandates.filter((m) => m.type === 'PRIMARY');

    if (primaryMandates.length === 0 && activeMandates.length > 0) {
      warnings.push(createError('mandates', 'No primary mandate defined', 'NO_PRIMARY_MANDATE', 'WARNING'));
    }

    // Check for priority conflicts
    const priorities = activeMandates.map((m) => m.priority);
    if (new Set(priorities).size !== priorities.length) {
      warnings.push(createError('mandates', 'Multiple mandates share the same priority', 'DUPLICATE_PRIORITIES', 'WARNING'));
    }
  }

  const isComplete = data.mandates && data.mandates.length > 0;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// EXCLUSIONS MODULE VALIDATION
// =============================================================================

function validateExclusion(
  exclusion: ExclusionItem,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `items[${index}]`;

  if (!isValidId(exclusion.id)) {
    errors.push(createError(`${prefix}.id`, 'Exclusion must have a valid ID', 'EXCLUSION_INVALID_ID'));
  }
  if (!isNonEmptyString(exclusion.name)) {
    errors.push(createError(`${prefix}.name`, 'Exclusion must have a name', 'EXCLUSION_NAME_REQUIRED'));
  }
  if (!['HARD', 'CONDITIONAL'].includes(exclusion.type)) {
    errors.push(createError(`${prefix}.type`, 'Invalid exclusion type', 'EXCLUSION_INVALID_TYPE'));
  }
  if (!isNonEmptyString(exclusion.dimension)) {
    errors.push(createError(`${prefix}.dimension`, 'Dimension is required', 'EXCLUSION_DIMENSION_REQUIRED'));
  }
  if (!isValidArray(exclusion.values) || exclusion.values.length === 0) {
    errors.push(createError(`${prefix}.values`, 'At least one value is required', 'EXCLUSION_VALUES_REQUIRED'));
  }
  if (!isNonEmptyString(exclusion.rationale)) {
    errors.push(createError(`${prefix}.rationale`, 'Rationale is required', 'EXCLUSION_RATIONALE_REQUIRED'));
  }

  // Conditional exclusions need approval config
  if (exclusion.type === 'CONDITIONAL' && !exclusion.approvalRequired) {
    errors.push(createError(`${prefix}.approvalRequired`, 'Conditional exclusions must specify approval requirements', 'CONDITIONAL_NEEDS_APPROVAL'));
  }

  return errors;
}

export function validateExclusionsModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as ExclusionsModulePayload;

  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  if (!isValidArray(data.items)) {
    errors.push(createError('items', 'Items must be an array', 'ITEMS_ARRAY_REQUIRED'));
  } else {
    if (!hasUniqueIds(data.items)) {
      errors.push(createError('items', 'Exclusion IDs must be unique', 'EXCLUSION_IDS_NOT_UNIQUE'));
    }

    data.items.forEach((item, index) => {
      errors.push(...validateExclusion(item, index));
    });
  }

  // Exclusions can be empty (portfolio may have none)
  const isComplete = true;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// RISK APPETITE MODULE VALIDATION
// =============================================================================

function validateRiskDimension(
  dimension: RiskDimension,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `dimensions[${index}]`;

  if (!isValidId(dimension.id)) {
    errors.push(createError(`${prefix}.id`, 'Dimension must have a valid ID', 'DIMENSION_INVALID_ID'));
  }
  if (!isNonEmptyString(dimension.name)) {
    errors.push(createError(`${prefix}.name`, 'Dimension must have a name', 'DIMENSION_NAME_REQUIRED'));
  }
  if (!isNonNegativeNumber(dimension.toleranceMin)) {
    errors.push(createError(`${prefix}.toleranceMin`, 'Minimum tolerance must be a non-negative number', 'DIMENSION_MIN_INVALID'));
  }
  if (!isNonNegativeNumber(dimension.toleranceMax)) {
    errors.push(createError(`${prefix}.toleranceMax`, 'Maximum tolerance must be a non-negative number', 'DIMENSION_MAX_INVALID'));
  }
  if (dimension.toleranceMin > dimension.toleranceMax) {
    errors.push(createError(`${prefix}`, 'Minimum tolerance cannot exceed maximum', 'DIMENSION_MIN_EXCEEDS_MAX'));
  }

  return errors;
}

export function validateRiskAppetiteModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as RiskAppetiteModulePayload;

  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  if (!isNonEmptyString(data.framework)) {
    warnings.push(createError('framework', 'Risk framework should be specified', 'FRAMEWORK_RECOMMENDED', 'WARNING'));
  }

  if (!isValidArray(data.dimensions)) {
    errors.push(createError('dimensions', 'Dimensions must be an array', 'DIMENSIONS_ARRAY_REQUIRED'));
  } else {
    if (!hasUniqueIds(data.dimensions)) {
      errors.push(createError('dimensions', 'Dimension IDs must be unique', 'DIMENSION_IDS_NOT_UNIQUE'));
    }

    data.dimensions.forEach((dim, index) => {
      errors.push(...validateRiskDimension(dim, index));
    });
  }

  if (!isValidArray(data.portfolioConstraints)) {
    errors.push(createError('portfolioConstraints', 'Portfolio constraints must be an array', 'CONSTRAINTS_ARRAY_REQUIRED'));
  }

  const isComplete = data.dimensions && data.dimensions.length > 0;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// GOVERNANCE THRESHOLDS MODULE VALIDATION
// =============================================================================

function validateApprovalTier(
  tier: ApprovalTier,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `approvalTiers[${index}]`;

  if (!isValidId(tier.id)) {
    errors.push(createError(`${prefix}.id`, 'Tier must have a valid ID', 'TIER_INVALID_ID'));
  }
  if (!isNonEmptyString(tier.name)) {
    errors.push(createError(`${prefix}.name`, 'Tier must have a name', 'TIER_NAME_REQUIRED'));
  }
  if (!isPositiveNumber(tier.priority)) {
    errors.push(createError(`${prefix}.priority`, 'Priority must be a positive number', 'TIER_INVALID_PRIORITY'));
  }
  if (!isValidArray(tier.conditions) || tier.conditions.length === 0) {
    errors.push(createError(`${prefix}.conditions`, 'At least one condition is required', 'TIER_CONDITIONS_REQUIRED'));
  }
  if (!isValidArray(tier.requiredApprovers) || tier.requiredApprovers.length === 0) {
    errors.push(createError(`${prefix}.requiredApprovers`, 'At least one approver role is required', 'TIER_APPROVERS_REQUIRED'));
  } else {
    tier.requiredApprovers.forEach((approver, i) => {
      if (!isNonEmptyString(approver.role)) {
        errors.push(createError(`${prefix}.requiredApprovers[${i}].role`, 'Approver role is required', 'APPROVER_ROLE_REQUIRED'));
      }
      if (!isPositiveNumber(approver.count)) {
        errors.push(createError(`${prefix}.requiredApprovers[${i}].count`, 'Approver count must be positive', 'APPROVER_COUNT_INVALID'));
      }
    });
  }

  return errors;
}

export function validateGovernanceThresholdsModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as GovernanceThresholdsModulePayload;

  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  if (!isValidArray(data.approvalTiers)) {
    errors.push(createError('approvalTiers', 'Approval tiers must be an array', 'TIERS_ARRAY_REQUIRED'));
  } else {
    if (!hasUniqueIds(data.approvalTiers)) {
      errors.push(createError('approvalTiers', 'Tier IDs must be unique', 'TIER_IDS_NOT_UNIQUE'));
    }

    data.approvalTiers.forEach((tier, index) => {
      errors.push(...validateApprovalTier(tier, index));
    });

    // Check for priority conflicts
    const priorities = data.approvalTiers.map((t) => t.priority);
    if (new Set(priorities).size !== priorities.length) {
      warnings.push(createError('approvalTiers', 'Multiple tiers share the same priority', 'DUPLICATE_TIER_PRIORITIES', 'WARNING'));
    }
  }

  // Conflicts policy validation
  if (!data.conflictsPolicy) {
    errors.push(createError('conflictsPolicy', 'Conflicts policy is required', 'CONFLICTS_POLICY_REQUIRED'));
  } else {
    if (typeof data.conflictsPolicy.requireDisclosure !== 'boolean') {
      errors.push(createError('conflictsPolicy.requireDisclosure', 'Disclosure requirement must be specified', 'DISCLOSURE_REQUIRED'));
    }
  }

  const isComplete = data.approvalTiers && data.approvalTiers.length > 0 && data.conflictsPolicy !== undefined;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// REPORTING OBLIGATIONS MODULE VALIDATION
// =============================================================================

function validateReportPack(
  pack: ReportPack,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `packs[${index}]`;

  if (!isValidId(pack.id)) {
    errors.push(createError(`${prefix}.id`, 'Pack must have a valid ID', 'PACK_INVALID_ID'));
  }
  if (!isNonEmptyString(pack.name)) {
    errors.push(createError(`${prefix}.name`, 'Pack must have a name', 'PACK_NAME_REQUIRED'));
  }
  if (!pack.frequency) {
    errors.push(createError(`${prefix}.frequency`, 'Frequency is required', 'PACK_FREQUENCY_REQUIRED'));
  }
  if (!isValidArray(pack.audience) || pack.audience.length === 0) {
    errors.push(createError(`${prefix}.audience`, 'At least one audience is required', 'PACK_AUDIENCE_REQUIRED'));
  }
  if (!isValidArray(pack.sections) || pack.sections.length === 0) {
    errors.push(createError(`${prefix}.sections`, 'At least one section is required', 'PACK_SECTIONS_REQUIRED'));
  }
  if (!isValidArray(pack.signoffRoles) || pack.signoffRoles.length === 0) {
    errors.push(createError(`${prefix}.signoffRoles`, 'At least one signoff role is required', 'PACK_SIGNOFF_REQUIRED'));
  }

  return errors;
}

export function validateReportingObligationsModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as ReportingObligationsModulePayload;

  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  if (!isValidArray(data.packs)) {
    errors.push(createError('packs', 'Packs must be an array', 'PACKS_ARRAY_REQUIRED'));
  } else {
    if (!hasUniqueIds(data.packs)) {
      errors.push(createError('packs', 'Pack IDs must be unique', 'PACK_IDS_NOT_UNIQUE'));
    }

    data.packs.forEach((pack, index) => {
      errors.push(...validateReportPack(pack, index));
    });
  }

  // Reporting can be empty (not all portfolios have reporting requirements)
  const isComplete = true;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// EVIDENCE ADMISSIBILITY MODULE VALIDATION
// =============================================================================

function validateEvidenceType(
  evidenceType: EvidenceType,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `allowedEvidenceTypes[${index}]`;

  if (!isValidId(evidenceType.id)) {
    errors.push(createError(`${prefix}.id`, 'Evidence type must have a valid ID', 'EVIDENCE_TYPE_INVALID_ID'));
  }
  if (!isNonEmptyString(evidenceType.name)) {
    errors.push(createError(`${prefix}.name`, 'Evidence type must have a name', 'EVIDENCE_TYPE_NAME_REQUIRED'));
  }
  if (!['DOCUMENT', 'DATA', 'ATTESTATION', 'EXTERNAL', 'SYSTEM'].includes(evidenceType.category)) {
    errors.push(createError(`${prefix}.category`, 'Invalid evidence category', 'EVIDENCE_TYPE_INVALID_CATEGORY'));
  }

  return errors;
}

export function validateEvidenceAdmissibilityModule(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push(createError('', 'Invalid payload structure', 'INVALID_PAYLOAD'));
    return { isValid: false, isComplete: false, errors, warnings };
  }

  const data = payload as EvidenceAdmissibilityModulePayload;

  if (!isPositiveNumber(data.schemaVersion)) {
    errors.push(createError('schemaVersion', 'Schema version is required', 'SCHEMA_VERSION_REQUIRED'));
  }

  if (!isValidArray(data.allowedEvidenceTypes)) {
    errors.push(createError('allowedEvidenceTypes', 'Allowed evidence types must be an array', 'ALLOWED_TYPES_ARRAY_REQUIRED'));
  } else {
    if (!hasUniqueIds(data.allowedEvidenceTypes)) {
      errors.push(createError('allowedEvidenceTypes', 'Evidence type IDs must be unique', 'EVIDENCE_TYPE_IDS_NOT_UNIQUE'));
    }

    data.allowedEvidenceTypes.forEach((type, index) => {
      errors.push(...validateEvidenceType(type, index));
    });
  }

  if (!isValidArray(data.forbiddenEvidenceTypes)) {
    errors.push(createError('forbiddenEvidenceTypes', 'Forbidden evidence types must be an array', 'FORBIDDEN_TYPES_ARRAY_REQUIRED'));
  }

  if (!isValidArray(data.confidenceRules)) {
    errors.push(createError('confidenceRules', 'Confidence rules must be an array', 'CONFIDENCE_RULES_ARRAY_REQUIRED'));
  }

  // Check for overlaps between allowed and forbidden
  if (data.allowedEvidenceTypes && data.forbiddenEvidenceTypes) {
    const allowedIds = data.allowedEvidenceTypes.map((t) => t.id);
    const overlaps = data.forbiddenEvidenceTypes.filter((id) => allowedIds.includes(id));
    if (overlaps.length > 0) {
      errors.push(createError('', `Evidence types cannot be both allowed and forbidden: ${overlaps.join(', ')}`, 'EVIDENCE_TYPE_CONFLICT'));
    }
  }

  const isComplete = data.allowedEvidenceTypes && data.allowedEvidenceTypes.length > 0;
  const isValid = errors.length === 0;

  return { isValid, isComplete, errors, warnings };
}

// =============================================================================
// UNIFIED VALIDATION FUNCTION
// =============================================================================

/**
 * Validate a module payload based on its type
 */
export function validateModule(
  moduleType: PortfolioBaselineModuleType,
  payload: unknown
): ValidationResult {
  switch (moduleType) {
    case 'MANDATES':
      return validateMandatesModule(payload);
    case 'EXCLUSIONS':
      return validateExclusionsModule(payload);
    case 'RISK_APPETITE':
      return validateRiskAppetiteModule(payload);
    case 'GOVERNANCE_THRESHOLDS':
      return validateGovernanceThresholdsModule(payload);
    case 'REPORTING_OBLIGATIONS':
      return validateReportingObligationsModule(payload);
    case 'EVIDENCE_ADMISSIBILITY':
      return validateEvidenceAdmissibilityModule(payload);
    default:
      return {
        isValid: false,
        isComplete: false,
        errors: [createError('', `Unknown module type: ${moduleType}`, 'UNKNOWN_MODULE_TYPE')],
        warnings: [],
      };
  }
}

/**
 * Validate all modules for a baseline
 * Returns aggregate validation state for publish checks
 */
export function validateAllModules(
  modules: { moduleType: PortfolioBaselineModuleType; payload: unknown }[]
): {
  allValid: boolean;
  allComplete: boolean;
  results: Record<PortfolioBaselineModuleType, ValidationResult>;
} {
  const results: Partial<Record<PortfolioBaselineModuleType, ValidationResult>> = {};
  let allValid = true;
  let allComplete = true;

  for (const module of modules) {
    const result = validateModule(module.moduleType, module.payload);
    results[module.moduleType] = result;
    if (!result.isValid) allValid = false;
    if (!result.isComplete) allComplete = false;
  }

  return {
    allValid,
    allComplete,
    results: results as Record<PortfolioBaselineModuleType, ValidationResult>,
  };
}

/**
 * Check if a baseline can be published
 * Implements the guard: "Prevent publishing if any module invalid"
 */
export function canPublishBaseline(
  modules: { moduleType: PortfolioBaselineModuleType; payload: unknown }[]
): {
  canPublish: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];
  const { allValid, results } = validateAllModules(modules);

  if (!allValid) {
    for (const [moduleType, result] of Object.entries(results)) {
      if (!result.isValid) {
        blockers.push(`${moduleType}: ${result.errors.length} validation error(s)`);
      }
    }
  }

  // Check that required modules have content
  const requiredModules: PortfolioBaselineModuleType[] = ['MANDATES', 'GOVERNANCE_THRESHOLDS'];
  for (const required of requiredModules) {
    const result = results[required];
    if (!result || !result.isComplete) {
      blockers.push(`${required} module must be complete before publishing`);
    }
  }

  return {
    canPublish: blockers.length === 0,
    blockers,
  };
}
