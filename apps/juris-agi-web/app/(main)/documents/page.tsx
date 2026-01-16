'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Trash2,
  FolderOpen,
  Eye,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useInspector } from '@/components/layout/InspectorDrawer';
import { useDocuments } from '@/hooks/useDocuments';
import type { EnhancedDocument, DocumentTrustLevel } from '@/types/domain';

// Keep mock data as fallback (moved to hook)
const MOCK_DOCUMENTS: EnhancedDocument[] = [
  {
    id: 'doc-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    filename: 'TechCorp_Series_B_Pitch.pdf',
    type: 'pitch_deck',
    status: 'ready',
    trustLevel: 'verified',
    provenance: {
      source: 'Direct Upload',
      sourceUrl: null,
      retrievedAt: null,
      verifiedBy: 'John Smith',
      verifiedAt: new Date('2024-01-15'),
    },
    metadata: { pageCount: 24, fileSize: 2400000 },
    assignedMandates: ['proj-1'],
    assignedCases: ['case-1'],
    tags: ['series-b', 'saas'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-1',
    uploadedAt: new Date('2024-01-10'),
    processedAt: new Date('2024-01-10'),
  },
  {
    id: 'doc-2',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    filename: 'HealthTech_Financial_Model_2024.xlsx',
    type: 'financial_model',
    status: 'processing',
    trustLevel: 'unverified',
    provenance: {
      source: 'Email Attachment',
      sourceUrl: null,
      retrievedAt: new Date('2024-01-12'),
      verifiedBy: null,
      verifiedAt: null,
    },
    metadata: { fileSize: 450000 },
    assignedMandates: ['proj-2'],
    assignedCases: [],
    tags: ['financials', 'healthtech'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-2',
    uploadedAt: new Date('2024-01-12'),
    processedAt: null,
  },
  {
    id: 'doc-3',
    organizationId: 'org-1',
    workspaceId: null,
    filename: 'GreenEnergy_IC_Memo_Draft.docx',
    type: 'ic_memo',
    status: 'ready',
    trustLevel: 'verified',
    provenance: {
      source: 'Internal Generation',
      sourceUrl: null,
      retrievedAt: null,
      verifiedBy: 'Sarah Chen',
      verifiedAt: new Date('2024-01-14'),
    },
    metadata: { pageCount: 8, fileSize: 180000 },
    assignedMandates: [],
    assignedCases: [],
    tags: ['ic-memo', 'cleantech'],
    version: 2,
    previousVersionId: 'doc-3-v1',
    uploadedBy: 'user-1',
    uploadedAt: new Date('2024-01-14'),
    processedAt: new Date('2024-01-14'),
  },
  {
    id: 'doc-4',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    filename: 'AIStartup_Technical_Architecture.pdf',
    type: 'tech_description',
    status: 'failed',
    trustLevel: 'disputed',
    provenance: {
      source: 'Third Party',
      sourceUrl: 'https://dataroom.example.com',
      retrievedAt: new Date('2024-01-08'),
      verifiedBy: null,
      verifiedAt: null,
    },
    metadata: { pageCount: 45, fileSize: 5600000 },
    assignedMandates: ['proj-3'],
    assignedCases: ['case-2'],
    tags: ['technical', 'ai', 'architecture'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-3',
    uploadedAt: new Date('2024-01-08'),
    processedAt: null,
  },
  {
    id: 'doc-5',
    organizationId: 'org-1',
    workspaceId: 'ws-2',
    filename: 'Biotech_Phase2_Results.pdf',
    type: 'tech_description',
    status: 'ready',
    trustLevel: 'verified',
    provenance: {
      source: 'Clinical Trial Database',
      sourceUrl: 'https://clinicaltrials.gov',
      retrievedAt: new Date('2024-01-05'),
      verifiedBy: 'Dr. Mike Johnson',
      verifiedAt: new Date('2024-01-06'),
    },
    metadata: { pageCount: 120, fileSize: 8900000 },
    assignedMandates: ['proj-4'],
    assignedCases: ['case-3', 'case-4'],
    tags: ['clinical', 'phase-2', 'biotech'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-4',
    uploadedAt: new Date('2024-01-05'),
    processedAt: new Date('2024-01-06'),
  },
];

const STATUS_CONFIG = {
  uploaded: { label: 'Uploaded', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  processing: { label: 'Processing', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  ready: { label: 'Ready', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

const TRUST_CONFIG: Record<DocumentTrustLevel, { label: string; icon: typeof Shield; color: string }> = {
  verified: { label: 'Verified', icon: Shield, color: 'text-green-600' },
  unverified: { label: 'Unverified', icon: ShieldQuestion, color: 'text-yellow-600' },
  disputed: { label: 'Disputed', icon: ShieldAlert, color: 'text-red-600' },
};

const TYPE_LABELS: Record<string, string> = {
  pitch_deck: 'Pitch Deck',
  financial_model: 'Financial Model',
  tech_description: 'Technical Doc',
  ic_memo: 'IC Memo',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function DocumentsPage() {
  const router = useRouter();
  const { openInspector } = useInspector();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [trustFilter, setTrustFilter] = useState<string>('all');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Use the documents hook - falls back to mock data if API unavailable
  const {
    documents: allDocuments,
    loading,
    error,
    total,
    refetch,
    removeDocument,
    isApiAvailable,
  } = useDocuments();

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch =
        searchQuery === '' ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      const matchesTrust = trustFilter === 'all' || doc.trustLevel === trustFilter;

      return matchesSearch && matchesStatus && matchesType && matchesTrust;
    });
  }, [allDocuments, searchQuery, statusFilter, typeFilter, trustFilter]);

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocs(newSelected);
  };

  const handleViewDocument = (doc: EnhancedDocument) => {
    openInspector({
      type: 'document',
      id: doc.id,
      title: doc.filename,
      data: doc,
    });
  };

  const stats = useMemo(() => {
    const totalCount = allDocuments.length;
    const ready = allDocuments.filter((d) => d.status === 'ready').length;
    const processing = allDocuments.filter((d) => d.status === 'processing').length;
    const unassigned = allDocuments.filter((d) => d.assignedCases.length === 0).length;
    return { total: totalCount, ready, processing, unassigned };
  }, [allDocuments]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Status Banner */}
      {!isApiAvailable && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">
                Evidence API unavailable - showing demo data. Connect the API for full functionality.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize evidence documents across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => router.push('/documents/inbox')}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Inbox ({stats.unassigned})
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready for Use</p>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unassigned}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[300px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
                  <SelectItem value="financial_model">Financial Model</SelectItem>
                  <SelectItem value="tech_description">Technical Doc</SelectItem>
                  <SelectItem value="ic_memo">IC Memo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trustFilter} onValueChange={setTrustFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trust Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trust Levels</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedDocs.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedDocs.size} selected
                </span>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Assign to Case
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      filteredDocuments.length > 0 &&
                      selectedDocs.size === filteredDocuments.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const statusConfig = STATUS_CONFIG[doc.status];
                const trustConfig = TRUST_CONFIG[doc.trustLevel];
                const StatusIcon = statusConfig.icon;
                const TrustIcon = trustConfig.icon;

                return (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDocs.has(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{doc.filename}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {doc.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[doc.type] || doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrustIcon className={`h-4 w-4 ${trustConfig.color}`} />
                        <span className="text-sm">{trustConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(doc.metadata.fileSize || 0)}
                    </TableCell>
                    <TableCell>
                      {doc.assignedCases.length > 0 ? (
                        <Badge variant="secondary">
                          {doc.assignedCases.length} case
                          {doc.assignedCases.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Assign to Case
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No documents found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or upload new documents
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
