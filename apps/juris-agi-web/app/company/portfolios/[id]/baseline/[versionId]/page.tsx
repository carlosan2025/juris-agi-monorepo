'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Send,
  Eye,
  ChevronRight,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  ThumbsDown,
  XCircle,
  Lightbulb,
  Sparkles,
  Target,
  Layers,
  Scissors,
  Info,
  Copy,
  BookOpen,
  ClipboardList,
  Ban,
  BarChart3,
  Scale,
  FileText,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigation } from '@/contexts/NavigationContext';
import { ALL_MODULE_TYPES, INDUSTRY_CONFIGS, getDefaultPayload } from '@/lib/baseline/types';
import type {
  PortfolioBaselineModuleType,
  MandatesModulePayload,
  MandateDefinition,
  ExclusionsModulePayload,
  RiskAppetiteModulePayload,
  GovernanceThresholdsModulePayload,
  ReportingObligationsModulePayload,
  EvidenceAdmissibilityModulePayload,
  MandateType,
} from '@/lib/baseline/types';
import {
  MANDATE_TYPE_INFO,
  type MandateTemplate,
} from '@/lib/baseline/mandate-templates';
import { useMandateTemplates } from '@/hooks/useMandateTemplates';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// =============================================================================
// Types
// =============================================================================

interface BaselineModule {
  id: string;
  moduleType: PortfolioBaselineModuleType;
  schemaVersion: number;
  payload: unknown;
  isComplete: boolean;
  isValid: boolean;
  validationErrors: unknown[] | null;
  createdAt: string;
  updatedAt: string;
}

interface BaselineVersion {
  id: string;
  portfolioId: string;
  portfolioName: string;
  versionNumber: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  schemaVersion: number;
  parentVersionId: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  // Submission tracking
  submittedAt: string | null;
  submittedBy: { id: string; name: string; email: string } | null;
  // Approval tracking
  approvedAt: string | null;
  approvedBy: { id: string; name: string; email: string } | null;
  // Rejection tracking
  rejectedAt: string | null;
  rejectedBy: { id: string; name: string; email: string } | null;
  rejectionReason: string | null;
  // Publishing
  publishedAt: string | null;
  publishedBy: { id: string; name: string; email: string } | null;
  changeSummary: string | null;
  isActive: boolean;
  // Permissions
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  modules: BaselineModule[];
}

interface PublishCheckResult {
  canPublish: boolean;
  blockers: string[];
  willArchiveExisting: boolean;
  currentActiveBaselineId: string | null;
  modulesSummary: {
    moduleType: string;
    isComplete: boolean;
    isValid: boolean;
    hasErrors: boolean;
  }[];
}

// Module display configuration
const MODULE_CONFIG: Record<PortfolioBaselineModuleType, { name: string; description: string; Icon: LucideIcon }> = {
  MANDATES: {
    name: 'Mandates',
    description: 'Define investment mandates with objectives, constraints, and scope',
    Icon: ClipboardList,
  },
  EXCLUSIONS: {
    name: 'Exclusions',
    description: 'Set hard and conditional exclusion rules',
    Icon: Ban,
  },
  RISK_APPETITE: {
    name: 'Risk Appetite',
    description: 'Configure risk dimensions and portfolio constraints',
    Icon: BarChart3,
  },
  GOVERNANCE_THRESHOLDS: {
    name: 'Governance',
    description: 'Define approval tiers and conflict policies',
    Icon: Scale,
  },
  REPORTING_OBLIGATIONS: {
    name: 'Reporting',
    description: 'Set up report packs and delivery schedules',
    Icon: FileText,
  },
  EVIDENCE_ADMISSIBILITY: {
    name: 'Evidence',
    description: 'Configure evidence types and confidence rules',
    Icon: Search,
  },
};

// =============================================================================
// Component
// =============================================================================

export default function BaselineEditorPage() {
  const params = useParams();
  const router = useRouter();
  const {
    selectedPortfolio,
    navigateToPortfolio,
    portfolios,
    getPortfolioLabel,
    getMandateLabel,
    isAdmin,
    company,
  } = useNavigation();

  const portfolioId = params.id as string;
  const versionId = params.versionId as string;
  const portfolioLabelSingular = getPortfolioLabel(false);
  const mandateLabelSingular = getMandateLabel(false);
  const mandateLabelPlural = getMandateLabel(true);

  // Get industry config
  const industryConfig = company?.industryProfile
    ? INDUSTRY_CONFIGS[company.industryProfile.toUpperCase()] || INDUSTRY_CONFIGS.GENERIC
    : INDUSTRY_CONFIGS.GENERIC;

  const [isLoading, setIsLoading] = useState(true);
  const [baselineVersion, setBaselineVersion] = useState<BaselineVersion | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioBaselineModuleType>('MANDATES');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Publish dialog state (now used for submit for approval)
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishCheck, setPublishCheck] = useState<PublishCheckResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  // Approval workflow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Module payloads (editable state)
  const [modulePayloads, setModulePayloads] = useState<Record<string, unknown>>({});

  const isAdminUser = isAdmin();
  const canEdit = Boolean(baselineVersion?.canEdit && isAdminUser);
  const canSubmit = baselineVersion?.canSubmit;
  const canApprove = baselineVersion?.canApprove && isAdminUser;
  const canReject = baselineVersion?.canReject && isAdminUser;

  // Fetch baseline version
  const fetchBaselineVersion = useCallback(async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline/${versionId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch baseline version');
        return;
      }

      setBaselineVersion(data.baselineVersion);

      // Initialize module payloads from fetched data
      const payloads: Record<string, unknown> = {};
      for (const module of data.baselineVersion.modules) {
        payloads[module.moduleType] = module.payload;
      }
      setModulePayloads(payloads);
      setError(null);
    } catch (err) {
      setError('Failed to fetch baseline version');
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, versionId]);

  // Set up navigation context and fetch data
  useEffect(() => {
    if (!portfolioId || !versionId) {
      router.push('/company/portfolios');
      return;
    }

    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (portfolio) {
      navigateToPortfolio(portfolio);
      fetchBaselineVersion();
    } else if (portfolios.length > 0) {
      router.push('/company/portfolios');
    }
  }, [portfolioId, versionId, portfolios, navigateToPortfolio, router, fetchBaselineVersion]);

  // Save module changes
  const handleSaveModule = async (moduleType: PortfolioBaselineModuleType) => {
    if (!canEdit) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload = modulePayloads[moduleType];
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/modules/${moduleType}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save module');
        return;
      }

      // Update the module in the baseline version state
      if (baselineVersion) {
        const updatedModules = baselineVersion.modules.map((m) =>
          m.moduleType === moduleType
            ? {
                ...m,
                payload: data.module.payload,
                isComplete: data.module.isComplete,
                isValid: data.module.isValid,
                validationErrors: data.module.validationErrors,
                updatedAt: data.module.updatedAt,
              }
            : m
        );
        setBaselineVersion({ ...baselineVersion, modules: updatedModules });
      }

      setHasUnsavedChanges(false);
    } catch (err) {
      setError('Failed to save module');
    } finally {
      setIsSaving(false);
    }
  };

  // Update module payload
  const updateModulePayload = (moduleType: PortfolioBaselineModuleType, payload: unknown) => {
    setModulePayloads((prev) => ({ ...prev, [moduleType]: payload }));
    setHasUnsavedChanges(true);
  };

  // Check if baseline can be published
  const handlePublishCheck = async () => {
    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/publish`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check publish status');
        return;
      }

      setPublishCheck(data);
      setShowPublishDialog(true);
    } catch (err) {
      setError('Failed to check publish status');
    }
  };

  // Publish baseline
  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmArchivePrevious: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to publish baseline');
        setIsPublishing(false);
        return;
      }

      // Update change summary if provided
      if (changeSummary.trim()) {
        await fetch(`/api/portfolios/${portfolioId}/baseline/${versionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changeSummary: changeSummary.trim() }),
        });
      }

      setShowPublishDialog(false);
      // Refresh the page to show updated status
      router.refresh();
      fetchBaselineVersion();
    } catch (err) {
      setError('Failed to publish baseline');
    } finally {
      setIsPublishing(false);
    }
  };

  // Submit baseline for approval
  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changeSummary: changeSummary.trim() || undefined }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit baseline for approval');
        if (data.blockers) {
          setError(`${data.error}: ${data.blockers.join(', ')}`);
        }
        setIsSubmitting(false);
        return;
      }

      setShowSubmitDialog(false);
      setChangeSummary('');
      // Refresh to show updated status
      router.refresh();
      fetchBaselineVersion();
    } catch (err) {
      setError('Failed to submit baseline for approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve baseline
  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/approve`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to approve baseline');
        setIsApproving(false);
        return;
      }

      // Refresh to show updated status
      router.refresh();
      fetchBaselineVersion();
    } catch (err) {
      setError('Failed to approve baseline');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject baseline
  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/baseline/${versionId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reject baseline');
        setIsRejecting(false);
        return;
      }

      setShowRejectDialog(false);
      setRejectionReason('');
      // Refresh to show updated status
      router.refresh();
      fetchBaselineVersion();
    } catch (err) {
      setError('Failed to reject baseline');
    } finally {
      setIsRejecting(false);
    }
  };

  // Get module status for tab
  const getModuleStatus = (moduleType: PortfolioBaselineModuleType) => {
    const module = baselineVersion?.modules.find((m) => m.moduleType === moduleType);
    if (!module) return { isComplete: false, isValid: true };
    return { isComplete: module.isComplete, isValid: module.isValid };
  };

  // Get status badge variant
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive && status === 'PUBLISHED') {
      return <Badge className="bg-green-600">Active</Badge>;
    }

    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Draft</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Pending Approval</Badge>;
      case 'PUBLISHED':
        return <Badge variant="secondary">Published</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedPortfolio || !baselineVersion) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Baseline version not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/company/portfolios/${portfolioId}/baseline`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                Baseline v{baselineVersion.versionNumber}
              </h1>
              {getStatusBadge(baselineVersion.status, baselineVersion.isActive)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {canEdit ? 'Edit governance configuration' : 'View governance configuration'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save button - only for editable statuses */}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => handleSaveModule(activeTab)}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          )}

          {/* Submit for Approval button - for DRAFT or REJECTED */}
          {canEdit && canSubmit && (
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {/* Approve/Reject buttons - for PENDING_APPROVAL */}
          {canApprove && (
            <>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isRejecting}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Rejection Reason Alert */}
      {baselineVersion.status === 'REJECTED' && baselineVersion.rejectionReason && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Baseline Rejected</p>
            <p className="text-sm text-destructive/80 mt-1">
              Rejected by {baselineVersion.rejectedBy?.name || 'Unknown'} on{' '}
              {baselineVersion.rejectedAt
                ? new Date(baselineVersion.rejectedAt).toLocaleDateString()
                : 'Unknown'}
            </p>
            <p className="text-sm mt-2 text-foreground">
              <strong>Reason:</strong> {baselineVersion.rejectionReason}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please address the feedback and resubmit for approval.
            </p>
          </div>
        </div>
      )}

      {/* Pending Approval Notice */}
      {baselineVersion.status === 'PENDING_APPROVAL' && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Pending Approval</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Submitted by {baselineVersion.submittedBy?.name || 'Unknown'} on{' '}
              {baselineVersion.submittedAt
                ? new Date(baselineVersion.submittedAt).toLocaleDateString()
                : 'Unknown'}
            </p>
            {baselineVersion.changeSummary && (
              <p className="text-sm mt-2 text-foreground">
                <strong>Summary:</strong> {baselineVersion.changeSummary}
              </p>
            )}
            {!canApprove && (
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for an administrator to review and approve this baseline.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortfolioBaselineModuleType)}>
        <TabsList className="grid grid-cols-6 w-full">
          {ALL_MODULE_TYPES.map((moduleType) => {
            const config = MODULE_CONFIG[moduleType];
            const status = getModuleStatus(moduleType);
            const IconComponent = config.Icon;
            return (
              <TabsTrigger
                key={moduleType}
                value={moduleType}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{config.name}</span>
                {!status.isValid && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
                {status.isValid && status.isComplete && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Module Content */}
        {ALL_MODULE_TYPES.map((moduleType) => {
          const ModuleIcon = MODULE_CONFIG[moduleType].Icon;
          return (
          <TabsContent key={moduleType} value={moduleType} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ModuleIcon className="h-5 w-5" />
                  {MODULE_CONFIG[moduleType].name}
                </CardTitle>
                <CardDescription>{MODULE_CONFIG[moduleType].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ModuleEditor
                  moduleType={moduleType}
                  payload={modulePayloads[moduleType] || getDefaultPayload(moduleType)}
                  onChange={(payload) => updateModulePayload(moduleType, payload)}
                  canEdit={canEdit}
                  industryConfig={industryConfig}
                  mandateLabel={mandateLabelSingular}
                  mandateLabelPlural={mandateLabelPlural}
                  industryProfile={company?.industryProfile?.toUpperCase() || 'GENERIC'}
                />
              </CardContent>
            </Card>
          </TabsContent>
          );
        })}
      </Tabs>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Baseline v{baselineVersion.versionNumber}</DialogTitle>
            <DialogDescription>
              Review the baseline status before publishing.
            </DialogDescription>
          </DialogHeader>

          {publishCheck && (
            <div className="space-y-4">
              {/* Module Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Module Status</Label>
                <div className="space-y-1">
                  {publishCheck.modulesSummary.map((module) => (
                    <div
                      key={module.moduleType}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{MODULE_CONFIG[module.moduleType as PortfolioBaselineModuleType]?.name}</span>
                      <div className="flex items-center gap-2">
                        {module.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {module.isComplete ? (
                          <Badge variant="secondary" className="text-xs">Complete</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Incomplete</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockers */}
              {publishCheck.blockers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-destructive">Cannot Publish</Label>
                  <ul className="text-sm space-y-1 text-destructive">
                    {publishCheck.blockers.map((blocker, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Archive Warning */}
              {publishCheck.willArchiveExisting && publishCheck.canPublish && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
                  <p className="text-amber-800 dark:text-amber-200">
                    Publishing will archive the current active baseline.
                  </p>
                </div>
              )}

              {/* Change Summary */}
              {publishCheck.canPublish && (
                <div className="space-y-2">
                  <Label htmlFor="changeSummary">Change Summary (Optional)</Label>
                  <Textarea
                    id="changeSummary"
                    placeholder="Describe the changes in this version..."
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!publishCheck?.canPublish || isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit for Approval Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Submit this baseline for review by an administrator. Once approved,
              it will become the active baseline for this portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submitChangeSummary">Change Summary (Optional)</Label>
              <Textarea
                id="submitChangeSummary"
                placeholder="Describe the changes in this version..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This summary will be visible to reviewers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Baseline</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this baseline. The author will
              be able to view this feedback and make corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReasonInput">Rejection Reason</Label>
              <Textarea
                id="rejectionReasonInput"
                placeholder="Explain why this baseline is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ThumbsDown className="h-4 w-4 mr-2" />
              )}
              Reject Baseline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Module Editor Component
// =============================================================================

interface ModuleEditorProps {
  moduleType: PortfolioBaselineModuleType;
  payload: unknown;
  onChange: (payload: unknown) => void;
  canEdit: boolean;
  industryConfig: typeof INDUSTRY_CONFIGS[keyof typeof INDUSTRY_CONFIGS];
  mandateLabel: string;
  mandateLabelPlural: string;
  industryProfile: string;
}

function ModuleEditor({
  moduleType,
  payload,
  onChange,
  canEdit,
  industryConfig,
  mandateLabel,
  mandateLabelPlural,
  industryProfile,
}: ModuleEditorProps) {
  switch (moduleType) {
    case 'MANDATES':
      return (
        <MandatesEditor
          payload={payload as MandatesModulePayload}
          onChange={onChange}
          canEdit={canEdit}
          industryConfig={industryConfig}
          mandateLabel={mandateLabel}
          mandateLabelPlural={mandateLabelPlural}
          industryProfile={industryProfile}
        />
      );
    case 'EXCLUSIONS':
      return (
        <ExclusionsEditor
          payload={payload as ExclusionsModulePayload}
          onChange={onChange}
          canEdit={canEdit}
        />
      );
    case 'RISK_APPETITE':
      return (
        <RiskAppetiteEditor
          payload={payload as RiskAppetiteModulePayload}
          onChange={onChange}
          canEdit={canEdit}
        />
      );
    case 'GOVERNANCE_THRESHOLDS':
      return (
        <GovernanceEditor
          payload={payload as GovernanceThresholdsModulePayload}
          onChange={onChange}
          canEdit={canEdit}
        />
      );
    case 'REPORTING_OBLIGATIONS':
      return (
        <ReportingEditor
          payload={payload as ReportingObligationsModulePayload}
          onChange={onChange}
          canEdit={canEdit}
        />
      );
    case 'EVIDENCE_ADMISSIBILITY':
      return (
        <EvidenceEditor
          payload={payload as EvidenceAdmissibilityModulePayload}
          onChange={onChange}
          canEdit={canEdit}
        />
      );
    default:
      return <div className="text-muted-foreground">Unknown module type</div>;
  }
}

// =============================================================================
// Individual Module Editors
// =============================================================================

// Mandates Editor
interface MandatesEditorProps {
  payload: MandatesModulePayload;
  onChange: (payload: MandatesModulePayload) => void;
  canEdit: boolean;
  industryConfig: typeof INDUSTRY_CONFIGS[keyof typeof INDUSTRY_CONFIGS];
  mandateLabel: string;
  mandateLabelPlural: string;
  industryProfile: string;
}

function MandatesEditor({ payload, onChange, canEdit, industryConfig, mandateLabel, mandateLabelPlural, industryProfile }: MandatesEditorProps) {
  const [editingMandate, setEditingMandate] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showGuidancePanel, setShowGuidancePanel] = useState(true);
  const [selectedTemplateType, setSelectedTemplateType] = useState<MandateType | 'ALL'>('ALL');

  // Fetch templates from API (with fallback to file-based templates)
  // Use filterClientSide to allow fast type switching without refetching
  const {
    templates: filteredTemplates,
    loading: templatesLoading,
    guidance,
    createMandateFromTemplate,
    getRecommendedDefaults,
  } = useMandateTemplates({
    industry: industryProfile,
    type: selectedTemplateType,
    includeCompany: true,
    filterClientSide: true,
  });

  // Get mandate type icon component
  const getMandateTypeIcon = (type: MandateType) => {
    switch (type) {
      case 'PRIMARY': return <Target className="h-4 w-4" />;
      case 'THEMATIC': return <Layers className="h-4 w-4" />;
      case 'CARVEOUT': return <Scissors className="h-4 w-4" />;
    }
  };

  const addMandate = () => {
    const newMandate: MandateDefinition = {
      id: `mandate-${Date.now()}`,
      name: `New ${mandateLabel}`,
      type: 'PRIMARY',
      status: 'DRAFT',
      priority: (payload.mandates?.length || 0) + 1,
      description: '',
      objective: {
        primary: '',
        secondary: [],
      },
      scope: {
        geography: { regions: [] },
        domains: { included: [] },
        stages: { included: [] },
      },
      hardConstraints: [],
    };
    onChange({
      ...payload,
      mandates: [...(payload.mandates || []), newMandate],
    });
    setEditingMandate(newMandate.id);
  };

  const addMandateFromTemplate = (template: MandateTemplate) => {
    const newMandate = createMandateFromTemplate(template);
    newMandate.priority = (payload.mandates?.length || 0) + 1;
    onChange({
      ...payload,
      mandates: [...(payload.mandates || []), newMandate],
    });
    setShowTemplateDialog(false);
    setEditingMandate(newMandate.id);
  };

  const addRecommendedDefaults = () => {
    const defaults = getRecommendedDefaults();
    onChange({
      ...payload,
      mandates: [...(payload.mandates || []), ...defaults],
    });
  };

  const updateMandate = (id: string, updates: Partial<MandateDefinition>) => {
    onChange({
      ...payload,
      mandates: payload.mandates.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const deleteMandate = (id: string) => {
    onChange({
      ...payload,
      mandates: payload.mandates.filter((m) => m.id !== id),
    });
    if (editingMandate === id) setEditingMandate(null);
  };

  // Count mandates by type
  const mandateCountByType = {
    PRIMARY: payload.mandates?.filter(m => m.type === 'PRIMARY').length || 0,
    THEMATIC: payload.mandates?.filter(m => m.type === 'THEMATIC').length || 0,
    CARVEOUT: payload.mandates?.filter(m => m.type === 'CARVEOUT').length || 0,
  };
  const totalMandates = payload.mandates?.length || 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Industry Guidance Panel */}
        <Collapsible open={showGuidancePanel} onOpenChange={setShowGuidancePanel}>
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Industry Guidance</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {totalMandates} / {guidance.recommendedCount.min}-{guidance.recommendedCount.max} recommended
                    </Badge>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showGuidancePanel ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Recommended Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Recommended {mandateLabelPlural}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Typical:</span> {guidance.recommendedCount.typical}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Complex:</span> {guidance.recommendedCount.complex}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Current Distribution</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={MANDATE_TYPE_INFO.PRIMARY.color}>
                        {mandateCountByType.PRIMARY} Primary
                      </Badge>
                      <Badge variant="outline" className={MANDATE_TYPE_INFO.THEMATIC.color}>
                        {mandateCountByType.THEMATIC} Thematic
                      </Badge>
                      <Badge variant="outline" className={MANDATE_TYPE_INFO.CARVEOUT.color}>
                        {mandateCountByType.CARVEOUT} Carveout
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Mandate Type Patterns */}
                <div>
                  <p className="text-sm font-medium mb-2">Common {mandateLabel} Patterns</p>
                  <div className="grid grid-cols-3 gap-2">
                    {guidance.mandatePatterns.map((pattern) => (
                      <div key={pattern.type} className="p-2 bg-background rounded border text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          {getMandateTypeIcon(pattern.type)}
                          <span className="font-medium">{pattern.name}</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{pattern.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Hints */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Field Guidance
                    </p>
                    <div className="space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Geography:</span> {guidance.fieldHints.geography}</p>
                      <p><span className="font-medium text-foreground">Domains:</span> {guidance.fieldHints.domains}</p>
                    </div>
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <p><span className="font-medium text-foreground">Stages:</span> {guidance.fieldHints.stages}</p>
                    <p><span className="font-medium text-foreground">Sizing:</span> {guidance.fieldHints.sizing}</p>
                  </div>
                </div>

                {/* Common Hard Constraints */}
                <div>
                  <p className="text-sm font-medium mb-1">Common Hard Constraints</p>
                  <div className="flex flex-wrap gap-1">
                    {guidance.commonHardConstraints.slice(0, 6).map((constraint, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {constraint}
                      </Badge>
                    ))}
                    {guidance.commonHardConstraints.length > 6 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{guidance.commonHardConstraints.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Action Bar */}
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Add from Template
            </Button>
            <Button variant="outline" onClick={addMandate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Blank {mandateLabel}
            </Button>
            {totalMandates === 0 && (
              <Button onClick={addRecommendedDefaults}>
                <Target className="h-4 w-4 mr-2" />
                Use Recommended Default
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {payload.mandates?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No {mandateLabelPlural} Defined</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {mandateLabelPlural} define the investment or operational strategy for this portfolio.
                Start with the recommended default or add from industry templates.
              </p>
              {canEdit && (
                <div className="flex items-center justify-center gap-2">
                  <Button onClick={addRecommendedDefaults}>
                    <Target className="h-4 w-4 mr-2" />
                    Use Recommended Default
                  </Button>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mandates List */}
        {payload.mandates?.map((mandate) => (
          <Card key={mandate.id} className="border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`p-1.5 rounded ${MANDATE_TYPE_INFO[mandate.type].color}`}>
                        {getMandateTypeIcon(mandate.type)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{MANDATE_TYPE_INFO[mandate.type].label}</p>
                      <p className="text-xs max-w-xs">{MANDATE_TYPE_INFO[mandate.type].description}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div>
                    <CardTitle className="text-base">{mandate.name}</CardTitle>
                    {mandate.objective?.primary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{mandate.objective.primary}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={mandate.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {mandate.status}
                  </Badge>
                  {mandate.priority && (
                    <Badge variant="secondary" className="text-xs">
                      P{mandate.priority}
                    </Badge>
                  )}
                  {canEdit && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMandate(editingMandate === mandate.id ? null : mandate.id)}
                      >
                        {editingMandate === mandate.id ? 'Close' : 'Edit'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMandate(mandate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {mandate.description && editingMandate !== mandate.id && (
                <CardDescription className="mt-2">{mandate.description}</CardDescription>
              )}
            </CardHeader>

            {editingMandate === mandate.id && (
              <CardContent className="space-y-4 border-t pt-4">
                {/* Name & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={mandate.name}
                      onChange={(e) => updateMandate(mandate.id, { name: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Type
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p><strong>Primary:</strong> Core mandate (1 per portfolio)</p>
                          <p><strong>Thematic:</strong> Specialized focus area</p>
                          <p><strong>Carveout:</strong> Separate allocation/governance</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={mandate.type}
                      onValueChange={(v) => updateMandate(mandate.id, { type: v as MandateDefinition['type'] })}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Primary
                          </div>
                        </SelectItem>
                        <SelectItem value="THEMATIC">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Thematic
                          </div>
                        </SelectItem>
                        <SelectItem value="CARVEOUT">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            Carveout
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={mandate.status}
                      onValueChange={(v) => updateMandate(mandate.id, { status: v as MandateDefinition['status'] })}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min={1}
                      value={mandate.priority}
                      onChange={(e) => updateMandate(mandate.id, { priority: parseInt(e.target.value) || 1 })}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={mandate.description || ''}
                    onChange={(e) => updateMandate(mandate.id, { description: e.target.value })}
                    disabled={!canEdit}
                    rows={2}
                  />
                </div>

                {/* Primary Objective */}
                <div className="space-y-2">
                  <Label>Primary Objective</Label>
                  <Textarea
                    value={mandate.objective?.primary || ''}
                    onChange={(e) => updateMandate(mandate.id, {
                      objective: { ...mandate.objective, primary: e.target.value },
                    })}
                    disabled={!canEdit}
                    rows={2}
                    placeholder="Define the primary objective..."
                  />
                </div>

                {/* Geographic Regions */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Geographic Regions
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {guidance.fieldHints.geography}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    value={mandate.scope?.geography?.regions?.join(', ') || ''}
                    onChange={(e) => updateMandate(mandate.id, {
                      scope: {
                        ...mandate.scope,
                        geography: {
                          ...mandate.scope?.geography,
                          regions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      },
                    })}
                    disabled={!canEdit}
                    placeholder="e.g., North America, Europe"
                  />
                </div>

                {/* Domains */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Domains
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {guidance.fieldHints.domains}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {industryConfig.domains.map((domain) => {
                      const isSelected = mandate.scope?.domains?.included?.includes(domain.value);
                      return (
                        <Badge
                          key={domain.value}
                          variant={isSelected ? 'default' : 'outline'}
                          className={canEdit ? 'cursor-pointer hover:bg-primary/80' : ''}
                          onClick={() => {
                            if (!canEdit) return;
                            const current = mandate.scope?.domains?.included || [];
                            const updated = isSelected
                              ? current.filter((d) => d !== domain.value)
                              : [...current, domain.value];
                            updateMandate(mandate.id, {
                              scope: {
                                ...mandate.scope,
                                domains: { ...mandate.scope?.domains, included: updated },
                              },
                            });
                          }}
                        >
                          {domain.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Stages
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {guidance.fieldHints.stages}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {industryConfig.stages.map((stage) => {
                      const isSelected = mandate.scope?.stages?.included?.includes(stage.value);
                      return (
                        <Badge
                          key={stage.value}
                          variant={isSelected ? 'default' : 'outline'}
                          className={canEdit ? 'cursor-pointer hover:bg-primary/80' : ''}
                          onClick={() => {
                            if (!canEdit) return;
                            const current = mandate.scope?.stages?.included || [];
                            const updated = isSelected
                              ? current.filter((s) => s !== stage.value)
                              : [...current, stage.value];
                            updateMandate(mandate.id, {
                              scope: {
                                ...mandate.scope,
                                stages: { ...mandate.scope?.stages, included: updated },
                              },
                            });
                          }}
                        >
                          {stage.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Sizing */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Sizing
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {guidance.fieldHints.sizing}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{guidance.sizingLabels.min}</Label>
                      <Input
                        type="number"
                        value={mandate.scope?.sizing?.min || ''}
                        onChange={(e) => updateMandate(mandate.id, {
                          scope: {
                            ...mandate.scope,
                            sizing: {
                              ...mandate.scope?.sizing,
                              min: e.target.value ? parseInt(e.target.value) : undefined,
                              currency: guidance.sizingLabels.currency || 'USD',
                            },
                          },
                        })}
                        disabled={!canEdit}
                        placeholder="Min"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{guidance.sizingLabels.max}</Label>
                      <Input
                        type="number"
                        value={mandate.scope?.sizing?.max || ''}
                        onChange={(e) => updateMandate(mandate.id, {
                          scope: {
                            ...mandate.scope,
                            sizing: {
                              ...mandate.scope?.sizing,
                              max: e.target.value ? parseInt(e.target.value) : undefined,
                              currency: guidance.sizingLabels.currency || 'USD',
                            },
                          },
                        })}
                        disabled={!canEdit}
                        placeholder="Max"
                      />
                    </div>
                    {guidance.sizingLabels.target && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{guidance.sizingLabels.target}</Label>
                        <Input
                          type="number"
                          value={mandate.scope?.sizing?.target || ''}
                          onChange={(e) => updateMandate(mandate.id, {
                            scope: {
                              ...mandate.scope,
                              sizing: {
                                ...mandate.scope?.sizing,
                                target: e.target.value ? parseInt(e.target.value) : undefined,
                                currency: guidance.sizingLabels.currency || 'USD',
                              },
                            },
                          })}
                          disabled={!canEdit}
                          placeholder="Target"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Hard Constraints Summary */}
                {mandate.hardConstraints && mandate.hardConstraints.length > 0 && (
                  <div className="space-y-2">
                    <Label>Hard Constraints ({mandate.hardConstraints.length})</Label>
                    <div className="flex flex-wrap gap-1">
                      {mandate.hardConstraints.map((hc) => (
                        <Badge key={hc.id} variant="outline" className="text-xs">
                          {hc.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Posture */}
                <div className="space-y-2">
                  <Label>Risk Posture</Label>
                  <Select
                    value={mandate.riskPosture || 'ALIGNED'}
                    onValueChange={(v) => updateMandate(mandate.id, { riskPosture: v as MandateDefinition['riskPosture'] })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSERVATIVE">Conservative</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="AGGRESSIVE">Aggressive</SelectItem>
                      <SelectItem value="ALIGNED">Aligned with Portfolio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Template Picker Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Add {mandateLabel} from Template
              </DialogTitle>
              <DialogDescription>
                Choose from industry-specific templates to quickly set up your {mandateLabelPlural.toLowerCase()}.
                Templates include pre-filled objectives, scope, and constraints.
              </DialogDescription>
            </DialogHeader>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Button
                variant={selectedTemplateType === 'ALL' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTemplateType('ALL')}
              >
                All
              </Button>
              <Button
                variant={selectedTemplateType === 'PRIMARY' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTemplateType('PRIMARY')}
                className="gap-1"
              >
                <Target className="h-3 w-3" />
                Primary
              </Button>
              <Button
                variant={selectedTemplateType === 'THEMATIC' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTemplateType('THEMATIC')}
                className="gap-1"
              >
                <Layers className="h-3 w-3" />
                Thematic
              </Button>
              <Button
                variant={selectedTemplateType === 'CARVEOUT' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTemplateType('CARVEOUT')}
                className="gap-1"
              >
                <Scissors className="h-3 w-3" />
                Carveout
              </Button>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto py-2">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates available for this filter.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => addMandateFromTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${MANDATE_TYPE_INFO[template.type].color}`}>
                              {getMandateTypeIcon(template.type)}
                            </div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                          </div>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {template.description}
                        </p>
                        {/* Template Preview */}
                        <div className="flex flex-wrap gap-1">
                          {template.mandate.scope.domains?.included?.slice(0, 3).map((d) => (
                            <Badge key={d} variant="outline" className="text-[10px] px-1 py-0">
                              {d}
                            </Badge>
                          ))}
                          {template.mandate.scope.stages?.included?.slice(0, 2).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">
                              {s}
                            </Badge>
                          ))}
                          {template.mandate.hardConstraints?.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {template.mandate.hardConstraints.length} constraints
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Exclusions Editor (Simplified)
function ExclusionsEditor({
  payload,
  onChange,
  canEdit,
}: {
  payload: ExclusionsModulePayload;
  onChange: (payload: ExclusionsModulePayload) => void;
  canEdit: boolean;
}) {
  const addExclusion = () => {
    const newItem = {
      id: `excl-${Date.now()}`,
      name: 'New Exclusion',
      type: 'HARD' as const,
      dimension: '',
      operator: 'EQUALS' as const,
      values: [],
      rationale: '',
    };
    onChange({
      ...payload,
      items: [...(payload.items || []), newItem],
    });
  };

  return (
    <div className="space-y-4">
      {payload.items?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No exclusions defined yet.</p>
          {canEdit && (
            <Button variant="outline" className="mt-4" onClick={addExclusion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exclusion
            </Button>
          )}
        </div>
      )}

      {payload.items?.map((item, index) => (
        <Card key={item.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => {
                    const updated = [...payload.items];
                    updated[index] = { ...item, name: e.target.value };
                    onChange({ ...payload, items: updated });
                  }}
                  disabled={!canEdit}
                  className="max-w-xs"
                />
                <Badge variant={item.type === 'HARD' ? 'destructive' : 'outline'}>
                  {item.type}
                </Badge>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onChange({
                      ...payload,
                      items: payload.items.filter((_, i) => i !== index),
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dimension</Label>
                <Input
                  value={item.dimension}
                  onChange={(e) => {
                    const updated = [...payload.items];
                    updated[index] = { ...item, dimension: e.target.value };
                    onChange({ ...payload, items: updated });
                  }}
                  placeholder="e.g., sector, geography"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={item.type}
                  onValueChange={(v) => {
                    const updated = [...payload.items];
                    updated[index] = { ...item, type: v as 'HARD' | 'CONDITIONAL' };
                    onChange({ ...payload, items: updated });
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HARD">Hard (No Exceptions)</SelectItem>
                    <SelectItem value="CONDITIONAL">Conditional (Approval Required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Values (comma-separated)</Label>
              <Input
                value={item.values?.join(', ') || ''}
                onChange={(e) => {
                  const updated = [...payload.items];
                  updated[index] = {
                    ...item,
                    values: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  };
                  onChange({ ...payload, items: updated });
                }}
                placeholder="e.g., tobacco, weapons"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Rationale</Label>
              <Textarea
                value={item.rationale}
                onChange={(e) => {
                  const updated = [...payload.items];
                  updated[index] = { ...item, rationale: e.target.value };
                  onChange({ ...payload, items: updated });
                }}
                placeholder="Why is this excluded?"
                disabled={!canEdit}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {canEdit && payload.items?.length > 0 && (
        <Button variant="outline" onClick={addExclusion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exclusion
        </Button>
      )}
    </div>
  );
}

// Risk Appetite Editor (Simplified)
function RiskAppetiteEditor({
  payload,
  onChange,
  canEdit,
}: {
  payload: RiskAppetiteModulePayload;
  onChange: (payload: RiskAppetiteModulePayload) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Framework */}
      <div className="space-y-2">
        <Label>Risk Framework</Label>
        <Input
          value={payload.framework || ''}
          onChange={(e) => onChange({ ...payload, framework: e.target.value })}
          placeholder="e.g., Internal Risk Framework v2"
          disabled={!canEdit}
        />
      </div>

      {/* Dimensions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Risk Dimensions</Label>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({
                  ...payload,
                  dimensions: [
                    ...(payload.dimensions || []),
                    {
                      id: `dim-${Date.now()}`,
                      name: 'New Dimension',
                      toleranceMin: 0,
                      toleranceMax: 100,
                    },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {payload.dimensions?.map((dim, index) => (
          <Card key={dim.id}>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={dim.name}
                  onChange={(e) => {
                    const updated = [...payload.dimensions];
                    updated[index] = { ...dim, name: e.target.value };
                    onChange({ ...payload, dimensions: updated });
                  }}
                  disabled={!canEdit}
                  className="max-w-xs"
                />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange({
                        ...payload,
                        dimensions: payload.dimensions.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Tolerance</Label>
                  <Input
                    type="number"
                    value={dim.toleranceMin}
                    onChange={(e) => {
                      const updated = [...payload.dimensions];
                      updated[index] = { ...dim, toleranceMin: parseFloat(e.target.value) || 0 };
                      onChange({ ...payload, dimensions: updated });
                    }}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tolerance</Label>
                  <Input
                    type="number"
                    value={dim.toleranceMax}
                    onChange={(e) => {
                      const updated = [...payload.dimensions];
                      updated[index] = { ...dim, toleranceMax: parseFloat(e.target.value) || 0 };
                      onChange({ ...payload, dimensions: updated });
                    }}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={dim.description || ''}
                  onChange={(e) => {
                    const updated = [...payload.dimensions];
                    updated[index] = { ...dim, description: e.target.value };
                    onChange({ ...payload, dimensions: updated });
                  }}
                  disabled={!canEdit}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Governance Editor (Simplified)
function GovernanceEditor({
  payload,
  onChange,
  canEdit,
}: {
  payload: GovernanceThresholdsModulePayload;
  onChange: (payload: GovernanceThresholdsModulePayload) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Approval Tiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Approval Tiers</Label>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({
                  ...payload,
                  approvalTiers: [
                    ...(payload.approvalTiers || []),
                    {
                      id: `tier-${Date.now()}`,
                      name: 'New Tier',
                      priority: (payload.approvalTiers?.length || 0) + 1,
                      conditions: [],
                      requiredApprovers: [{ role: 'Investment Committee', count: 1 }],
                    },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tier
            </Button>
          )}
        </div>

        {payload.approvalTiers?.map((tier, index) => (
          <Card key={tier.id}>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={tier.name}
                  onChange={(e) => {
                    const updated = [...payload.approvalTiers];
                    updated[index] = { ...tier, name: e.target.value };
                    onChange({ ...payload, approvalTiers: updated });
                  }}
                  disabled={!canEdit}
                  className="max-w-xs"
                />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange({
                        ...payload,
                        approvalTiers: payload.approvalTiers.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tier.priority}
                    onChange={(e) => {
                      const updated = [...payload.approvalTiers];
                      updated[index] = { ...tier, priority: parseInt(e.target.value) || 1 };
                      onChange({ ...payload, approvalTiers: updated });
                    }}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Approvers</Label>
                  <Input
                    value={tier.requiredApprovers?.map((a) => `${a.role} (${a.count})`).join(', ') || ''}
                    disabled={!canEdit}
                    readOnly
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={tier.description || ''}
                  onChange={(e) => {
                    const updated = [...payload.approvalTiers];
                    updated[index] = { ...tier, description: e.target.value };
                    onChange({ ...payload, approvalTiers: updated });
                  }}
                  disabled={!canEdit}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conflicts Policy */}
      <div className="space-y-4">
        <Label>Conflicts Policy</Label>
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={payload.conflictsPolicy?.requireDisclosure ?? true}
                onChange={(e) => {
                  onChange({
                    ...payload,
                    conflictsPolicy: {
                      ...payload.conflictsPolicy,
                      requireDisclosure: e.target.checked,
                      disclosureScope: payload.conflictsPolicy?.disclosureScope || 'MATERIAL',
                      recusalRules: payload.conflictsPolicy?.recusalRules || [],
                    },
                  });
                }}
                disabled={!canEdit}
                className="h-4 w-4"
              />
              <Label>Require Disclosure</Label>
            </div>
            <div className="space-y-2">
              <Label>Disclosure Scope</Label>
              <Select
                value={payload.conflictsPolicy?.disclosureScope || 'MATERIAL'}
                onValueChange={(v) => {
                  onChange({
                    ...payload,
                    conflictsPolicy: {
                      ...payload.conflictsPolicy,
                      requireDisclosure: payload.conflictsPolicy?.requireDisclosure ?? true,
                      disclosureScope: v as 'ALL' | 'MATERIAL' | 'FINANCIAL',
                      recusalRules: payload.conflictsPolicy?.recusalRules || [],
                    },
                  });
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Conflicts</SelectItem>
                  <SelectItem value="MATERIAL">Material Only</SelectItem>
                  <SelectItem value="FINANCIAL">Financial Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reporting Editor (Simplified)
function ReportingEditor({
  payload,
  onChange,
  canEdit,
}: {
  payload: ReportingObligationsModulePayload;
  onChange: (payload: ReportingObligationsModulePayload) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Report Packs</Label>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange({
                ...payload,
                packs: [
                  ...(payload.packs || []),
                  {
                    id: `pack-${Date.now()}`,
                    name: 'New Report Pack',
                    frequency: 'QUARTERLY',
                    audience: ['Management'],
                    sections: [],
                    signoffRoles: ['CFO'],
                  },
                ],
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Pack
          </Button>
        )}
      </div>

      {payload.packs?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No report packs defined yet.
        </div>
      )}

      {payload.packs?.map((pack, index) => (
        <Card key={pack.id}>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={pack.name}
                onChange={(e) => {
                  const updated = [...payload.packs];
                  updated[index] = { ...pack, name: e.target.value };
                  onChange({ ...payload, packs: updated });
                }}
                disabled={!canEdit}
                className="max-w-xs"
              />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onChange({
                      ...payload,
                      packs: payload.packs.filter((_, i) => i !== index),
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={pack.frequency}
                  onValueChange={(v) => {
                    const updated = [...payload.packs];
                    updated[index] = { ...pack, frequency: v as typeof pack.frequency };
                    onChange({ ...payload, packs: updated });
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                    <SelectItem value="AD_HOC">Ad Hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input
                  value={pack.audience?.join(', ') || ''}
                  onChange={(e) => {
                    const updated = [...payload.packs];
                    updated[index] = {
                      ...pack,
                      audience: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    };
                    onChange({ ...payload, packs: updated });
                  }}
                  placeholder="e.g., Management, Board"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sign-off Roles</Label>
              <Input
                value={pack.signoffRoles?.join(', ') || ''}
                onChange={(e) => {
                  const updated = [...payload.packs];
                  updated[index] = {
                    ...pack,
                    signoffRoles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  };
                  onChange({ ...payload, packs: updated });
                }}
                placeholder="e.g., CFO, CRO"
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Evidence Editor (Simplified)
function EvidenceEditor({
  payload,
  onChange,
  canEdit,
}: {
  payload: EvidenceAdmissibilityModulePayload;
  onChange: (payload: EvidenceAdmissibilityModulePayload) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Allowed Evidence Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Allowed Evidence Types</Label>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({
                  ...payload,
                  allowedEvidenceTypes: [
                    ...(payload.allowedEvidenceTypes || []),
                    {
                      id: `etype-${Date.now()}`,
                      name: 'New Evidence Type',
                      category: 'DOCUMENT',
                    },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Type
            </Button>
          )}
        </div>

        {payload.allowedEvidenceTypes?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No evidence types defined yet.
          </div>
        )}

        {payload.allowedEvidenceTypes?.map((etype, index) => (
          <Card key={etype.id}>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={etype.name}
                  onChange={(e) => {
                    const updated = [...payload.allowedEvidenceTypes];
                    updated[index] = { ...etype, name: e.target.value };
                    onChange({ ...payload, allowedEvidenceTypes: updated });
                  }}
                  disabled={!canEdit}
                  className="max-w-xs"
                />
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange({
                        ...payload,
                        allowedEvidenceTypes: payload.allowedEvidenceTypes.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={etype.category}
                    onValueChange={(v) => {
                      const updated = [...payload.allowedEvidenceTypes];
                      updated[index] = { ...etype, category: v as typeof etype.category };
                      onChange({ ...payload, allowedEvidenceTypes: updated });
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="DATA">Data</SelectItem>
                      <SelectItem value="ATTESTATION">Attestation</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Required</Label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      checked={etype.required ?? false}
                      onChange={(e) => {
                        const updated = [...payload.allowedEvidenceTypes];
                        updated[index] = { ...etype, required: e.target.checked };
                        onChange({ ...payload, allowedEvidenceTypes: updated });
                      }}
                      disabled={!canEdit}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={etype.description || ''}
                  onChange={(e) => {
                    const updated = [...payload.allowedEvidenceTypes];
                    updated[index] = { ...etype, description: e.target.value };
                    onChange({ ...payload, allowedEvidenceTypes: updated });
                  }}
                  disabled={!canEdit}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forbidden Types */}
      <div className="space-y-2">
        <Label>Forbidden Evidence Types (IDs)</Label>
        <Input
          value={payload.forbiddenEvidenceTypes?.join(', ') || ''}
          onChange={(e) => {
            onChange({
              ...payload,
              forbiddenEvidenceTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            });
          }}
          placeholder="e.g., verbal-only, unverified-social"
          disabled={!canEdit}
        />
        <p className="text-xs text-muted-foreground">
          Evidence types that should never be accepted
        </p>
      </div>
    </div>
  );
}
