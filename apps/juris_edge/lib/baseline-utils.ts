/**
 * Baseline Utilities
 *
 * Helper functions for checking baseline status and gating logic.
 * Used to control access to features based on baseline publication status.
 */

import type { BaselineModuleType } from '@/types/domain';

export type BaselineStatus = 'NONE' | 'DRAFT' | 'INCOMPLETE' | 'PUBLISHED' | 'ARCHIVED';

export interface BaselineInfo {
  id: string | null;
  version: number | null;
  status: BaselineStatus;
  completionPercent: number;
  validModules: BaselineModuleType[];
  invalidModules: BaselineModuleType[];
  canPublish: boolean;
  canCreateCases: boolean;
}

/**
 * Check if a project can create new cases
 * Requires a published baseline
 */
export function canCreateCases(baselineStatus: BaselineStatus): boolean {
  return baselineStatus === 'PUBLISHED';
}

/**
 * Check if a project can upload evidence
 * Requires a published baseline
 */
export function canUploadEvidence(baselineStatus: BaselineStatus): boolean {
  return baselineStatus === 'PUBLISHED';
}

/**
 * Check if a project can run evaluations
 * Requires a published baseline
 */
export function canRunEvaluation(baselineStatus: BaselineStatus): boolean {
  return baselineStatus === 'PUBLISHED';
}

/**
 * Get baseline status from module validation
 */
export function getBaselineStatus(
  hasBaseline: boolean,
  isPublished: boolean,
  moduleValidation: Record<BaselineModuleType, { isValid: boolean }>
): BaselineStatus {
  if (!hasBaseline) return 'NONE';
  if (isPublished) return 'PUBLISHED';

  const validCount = Object.values(moduleValidation).filter((v) => v.isValid).length;
  if (validCount === 5) return 'DRAFT'; // All valid but not published
  return 'INCOMPLETE';
}

/**
 * Calculate completion percentage from module validation
 */
export function calculateCompletionPercent(
  moduleValidation: Record<BaselineModuleType, { isValid: boolean }>
): number {
  const validCount = Object.values(moduleValidation).filter((v) => v.isValid).length;
  return (validCount / 5) * 100;
}

/**
 * Get list of invalid/incomplete modules
 */
export function getInvalidModules(
  moduleValidation: Record<BaselineModuleType, { isValid: boolean }>
): BaselineModuleType[] {
  return (Object.keys(moduleValidation) as BaselineModuleType[]).filter(
    (key) => !moduleValidation[key].isValid
  );
}

/**
 * Get user-friendly status label
 */
export function getStatusLabel(status: BaselineStatus): string {
  switch (status) {
    case 'NONE':
      return 'Not Started';
    case 'DRAFT':
      return 'Draft (Ready to Publish)';
    case 'INCOMPLETE':
      return 'In Progress';
    case 'PUBLISHED':
      return 'Active';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

/**
 * Get gating message for a feature
 */
export function getGatingMessage(feature: string, status: BaselineStatus): string {
  switch (status) {
    case 'NONE':
      return `Create a project constitution to enable ${feature.toLowerCase()}.`;
    case 'DRAFT':
      return `Publish your baseline to enable ${feature.toLowerCase()}.`;
    case 'INCOMPLETE':
      return `Complete all constitution modules to enable ${feature.toLowerCase()}.`;
    case 'ARCHIVED':
      return `This baseline is archived. Create a new version to enable ${feature.toLowerCase()}.`;
    default:
      return `${feature} is currently unavailable.`;
  }
}

/**
 * Features that require published baseline
 */
export const GATED_FEATURES = [
  'Case Creation',
  'Evidence Upload',
  'Policy Evaluation',
  'Exception Analysis',
  'Decision Recording',
  'Portfolio Integration',
  'Report Generation',
] as const;

export type GatedFeature = (typeof GATED_FEATURES)[number];

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(
  feature: GatedFeature,
  baselineStatus: BaselineStatus
): boolean {
  // All gated features require published baseline
  return baselineStatus === 'PUBLISHED';
}
