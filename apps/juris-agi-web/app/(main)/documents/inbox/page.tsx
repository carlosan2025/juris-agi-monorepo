'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FolderOpen,
  Inbox,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  Shield,
  ShieldAlert,
  ShieldQuestion,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInspector } from '@/components/layout/InspectorDrawer';
import type { EnhancedDocument, DocumentTrustLevel } from '@/types/domain';

// Mock data for unassigned documents (inbox)
const MOCK_INBOX_DOCUMENTS: EnhancedDocument[] = [
  {
    id: 'doc-inbox-1',
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
    id: 'doc-inbox-2',
    organizationId: 'org-1',
    workspaceId: null,
    filename: 'NewStartup_Pitch_v3.pdf',
    type: 'pitch_deck',
    status: 'ready',
    trustLevel: 'unverified',
    provenance: {
      source: 'Email Attachment',
      sourceUrl: null,
      retrievedAt: new Date('2024-01-15'),
      verifiedBy: null,
      verifiedAt: null,
    },
    metadata: { pageCount: 18, fileSize: 3200000 },
    assignedMandates: [],
    assignedCases: [],
    tags: ['pitch', 'series-a'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-2',
    uploadedAt: new Date('2024-01-15'),
    processedAt: new Date('2024-01-15'),
  },
  {
    id: 'doc-inbox-3',
    organizationId: 'org-1',
    workspaceId: null,
    filename: 'FinTech_Financials_Q4.xlsx',
    type: 'financial_model',
    status: 'processing',
    trustLevel: 'unverified',
    provenance: {
      source: 'Direct Upload',
      sourceUrl: null,
      retrievedAt: null,
      verifiedBy: null,
      verifiedAt: null,
    },
    metadata: { fileSize: 890000 },
    assignedMandates: [],
    assignedCases: [],
    tags: ['financials', 'fintech', 'q4'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-3',
    uploadedAt: new Date('2024-01-16'),
    processedAt: null,
  },
];

// Mock cases for assignment
const MOCK_CASES = [
  { id: 'case-1', name: 'TechCorp Series B', project: 'Tech Growth Fund' },
  { id: 'case-2', name: 'HealthStart Assessment', project: 'Healthcare Portfolio' },
  { id: 'case-3', name: 'GreenEnergy Deal', project: 'Climate Fund II' },
  { id: 'case-4', name: 'FinTech Evaluation', project: 'Fintech Opportunities' },
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

export default function DocumentsInboxPage() {
  const router = useRouter();
  const { openInspector } = useInspector();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string>('');

  const filteredDocuments = useMemo(() => {
    return MOCK_INBOX_DOCUMENTS.filter((doc) => {
      return (
        searchQuery === '' ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [searchQuery]);

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

  const handleAssign = () => {
    // backend_pending: Assign documents to case
    console.log('Assigning documents:', Array.from(selectedDocs), 'to case:', selectedCase);
    setAssignDialogOpen(false);
    setSelectedDocs(new Set());
    setSelectedCase('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Inbox className="h-6 w-6" />
              Document Inbox
            </h1>
            <p className="text-muted-foreground">
              {filteredDocuments.length} unassigned documents waiting to be organized
            </p>
          </div>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Organize your documents
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Documents in the inbox are not yet assigned to any case. Select documents and assign
                them to cases to use them in evaluations and analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inbox..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
            {selectedDocs.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedDocs.size} selected
                </span>
                <Button onClick={() => setAssignDialogOpen(true)}>
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
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Inbox is empty</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'No documents match your search'
                  : 'All documents have been assigned to cases'}
              </p>
              <Button onClick={() => router.push('/documents')}>
                View All Documents
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                <Checkbox
                  checked={
                    filteredDocuments.length > 0 &&
                    selectedDocs.size === filteredDocuments.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedDocs.size === filteredDocuments.length
                    ? 'Deselect all'
                    : 'Select all'}
                </span>
              </div>

              {/* Document List */}
              {filteredDocuments.map((doc) => {
                const statusConfig = STATUS_CONFIG[doc.status];
                const trustConfig = TRUST_CONFIG[doc.trustLevel];
                const StatusIcon = statusConfig.icon;
                const TrustIcon = trustConfig.icon;

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      selectedDocs.has(doc.id) ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDocs.has(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                    </div>

                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{doc.filename}</span>
                        {doc.version > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            v{doc.version}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[doc.type] || doc.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.metadata.fileSize || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Uploaded {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {doc.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrustIcon className={`h-4 w-4 ${trustConfig.color}`} />
                        <span className="text-sm">{trustConfig.label}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocs(new Set([doc.id]));
                              setAssignDialogOpen(true);
                            }}
                          >
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Documents to Case</DialogTitle>
            <DialogDescription>
              Select a case to assign the selected {selectedDocs.size} document
              {selectedDocs.size > 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger>
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CASES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.project}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedCase}>
              Assign Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
