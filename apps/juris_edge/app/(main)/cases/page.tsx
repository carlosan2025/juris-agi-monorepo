'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Archive,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import type { CaseStatus, CaseType, WorkflowStep } from '@/types/domain';

// UI display type
interface CaseDisplay {
  id: string;
  name: string;
  description?: string;
  mandateId: string;
  mandateName: string;
  type: CaseType;
  currentStep: WorkflowStep;
  status: CaseStatus;
  hasExceptions: boolean;
  exceptionsCount: number;
  documentsCount: number;
  claimsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data
const MOCK_CASES: CaseDisplay[] = [
  {
    id: '1',
    name: 'TechCorp Series A',
    description: 'Series A investment evaluation for TechCorp Inc.',
    mandateId: '1',
    mandateName: 'Series A Evaluation Framework',
    type: 'deal',
    currentStep: 6,
    status: 'exceptions',
    hasExceptions: true,
    exceptionsCount: 2,
    documentsCount: 12,
    claimsCount: 47,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '2',
    name: 'DataFlow Seed',
    description: 'Seed round evaluation for DataFlow Systems',
    mandateId: '2',
    mandateName: 'Seed Stage Assessment',
    type: 'deal',
    currentStep: 4,
    status: 'evidence',
    hasExceptions: false,
    exceptionsCount: 0,
    documentsCount: 5,
    claimsCount: 18,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-11'),
  },
  {
    id: '3',
    name: 'CloudScale Growth',
    description: 'Growth equity evaluation for CloudScale',
    mandateId: '1',
    mandateName: 'Series A Evaluation Framework',
    type: 'deal',
    currentStep: 8,
    status: 'integrated',
    hasExceptions: false,
    exceptionsCount: 0,
    documentsCount: 24,
    claimsCount: 89,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-08'),
  },
  {
    id: '4',
    name: 'HealthTech Assessment',
    description: 'Drug candidate evaluation for Phase II',
    mandateId: '4',
    mandateName: 'Oncology Pipeline Assessment',
    type: 'asset_gating',
    currentStep: 5,
    status: 'evaluation',
    hasExceptions: false,
    exceptionsCount: 0,
    documentsCount: 18,
    claimsCount: 62,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '5',
    name: 'PropertyCo Underwriting',
    description: 'Commercial property insurance underwriting',
    mandateId: '5',
    mandateName: 'Commercial Property Underwriting',
    type: 'underwriting',
    currentStep: 7,
    status: 'decision',
    hasExceptions: true,
    exceptionsCount: 1,
    documentsCount: 8,
    claimsCount: 34,
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-13'),
  },
];

const STEP_NAMES: Record<WorkflowStep, string> = {
  1: 'Mandate',
  2: 'Constitution',
  3: 'Intake',
  4: 'Evidence',
  5: 'Evaluate',
  6: 'Exceptions',
  7: 'Decision',
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

function getStatusBadgeClass(status: CaseStatus) {
  switch (status) {
    case 'evidence':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'evaluation':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'exceptions':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'decision':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'integrated':
    case 'reported':
    case 'monitoring':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return '';
  }
}

function getCaseTypeBadge(type: CaseType) {
  const config = {
    deal: { label: 'Deal', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    underwriting: { label: 'Underwriting', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    asset_gating: { label: 'Asset Gating', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  };
  return config[type];
}

type FilterStatus = 'all' | 'active' | 'completed' | 'exceptions';

export default function CasesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [cases] = useState<CaseDisplay[]>(MOCK_CASES);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mandateName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = isActiveStatus(c.status) && !isCompletedStatus(c.status);
    } else if (statusFilter === 'completed') {
      matchesStatus = isCompletedStatus(c.status);
    } else if (statusFilter === 'exceptions') {
      matchesStatus = c.hasExceptions;
    }

    return matchesSearch && matchesStatus;
  });

  const handleCaseClick = (caseItem: CaseDisplay) => {
    router.push(`/cases/${caseItem.id}`);
  };

  const stats = {
    total: cases.length,
    active: cases.filter((c) => isActiveStatus(c.status) && !isCompletedStatus(c.status)).length,
    completed: cases.filter((c) => isCompletedStatus(c.status)).length,
    withExceptions: cases.filter((c) => c.hasExceptions).length,
    avgProgress: Math.round(cases.reduce((sum, c) => sum + ((c.currentStep - 3) / 7) * 100, 0) / cases.length),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage investment evaluations across all mandates
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/mandates')}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Case
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs font-medium">Total Cases</span>
            </div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Active</span>
            </div>
            <div className="text-2xl font-semibold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Completed</span>
            </div>
            <div className="text-2xl font-semibold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">With Exceptions</span>
            </div>
            <div className="text-2xl font-semibold">{stats.withExceptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Progress</span>
            </div>
            <div className="text-2xl font-semibold">{stats.avgProgress}%</div>
            <Progress value={stats.avgProgress} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases or mandates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {statusFilter === 'all' ? 'All Cases' : statusFilter === 'exceptions' ? 'With Exceptions' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Cases
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('exceptions')}>
              With Exceptions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cases Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Case</TableHead>
              <TableHead className="text-xs w-40">Mandate</TableHead>
              <TableHead className="text-xs w-24">Type</TableHead>
              <TableHead className="text-xs w-36">Progress</TableHead>
              <TableHead className="text-xs w-28">Status</TableHead>
              <TableHead className="text-xs w-28">Updated</TableHead>
              <TableHead className="text-xs w-10 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((caseItem) => {
              const typeConfig = getCaseTypeBadge(caseItem.type);
              const progress = Math.round(((caseItem.currentStep - 3) / 7) * 100);

              return (
                <TableRow
                  key={caseItem.id}
                  onClick={() => handleCaseClick(caseItem)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {caseItem.name}
                          {caseItem.hasExceptions && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                              {caseItem.exceptionsCount} exc
                            </Badge>
                          )}
                        </div>
                        {caseItem.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {caseItem.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FolderOpen className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{caseItem.mandateName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${typeConfig.className}`}>
                      {typeConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono">Step {caseItem.currentStep}</span>
                        <span className="text-muted-foreground">{STEP_NAMES[caseItem.currentStep]}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(caseItem.status)}
                      <Badge
                        variant="secondary"
                        className={`text-xs capitalize ${getStatusBadgeClass(caseItem.status)}`}
                      >
                        {caseItem.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {caseItem.updatedAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
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
                          router.push(`/cases/${caseItem.id}`);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/cases/${caseItem.id}/evidence`);
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Evidence
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
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

        {filteredCases.length === 0 && (
          <div className="py-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No cases found</p>
            {searchQuery && (
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
