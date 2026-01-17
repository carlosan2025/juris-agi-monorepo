'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PortfolioStatus, IndustryProfile } from '@/types/domain';

interface PortfolioDetail {
  id: string;
  name: string;
  description: string;
  type: 'fund' | 'pipeline' | 'book';
  status: PortfolioStatus;
  industryProfile: IndustryProfile;
  industryLabel: string;
  totalValue: number;
  totalCommitted: number;
  utilizationPct: number;
  riskScore: number;
  performanceIndex: number;
  constraints: {
    maxPositions: number;
    maxSinglePositionPct: number;
    maxSectorConcentrationPct: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioPosition {
  id: string;
  caseId: string;
  caseName: string;
  value: number;
  percentage: number;
  sector: string;
  status: 'active' | 'exited' | 'written_off';
  addedAt: Date;
}

interface PortfolioBreach {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  status: 'open' | 'resolved' | 'acknowledged';
}

interface DiagnosticResult {
  metric: string;
  value: number;
  threshold: number;
  status: 'ok' | 'warning' | 'breach';
}

// Mock data
const MOCK_PORTFOLIO: PortfolioDetail = {
  id: 'portfolio-1',
  name: 'Fund III',
  description: 'Main Series A/B investment vehicle with focus on enterprise SaaS',
  type: 'fund',
  status: 'active',
  industryProfile: 'vc',
  industryLabel: 'Venture Fund',
  totalValue: 245000000,
  totalCommitted: 300000000,
  utilizationPct: 81.7,
  riskScore: 42,
  performanceIndex: 1.34,
  constraints: {
    maxPositions: 25,
    maxSinglePositionPct: 15,
    maxSectorConcentrationPct: 40,
  },
  createdAt: new Date('2022-01-15'),
  updatedAt: new Date('2024-03-14'),
};

const MOCK_POSITIONS: PortfolioPosition[] = [
  { id: 'pos-1', caseId: 'case-1', caseName: 'TechCorp Inc.', value: 35000000, percentage: 14.3, sector: 'Enterprise SaaS', status: 'active', addedAt: new Date('2022-06-15') },
  { id: 'pos-2', caseId: 'case-2', caseName: 'DataFlow Systems', value: 28000000, percentage: 11.4, sector: 'Data Infrastructure', status: 'active', addedAt: new Date('2022-09-01') },
  { id: 'pos-3', caseId: 'case-3', caseName: 'CloudSecure AI', value: 25000000, percentage: 10.2, sector: 'Cybersecurity', status: 'active', addedAt: new Date('2023-01-10') },
  { id: 'pos-4', caseId: 'case-4', caseName: 'FinanceBot', value: 22000000, percentage: 9.0, sector: 'Fintech', status: 'active', addedAt: new Date('2023-03-20') },
  { id: 'pos-5', caseId: 'case-5', caseName: 'HealthData Pro', value: 20000000, percentage: 8.2, sector: 'Healthcare', status: 'active', addedAt: new Date('2023-06-01') },
  { id: 'pos-6', caseId: 'case-6', caseName: 'RetailAI', value: 18000000, percentage: 7.3, sector: 'Retail Tech', status: 'exited', addedAt: new Date('2022-04-15') },
];

const MOCK_BREACHES: PortfolioBreach[] = [];

const MOCK_DIAGNOSTICS: DiagnosticResult[] = [
  { metric: 'Single Position Concentration', value: 14.3, threshold: 15, status: 'warning' },
  { metric: 'Sector Concentration (Enterprise SaaS)', value: 32.5, threshold: 40, status: 'ok' },
  { metric: 'Portfolio Utilization', value: 81.7, threshold: 90, status: 'ok' },
  { metric: 'Active Position Count', value: 18, threshold: 25, status: 'ok' },
  { metric: 'Risk Score', value: 42, threshold: 60, status: 'ok' },
];

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function getStatusBadge(status: PortfolioStatus) {
  switch (status) {
    case 'active':
      return <Badge>Active</Badge>;
    case 'frozen':
      return <Badge variant="secondary">Frozen</Badge>;
    case 'closed':
      return <Badge variant="outline">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getDiagnosticStatusIcon(status: 'ok' | 'warning' | 'breach') {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'breach':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
  }
}

function getRiskColor(score: number) {
  if (score < 40) return 'text-green-600';
  if (score < 60) return 'text-amber-600';
  return 'text-red-600';
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [portfolio] = useState<PortfolioDetail>(MOCK_PORTFOLIO);
  const [positions] = useState<PortfolioPosition[]>(MOCK_POSITIONS);
  const [breaches] = useState<PortfolioBreach[]>(MOCK_BREACHES);
  const [diagnostics] = useState<DiagnosticResult[]>(MOCK_DIAGNOSTICS);

  const activePositions = positions.filter(p => p.status === 'active');
  const sectorBreakdown = positions.reduce((acc, p) => {
    if (p.status === 'active') {
      acc[p.sector] = (acc[p.sector] || 0) + p.percentage;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/portfolios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{portfolio.name}</h1>
            {getStatusBadge(portfolio.status)}
            {breaches.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {breaches.length} Breach{breaches.length > 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{portfolio.description}</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1.5" />
          Settings
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(portfolio.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(portfolio.totalCommitted)} committed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{portfolio.utilizationPct.toFixed(1)}%</div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(portfolio.utilizationPct, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activePositions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {portfolio.constraints.maxPositions} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold flex items-center gap-2">
              {portfolio.performanceIndex.toFixed(2)}x
              {portfolio.performanceIndex >= 1 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${getRiskColor(portfolio.riskScore)}`}>
              {portfolio.riskScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolio.riskScore < 40 ? 'Low' : portfolio.riskScore < 60 ? 'Medium' : 'High'} risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions ({activePositions.length})</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="breaches">
            Breaches {breaches.length > 0 && `(${breaches.length})`}
          </TabsTrigger>
          <TabsTrigger value="concentration">Concentration</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Portfolio Positions</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Position
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Company</TableHead>
                    <TableHead className="text-xs w-28">Value</TableHead>
                    <TableHead className="text-xs w-24">Weight</TableHead>
                    <TableHead className="text-xs w-32">Sector</TableHead>
                    <TableHead className="text-xs w-24">Status</TableHead>
                    <TableHead className="text-xs w-28">Added</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow
                      key={position.id}
                      onClick={() => router.push(`/cases/${position.caseId}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{position.caseName}</TableCell>
                      <TableCell>{formatCurrency(position.value)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(position.percentage / portfolio.constraints.maxSinglePositionPct) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{position.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{position.sector}</TableCell>
                      <TableCell>
                        <Badge
                          variant={position.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs capitalize"
                        >
                          {position.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {position.addedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio Diagnostics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Metric</TableHead>
                    <TableHead className="text-xs w-28">Current Value</TableHead>
                    <TableHead className="text-xs w-28">Threshold</TableHead>
                    <TableHead className="text-xs w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnostics.map((diagnostic, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{diagnostic.metric}</TableCell>
                      <TableCell>
                        {typeof diagnostic.value === 'number' && diagnostic.metric.includes('%')
                          ? `${diagnostic.value.toFixed(1)}%`
                          : diagnostic.value}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {typeof diagnostic.threshold === 'number' && diagnostic.metric.includes('%')
                          ? `${diagnostic.threshold}%`
                          : diagnostic.threshold}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDiagnosticStatusIcon(diagnostic.status)}
                          <span className="text-xs capitalize">{diagnostic.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Breaches</CardTitle>
            </CardHeader>
            <CardContent>
              {breaches.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active breaches</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All portfolio constraints are within acceptable limits
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Breach Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs w-24">Severity</TableHead>
                      <TableHead className="text-xs w-28">Detected</TableHead>
                      <TableHead className="text-xs w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breaches.map((breach) => (
                      <TableRow key={breach.id}>
                        <TableCell className="font-medium">{breach.type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{breach.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant={breach.severity === 'high' ? 'destructive' : breach.severity === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs capitalize"
                          >
                            {breach.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(breach.detectedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {breach.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concentration">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sector Concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sectorBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([sector, percentage]) => (
                    <div key={sector} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sector}</span>
                        <span className={percentage > portfolio.constraints.maxSectorConcentrationPct ? 'text-red-600' : 'text-muted-foreground'}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage > portfolio.constraints.maxSectorConcentrationPct
                              ? 'bg-red-600'
                              : percentage > portfolio.constraints.maxSectorConcentrationPct * 0.8
                              ? 'bg-amber-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${(percentage / portfolio.constraints.maxSectorConcentrationPct) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Max sector concentration limit: {portfolio.constraints.maxSectorConcentrationPct}%
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
