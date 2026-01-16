'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  Settings,
  Archive,
  Trash2,
  DollarSign,
  Target,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import type { PortfolioType, PortfolioStatus, IndustryProfile } from '@/types/domain';

interface PortfolioDisplay {
  id: string;
  name: string;
  description: string;
  type: PortfolioType;
  status: PortfolioStatus;
  industryProfile: IndustryProfile;
  industryLabel: string;
  totalValue: number;
  totalCommitted: number;
  positionCount: number;
  utilizationPct: number;
  riskScore: number;
  performanceIndex: number;
  breachCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
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

function getIndustryBadge(profile: IndustryProfile) {
  const config = {
    vc: { label: 'VC', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    pharma: { label: 'Pharma', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    insurance: { label: 'Insurance', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  };
  return config[profile];
}

function getRiskColor(score: number) {
  if (score < 40) return 'text-green-600';
  if (score < 60) return 'text-amber-600';
  return 'text-red-600';
}

type FilterStatus = 'all' | PortfolioStatus;

export default function PortfoliosPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [portfolios, setPortfolios] = useState<PortfolioDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolios from API
  useEffect(() => {
    async function fetchPortfolios() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!user?.companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/portfolios?companyId=${user.companyId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to fetch portfolios');
          setIsLoading(false);
          return;
        }

        // Transform API response to display format
        const transformed: PortfolioDisplay[] = result.portfolios.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          type: p.type as PortfolioType,
          status: p.status as PortfolioStatus,
          industryProfile: 'vc' as IndustryProfile, // Default to VC for now
          industryLabel: p.industryLabel || 'Fund',
          totalValue: p.composition?.totalValue || 0,
          totalCommitted: p.composition?.totalCommitted || 0,
          positionCount: p.composition?.positions?.length || 0,
          utilizationPct: (p.metrics?.utilization || 0) * 100,
          riskScore: (p.metrics?.riskScore || 0.3) * 100,
          performanceIndex: p.metrics?.performanceIndex || 1,
          breachCount: 0,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));

        setPortfolios(transformed);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching portfolios:', err);
        setError('Failed to load portfolios');
        setIsLoading(false);
      }
    }

    fetchPortfolios();
  }, [user?.companyId, authLoading]);

  const filteredPortfolios = portfolios.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePortfolioClick = (portfolio: PortfolioDisplay) => {
    router.push(`/portfolios/${portfolio.id}`);
  };

  const stats = {
    totalAum: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
    activePortfolios: portfolios.filter((p) => p.status === 'active').length,
    totalPositions: portfolios.reduce((sum, p) => sum + p.positionCount, 0),
    withBreaches: portfolios.filter((p) => p.breachCount > 0).length,
    avgPerformance: portfolios.length > 0
      ? portfolios.reduce((sum, p) => sum + p.performanceIndex, 0) / portfolios.length
      : 0,
  };

  // Loading state (including auth loading)
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Funds</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage investment funds and portfolios
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/portfolios/new')}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Fund
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total AUM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.totalAum)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Active Portfolios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.activePortfolios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.totalPositions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold flex items-center gap-2">
              {stats.avgPerformance.toFixed(2)}x
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              With Breaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.withBreaches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search portfolios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('frozen')}>
              Frozen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
              Closed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Portfolios Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Portfolio</TableHead>
              <TableHead className="text-xs w-24">Industry</TableHead>
              <TableHead className="text-xs w-28">Value</TableHead>
              <TableHead className="text-xs w-24">Utilization</TableHead>
              <TableHead className="text-xs w-24">Risk</TableHead>
              <TableHead className="text-xs w-28">Performance</TableHead>
              <TableHead className="text-xs w-24">Status</TableHead>
              <TableHead className="text-xs w-10 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPortfolios.map((portfolio) => {
              const industryConfig = getIndustryBadge(portfolio.industryProfile);

              return (
                <TableRow
                  key={portfolio.id}
                  onClick={() => handlePortfolioClick(portfolio)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <PieChart className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {portfolio.name}
                          {portfolio.breachCount > 0 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {portfolio.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${industryConfig.className}`}>
                      {industryConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{formatCurrency(portfolio.totalValue)}</div>
                    <div className="text-xs text-muted-foreground">
                      of {formatCurrency(portfolio.totalCommitted)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(portfolio.utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {portfolio.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`text-sm font-medium ${getRiskColor(portfolio.riskScore)}`}>
                      {portfolio.riskScore}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{portfolio.performanceIndex.toFixed(2)}x</span>
                      {portfolio.performanceIndex >= 1 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(portfolio.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/portfolios/${portfolio.id}/settings`);
                        }}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Archive className="h-4 w-4 mr-2" />
                          {portfolio.status === 'active' ? 'Freeze' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredPortfolios.length === 0 && (
          <div className="py-12 text-center">
            <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No funds found' : 'No funds yet'}
            </p>
            {searchQuery ? (
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => router.push('/portfolios/new')}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create your first fund
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
