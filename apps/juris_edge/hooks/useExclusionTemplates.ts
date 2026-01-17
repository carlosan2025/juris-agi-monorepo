'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExclusionItem, ExclusionType } from '@/lib/baseline/types';
import {
  type ExclusionTemplate,
  type IndustryExclusionGuidance,
  getExclusionTemplatesForIndustry as getFileTemplates,
  getAllTemplates as getAllFileTemplates,
  getExclusionGuidance,
  createExclusionFromTemplate as createFromTemplate,
  getRecommendedDefaultExclusions as getFileDefaults,
  getAvailableDimensions,
} from '@/lib/baseline/exclusion-templates';

interface UseExclusionTemplatesOptions {
  industry: string;
  type?: ExclusionType | 'ALL';
  includeCompany?: boolean;
  /** If true, fetches all templates and filters client-side. Better for UI with type filter buttons. */
  filterClientSide?: boolean;
}

interface UseExclusionTemplatesResult {
  templates: ExclusionTemplate[];
  loading: boolean;
  error: string | null;
  guidance: IndustryExclusionGuidance;
  availableDimensions: { value: string; label: string; description: string }[];
  isApiAvailable: boolean;
  refetch: () => Promise<void>;
  createExclusionFromTemplate: (template: ExclusionTemplate) => ExclusionItem;
  getRecommendedDefaults: () => ExclusionItem[];
}

/**
 * Hook for fetching exclusion templates from the API with fallback to file-based templates.
 *
 * This hook first tries to fetch templates from the database API. If the API is not available
 * or returns an error, it falls back to the static templates defined in exclusion-templates.ts.
 *
 * @param options Configuration options
 * @returns Templates, loading state, and helper functions
 */
export function useExclusionTemplates(options: UseExclusionTemplatesOptions): UseExclusionTemplatesResult {
  const { industry, type = 'ALL', includeCompany = true, filterClientSide = false } = options;

  const [allTemplates, setAllTemplates] = useState<ExclusionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  // Get industry guidance (always from file, as it's static configuration)
  const guidance = getExclusionGuidance(industry);

  // Get available dimensions for the industry
  const availableDimensions = getAvailableDimensions(industry);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (!filterClientSide) {
        params.append('industry', industry);
      }
      if (!filterClientSide && type !== 'ALL') {
        params.append('type', type);
      }
      params.append('includeCompany', String(includeCompany));

      const response = await fetch(`/api/exclusion-templates?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.templates) {
        // Transform API response to match ExclusionTemplate interface
        const apiTemplates: ExclusionTemplate[] = data.templates.map((t: {
          id: string;
          name: string;
          type: ExclusionType;
          description: string;
          industry: string;
          isDefault: boolean;
          exclusionData: Omit<ExclusionItem, 'id'>;
        }) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          description: t.description,
          industry: t.industry,
          isDefault: t.isDefault,
          exclusion: t.exclusionData,
        }));

        setAllTemplates(apiTemplates);
        setIsApiAvailable(true);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.warn('Exclusion templates API not available, using file-based templates:', err);
      setIsApiAvailable(false);

      // Fall back to file-based templates
      const fileTemplates = filterClientSide
        ? getAllFileTemplates()
        : getFileTemplates(industry);

      // Apply type filter if not using client-side filtering
      const filtered = !filterClientSide && type !== 'ALL'
        ? fileTemplates.filter(t => t.type === type)
        : fileTemplates;

      setAllTemplates(filtered);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  }, [industry, type, includeCompany, filterClientSide]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Apply client-side filtering if enabled
  const templates = filterClientSide && type !== 'ALL'
    ? allTemplates.filter(t => t.type === type)
    : allTemplates;

  // Create exclusion from template
  const createExclusion = useCallback((template: ExclusionTemplate): ExclusionItem => {
    return createFromTemplate(template);
  }, []);

  // Get recommended defaults for the industry
  const getRecommendedDefaults = useCallback((): ExclusionItem[] => {
    return getFileDefaults(industry);
  }, [industry]);

  return {
    templates,
    loading,
    error,
    guidance,
    availableDimensions,
    isApiAvailable,
    refetch: fetchTemplates,
    createExclusionFromTemplate: createExclusion,
    getRecommendedDefaults,
  };
}

/**
 * Hook for getting a single exclusion template by ID
 */
export function useExclusionTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<ExclusionTemplate | null>(null);
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
        const response = await fetch(`/api/exclusion-templates/${templateId}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.template) {
          const t = data.template;
          setTemplate({
            id: t.id,
            name: t.name,
            type: t.type,
            description: t.description,
            industry: t.industry,
            isDefault: t.isDefault,
            exclusion: t.exclusionData,
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
