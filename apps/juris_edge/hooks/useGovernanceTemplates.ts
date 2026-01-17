'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GovernanceTemplate, IndustryGovernanceGuidance } from '@/lib/baseline/governance-templates';
import {
  getGovernanceTemplatesForIndustry as getFileTemplates,
  getGovernanceGuidance,
  createGovernanceFromTemplate as createFromTemplate,
  getRecommendedDefaultGovernance as getFileDefault,
} from '@/lib/baseline/governance-templates';
import type { GovernanceThresholdsModulePayload } from '@/lib/baseline/types';

interface UseGovernanceTemplatesOptions {
  industry: string;
  includeCompany?: boolean;
  /** If true, fetches all templates and filters client-side. Better for UI with industry filter buttons. */
  filterClientSide?: boolean;
}

interface UseGovernanceTemplatesResult {
  templates: GovernanceTemplate[];
  loading: boolean;
  error: string | null;
  guidance: IndustryGovernanceGuidance;
  isApiAvailable: boolean;
  refetch: () => Promise<void>;
  createGovernanceFromTemplate: (template: GovernanceTemplate) => GovernanceThresholdsModulePayload;
  getRecommendedDefault: () => GovernanceThresholdsModulePayload | null;
}

/**
 * Hook for fetching governance templates from the API with fallback to file-based templates.
 *
 * This hook first tries to fetch templates from the database API. If the API is not available
 * or returns an error, it falls back to the static templates defined in governance-templates.ts.
 *
 * @param options Configuration options
 * @returns Templates, loading state, and helper functions
 */
export function useGovernanceTemplates(options: UseGovernanceTemplatesOptions): UseGovernanceTemplatesResult {
  const { industry, includeCompany = true, filterClientSide = false } = options;

  const [allTemplates, setAllTemplates] = useState<GovernanceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  // Get industry guidance (always from file, as it's static configuration)
  const guidance = getGovernanceGuidance(industry);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params - always fetch all if filterClientSide is true
      const params = new URLSearchParams();
      if (!filterClientSide) {
        params.append('industry', industry);
      }
      params.append('includeCompany', String(includeCompany));

      const response = await fetch(`/api/governance-templates?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.templates) {
        // Transform API response to match GovernanceTemplate interface
        const apiTemplates: GovernanceTemplate[] = data.templates.map((t: {
          id: string;
          name: string;
          description: string;
          industry: string;
          isDefault: boolean;
          governanceData: GovernanceThresholdsModulePayload;
        }) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          industry: t.industry,
          isDefault: t.isDefault,
          governance: t.governanceData,
        }));

        setAllTemplates(apiTemplates);
        setIsApiAvailable(true);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.warn('Governance templates API not available, using file-based templates:', err);
      setIsApiAvailable(false);

      // Fall back to file-based templates - get all for client-side filtering or just for industry
      const fileTemplates = filterClientSide
        ? [
            ...getFileTemplates('VENTURE_CAPITAL'),
            ...getFileTemplates('INSURANCE'),
            ...getFileTemplates('PHARMA'),
          ]
        : getFileTemplates(industry);
      setAllTemplates(fileTemplates);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  }, [industry, includeCompany, filterClientSide]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Apply client-side filtering if enabled, otherwise return all templates
  const templates = filterClientSide
    ? allTemplates.filter(t => t.industry.toUpperCase() === industry.toUpperCase() ||
        (industry.toUpperCase() === 'VC' && t.industry.toUpperCase() === 'VENTURE_CAPITAL') ||
        (industry.toUpperCase() === 'VENTURE_CAPITAL' && t.industry.toUpperCase() === 'VENTURE_CAPITAL') ||
        (industry.toUpperCase() === 'INS' && t.industry.toUpperCase() === 'INSURANCE') ||
        (industry.toUpperCase() === 'PHARMACEUTICAL' && t.industry.toUpperCase() === 'PHARMA'))
    : allTemplates;

  // Create governance from template
  const createGovernanceFromTemplate = useCallback((template: GovernanceTemplate): GovernanceThresholdsModulePayload => {
    return createFromTemplate(template);
  }, []);

  // Get recommended default for the industry
  const getRecommendedDefault = useCallback((): GovernanceThresholdsModulePayload | null => {
    return getFileDefault(industry);
  }, [industry]);

  return {
    templates,
    loading,
    error,
    guidance,
    isApiAvailable,
    refetch: fetchTemplates,
    createGovernanceFromTemplate,
    getRecommendedDefault,
  };
}

/**
 * Hook for fetching a single template by ID
 */
export function useGovernanceTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<GovernanceTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      setTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/governance-templates/${templateId}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.template) {
          const t = data.template;
          setTemplate({
            id: t.id,
            name: t.name,
            description: t.description,
            industry: t.industry,
            isDefault: t.isDefault,
            governance: t.governanceData,
          });
        } else {
          throw new Error(data.error || 'Template not found');
        }
      } catch (err) {
        console.error('Failed to fetch template:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  return { template, loading, error };
}
