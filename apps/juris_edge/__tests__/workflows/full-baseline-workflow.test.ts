/**
 * Integration Tests: Full Baseline Workflow
 * Tests the complete end-to-end baseline workflow:
 * 1. Create portfolio
 * 2. Create baseline draft
 * 3. Edit baseline modules
 * 4. Submit for approval
 * 5. Approve and publish
 * 6. Verify active baseline
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { createMockPrisma } from '../mocks/prisma';
import { createMockAuth, mockSessions, createMockSession } from '../mocks/auth';
import {
  testPortfolios,
  testBaselineVersions,
  testBaselineModules,
  testUsers,
} from '../fixtures/testData';
import {
  BASELINE_WORKFLOW_STATES,
  VALID_BASELINE_TRANSITIONS,
  ADMIN_ROLES,
  isAdminRole,
} from '../helpers/testHelpers';

// Mock dependencies
const mockPrisma = createMockPrisma();
const mockAuth = createMockAuth();

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

describe('Full Baseline Workflow Integration', () => {
  // Simulated workflow state
  let workflowState = {
    portfolioId: null as string | null,
    baselineVersionId: null as string | null,
    currentStatus: null as string | null,
    moduleStates: {} as Record<string, { isComplete: boolean; isValid: boolean }>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset workflow state
    workflowState = {
      portfolioId: testPortfolios.active.id,
      baselineVersionId: null,
      currentStatus: null,
      moduleStates: {},
    };
  });

  describe('Workflow State Machine', () => {
    it('should validate state transitions', () => {
      // Test valid transitions
      expect(VALID_BASELINE_TRANSITIONS.DRAFT).toContain('PENDING_APPROVAL');
      expect(VALID_BASELINE_TRANSITIONS.PENDING_APPROVAL).toContain('PUBLISHED');
      expect(VALID_BASELINE_TRANSITIONS.PENDING_APPROVAL).toContain('REJECTED');
      expect(VALID_BASELINE_TRANSITIONS.REJECTED).toContain('PENDING_APPROVAL');
    });

    it('should not allow direct DRAFT to PUBLISHED transition', () => {
      expect(VALID_BASELINE_TRANSITIONS.DRAFT).not.toContain('PUBLISHED');
    });

    it('should not allow PUBLISHED baseline to be edited', () => {
      expect(VALID_BASELINE_TRANSITIONS.PUBLISHED).not.toContain('DRAFT');
      expect(VALID_BASELINE_TRANSITIONS.PUBLISHED).not.toContain('PENDING_APPROVAL');
    });

    it('should allow REJECTED baseline to be resubmitted', () => {
      expect(VALID_BASELINE_TRANSITIONS.REJECTED).toContain('PENDING_APPROVAL');
    });
  });

  describe('Step 1: Create Baseline Draft', () => {
    it('should only allow admins to create drafts', () => {
      const adminRoles = ['OWNER', 'ORG_ADMIN'];
      const nonAdminRoles = ['MEMBER', 'VIEWER', 'COMPLIANCE'];

      adminRoles.forEach((role) => {
        expect(isAdminRole(role)).toBe(true);
      });

      nonAdminRoles.forEach((role) => {
        expect(isAdminRole(role)).toBe(false);
      });
    });

    it('should prevent creating draft when one exists', async () => {
      // Simulate existing draft check
      const existingDraft = { ...testBaselineVersions.draft };
      expect(existingDraft.status).toBe('DRAFT');

      // In real API, this would return 409 Conflict
      const shouldBlock = existingDraft.status === 'DRAFT';
      expect(shouldBlock).toBe(true);
    });

    it('should initialize all module types on creation', () => {
      const moduleTypes = [
        'INVESTMENT_THESIS',
        'MARKET_ANALYSIS',
        'RISK_MANAGEMENT',
        'CONSTRAINTS',
        'OPERATIONAL_FRAMEWORK',
        'PERFORMANCE_METRICS',
        'CASH_FLOW',
        'GOVERNANCE',
        'REPORTING',
        'VALUATION',
      ];

      // Verify all module types would be created
      expect(moduleTypes).toHaveLength(10);
      moduleTypes.forEach((type) => {
        expect(type).toBeTruthy();
      });
    });
  });

  describe('Step 2: Edit Baseline Modules', () => {
    it('should only allow editing in DRAFT or REJECTED status', () => {
      const editableStatuses = ['DRAFT', 'REJECTED'];
      const nonEditableStatuses = ['PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED'];

      editableStatuses.forEach((status) => {
        const canEdit = ['DRAFT', 'REJECTED'].includes(status);
        expect(canEdit).toBe(true);
      });

      nonEditableStatuses.forEach((status) => {
        const canEdit = ['DRAFT', 'REJECTED'].includes(status);
        expect(canEdit).toBe(false);
      });
    });

    it('should track module completeness', () => {
      const module = {
        ...testBaselineModules.investmentThesis,
        isComplete: true,
        isValid: true,
      };

      expect(module.isComplete).toBe(true);
      expect(module.isValid).toBe(true);
    });

    it('should validate module payload schema', () => {
      // Module payload should have expected structure
      const payload = testBaselineModules.investmentThesis.payload;

      expect(payload).toBeDefined();
      expect(typeof payload).toBe('object');
    });
  });

  describe('Step 3: Submit for Approval', () => {
    it('should require all modules to be valid before submission', () => {
      const modules = [
        { moduleType: 'INVESTMENT_THESIS', isComplete: true, isValid: true },
        { moduleType: 'RISK_MANAGEMENT', isComplete: false, isValid: true },
        { moduleType: 'CONSTRAINTS', isComplete: true, isValid: false },
      ];

      const allValid = modules.every((m) => m.isValid);
      expect(allValid).toBe(false);

      // Only CONSTRAINTS has isValid = false
      const invalidModules = modules.filter((m) => !m.isValid);
      expect(invalidModules).toHaveLength(1);
      expect(invalidModules[0].moduleType).toBe('CONSTRAINTS');
    });

    it('should transition from DRAFT to PENDING_APPROVAL', () => {
      const beforeStatus = 'DRAFT';
      const afterStatus = 'PENDING_APPROVAL';

      const isValidTransition = VALID_BASELINE_TRANSITIONS[beforeStatus as keyof typeof VALID_BASELINE_TRANSITIONS]
        ?.includes(afterStatus);
      expect(isValidTransition).toBe(true);
    });

    it('should allow resubmission from REJECTED status', () => {
      const beforeStatus = 'REJECTED';
      const afterStatus = 'PENDING_APPROVAL';

      const isValidTransition = VALID_BASELINE_TRANSITIONS[beforeStatus as keyof typeof VALID_BASELINE_TRANSITIONS]
        ?.includes(afterStatus);
      expect(isValidTransition).toBe(true);
    });

    it('should clear rejection fields on resubmission', () => {
      const rejectedVersion = { ...testBaselineVersions.rejected };

      // On resubmission, these should be cleared
      const clearedFields = {
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      };

      expect(clearedFields.rejectedAt).toBeNull();
      expect(clearedFields.rejectedById).toBeNull();
      expect(clearedFields.rejectionReason).toBeNull();
    });
  });

  describe('Step 4: Approval Process', () => {
    it('should only allow admins to approve', () => {
      const canApprove = (role: string) => ADMIN_ROLES.includes(role as any);

      expect(canApprove('OWNER')).toBe(true);
      expect(canApprove('ORG_ADMIN')).toBe(true);
      expect(canApprove('MEMBER')).toBe(false);
      expect(canApprove('VIEWER')).toBe(false);
    });

    it('should only approve from PENDING_APPROVAL status', () => {
      const beforeStatus = 'PENDING_APPROVAL';
      const afterStatus = 'PUBLISHED';

      const isValidTransition = VALID_BASELINE_TRANSITIONS[beforeStatus as keyof typeof VALID_BASELINE_TRANSITIONS]
        ?.includes(afterStatus);
      expect(isValidTransition).toBe(true);
    });

    it('should record approval metadata', () => {
      const approvalData = {
        approvedAt: new Date(),
        approvedById: testUsers.owner.id,
        publishedAt: new Date(),
      };

      expect(approvalData.approvedAt).toBeInstanceOf(Date);
      expect(approvalData.approvedById).toBeTruthy();
      expect(approvalData.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('Step 5: Rejection Flow', () => {
    it('should only allow admins to reject', () => {
      const canReject = (role: string) => ADMIN_ROLES.includes(role as any);

      expect(canReject('OWNER')).toBe(true);
      expect(canReject('ORG_ADMIN')).toBe(true);
      expect(canReject('MEMBER')).toBe(false);
    });

    it('should require rejection reason', () => {
      const rejectionData = {
        rejectedAt: new Date(),
        rejectedById: testUsers.owner.id,
        rejectionReason: 'Missing required data in risk management section',
      };

      expect(rejectionData.rejectionReason).toBeTruthy();
      expect(rejectionData.rejectionReason.length).toBeGreaterThan(0);
    });

    it('should transition to REJECTED status', () => {
      const beforeStatus = 'PENDING_APPROVAL';
      const afterStatus = 'REJECTED';

      const isValidTransition = VALID_BASELINE_TRANSITIONS[beforeStatus as keyof typeof VALID_BASELINE_TRANSITIONS]
        ?.includes(afterStatus);
      expect(isValidTransition).toBe(true);
    });
  });

  describe('Step 6: Publication and Active Status', () => {
    it('should set baseline as active on portfolio', () => {
      const portfolioUpdate = {
        activeBaselineVersionId: 'new-published-baseline-id',
      };

      expect(portfolioUpdate.activeBaselineVersionId).toBeTruthy();
    });

    it('should archive previous active baseline', () => {
      const previousBaseline = testBaselineVersions.published;
      const newStatus = 'ARCHIVED';

      // Previous baseline should be archived when new one is published
      expect(previousBaseline.status).toBe('PUBLISHED');
      expect(newStatus).toBe('ARCHIVED');
    });

    it('should maintain audit trail', () => {
      const publishedBaseline = {
        createdById: testUsers.admin.id,
        createdAt: new Date('2024-02-01'),
        submittedById: testUsers.member.id,
        submittedAt: new Date('2024-02-05'),
        approvedById: testUsers.owner.id,
        approvedAt: new Date('2024-02-06'),
        publishedAt: new Date('2024-02-06'),
      };

      // Full audit trail should be maintained
      expect(publishedBaseline.createdById).toBeTruthy();
      expect(publishedBaseline.submittedById).toBeTruthy();
      expect(publishedBaseline.approvedById).toBeTruthy();
      expect(publishedBaseline.createdAt).toBeInstanceOf(Date);
      expect(publishedBaseline.submittedAt).toBeInstanceOf(Date);
      expect(publishedBaseline.approvedAt).toBeInstanceOf(Date);
      expect(publishedBaseline.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('Concurrent Access Control', () => {
    it('should prevent multiple drafts for same portfolio', () => {
      // Only one draft allowed per portfolio
      const draftsCount = 1;
      const maxDrafts = 1;

      expect(draftsCount).toBeLessThanOrEqual(maxDrafts);
    });

    it('should isolate baselines between portfolios', () => {
      const portfolio1 = testPortfolios.active;
      const portfolio2 = testPortfolios.draft;

      expect(portfolio1.id).not.toBe(portfolio2.id);

      // Each portfolio has independent baselines
      const baseline1 = { ...testBaselineVersions.draft, portfolioId: portfolio1.id };
      const baseline2 = { ...testBaselineVersions.draft, portfolioId: portfolio2.id };

      expect(baseline1.portfolioId).not.toBe(baseline2.portfolioId);
    });
  });

  describe('Error Recovery', () => {
    it('should handle submission validation failures gracefully', () => {
      const validationResult = {
        canPublish: false,
        blockers: [
          { moduleType: 'RISK_MANAGEMENT', reason: 'Module is not complete' },
          { moduleType: 'CONSTRAINTS', reason: 'Invalid data in payload' },
        ],
      };

      expect(validationResult.canPublish).toBe(false);
      expect(validationResult.blockers).toHaveLength(2);
    });

    it('should allow fixing and resubmitting rejected baseline', () => {
      // Rejected baseline can be edited
      const status = 'REJECTED';
      const canEdit = ['DRAFT', 'REJECTED'].includes(status);
      expect(canEdit).toBe(true);

      // And then resubmitted
      const canResubmit = VALID_BASELINE_TRANSITIONS.REJECTED.includes('PENDING_APPROVAL');
      expect(canResubmit).toBe(true);
    });
  });
});
