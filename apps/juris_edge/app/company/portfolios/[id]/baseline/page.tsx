'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  ChevronRight,
  Copy,
  Trash2,
  Eye,
  Edit3,
  Send,
  XCircle,
  ShieldCheck,
  ThumbsDown,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigation } from '@/contexts/NavigationContext';

// =============================================================================
// Types
// =============================================================================

interface ModuleSummary {
  type: string;
  isComplete: boolean;
  isValid: boolean;
}

interface BaselineVersion {
  id: string;
  portfolioId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  schemaVersion: number;
  parentVersionId: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  // Submission tracking
  submittedAt: string | null;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  // Approval tracking
  approvedAt: string | null;
  approvedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  // Rejection tracking
  rejectedAt: string | null;
  rejectedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  rejectionReason: string | null;
  // Publishing
  publishedAt: string | null;
  publishedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  changeSummary: string | null;
  isActive: boolean;
  // Action flags
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  modulesSummary: {
    total: number;
    complete: number;
    valid: number;
    modules: ModuleSummary[];
  };
}

// Module display names
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  MANDATES: 'Mandates',
  EXCLUSIONS: 'Exclusions',
  RISK_APPETITE: 'Risk Appetite',
  GOVERNANCE_THRESHOLDS: 'Governance',
  REPORTING_OBLIGATIONS: 'Reporting',
  EVIDENCE_ADMISSIBILITY: 'Evidence',
};

// =============================================================================
// Component
// =============================================================================

export default function BaselinePage() {
  const params = useParams();
  const router = useRouter();
  const {
    selectedPortfolio,
    navigateToPortfolio,
    portfolios,
    getPortfolioLabel,
    isAdmin,
  } = useNavigation();

  const portfolioId = params.id as string;
  const portfolioLabelSingular = getPortfolioLabel(false);

  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<BaselineVersion[]>([]);
  const [activeBaselineVersionId, setActiveBaselineVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Approval workflow state
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingVersionId, setRejectingVersionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdminUser = isAdmin();

  // Fetch baseline versions
  const fetchBaselineVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch baseline versions');
        return;
      }

      setVersions(data.versions || []);
      setActiveBaselineVersionId(data.activeBaselineVersionId);
      setError(null);
    } catch (err) {
      setError('Failed to fetch baseline versions');
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
      fetchBaselineVersions();
    } else if (portfolios.length > 0) {
      router.push('/company/portfolios');
    }
  }, [portfolioId, portfolios, navigateToPortfolio, router, fetchBaselineVersions]);

  // Create new baseline version
  const handleCreateBaseline = async (copyFromVersionId?: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyFromVersionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.existingDraftId) {
          // There's already a draft - redirect to it
          router.push(`/company/portfolios/${portfolioId}/baseline/${data.existingDraftId}`);
          return;
        }
        setError(data.error || 'Failed to create baseline version');
        return;
      }

      // Navigate to the new baseline editor
      router.push(`/company/portfolios/${portfolioId}/baseline/${data.baselineVersion.id}`);
    } catch (err) {
      setError('Failed to create baseline version');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete draft baseline version
  const handleDeleteBaseline = async (versionId: string) => {
    setIsDeleting(versionId);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline/${versionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete baseline version');
        return;
      }

      // Refresh the list
      fetchBaselineVersions();
    } catch (err) {
      setError('Failed to delete baseline version');
    } finally {
      setIsDeleting(null);
    }
  };

  // Approve baseline version
  const handleApproveBaseline = async (versionId: string) => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline/${versionId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to approve baseline');
        return;
      }

      // Refresh the list
      fetchBaselineVersions();
    } catch (err) {
      setError('Failed to approve baseline');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject baseline version
  const handleRejectBaseline = async () => {
    if (!rejectingVersionId || !rejectionReason.trim()) return;

    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/baseline/${rejectingVersionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reject baseline');
        return;
      }

      // Close dialog and refresh
      setShowRejectDialog(false);
      setRejectingVersionId(null);
      setRejectionReason('');
      fetchBaselineVersions();
    } catch (err) {
      setError('Failed to reject baseline');
    } finally {
      setIsRejecting(false);
    }
  };

  // Open reject dialog
  const openRejectDialog = (versionId: string) => {
    setRejectingVersionId(versionId);
    setRejectionReason('');
    setShowRejectDialog(true);
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

  // Get module status icon
  const getModuleStatusIcon = (module: ModuleSummary) => {
    if (!module.isValid) {
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
    if (module.isComplete) {
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    }
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  };

  // Find versions by status
  const activeVersion = versions.find((v) => v.isActive && v.status === 'PUBLISHED');
  const draftVersion = versions.find((v) => v.status === 'DRAFT');
  const pendingVersion = versions.find((v) => v.status === 'PENDING_APPROVAL');
  const rejectedVersion = versions.find((v) => v.status === 'REJECTED');
  const archivedVersions = versions.filter((v) => v.status === 'ARCHIVED');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Baseline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Governance constitution for {selectedPortfolio.name}
          </p>
        </div>
        {isAdminUser && !draftVersion && (
          <Button onClick={() => handleCreateBaseline(activeVersion?.id)} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {activeVersion ? 'Create New Version' : 'Create Baseline'}
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* No Baseline State */}
      {versions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Baseline Configured</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create a baseline to define the governance rules, mandates, risk appetite, and other
              constraints for this {portfolioLabelSingular.toLowerCase()}. Cases cannot be created
              until a baseline is published.
            </p>
            {isAdminUser && (
              <Button onClick={() => handleCreateBaseline()} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Baseline
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draft Version Card */}
      {draftVersion && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-base">
                    Draft v{draftVersion.versionNumber}
                  </CardTitle>
                  <CardDescription>
                    Created by {draftVersion.createdBy.name} on{' '}
                    {new Date(draftVersion.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(draftVersion.status, draftVersion.isActive)}
            </div>
          </CardHeader>
          <CardContent>
            {/* Module Status Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {draftVersion.modulesSummary.modules.map((module) => (
                <div
                  key={module.type}
                  className="flex items-center gap-1.5 text-xs p-2 bg-background rounded border"
                >
                  {getModuleStatusIcon(module)}
                  <span className="truncate">{MODULE_DISPLAY_NAMES[module.type] || module.type}</span>
                </div>
              ))}
            </div>

            {/* Progress Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>
                {draftVersion.modulesSummary.complete}/{draftVersion.modulesSummary.total} modules complete
              </span>
              <span>•</span>
              <span>
                {draftVersion.modulesSummary.valid}/{draftVersion.modulesSummary.total} valid
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/company/portfolios/${portfolioId}/baseline/${draftVersion.id}`}>
                <Button>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Continue Editing
                </Button>
              </Link>
              {isAdminUser && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isDeleting === draftVersion.id}>
                      {isDeleting === draftVersion.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the draft baseline v{draftVersion.versionNumber}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteBaseline(draftVersion.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approval Version Card */}
      {pendingVersion && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base">
                    Pending Approval v{pendingVersion.versionNumber}
                  </CardTitle>
                  <CardDescription>
                    Submitted by {pendingVersion.submittedBy?.name || pendingVersion.createdBy.name} on{' '}
                    {pendingVersion.submittedAt
                      ? new Date(pendingVersion.submittedAt).toLocaleDateString()
                      : new Date(pendingVersion.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(pendingVersion.status, pendingVersion.isActive)}
            </div>
          </CardHeader>
          <CardContent>
            {/* Change Summary */}
            {pendingVersion.changeSummary && (
              <p className="text-sm text-muted-foreground mb-4">
                {pendingVersion.changeSummary}
              </p>
            )}

            {/* Module Status Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {pendingVersion.modulesSummary.modules.map((module) => (
                <div
                  key={module.type}
                  className="flex items-center gap-1.5 text-xs p-2 bg-background rounded border"
                >
                  {getModuleStatusIcon(module)}
                  <span className="truncate">{MODULE_DISPLAY_NAMES[module.type] || module.type}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/company/portfolios/${portfolioId}/baseline/${pendingVersion.id}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </Link>
              {isAdminUser && pendingVersion.canApprove && (
                <>
                  <Button
                    onClick={() => handleApproveBaseline(pendingVersion.id)}
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
                    onClick={() => openRejectDialog(pendingVersion.id)}
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
          </CardContent>
        </Card>
      )}

      {/* Rejected Version Card */}
      {rejectedVersion && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-base">
                    Rejected v{rejectedVersion.versionNumber}
                  </CardTitle>
                  <CardDescription>
                    Rejected by {rejectedVersion.rejectedBy?.name || 'Unknown'} on{' '}
                    {rejectedVersion.rejectedAt
                      ? new Date(rejectedVersion.rejectedAt).toLocaleDateString()
                      : 'Unknown'}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(rejectedVersion.status, rejectedVersion.isActive)}
            </div>
          </CardHeader>
          <CardContent>
            {/* Rejection Reason */}
            {rejectedVersion.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-lg mb-4">
                <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                <p className="text-sm text-destructive/90">{rejectedVersion.rejectionReason}</p>
              </div>
            )}

            {/* Module Status Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {rejectedVersion.modulesSummary.modules.map((module) => (
                <div
                  key={module.type}
                  className="flex items-center gap-1.5 text-xs p-2 bg-background rounded border"
                >
                  {getModuleStatusIcon(module)}
                  <span className="truncate">{MODULE_DISPLAY_NAMES[module.type] || module.type}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/company/portfolios/${portfolioId}/baseline/${rejectedVersion.id}`}>
                <Button>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit & Resubmit
                </Button>
              </Link>
              {isAdminUser && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isDeleting === rejectedVersion.id}>
                      {isDeleting === rejectedVersion.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Rejected Baseline?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the rejected baseline v{rejectedVersion.versionNumber}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteBaseline(rejectedVersion.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Published Version Card */}
      {activeVersion && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-base">
                    Active Baseline v{activeVersion.versionNumber}
                  </CardTitle>
                  <CardDescription>
                    Published by {activeVersion.publishedBy?.name || 'Unknown'} on{' '}
                    {activeVersion.publishedAt
                      ? new Date(activeVersion.publishedAt).toLocaleDateString()
                      : 'Unknown'}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(activeVersion.status, activeVersion.isActive)}
            </div>
          </CardHeader>
          <CardContent>
            {/* Change Summary */}
            {activeVersion.changeSummary && (
              <p className="text-sm text-muted-foreground mb-4">
                {activeVersion.changeSummary}
              </p>
            )}

            {/* Module Status Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {activeVersion.modulesSummary.modules.map((module) => (
                <div
                  key={module.type}
                  className="flex items-center gap-1.5 text-xs p-2 bg-background rounded border"
                >
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="truncate">{MODULE_DISPLAY_NAMES[module.type] || module.type}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/company/portfolios/${portfolioId}/baseline/${activeVersion.id}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
              {isAdminUser && !draftVersion && (
                <Button
                  variant="outline"
                  onClick={() => handleCreateBaseline(activeVersion.id)}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Create New Version
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archived Versions */}
      {archivedVersions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Previous Versions</CardTitle>
                <CardDescription>
                  {archivedVersions.length} archived baseline{archivedVersions.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {archivedVersions.map((version) => (
                <Link
                  key={version.id}
                  href={`/company/portfolios/${portfolioId}/baseline/${version.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">v{version.versionNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Published {version.publishedAt
                          ? new Date(version.publishedAt).toLocaleDateString()
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(version.status, version.isActive)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
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
              <p className="font-medium text-foreground mb-1">About Baselines</p>
              <p>
                A baseline defines the governance constitution for your {portfolioLabelSingular.toLowerCase()}.
                It includes mandates, exclusions, risk appetite, approval thresholds, reporting
                obligations, and evidence admissibility rules. Only one baseline can be active at a
                time, and cases cannot be created until a baseline is published and approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Baseline</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this baseline. The author will be able to
              view this feedback and make corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
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
                setRejectingVersionId(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectBaseline}
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
