'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Database,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { EvidenceTypeConfig, CoverageItem, DecayRule } from '@/types/domain';

// Mock project data - backend_pending
const MOCK_PROJECT = {
  id: '1',
  name: 'Series A Evaluation Framework',
  activeSchemaVersion: 'v1.0.0',
};

// Common evidence types for quick add
const COMMON_EVIDENCE_TYPES = [
  'Financial Statements',
  'Pitch Deck',
  'Data Room',
  'Customer References',
  'Technical Due Diligence',
  'Legal Documents',
  'Market Analysis',
  'Competitor Analysis',
];

interface FormErrors {
  version?: string;
  evidenceTypes?: string;
}

export default function NewSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [version, setVersion] = useState('');
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceTypeConfig[]>([
    { type: '', weight: 1.0, decayRule: 'none', required: false },
  ]);
  const [confidenceWeights, setConfidenceWeights] = useState({
    high: { min: 0.8, max: 1.0 },
    medium: { min: 0.5, max: 0.79 },
    low: { min: 0.0, max: 0.49 },
  });
  const [decayRules, setDecayRules] = useState<DecayRule[]>([
    { type: 'financial', rate: 0.1, period: 'monthly' },
  ]);
  const [forbiddenClasses, setForbiddenClasses] = useState<string[]>(['']);
  const [coverageChecklist, setCoverageChecklist] = useState<CoverageItem[]>([
    { item: '', required: true },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const project = MOCK_PROJECT;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!version.trim()) {
      newErrors.version = 'Version is required (e.g., v1.0.0)';
    } else if (!/^v\d+\.\d+\.\d+$/.test(version.trim())) {
      newErrors.version = 'Version must follow semantic versioning (e.g., v1.0.0)';
    }

    const validTypes = evidenceTypes.filter((t) => t.type.trim());
    if (validTypes.length === 0) {
      newErrors.evidenceTypes = 'At least one evidence type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Evidence Types handlers
  const handleAddEvidenceType = () => {
    setEvidenceTypes([
      ...evidenceTypes,
      { type: '', weight: 1.0, decayRule: 'none', required: false },
    ]);
  };

  const handleRemoveEvidenceType = (index: number) => {
    setEvidenceTypes(evidenceTypes.filter((_, i) => i !== index));
  };

  const handleEvidenceTypeChange = (
    index: number,
    field: keyof EvidenceTypeConfig,
    value: string | number | boolean
  ) => {
    const updated = [...evidenceTypes];
    updated[index] = { ...updated[index], [field]: value };
    setEvidenceTypes(updated);
  };

  const handleQuickAddType = (type: string) => {
    const exists = evidenceTypes.some((t) => t.type.toLowerCase() === type.toLowerCase());
    if (!exists) {
      setEvidenceTypes([
        ...evidenceTypes.filter((t) => t.type.trim()),
        { type, weight: 1.0, decayRule: 'none', required: false },
      ]);
    }
  };

  // Decay Rules handlers
  const handleAddDecayRule = () => {
    setDecayRules([...decayRules, { type: '', rate: 0.1, period: 'monthly' }]);
  };

  const handleRemoveDecayRule = (index: number) => {
    setDecayRules(decayRules.filter((_, i) => i !== index));
  };

  const handleDecayRuleChange = (
    index: number,
    field: keyof DecayRule,
    value: string | number
  ) => {
    const updated = [...decayRules];
    updated[index] = { ...updated[index], [field]: value };
    setDecayRules(updated);
  };

  // Forbidden Classes handlers
  const handleAddForbiddenClass = () => {
    setForbiddenClasses([...forbiddenClasses, '']);
  };

  const handleRemoveForbiddenClass = (index: number) => {
    setForbiddenClasses(forbiddenClasses.filter((_, i) => i !== index));
  };

  const handleForbiddenClassChange = (index: number, value: string) => {
    const updated = [...forbiddenClasses];
    updated[index] = value;
    setForbiddenClasses(updated);
  };

  // Coverage Checklist handlers
  const handleAddCoverageItem = () => {
    setCoverageChecklist([...coverageChecklist, { item: '', required: true }]);
  };

  const handleRemoveCoverageItem = (index: number) => {
    setCoverageChecklist(coverageChecklist.filter((_, i) => i !== index));
  };

  const handleCoverageItemChange = (
    index: number,
    field: keyof CoverageItem,
    value: string | boolean
  ) => {
    const updated = [...coverageChecklist];
    updated[index] = { ...updated[index], [field]: value };
    setCoverageChecklist(updated);
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    // Simulate API call - backend_pending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate back to schema list
    router.push(`/mandates/${mandateId}/schema`);
  };

  return (
    <TooltipProvider>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/mandates/${mandateId}/schema`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">New Evidence Schema</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Step 2: Define admissible evidence types, weights, and decay rules
            </p>
          </div>
        </div>

        {/* Context Banner */}
        <div className="bg-muted/50 border rounded-md p-3 flex items-center gap-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Project:</span>{' '}
            <span className="font-medium">{project.name}</span>
            {project.activeSchemaVersion && (
              <>
                <span className="text-muted-foreground ml-4">Current Active:</span>{' '}
                <span className="font-mono">{project.activeSchemaVersion}</span>
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
              {errors.version && <p className="text-xs text-red-500">{errors.version}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Admissible Evidence Types */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Admissible Evidence Types</CardTitle>
            <CardDescription>
              Define which types of evidence are accepted and their relative weights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Add */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Add Common Types</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_EVIDENCE_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleQuickAddType(type)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Evidence Types List */}
            <div className="space-y-3">
              {evidenceTypes.map((evType, index) => (
                <div key={index} className="p-3 border rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Type #{index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveEvidenceType(index)}
                      disabled={evidenceTypes.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Type Name</Label>
                      <Input
                        placeholder="e.g., Financial Statements"
                        value={evType.type}
                        onChange={(e) =>
                          handleEvidenceTypeChange(index, 'type', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        Weight
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              Relative importance (0.0-2.0). Higher = more influential.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={2}
                        value={evType.weight}
                        onChange={(e) =>
                          handleEvidenceTypeChange(index, 'weight', parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Decay</Label>
                      <Select
                        value={evType.decayRule}
                        onValueChange={(v) => handleEvidenceTypeChange(index, 'decayRule', v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="exponential">Exponential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`required-${index}`}
                      checked={evType.required}
                      onCheckedChange={(checked) =>
                        handleEvidenceTypeChange(index, 'required', checked)
                      }
                    />
                    <Label htmlFor={`required-${index}`} className="text-xs">
                      Required for case completion
                    </Label>
                  </div>
                </div>
              ))}
              {errors.evidenceTypes && (
                <p className="text-xs text-red-500">{errors.evidenceTypes}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddEvidenceType}>
              <Plus className="h-4 w-4 mr-1" />
              Add Evidence Type
            </Button>
          </CardContent>
        </Card>

        {/* Confidence Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confidence Thresholds</CardTitle>
            <CardDescription>
              Define confidence level boundaries for evidence classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">High</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.high.min}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          high: { ...confidenceWeights.high, min: parseFloat(e.target.value) },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.high.max}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          high: { ...confidenceWeights.high, max: parseFloat(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 border rounded-md bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.medium.min}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          medium: {
                            ...confidenceWeights.medium,
                            min: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.medium.max}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          medium: {
                            ...confidenceWeights.medium,
                            max: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 border rounded-md bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Low</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.low.min}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          low: { ...confidenceWeights.low, min: parseFloat(e.target.value) },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      className="h-8 text-sm"
                      value={confidenceWeights.low.max}
                      onChange={(e) =>
                        setConfidenceWeights({
                          ...confidenceWeights,
                          low: { ...confidenceWeights.low, max: parseFloat(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings (Collapsible) */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Advanced Settings</span>
                  {advancedOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 border-t pt-4">
                {/* Decay Rules */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Decay Rules</Label>
                    <p className="text-xs text-muted-foreground">
                      Define how evidence confidence decays over time
                    </p>
                  </div>
                  {decayRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Evidence Type</Label>
                        <Input
                          placeholder="e.g., financial"
                          value={rule.type}
                          onChange={(e) => handleDecayRuleChange(index, 'type', e.target.value)}
                        />
                      </div>
                      <div className="w-24 space-y-1.5">
                        <Label className="text-xs">Rate</Label>
                        <Input
                          type="number"
                          step={0.01}
                          min={0}
                          max={1}
                          value={rule.rate}
                          onChange={(e) =>
                            handleDecayRuleChange(index, 'rate', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="w-32 space-y-1.5">
                        <Label className="text-xs">Period</Label>
                        <Select
                          value={rule.period}
                          onValueChange={(v) => handleDecayRuleChange(index, 'period', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5"
                        onClick={() => handleRemoveDecayRule(index)}
                        disabled={decayRules.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddDecayRule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Decay Rule
                  </Button>
                </div>

                {/* Forbidden Classes */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Forbidden Evidence Classes</Label>
                    <p className="text-xs text-muted-foreground">
                      Evidence types that should never be admitted
                    </p>
                  </div>
                  {forbiddenClasses.map((fc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="e.g., Unverified social media"
                        value={fc}
                        onChange={(e) => handleForbiddenClassChange(index, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveForbiddenClass(index)}
                        disabled={forbiddenClasses.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddForbiddenClass}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Forbidden Class
                  </Button>
                </div>

                {/* Coverage Checklist */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Coverage Checklist</Label>
                    <p className="text-xs text-muted-foreground">
                      Evidence coverage requirements for case completion
                    </p>
                  </div>
                  {coverageChecklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Coverage Item</Label>
                        <Input
                          placeholder="e.g., Revenue verification"
                          value={item.item}
                          onChange={(e) =>
                            handleCoverageItemChange(index, 'item', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-5">
                        <Switch
                          id={`coverage-required-${index}`}
                          checked={item.required}
                          onCheckedChange={(checked) =>
                            handleCoverageItemChange(index, 'required', checked)
                          }
                        />
                        <Label htmlFor={`coverage-required-${index}`} className="text-xs">
                          Required
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5"
                        onClick={() => handleRemoveCoverageItem(index)}
                        disabled={coverageChecklist.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddCoverageItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Coverage Item
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This schema will be saved as a draft. Once activated, all new
              cases will use this schema to determine admissible evidence. Existing cases remain
              bound to their locked schema version.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.push(`/mandates/${mandateId}/schema`)}>
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
