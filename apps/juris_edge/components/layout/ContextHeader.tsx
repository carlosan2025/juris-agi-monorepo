'use client';

import { cn } from '@/lib/utils';
import { Building2, FileText, ScrollText, Database } from 'lucide-react';

interface ContextHeaderProps {
  projectName?: string;
  baselineVersion?: string;
  schemaVersion?: string;
  caseName?: string;
  className?: string;
}

export function ContextHeader({
  projectName,
  baselineVersion,
  schemaVersion,
  caseName,
  className,
}: ContextHeaderProps) {
  // Don't render if no context
  if (!projectName && !caseName) {
    return null;
  }

  return (
    <div className={cn('context-header', className)}>
      <div className="flex items-center gap-6">
        {projectName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Project:</span>
            <span>{projectName}</span>
          </div>
        )}

        {baselineVersion && (
          <div className="flex items-center gap-2">
            <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Baseline:</span>
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {baselineVersion}
            </span>
          </div>
        )}

        {schemaVersion && (
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Schema:</span>
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {schemaVersion}
            </span>
          </div>
        )}

        {caseName && (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Case:</span>
            <span>{caseName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
