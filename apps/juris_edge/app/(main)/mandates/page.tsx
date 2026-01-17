'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  FolderOpen,
  Calendar,
  GitBranch,
  FileText,
  Briefcase,
  Filter,
  Archive,
  Copy,
  Trash2,
  Settings,
  TrendingUp,
  AlertCircle,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import type { MandateStatus, IndustryProfile } from '@/types/domain';
import { formatDate } from '@/lib/date-utils';

// UI display type (simplified from domain type)
interface MandateDisplay {
  id: string;
  name: string;
  description?: string;
  industryProfile: IndustryProfile;
  activeBaselineVersion: string | null;
  activeSchemaVersion: string | null;
  status: MandateStatus;
  casesCount: number;
  activeCasesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for demonstration
const MOCK_MANDATES: MandateDisplay[] = [
  {
    id: '1',
    name: 'Series A Investment Mandate',
    description: 'Standard evaluation criteria for Series A investments',
    industryProfile: 'vc',
    activeBaselineVersion: 'v1.2.0',
    activeSchemaVersion: 'v1.0.0',
    status: 'active',
    casesCount: 12,
    activeCasesCount: 4,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '2',
    name: 'Seed Stage Mandate',
    description: 'Early stage startup evaluation mandate',
    industryProfile: 'vc',
    activeBaselineVersion: 'v2.0.1',
    activeSchemaVersion: 'v1.1.0',
    status: 'active',
    casesCount: 8,
    activeCasesCount: 3,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-08'),
  },
  {
    id: '3',
    name: 'Growth Equity Mandate',
    description: 'Mandate for growth stage investments',
    industryProfile: 'vc',
    activeBaselineVersion: null,
    activeSchemaVersion: null,
    status: 'draft',
    casesCount: 0,
    activeCasesCount: 0,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
  {
    id: '4',
    name: 'Oncology Pipeline Mandate',
    description: 'Drug candidate evaluation for oncology',
    industryProfile: 'pharma',
    activeBaselineVersion: 'v1.0.0',
    activeSchemaVersion: 'v1.0.0',
    status: 'active',
    casesCount: 6,
    activeCasesCount: 2,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '5',
    name: 'Commercial Property Underwriting Mandate',
    description: 'Risk assessment mandate for commercial property',
    industryProfile: 'insurance',
    activeBaselineVersion: 'v2.1.0',
    activeSchemaVersion: 'v1.2.0',
    status: 'active',
    casesCount: 24,
    activeCasesCount: 8,
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date('2024-03-14'),
  },
];

function getStatusBadgeVariant(status: MandateStatus) {
  switch (status) {
    case 'active':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
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

type FilterStatus = 'all' | MandateStatus;

export default function MandatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [mandates] = useState<MandateDisplay[]>(MOCK_MANDATES);

  const filteredMandates = mandates.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMandateClick = (mandate: MandateDisplay) => {
    router.push(`/mandates/${mandate.id}`);
  };

  const stats = {
    active: mandates.filter((m) => m.status === 'active').length,
    draft: mandates.filter((m) => m.status === 'draft').length,
    totalCases: mandates.reduce((sum, m) => sum + m.casesCount, 0),
    activeCases: mandates.reduce((sum, m) => sum + m.activeCasesCount, 0),
    needsSetup: mandates.filter((m) => !m.activeBaselineVersion || !m.activeSchemaVersion).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mandates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage evaluation mandates and baselines
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/mandates/new')}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Mandate
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
          <div className="text-2xl font-semibold">{stats.active}</div>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Draft</span>
          </div>
          <div className="text-2xl font-semibold">{stats.draft}</div>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium">Total Cases</span>
          </div>
          <div className="text-2xl font-semibold">{stats.totalCases}</div>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Active Cases</span>
          </div>
          <div className="text-2xl font-semibold">{stats.activeCases}</div>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Needs Setup</span>
          </div>
          <div className="text-2xl font-semibold">{stats.needsSetup}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mandates..."
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
            <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mandates Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Mandate</TableHead>
              <TableHead className="text-xs w-24">Industry</TableHead>
              <TableHead className="text-xs w-28">Baseline</TableHead>
              <TableHead className="text-xs w-20">Cases</TableHead>
              <TableHead className="text-xs w-24">Status</TableHead>
              <TableHead className="text-xs w-28">Updated</TableHead>
              <TableHead className="text-xs w-10 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMandates.map((mandate) => {
              const industryConfig = getIndustryBadge(mandate.industryProfile);
              const needsSetup = !mandate.activeBaselineVersion || !mandate.activeSchemaVersion;

              return (
                <TableRow
                  key={mandate.id}
                  onClick={() => handleMandateClick(mandate)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {mandate.name}
                          {needsSetup && (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        {mandate.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {mandate.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${industryConfig.className}`}>
                      {industryConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      <span className="font-mono">
                        {mandate.activeBaselineVersion || '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{mandate.activeCasesCount}</span>
                      <span className="text-muted-foreground">/{mandate.casesCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(mandate.status)}
                      className="text-xs capitalize"
                    >
                      {mandate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(mandate.updatedAt)}</span>
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
                          router.push(`/mandates/${mandate.id}/settings`);
                        }}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
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

        {filteredMandates.length === 0 && (
          <div className="py-12 text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No mandates found</p>
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
