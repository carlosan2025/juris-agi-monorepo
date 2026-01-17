'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExclusionItem, ExclusionType } from '@/lib/baseline/types';
import {
  type ExclusionTemplate,
  type IndustryExclusionGuidance,
  getExclusionTemplatesForIndustry,
  getExclusionGuidance,
  createExclusionFromTemplate,
  getRecommendedDefaultExclusions,
  getAvailableDimensions,
} from '@/lib/baseline/exclusion-templates';

interface UseExclusionTemplatesOptions {
  industry: string;
  type?: ExclusionType | 'ALL';
  /** If true, fetches all templates and filters client-side. Better for UI with type filter buttons. */
  filterClientSide?: boolean;
}

interface UseExclusionTemplatesResult {
  templates: ExclusionTemplate[];
  loading: boolean;
  error: string | null;
  guidance: IndustryExclusionGuidance;
  availableDimensions: { value: string; label: string; description: string }[];
  refetch: () => Promise<void>;
  createExclusionFromTemplate: (template: ExclusionTemplate) => ExclusionItem;
  getRecommendedDefaults: () => ExclusionItem[];
}

/**
 * Hook for fetching exclusion templates with industry-specific guidance.
 *
 * Currently uses file-based templates. Can be extended to fetch from API
 * similar to useMandateTemplates.
 *
 * @param options Configuration options
 * @returns Templates, loading state, and helper functions
 */
export function useExclusionTemplates(options: UseExclusionTemplatesOptions): UseExclusionTemplatesResult {
  const { industry, type = 'ALL', filterClientSide = false } = options;

  const [allTemplates, setAllTemplates] = useState<ExclusionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get industry guidance (always from file, as it's static configuration)
  const guidance = getExclusionGuidance(industry);

  // Get available dimensions for the industry
  const availableDimensions = getAvailableDimensions(industry);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, use file-based templates
      // Future: Add API endpoint similar to mandate-templates
      const fileTemplates = getExclusionTemplatesForIndustry(industry);
      setAllTemplates(fileTemplates);
    } catch (err) {
      console.error('Failed to load exclusion templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [industry]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Apply client-side filtering if enabled, otherwise return all templates
  const templates = filterClientSide && type !== 'ALL'
    ? allTemplates.filter(t => t.type === type)
    : allTemplates;

  // Create exclusion from template
  const createExclusion = useCallback((template: ExclusionTemplate): ExclusionItem => {
    return createExclusionFromTemplate(template);
  }, []);

  // Get recommended defaults for the industry
  const getRecommendedDefaults = useCallback((): ExclusionItem[] => {
    return getRecommendedDefaultExclusions(industry);
  }, [industry]);

  return {
    templates,
    loading,
    error,
    guidance,
    availableDimensions,
    refetch: fetchTemplates,
    createExclusionFromTemplate: createExclusion,
    getRecommendedDefaults,
  };
}

/**
 * Hook for getting a single exclusion template by ID
 */
export function useExclusionTemplate(templateId: string | null, industry: string) {
  const [template, setTemplate] = useState<ExclusionTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      setTemplate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templates = getExclusionTemplatesForIndustry(industry);
      const found = templates.find(t => t.id === templateId);
      setTemplate(found || null);
      if (!found) {
        setError('Template not found');
      }
    } catch (err) {
      console.error('Failed to find template:', err);
      setError(err instanceof Error ? err.message : 'Failed to find template');
    } finally {
      setLoading(false);
    }
  }, [templateId, industry]);

  return { template, loading, error };
}
