'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  PieChart,
  DollarSign,
  Percent,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - backend_pending
interface PortfolioState {
  totalDeployed: number;
  totalCommitted: number;
  largestPosition: number;
  avgCheckSize: number;
  positionCount: number;
}

interface SectorConcentration {
  sector: string;
  percentage: number;
  limit: number;
  status: 'ok' | 'warning' | 'breach';
}

interface DiagnosticResult {
  metric: string;
  description: string;
  currentValue: number;
  threshold: number;
  status: 'ok' | 'warning' | 'breach';
  impact: string;
}

interface ProposedChange {
  metric: string;
  before: string;
  after: string;
  delta: string;
  direction: 'up' | 'down' | 'neutral';
}

const MOCK_CURRENT_STATE: PortfolioState = {
  totalDeployed: 45000000,
  totalCommitted: 100000000,
  largestPosition: 8000000,
  avgCheckSize: 5000000,
  positionCount: 9,
};

const MOCK_SECTOR_CONCENTRATIONS: SectorConcentration[] = [
  { sector: 'B2B SaaS', percentage: 40, limit: 40, status: 'warning' },
  { sector: 'FinTech', percentage: 22, limit: 40, status: 'ok' },
  { sector: 'HealthTech', percentage: 18, limit: 40, status: 'ok' },
  { sector: 'DevTools', percentage: 12, limit: 40, status: 'ok' },
  { sector: 'AI/ML', percentage: 8, limit: 40, status: 'ok' },
];

const MOCK_DIAGNOSTICS: DiagnosticResult[] = [
  { metric: 'Sector Concentration', description: 'B2B SaaS sector would reach 44%', currentValue: 44, threshold: 40, status: 'breach', impact: 'Exceeds limit by 4%' },
  { metric: 'Single Position Size', description: 'Position size within limits', currentValue: 12, threshold: 15, status: 'ok', impact: 'Within 80% of limit' },
  { metric: 'Portfolio Utilization', description: 'Fund deployment percentage', currentValue: 57, threshold: 90, status: 'ok', impact: 'Adequate runway remaining' },
  { metric: 'Check Size Consistency', description: 'Deviation from avg check size', currentValue: 140, threshold: 150, status: 'warning', impact: 'Approaching upper variance' },
];

const MOCK_PROPOSED_CHANGES: ProposedChange[] = [
  { metric: 'Total Deployed', before: '$45M', after: '$57M', delta: '+$12M', direction: 'up' },
  { metric: 'Position Count', before: '9', after: '10', delta: '+1', direction: 'up' },
  { metric: 'Largest Position', before: '$8M', after: '$12M', delta: '+$4M', direction: 'up' },
  { metric: 'B2B SaaS Concentration', before: '40%', after: '44%', delta: '+4%', direction: 'up' },
  { metric: 'Avg Check Size', before: '$5M', after: '$5.7M', delta: '+$0.7M', direction: 'up' },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function getStatusIcon(status: 'ok' | 'warning' | 'breach') {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'breach':
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

function getStatusBadge(status: 'ok' | 'warning' | 'breach') {
  switch (status) {
    case 'ok':
      return <Badge className="bg-green-600">OK</Badge>;
    case 'warning':
      return <Badge className="bg-amber-600">Warning</Badge>;
    case 'breach':
      return <Badge variant="destructive">Breach</Badge>;
  }
}

export default function PortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [currentState] = useState<PortfolioState>(MOCK_CURRENT_STATE);
  const [sectorConcentrations] = useState<SectorConcentration[]>(MOCK_SECTOR_CONCENTRATIONS);
  const [diagnostics] = useState<DiagnosticResult[]>(MOCK_DIAGNOSTICS);
  const [proposedChanges] = useState<ProposedChange[]>(MOCK_PROPOSED_CHANGES);
  const [isIntegrating, setIsIntegrating] = useState(false);

  const hasBreaches = diagnostics.some((d) => d.status === 'breach');
  const hasWarnings = diagnostics.some((d) => d.status === 'warning');

  const handleIntegrate = () => {
    setIsIntegrating(true);
    // Simulate API call - backend_pending
    setTimeout(() => {
      setIsIntegrating(false);
      router.push(`/cases/${caseId}/reporting`);
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
          <h1 className="text-xl font-semibold">Portfolio Integration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 8: Integrate decision into portfolio and run concentration diagnostics
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Breach Warning */}
      {hasBreaches && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Portfolio constraint breach detected
              </span>
              <span className="text-sm">
                — Integration requires exception approval or decision revision
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Total Deployed</span>
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(currentState.totalDeployed)}
            </div>
            <div className="text-xs text-muted-foreground">
              of {formatCurrency(currentState.totalCommitted)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs">Utilization</span>
            </div>
            <div className="text-2xl font-semibold">
              {((currentState.totalDeployed / currentState.totalCommitted) * 100).toFixed(0)}%
            </div>
            <Progress
              value={(currentState.totalDeployed / currentState.totalCommitted) * 100}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Positions</span>
            </div>
            <div className="text-2xl font-semibold">{currentState.positionCount}</div>
            <div className="text-xs text-muted-foreground">active investments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Largest Position</span>
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(currentState.largestPosition)}
            </div>
            <div className="text-xs text-muted-foreground">
              {((currentState.largestPosition / currentState.totalDeployed) * 100).toFixed(0)}% of deployed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PieChart className="h-4 w-4" />
              <span className="text-xs">Avg Check</span>
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(currentState.avgCheckSize)}
            </div>
            <div className="text-xs text-muted-foreground">per investment</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="impact">
        <TabsList>
          <TabsTrigger value="impact">Integration Impact</TabsTrigger>
          <TabsTrigger value="diagnostics">
            Diagnostics
            {hasBreaches && <span className="ml-1 text-red-500">({diagnostics.filter(d => d.status === 'breach').length})</span>}
          </TabsTrigger>
          <TabsTrigger value="concentration">Sector Concentration</TabsTrigger>
        </TabsList>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Proposed Portfolio Changes</CardTitle>
              <CardDescription>
                Impact of integrating TechCorp Series A ($12M)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-muted-foreground py-2">Metric</th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-24">Before</th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-24">After</th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-24">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {proposedChanges.map((change, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 text-sm">{change.metric}</td>
                      <td className="py-3 text-sm text-right font-mono text-muted-foreground">
                        {change.before}
                      </td>
                      <td className="py-3 text-sm text-right font-mono font-medium">
                        {change.after}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {change.direction === 'up' && (
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          )}
                          {change.direction === 'down' && (
                            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-mono ${
                              change.direction === 'up'
                                ? 'text-green-600'
                                : change.direction === 'down'
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {change.delta}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Integration Action */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Ready to Integrate</div>
                  <div className="text-sm text-muted-foreground">
                    {hasBreaches
                      ? 'Resolve breaches before integration'
                      : hasWarnings
                      ? 'Proceed with caution - warnings detected'
                      : 'All diagnostics passed'}
                  </div>
                </div>
                <Button onClick={handleIntegrate} disabled={hasBreaches || isIntegrating}>
                  {isIntegrating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Integrating...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Integrate & Continue
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="space-y-4 mt-4">
          <div className="space-y-3">
            {diagnostics.map((diagnostic, i) => (
              <Card
                key={i}
                className={
                  diagnostic.status === 'breach'
                    ? 'border-red-200 dark:border-red-900'
                    : diagnostic.status === 'warning'
                    ? 'border-amber-200 dark:border-amber-900'
                    : ''
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(diagnostic.status)}
                      <div>
                        <div className="font-medium">{diagnostic.metric}</div>
                        <div className="text-sm text-muted-foreground">
                          {diagnostic.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {diagnostic.impact}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(diagnostic.status)}
                      <div className="mt-2">
                        <span className="text-lg font-semibold font-mono">
                          {diagnostic.currentValue}%
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          / {diagnostic.threshold}%
                        </span>
                      </div>
                      <Progress
                        value={(diagnostic.currentValue / diagnostic.threshold) * 100}
                        className={`h-1.5 mt-1 w-24 ${
                          diagnostic.status === 'breach'
                            ? '[&>div]:bg-red-600'
                            : diagnostic.status === 'warning'
                            ? '[&>div]:bg-amber-600'
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Concentration Tab */}
        <TabsContent value="concentration" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sector Concentration (Post-Integration)</CardTitle>
              <CardDescription>
                Portfolio distribution by sector with baseline limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectorConcentrations.map((sector, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sector.sector}</span>
                      {getStatusIcon(sector.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{sector.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        / {sector.limit}% limit
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={sector.percentage}
                      className={`h-2 ${
                        sector.status === 'breach'
                          ? '[&>div]:bg-red-600'
                          : sector.status === 'warning'
                          ? '[&>div]:bg-amber-600'
                          : ''
                      }`}
                    />
                    {/* Limit marker */}
                    <div
                      className="absolute top-0 h-2 w-0.5 bg-muted-foreground/50"
                      style={{ left: `${sector.limit}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
