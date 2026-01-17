'use client';

import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Lock,
  AlertCircle,
} from 'lucide-react';
import type { WorkflowStep, WorkflowStepInfo, StepStatus } from '@/types/domain';
import { WORKFLOW_STEPS } from '@/types/domain';

interface WorkflowRailProps {
  steps: WorkflowStepInfo[];
  currentStep: WorkflowStep;
  onStepClick?: (step: WorkflowStep) => void;
  className?: string;
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return <Check className="h-3.5 w-3.5" />;
    case 'current':
      return <Circle className="h-3.5 w-3.5 fill-current" />;
    case 'locked':
      return <Lock className="h-3 w-3" />;
    case 'pending':
    default:
      return <span className="text-xs font-medium">○</span>;
  }
}

function getStepStatusClass(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'step-completed';
    case 'current':
      return 'step-current';
    case 'locked':
      return 'step-locked';
    case 'pending':
    default:
      return 'step-pending';
  }
}

export function WorkflowRail({
  steps,
  currentStep,
  onStepClick,
  className,
}: WorkflowRailProps) {
  return (
    <div className={cn('bg-card border rounded-lg p-4', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Workflow Progress
      </h3>

      <div className="space-y-3">
        {steps.map((stepInfo, index) => {
          const isClickable =
            stepInfo.status === 'completed' || stepInfo.status === 'current';

          return (
            <div key={stepInfo.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-3 top-7 w-0.5 h-6',
                    stepInfo.status === 'completed'
                      ? 'bg-[hsl(var(--step-completed))]'
                      : 'bg-border'
                  )}
                />
              )}

              <button
                onClick={() => isClickable && onStepClick?.(stepInfo.step)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex items-start gap-3 text-left transition-colors rounded-md p-1 -m-1',
                  isClickable && 'hover:bg-muted cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    'step-indicator flex-shrink-0',
                    getStepStatusClass(stepInfo.status)
                  )}
                >
                  <StepIcon status={stepInfo.status} />
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        stepInfo.status === 'completed' && 'text-foreground',
                        stepInfo.status === 'current' && 'text-foreground',
                        stepInfo.status === 'pending' && 'text-muted-foreground',
                        stepInfo.status === 'locked' && 'text-muted-foreground/60'
                      )}
                    >
                      {stepInfo.step}. {stepInfo.shortName}
                    </span>
                  </div>

                  {/* Status details */}
                  {stepInfo.status === 'completed' && stepInfo.lockedVersion && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono bg-muted px-1 rounded">
                        {stepInfo.lockedVersion}
                      </span>
                      {' '}locked
                    </p>
                  )}

                  {stepInfo.status === 'current' && (
                    <p className="text-xs text-[hsl(var(--step-current))] mt-0.5">
                      In progress
                    </p>
                  )}

                  {stepInfo.status === 'locked' &&
                    stepInfo.unmetConditions &&
                    stepInfo.unmetConditions.length > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          <span>Requires:</span>
                        </div>
                        <ul className="mt-0.5 text-xs text-muted-foreground/80 pl-4 list-disc">
                          {stepInfo.unmetConditions.slice(0, 2).map((condition, i) => (
                            <li key={i}>{condition}</li>
                          ))}
                          {stepInfo.unmetConditions.length > 2 && (
                            <li>+{stepInfo.unmetConditions.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to generate step info from case data
export function generateWorkflowSteps(
  currentStep: WorkflowStep,
  completedSteps: Partial<Record<WorkflowStep, { version?: string; completedAt?: Date }>> = {},
  unmetConditions: Partial<Record<WorkflowStep, string[]>> = {}
): WorkflowStepInfo[] {
  return (Object.keys(WORKFLOW_STEPS) as unknown as WorkflowStep[]).map((step) => {
    const stepNum = Number(step) as WorkflowStep;
    const stepDef = WORKFLOW_STEPS[stepNum];
    const completed = completedSteps[stepNum];

    let status: StepStatus;
    if (completed) {
      status = 'completed';
    } else if (stepNum === currentStep) {
      status = 'current';
    } else if (stepNum < currentStep) {
      status = 'completed'; // Should have completion data
    } else if (stepNum === currentStep + 1) {
      status = 'pending';
    } else {
      status = 'locked';
    }

    return {
      step: stepNum,
      name: stepDef.name,
      shortName: stepDef.shortName,
      status,
      completedAt: completed?.completedAt,
      lockedVersion: completed?.version,
      unmetConditions: unmetConditions[stepNum],
    };
  });
}
