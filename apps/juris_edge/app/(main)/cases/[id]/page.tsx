'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Database,
  Upload,
  Search,
  AlertTriangle,
  Gavel,
  BarChart3,
  FileOutput,
  Activity,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useActiveContext } from '@/contexts/ActiveContext';
import { formatDate } from '@/lib/date-utils';
import type { CaseStatus, WorkflowStep, Case, DecisionEnvelope } from '@/types/domain';

// Mock case data - backend_pending
const MOCK_CASE: Case = {
  id: '1',
  mandateId: '1',
  type: 'deal',
  name: 'TechCorp Series A',
  status: 'evidence',
  decisionEnvelope: {
    caseId: '1',
    baselineVersionId: 'v1.2.0',
    schemaVersionId: 'v1.0.0',
    lockedAt: new Date('2024-03-01'),
    isLocked: true,
  },
  currentStep: 4,
  createdAt: new Date('2024-03-01'),
};

interface StepInfo {
  step: WorkflowStep;
  name: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'locked';
  description: string;
}

const getStepsForCase = (currentStep: WorkflowStep): StepInfo[] => {
  const steps: Omit<StepInfo, 'status'>[] = [
    { step: 3, name: 'Case Intake', icon: <FileText className="h-4 w-4" />, description: 'Decision envelope locked' },
    { step: 4, name: 'Evidence Ingestion', icon: <Upload className="h-4 w-4" />, description: 'Upload & extract claims' },
    { step: 5, name: 'Policy Evaluation', icon: <Search className="h-4 w-4" />, description: 'Evaluate against baseline' },
    { step: 6, name: 'Exception Analysis', icon: <AlertTriangle className="h-4 w-4" />, description: 'Handle rule violations' },
    { step: 7, name: 'Decision & Precedent', icon: <Gavel className="h-4 w-4" />, description: 'Render decision' },
    { step: 8, name: 'Portfolio Integration', icon: <BarChart3 className="h-4 w-4" />, description: 'Integrate into portfolio' },
    { step: 9, name: 'Reporting', icon: <FileOutput className="h-4 w-4" />, description: 'Generate certified reports' },
    { step: 10, name: 'Monitoring', icon: <Activity className="h-4 w-4" />, description: 'Monitor for drift' },
  ];

  return steps.map((s) => ({
    ...s,
    status: s.step < currentStep ? 'completed' : s.step === currentStep ? 'current' : 'pending',
  }));
};

function getStepStatusIcon(status: StepInfo['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'current':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'locked':
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  }
}

// Evidence Summary Card Component
function EvidenceSummaryCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Evidence Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-2xl font-semibold">12</div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-2xl font-semibold">47</div>
            <div className="text-xs text-muted-foreground">Claims</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-2xl font-semibold">85%</div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Coverage Progress</span>
            <span className="font-medium">85%</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
        <Button className="w-full" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </CardContent>
    </Card>
  );
}

// Evaluation Summary Card Component
function EvaluationSummaryCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Evaluation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
            <div className="text-2xl font-semibold text-green-700 dark:text-green-400">32</div>
            <div className="text-xs text-green-600 dark:text-green-500">Compliant</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
            <div className="text-2xl font-semibold text-red-700 dark:text-red-400">3</div>
            <div className="text-xs text-red-600 dark:text-red-500">Violations</div>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900">
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">5</div>
            <div className="text-xs text-amber-600 dark:text-amber-500">Underspecified</div>
          </div>
        </div>
        <Button className="w-full" size="sm" variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Run Evaluation
        </Button>
      </CardContent>
    </Card>
  );
}

// Exception Summary Card Component
function ExceptionSummaryCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Exception Register
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
            <div className="text-2xl font-semibold text-red-700 dark:text-red-400">2</div>
            <div className="text-xs text-red-600 dark:text-red-500">Pending</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
            <div className="text-2xl font-semibold text-green-700 dark:text-green-400">1</div>
            <div className="text-xs text-green-600 dark:text-green-500">Justified</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-400">0</div>
            <div className="text-xs text-blue-600 dark:text-blue-500">Resolved</div>
          </div>
        </div>
        <Button className="w-full" size="sm" variant="outline">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Review Exceptions
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveCase } = useActiveContext();
  const caseId = params.id as string;

  const [caseData] = useState<Case>(MOCK_CASE);
  const [activeTab, setActiveTab] = useState('overview');

  const steps = getStepsForCase(caseData.currentStep);

  // Set case in context when loaded
  useEffect(() => {
    setActiveCase(caseData);
  }, [caseData, setActiveCase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/cases')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{caseData.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {caseData.type.replace('_', ' ')}
            </Badge>
            <Badge
              className={
                caseData.status === 'evidence'
                  ? 'bg-blue-600'
                  : caseData.status === 'evaluation'
                  ? 'bg-amber-600'
                  : caseData.status === 'exceptions'
                  ? 'bg-red-600'
                  : ''
              }
            >
              Step {caseData.currentStep}: {caseData.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Created {formatDate(caseData.createdAt)}
          </p>
        </div>
      </div>

      {/* Decision Envelope Banner */}
      <div className="bg-muted/50 border rounded-md p-3">
        <div className="flex items-center gap-4">
          <Lock className="h-4 w-4 text-green-600" />
          <div className="flex-1 flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Baseline:</span>{' '}
              <span className="font-mono font-medium">{caseData.decisionEnvelope.baselineVersionId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Schema:</span>{' '}
              <span className="font-mono font-medium">{caseData.decisionEnvelope.schemaVersionId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Locked:</span>{' '}
              <span>{formatDate(caseData.decisionEnvelope.lockedAt)}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Lock className="h-3 w-3 mr-1" />
            Envelope Locked
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Workflow Steps Sidebar */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Workflow Progress</h2>
          <div className="space-y-1">
            {steps.map((step) => (
              <button
                key={step.step}
                onClick={() => {
                  if (step.status === 'completed' || step.status === 'current') {
                    setActiveTab(`step-${step.step}`);
                  }
                }}
                disabled={step.status === 'pending'}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                  activeTab === `step-${step.step}`
                    ? 'bg-primary text-primary-foreground'
                    : step.status === 'pending'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted'
                }`}
              >
                {step.status === 'current' || step.status === 'completed'
                  ? step.icon
                  : getStepStatusIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono opacity-60">{step.step}</span>
                    <span className="text-sm truncate">{step.name}</span>
                  </div>
                  <div
                    className={`text-xs truncate ${
                      activeTab === `step-${step.step}` ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
                {step.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                {step.status === 'current' && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="step-4">Evidence</TabsTrigger>
              <TabsTrigger value="step-5">Evaluation</TabsTrigger>
              <TabsTrigger value="step-6">Exceptions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <EvidenceSummaryCard />
                <EvaluationSummaryCard />
              </div>
              <ExceptionSummaryCard />
            </TabsContent>

            {/* Evidence Tab (Step 4) */}
            <TabsContent value="step-4" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Evidence Ingestion
                  </CardTitle>
                  <CardDescription>
                    Upload documents and extract claims for evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Drag and drop files here, or click to browse
                    </p>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Uploaded Documents (12)</h3>
                    <div className="border rounded-md divide-y">
                      {['Financial Statements Q4 2023.pdf', 'Pitch Deck v2.pdf', 'Customer References.xlsx'].map(
                        (doc, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{doc}</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Processed
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluation Tab (Step 5) */}
            <TabsContent value="step-5" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Policy Evaluation
                  </CardTitle>
                  <CardDescription>
                    Evaluate extracted claims against the locked baseline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Fit/Misfit Analysis</div>
                      <div className="text-xs text-muted-foreground">
                        Last run: March 12, 2024 at 2:34 PM
                      </div>
                    </div>
                    <Button size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Re-run Evaluation
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Compliance Summary</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Revenue Threshold Met</span>
                        </div>
                        <Badge variant="outline" className="text-green-600">Pass</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Sector Concentration Exceeded</span>
                        </div>
                        <Badge variant="destructive">Violation</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium">Team Background Check</span>
                        </div>
                        <Badge variant="outline" className="text-amber-600">Missing</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exceptions Tab (Step 6) */}
            <TabsContent value="step-6" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Exception Analysis
                  </CardTitle>
                  <CardDescription>
                    Review and justify rule violations before proceeding to decision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {/* Exception Item */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Sector Concentration Exceeded</span>
                        </div>
                        <Badge variant="destructive">Pending</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Investment would increase technology sector concentration to 42%, exceeding
                        the 40% threshold defined in baseline v1.2.0.
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Provide Justification
                        </Button>
                        <Button size="sm" variant="outline">
                          Request Exception
                        </Button>
                      </div>
                    </div>

                    {/* Justified Exception */}
                    <div className="border border-green-200 dark:border-green-900 rounded-lg p-4 space-y-3 bg-green-50/50 dark:bg-green-950/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">First Investment in AI/ML Sector</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Justified
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Exception justified with thesis document. Approved by Risk Committee on March 10, 2024.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Signed off by: risk@company.com
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button disabled={true}>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Proceed to Decision (1 pending exception)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
