'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ClaimPolarity, ClaimStatus } from '@/types/domain';

// Mock data - backend_pending
interface DocumentUpload {
  id: string;
  filename: string;
  type: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  size: number;
  uploadedAt: Date;
  claimsExtracted: number;
}

interface ExtractedClaim {
  id: string;
  documentId: string;
  documentName: string;
  field: string;
  value: string;
  confidence: number;
  polarity: ClaimPolarity;
  status: ClaimStatus;
  provenance: {
    page: number;
    section: string;
  };
}

const MOCK_DOCUMENTS: DocumentUpload[] = [
  { id: '1', filename: 'Financial Statements Q4 2023.pdf', type: 'financial_statement', status: 'ready', size: 2456000, uploadedAt: new Date('2024-03-01'), claimsExtracted: 15 },
  { id: '2', filename: 'Pitch Deck v2.pdf', type: 'pitch_deck', status: 'ready', size: 8234000, uploadedAt: new Date('2024-03-01'), claimsExtracted: 12 },
  { id: '3', filename: 'Customer References.xlsx', type: 'customer_reference', status: 'ready', size: 156000, uploadedAt: new Date('2024-03-02'), claimsExtracted: 8 },
  { id: '4', filename: 'Cap Table 2024.xlsx', type: 'legal_document', status: 'processing', size: 89000, uploadedAt: new Date('2024-03-05'), claimsExtracted: 0 },
  { id: '5', filename: 'Market Analysis Report.pdf', type: 'market_report', status: 'ready', size: 4567000, uploadedAt: new Date('2024-03-03'), claimsExtracted: 10 },
];

const MOCK_CLAIMS: ExtractedClaim[] = [
  { id: '1', documentId: '1', documentName: 'Financial Statements Q4 2023.pdf', field: 'Annual Revenue', value: '$2.4M', confidence: 0.95, polarity: 'supportive', status: 'approved', provenance: { page: 3, section: 'Income Statement' } },
  { id: '2', documentId: '1', documentName: 'Financial Statements Q4 2023.pdf', field: 'YoY Growth', value: '142%', confidence: 0.92, polarity: 'supportive', status: 'approved', provenance: { page: 3, section: 'Summary' } },
  { id: '3', documentId: '1', documentName: 'Financial Statements Q4 2023.pdf', field: 'Gross Margin', value: '68%', confidence: 0.89, polarity: 'supportive', status: 'proposed', provenance: { page: 5, section: 'Margins' } },
  { id: '4', documentId: '2', documentName: 'Pitch Deck v2.pdf', field: 'TAM', value: '$50B', confidence: 0.75, polarity: 'supportive', status: 'proposed', provenance: { page: 8, section: 'Market' } },
  { id: '5', documentId: '2', documentName: 'Pitch Deck v2.pdf', field: 'Customer Count', value: '45', confidence: 0.88, polarity: 'supportive', status: 'approved', provenance: { page: 12, section: 'Traction' } },
  { id: '6', documentId: '3', documentName: 'Customer References.xlsx', field: 'NPS Score', value: '72', confidence: 0.85, polarity: 'supportive', status: 'proposed', provenance: { page: 1, section: 'Summary' } },
  { id: '7', documentId: '5', documentName: 'Market Analysis Report.pdf', field: 'Competitor Count', value: '12', confidence: 0.82, polarity: 'risk', status: 'proposed', provenance: { page: 15, section: 'Competition' } },
];

// Coverage requirements based on schema - backend_pending
const COVERAGE_REQUIREMENTS = [
  { item: 'Company financials (last 3 years)', required: true, fulfilled: true },
  { item: 'Cap table', required: true, fulfilled: false },
  { item: 'Customer list with references', required: true, fulfilled: true },
  { item: 'Technical architecture overview', required: false, fulfilled: false },
  { item: 'Competitive analysis', required: false, fulfilled: true },
  { item: 'Team background checks', required: true, fulfilled: false },
];

function getDocumentStatusBadge(status: DocumentUpload['status']) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>;
    case 'processing':
      return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Uploaded</Badge>;
  }
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.85) {
    return <Badge variant="outline" className="text-green-600 border-green-600">High ({(confidence * 100).toFixed(0)}%)</Badge>;
  } else if (confidence >= 0.6) {
    return <Badge variant="outline" className="text-amber-600 border-amber-600">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
  }
  return <Badge variant="outline" className="text-red-600 border-red-600">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
}

function getPolarityBadge(polarity: ClaimPolarity) {
  switch (polarity) {
    case 'supportive':
      return <Badge variant="outline" className="text-green-600">Supportive</Badge>;
    case 'risk':
      return <Badge variant="outline" className="text-red-600">Risk</Badge>;
    default:
      return <Badge variant="outline">Neutral</Badge>;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function EvidencePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [documents] = useState<DocumentUpload[]>(MOCK_DOCUMENTS);
  const [claims] = useState<ExtractedClaim[]>(MOCK_CLAIMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const filteredClaims = selectedDocId
    ? claims.filter((c) => c.documentId === selectedDocId)
    : claims;

  const requiredCoverage = COVERAGE_REQUIREMENTS.filter((c) => c.required);
  const fulfilledRequired = requiredCoverage.filter((c) => c.fulfilled).length;
  const coveragePercentage = Math.round((fulfilledRequired / requiredCoverage.length) * 100);

  const approvedClaims = claims.filter((c) => c.status === 'approved').length;
  const pendingClaims = claims.filter((c) => c.status === 'proposed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Evidence Ingestion</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 4: Upload documents and review extracted claims
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Claims
        </Button>
        <Button size="sm">
          <ChevronRight className="h-4 w-4 mr-2" />
          Proceed to Evaluation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Documents</div>
            <div className="text-2xl font-semibold">{documents.length}</div>
            <div className="text-xs text-muted-foreground">
              {documents.filter((d) => d.status === 'ready').length} processed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Extracted Claims</div>
            <div className="text-2xl font-semibold">{claims.length}</div>
            <div className="text-xs text-muted-foreground">
              {approvedClaims} approved, {pendingClaims} pending
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Coverage</div>
            <div className="text-2xl font-semibold">{coveragePercentage}%</div>
            <Progress value={coveragePercentage} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Confidence</div>
            <div className="text-2xl font-semibold">
              {(claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-green-600">High confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Checklist</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Upload Area */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Drag and drop files here, or click to browse
                </p>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">File</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-20">Claims</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-20">Size</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {doc.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{getDocumentStatusBadge(doc.status)}</td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-mono">{doc.claimsExtracted}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1.5" />
              Filter
            </Button>
            {selectedDocId && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDocId(null)}>
                Clear filter
              </Button>
            )}
          </div>

          {/* Claims Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Field</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Value</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Confidence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Polarity</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Source</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium">{claim.field}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-mono">{claim.value}</span>
                      </td>
                      <td className="px-4 py-2">{getConfidenceBadge(claim.confidence)}</td>
                      <td className="px-4 py-2">{getPolarityBadge(claim.polarity)}</td>
                      <td className="px-4 py-2">
                        {claim.status === 'approved' ? (
                          <Badge className="bg-green-600">Approved</Badge>
                        ) : claim.status === 'rejected' ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs">
                          <div className="truncate max-w-[150px]">{claim.documentName}</div>
                          <div className="text-muted-foreground">
                            p.{claim.provenance.page}, {claim.provenance.section}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {claim.status === 'proposed' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600">
                                Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600">
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Evidence Coverage Checklist</CardTitle>
              <CardDescription>
                Based on schema v1.0.0 requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COVERAGE_REQUIREMENTS.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-md ${
                    item.fulfilled
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                      : item.required
                      ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                      : 'bg-muted border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.fulfilled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className="text-sm">{item.item}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    {!item.fulfilled && (
                      <Button size="sm" variant="outline">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
