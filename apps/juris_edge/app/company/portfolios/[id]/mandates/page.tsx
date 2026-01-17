'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Target,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNavigation } from '@/contexts/NavigationContext';

// =============================================================================
// Types
// =============================================================================

interface MandateDefinition {
  id: string;
  name: string;
  type: 'PRIMARY' | 'THEMATIC' | 'CARVEOUT';
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  priority: number;
  description?: string;
  objective?: {
    primary: string;
    secondary?: string[];
  };
  scope?: {
    geography?: { regions?: string[] };
    domains?: { included?: string[] };
    stages?: { included?: string[] };
  };
}

interface BaselineInfo {
  id: string;
  versionNumber: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  publishedAt: string | null;
}

interface PortfolioMandatesData {
  hasActiveBaseline: boolean;
  activeBaseline: BaselineInfo | null;
  draftBaseline: BaselineInfo | null;
  pendingBaseline: BaselineInfo | null;
  mandates: MandateDefinition[];
}

// =============================================================================
// Component
// =============================================================================

export default function PortfolioMandatesPage() {
  const params = useParams();
  const router = useRouter();
  const {
    selectedPortfolio,
    navigateToPortfolio,
    portfolios,
    getPortfolioLabel,
    getMandateLabel,
    isAdmin,
  } = useNavigation();

  const portfolioId = params.id as string;
  const portfolioLabelSingular = getPortfolioLabel(false);
  const mandateLabelSingular = getMandateLabel(false);
  const mandateLabelPlural = getMandateLabel(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioMandatesData | null>(null);

  const isAdminUser = isAdmin();

  // Fetch mandates from active baseline
  const fetchMandates = useCallback(async () => {
    try {
      // Fetch baseline versions
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline`);
      const baselineData = await response.json();

      if (!response.ok) {
        setError(baselineData.error || 'Failed to fetch baseline data');
        return;
      }

      // Find active, draft, and pending baselines
      const versions = baselineData.versions || [];
      const activeBaseline = versions.find(
        (v: BaselineInfo) => v.status === 'PUBLISHED' && baselineData.activeBaselineVersionId === v.id
      );
      const draftBaseline = versions.find((v: BaselineInfo) => v.status === 'DRAFT');
      const pendingBaseline = versions.find((v: BaselineInfo) => v.status === 'PENDING_APPROVAL');

      // If there's an active baseline, fetch the mandates module
      let mandates: MandateDefinition[] = [];
      if (activeBaseline) {
        const moduleResponse = await fetch(
          `/api/portfolios/${portfolioId}/baseline/${activeBaseline.id}`
        );
        const moduleData = await moduleResponse.json();

        if (moduleResponse.ok && moduleData.baselineVersion?.modules) {
          const mandatesModule = moduleData.baselineVersion.modules.find(
            (m: { moduleType: string }) => m.moduleType === 'MANDATES'
          );
          if (mandatesModule?.payload?.mandates) {
            mandates = mandatesModule.payload.mandates;
          }
        }
      }

      setData({
        hasActiveBaseline: !!activeBaseline,
        activeBaseline,
        draftBaseline,
        pendingBaseline,
        mandates,
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch mandates');
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId]);

  // Set up navigation context and fetch data
  useEffect(() => {
    if (!portfolioId) {
      router.push('/company/portfolios');
      return;
    }

    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (portfolio) {
      navigateToPortfolio(portfolio);
      fetchMandates();
    } else if (portfolios.length > 0) {
      router.push('/company/portfolios');
    }
  }, [portfolioId, portfolios, navigateToPortfolio, router, fetchMandates]);

  // Get mandate status badge
  const getMandateStatusBadge = (status: MandateDefinition['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Draft</Badge>;
      case 'RETIRED':
        return <Badge variant="outline" className="text-muted-foreground">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get mandate type badge
  const getMandateTypeBadge = (type: MandateDefinition['type']) => {
    switch (type) {
      case 'PRIMARY':
        return <Badge variant="secondary">Primary</Badge>;
      case 'THEMATIC':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">Thematic</Badge>;
      case 'CARVEOUT':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">Carveout</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedPortfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{portfolioLabelSingular} not found</p>
      </div>
    );
  }

  // No active baseline - show gate
  if (!data?.hasActiveBaseline) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{mandateLabelPlural}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mandateLabelPlural} for {selectedPortfolio.name}
            </p>
          </div>
        </div>

        {/* Baseline Required Gate */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-amber-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Baseline Required</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {mandateLabelPlural} are defined in the portfolio baseline (constitution).
              You must create and publish a baseline before {mandateLabelPlural.toLowerCase()} can be used.
            </p>

            {/* Show current baseline status */}
            {data?.pendingBaseline && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-4 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span>
                  Baseline v{data.pendingBaseline.versionNumber} is pending approval.
                  Once approved, {mandateLabelPlural.toLowerCase()} will become available.
                </span>
              </div>
            )}

            {data?.draftBaseline && !data?.pendingBaseline && (
              <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-950/30 rounded-lg mb-4 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>
                  A draft baseline (v{data.draftBaseline.versionNumber}) exists.
                  Submit it for approval to activate {mandateLabelPlural.toLowerCase()}.
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {data?.draftBaseline ? (
                <Link href={`/company/portfolios/${portfolioId}/baseline/${data.draftBaseline.id}`}>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Continue Editing Baseline
                  </Button>
                </Link>
              ) : data?.pendingBaseline ? (
                <Link href={`/company/portfolios/${portfolioId}/baseline/${data.pendingBaseline.id}`}>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Pending Baseline
                  </Button>
                </Link>
              ) : isAdminUser ? (
                <Link href={`/company/portfolios/${portfolioId}/baseline`}>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Baseline
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Contact an administrator to create a baseline.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has active baseline - show mandates
  const activeMandates = data.mandates.filter((m) => m.status === 'ACTIVE');
  const draftMandates = data.mandates.filter((m) => m.status === 'DRAFT');
  const retiredMandates = data.mandates.filter((m) => m.status === 'RETIRED');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{mandateLabelPlural}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mandateLabelPlural} for {selectedPortfolio.name}
          </p>
        </div>
        <Link href={`/company/portfolios/${portfolioId}/baseline`}>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Edit in Baseline
          </Button>
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Active Baseline Info */}
      {data.activeBaseline && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>
            Showing {mandateLabelPlural.toLowerCase()} from Baseline v{data.activeBaseline.versionNumber}
            {data.activeBaseline.publishedAt && (
              <> (published {new Date(data.activeBaseline.publishedAt).toLocaleDateString()})</>
            )}
          </span>
        </div>
      )}

      {/* No Mandates State */}
      {data.mandates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No {mandateLabelPlural} Defined</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              The active baseline does not contain any {mandateLabelPlural.toLowerCase()}.
              {isAdminUser && ' Edit the baseline to add mandates.'}
            </p>
            {isAdminUser && (
              <Link href={`/company/portfolios/${portfolioId}/baseline`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Baseline
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Mandates */}
      {activeMandates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Active {mandateLabelPlural}
            </CardTitle>
            <CardDescription>
              Currently active {mandateLabelPlural.toLowerCase()} defining investment criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeMandates.map((mandate) => (
                <div
                  key={mandate.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mandate.name}</span>
                      {getMandateTypeBadge(mandate.type)}
                      {getMandateStatusBadge(mandate.status)}
                    </div>
                    {mandate.description && (
                      <p className="text-sm text-muted-foreground">{mandate.description}</p>
                    )}
                    {mandate.objective?.primary && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Objective:</strong> {mandate.objective.primary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {mandate.scope?.geography?.regions?.map((region) => (
                        <Badge key={region} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                      {mandate.scope?.domains?.included?.map((domain) => (
                        <Badge key={domain} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Priority: {mandate.priority}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Mandates */}
      {draftMandates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" />
              Draft {mandateLabelPlural}
            </CardTitle>
            <CardDescription>
              {mandateLabelPlural} not yet activated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draftMandates.map((mandate) => (
                <div
                  key={mandate.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card opacity-70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mandate.name}</span>
                      {getMandateTypeBadge(mandate.type)}
                      {getMandateStatusBadge(mandate.status)}
                    </div>
                    {mandate.description && (
                      <p className="text-sm text-muted-foreground">{mandate.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retired Mandates */}
      {retiredMandates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Retired {mandateLabelPlural}
            </CardTitle>
            <CardDescription>
              Previously active {mandateLabelPlural.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {retiredMandates.map((mandate) => (
                <div
                  key={mandate.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card opacity-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mandate.name}</span>
                      {getMandateTypeBadge(mandate.type)}
                      {getMandateStatusBadge(mandate.status)}
                    </div>
                    {mandate.description && (
                      <p className="text-sm text-muted-foreground">{mandate.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground mb-1">About {mandateLabelPlural}</p>
              <p>
                {mandateLabelPlural} define the investment criteria, sector focus, geographic scope,
                and evaluation rules for this {portfolioLabelSingular.toLowerCase()}.
                They are configured in the baseline (constitution) and become active
                once the baseline is approved and published.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
