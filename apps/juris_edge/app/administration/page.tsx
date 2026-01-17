'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Building2,
  Users,
  FolderOpen,
  Mail,
  Database,
  Bot,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Settings,
  Activity,
  ChevronRight,
  Loader2,
  Send,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useJurisAdmin } from '@/contexts/JurisAdminContext';
import type { PlatformStats, SystemHealth, EmailConfiguration } from '@/types/admin';

// Default values while loading
const DEFAULT_STATS: PlatformStats = {
  totalCompanies: 0,
  activeCompanies: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalPortfolios: 0,
  totalCases: 0,
  emailsSent: 0,
  storageUsedGB: 0,
};

const DEFAULT_HEALTH: SystemHealth = {
  database: 'healthy',
  email: 'healthy',
  storage: 'healthy',
  ai: 'healthy',
  lastCheckedAt: new Date(),
};

// Email config from environment
const EMAIL_CONFIG: EmailConfiguration = {
  provider: 'gmail',
  host: process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.NEXT_PUBLIC_SMTP_PORT || '587'),
  secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true',
  user: process.env.NEXT_PUBLIC_SMTP_USER || '',
  fromEmail: process.env.NEXT_PUBLIC_SMTP_FROM_EMAIL || '',
  fromName: process.env.NEXT_PUBLIC_SMTP_FROM_NAME || 'Juris AGI',
  isConfigured: true,
  lastTestAt: null,
  lastTestStatus: null,
};

function getHealthBadge(status: 'healthy' | 'degraded' | 'down' | 'not_configured') {
  switch (status) {
    case 'healthy':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">Healthy</span>
        </div>
      );
    case 'degraded':
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Degraded</span>
        </div>
      );
    case 'down':
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Down</span>
        </div>
      );
    case 'not_configured':
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Not Configured</span>
        </div>
      );
  }
}

export default function AdministrationDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentAdmin, logout } = useJurisAdmin();

  const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
  const [health, setHealth] = useState<SystemHealth>(DEFAULT_HEALTH);
  const [emailConfig] = useState<EmailConfiguration>(EMAIL_CONFIG);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/administration/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch real stats from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats({
              totalCompanies: data.stats.totalCompanies,
              activeCompanies: data.stats.activeCompanies,
              totalUsers: data.stats.totalUsers,
              activeUsers: data.stats.activeUsers,
              totalPortfolios: data.stats.totalPortfolios,
              totalCases: data.stats.totalCases,
              emailsSent: data.stats.emailsSent || 0,
              storageUsedGB: data.stats.storageUsedGB || 0,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  // Fetch real health status from services API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchHealth = async () => {
      try {
        // Test all services in parallel
        const [dbRes, storageRes, aiRes, emailRes] = await Promise.all([
          fetch('/api/services/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: 'database' }),
          }).catch(() => null),
          fetch('/api/services/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: 'storage' }),
          }).catch(() => null),
          fetch('/api/services/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service: 'ai' }),
          }).catch(() => null),
          fetch('/api/email/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test-connection' }),
          }).catch(() => null),
        ]);

        const [dbData, storageData, aiData, emailData] = await Promise.all([
          dbRes?.ok ? dbRes.json() : null,
          storageRes?.ok ? storageRes.json() : null,
          aiRes?.ok ? aiRes.json() : null,
          emailRes?.ok ? emailRes.json() : null,
        ]);

        setHealth({
          database: dbData?.success ? 'healthy' : 'down',
          storage: storageData?.success ? 'healthy' : 'down',
          ai: aiData?.success ? 'healthy' : 'down',
          email: emailData?.success ? 'healthy' : 'down',
          lastCheckedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to fetch health:', error);
      }
    };

    fetchHealth();
  }, [isAuthenticated]);

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;

    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-test', to: testEmailAddress }),
      });

      const result = await response.json();

      setTestEmailResult({
        success: result.success,
        message: result.success
          ? `Test email sent successfully to ${testEmailAddress}`
          : result.error || 'Failed to send test email',
      });
    } catch {
      setTestEmailResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    }

    setIsSendingTestEmail(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">Juris Admin</h1>
                <p className="text-xs text-muted-foreground">Platform Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{currentAdmin?.name}</p>
                <p className="text-xs text-muted-foreground">{currentAdmin?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Platform Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/administration/companies">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{stats.totalCompanies}</div>
                      <div className="text-xs text-muted-foreground">Companies</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/administration/users">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{stats.totalUsers}</div>
                      <div className="text-xs text-muted-foreground">Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.totalPortfolios}</div>
                    <div className="text-xs text-muted-foreground">Portfolios</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.emailsSent.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Emails Sent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* System Health */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <Link href="/administration/services">
              <Button variant="ghost" size="sm">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <Link href="/administration/services">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors">
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Database</span>
                    </div>
                    {getHealthBadge(health.database)}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Email</span>
                    </div>
                    {getHealthBadge(health.email)}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Cloud className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Storage</span>
                    </div>
                    {getHealthBadge(health.storage)}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">AI Services</span>
                    </div>
                    {getHealthBadge(health.ai)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Email Configuration */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Gmail SMTP
                    <Badge variant="outline" className="ml-2">
                      {emailConfig.isConfigured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Email service for notifications, invitations, and system alerts
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTestEmailDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">SMTP Host</p>
                  <p className="font-medium">{emailConfig.host}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Port</p>
                  <p className="font-medium">{emailConfig.port}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Security</p>
                  <p className="font-medium">{emailConfig.secure ? 'TLS' : 'STARTTLS'}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Account</p>
                  <p className="font-medium">{emailConfig.user}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">From Email</p>
                  <p className="font-medium">{emailConfig.fromEmail}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">From Name</p>
                  <p className="font-medium">{emailConfig.fromName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Administration</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/administration/companies">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Companies</p>
                        <p className="text-xs text-muted-foreground">Manage tenant organizations</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/administration/users">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Users</p>
                        <p className="text-xs text-muted-foreground">Manage admins & tenant users</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/administration/settings">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Settings</p>
                        <p className="text-xs text-muted-foreground">Platform configuration</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/administration/services">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Server className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium">Services</p>
                        <p className="text-xs text-muted-foreground">Infrastructure & API keys</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/administration/activity">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Activity Logs</p>
                        <p className="text-xs text-muted-foreground">Audit and monitoring</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      {/* Test Email Dialog */}
      <Dialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify the SMTP configuration is working correctly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
            {testEmailResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  testEmailResult.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {testEmailResult.message}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestEmail} disabled={isSendingTestEmail || !testEmailAddress}>
              {isSendingTestEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
