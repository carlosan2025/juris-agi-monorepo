'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Settings,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/date-utils';

// Mock data - backend_pending
interface DriftAlert {
  id: string;
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

interface HealthMetric {
  name: string;
  category: string;
  currentValue: number;
  baselineValue: number;
  threshold: { warning: number; critical: number };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface MonitoringSchedule {
  type: string;
  frequency: string;
  lastRun: Date;
  nextRun: Date;
  status: 'healthy' | 'overdue' | 'disabled';
}

const MOCK_ALERTS: DriftAlert[] = [
  {
    id: '1',
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
    type: 'rule_erosion',
    severity: 'low',
    title: 'Check Size Exception Pattern',
    description: '3 of last 5 deals have required check size exceptions',
    detectedAt: new Date('2024-03-08'),
    status: 'acknowledged',
  },
  {
    id: '3',
    type: 'threshold_breach',
    severity: 'high',
    title: 'Sector Concentration Warning',
    description: 'B2B SaaS concentration has reached 44%, exceeding 40% threshold',
    detectedAt: new Date('2024-03-12'),
    status: 'active',
    metric: { name: 'Sector Concentration', originalValue: '38%', currentValue: '44%', change: 16 },
  },
];

const MOCK_METRICS: HealthMetric[] = [
  { name: 'Revenue', category: 'Financial', currentValue: 2800000, baselineValue: 2400000, threshold: { warning: 2000000, critical: 1500000 }, trend: 'up', lastUpdated: new Date('2024-03-12') },
  { name: 'Growth Rate', category: 'Financial', currentValue: 110, baselineValue: 142, threshold: { warning: 80, critical: 50 }, trend: 'down', lastUpdated: new Date('2024-03-12') },
  { name: 'Gross Margin', category: 'Financial', currentValue: 66, baselineValue: 68, threshold: { warning: 55, critical: 45 }, trend: 'down', lastUpdated: new Date('2024-03-12') },
  { name: 'Customer Count', category: 'Traction', currentValue: 52, baselineValue: 45, threshold: { warning: 30, critical: 20 }, trend: 'up', lastUpdated: new Date('2024-03-12') },
  { name: 'Net Retention', category: 'Traction', currentValue: 115, baselineValue: 120, threshold: { warning: 100, critical: 90 }, trend: 'down', lastUpdated: new Date('2024-03-12') },
];

const MOCK_SCHEDULES: MonitoringSchedule[] = [
  { type: 'Financial Health Check', frequency: 'Monthly', lastRun: new Date('2024-03-01'), nextRun: new Date('2024-04-01'), status: 'healthy' },
  { type: 'KPI Dashboard Refresh', frequency: 'Weekly', lastRun: new Date('2024-03-11'), nextRun: new Date('2024-03-18'), status: 'healthy' },
  { type: 'Portfolio Concentration', frequency: 'Daily', lastRun: new Date('2024-03-13'), nextRun: new Date('2024-03-14'), status: 'healthy' },
  { type: 'Covenant Compliance', frequency: 'Quarterly', lastRun: new Date('2024-01-15'), nextRun: new Date('2024-04-15'), status: 'healthy' },
];

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

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatValue(value: number, name: string): string {
  if (name.toLowerCase().includes('revenue')) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (name.toLowerCase().includes('rate') || name.toLowerCase().includes('margin') || name.toLowerCase().includes('retention')) {
    return `${value}%`;
  }
  return value.toString();
}

export default function MonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [alerts, setAlerts] = useState<DriftAlert[]>(MOCK_ALERTS);
  const [metrics] = useState<HealthMetric[]>(MOCK_METRICS);
  const [schedules] = useState<MonitoringSchedule[]>(MOCK_SCHEDULES);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' as const } : a)));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Monitoring & Drift Detection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step 10: Continuous monitoring for performance drift and policy erosion
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure Alerts
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Run Health Check
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
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
              <span className="text-xs">Health Score</span>
            </div>
            <div className="text-2xl font-semibold text-green-600">Good</div>
            <Progress value={75} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Last Check</span>
            </div>
            <div className="text-2xl font-semibold">Today</div>
            <div className="text-xs text-muted-foreground">2:34 PM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Metrics Tracked</span>
            </div>
            <div className="text-2xl font-semibold">{metrics.length}</div>
            <div className="text-xs text-muted-foreground">across {schedules.length} schedules</div>
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
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="schedules">Monitoring Schedules</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">All Clear</h3>
                <p className="text-sm text-muted-foreground">
                  No drift alerts detected. Monitoring is running normally.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
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
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>

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
                        <Button size="sm" variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Investment Health Metrics</CardTitle>
              <CardDescription>
                Tracked metrics vs original baseline values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-muted-foreground py-2">
                      Metric
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground py-2 w-24">
                      Category
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-24">
                      Baseline
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-24">
                      Current
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground py-2 w-20">
                      Trend
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2 w-32">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, i) => {
                    const isWarning =
                      metric.currentValue <= metric.threshold.warning &&
                      metric.currentValue > metric.threshold.critical;
                    const isCritical = metric.currentValue <= metric.threshold.critical;
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 text-sm font-medium">{metric.name}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {metric.category}
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-sm font-mono text-muted-foreground">
                          {formatValue(metric.baselineValue, metric.name)}
                        </td>
                        <td className="py-3 text-right text-sm font-mono font-medium">
                          {formatValue(metric.currentValue, metric.name)}
                        </td>
                        <td className="py-3 text-center">{getTrendIcon(metric.trend)}</td>
                        <td className="py-3 text-right">
                          {isCritical ? (
                            <Badge variant="destructive">Critical</Badge>
                          ) : isWarning ? (
                            <Badge className="bg-amber-500">Warning</Badge>
                          ) : (
                            <Badge className="bg-green-600">Healthy</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monitoring Schedules</CardTitle>
              <CardDescription>Automated health checks and reporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map((schedule, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {schedule.status === 'healthy' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : schedule.status === 'overdue' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{schedule.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.frequency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        Last: {formatDate(schedule.lastRun)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Next: {formatDate(schedule.nextRun)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Run Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
