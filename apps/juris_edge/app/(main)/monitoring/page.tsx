'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Settings,
  Shield,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  BellOff,
  Archive,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatDateTime } from '@/lib/date-utils';

// Mock data - backend_pending
interface DriftAlert {
  id: string;
  caseId: string;
  caseName: string;
  projectName: string;
  type: 'metric_drift' | 'rule_erosion' | 'policy_shift' | 'threshold_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  metric?: {
    name: string;
    originalValue: string;
    currentValue: string;
    change: number;
  };
}

interface MonitoredCase {
  id: string;
  name: string;
  projectName: string;
  healthScore: number;
  activeAlerts: number;
  metricsTracked: number;
  lastCheck: Date;
  nextCheck: Date;
  status: 'healthy' | 'warning' | 'critical';
}

const MOCK_ALERTS: DriftAlert[] = [
  {
    id: '1',
    caseId: 'case-1',
    caseName: 'TechCorp Series A',
    projectName: 'Growth Fund III',
    type: 'metric_drift',
    severity: 'medium',
    title: 'Revenue Growth Deceleration',
    description: 'MoM revenue growth has dropped from 12% to 6% over the past quarter',
    detectedAt: new Date('2024-03-10'),
    status: 'active',
    metric: { name: 'MoM Revenue Growth', originalValue: '12%', currentValue: '6%', change: -50 },
  },
  {
    id: '2',
    caseId: 'case-2',
    caseName: 'HealthTech B2B Platform',
    projectName: 'Growth Fund III',
    type: 'rule_erosion',
    severity: 'low',
    title: 'Check Size Exception Pattern',
    description: '3 of last 5 deals have required check size exceptions',
    detectedAt: new Date('2024-03-08'),
    status: 'acknowledged',
  },
  {
    id: '3',
    caseId: 'case-1',
    caseName: 'TechCorp Series A',
    projectName: 'Growth Fund III',
    type: 'threshold_breach',
    severity: 'high',
    title: 'Sector Concentration Warning',
    description: 'B2B SaaS concentration has reached 44%, exceeding 40% threshold',
    detectedAt: new Date('2024-03-12'),
    status: 'active',
    metric: { name: 'Sector Concentration', originalValue: '38%', currentValue: '44%', change: 16 },
  },
  {
    id: '4',
    caseId: 'case-3',
    caseName: 'FinServ Infrastructure',
    projectName: 'Growth Fund III',
    type: 'policy_shift',
    severity: 'medium',
    title: 'Regulatory Change Detected',
    description: 'New SEC guidelines may affect portfolio reporting requirements',
    detectedAt: new Date('2024-03-13'),
    status: 'active',
  },
  {
    id: '5',
    caseId: 'case-4',
    caseName: 'Retail Analytics Suite',
    projectName: 'Opportunity Fund I',
    type: 'metric_drift',
    severity: 'critical',
    title: 'Customer Churn Spike',
    description: 'Monthly churn rate increased from 2% to 8%',
    detectedAt: new Date('2024-03-14'),
    status: 'active',
    metric: { name: 'Monthly Churn', originalValue: '2%', currentValue: '8%', change: 300 },
  },
];

const MOCK_MONITORED_CASES: MonitoredCase[] = [
  {
    id: 'case-1',
    name: 'TechCorp Series A',
    projectName: 'Growth Fund III',
    healthScore: 72,
    activeAlerts: 2,
    metricsTracked: 12,
    lastCheck: new Date('2024-03-14T14:30:00'),
    nextCheck: new Date('2024-03-15T14:30:00'),
    status: 'warning',
  },
  {
    id: 'case-2',
    name: 'HealthTech B2B Platform',
    projectName: 'Growth Fund III',
    healthScore: 85,
    activeAlerts: 1,
    metricsTracked: 10,
    lastCheck: new Date('2024-03-14T12:00:00'),
    nextCheck: new Date('2024-03-15T12:00:00'),
    status: 'healthy',
  },
  {
    id: 'case-3',
    name: 'FinServ Infrastructure',
    projectName: 'Growth Fund III',
    healthScore: 68,
    activeAlerts: 1,
    metricsTracked: 8,
    lastCheck: new Date('2024-03-14T10:00:00'),
    nextCheck: new Date('2024-03-15T10:00:00'),
    status: 'warning',
  },
  {
    id: 'case-4',
    name: 'Retail Analytics Suite',
    projectName: 'Opportunity Fund I',
    healthScore: 45,
    activeAlerts: 1,
    metricsTracked: 15,
    lastCheck: new Date('2024-03-14T09:00:00'),
    nextCheck: new Date('2024-03-14T21:00:00'),
    status: 'critical',
  },
  {
    id: 'case-5',
    name: 'Enterprise Security Platform',
    projectName: 'Opportunity Fund I',
    healthScore: 92,
    activeAlerts: 0,
    metricsTracked: 11,
    lastCheck: new Date('2024-03-14T08:00:00'),
    nextCheck: new Date('2024-03-15T08:00:00'),
    status: 'healthy',
  },
];

const ALERT_TYPE_LABELS: Record<DriftAlert['type'], string> = {
  metric_drift: 'Metric Drift',
  rule_erosion: 'Rule Erosion',
  policy_shift: 'Policy Shift',
  threshold_breach: 'Threshold Breach',
};

function getSeverityBadge(severity: DriftAlert['severity']) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'high':
      return <Badge className="bg-red-500">High</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500">Medium</Badge>;
    case 'low':
      return <Badge variant="secondary">Low</Badge>;
  }
}

function getStatusBadge(status: DriftAlert['status']) {
  switch (status) {
    case 'active':
      return <Badge variant="destructive">Active</Badge>;
    case 'acknowledged':
      return <Badge variant="secondary">Acknowledged</Badge>;
    case 'resolved':
      return <Badge className="bg-green-600">Resolved</Badge>;
  }
}

function getHealthBadge(status: MonitoredCase['status']) {
  switch (status) {
    case 'healthy':
      return <Badge className="bg-green-600">Healthy</Badge>;
    case 'warning':
      return <Badge className="bg-amber-500">Warning</Badge>;
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
  }
}

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState<DriftAlert[]>(MOCK_ALERTS);
  const [monitoredCases] = useState<MonitoredCase[]>(MOCK_MONITORED_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Stats
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalAlerts = alerts.filter(
    (a) => (a.severity === 'critical' || a.severity === 'high') && a.status === 'active'
  );
  const healthyCases = monitoredCases.filter((c) => c.status === 'healthy').length;
  const avgHealthScore = Math.round(
    monitoredCases.reduce((sum, c) => sum + c.healthScore, 0) / monitoredCases.length
  );

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' as const } : a)));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drift detection and continuous monitoring across all cases
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Health Check
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className={activeAlerts.length > 0 ? 'border-amber-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Bell className="h-4 w-4" />
              <span className="text-xs">Active Alerts</span>
            </div>
            <div className="text-2xl font-semibold">{activeAlerts.length}</div>
            <div className="text-xs text-muted-foreground">
              {criticalAlerts.length} high priority
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Avg Health Score</span>
            </div>
            <div className="text-2xl font-semibold">{avgHealthScore}%</div>
            <Progress value={avgHealthScore} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs">Healthy Cases</span>
            </div>
            <div className="text-2xl font-semibold text-green-600">
              {healthyCases}/{monitoredCases.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Cases Monitored</span>
            </div>
            <div className="text-2xl font-semibold">{monitoredCases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Last Global Check</span>
            </div>
            <div className="text-2xl font-semibold">2h ago</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts
            {activeAlerts.length > 0 && (
              <span className="ml-1 text-amber-500">({activeAlerts.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cases">Monitored Cases</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">All Clear</h3>
                <p className="text-sm text-muted-foreground">
                  No drift alerts matching your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={
                    alert.status === 'active'
                      ? alert.severity === 'high' || alert.severity === 'critical'
                        ? 'border-red-200 dark:border-red-900'
                        : 'border-amber-200 dark:border-amber-900'
                      : ''
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'high' || alert.severity === 'critical'
                              ? 'text-red-600'
                              : alert.severity === 'medium'
                              ? 'text-amber-600'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            {getSeverityBadge(alert.severity)}
                            {getStatusBadge(alert.status)}
                            <Badge variant="outline">{ALERT_TYPE_LABELS[alert.type]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>

                          <div className="flex items-center gap-4 mt-2">
                            <Link
                              href={`/cases/${alert.caseId}/monitoring`}
                              className="text-xs text-primary hover:underline"
                            >
                              {alert.caseName}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {alert.projectName}
                            </span>
                          </div>

                          {alert.metric && (
                            <div className="mt-2 p-2 bg-muted rounded-md inline-flex items-center gap-4">
                              <div>
                                <span className="text-xs text-muted-foreground">Original: </span>
                                <span className="text-sm font-mono">{alert.metric.originalValue}</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Current: </span>
                                <span className="text-sm font-mono font-medium">
                                  {alert.metric.currentValue}
                                </span>
                              </div>
                              <div
                                className={`text-sm font-mono ${
                                  alert.metric.change < 0 ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {alert.metric.change > 0 ? '+' : ''}
                                {alert.metric.change}%
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Detected {formatDate(alert.detectedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                            <Button size="sm" onClick={() => handleResolve(alert.id)}>
                              Resolve
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" onClick={() => handleResolve(alert.id)}>
                            Resolve
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${alert.caseId}/monitoring`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Case Monitoring
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BellOff className="h-4 w-4 mr-2" />
                              Mute Alert Type
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Monitored Cases Tab */}
        <TabsContent value="cases" className="space-y-4 mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-center">Health Score</TableHead>
                  <TableHead className="text-center">Active Alerts</TableHead>
                  <TableHead className="text-center">Metrics</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/cases/${caseItem.id}/monitoring`}
                        className="font-medium hover:underline"
                      >
                        {caseItem.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.projectName}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Progress
                          value={caseItem.healthScore}
                          className={`h-2 w-16 ${
                            caseItem.healthScore < 50
                              ? '[&>div]:bg-red-500'
                              : caseItem.healthScore < 70
                              ? '[&>div]:bg-amber-500'
                              : ''
                          }`}
                        />
                        <span className="text-sm font-mono">{caseItem.healthScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {caseItem.activeAlerts > 0 ? (
                        <Badge variant="destructive">{caseItem.activeAlerts}</Badge>
                      ) : (
                        <Badge className="bg-green-600">0</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">{caseItem.metricsTracked}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(caseItem.lastCheck)}</div>
                      <div className="text-xs text-muted-foreground">
                        Next: {formatDateTime(caseItem.nextCheck)}
                      </div>
                    </TableCell>
                    <TableCell>{getHealthBadge(caseItem.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${caseItem.id}/monitoring`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Monitoring
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Run Health Check
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure Metrics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
