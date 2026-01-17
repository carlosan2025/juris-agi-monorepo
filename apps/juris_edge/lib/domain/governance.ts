/**
 * Governance Domain Logic
 *
 * Pure functions for evaluating governance rules, determining approval requirements,
 * and handling exception routing.
 *
 * This module implements the conditions DSL and approval tier evaluation.
 */

import type {
  GovernanceThresholdsModulePayload,
  GovernanceCondition,
  GovernanceApprovalTier,
  GovernanceOperator,
  RequiredCommitteeApproval,
  RequiredSignoff,
  ExceptionSeverityClass,
} from '../baseline/types';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Case context for governance evaluation
 */
export interface CaseContext {
  // Common fields
  proposedCommitment?: number;
  exclusionOverrides?: number;
  hardRiskBreaches?: number;

  // VC-specific
  ownershipTarget?: number;
  stage?: string;

  // Insurance-specific
  limit?: number;
  premium?: number;
  pricingAdequacyFlag?: boolean;
  lineOfBusiness?: string;
  daFailures?: number;

  // Pharma-specific
  stageGate?: string;
  budget?: number;
  patientCount?: number;
  territoryDeal?: boolean;
  therapeuticArea?: string;

  // Generic
  value?: number;

  // Additional context
  [key: string]: unknown;
}

/**
 * Exception context for severity evaluation
 */
export interface ExceptionContext {
  hardBreach: boolean;
  count: number;
  items?: {
    type: 'EXCLUSION_OVERRIDE' | 'RISK_HARD_BREACH';
    refId: string;
  }[];
  hasExceptionDraft?: boolean;
}

/**
 * Combined evaluation context
 */
export interface EvaluationContext {
  actionType: 'DECISION' | 'EXCEPTION';
  case?: CaseContext;
  policy?: CaseContext;  // For insurance
  program?: CaseContext; // For pharma
  exception?: ExceptionContext;
}

// =============================================================================
// EVALUATION RESULTS
// =============================================================================

/**
 * Triggered approval tier result
 */
export interface TriggeredTier {
  tier: GovernanceApprovalTier;
  matchedConditions: GovernanceCondition[];
}

/**
 * Computed approval requirements
 */
export interface ApprovalRequirements {
  committeeApprovals: RequiredCommitteeApproval[];
  signoffs: RequiredSignoff[];
}

/**
 * Full governance evaluation result
 */
export interface GovernanceEvaluationResult {
  triggeredTiers: TriggeredTier[];
  requirements: ApprovalRequirements;
  blocked: boolean;
  reasons: string[];
}

/**
 * Exception policy evaluation result
 */
export interface ExceptionEvaluationResult {
  severityClass: ExceptionSeverityClass | null;
  requirements: ApprovalRequirements;
  blocked: boolean;
  reasons: string[];
}

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/**
 * Get a value from the context using a dot-notation path
 * Supports paths like: case.proposedCommitment, policy.limit, exception.hardBreach
 */
function getValueFromContext(ctx: EvaluationContext, path: string): unknown {
  const parts = path.split('.');
  if (parts.length < 2) return undefined;

  const [rootKey, ...fieldParts] = parts;
  const rootObj = ctx[rootKey as keyof EvaluationContext];

  if (!rootObj || typeof rootObj !== 'object') return undefined;

  // Navigate through nested fields
  let current: unknown = rootObj;
  for (const part of fieldParts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate a single condition against a context
 * Returns false if field is missing or type mismatch (safe evaluation)
 */
export function evaluateCondition(
  condition: GovernanceCondition,
  ctx: EvaluationContext
): boolean {
  const value = getValueFromContext(ctx, condition.field);

  // If field is missing, condition evaluates to false (safe default)
  if (value === undefined || value === null) {
    return false;
  }

  const { operator, value: conditionValue } = condition;

  switch (operator) {
    case 'EQUALS':
      return value === conditionValue;

    case 'NOT_EQUALS':
      return value !== conditionValue;

    case 'GT':
      if (typeof value !== 'number' || typeof conditionValue !== 'number') return false;
      return value > conditionValue;

    case 'GTE':
      if (typeof value !== 'number' || typeof conditionValue !== 'number') return false;
      return value >= conditionValue;

    case 'LT':
      if (typeof value !== 'number' || typeof conditionValue !== 'number') return false;
      return value < conditionValue;

    case 'LTE':
      if (typeof value !== 'number' || typeof conditionValue !== 'number') return false;
      return value <= conditionValue;

    case 'IN':
      if (!Array.isArray(conditionValue)) return false;
      return (conditionValue as (string | number)[]).includes(value as string | number);

    case 'NOT_IN':
      if (!Array.isArray(conditionValue)) return false;
      return !(conditionValue as (string | number)[]).includes(value as string | number);

    case 'CONTAINS':
      if (typeof value === 'string' && typeof conditionValue === 'string') {
        return value.includes(conditionValue);
      }
      if (Array.isArray(value)) {
        return value.includes(conditionValue);
      }
      return false;

    default:
      // Unknown operator, fail safe
      return false;
  }
}

/**
 * Evaluate multiple conditions with AND/OR logic
 * Default is AND logic (all conditions must match)
 */
export function evaluateConditions(
  conditions: GovernanceCondition[],
  ctx: EvaluationContext
): { matches: boolean; matchedConditions: GovernanceCondition[] } {
  if (conditions.length === 0) {
    return { matches: false, matchedConditions: [] };
  }

  const matchedConditions: GovernanceCondition[] = [];
  let hasOrGroup = false;
  let orGroupMatches = false;
  let andGroupMatches = true;

  for (const condition of conditions) {
    const result = evaluateCondition(condition, ctx);

    if (result) {
      matchedConditions.push(condition);
    }

    if (condition.logic === 'OR') {
      hasOrGroup = true;
      if (result) {
        orGroupMatches = true;
      }
    } else {
      // AND logic (default)
      if (!result) {
        andGroupMatches = false;
      }
    }
  }

  // If there's an OR group, either OR or AND must match
  // If no OR group, all must match (AND)
  const matches = hasOrGroup ? (orGroupMatches || andGroupMatches) : andGroupMatches;

  return { matches, matchedConditions: matches ? matchedConditions : [] };
}

// =============================================================================
// TIER EVALUATION
// =============================================================================

/**
 * Evaluate which approval tiers are triggered by the context
 */
export function evaluateApprovalTiers(
  governance: GovernanceThresholdsModulePayload,
  ctx: EvaluationContext
): TriggeredTier[] {
  const triggered: TriggeredTier[] = [];

  for (const tier of governance.approvalTiers) {
    const { matches, matchedConditions } = evaluateConditions(tier.conditions, ctx);

    if (matches) {
      triggered.push({
        tier,
        matchedConditions,
      });
    }
  }

  return triggered;
}

// =============================================================================
// REQUIREMENT COMPUTATION
// =============================================================================

/**
 * Merge and deduplicate committee approvals
 * Takes the maximum minYesVotes for each committee
 */
function mergeCommitteeApprovals(
  approvals: RequiredCommitteeApproval[]
): RequiredCommitteeApproval[] {
  const byCommittee = new Map<string, number>();

  for (const approval of approvals) {
    const current = byCommittee.get(approval.committeeId) || 0;
    byCommittee.set(approval.committeeId, Math.max(current, approval.minYesVotes));
  }

  return Array.from(byCommittee.entries()).map(([committeeId, minYesVotes]) => ({
    committeeId,
    minYesVotes,
  }));
}

/**
 * Merge and deduplicate signoffs
 * If any tier requires a signoff, it becomes required
 */
function mergeSignoffs(signoffs: RequiredSignoff[]): RequiredSignoff[] {
  const byRole = new Map<string, boolean>();

  for (const signoff of signoffs) {
    const current = byRole.get(signoff.roleId) || false;
    // If any tier marks it as required, it's required
    byRole.set(signoff.roleId, current || signoff.required);
  }

  return Array.from(byRole.entries()).map(([roleId, required]) => ({
    roleId,
    required,
  }));
}

/**
 * Compute combined requirements from triggered tiers
 */
export function computeRequirements(
  triggeredTiers: TriggeredTier[]
): ApprovalRequirements {
  const allApprovals: RequiredCommitteeApproval[] = [];
  const allSignoffs: RequiredSignoff[] = [];

  for (const { tier } of triggeredTiers) {
    allApprovals.push(...tier.requiredApprovals);
    allSignoffs.push(...tier.requiredSignoffs);
  }

  return {
    committeeApprovals: mergeCommitteeApprovals(allApprovals),
    signoffs: mergeSignoffs(allSignoffs),
  };
}

// =============================================================================
// MAIN EVALUATION FUNCTIONS
// =============================================================================

/**
 * Evaluate governance for a case/action
 *
 * Returns triggered tiers, merged requirements, and whether blocked
 */
export function evaluateGovernance(
  ctx: EvaluationContext,
  governance: GovernanceThresholdsModulePayload
): GovernanceEvaluationResult {
  const reasons: string[] = [];

  // Evaluate which tiers are triggered
  const triggeredTiers = evaluateApprovalTiers(governance, ctx);

  // Compute merged requirements
  const requirements = computeRequirements(triggeredTiers);

  // Determine if blocked
  // Blocked if:
  // 1. There's a hard breach (ctx.exception.hardBreach === true)
  // 2. Action is DECISION
  // 3. No exception draft exists
  let blocked = false;

  if (ctx.actionType === 'DECISION' && ctx.exception?.hardBreach) {
    if (!ctx.exception?.hasExceptionDraft) {
      blocked = true;
      reasons.push('Hard breach detected - exception record required before proceeding');
    }
  }

  // Also blocked if hard risk breaches exist without exception
  if (ctx.actionType === 'DECISION' && ctx.case?.hardRiskBreaches && ctx.case.hardRiskBreaches > 0) {
    if (!ctx.exception?.hasExceptionDraft) {
      blocked = true;
      reasons.push(`${ctx.case.hardRiskBreaches} hard risk breach(es) detected - exception record required`);
    }
  }

  // Add triggered tier info to reasons
  if (triggeredTiers.length > 0) {
    reasons.push(`Triggered approval tiers: ${triggeredTiers.map(t => t.tier.name).join(', ')}`);
  }

  return {
    triggeredTiers,
    requirements,
    blocked,
    reasons,
  };
}

/**
 * Evaluate exception policy to determine severity class and requirements
 */
export function evaluateExceptionPolicy(
  exceptionCtx: ExceptionContext,
  governance: GovernanceThresholdsModulePayload
): ExceptionEvaluationResult {
  const reasons: string[] = [];

  if (!governance.exceptionPolicy) {
    return {
      severityClass: null,
      requirements: { committeeApprovals: [], signoffs: [] },
      blocked: false,
      reasons: ['No exception policy defined'],
    };
  }

  // Build evaluation context for exception
  const ctx: EvaluationContext = {
    actionType: 'EXCEPTION',
    exception: exceptionCtx,
  };

  // Find matching severity class (first match wins, so order matters)
  let matchedSeverity: ExceptionSeverityClass | null = null;

  for (const severity of governance.exceptionPolicy.exceptionSeverity) {
    const { matches } = evaluateConditions(severity.conditions, ctx);
    if (matches) {
      matchedSeverity = severity;
      break;
    }
  }

  if (!matchedSeverity) {
    // No matching severity class - use first one as default or return empty
    if (governance.exceptionPolicy.exceptionSeverity.length > 0) {
      matchedSeverity = governance.exceptionPolicy.exceptionSeverity[0];
      reasons.push(`No matching severity class - defaulting to ${matchedSeverity.name}`);
    } else {
      return {
        severityClass: null,
        requirements: { committeeApprovals: [], signoffs: [] },
        blocked: false,
        reasons: ['No severity classes defined in exception policy'],
      };
    }
  }

  reasons.push(`Exception severity: ${matchedSeverity.name}`);

  // Compute requirements from severity class
  const requirements: ApprovalRequirements = {
    committeeApprovals: matchedSeverity.requiredApprovals,
    signoffs: matchedSeverity.requiredSignoffs,
  };

  return {
    severityClass: matchedSeverity,
    requirements,
    blocked: false,
    reasons,
  };
}

/**
 * Create exception items from case context
 * Used when automatically generating exception drafts
 */
export function createExceptionItems(
  ctx: CaseContext,
  exclusionOverrideIds?: string[],
  riskBreachDimensionIds?: string[]
): ExceptionContext['items'] {
  const items: NonNullable<ExceptionContext['items']> = [];

  // Add exclusion overrides
  if (exclusionOverrideIds) {
    for (const refId of exclusionOverrideIds) {
      items.push({ type: 'EXCLUSION_OVERRIDE', refId });
    }
  }

  // Add risk hard breaches
  if (riskBreachDimensionIds) {
    for (const refId of riskBreachDimensionIds) {
      items.push({ type: 'RISK_HARD_BREACH', refId });
    }
  }

  return items;
}

/**
 * Determine if an exception is required based on case context
 */
export function isExceptionRequired(ctx: CaseContext): boolean {
  // Exception required if:
  // 1. Any exclusion overrides
  // 2. Any hard risk breaches
  const hasExclusionOverrides = (ctx.exclusionOverrides ?? 0) > 0;
  const hasHardBreaches = (ctx.hardRiskBreaches ?? 0) > 0;

  return hasExclusionOverrides || hasHardBreaches;
}

/**
 * Get committee members from governance roles
 */
export function getCommitteeMembers(
  governance: GovernanceThresholdsModulePayload,
  committeeId: string
): string[] {
  const committee = governance.committees.find(c => c.id === committeeId);
  if (!committee) return [];
  return committee.roleIds;
}

/**
 * Validate that a user can vote/sign off based on conflicts policy
 */
export function canParticipate(
  governance: GovernanceThresholdsModulePayload,
  userRoles: string[],
  isCaseOwner: boolean
): { canVote: boolean; canSignoff: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let canVote = true;
  let canSignoff = true;

  // Check blocked roles
  for (const blockedRole of governance.conflictsPolicy.blockedRoles) {
    if (userRoles.includes(blockedRole)) {
      canVote = false;
      canSignoff = false;
      reasons.push(`User has blocked role: ${blockedRole}`);
    }
  }

  // Check if case owner is blocked
  if (isCaseOwner && governance.conflictsPolicy.blockedRoles.includes('CASE_OWNER')) {
    canVote = false;
    canSignoff = false;
    reasons.push('Case owner cannot participate in approval');
  }

  // Recusal required check
  if (governance.conflictsPolicy.recusalRequired && isCaseOwner) {
    canVote = false;
    reasons.push('Recusal required - case owner cannot vote');
  }

  return { canVote, canSignoff, reasons };
}

// =============================================================================
// EXPORTS FOR TESTING
// =============================================================================

export const __testExports = {
  getValueFromContext,
  mergeCommitteeApprovals,
  mergeSignoffs,
};
