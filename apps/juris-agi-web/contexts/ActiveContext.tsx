'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  Project,
  ProjectConstitution,
  EvidenceAdmissibilitySchema,
  Case,
  WorkflowStep,
  WorkflowStepInfo,
} from '@/types/domain';
import { generateWorkflowSteps } from '@/components/workflow/WorkflowRail';

interface ActiveContextState {
  project: Project | null;
  constitution: ProjectConstitution | null;
  schema: EvidenceAdmissibilitySchema | null;
  activeCase: Case | null;
  currentStep: WorkflowStep;
  workflowSteps: WorkflowStepInfo[];
}

interface ActiveContextActions {
  setProject: (project: Project | null) => void;
  setConstitution: (constitution: ProjectConstitution | null) => void;
  setSchema: (schema: EvidenceAdmissibilitySchema | null) => void;
  setActiveCase: (activeCase: Case | null) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  navigateToStep: (step: WorkflowStep) => void;
  clearContext: () => void;
}

type ActiveContextType = ActiveContextState & ActiveContextActions;

const ActiveContext = createContext<ActiveContextType | undefined>(undefined);

const initialState: ActiveContextState = {
  project: null,
  constitution: null,
  schema: null,
  activeCase: null,
  currentStep: 1,
  workflowSteps: generateWorkflowSteps(1),
};

export function ActiveContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveContextState>(initialState);

  const setProject = useCallback((project: Project | null) => {
    setState((prev) => ({ ...prev, project }));
  }, []);

  const setConstitution = useCallback((constitution: ProjectConstitution | null) => {
    setState((prev) => ({ ...prev, constitution }));
  }, []);

  const setSchema = useCallback((schema: EvidenceAdmissibilitySchema | null) => {
    setState((prev) => ({ ...prev, schema }));
  }, []);

  const setActiveCase = useCallback((activeCase: Case | null) => {
    setState((prev) => ({
      ...prev,
      activeCase,
      // Reset to step 4 when a case is selected (evidence gathering)
      currentStep: activeCase ? 4 : prev.currentStep,
      workflowSteps: activeCase
        ? generateWorkflowSteps(4, {
            1: { version: prev.project?.activeBaselineVersion ?? undefined },
            2: { version: prev.constitution?.version },
            3: { version: prev.schema?.version },
          })
        : prev.workflowSteps,
    }));
  }, []);

  const setCurrentStep = useCallback((step: WorkflowStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      workflowSteps: generateWorkflowSteps(step),
    }));
  }, []);

  const navigateToStep = useCallback((step: WorkflowStep) => {
    // Only allow navigation to completed or current steps
    const targetStep = state.workflowSteps.find((s) => s.step === step);
    if (targetStep && (targetStep.status === 'completed' || targetStep.status === 'current')) {
      setState((prev) => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, [state.workflowSteps]);

  const clearContext = useCallback(() => {
    setState(initialState);
  }, []);

  const value: ActiveContextType = {
    ...state,
    setProject,
    setConstitution,
    setSchema,
    setActiveCase,
    setCurrentStep,
    navigateToStep,
    clearContext,
  };

  return (
    <ActiveContext.Provider value={value}>
      {children}
    </ActiveContext.Provider>
  );
}

export function useActiveContext() {
  const context = useContext(ActiveContext);
  if (context === undefined) {
    throw new Error('useActiveContext must be used within an ActiveContextProvider');
  }
  return context;
}
