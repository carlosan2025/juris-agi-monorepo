'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ContextHeader } from './ContextHeader';
import { WorkflowRail } from '@/components/workflow/WorkflowRail';
import { useActiveContext } from '@/contexts/ActiveContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showWorkflowRail?: boolean;
}

export function AppLayout({ children, showWorkflowRail = false }: AppLayoutProps) {
  const {
    project,
    constitution,
    schema,
    activeCase,
    currentStep,
    workflowSteps,
    navigateToStep,
  } = useActiveContext();

  const hasContext = project || constitution || schema || activeCase;

  return (
    <div className="flex h-screen bg-background">
      {/* Fixed sidebar */}
      <Sidebar className="flex-shrink-0" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Context header - only show when there's context */}
        {hasContext && (
          <ContextHeader
            projectName={project?.name}
            baselineVersion={project?.activeBaselineVersion ?? undefined}
            schemaVersion={schema?.version}
            caseName={activeCase?.name}
            className="flex-shrink-0"
          />
        )}

        {/* Content wrapper with optional workflow rail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <main
            className={cn(
              'flex-1 overflow-auto',
              showWorkflowRail ? 'pr-0' : ''
            )}
          >
            <div className="h-full p-6">
              {children}
            </div>
          </main>

          {/* Workflow rail - shown on case-related pages */}
          {showWorkflowRail && activeCase && (
            <aside className="w-64 flex-shrink-0 border-l bg-card overflow-y-auto">
              <div className="p-4">
                <WorkflowRail
                  steps={workflowSteps}
                  currentStep={currentStep}
                  onStepClick={navigateToStep}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
