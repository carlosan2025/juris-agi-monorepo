'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  RiskAppetiteTemplate,
  IndustryRiskAppetiteGuidance,
} from '@/lib/baseline/risk-appetite-templates';
import {
  getTemplatesForIndustry as getFileTemplates,
  getIndustryGuidance,
  createRiskAppetiteFromTemplate as createFromTemplate,
  getRecommendedDefaultRiskAppetite as getFileDefault,
  getTemplateById as getFileTemplateById,
  BREACH_SEVERITY_INFO,
  DIMENSION_CATEGORY_INFO,
} from '@/lib/baseline/risk-appetite-templates';
import type { RiskAppetiteModulePayload } from '@/lib/baseline/types';

interface UseRiskAppetiteTemplatesOptions {
  industry: string;
  includeCompany?: boolean;
}

interface UseRiskAppetiteTemplatesResult {
  templates: RiskAppetiteTemplate[];
  loading: boolean;
  error: string | null;
  guidance: IndustryRiskAppetiteGuidance;
  isApiAvailable: boolean;
  refetch: () => Promise<void>;
  createRiskAppetiteFromTemplate: (template: RiskAppetiteTemplate) => RiskAppetiteModulePayload;
  getRecommendedDefault: () => RiskAppetiteModulePayload | null;
  breachSeverityInfo: typeof BREACH_SEVERITY_INFO;
  dimensionCategoryInfo: typeof DIMENSION_CATEGORY_INFO;
}

/**
 * Hook for fetching risk appetite templates from the API with fallback to file-based templates.
 *
 * This hook first tries to fetch templates from the database API. If the API is not available
 * or returns an error, it falls back to the static templates defined in risk-appetite-templates.ts.
 *
 * @param options Configuration options
 * @returns Templates, loading state, and helper functions
 */
export function useRiskAppetiteTemplates(
  options: UseRiskAppetiteTemplatesOptions
): UseRiskAppetiteTemplatesResult {
  const { industry, includeCompany = true } = options;

  const [templates, setTemplates] = useState<RiskAppetiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  // Get industry guidance (always from file, as it's static configuration)
  const guidance = getIndustryGuidance(industry);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('industry', industry);
      params.append('includeCompany', String(includeCompany));

      const response = await fetch(`/api/risk-appetite-templates?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.templates) {
        // Transform API response to match RiskAppetiteTemplate interface
        const apiTemplates: RiskAppetiteTemplate[] = data.templates.map(
          (t: {
            id: string;
            name: string;
            description: string;
            industry: string;
            isDefault: boolean;
            riskAppetiteData: Record<string, unknown>;
          }) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            industry: t.industry,
            isDefault: t.isDefault,
            riskAppetite: t.riskAppetiteData,
          })
        );

        setTemplates(apiTemplates);
        setIsApiAvailable(true);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.warn('Risk appetite templates API not available, using file-based templates:', err);
      setIsApiAvailable(false);

      // Fall back to file-based templates
      const fileTemplates = getFileTemplates(industry);
      setTemplates(fileTemplates);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  }, [industry, includeCompany]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Create risk appetite from template
  const createRiskAppetiteFromTemplate = useCallback(
    (template: RiskAppetiteTemplate): RiskAppetiteModulePayload => {
      return createFromTemplate(template);
    },
    []
  );

  // Get recommended default for the industry
  const getRecommendedDefault = useCallback((): RiskAppetiteModulePayload | null => {
    return getFileDefault(industry);
  }, [industry]);

  return {
    templates,
    loading,
    error,
    guidance,
    isApiAvailable,
    refetch: fetchTemplates,
    createRiskAppetiteFromTemplate,
    getRecommendedDefault,
    breachSeverityInfo: BREACH_SEVERITY_INFO,
    dimensionCategoryInfo: DIMENSION_CATEGORY_INFO,
  };
}

/**
 * Hook for fetching a single risk appetite template by ID
 */
export function useRiskAppetiteTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<RiskAppetiteTemplate | null>(null);
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
        const response = await fetch(`/api/risk-appetite-templates/${templateId}`);

        if (!response.ok) {
          // Fall back to file-based template lookup
          const fileTemplate = getFileTemplateById(templateId);
          if (fileTemplate) {
            setTemplate(fileTemplate);
            return;
          }
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
            riskAppetite: t.riskAppetiteData,
          });
        } else {
          throw new Error(data.error || 'Template not found');
        }
      } catch (err) {
        console.warn('API not available, trying file-based template:', err);
        // Try file-based fallback
        const fileTemplate = getFileTemplateById(templateId);
        if (fileTemplate) {
          setTemplate(fileTemplate);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch template');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  return { template, loading, error };
}
