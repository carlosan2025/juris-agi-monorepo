'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Target,
  Ban,
  Gauge,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Rocket,
  Save,
  History,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/date-utils';
import {
  BASELINE_MODULE_INFO,
  type BaselineModuleType,
  type MandateModulePayload,
  type ExclusionsModulePayload,
  type RiskAppetiteModulePayload,
  type GovernanceThresholdsModulePayload,
  type ReportingObligationsModulePayload,
  DEFAULT_MANDATE_PAYLOAD,
  DEFAULT_EXCLUSIONS_PAYLOAD,
  DEFAULT_RISK_APPETITE_PAYLOAD,
  DEFAULT_GOVERNANCE_PAYLOAD,
  DEFAULT_REPORTING_PAYLOAD,
} from '@/types/domain';

// Mock baseline data - backend_pending
interface BaselineVersion {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  publishedAt: Date | null;
  modules: {
    mandate: MandateModulePayload;
    exclusions: ExclusionsModulePayload;
    risk_appetite: RiskAppetiteModulePayload;
    governance_thresholds: GovernanceThresholdsModulePayload;
    reporting_obligations: ReportingObligationsModulePayload;
  };
  moduleValidation: Record<BaselineModuleType, { isValid: boolean; errors: string[] }>;
}

const MOCK_DRAFT_BASELINE: BaselineVersion = {
  id: 'baseline-1',
  version: 1,
  status: 'DRAFT',
  createdAt: new Date('2024-03-10'),
  publishedAt: null,
  modules: {
    mandate: {
      ...DEFAULT_MANDATE_PAYLOAD,
      thesis: 'Invest in early-stage B2B SaaS companies with proven product-market fit, targeting Series A rounds of $5-15M.',
      geographicFocus: ['North America', 'Europe'],
      sectorFocus: ['Enterprise SaaS', 'FinTech', 'HealthTech'],
      stageFocus: ['Series A', 'Series B'],
      checkSizeRange: { min: 5000000, max: 15000000, currency: 'USD' },
    },
    exclusions: {
      ...DEFAULT_EXCLUSIONS_PAYLOAD,
      industryExclusions: ['Cryptocurrency/Blockchain', 'Gambling', 'Tobacco', 'Weapons'],
      hardExclusions: [
        { id: '1', name: 'OFAC Sanctions', description: 'Companies on OFAC sanctions list', condition: 'Entity on sanctions list', severity: 'hard', category: 'regulatory', autoReject: true },
      ],
    },
    risk_appetite: {
      ...DEFAULT_RISK_APPETITE_PAYLOAD,
      concentrationLimits: [
        { id: '1', name: 'Single Position', dimension: 'counterparty', maxPercentage: 15, warningThreshold: 12 },
        { id: '2', name: 'Sector Concentration', dimension: 'sector', maxPercentage: 40, warningThreshold: 35 },
      ],
      exposureLimits: [
        { id: '1', name: 'Max Check Size', type: 'single_position', maxAmount: 15000000, currency: 'USD' },
      ],
    },
    governance_thresholds: {
      ...DEFAULT_GOVERNANCE_PAYLOAD,
      approvalLevels: [
        { id: '1', name: 'Standard Approval', triggerConditions: [], requiredApprovers: ['IC_MEMBER'], quorum: 2 },
        { id: '2', name: 'Large Check Approval', triggerConditions: [{ field: 'check_size', operator: 'gt', value: 10000000 }], requiredApprovers: ['IC_CHAIR'], quorum: 1 },
      ],
    },
    reporting_obligations: DEFAULT_REPORTING_PAYLOAD,
  },
  moduleValidation: {
    mandate: { isValid: true, errors: [] },
    exclusions: { isValid: true, errors: [] },
    risk_appetite: { isValid: true, errors: [] },
    governance_thresholds: { isValid: true, errors: [] },
    reporting_obligations: { isValid: false, errors: ['At least one report type must be configured'] },
  },
};

const MODULE_ICONS: Record<BaselineModuleType, React.ElementType> = {
  mandate: Target,
  exclusions: Ban,
  risk_appetite: Gauge,
  governance_thresholds: Users,
  reporting_obligations: FileText,
};

export default function ConstitutionPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [baseline, setBaseline] = useState<BaselineVersion>(MOCK_DRAFT_BASELINE);
  const [activeModule, setActiveModule] = useState<BaselineModuleType>('mandate');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Calculate completion percentage
  const validModules = Object.values(baseline.moduleValidation).filter((v) => v.isValid).length;
  const completionPercent = (validModules / 5) * 100;
  const canPublish = validModules === 5;

  const handleSave = async () => {
    setIsSaving(true);
    // backend_pending: Save baseline modules via API
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    // backend_pending: Publish baseline via API
    await new Promise((r) => setTimeout(r, 1500));
    setIsPublishing(false);
    // After publishing, mandate becomes ACTIVE and cases can be created
    router.push(`/mandates/${mandateId}`);
  };

  // Mandate module handlers
  const updateMandate = (field: keyof MandateModulePayload, value: unknown) => {
    setBaseline((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        mandate: { ...prev.modules.mandate, [field]: value, updatedAt: new Date().toISOString() },
      },
    }));
  };

  // Add/remove list items
  const addToList = (module: keyof typeof baseline.modules, field: string, value: string) => {
    if (!value.trim()) return;
    setBaseline((prev) => {
      const currentList = (prev.modules[module] as Record<string, unknown>)[field] as string[];
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [module]: {
            ...prev.modules[module],
            [field]: [...currentList, value.trim()],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const removeFromList = (module: keyof typeof baseline.modules, field: string, index: number) => {
    setBaseline((prev) => {
      const currentList = (prev.modules[module] as Record<string, unknown>)[field] as string[];
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [module]: {
            ...prev.modules[module],
            [field]: currentList.filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/mandates/${mandateId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Mandate Constitution</h1>
            <Badge variant={baseline.status === 'DRAFT' ? 'secondary' : 'default'}>
              v{baseline.version} {baseline.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure the 5 baseline modules to define your evaluation framework
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={!canPublish || isPublishing}>
            <Rocket className="h-4 w-4 mr-1.5" />
            {isPublishing ? 'Publishing...' : 'Publish Baseline'}
          </Button>
        </div>
      </div>

      {/* Completion Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Baseline Completion</div>
            <div className="text-sm text-muted-foreground">{validModules}/5 modules ready</div>
          </div>
          <Progress value={completionPercent} className="h-2" />
          {!canPublish && (
            <p className="text-xs text-amber-600 mt-2">
              Complete all 5 modules to publish baseline v1 and start creating cases
            </p>
          )}
        </CardContent>
      </Card>

      {/* Module Navigation and Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Module Sidebar */}
        <div className="space-y-1">
          {(Object.keys(BASELINE_MODULE_INFO) as BaselineModuleType[]).map((moduleType) => {
            const info = BASELINE_MODULE_INFO[moduleType];
            const Icon = MODULE_ICONS[moduleType];
            const validation = baseline.moduleValidation[moduleType];

            return (
              <button
                key={moduleType}
                onClick={() => setActiveModule(moduleType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeModule === moduleType
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{info.shortLabel}</div>
                </div>
                {validation.isValid ? (
                  <CheckCircle2 className={`h-4 w-4 ${activeModule === moduleType ? 'text-primary-foreground' : 'text-green-600'}`} />
                ) : (
                  <AlertTriangle className={`h-4 w-4 ${activeModule === moduleType ? 'text-primary-foreground' : 'text-amber-500'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Module Content */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = MODULE_ICONS[activeModule];
                  return <Icon className="h-5 w-5" />;
                })()}
                {BASELINE_MODULE_INFO[activeModule].label}
              </CardTitle>
              <CardDescription>
                {BASELINE_MODULE_INFO[activeModule].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mandate Module */}
              {activeModule === 'mandate' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="thesis">Investment Thesis *</Label>
                    <Textarea
                      id="thesis"
                      placeholder="Describe your investment thesis and strategic focus..."
                      value={baseline.modules.mandate.thesis}
                      onChange={(e) => updateMandate('thesis', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Geographic Focus</Label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {baseline.modules.mandate.geographicFocus.map((geo, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {geo}
                            <button
                              onClick={() => removeFromList('mandate', 'geographicFocus', i)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add region..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addToList('mandate', 'geographicFocus', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Sector Focus</Label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {baseline.modules.mandate.sectorFocus.map((sector, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {sector}
                            <button
                              onClick={() => removeFromList('mandate', 'sectorFocus', i)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add sector..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addToList('mandate', 'sectorFocus', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Check Size Range</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum</Label>
                        <Input
                          type="number"
                          value={baseline.modules.mandate.checkSizeRange.min}
                          onChange={(e) =>
                            updateMandate('checkSizeRange', {
                              ...baseline.modules.mandate.checkSizeRange,
                              min: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Maximum</Label>
                        <Input
                          type="number"
                          value={baseline.modules.mandate.checkSizeRange.max}
                          onChange={(e) =>
                            updateMandate('checkSizeRange', {
                              ...baseline.modules.mandate.checkSizeRange,
                              max: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Currency</Label>
                        <Select
                          value={baseline.modules.mandate.checkSizeRange.currency}
                          onValueChange={(v) =>
                            updateMandate('checkSizeRange', {
                              ...baseline.modules.mandate.checkSizeRange,
                              currency: v,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Exclusions Module */}
              {activeModule === 'exclusions' && (
                <>
                  <div className="space-y-2">
                    <Label>Industry Exclusions (Hard)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Companies in these industries will be automatically rejected
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {baseline.modules.exclusions.industryExclusions.map((industry, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {industry}
                          <button
                            onClick={() => removeFromList('exclusions', 'industryExclusions', i)}
                            className="ml-1"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add excluded industry (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToList('exclusions', 'industryExclusions', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Geography Exclusions</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {baseline.modules.exclusions.geographyExclusions.map((geo, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-destructive text-destructive">
                          {geo}
                          <button
                            onClick={() => removeFromList('exclusions', 'geographyExclusions', i)}
                            className="ml-1"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add excluded geography (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToList('exclusions', 'geographyExclusions', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Custom Exclusion Rules</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Rule
                      </Button>
                    </div>
                    {baseline.modules.exclusions.hardExclusions.length > 0 ? (
                      <div className="space-y-2">
                        {baseline.modules.exclusions.hardExclusions.map((rule) => (
                          <div key={rule.id} className="p-3 border rounded-lg flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">{rule.name}</div>
                              <div className="text-xs text-muted-foreground">{rule.description}</div>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={rule.severity === 'hard' ? 'destructive' : 'secondary'} className="text-xs">
                                  {rule.severity}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No custom rules defined
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Risk Appetite Module */}
              {activeModule === 'risk_appetite' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Concentration Limits</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Limit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {baseline.modules.risk_appetite.concentrationLimits.map((limit) => (
                        <div key={limit.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{limit.name}</div>
                            <Badge variant="outline" className="text-xs">{limit.dimension}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Max:</span>{' '}
                              <span className="font-medium">{limit.maxPercentage}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Warning:</span>{' '}
                              <span className="font-medium text-amber-600">{limit.warningThreshold}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Exposure Limits</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Limit
                      </Button>
                    </div>
                    {baseline.modules.risk_appetite.exposureLimits.map((limit) => (
                      <div key={limit.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{limit.name}</div>
                          <div className="text-xs text-muted-foreground">{limit.type.replace('_', ' ')}</div>
                        </div>
                        <div className="text-lg font-semibold">
                          ${(limit.maxAmount / 1000000).toFixed(1)}M {limit.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Governance Module */}
              {activeModule === 'governance_thresholds' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Approval Levels</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Level
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {baseline.modules.governance_thresholds.approvalLevels.map((level) => (
                        <div key={level.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{level.name}</div>
                            <Badge variant="secondary" className="text-xs">
                              Quorum: {level.quorum}
                            </Badge>
                          </div>
                          {level.triggerConditions.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Triggers: {level.triggerConditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ')}
                            </div>
                          )}
                          <div className="text-xs mt-1">
                            Approvers: {level.requiredApprovers.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Reporting Module */}
              {activeModule === 'reporting_obligations' && (
                <>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Module incomplete</span>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                      {baseline.moduleValidation.reporting_obligations.errors[0]}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Internal Reports</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Report
                      </Button>
                    </div>
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      No internal reports configured. Add at least one report type.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Regulatory Filings</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Filing
                      </Button>
                    </div>
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      No regulatory filings configured
                    </div>
                  </div>
                </>
              )}

              {/* Validation Errors */}
              {!baseline.moduleValidation[activeModule].isValid && activeModule !== 'reporting_obligations' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      {baseline.moduleValidation[activeModule].errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
