'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MandateTemplate, IndustryMandateGuidance } from '@/lib/baseline/mandate-templates';
import {
  getTemplatesForIndustry as getFileTemplates,
  getIndustryGuidance,
  createMandateFromTemplate as createFromTemplate,
  getRecommendedDefaultMandates as getFileDefaults,
} from '@/lib/baseline/mandate-templates';
import type { MandateDefinition } from '@/lib/baseline/types';

interface UseMandateTemplatesOptions {
  industry: string;
  type?: 'PRIMARY' | 'THEMATIC' | 'CARVEOUT' | 'ALL';
  includeCompany?: boolean;
  /** If true, fetches all templates and filters client-side. Better for UI with type filter buttons. */
  filterClientSide?: boolean;
}

interface UseMandateTemplatesResult {
  templates: MandateTemplate[];
  loading: boolean;
  error: string | null;
  guidance: IndustryMandateGuidance;
  isApiAvailable: boolean;
  refetch: () => Promise<void>;
  createMandateFromTemplate: (template: MandateTemplate) => MandateDefinition;
  getRecommendedDefaults: () => MandateDefinition[];
}

/**
 * Hook for fetching mandate templates from the API with fallback to file-based templates.
 *
 * This hook first tries to fetch templates from the database API. If the API is not available
 * or returns an error, it falls back to the static templates defined in mandate-templates.ts.
 *
 * @param options Configuration options
 * @returns Templates, loading state, and helper functions
 */
export function useMandateTemplates(options: UseMandateTemplatesOptions): UseMandateTemplatesResult {
  const { industry, type = 'ALL', includeCompany = true, filterClientSide = false } = options;

  const [allTemplates, setAllTemplates] = useState<MandateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  // Get industry guidance (always from file, as it's static configuration)
  const guidance = getIndustryGuidance(industry);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params - always fetch all types if filterClientSide is true
      const params = new URLSearchParams();
      params.append('industry', industry);
      if (!filterClientSide && type !== 'ALL') {
        params.append('type', type);
      }
      params.append('includeCompany', String(includeCompany));

      const response = await fetch(`/api/mandate-templates?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.templates) {
        // Transform API response to match MandateTemplate interface
        const apiTemplates: MandateTemplate[] = data.templates.map((t: {
          id: string;
          name: string;
          type: 'PRIMARY' | 'THEMATIC' | 'CARVEOUT';
          description: string;
          industry: string;
          isDefault: boolean;
          mandateData: Record<string, unknown>;
        }) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          description: t.description,
          industry: t.industry,
          isDefault: t.isDefault,
          mandate: t.mandateData,
        }));

        setAllTemplates(apiTemplates);
        setIsApiAvailable(true);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.warn('Mandate templates API not available, using file-based templates:', err);
      setIsApiAvailable(false);

      // Fall back to file-based templates - always fetch all for client-side filtering
      const fileTemplates = getFileTemplates(industry);
      setAllTemplates(fileTemplates);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  }, [industry, includeCompany, filterClientSide, type]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Apply client-side filtering if enabled, otherwise return all templates
  const templates = filterClientSide && type !== 'ALL'
    ? allTemplates.filter(t => t.type === type)
    : allTemplates;

  // Create mandate from template
  const createMandateFromTemplate = useCallback((template: MandateTemplate): MandateDefinition => {
    return createFromTemplate(template);
  }, []);

  // Get recommended defaults for the industry
  const getRecommendedDefaults = useCallback((): MandateDefinition[] => {
    return getFileDefaults(industry);
  }, [industry]);

  return {
    templates,
    loading,
    error,
    guidance,
    isApiAvailable,
    refetch: fetchTemplates,
    createMandateFromTemplate,
    getRecommendedDefaults,
  };
}

/**
 * Hook for fetching a single template by ID
 */
export function useMandateTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<MandateTemplate | null>(null);
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
        const response = await fetch(`/api/mandate-templates/${templateId}`);

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
            mandate: t.mandateData,
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
