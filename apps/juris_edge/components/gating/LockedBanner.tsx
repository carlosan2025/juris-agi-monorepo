'use client';

import Link from 'next/link';
import { Lock, ArrowRight, AlertTriangle, FileText, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LockedBannerProps {
  mandateId: string;
  mandateName?: string;
  baselineStatus: 'NONE' | 'DRAFT' | 'INCOMPLETE';
  completionPercent?: number;
  variant?: 'banner' | 'card' | 'inline';
}

/**
 * LockedBanner - Displays when mandate baseline is not published
 *
 * Shows different states:
 * - NONE: No baseline exists (shouldn't happen with auto-create)
 * - DRAFT: Baseline exists but not all modules are complete
 * - INCOMPLETE: Baseline exists, modules incomplete
 *
 * Used to gate:
 * - Case creation
 * - Evidence upload
 * - Evaluation
 */
export function LockedBanner({
  mandateId,
  mandateName,
  baselineStatus,
  completionPercent = 0,
  variant = 'banner',
}: LockedBannerProps) {
  const getMessage = () => {
    switch (baselineStatus) {
      case 'NONE':
        return {
          title: 'Mandate Setup Required',
          description: 'A mandate constitution must be created before you can proceed.',
          action: 'Set Up Constitution',
        };
      case 'DRAFT':
        return {
          title: 'Baseline Not Published',
          description: 'Complete and publish baseline v1 to start creating cases.',
          action: 'Complete Setup',
        };
      case 'INCOMPLETE':
        return {
          title: 'Constitution Incomplete',
          description: `${Math.round(completionPercent)}% complete. Finish all 5 modules to publish.`,
          action: 'Continue Setup',
        };
      default:
        return {
          title: 'Setup Required',
          description: 'Please complete project setup to continue.',
          action: 'Go to Setup',
        };
    }
  };

  const { title, description, action } = getMessage();

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <Lock className="h-4 w-4 text-amber-600 shrink-0" />
        <div className="flex-1">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</span>
          <span className="text-sm text-amber-700 dark:text-amber-300 ml-1">— {description}</span>
        </div>
        <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200">
          <Link href={`/mandates/${mandateId}/constitution`}>
            {action}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 max-w-sm">
              {description}
            </p>
            {completionPercent > 0 && completionPercent < 100 && (
              <div className="w-full max-w-xs mb-4">
                <Progress value={completionPercent} className="h-2" />
                <p className="text-xs text-amber-600 mt-1">{Math.round(completionPercent)}% complete</p>
              </div>
            )}
            <Button asChild>
              <Link href={`/mandates/${mandateId}/constitution`}>
                <Rocket className="h-4 w-4 mr-2" />
                {action}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default banner variant
  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Lock className="w-full h-full text-amber-600" />
      </div>
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                {title}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                {description}
              </p>
              {mandateName && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Mandate: {mandateName}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {completionPercent > 0 && completionPercent < 100 && (
              <div className="text-right">
                <div className="w-24">
                  <Progress value={completionPercent} className="h-1.5" />
                </div>
                <p className="text-xs text-amber-600 mt-0.5">{Math.round(completionPercent)}%</p>
              </div>
            )}
            <Button asChild>
              <Link href={`/mandates/${mandateId}/constitution`}>
                <FileText className="h-4 w-4 mr-2" />
                {action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LockedOverlay - Full page overlay for locked states
 */
interface LockedOverlayProps {
  mandateId: string;
  featureName: string;
  completionPercent?: number;
}

export function LockedOverlay({ mandateId, featureName, completionPercent = 0 }: LockedOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-6">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{featureName} Locked</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        You need to publish your mandate baseline before you can access {featureName.toLowerCase()}.
        Complete all 5 constitution modules to unlock this feature.
      </p>
      {completionPercent > 0 && (
        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Setup Progress</span>
            <span className="font-medium">{Math.round(completionPercent)}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
      )}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/mandates/${mandateId}`}>Back to Mandate</Link>
        </Button>
        <Button asChild>
          <Link href={`/mandates/${mandateId}/constitution`}>
            <Rocket className="h-4 w-4 mr-2" />
            Complete Setup
          </Link>
        </Button>
      </div>
    </div>
  );
}
