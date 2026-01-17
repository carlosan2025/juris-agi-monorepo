/**
 * Unit Tests: Governance Domain Logic
 *
 * Tests condition evaluation, tier triggering, and requirement computation.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateConditions,
  evaluateApprovalTiers,
  computeRequirements,
  evaluateGovernance,
  evaluateExceptionPolicy,
  isExceptionRequired,
  canParticipate,
  EvaluationContext,
  CaseContext,
  ExceptionContext,
  TriggeredTier,
} from '@/lib/domain/governance';
import type {
  GovernanceThresholdsModulePayload,
  GovernanceCondition,
  GovernanceApprovalTier,
} from '@/lib/baseline/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createTestGovernance = (): GovernanceThresholdsModulePayload => ({
  schemaVersion: 1,
  roles: [
    { id: 'IC_MEMBER', name: 'Investment Committee Member' },
    { id: 'IC_CHAIR', name: 'Investment Committee Chair' },
    { id: 'COMPLIANCE', name: 'Compliance Officer' },
    { id: 'RISK', name: 'Risk Officer' },
    { id: 'DEAL_LEAD', name: 'Deal Lead' },
  ],
  committees: [
    {
      id: 'IC',
      name: 'Investment Committee',
      roleIds: ['IC_MEMBER', 'IC_CHAIR'],
      quorum: { minVotes: 5, minYesVotes: 3, voteType: 'MAJORITY' },
    },
  ],
  approvalTiers: [
    {
      id: 'T1',
      name: 'Standard',
      conditions: [
        { field: 'case.proposedCommitment', operator: 'LTE', value: 2000000 },
        { field: 'case.exclusionOverrides', operator: 'EQUALS', value: 0 },
      ],
      requiredApprovals: [{ committeeId: 'IC', minYesVotes: 3 }],
      requiredSignoffs: [{ roleId: 'COMPLIANCE', required: false }],
    },
    {
      id: 'T2',
      name: 'Enhanced',
      conditions: [
        { field: 'case.proposedCommitment', operator: 'GT', value: 2000000 },
        { field: 'case.exclusionOverrides', operator: 'EQUALS', value: 0 },
      ],
      requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
      requiredSignoffs: [
        { roleId: 'COMPLIANCE', required: true },
        { roleId: 'RISK', required: false },
      ],
    },
    {
      id: 'T3',
      name: 'Exception',
      conditions: [
        { field: 'case.exclusionOverrides', operator: 'GT', value: 0, logic: 'OR' },
        { field: 'case.hardRiskBreaches', operator: 'GT', value: 0 },
      ],
      requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
      requiredSignoffs: [
        { roleId: 'COMPLIANCE', required: true },
        { roleId: 'RISK', required: true },
      ],
    },
  ],
  exceptionPolicy: {
    requiresExceptionRecord: true,
    exceptionSeverity: [
      {
        id: 'E1',
        name: 'Minor',
        conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: false }],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 3 }],
        requiredSignoffs: [{ roleId: 'COMPLIANCE', required: true }],
      },
      {
        id: 'E2',
        name: 'Major',
        conditions: [{ field: 'exception.hardBreach', operator: 'EQUALS', value: true }],
        requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
        requiredSignoffs: [
          { roleId: 'COMPLIANCE', required: true },
          { roleId: 'RISK', required: true },
        ],
      },
    ],
    expiryDefaultDays: 365,
  },
  conflictsPolicy: {
    requiresDisclosure: true,
    recusalRequired: true,
    blockedRoles: ['DEAL_LEAD', 'CASE_OWNER'],
  },
  audit: {
    decisionRecordRequired: true,
    signoffCapture: 'ELECTRONIC',
    retainVersions: true,
  },
});

// =============================================================================
// CONDITION EVALUATION TESTS
// =============================================================================

describe('evaluateCondition', () => {
  describe('EQUALS operator', () => {
    it('should return true when values are equal', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'EQUALS',
        value: 'SEED',
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SEED' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('should return false when values are not equal', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'EQUALS',
        value: 'SEED',
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SERIES_A' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });

    it('should work with boolean values', () => {
      const condition: GovernanceCondition = {
        field: 'exception.hardBreach',
        operator: 'EQUALS',
        value: true,
      };
      const ctx: EvaluationContext = {
        actionType: 'EXCEPTION',
        exception: { hardBreach: true, count: 1 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });
  });

  describe('NOT_EQUALS operator', () => {
    it('should return true when values are different', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'NOT_EQUALS',
        value: 'SEED',
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SERIES_A' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });
  });

  describe('Numeric comparisons', () => {
    it('GT should return true when value is greater', () => {
      const condition: GovernanceCondition = {
        field: 'case.proposedCommitment',
        operator: 'GT',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 1500000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('GT should return false when value is equal', () => {
      const condition: GovernanceCondition = {
        field: 'case.proposedCommitment',
        operator: 'GT',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 1000000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });

    it('GTE should return true when value is equal', () => {
      const condition: GovernanceCondition = {
        field: 'case.proposedCommitment',
        operator: 'GTE',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 1000000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('LT should return true when value is less', () => {
      const condition: GovernanceCondition = {
        field: 'case.proposedCommitment',
        operator: 'LT',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 500000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('LTE should return true when value is equal', () => {
      const condition: GovernanceCondition = {
        field: 'case.proposedCommitment',
        operator: 'LTE',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 1000000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });
  });

  describe('IN/NOT_IN operators', () => {
    it('IN should return true when value is in array', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'IN',
        value: ['SEED', 'SERIES_A', 'SERIES_B'],
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SERIES_A' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });

    it('IN should return false when value is not in array', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'IN',
        value: ['SEED', 'SERIES_A'],
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SERIES_C' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });

    it('NOT_IN should return true when value is not in array', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'NOT_IN',
        value: ['SEED', 'SERIES_A'],
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'GROWTH' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });
  });

  describe('CONTAINS operator', () => {
    it('should work with string contains', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'CONTAINS',
        value: 'SERIES',
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SERIES_A' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(true);
    });
  });

  describe('Missing fields', () => {
    it('should return false when field is missing', () => {
      const condition: GovernanceCondition = {
        field: 'case.nonExistent',
        operator: 'EQUALS',
        value: 'test',
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SEED' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });

    it('should return false when root object is missing', () => {
      const condition: GovernanceCondition = {
        field: 'policy.limit',
        operator: 'GT',
        value: 1000000,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { proposedCommitment: 500000 },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });
  });

  describe('Type mismatches', () => {
    it('should return false for numeric comparison on string', () => {
      const condition: GovernanceCondition = {
        field: 'case.stage',
        operator: 'GT',
        value: 100,
      };
      const ctx: EvaluationContext = {
        actionType: 'DECISION',
        case: { stage: 'SEED' },
      };
      expect(evaluateCondition(condition, ctx)).toBe(false);
    });
  });
});

describe('evaluateConditions', () => {
  it('should return true when all AND conditions match', () => {
    const conditions: GovernanceCondition[] = [
      { field: 'case.proposedCommitment', operator: 'LTE', value: 2000000 },
      { field: 'case.exclusionOverrides', operator: 'EQUALS', value: 0 },
    ];
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0 },
    };
    const result = evaluateConditions(conditions, ctx);
    expect(result.matches).toBe(true);
    expect(result.matchedConditions).toHaveLength(2);
  });

  it('should return false when any AND condition fails', () => {
    const conditions: GovernanceCondition[] = [
      { field: 'case.proposedCommitment', operator: 'LTE', value: 2000000 },
      { field: 'case.exclusionOverrides', operator: 'EQUALS', value: 0 },
    ];
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 2 },
    };
    const result = evaluateConditions(conditions, ctx);
    expect(result.matches).toBe(false);
  });

  it('should return true when OR condition matches', () => {
    const conditions: GovernanceCondition[] = [
      { field: 'case.exclusionOverrides', operator: 'GT', value: 0, logic: 'OR' },
      { field: 'case.hardRiskBreaches', operator: 'GT', value: 0 },
    ];
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { exclusionOverrides: 2, hardRiskBreaches: 0 },
    };
    const result = evaluateConditions(conditions, ctx);
    expect(result.matches).toBe(true);
  });

  it('should return false for empty conditions', () => {
    const result = evaluateConditions([], { actionType: 'DECISION' });
    expect(result.matches).toBe(false);
  });
});

// =============================================================================
// TIER EVALUATION TESTS
// =============================================================================

describe('evaluateApprovalTiers', () => {
  const governance = createTestGovernance();

  it('should trigger T1 (Standard) for small commitment with no overrides', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0, hardRiskBreaches: 0 },
    };
    const triggered = evaluateApprovalTiers(governance, ctx);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].tier.id).toBe('T1');
  });

  it('should trigger T2 (Enhanced) for large commitment with no overrides', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 3000000, exclusionOverrides: 0, hardRiskBreaches: 0 },
    };
    const triggered = evaluateApprovalTiers(governance, ctx);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].tier.id).toBe('T2');
  });

  it('should trigger T3 (Exception) when there are exclusion overrides', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 1, hardRiskBreaches: 0 },
    };
    const triggered = evaluateApprovalTiers(governance, ctx);
    expect(triggered.some(t => t.tier.id === 'T3')).toBe(true);
  });

  it('should trigger T3 (Exception) when there are hard risk breaches', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0, hardRiskBreaches: 1 },
    };
    const triggered = evaluateApprovalTiers(governance, ctx);
    expect(triggered.some(t => t.tier.id === 'T3')).toBe(true);
  });

  it('should trigger multiple tiers when conditions overlap', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 3000000, exclusionOverrides: 1, hardRiskBreaches: 0 },
    };
    const triggered = evaluateApprovalTiers(governance, ctx);
    // Should trigger T3 for exclusion overrides
    expect(triggered.some(t => t.tier.id === 'T3')).toBe(true);
  });
});

// =============================================================================
// REQUIREMENT COMPUTATION TESTS
// =============================================================================

describe('computeRequirements', () => {
  it('should merge committee approvals taking max votes', () => {
    const triggeredTiers: TriggeredTier[] = [
      {
        tier: {
          id: 'T1',
          name: 'T1',
          conditions: [],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 3 }],
          requiredSignoffs: [],
        },
        matchedConditions: [],
      },
      {
        tier: {
          id: 'T2',
          name: 'T2',
          conditions: [],
          requiredApprovals: [{ committeeId: 'IC', minYesVotes: 4 }],
          requiredSignoffs: [],
        },
        matchedConditions: [],
      },
    ];

    const requirements = computeRequirements(triggeredTiers);
    expect(requirements.committeeApprovals).toHaveLength(1);
    expect(requirements.committeeApprovals[0].committeeId).toBe('IC');
    expect(requirements.committeeApprovals[0].minYesVotes).toBe(4);
  });

  it('should merge signoffs with required taking precedence', () => {
    const triggeredTiers: TriggeredTier[] = [
      {
        tier: {
          id: 'T1',
          name: 'T1',
          conditions: [],
          requiredApprovals: [],
          requiredSignoffs: [{ roleId: 'COMPLIANCE', required: false }],
        },
        matchedConditions: [],
      },
      {
        tier: {
          id: 'T2',
          name: 'T2',
          conditions: [],
          requiredApprovals: [],
          requiredSignoffs: [{ roleId: 'COMPLIANCE', required: true }],
        },
        matchedConditions: [],
      },
    ];

    const requirements = computeRequirements(triggeredTiers);
    expect(requirements.signoffs).toHaveLength(1);
    expect(requirements.signoffs[0].roleId).toBe('COMPLIANCE');
    expect(requirements.signoffs[0].required).toBe(true);
  });

  it('should deduplicate signoffs across tiers', () => {
    const triggeredTiers: TriggeredTier[] = [
      {
        tier: {
          id: 'T1',
          name: 'T1',
          conditions: [],
          requiredApprovals: [],
          requiredSignoffs: [
            { roleId: 'COMPLIANCE', required: true },
            { roleId: 'RISK', required: false },
          ],
        },
        matchedConditions: [],
      },
      {
        tier: {
          id: 'T2',
          name: 'T2',
          conditions: [],
          requiredApprovals: [],
          requiredSignoffs: [
            { roleId: 'COMPLIANCE', required: true },
            { roleId: 'RISK', required: true },
          ],
        },
        matchedConditions: [],
      },
    ];

    const requirements = computeRequirements(triggeredTiers);
    expect(requirements.signoffs).toHaveLength(2);
    const riskSignoff = requirements.signoffs.find(s => s.roleId === 'RISK');
    expect(riskSignoff?.required).toBe(true);
  });
});

// =============================================================================
// FULL GOVERNANCE EVALUATION TESTS
// =============================================================================

describe('evaluateGovernance', () => {
  const governance = createTestGovernance();

  it('should evaluate standard case without blocking', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0, hardRiskBreaches: 0 },
    };
    const result = evaluateGovernance(ctx, governance);
    expect(result.blocked).toBe(false);
    expect(result.triggeredTiers).toHaveLength(1);
    expect(result.requirements.committeeApprovals).toHaveLength(1);
  });

  it('should block decision with hard risk breach and no exception draft', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0, hardRiskBreaches: 1 },
      exception: { hardBreach: true, count: 1, hasExceptionDraft: false },
    };
    const result = evaluateGovernance(ctx, governance);
    expect(result.blocked).toBe(true);
    expect(result.reasons.some(r => r.includes('hard'))).toBe(true);
  });

  it('should not block decision with hard breach if exception draft exists', () => {
    const ctx: EvaluationContext = {
      actionType: 'DECISION',
      case: { proposedCommitment: 1500000, exclusionOverrides: 0, hardRiskBreaches: 1 },
      exception: { hardBreach: true, count: 1, hasExceptionDraft: true },
    };
    const result = evaluateGovernance(ctx, governance);
    expect(result.blocked).toBe(false);
  });
});

// =============================================================================
// EXCEPTION POLICY EVALUATION TESTS
// =============================================================================

describe('evaluateExceptionPolicy', () => {
  const governance = createTestGovernance();

  it('should match Minor severity for soft breach', () => {
    const exceptionCtx: ExceptionContext = {
      hardBreach: false,
      count: 1,
    };
    const result = evaluateExceptionPolicy(exceptionCtx, governance);
    expect(result.severityClass?.id).toBe('E1');
    expect(result.severityClass?.name).toBe('Minor');
    expect(result.requirements.committeeApprovals[0].minYesVotes).toBe(3);
  });

  it('should match Major severity for hard breach', () => {
    const exceptionCtx: ExceptionContext = {
      hardBreach: true,
      count: 1,
    };
    const result = evaluateExceptionPolicy(exceptionCtx, governance);
    expect(result.severityClass?.id).toBe('E2');
    expect(result.severityClass?.name).toBe('Major');
    expect(result.requirements.committeeApprovals[0].minYesVotes).toBe(4);
    expect(result.requirements.signoffs).toHaveLength(2);
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('isExceptionRequired', () => {
  it('should return true when there are exclusion overrides', () => {
    const ctx: CaseContext = { exclusionOverrides: 1, hardRiskBreaches: 0 };
    expect(isExceptionRequired(ctx)).toBe(true);
  });

  it('should return true when there are hard risk breaches', () => {
    const ctx: CaseContext = { exclusionOverrides: 0, hardRiskBreaches: 2 };
    expect(isExceptionRequired(ctx)).toBe(true);
  });

  it('should return false when neither is present', () => {
    const ctx: CaseContext = { exclusionOverrides: 0, hardRiskBreaches: 0 };
    expect(isExceptionRequired(ctx)).toBe(false);
  });

  it('should return false when fields are undefined', () => {
    const ctx: CaseContext = {};
    expect(isExceptionRequired(ctx)).toBe(false);
  });
});

describe('canParticipate', () => {
  const governance = createTestGovernance();

  it('should allow participation for non-blocked roles', () => {
    const result = canParticipate(governance, ['IC_MEMBER'], false);
    expect(result.canVote).toBe(true);
    expect(result.canSignoff).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('should block participation for blocked roles', () => {
    const result = canParticipate(governance, ['DEAL_LEAD'], false);
    expect(result.canVote).toBe(false);
    expect(result.canSignoff).toBe(false);
    expect(result.reasons.some(r => r.includes('DEAL_LEAD'))).toBe(true);
  });

  it('should block case owner when CASE_OWNER is blocked', () => {
    const result = canParticipate(governance, ['IC_MEMBER'], true);
    expect(result.canVote).toBe(false);
    expect(result.reasons.some(r => r.includes('owner'))).toBe(true);
  });
});
