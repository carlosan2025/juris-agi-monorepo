'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  FileText,
  Database,
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveContext } from '@/contexts/ActiveContext';
import type { MandateStatus, VersionStatus } from '@/types/domain';
import { formatDate } from '@/lib/date-utils';

// Mock data - backend_pending
interface MandateDetail {
  id: string;
  name: string;
  description?: string;
  industryProfile: 'vc' | 'insurance' | 'pharma';
  status: MandateStatus;
  activeBaselineVersion: string | null;
  activeSchemaVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ConstitutionVersion {
  id: string;
  version: string;
  status: VersionStatus;
  createdAt: Date;
  createdBy: string;
  activatedAt: Date | null;
}

interface SchemaVersion {
  id: string;
  version: string;
  status: VersionStatus;
  createdAt: Date;
  createdBy: string;
}

interface CaseSummary {
  id: string;
  name: string;
  status: string;
  currentStep: number;
  createdAt: Date;
}

const MOCK_MANDATE: MandateDetail = {
  id: '1',
  name: 'Series A Investment Mandate',
  description: 'Standard evaluation criteria for Series A venture investments',
  industryProfile: 'vc',
  status: 'active',
  activeBaselineVersion: 'v1.2.0',
  activeSchemaVersion: 'v1.0.0',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-10'),
};

const MOCK_CONSTITUTIONS: ConstitutionVersion[] = [
  { id: '1', version: 'v1.2.0', status: 'active', createdAt: new Date('2024-03-01'), createdBy: 'admin@company.com', activatedAt: new Date('2024-03-05') },
  { id: '2', version: 'v1.1.0', status: 'superseded', createdAt: new Date('2024-02-01'), createdBy: 'admin@company.com', activatedAt: new Date('2024-02-15') },
  { id: '3', version: 'v1.0.0', status: 'superseded', createdAt: new Date('2024-01-15'), createdBy: 'admin@company.com', activatedAt: new Date('2024-01-20') },
];

const MOCK_SCHEMAS: SchemaVersion[] = [
  { id: '1', version: 'v1.0.0', status: 'active', createdAt: new Date('2024-01-20'), createdBy: 'schema@company.com' },
];

const MOCK_CASES: CaseSummary[] = [
  { id: '1', name: 'TechCorp Series A', status: 'evaluation', currentStep: 5, createdAt: new Date('2024-03-01') },
  { id: '2', name: 'DataFlow Seed', status: 'evidence', currentStep: 4, createdAt: new Date('2024-03-05') },
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

export default function MandateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setMandate } = useActiveContext();
  const [mandate] = useState<MandateDetail>(MOCK_MANDATE);
  const [constitutions] = useState<ConstitutionVersion[]>(MOCK_CONSTITUTIONS);
  const [schemas] = useState<SchemaVersion[]>(MOCK_SCHEMAS);
  const [cases] = useState<CaseSummary[]>(MOCK_CASES);

  // Set mandate in context when loaded
  useEffect(() => {
    setMandate({
      id: mandate.id,
      name: mandate.name,
      industryProfile: mandate.industryProfile,
      status: mandate.status,
      activeBaselineVersion: mandate.activeBaselineVersion,
      activeSchemaVersion: mandate.activeSchemaVersion,
      createdAt: mandate.createdAt,
      updatedAt: mandate.updatedAt,
    });
  }, [mandate, setMandate]);

  const activeConstitution = constitutions.find(c => c.status === 'active');
  const activeSchema = schemas.find(s => s.status === 'active');

  const canCreateCase = activeConstitution && activeSchema;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mandates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">{mandate.name}</h1>
            <Badge variant={mandate.status === 'active' ? 'default' : 'secondary'}>
              {mandate.status}
            </Badge>
          </div>
          {mandate.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{mandate.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1.5" />
          Settings
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Constitution Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Constitution (Baseline)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeConstitution ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold font-mono">{activeConstitution.version}</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Active since {activeConstitution.activatedAt ? formatDate(activeConstitution.activatedAt) : 'N/A'}
                </p>
                <Link href={`/mandates/${mandate.id}/constitution`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Versions
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">No active baseline</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create and activate a constitution to proceed
                </p>
                <Link href={`/mandates/${mandate.id}/constitution/new`}>
                  <Button size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Constitution
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schema Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              Evidence Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSchema ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold font-mono">{activeSchema.version}</span>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Active since {formatDate(activeSchema.createdAt)}
                </p>
                <Link href={`/mandates/${mandate.id}/schema`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Schema
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">No active schema</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Define evidence admissibility rules
                </p>
                <Link href={`/mandates/${mandate.id}/schema/new`}>
                  <Button size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Schema
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cases Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-semibold">{cases.length}</span>
              <p className="text-xs text-muted-foreground">
                {cases.filter(c => c.currentStep >= 5).length} in evaluation
              </p>
              <Button
                size="sm"
                className="w-full mt-2"
                disabled={!canCreateCase}
                onClick={() => router.push(`/mandates/${mandate.id}/cases/new`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Case
              </Button>
              {!canCreateCase && (
                <p className="text-xs text-amber-600 text-center">
                  Requires active baseline & schema
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="constitution">Constitution History</TabsTrigger>
          <TabsTrigger value="schema">Schema History</TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Case</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Step</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    >
                      <td className="px-4 py-2 text-sm font-medium">{c.name}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.currentStep}</span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className="text-xs capitalize">{c.status}</Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cases.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No cases yet. Create your first case to begin evaluation.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constitution">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Version</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-40">Created By</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {constitutions.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/mandates/${mandate.id}/constitution/${c.id}`)}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    >
                      <td className="px-4 py-2 font-mono text-sm">{c.version}</td>
                      <td className="px-4 py-2">{getStatusBadge(c.status)}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{c.createdBy}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Version</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-40">Created By</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {schemas.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/mandates/${mandate.id}/schema/${s.id}`)}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    >
                      <td className="px-4 py-2 font-mono text-sm">{s.version}</td>
                      <td className="px-4 py-2">{getStatusBadge(s.status)}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{s.createdBy}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
