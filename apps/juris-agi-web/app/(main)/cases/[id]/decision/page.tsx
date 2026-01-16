'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Gavel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  FileText,
  User,
  History,
  Scale,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/date-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DecisionType, DecisionClassification, PrecedentWeight } from '@/types/domain';

// Mock data - backend_pending
interface DecisionDraft {
  decision: DecisionType | null;
  classification: DecisionClassification;
  rationale: string;
  conditions: string;
  decidedBy: string[];
}

interface AuditEntry {
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
}

interface PrecedentCandidate {
  id: string;
  caseId: string;
  caseName: string;
  decision: DecisionType;
  similarity: number;
  relevantFactors: string[];
  weight: PrecedentWeight;
}

const MOCK_AUDIT_TRAIL: AuditEntry[] = [
  { timestamp: new Date('2024-03-12T14:00:00'), action: 'Case Created', actor: 'analyst@company.com', details: 'Decision envelope locked with baseline v1.2.0' },
  { timestamp: new Date('2024-03-12T14:30:00'), action: 'Evidence Uploaded', actor: 'analyst@company.com', details: '12 documents uploaded' },
  { timestamp: new Date('2024-03-12T15:00:00'), action: 'Claims Extracted', actor: 'system', details: '47 claims extracted from documents' },
  { timestamp: new Date('2024-03-12T15:30:00'), action: 'Evaluation Completed', actor: 'system', details: '32 compliant, 3 violations, 5 underspecified' },
  { timestamp: new Date('2024-03-12T16:00:00'), action: 'Exception Justified', actor: 'risk@company.com', details: 'Check size exception approved by Risk Committee' },
  { timestamp: new Date('2024-03-13T10:00:00'), action: 'Exception Justified', actor: 'partner@company.com', details: 'Sector concentration exception approved' },
];

const MOCK_PRECEDENTS: PrecedentCandidate[] = [
  {
    id: '1',
    caseId: 'case-2023-042',
    caseName: 'DataScale Series A',
    decision: 'approve',
    similarity: 0.87,
    relevantFactors: ['Similar revenue profile', 'Same sector', 'Comparable growth rate'],
    weight: 'persuasive',
  },
  {
    id: '2',
    caseId: 'case-2023-028',
    caseName: 'CloudOps Seed Extension',
    decision: 'conditional',
    similarity: 0.72,
    relevantFactors: ['Similar check size', 'Sector concentration concern'],
    weight: 'informational',
  },
  {
    id: '3',
    caseId: 'case-2022-089',
    caseName: 'TechFlow Series B',
    decision: 'reject',
    similarity: 0.65,
    relevantFactors: ['Crypto integration', 'Exclusion list concern'],
    weight: 'informational',
  },
];

function getDecisionIcon(decision: DecisionType | null) {
  switch (decision) {
    case 'approve':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'reject':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'conditional':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'defer':
      return <Clock className="h-5 w-5 text-blue-600" />;
    default:
      return <Gavel className="h-5 w-5 text-muted-foreground" />;
  }
}

function getDecisionBadge(decision: DecisionType | null) {
  switch (decision) {
    case 'approve':
      return <Badge className="bg-green-600">Approve</Badge>;
    case 'reject':
      return <Badge variant="destructive">Reject</Badge>;
    case 'conditional':
      return <Badge className="bg-amber-600">Conditional</Badge>;
    case 'defer':
      return <Badge variant="secondary">Defer</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function getPrecedentWeightBadge(weight: PrecedentWeight) {
  switch (weight) {
    case 'binding':
      return <Badge className="bg-purple-600">Binding</Badge>;
    case 'persuasive':
      return <Badge variant="secondary">Persuasive</Badge>;
    case 'informational':
      return <Badge variant="outline">Informational</Badge>;
  }
}

export default function DecisionPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [draft, setDraft] = useState<DecisionDraft>({
    decision: null,
    classification: 'standard',
    rationale: '',
    conditions: '',
    decidedBy: [],
  });
  const [auditTrail] = useState<AuditEntry[]>(MOCK_AUDIT_TRAIL);
  const [precedents] = useState<PrecedentCandidate[]>(MOCK_PRECEDENTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createPrecedent, setCreatePrecedent] = useState(false);
  const [precedentLabel, setPrecedentLabel] = useState('');

  const canSubmit = draft.decision && draft.rationale.trim().length >= 50;

  const handleSubmitDecision = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    // Simulate API call - backend_pending
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/cases/${caseId}/portfolio`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Decision & Precedent</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 7: Render decision and establish case law
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Decision Form */}
        <div className="col-span-2 space-y-6">
          {/* Decision Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Investment Decision
              </CardTitle>
              <CardDescription>
                Select decision type and provide rationale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Type */}
              <div className="grid grid-cols-4 gap-3">
                {(['approve', 'conditional', 'defer', 'reject'] as DecisionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDraft({ ...draft, decision: type })}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      draft.decision === type
                        ? type === 'approve'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : type === 'reject'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : type === 'conditional'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {getDecisionIcon(type)}
                    </div>
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <Label>Decision Classification</Label>
                <Select
                  value={draft.classification}
                  onValueChange={(v) => setDraft({ ...draft, classification: v as DecisionClassification })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Decision</SelectItem>
                    <SelectItem value="exception">Exception-based Decision</SelectItem>
                    <SelectItem value="provisional_precedent">Provisional Precedent</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {draft.classification === 'standard' && 'Decision follows established baseline rules without exceptions.'}
                  {draft.classification === 'exception' && 'Decision includes justified exceptions to baseline rules.'}
                  {draft.classification === 'provisional_precedent' && 'Decision establishes new interpretation that may guide future cases.'}
                </p>
              </div>

              {/* Rationale */}
              <div className="space-y-2">
                <Label htmlFor="rationale">Decision Rationale *</Label>
                <Textarea
                  id="rationale"
                  placeholder="Provide detailed rationale for this decision..."
                  value={draft.rationale}
                  onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {draft.rationale.length}/50 characters minimum
                </p>
              </div>

              {/* Conditions (for conditional decisions) */}
              {draft.decision === 'conditional' && (
                <div className="space-y-2">
                  <Label htmlFor="conditions">Conditions for Approval</Label>
                  <Textarea
                    id="conditions"
                    placeholder="List the conditions that must be met..."
                    value={draft.conditions}
                    onChange={(e) => setDraft({ ...draft, conditions: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              {/* Create Precedent Option */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="createPrecedent"
                    checked={createPrecedent}
                    onChange={(e) => setCreatePrecedent(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="createPrecedent" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Create Case Law Entry
                  </Label>
                </div>
                {createPrecedent && (
                  <div className="space-y-2 pl-7">
                    <Label htmlFor="precedentLabel">Precedent Label</Label>
                    <Input
                      id="precedentLabel"
                      placeholder="e.g., 'Crypto Integration Exception Protocol'"
                      value={precedentLabel}
                      onChange={(e) => setPrecedentLabel(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This decision will be indexed as a referenceable precedent for future cases.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relevant Precedents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Relevant Precedents
              </CardTitle>
              <CardDescription>
                Similar cases from the case law library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {precedents.map((precedent) => (
                <div
                  key={precedent.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getDecisionIcon(precedent.decision)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{precedent.caseName}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {precedent.caseId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getDecisionBadge(precedent.decision)}
                          {getPrecedentWeightBadge(precedent.weight)}
                          <span className="text-xs text-muted-foreground">
                            {(precedent.similarity * 100).toFixed(0)}% similar
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {precedent.relevantFactors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Decision Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Decision Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Decision</span>
                {getDecisionBadge(draft.decision)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Classification</span>
                <Badge variant="outline" className="capitalize">
                  {draft.classification.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precedent</span>
                <Badge variant={createPrecedent ? 'default' : 'outline'}>
                  {createPrecedent ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="pt-3 border-t">
                <Button
                  className="w-full"
                  onClick={handleSubmitDecision}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-pulse" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Gavel className="h-4 w-4 mr-2" />
                      Submit Decision
                    </>
                  )}
                </Button>
                {!canSubmit && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Select decision and provide rationale (50+ chars)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {auditTrail.map((entry, i) => (
                  <div key={i} className="relative pl-4 pb-3 border-l last:pb-0">
                    <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-muted border-2 border-background" />
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </div>
                    <div className="text-sm font-medium">{entry.action}</div>
                    <div className="text-xs text-muted-foreground">{entry.details}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {entry.actor}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
