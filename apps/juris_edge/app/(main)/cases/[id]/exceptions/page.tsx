'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  User,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ExceptionStatus } from '@/types/domain';
import { formatDate } from '@/lib/date-utils';

// Mock data - backend_pending
interface Exception {
  id: string;
  ruleId: string;
  ruleName: string;
  category: string;
  status: ExceptionStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceValue: string;
  expectedValue: string;
  gap: string;
  justification: string | null;
  justifiedBy: string | null;
  scope: string | null;
  conditions: string | null;
  signedOffAt: Date | null;
  signedOffBy: string | null;
  createdAt: Date;
}

const MOCK_EXCEPTIONS: Exception[] = [
  {
    id: '1',
    ruleId: 'CON-001',
    ruleName: 'Sector Concentration',
    category: 'Risk',
    status: 'pending',
    severity: 'medium',
    evidenceValue: '42%',
    expectedValue: '≤40%',
    gap: 'Would exceed tech sector concentration by 2%',
    justification: null,
    justifiedBy: null,
    scope: null,
    conditions: null,
    signedOffAt: null,
    signedOffBy: null,
    createdAt: new Date('2024-03-12'),
  },
  {
    id: '2',
    ruleId: 'EXC-001',
    ruleName: 'Exclusion List Check',
    category: 'Mandate',
    status: 'pending',
    severity: 'high',
    evidenceValue: 'Crypto integration',
    expectedValue: 'No crypto',
    gap: 'Product has crypto payment integration',
    justification: null,
    justifiedBy: null,
    scope: null,
    conditions: null,
    signedOffAt: null,
    signedOffBy: null,
    createdAt: new Date('2024-03-12'),
  },
  {
    id: '3',
    ruleId: 'CHK-001',
    ruleName: 'Check Size Limit',
    category: 'Risk',
    status: 'justified',
    severity: 'medium',
    evidenceValue: '$12M',
    expectedValue: '≤$10M',
    gap: 'Proposed investment exceeds single check limit',
    justification: 'Strategic importance justifies larger check. Co-investment with Tier 1 VC reduces effective exposure. Risk committee approved.',
    justifiedBy: 'risk@company.com',
    scope: 'Single transaction exception',
    conditions: 'Must maintain co-investor participation of at least 40%',
    signedOffAt: new Date('2024-03-11'),
    signedOffBy: 'partner@company.com',
    createdAt: new Date('2024-03-10'),
  },
];

function getSeverityBadge(severity: Exception['severity']) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'high':
      return <Badge className="bg-red-500">High</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500">Medium</Badge>;
    case 'low':
      return <Badge variant="secondary">Low</Badge>;
  }
}

function getStatusBadge(status: ExceptionStatus) {
  switch (status) {
    case 'pending':
      return <Badge variant="destructive">Pending</Badge>;
    case 'justified':
      return <Badge className="bg-green-600">Justified</Badge>;
    case 'resolved':
      return <Badge className="bg-blue-600">Resolved</Badge>;
  }
}

function getStatusIcon(status: ExceptionStatus) {
  switch (status) {
    case 'pending':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'justified':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'resolved':
      return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
  }
}

interface JustificationFormProps {
  exception: Exception;
  onSubmit: (data: { justification: string; scope: string; conditions: string }) => void;
  onCancel: () => void;
}

function JustificationForm({ exception, onSubmit, onCancel }: JustificationFormProps) {
  const [justification, setJustification] = useState(exception.justification || '');
  const [scope, setScope] = useState(exception.scope || '');
  const [conditions, setConditions] = useState(exception.conditions || '');

  const handleSubmit = () => {
    onSubmit({ justification, scope, conditions });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <Label htmlFor="justification">Justification *</Label>
        <Textarea
          id="justification"
          placeholder="Explain why this exception should be granted..."
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Provide a detailed rationale for granting this exception.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scope">Scope</Label>
          <Input
            id="scope"
            placeholder="e.g., Single transaction, Time-bound"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conditions">Conditions</Label>
          <Input
            id="conditions"
            placeholder="e.g., Subject to quarterly review"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!justification.trim()}>
          Submit Justification
        </Button>
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [exceptions, setExceptions] = useState<Exception[]>(MOCK_EXCEPTIONS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const pendingExceptions = exceptions.filter((e) => e.status === 'pending');
  const justifiedExceptions = exceptions.filter((e) => e.status === 'justified');
  const resolvedExceptions = exceptions.filter((e) => e.status === 'resolved');

  const handleJustificationSubmit = (
    exceptionId: string,
    data: { justification: string; scope: string; conditions: string }
  ) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: 'justified' as ExceptionStatus,
              justification: data.justification,
              scope: data.scope,
              conditions: data.conditions,
              justifiedBy: 'current-user@company.com', // backend_pending
              signedOffAt: new Date(),
            }
          : e
      )
    );
    setEditingId(null);
  };

  const canProceed = pendingExceptions.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Exception Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 6: Review and justify rule violations before proceeding to decision
          </p>
        </div>
        <Button size="sm" disabled={!canProceed}>
          <ChevronRight className="h-4 w-4 mr-2" />
          {canProceed ? 'Proceed to Decision' : `${pendingExceptions.length} Pending`}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Total Exceptions</div>
            <div className="text-2xl font-semibold">{exceptions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-red-600 mb-1">Pending</div>
            <div className="text-2xl font-semibold text-red-700 dark:text-red-400">
              {pendingExceptions.length}
            </div>
            <div className="text-xs text-red-600">require action</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-green-600 mb-1">Justified</div>
            <div className="text-2xl font-semibold text-green-700 dark:text-green-400">
              {justifiedExceptions.length}
            </div>
            <div className="text-xs text-green-600">approved with rationale</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-blue-600 mb-1">Resolved</div>
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-400">
              {resolvedExceptions.length}
            </div>
            <div className="text-xs text-blue-600">evidence updated</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Warning */}
      {pendingExceptions.length > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {pendingExceptions.length} exception{pendingExceptions.length > 1 ? 's' : ''}{' '}
                require{pendingExceptions.length === 1 ? 's' : ''} justification before proceeding
                to decision
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Exceptions */}
      {pendingExceptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Exceptions</h2>
          {pendingExceptions.map((exception) => (
            <Card key={exception.id} className="border-red-200 dark:border-red-900">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(exception.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exception.ruleName}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {exception.ruleId}
                        </Badge>
                        {getSeverityBadge(exception.severity)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Category: {exception.category}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(exception.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Found</div>
                    <div className="font-mono text-sm">{exception.evidenceValue}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Expected</div>
                    <div className="font-mono text-sm">{exception.expectedValue}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Gap</div>
                    <div className="text-sm text-red-600 dark:text-red-400">{exception.gap}</div>
                  </div>
                </div>

                {editingId === exception.id ? (
                  <JustificationForm
                    exception={exception}
                    onSubmit={(data) => handleJustificationSubmit(exception.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setEditingId(exception.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Provide Justification
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/cases/${caseId}/evidence`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Update Evidence
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Justified Exceptions */}
      {justifiedExceptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Justified Exceptions</h2>
          {justifiedExceptions.map((exception) => (
            <Card
              key={exception.id}
              className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10"
            >
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(exception.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exception.ruleName}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {exception.ruleId}
                        </Badge>
                        {getSeverityBadge(exception.severity)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Category: {exception.category}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(exception.status)}
                </div>

                <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Justification</div>
                    <div className="text-sm">{exception.justification}</div>
                  </div>
                  {(exception.scope || exception.conditions) && (
                    <div className="grid grid-cols-2 gap-4">
                      {exception.scope && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Scope</div>
                          <div className="text-sm">{exception.scope}</div>
                        </div>
                      )}
                      {exception.conditions && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Conditions</div>
                          <div className="text-sm">{exception.conditions}</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {exception.justifiedBy}
                    </div>
                    {exception.signedOffBy && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        Signed off by {exception.signedOffBy}
                      </div>
                    )}
                    {exception.signedOffAt && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(exception.signedOffAt)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {exceptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No Exceptions</h3>
            <p className="text-sm text-muted-foreground">
              All policy rules are compliant. You can proceed to the decision step.
            </p>
            <Button className="mt-4">
              <ChevronRight className="h-4 w-4 mr-2" />
              Proceed to Decision
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
