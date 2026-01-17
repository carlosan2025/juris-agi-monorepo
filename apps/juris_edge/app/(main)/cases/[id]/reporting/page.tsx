'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileOutput,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Link2,
  Shield,
  User,
  AlertTriangle,
  ChevronRight,
  Plus,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportType, ReportStatus } from '@/types/domain';
import { formatDate, formatDateTime } from '@/lib/date-utils';

// Mock data - backend_pending
interface ReportDraft {
  id: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  sections: {
    id: string;
    title: string;
    content: string;
    traceCount: number;
  }[];
  signOffs: {
    role: string;
    required: boolean;
    signedBy: string | null;
    signedAt: Date | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface TraceLink {
  id: string;
  statement: string;
  evidenceRef: string;
  ruleRef: string;
  decisionRef: string;
}

const MOCK_REPORTS: ReportDraft[] = [
  {
    id: '1',
    type: 'ic_memo',
    title: 'Investment Committee Memo - TechCorp Series A',
    status: 'draft',
    sections: [
      { id: '1', title: 'Executive Summary', content: 'TechCorp is a B2B SaaS company...', traceCount: 5 },
      { id: '2', title: 'Investment Thesis', content: 'Strong product-market fit demonstrated by...', traceCount: 8 },
      { id: '3', title: 'Key Metrics', content: 'Revenue: $2.4M ARR, Growth: 142% YoY...', traceCount: 12 },
      { id: '4', title: 'Risk Assessment', content: 'Key risks include sector concentration...', traceCount: 6 },
      { id: '5', title: 'Recommendation', content: 'Recommend approval with conditions...', traceCount: 3 },
    ],
    signOffs: [
      { role: 'Deal Lead', required: true, signedBy: 'analyst@company.com', signedAt: new Date('2024-03-13T10:00:00') },
      { role: 'Risk Officer', required: true, signedBy: null, signedAt: null },
      { role: 'Partner', required: true, signedBy: null, signedAt: null },
    ],
    createdAt: new Date('2024-03-13'),
    updatedAt: new Date('2024-03-13T14:00:00'),
  },
];

const MOCK_TRACE_LINKS: TraceLink[] = [
  { id: '1', statement: 'Annual revenue of $2.4M', evidenceRef: 'DOC-001:p3', ruleRef: 'REV-001', decisionRef: 'DEC-001' },
  { id: '2', statement: 'YoY growth rate of 142%', evidenceRef: 'DOC-001:p3', ruleRef: 'GRO-001', decisionRef: 'DEC-001' },
  { id: '3', statement: 'Gross margin of 68%', evidenceRef: 'DOC-001:p5', ruleRef: 'MAR-001', decisionRef: 'DEC-001' },
  { id: '4', statement: '45 enterprise customers', evidenceRef: 'DOC-002:p12', ruleRef: 'CUS-001', decisionRef: 'DEC-001' },
  { id: '5', statement: 'Sector concentration at 44%', evidenceRef: 'CALC-001', ruleRef: 'CON-001', decisionRef: 'EXC-001' },
];

const REPORT_TYPE_INFO: Record<ReportType, { label: string; description: string }> = {
  ic_memo: { label: 'IC Memo', description: 'Investment Committee memorandum' },
  risk_report: { label: 'Risk Report', description: 'Risk assessment report' },
  lp_pack: { label: 'LP Pack', description: 'Limited Partner reporting pack' },
  regulator_pack: { label: 'Regulator Pack', description: 'Regulatory compliance report' },
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

function getSignOffIcon(signedBy: string | null) {
  if (signedBy) {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export default function ReportingPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [reports, setReports] = useState<ReportDraft[]>(MOCK_REPORTS);
  const [traceLinks] = useState<TraceLink[]>(MOCK_TRACE_LINKS);
  const [selectedReport, setSelectedReport] = useState<ReportDraft | null>(MOCK_REPORTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const pendingSignOffs = selectedReport?.signOffs.filter((s) => s.required && !s.signedBy).length || 0;
  const totalSignOffs = selectedReport?.signOffs.filter((s) => s.required).length || 0;
  const certificationProgress = totalSignOffs > 0 ? ((totalSignOffs - pendingSignOffs) / totalSignOffs) * 100 : 0;

  const handleGenerateReport = (type: ReportType) => {
    setIsGenerating(true);
    // Simulate API call - backend_pending
    setTimeout(() => {
      const newReport: ReportDraft = {
        id: String(reports.length + 1),
        type,
        title: `${REPORT_TYPE_INFO[type].label} - TechCorp Series A`,
        status: 'draft',
        sections: [
          { id: '1', title: 'Executive Summary', content: 'Auto-generated content...', traceCount: 0 },
        ],
        signOffs: [
          { role: 'Deal Lead', required: true, signedBy: null, signedAt: null },
          { role: 'Risk Officer', required: type === 'risk_report', signedBy: null, signedAt: null },
          { role: 'Partner', required: true, signedBy: null, signedAt: null },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setReports([...reports, newReport]);
      setSelectedReport(newReport);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSignOff = (role: string) => {
    if (!selectedReport) return;
    const updated = {
      ...selectedReport,
      signOffs: selectedReport.signOffs.map((s) =>
        s.role === role ? { ...s, signedBy: 'current-user@company.com', signedAt: new Date() } : s
      ),
    };
    setSelectedReport(updated);
    setReports(reports.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleCertify = () => {
    if (!selectedReport || pendingSignOffs > 0) return;
    const updated = { ...selectedReport, status: 'certified' as ReportStatus };
    setSelectedReport(updated);
    setReports(reports.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Certified Reporting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 9: Generate traceable, certified reports
          </p>
        </div>
        <Button size="sm" onClick={() => router.push(`/cases/${caseId}/monitoring`)}>
          <ChevronRight className="h-4 w-4 mr-2" />
          Continue to Monitoring
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Report List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Reports</h2>
          </div>

          {/* Generate New Report */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Generate Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(REPORT_TYPE_INFO) as ReportType[]).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport(type)}
                  disabled={isGenerating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {REPORT_TYPE_INFO[type].label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Report List */}
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedReport?.id === report.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileOutput className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {REPORT_TYPE_INFO[report.type].label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {getStatusBadge(report.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.updatedAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Detail */}
        <div className="col-span-3">
          {selectedReport ? (
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="traceability">
                  Traceability ({traceLinks.length})
                </TabsTrigger>
                <TabsTrigger value="certification">
                  Certification
                  {pendingSignOffs > 0 && (
                    <span className="ml-1 text-amber-500">({pendingSignOffs})</span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedReport.title}</CardTitle>
                        <CardDescription>
                          {REPORT_TYPE_INFO[selectedReport.type].description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedReport.sections.map((section, i) => (
                        <div key={section.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              {i + 1}. {section.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              <Link2 className="h-3 w-3 mr-1" />
                              {section.traceCount} traces
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Traceability Tab */}
              <TabsContent value="traceability" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Provenance Chain
                    </CardTitle>
                    <CardDescription>
                      Every statement traces back to evidence, rules, and decisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left text-xs font-medium text-muted-foreground py-2">
                            Statement
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-2 w-28">
                            Evidence
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-2 w-24">
                            Rule
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground py-2 w-24">
                            Decision
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {traceLinks.map((trace) => (
                          <tr key={trace.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 text-sm">{trace.statement}</td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {trace.evidenceRef}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {trace.ruleRef}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {trace.decisionRef}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certification Tab */}
              <TabsContent value="certification" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Sign-Off Requirements
                    </CardTitle>
                    <CardDescription>
                      All required sign-offs must be completed before certification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Certification Progress</span>
                        <span className="font-medium">
                          {totalSignOffs - pendingSignOffs} / {totalSignOffs} sign-offs
                        </span>
                      </div>
                      <Progress value={certificationProgress} className="h-2" />
                    </div>

                    {/* Sign-offs */}
                    <div className="space-y-3">
                      {selectedReport.signOffs.map((signOff, i) => (
                        <div
                          key={i}
                          className={`p-3 border rounded-lg ${
                            signOff.signedBy
                              ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900'
                              : signOff.required
                              ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getSignOffIcon(signOff.signedBy)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{signOff.role}</span>
                                  {signOff.required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                {signOff.signedBy ? (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    <User className="h-3 w-3 inline mr-1" />
                                    {signOff.signedBy} • {signOff.signedAt ? formatDateTime(signOff.signedAt) : ''}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Awaiting signature
                                  </div>
                                )}
                              </div>
                            </div>
                            {!signOff.signedBy && (
                              <Button size="sm" onClick={() => handleSignOff(signOff.role)}>
                                Sign Off
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Certify Button */}
                    <div className="pt-4 border-t">
                      {selectedReport.status === 'certified' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Report Certified</span>
                        </div>
                      ) : pendingSignOffs > 0 ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="text-sm">
                            {pendingSignOffs} sign-off{pendingSignOffs > 1 ? 's' : ''} remaining
                          </span>
                        </div>
                      ) : (
                        <Button className="w-full" onClick={handleCertify}>
                          <Shield className="h-4 w-4 mr-2" />
                          Certify Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Distribution */}
                {selectedReport.status === 'certified' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Distribute Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileOutput className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No Report Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a report from the list or generate a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
