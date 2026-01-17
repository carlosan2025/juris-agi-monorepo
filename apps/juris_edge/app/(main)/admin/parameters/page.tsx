'use client';

import { useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// backend_pending: Load from API
const DEFAULT_PARAMS = {
  contextSize: 'large',
  claimDensity: 'medium',
  precisionRecall: 50, // 0 = high recall, 100 = high precision
  dslStrictness: 'moderate',
  requireApproval: true,
  autoExtractClaims: true,
  conflictThreshold: 0.7,
  minEvidenceScore: 0.6,
};

export default function AdminParametersPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // backend_pending: Save to API
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Evaluation Parameters</h1>
            <p className="text-muted-foreground">
              Configure default parameters for evaluations and claim extraction
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Context & Extraction */}
        <Card>
          <CardHeader>
            <CardTitle>Context & Extraction</CardTitle>
            <CardDescription>
              Configure how claims are extracted from documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Context Size</label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Amount of surrounding text to include with each claim
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={params.contextSize}
                  onValueChange={(v) => setParams({ ...params, contextSize: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1 paragraph)</SelectItem>
                    <SelectItem value="medium">Medium (2-3 paragraphs)</SelectItem>
                    <SelectItem value="large">Large (Full section)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Claim Density</label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      How granular to extract claims from text
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={params.claimDensity}
                  onValueChange={(v) => setParams({ ...params, claimDensity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Key claims only)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (All claims)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Precision / Recall Balance</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    High precision = fewer false positives but may miss claims.
                    High recall = catches more claims but may include noise.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-20">High Recall</span>
                <Slider
                  value={[params.precisionRecall]}
                  onValueChange={([v]) => setParams({ ...params, precisionRecall: v })}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-24">High Precision</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Settings</CardTitle>
            <CardDescription>
              Configure evaluation behavior and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">DSL Strictness</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    How strictly to enforce DSL rule compliance
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={params.dslStrictness}
                onValueChange={(v) => setParams({ ...params, dslStrictness: v })}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lenient">Lenient (Warnings only)</SelectItem>
                  <SelectItem value="moderate">Moderate (Block critical)</SelectItem>
                  <SelectItem value="strict">Strict (Block all violations)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Conflict Detection Threshold</label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Minimum similarity score to flag potential conflicts
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={[params.conflictThreshold * 100]}
                  onValueChange={([v]) => setParams({ ...params, conflictThreshold: v / 100 })}
                  max={100}
                  step={5}
                />
                <div className="text-sm text-muted-foreground">
                  Current: {(params.conflictThreshold * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Minimum Evidence Score</label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Minimum score for evidence to be considered valid
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={[params.minEvidenceScore * 100]}
                  onValueChange={([v]) => setParams({ ...params, minEvidenceScore: v / 100 })}
                  max={100}
                  step={5}
                />
                <div className="text-sm text-muted-foreground">
                  Current: {(params.minEvidenceScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Settings</CardTitle>
            <CardDescription>
              Configure approval and automation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Require Approval for Activation</div>
                <div className="text-sm text-muted-foreground">
                  Require admin approval before activating new constitutions or schemas
                </div>
              </div>
              <Switch
                checked={params.requireApproval}
                onCheckedChange={(v) => setParams({ ...params, requireApproval: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Auto-Extract Claims</div>
                <div className="text-sm text-muted-foreground">
                  Automatically extract claims when documents are uploaded
                </div>
              </div>
              <Switch
                checked={params.autoExtractClaims}
                onCheckedChange={(v) => setParams({ ...params, autoExtractClaims: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
