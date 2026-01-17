'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ScrollText,
  Clock,
  User,
  ChevronRight,
  FileCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PendingApproval {
  id: string;
  type: 'BASELINE';
  title: string;
  description: string;
  portfolioId: string;
  portfolioName: string;
  submittedAt: string | null;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  href: string;
}

interface PendingApprovalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingApprovalsModal({ open, onOpenChange }: PendingApprovalsModalProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/approvals/pending');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch pending approvals');
        return;
      }

      setPendingApprovals(data.pendingApprovals);
    } catch {
      setError('Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPendingApprovals();
    }
  }, [open, fetchPendingApprovals]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BASELINE':
        return <ScrollText className="h-4 w-4" />;
      default:
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BASELINE':
        return <Badge variant="secondary">Baseline</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Pending Approvals
          </DialogTitle>
          <DialogDescription>
            Items waiting for your review and approval
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchPendingApprovals}>
              Try Again
            </Button>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No items pending your approval
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <Link
                  key={approval.id}
                  href={approval.href}
                  onClick={() => onOpenChange(false)}
                  className="block"
                >
                  <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary">
                          {getTypeIcon(approval.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeBadge(approval.type)}
                            <span className="text-xs text-muted-foreground">
                              {approval.portfolioName}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm truncate">
                            {approval.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {approval.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {approval.submittedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {approval.submittedBy.name}
                              </span>
                            )}
                            {approval.submittedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(approval.submittedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
