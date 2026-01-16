'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileOutput,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Shield,
  Link2,
  Calendar,
  MoreHorizontal,
  Trash2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReportType, ReportStatus } from '@/types/domain';
import { formatDate } from '@/lib/date-utils';

// Mock data - backend_pending
interface Report {
  id: string;
  caseId: string;
  caseName: string;
  projectName: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  traceCount: number;
  signOffsComplete: number;
  signOffsTotal: number;
  createdAt: Date;
  updatedAt: Date;
  certifiedAt?: Date;
  certifiedBy?: string;
}

const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    caseId: 'case-1',
    caseName: 'TechCorp Series A',
    projectName: 'Growth Fund III',
    type: 'ic_memo',
    title: 'Investment Committee Memo - TechCorp Series A',
    status: 'certified',
    traceCount: 34,
    signOffsComplete: 3,
    signOffsTotal: 3,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-13'),
    certifiedAt: new Date('2024-03-13'),
    certifiedBy: 'partner@company.com',
  },
  {
    id: '2',
    caseId: 'case-2',
    caseName: 'HealthTech B2B Platform',
    projectName: 'Growth Fund III',
    type: 'risk_report',
    title: 'Risk Assessment - HealthTech B2B Platform',
    status: 'pending_certification',
    traceCount: 28,
    signOffsComplete: 1,
    signOffsTotal: 3,
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '3',
    caseId: 'case-3',
    caseName: 'FinServ Infrastructure',
    projectName: 'Growth Fund III',
    type: 'ic_memo',
    title: 'Investment Committee Memo - FinServ Infrastructure',
    status: 'draft',
    traceCount: 12,
    signOffsComplete: 0,
    signOffsTotal: 3,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '4',
    caseId: 'case-1',
    caseName: 'TechCorp Series A',
    projectName: 'Growth Fund III',
    type: 'lp_pack',
    title: 'LP Pack Q1 2024 - TechCorp Update',
    status: 'draft',
    traceCount: 8,
    signOffsComplete: 0,
    signOffsTotal: 2,
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-14'),
  },
  {
    id: '5',
    caseId: 'case-4',
    caseName: 'Retail Analytics Suite',
    projectName: 'Opportunity Fund I',
    type: 'regulator_pack',
    title: 'Regulatory Compliance Report - Q1 2024',
    status: 'certified',
    traceCount: 45,
    signOffsComplete: 4,
    signOffsTotal: 4,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-08'),
    certifiedAt: new Date('2024-03-08'),
    certifiedBy: 'compliance@company.com',
  },
];

const REPORT_TYPE_INFO: Record<ReportType, { label: string; color: string }> = {
  ic_memo: { label: 'IC Memo', color: 'bg-blue-500' },
  risk_report: { label: 'Risk Report', color: 'bg-amber-500' },
  lp_pack: { label: 'LP Pack', color: 'bg-purple-500' },
  regulator_pack: { label: 'Regulator Pack', color: 'bg-green-500' },
};

function getStatusBadge(status: ReportStatus) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'pending_certification':
      return <Badge variant="secondary">Pending Certification</Badge>;
    case 'certified':
      return <Badge className="bg-green-600">Certified</Badge>;
  }
}

function getStatusIcon(status: ReportStatus) {
  switch (status) {
    case 'draft':
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case 'pending_certification':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'certified':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>(MOCK_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const totalReports = reports.length;
  const certifiedReports = reports.filter((r) => r.status === 'certified').length;
  const pendingReports = reports.filter((r) => r.status === 'pending_certification').length;
  const draftReports = reports.filter((r) => r.status === 'draft').length;
  const totalTraces = reports.reduce((sum, r) => sum + r.traceCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Certified reports across all cases with full traceability
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileOutput className="h-4 w-4" />
              <span className="text-xs">Total Reports</span>
            </div>
            <div className="text-2xl font-semibold">{totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs">Certified</span>
            </div>
            <div className="text-2xl font-semibold text-green-600">{certifiedReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="text-2xl font-semibold text-amber-500">{pendingReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Drafts</span>
            </div>
            <div className="text-2xl font-semibold">{draftReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Link2 className="h-4 w-4" />
              <span className="text-xs">Total Traces</span>
            </div>
            <div className="text-2xl font-semibold">{totalTraces}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_certification">Pending Certification</SelectItem>
            <SelectItem value="certified">Certified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <FileOutput className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ic_memo">IC Memo</SelectItem>
            <SelectItem value="risk_report">Risk Report</SelectItem>
            <SelectItem value="lp_pack">LP Pack</SelectItem>
            <SelectItem value="regulator_pack">Regulator Pack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Report</TableHead>
              <TableHead>Case / Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Sign-offs</TableHead>
              <TableHead className="text-center">Traces</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <FileOutput className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No reports found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{getStatusIcon(report.status)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/cases/${report.caseId}/reporting`}
                      className="font-medium hover:underline"
                    >
                      {report.title}
                    </Link>
                    {report.certifiedAt && report.certifiedBy && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Certified by {report.certifiedBy}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{report.caseName}</div>
                    <div className="text-xs text-muted-foreground">{report.projectName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={REPORT_TYPE_INFO[report.type].color}>
                      {REPORT_TYPE_INFO[report.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Progress
                        value={(report.signOffsComplete / report.signOffsTotal) * 100}
                        className="h-2 w-16"
                      />
                      <span className="text-xs text-muted-foreground">
                        {report.signOffsComplete}/{report.signOffsTotal}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      <Link2 className="h-3 w-3 mr-1" />
                      {report.traceCount}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(report.updatedAt)}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/cases/${report.caseId}/reporting`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Report
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                        {report.status === 'certified' && (
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Distribute
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Report Type Summary */}
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(REPORT_TYPE_INFO) as ReportType[]).map((type) => {
          const typeReports = reports.filter((r) => r.type === type);
          const certified = typeReports.filter((r) => r.status === 'certified').length;
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${REPORT_TYPE_INFO[type].color}`} />
                  <CardTitle className="text-sm font-medium">
                    {REPORT_TYPE_INFO[type].label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold">{typeReports.length}</span>
                  <span className="text-xs text-muted-foreground">
                    {certified} certified
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
