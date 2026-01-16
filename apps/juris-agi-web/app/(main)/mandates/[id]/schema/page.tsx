'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  AlertTriangle,
  Lock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { VersionStatus } from '@/types/domain';
import { formatDate } from '@/lib/date-utils';

// Mock data - backend_pending
interface EvidenceTypeConfig {
  type: string;
  label: string;
  weight: number;
  decayRule: string;
  required: boolean;
}

interface SchemaVersion {
  id: string;
  version: string;
  status: VersionStatus;
  admissibleTypes: EvidenceTypeConfig[];
  confidenceWeights: {
    high: { min: number; max: number };
    medium: { min: number; max: number };
    low: { min: number; max: number };
  };
  decayRules: { type: string; rate: number; period: string }[];
  forbiddenClasses: string[];
  coverageChecklist: { item: string; required: boolean }[];
  createdBy: string;
  createdAt: Date;
  activatedAt: Date | null;
}

const MOCK_SCHEMAS: SchemaVersion[] = [
  {
    id: '1',
    version: 'v1.0.0',
    status: 'active',
    admissibleTypes: [
      { type: 'financial_statement', label: 'Financial Statements', weight: 1.0, decayRule: 'quarterly', required: true },
      { type: 'pitch_deck', label: 'Pitch Deck', weight: 0.8, decayRule: 'annual', required: true },
      { type: 'customer_reference', label: 'Customer References', weight: 0.9, decayRule: 'semi-annual', required: false },
      { type: 'market_report', label: 'Market Reports', weight: 0.7, decayRule: 'annual', required: false },
      { type: 'technical_assessment', label: 'Technical Assessment', weight: 0.85, decayRule: 'annual', required: false },
      { type: 'legal_document', label: 'Legal Documents', weight: 1.0, decayRule: 'none', required: true },
    ],
    confidenceWeights: {
      high: { min: 0.85, max: 1.0 },
      medium: { min: 0.6, max: 0.84 },
      low: { min: 0.0, max: 0.59 },
    },
    decayRules: [
      { type: 'quarterly', rate: 0.1, period: '3 months' },
      { type: 'semi-annual', rate: 0.15, period: '6 months' },
      { type: 'annual', rate: 0.2, period: '12 months' },
      { type: 'none', rate: 0, period: 'No decay' },
    ],
    forbiddenClasses: [
      'Unverified social media posts',
      'Anonymous sources',
      'Competitor-provided information',
      'Outdated reports (>2 years)',
    ],
    coverageChecklist: [
      { item: 'Company financials (last 3 years)', required: true },
      { item: 'Cap table', required: true },
      { item: 'Customer list with references', required: true },
      { item: 'Technical architecture overview', required: false },
      { item: 'Competitive analysis', required: false },
      { item: 'Team background checks', required: true },
    ],
    createdBy: 'schema@company.com',
    createdAt: new Date('2024-01-20'),
    activatedAt: new Date('2024-01-25'),
  },
  {
    id: '2',
    version: 'v1.1.0-draft',
    status: 'draft',
    admissibleTypes: [
      { type: 'financial_statement', label: 'Financial Statements', weight: 1.0, decayRule: 'quarterly', required: true },
      { type: 'pitch_deck', label: 'Pitch Deck', weight: 0.8, decayRule: 'annual', required: true },
      { type: 'customer_reference', label: 'Customer References', weight: 0.9, decayRule: 'semi-annual', required: true },
      { type: 'market_report', label: 'Market Reports', weight: 0.7, decayRule: 'annual', required: false },
      { type: 'technical_assessment', label: 'Technical Assessment', weight: 0.85, decayRule: 'annual', required: true },
      { type: 'legal_document', label: 'Legal Documents', weight: 1.0, decayRule: 'none', required: true },
      { type: 'esg_assessment', label: 'ESG Assessment', weight: 0.75, decayRule: 'annual', required: false },
    ],
    confidenceWeights: {
      high: { min: 0.9, max: 1.0 },
      medium: { min: 0.7, max: 0.89 },
      low: { min: 0.0, max: 0.69 },
    },
    decayRules: [
      { type: 'quarterly', rate: 0.15, period: '3 months' },
      { type: 'semi-annual', rate: 0.2, period: '6 months' },
      { type: 'annual', rate: 0.25, period: '12 months' },
      { type: 'none', rate: 0, period: 'No decay' },
    ],
    forbiddenClasses: [
      'Unverified social media posts',
      'Anonymous sources',
      'Competitor-provided information',
      'Outdated reports (>2 years)',
      'AI-generated content without verification',
    ],
    coverageChecklist: [
      { item: 'Company financials (last 3 years)', required: true },
      { item: 'Cap table', required: true },
      { item: 'Customer list with references', required: true },
      { item: 'Technical architecture overview', required: true },
      { item: 'Competitive analysis', required: false },
      { item: 'Team background checks', required: true },
      { item: 'ESG policy documentation', required: false },
    ],
    createdBy: 'analyst@company.com',
    createdAt: new Date('2024-03-12'),
    activatedAt: null,
  },
];

function getStatusBadge(status: VersionStatus) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'approved':
      return <Badge className="bg-blue-600">Approved</Badge>;
    case 'proposed':
      return <Badge variant="secondary">Proposed</Badge>;
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'superseded':
      return <Badge variant="outline" className="text-muted-foreground">Superseded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: VersionStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    case 'proposed':
      return <Clock className="h-4 w-4 text-amber-600" />;
    case 'draft':
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case 'superseded':
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function SchemaPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;
  const [schemas] = useState<SchemaVersion[]>(MOCK_SCHEMAS);
  const [selectedId, setSelectedId] = useState<string | null>(
    schemas.find(s => s.status === 'active')?.id || null
  );

  const selectedSchema = schemas.find(s => s.id === selectedId);
  const activeSchema = schemas.find(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/mandates/${mandateId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Evidence Admissibility Schema</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define evidence types, weights, and coverage requirements
          </p>
        </div>
        <Button size="sm" onClick={() => router.push(`/mandates/${mandateId}/schema/new`)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Version
        </Button>
      </div>

      {/* Warning if no active */}
      {!activeSchema && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">No active schema</span>
              <span className="text-sm">— Evidence cannot be ingested until a schema is activated</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Version List */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Versions</h2>
          <div className="space-y-1">
            {schemas.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                  selectedId === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {getStatusIcon(s.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono">{s.version}</div>
                  <div className={`text-xs ${selectedId === s.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {s.admissibleTypes.length} evidence types
                  </div>
                </div>
                {s.status === 'active' && selectedId !== s.id && (
                  <Badge variant="outline" className="text-xs">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Schema Detail */}
        <div className="col-span-2">
          {selectedSchema ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <span className="font-mono">{selectedSchema.version}</span>
                      {getStatusBadge(selectedSchema.status)}
                    </CardTitle>
                    <CardDescription>
                      Created by {selectedSchema.createdBy} on {formatDate(selectedSchema.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedSchema.status === 'draft' && (
                      <>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">Submit for Approval</Button>
                      </>
                    )}
                    {selectedSchema.status === 'proposed' && (
                      <>
                        <Button variant="outline" size="sm">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </>
                    )}
                    {selectedSchema.status === 'approved' && (
                      <Button size="sm">Activate</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Evidence Types */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Admissible Evidence Types</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-xs font-medium text-muted-foreground py-2">Type</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 w-20">Weight</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 w-24">Decay</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 w-20">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSchema.admissibleTypes.map((et, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 text-sm">{et.label}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <Progress value={et.weight * 100} className="w-12 h-1.5" />
                              <span className="text-xs text-muted-foreground">{et.weight}</span>
                            </div>
                          </td>
                          <td className="py-2">
                            <Badge variant="outline" className="text-xs capitalize">{et.decayRule}</Badge>
                          </td>
                          <td className="py-2">
                            {et.required ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Optional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confidence Weights */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Confidence Thresholds</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-900">
                      <div className="text-xs font-medium text-green-700 dark:text-green-400">High Confidence</div>
                      <div className="text-lg font-semibold text-green-800 dark:text-green-300">
                        {selectedSchema.confidenceWeights.high.min * 100}% - {selectedSchema.confidenceWeights.high.max * 100}%
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Medium Confidence</div>
                      <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                        {selectedSchema.confidenceWeights.medium.min * 100}% - {selectedSchema.confidenceWeights.medium.max * 100}%
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900">
                      <div className="text-xs font-medium text-red-700 dark:text-red-400">Low Confidence</div>
                      <div className="text-lg font-semibold text-red-800 dark:text-red-300">
                        {selectedSchema.confidenceWeights.low.min * 100}% - {selectedSchema.confidenceWeights.low.max * 100}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forbidden Classes */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Forbidden Evidence Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSchema.forbiddenClasses.map((fc, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {fc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Coverage Checklist */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Coverage Checklist</h3>
                  <div className="space-y-2">
                    {selectedSchema.coverageChecklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {item.required ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className={item.required ? '' : 'text-muted-foreground'}>{item.item}</span>
                        {item.required && (
                          <Badge variant="outline" className="text-xs ml-auto">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activation Info */}
                {selectedSchema.activatedAt && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Activated {formatDate(selectedSchema.activatedAt)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a version to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
