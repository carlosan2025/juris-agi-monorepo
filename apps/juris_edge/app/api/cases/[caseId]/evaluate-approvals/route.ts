/**
 * Evaluate Approvals API
 *
 * Evaluates governance rules for a case and returns:
 * - Triggered approval tiers
 * - Required committee approvals
 * - Required signoffs
 * - Whether the action is blocked
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { GovernanceThresholdsModulePayload } from '@/lib/baseline/types';
import {
  evaluateGovernance,
  evaluateExceptionPolicy,
  EvaluationContext,
  CaseContext,
  ExceptionContext,
} from '@/lib/domain/governance';

interface EvaluateApprovalsRequest {
  actionType: 'DECISION' | 'EXCEPTION';
  context?: {
    // VC context
    proposedCommitment?: number;
    exclusionOverrides?: number;
    hardRiskBreaches?: number;
    ownershipTarget?: number;
    stage?: string;

    // Insurance context
    limit?: number;
    premium?: number;
    pricingAdequacyFlag?: boolean;
    lineOfBusiness?: string;
    daFailures?: number;

    // Pharma context
    stageGate?: string;
    budget?: number;
    patientCount?: number;
    territoryDeal?: boolean;
    therapeuticArea?: string;

    // Generic
    value?: number;
  };
  exception?: {
    hardBreach: boolean;
    count: number;
    hasExceptionDraft?: boolean;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { caseId } = await params;
    const body: EvaluateApprovalsRequest = await request.json();
    const { actionType, context, exception } = body;

    if (!actionType || !['DECISION', 'EXCEPTION'].includes(actionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type. Must be DECISION or EXCEPTION' },
        { status: 400 }
      );
    }

    // Fetch the case with its baseline
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        baseline: {
          include: {
            mandate: {
              include: {
                company: true,
              },
            },
          },
        },
        mandate: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Verify user access
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!currentUser?.companyId || caseRecord.mandate.company.id !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get the governance module from the case's baseline
    // First, check if there's a Portfolio with this mandate
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        mandateId: caseRecord.mandateId,
      },
      include: {
        activeBaseline: {
          include: {
            modules: {
              where: {
                moduleType: 'GOVERNANCE_THRESHOLDS',
              },
            },
          },
        },
      },
    });

    // If no portfolio or no governance module, return no requirements
    if (!portfolio?.activeBaseline?.modules?.[0]) {
      return NextResponse.json({
        success: true,
        evaluation: {
          triggeredTiers: [],
          requirements: {
            committeeApprovals: [],
            signoffs: [],
          },
          blocked: false,
          reasons: ['No governance module configured for this portfolio'],
        },
        meta: {
          caseId,
          portfolioId: portfolio?.id || null,
          baselineVersionId: portfolio?.activeBaseline?.id || null,
          actionType,
        },
      });
    }

    const governanceModule = portfolio.activeBaseline.modules[0];
    const governance = governanceModule.payload as GovernanceThresholdsModulePayload;

    // Build evaluation context
    const caseCtx: CaseContext = {
      proposedCommitment: context?.proposedCommitment,
      exclusionOverrides: context?.exclusionOverrides,
      hardRiskBreaches: context?.hardRiskBreaches,
      ownershipTarget: context?.ownershipTarget,
      stage: context?.stage,
      value: context?.value,
    };

    const exceptionCtx: ExceptionContext | undefined = exception ? {
      hardBreach: exception.hardBreach,
      count: exception.count,
      hasExceptionDraft: exception.hasExceptionDraft,
    } : undefined;

    const evalContext: EvaluationContext = {
      actionType,
      case: caseCtx,
      exception: exceptionCtx,
    };

    // Add industry-specific context
    if (context?.limit !== undefined || context?.premium !== undefined) {
      evalContext.policy = {
        limit: context.limit,
        premium: context.premium,
        pricingAdequacyFlag: context.pricingAdequacyFlag,
        lineOfBusiness: context.lineOfBusiness,
        daFailures: context.daFailures,
      };
    }

    if (context?.stageGate !== undefined || context?.budget !== undefined) {
      evalContext.program = {
        stageGate: context.stageGate,
        budget: context.budget,
        patientCount: context.patientCount,
        territoryDeal: context.territoryDeal,
        therapeuticArea: context.therapeuticArea,
      };
    }

    // Evaluate based on action type
    let evaluation;
    if (actionType === 'EXCEPTION' && exceptionCtx) {
      evaluation = evaluateExceptionPolicy(exceptionCtx, governance);
    } else {
      evaluation = evaluateGovernance(evalContext, governance);
    }

    // Map triggered tiers to serializable format
    const triggeredTiers = 'triggeredTiers' in evaluation
      ? evaluation.triggeredTiers.map(t => ({
          id: t.tier.id,
          name: t.tier.name,
          description: t.tier.description,
          matchedConditions: t.matchedConditions,
        }))
      : [];

    // Map severity class if present
    const severityClass = 'severityClass' in evaluation && evaluation.severityClass
      ? {
          id: evaluation.severityClass.id,
          name: evaluation.severityClass.name,
          description: evaluation.severityClass.description,
        }
      : null;

    return NextResponse.json({
      success: true,
      evaluation: {
        triggeredTiers,
        severityClass,
        requirements: evaluation.requirements,
        blocked: evaluation.blocked,
        reasons: evaluation.reasons,
      },
      meta: {
        caseId,
        portfolioId: portfolio.id,
        baselineVersionId: portfolio.activeBaseline.id,
        actionType,
        governanceModuleId: governanceModule.id,
      },
    });
  } catch (error) {
    console.error('Error evaluating approvals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to evaluate approvals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
