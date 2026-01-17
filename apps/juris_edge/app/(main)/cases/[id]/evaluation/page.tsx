'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  FileText,
  Eye,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/date-utils';

// Mock data - backend_pending
interface ComplianceResult {
  id: string;
  ruleId: string;
  ruleName: string;
  category: string;
  status: 'compliant' | 'violation' | 'underspecified';
  evidenceId: string;
  evidenceValue: string;
  expectedValue?: string;
  confidence: number;
  gap?: string;
}

interface FitMisfitSummary {
  lastRunAt: Date;
  baselineVersion: string;
  totalRules: number;
  compliant: number;
  violations: number;
  underspecified: number;
}

const MOCK_SUMMARY: FitMisfitSummary = {
  lastRunAt: new Date('2024-03-12T14:34:00'),
  baselineVersion: 'v1.2.0',
  totalRules: 40,
  compliant: 32,
  violations: 3,
  underspecified: 5,
};

const MOCK_RESULTS: ComplianceResult[] = [
  // Compliant
  { id: '1', ruleId: 'REV-001', ruleName: 'Minimum Revenue Threshold', category: 'Financial', status: 'compliant', evidenceId: 'c1', evidenceValue: '$2.4M ARR', expectedValue: '>$500K', confidence: 0.95 },
  { id: '2', ruleId: 'GRO-001', ruleName: 'YoY Growth Rate', category: 'Financial', status: 'compliant', evidenceId: 'c2', evidenceValue: '142%', expectedValue: '>100%', confidence: 0.92 },
  { id: '3', ruleId: 'MAR-001', ruleName: 'Gross Margin', category: 'Financial', status: 'compliant', evidenceId: 'c3', evidenceValue: '68%', expectedValue: '>50%', confidence: 0.89 },
  { id: '4', ruleId: 'CUS-001', ruleName: 'Customer Count', category: 'Traction', status: 'compliant', evidenceId: 'c5', evidenceValue: '45', expectedValue: '>10', confidence: 0.88 },
  { id: '5', ruleId: 'SEC-001', ruleName: 'Sector Eligibility', category: 'Mandate', status: 'compliant', evidenceId: 'c10', evidenceValue: 'B2B SaaS', expectedValue: 'B2B SaaS', confidence: 0.99 },
  { id: '6', ruleId: 'GEO-001', ruleName: 'Geography', category: 'Mandate', status: 'compliant', evidenceId: 'c11', evidenceValue: 'US', expectedValue: 'NA/WE', confidence: 0.99 },
  // Violations
  { id: '7', ruleId: 'CON-001', ruleName: 'Sector Concentration', category: 'Risk', status: 'violation', evidenceId: 'c12', evidenceValue: '42%', expectedValue: '≤40%', confidence: 0.95, gap: 'Would exceed tech sector concentration by 2%' },
  { id: '8', ruleId: 'EXC-001', ruleName: 'Exclusion List Check', category: 'Mandate', status: 'violation', evidenceId: 'c13', evidenceValue: 'Crypto integration', expectedValue: 'No crypto', confidence: 0.72, gap: 'Product has crypto payment integration' },
  { id: '9', ruleId: 'CHK-001', ruleName: 'Check Size Limit', category: 'Risk', status: 'violation', evidenceId: 'c14', evidenceValue: '$12M', expectedValue: '≤$10M', confidence: 0.98, gap: 'Proposed investment exceeds single check limit' },
  // Underspecified
  { id: '10', ruleId: 'BGC-001', ruleName: 'Team Background Checks', category: 'Governance', status: 'underspecified', evidenceId: '', evidenceValue: 'Not provided', confidence: 0 },
  { id: '11', ruleId: 'TEC-001', ruleName: 'Technical Assessment', category: 'Due Diligence', status: 'underspecified', evidenceId: '', evidenceValue: 'Not provided', confidence: 0 },
  { id: '12', ruleId: 'LEG-001', ruleName: 'Legal Review', category: 'Governance', status: 'underspecified', evidenceId: '', evidenceValue: 'Incomplete', confidence: 0.3 },
  { id: '13', ruleId: 'REF-001', ruleName: 'Reference Checks', category: 'Due Diligence', status: 'underspecified', evidenceId: 'c15', evidenceValue: '2 of 5 required', confidence: 0.4 },
  { id: '14', ruleId: 'CAP-001', ruleName: 'Cap Table Verification', category: 'Legal', status: 'underspecified', evidenceId: '', evidenceValue: 'Processing', confidence: 0 },
];

function getStatusBadge(status: ComplianceResult['status']) {
  switch (status) {
    case 'compliant':
      return <Badge className="bg-green-600">Compliant</Badge>;
    case 'violation':
      return <Badge variant="destructive">Violation</Badge>;
    case 'underspecified':
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Underspecified</Badge>;
  }
}

function getStatusIcon(status: ComplianceResult['status']) {
  switch (status) {
    case 'compliant':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'violation':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'underspecified':
      return <HelpCircle className="h-4 w-4 text-amber-600" />;
  }
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [summary] = useState<FitMisfitSummary>(MOCK_SUMMARY);
  const [results] = useState<ComplianceResult[]>(MOCK_RESULTS);
  const [isRunning, setIsRunning] = useState(false);

  const compliantResults = results.filter((r) => r.status === 'compliant');
  const violationResults = results.filter((r) => r.status === 'violation');
  const underspecifiedResults = results.filter((r) => r.status === 'underspecified');

  const handleRunEvaluation = () => {
    setIsRunning(true);
    // Simulate API call - backend_pending
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const complianceRate = Math.round((summary.compliant / summary.totalRules) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Policy Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 5: Evaluate claims against baseline {summary.baselineVersion}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRunEvaluation} disabled={isRunning}>
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Running...' : 'Re-run Evaluation'}
        </Button>
        <Button size="sm" disabled={violationResults.length > 0}>
          <ChevronRight className="h-4 w-4 mr-2" />
          {violationResults.length > 0 ? 'Handle Exceptions First' : 'Proceed to Decision'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Compliance Rate</div>
            <div className="text-2xl font-semibold">{complianceRate}%</div>
            <Progress value={complianceRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-green-600 mb-1">Compliant</div>
            <div className="text-2xl font-semibold text-green-700 dark:text-green-400">
              {summary.compliant}
            </div>
            <div className="text-xs text-green-600">of {summary.totalRules} rules</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-red-600 mb-1">Violations</div>
            <div className="text-2xl font-semibold text-red-700 dark:text-red-400">
              {summary.violations}
            </div>
            <div className="text-xs text-red-600">require exception handling</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
          <CardContent className="pt-4">
            <div className="text-xs text-amber-600 mb-1">Underspecified</div>
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">
              {summary.underspecified}
            </div>
            <div className="text-xs text-amber-600">missing evidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Run Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Last evaluated: {formatDateTime(summary.lastRunAt)} against baseline{' '}
        <span className="font-mono">{summary.baselineVersion}</span>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="violations">
        <TabsList>
          <TabsTrigger value="violations" className="text-red-600">
            Violations ({violationResults.length})
          </TabsTrigger>
          <TabsTrigger value="underspecified" className="text-amber-600">
            Underspecified ({underspecifiedResults.length})
          </TabsTrigger>
          <TabsTrigger value="compliant" className="text-green-600">
            Compliant ({compliantResults.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Rules ({results.length})</TabsTrigger>
        </TabsList>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4 mt-4">
          {violationResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No violations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {violationResults.map((result) => (
                <Card key={result.id} className="border-red-200 dark:border-red-900">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.ruleName}</span>
                            <Badge variant="outline" className="text-xs">
                              {result.ruleId}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Category: {result.category}
                          </div>
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Found:</span>{' '}
                              <span className="font-mono">{result.evidenceValue}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Expected:</span>{' '}
                              <span className="font-mono">{result.expectedValue}</span>
                            </div>
                            {result.gap && (
                              <div className="text-sm mt-1 text-red-600">{result.gap}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Evidence
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/cases/${caseId}/exceptions`)}
                        >
                          Handle Exception
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Underspecified Tab */}
        <TabsContent value="underspecified" className="space-y-4 mt-4">
          {underspecifiedResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All evidence requirements met</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {underspecifiedResults.map((result) => (
                <Card key={result.id} className="border-amber-200 dark:border-amber-900">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.ruleName}</span>
                            <Badge variant="outline" className="text-xs">
                              {result.ruleId}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Category: {result.category}
                          </div>
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                            <div className="text-sm text-amber-700 dark:text-amber-400">
                              {result.evidenceValue}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/cases/${caseId}/evidence`)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Upload Evidence
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Compliant Tab */}
        <TabsContent value="compliant" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Rule</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Evidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Expected</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Confidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {compliantResults.map((result) => (
                    <tr key={result.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{result.ruleName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{result.ruleId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">{result.category}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-mono">{result.evidenceValue}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-mono text-muted-foreground">{result.expectedValue}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Progress value={result.confidence * 100} className="w-12 h-1.5" />
                          <span className="text-xs text-muted-foreground">
                            {(result.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{getStatusBadge(result.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Rules Tab */}
        <TabsContent value="all" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-8"></th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Rule</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Evidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">{getStatusIcon(result.status)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{result.ruleName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{result.ruleId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">{result.category}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-mono">{result.evidenceValue}</span>
                      </td>
                      <td className="px-4 py-2">{getStatusBadge(result.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
