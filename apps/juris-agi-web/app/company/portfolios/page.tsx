'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Eye,
  Settings,
  Archive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigation } from '@/contexts/NavigationContext';
import type { PortfolioStatus } from '@/types/domain';

function getStatusBadge(status: PortfolioStatus) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'paused':
      return <Badge className="bg-amber-600">Paused</Badge>;
    case 'archived':
      return <Badge variant="secondary">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(value: number) {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

export default function PortfoliosPage() {
  const router = useRouter();
  const {
    portfolios,
    isAdmin,
    hasPortfolioAccess,
    getPortfolioAccessLevel,
    getPortfolioLabel,
    navigateToCompany,
  } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Clear selected portfolio when viewing the list
  useEffect(() => {
    navigateToCompany();
  }, [navigateToCompany]);

  // Get industry-specific labels
  const portfolioLabelSingular = getPortfolioLabel(false);
  const portfolioLabelPlural = getPortfolioLabel(true);

  const accessiblePortfolios = portfolios.filter((p) => hasPortfolioAccess(p.id));

  const filteredPortfolios = accessiblePortfolios.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = accessiblePortfolios.reduce(
    (sum, p) => sum + p.composition.totalValue,
    0
  );
  const totalCommitted = accessiblePortfolios.reduce(
    (sum, p) => sum + p.composition.totalCommitted,
    0
  );
  const avgUtilization =
    accessiblePortfolios.reduce((sum, p) => sum + p.metrics.utilization, 0) /
    (accessiblePortfolios.length || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{portfolioLabelPlural}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your {portfolioLabelPlural.toLowerCase()}
          </p>
        </div>
        {isAdmin() && (
          <Button onClick={() => router.push('/company/portfolios/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New {portfolioLabelSingular}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Total {portfolioLabelPlural}</span>
            </div>
            <div className="text-2xl font-semibold">{accessiblePortfolios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Total Value</span>
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Total Committed</span>
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(totalCommitted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg Utilization</span>
            </div>
            <div className="text-2xl font-semibold">{Math.round(avgUtilization * 100)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${portfolioLabelPlural.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Portfolios Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPortfolios.map((portfolio) => {
          const accessLevel = getPortfolioAccessLevel(portfolio.id);
          const utilizationPct = Math.round(portfolio.metrics.utilization * 100);
          // User can enter if they have an access level (maker/checker) or are admin
          const canEnter = accessLevel !== null;

          return (
            <Card
              key={portfolio.id}
              className={
                canEnter
                  ? 'cursor-pointer hover:border-primary/50 transition-colors'
                  : 'bg-muted/30 opacity-75 cursor-default'
              }
              onClick={canEnter ? () => router.push(`/company/portfolios/${portfolio.id}`) : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${canEnter ? 'bg-primary/10' : 'bg-muted'}`}>
                      <BarChart3 className={`h-5 w-5 ${canEnter ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-base ${!canEnter ? 'text-muted-foreground' : ''}`}>{portfolio.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{portfolio.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(portfolio.status)}
                    {canEnter && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {isAdmin() && (
                            <>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Access Level */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Your access:</span>
                    {accessLevel === 'checker' ? (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Checker
                      </Badge>
                    ) : accessLevel === 'maker' ? (
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                        Maker
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-gray-400 text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        View Only
                      </Badge>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className={`text-lg font-semibold ${!canEnter ? 'text-muted-foreground' : ''}`}>
                        {formatCurrency(portfolio.composition.totalValue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Deployed</div>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${!canEnter ? 'text-muted-foreground' : ''}`}>
                        {formatCurrency(portfolio.composition.totalCommitted)}
                      </div>
                      <div className="text-xs text-muted-foreground">Committed</div>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${!canEnter ? 'text-muted-foreground' : ''}`}>
                        {portfolio.composition.positions.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Positions</div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">{utilizationPct}%</span>
                    </div>
                    <Progress value={utilizationPct} className="h-1.5" />
                  </div>

                  {/* Risk indicators */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {portfolio.metrics.riskScore < 0.5 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        Risk Score: {Math.round(portfolio.metrics.riskScore * 100)}
                      </span>
                    </div>
                    {canEnter ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Enter {portfolioLabelSingular}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Contact admin for access
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPortfolios.length === 0 && (
        <div className="py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `No ${portfolioLabelPlural.toLowerCase()} found`
              : `No ${portfolioLabelPlural.toLowerCase()} available`}
          </p>
          {isAdmin() && !searchQuery && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/company/portfolios/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First {portfolioLabelSingular}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
