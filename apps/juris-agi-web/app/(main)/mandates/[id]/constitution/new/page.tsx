'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  GovernanceThreshold,
  ReportingObligation,
  RiskAppetiteConfig,
} from '@/types/domain';

// Mock project data - backend_pending
const MOCK_PROJECT = {
  id: '1',
  name: 'Series A Evaluation Framework',
  activeBaselineVersion: 'v1.2.0',
};

interface FormErrors {
  version?: string;
  mandate?: string;
}

export default function NewConstitutionPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [version, setVersion] = useState('');
  const [mandate, setMandate] = useState('');
  const [exclusions, setExclusions] = useState<string[]>(['']);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetiteConfig>({
    maxSinglePosition: 15,
    maxSectorConcentration: 35,
    minRevenueThreshold: 1000000,
  });
  const [governanceThresholds, setGovernanceThresholds] = useState<GovernanceThreshold[]>([
    { condition: '', requirement: '' },
  ]);
  const [reportingObligations, setReportingObligations] = useState<ReportingObligation[]>([
    { type: '', frequency: '', deadline: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const project = MOCK_PROJECT;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!version.trim()) {
      newErrors.version = 'Version is required (e.g., v1.0.0)';
    } else if (!/^v\d+\.\d+\.\d+$/.test(version.trim())) {
      newErrors.version = 'Version must follow semantic versioning (e.g., v1.0.0)';
    }

    if (!mandate.trim()) {
      newErrors.mandate = 'Investment mandate is required';
    } else if (mandate.trim().length < 50) {
      newErrors.mandate = 'Mandate should be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExclusion = () => {
    setExclusions([...exclusions, '']);
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const handleExclusionChange = (index: number, value: string) => {
    const updated = [...exclusions];
    updated[index] = value;
    setExclusions(updated);
  };

  const handleAddGovernanceThreshold = () => {
    setGovernanceThresholds([...governanceThresholds, { condition: '', requirement: '' }]);
  };

  const handleRemoveGovernanceThreshold = (index: number) => {
    setGovernanceThresholds(governanceThresholds.filter((_, i) => i !== index));
  };

  const handleGovernanceChange = (index: number, field: keyof GovernanceThreshold, value: string) => {
    const updated = [...governanceThresholds];
    updated[index] = { ...updated[index], [field]: value };
    setGovernanceThresholds(updated);
  };

  const handleAddReportingObligation = () => {
    setReportingObligations([...reportingObligations, { type: '', frequency: '', deadline: '' }]);
  };

  const handleRemoveReportingObligation = (index: number) => {
    setReportingObligations(reportingObligations.filter((_, i) => i !== index));
  };

  const handleReportingChange = (index: number, field: keyof ReportingObligation, value: string) => {
    const updated = [...reportingObligations];
    updated[index] = { ...updated[index], [field]: value };
    setReportingObligations(updated);
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    // Simulate API call - backend_pending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate back to constitution list
    router.push(`/mandates/${mandateId}/constitution`);
  };

  return (
    <TooltipProvider>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/mandates/${mandateId}/constitution`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">New Constitution Version</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Step 1: Define the project baseline (investment mandate, exclusions, governance)
            </p>
          </div>
        </div>

        {/* Context Banner */}
        <div className="bg-muted/50 border rounded-md p-3 flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Project:</span>{' '}
            <span className="font-medium">{project.name}</span>
            {project.activeBaselineVersion && (
              <>
                <span className="text-muted-foreground ml-4">Current Active:</span>{' '}
                <span className="font-mono">{project.activeBaselineVersion}</span>
              </>
            )}
          </div>
        </div>

        {/* Version */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Version Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version" className="flex items-center gap-2">
                Version Number *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Use semantic versioning (e.g., v1.0.0). New versions supersede previous ones
                      when activated.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="version"
                placeholder="v1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className={errors.version ? 'border-red-500' : ''}
              />
              {errors.version && (
                <p className="text-xs text-red-500">{errors.version}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment Mandate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Investment Mandate</CardTitle>
            <CardDescription>
              Define the core investment thesis and objectives for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mandate">Mandate Statement *</Label>
              <Textarea
                id="mandate"
                placeholder="Define the investment mandate... (e.g., 'Invest in early-stage B2B SaaS companies with at least $1M ARR, demonstrating 100%+ YoY growth, in North America or Western Europe.')"
                value={mandate}
                onChange={(e) => setMandate(e.target.value)}
                rows={4}
                className={errors.mandate ? 'border-red-500' : ''}
              />
              {errors.mandate && (
                <p className="text-xs text-red-500">{errors.mandate}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {mandate.length}/50 characters minimum
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exclusions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Exclusions</CardTitle>
            <CardDescription>
              Define categories or characteristics that automatically disqualify investments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {exclusions.map((exclusion, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="e.g., Tobacco, weapons, gambling"
                  value={exclusion}
                  onChange={(e) => handleExclusionChange(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveExclusion(index)}
                  disabled={exclusions.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddExclusion}>
              <Plus className="h-4 w-4 mr-1" />
              Add Exclusion
            </Button>
          </CardContent>
        </Card>

        {/* Risk Appetite */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Appetite Parameters</CardTitle>
            <CardDescription>
              Define quantitative limits for portfolio concentration and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxSinglePosition" className="flex items-center gap-2">
                  Max Single Position (%)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Maximum percentage of total portfolio that can be invested in a single
                        position.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="maxSinglePosition"
                  type="number"
                  min={0}
                  max={100}
                  value={riskAppetite.maxSinglePosition}
                  onChange={(e) =>
                    setRiskAppetite({ ...riskAppetite, maxSinglePosition: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSectorConcentration" className="flex items-center gap-2">
                  Max Sector Concentration (%)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Maximum percentage of portfolio that can be concentrated in a single sector.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="maxSectorConcentration"
                  type="number"
                  min={0}
                  max={100}
                  value={riskAppetite.maxSectorConcentration}
                  onChange={(e) =>
                    setRiskAppetite({
                      ...riskAppetite,
                      maxSectorConcentration: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRevenueThreshold" className="flex items-center gap-2">
                Min Revenue Threshold ($)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Minimum annual revenue required for investment consideration.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="minRevenueThreshold"
                type="number"
                min={0}
                value={riskAppetite.minRevenueThreshold}
                onChange={(e) =>
                  setRiskAppetite({ ...riskAppetite, minRevenueThreshold: Number(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Governance Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Governance Thresholds</CardTitle>
            <CardDescription>
              Define conditions that trigger specific governance requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {governanceThresholds.map((threshold, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Threshold #{index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveGovernanceThreshold(index)}
                    disabled={governanceThresholds.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Condition</Label>
                    <Input
                      placeholder="e.g., Check size > $5M"
                      value={threshold.condition}
                      onChange={(e) => handleGovernanceChange(index, 'condition', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Requirement</Label>
                    <Input
                      placeholder="e.g., Full IC vote required"
                      value={threshold.requirement}
                      onChange={(e) => handleGovernanceChange(index, 'requirement', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddGovernanceThreshold}>
              <Plus className="h-4 w-4 mr-1" />
              Add Governance Threshold
            </Button>
          </CardContent>
        </Card>

        {/* Reporting Obligations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reporting Obligations</CardTitle>
            <CardDescription>
              Define required reports, their frequency, and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportingObligations.map((obligation, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Obligation #{index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveReportingObligation(index)}
                    disabled={reportingObligations.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Report Type</Label>
                    <Input
                      placeholder="e.g., LP Quarterly"
                      value={obligation.type}
                      onChange={(e) => handleReportingChange(index, 'type', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frequency</Label>
                    <Input
                      placeholder="e.g., Quarterly"
                      value={obligation.frequency}
                      onChange={(e) => handleReportingChange(index, 'frequency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Deadline</Label>
                    <Input
                      placeholder="e.g., Q+30 days"
                      value={obligation.deadline}
                      onChange={(e) => handleReportingChange(index, 'deadline', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddReportingObligation}>
              <Plus className="h-4 w-4 mr-1" />
              Add Reporting Obligation
            </Button>
          </CardContent>
        </Card>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This version will be saved as a draft. It must go through the
              approval workflow (proposed → approved → active) before cases can be created against
              it.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push(`/mandates/${mandateId}/constitution`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
