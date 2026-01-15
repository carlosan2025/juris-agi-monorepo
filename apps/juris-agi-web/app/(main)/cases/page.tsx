'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { CaseStatus, WorkflowStep } from '@/types/domain';

// UI display type (simplified from domain type)
interface CaseDisplay {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  currentStep: WorkflowStep;
  status: CaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for demonstration
const MOCK_CASES: CaseDisplay[] = [
  {
    id: '1',
    name: 'TechCorp Series A',
    description: 'Series A investment evaluation for TechCorp Inc.',
    projectId: '1',
    currentStep: 6,
    status: 'exceptions',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '2',
    name: 'DataFlow Seed',
    description: 'Seed round evaluation for DataFlow Systems',
    projectId: '2',
    currentStep: 4,
    status: 'evidence',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-11'),
  },
  {
    id: '3',
    name: 'CloudScale Growth',
    description: 'Growth equity evaluation for CloudScale',
    projectId: '3',
    currentStep: 8,
    status: 'integrated',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-08'),
  },
];

const STEP_NAMES: Record<WorkflowStep, string> = {
  1: 'Project',
  2: 'Constitution',
  3: 'Schema',
  4: 'Evidence',
  5: 'Evaluate',
  6: 'Exceptions',
  7: 'Decide',
  8: 'Portfolio',
  9: 'Report',
  10: 'Monitor',
};

function isCompletedStatus(status: CaseStatus) {
  return status === 'integrated' || status === 'reported' || status === 'monitoring';
}

function isActiveStatus(status: CaseStatus) {
  return !isCompletedStatus(status) && status !== 'intake';
}

function getStatusIcon(status: CaseStatus) {
  if (isCompletedStatus(status)) {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
  if (isActiveStatus(status)) {
    return <Clock className="h-4 w-4 text-blue-600" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function getStatusBadgeVariant(status: CaseStatus) {
  if (isCompletedStatus(status)) {
    return 'default' as const;
  }
  if (isActiveStatus(status)) {
    return 'secondary' as const;
  }
  return 'outline' as const;
}

export default function CasesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cases] = useState<CaseDisplay[]>(MOCK_CASES);

  const filteredCases = cases.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCaseClick = (caseItem: CaseDisplay) => {
    router.push(`/cases/${caseItem.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage investment evaluations
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Case
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">
                Case
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-32">
                Current Step
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-32">
                Updated
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-10">
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((caseItem) => (
              <tr
                key={caseItem.id}
                onClick={() => handleCaseClick(caseItem)}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {caseItem.name}
                      </div>
                      {caseItem.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {caseItem.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      {caseItem.currentStep}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {STEP_NAMES[caseItem.currentStep]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(caseItem.status)}
                    <Badge
                      variant={getStatusBadgeVariant(caseItem.status)}
                      className="text-xs capitalize"
                    >
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {caseItem.updatedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show menu
                    }}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCases.length === 0 && (
          <div className="py-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No cases found</p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Evidence Gathering
          </div>
          <div className="text-2xl font-semibold">
            {cases.filter((c) => c.status === 'evidence').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Under Evaluation
          </div>
          <div className="text-2xl font-semibold">
            {cases.filter((c) => c.status === 'evaluation' || c.status === 'exceptions').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Pending Decision
          </div>
          <div className="text-2xl font-semibold">
            {cases.filter((c) => c.status === 'decision').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Completed
          </div>
          <div className="text-2xl font-semibold">
            {cases.filter((c) => isCompletedStatus(c.status)).length}
          </div>
        </div>
      </div>
    </div>
  );
}
