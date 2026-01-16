'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CaseType } from '@/types/domain';
import { formatDate, formatDateTime } from '@/lib/date-utils';

// Mock project data - backend_pending
const MOCK_PROJECT = {
  id: '1',
  name: 'Series A Evaluation Framework',
  activeBaselineVersion: 'v1.2.0',
  activeSchemaVersion: 'v1.0.0',
  baselineActivatedAt: new Date('2024-03-05'),
  schemaActivatedAt: new Date('2024-01-25'),
};

export default function NewCasePage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [caseName, setCaseName] = useState('');
  const [caseType, setCaseType] = useState<CaseType>('deal');
  const [description, setDescription] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const project = MOCK_PROJECT;
  const canCreateCase = project.activeBaselineVersion && project.activeSchemaVersion;

  const handleLockEnvelope = () => {
    if (!caseName.trim()) return;
    setIsLocking(true);
    // Simulate API call - backend_pending
    setTimeout(() => {
      setIsLocked(true);
      setIsLocking(false);
    }, 1000);
  };

  const handleCreateCase = () => {
    if (!isLocked) return;
    // Navigate to the new case - backend_pending
    router.push(`/cases/new-case-id`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/mandates/${mandateId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">New Case Intake</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 3: Create decision envelope and bind to baseline
          </p>
        </div>
      </div>

      {/* Prerequisites Check */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Prerequisites</CardTitle>
          <CardDescription>
            Case creation requires an active baseline and schema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Constitution (Baseline)</div>
                <div className="text-xs text-muted-foreground">
                  Activated {formatDate(project.baselineActivatedAt)}
                </div>
              </div>
            </div>
            {project.activeBaselineVersion ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{project.activeBaselineVersion}</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Not configured</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Evidence Schema</div>
                <div className="text-xs text-muted-foreground">
                  Activated {formatDate(project.schemaActivatedAt)}
                </div>
              </div>
            </div>
            {project.activeSchemaVersion ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{project.activeSchemaVersion}</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Not configured</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Case Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Case Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caseName">Case Name *</Label>
            <Input
              id="caseName"
              placeholder="e.g., TechCorp Series A Evaluation"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseType">Case Type</Label>
            <Select value={caseType} onValueChange={(v) => setCaseType(v as CaseType)} disabled={isLocked}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">Deal Evaluation</SelectItem>
                <SelectItem value="underwriting">Underwriting Assessment</SelectItem>
                <SelectItem value="asset_gating">Asset Gating Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the case..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLocked}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Decision Envelope */}
      <Card className={isLocked ? 'border-green-500' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Decision Envelope
          </CardTitle>
          <CardDescription>
            Once locked, the case is permanently bound to these baseline and schema versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLocked ? (
            <>
              <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Baseline Version</span>
                  <span className="font-mono font-medium">{project.activeBaselineVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Schema Version</span>
                  <span className="font-mono font-medium">{project.activeSchemaVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lock Status</span>
                  <Badge variant="outline">Unlocked</Badge>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Important:</strong> Locking the decision envelope is irreversible.
                    The case will be permanently bound to the current baseline ({project.activeBaselineVersion})
                    and schema ({project.activeSchemaVersion}) versions. These cannot be changed after locking.
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLockEnvelope}
                disabled={!canCreateCase || !caseName.trim() || isLocking}
                className="w-full"
              >
                {isLocking ? (
                  <>
                    <Lock className="h-4 w-4 mr-2 animate-pulse" />
                    Locking Envelope...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Decision Envelope
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 border border-green-500 rounded-md bg-green-50 dark:bg-green-950/20 space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Decision Envelope Locked
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Baseline Version</span>
                  <span className="font-mono font-medium">{project.activeBaselineVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Schema Version</span>
                  <span className="font-mono font-medium">{project.activeSchemaVersion}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Locked At</span>
                  <span className="text-muted-foreground">{formatDateTime(new Date())}</span>
                </div>
              </div>

              <Button onClick={handleCreateCase} className="w-full">
                <Briefcase className="h-4 w-4 mr-2" />
                Create Case & Begin Evidence Gathering
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>What happens next:</strong> After creating the case, you'll proceed to
          Step 4 (Evidence Ingestion) where you can upload documents and extract claims.
        </p>
        <p>
          The locked baseline version defines the rules against which the case will be evaluated.
          The locked schema version defines what types of evidence are admissible.
        </p>
      </div>
    </div>
  );
}
