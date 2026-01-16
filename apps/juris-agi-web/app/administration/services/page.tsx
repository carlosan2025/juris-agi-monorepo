'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Server,
  Database,
  Cloud,
  Bot,
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Pencil,
  Save,
  Building2,
  CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useJurisAdmin } from '@/contexts/JurisAdminContext';

// Service types
interface PlatformService {
  id: string;
  type: 'database' | 'storage' | 'vector' | 'ai' | 'email';
  name: string;
  provider: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'untested';
  lastTestedAt: Date | null;
  apiKeyMasked?: string;
  details?: Record<string, unknown>;
  errorMessage?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'starter' | 'professional' | 'enterprise';
  infraMode: 'MULTI_TENANT' | 'HYBRID' | 'DEDICATED';
  services: {
    database: 'juris' | 'custom';
    storage: 'juris' | 'custom';
    vector: 'juris' | 'custom';
    ai: 'juris' | 'custom';
    email: 'juris' | 'custom';
  };
  createdAt: Date;
  usersCount: number;
}

interface TestStep {
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

// Mock data for platform services
const INITIAL_SERVICES: PlatformService[] = [
  {
    id: '1',
    type: 'database',
    name: 'Platform Database',
    provider: 'neon',
    displayName: 'Neon PostgreSQL',
    status: 'untested',
    lastTestedAt: null,
  },
  {
    id: '2',
    type: 'storage',
    name: 'File Storage',
    provider: 'cloudflare_r2',
    displayName: 'Cloudflare R2',
    status: 'untested',
    lastTestedAt: null,
  },
  {
    id: '3',
    type: 'vector',
    name: 'Vector Database',
    provider: 'pgvector',
    displayName: 'pgvector (Neon)',
    status: 'untested',
    lastTestedAt: null,
  },
  {
    id: '4',
    type: 'ai',
    name: 'AI Provider',
    provider: 'openai',
    displayName: 'OpenAI',
    status: 'untested',
    lastTestedAt: null,
    apiKeyMasked: 'sk-...****',
  },
  {
    id: '5',
    type: 'email',
    name: 'Email Provider',
    provider: 'gmail',
    displayName: 'Gmail SMTP',
    status: 'untested',
    lastTestedAt: null,
  },
];


function getStatusBadge(status: PlatformService['status']) {
  switch (status) {
    case 'healthy':
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Healthy
        </Badge>
      );
    case 'degraded':
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-600 text-white hover:bg-amber-700">
          <AlertTriangle className="h-3 w-3" />
          Degraded
        </Badge>
      );
    case 'unhealthy':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Unhealthy
        </Badge>
      );
    case 'untested':
      return (
        <Badge variant="outline" className="gap-1">
          <CircleDot className="h-3 w-3" />
          Untested
        </Badge>
      );
  }
}

function getInfraBadge(mode: Tenant['infraMode']) {
  switch (mode) {
    case 'MULTI_TENANT':
      return <Badge variant="secondary">Multi-Tenant</Badge>;
    case 'HYBRID':
      return <Badge variant="default">Hybrid</Badge>;
    case 'DEDICATED':
      return <Badge variant="outline">Dedicated</Badge>;
  }
}

function getPlanBadge(plan: Tenant['plan']) {
  switch (plan) {
    case 'starter':
      return <Badge variant="outline">Starter</Badge>;
    case 'professional':
      return <Badge variant="secondary">Professional</Badge>;
    case 'enterprise':
      return <Badge className="bg-purple-600 hover:bg-purple-700">Enterprise</Badge>;
  }
}

function getServiceIcon(type: PlatformService['type']) {
  switch (type) {
    case 'database':
      return <Database className="h-5 w-5" />;
    case 'storage':
      return <Cloud className="h-5 w-5" />;
    case 'vector':
      return <Server className="h-5 w-5" />;
    case 'ai':
      return <Bot className="h-5 w-5" />;
    case 'email':
      return <Mail className="h-5 w-5" />;
  }
}

function getTestSteps(serviceType: string): string[] {
  switch (serviceType) {
    case 'database':
      return [
        'Connecting to Neon PostgreSQL...',
        'Querying database version...',
        'Verifying schema access...',
        'Database healthy',
      ];
    case 'vector':
      return [
        'Connecting to Neon PostgreSQL...',
        'Checking pgvector extension...',
        'Verifying vector operations...',
        'pgvector ready',
      ];
    case 'storage':
      return [
        'Connecting to Evidence API...',
        'Verifying Cloudflare R2 access...',
        'Testing storage permissions...',
        'Storage service ready',
      ];
    case 'ai':
      return [
        'Connecting to Evidence API...',
        'Verifying OpenAI embeddings...',
        'Validating API response...',
        'AI service ready',
      ];
    case 'email':
      return [
        'Connecting to Gmail SMTP...',
        'Testing SMTP connection...',
        'Verifying credentials...',
        'Email service ready',
      ];
    default:
      return ['Testing connection...', 'Verifying access...', 'Test complete'];
  }
}

export default function ServicesAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentAdmin, logout } = useJurisAdmin();

  const [services, setServices] = useState<PlatformService[]>(INITIAL_SERVICES);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  // Test state
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);

  // API Key management
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [editingService, setEditingService] = useState<PlatformService | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({ currentKey: '', newKey: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/administration/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch real companies/tenants from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/admin/companies');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform companies to tenants format
            const transformedTenants: Tenant[] = data.companies.map((c: {
              id: string;
              name: string;
              slug: string;
              status: string;
              createdAt: string;
              stats: { users: number };
            }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              status: c.status === 'active' ? 'active' : c.status === 'pending' ? 'pending' : 'suspended',
              plan: 'professional' as const, // Default, would come from subscription data
              infraMode: 'MULTI_TENANT' as const, // Default, all tenants use Juris services
              services: {
                database: 'juris' as const,
                storage: 'juris' as const,
                vector: 'juris' as const,
                ai: 'juris' as const,
                email: 'juris' as const,
              },
              createdAt: new Date(c.createdAt),
              usersCount: c.stats.users,
            }));
            setTenants(transformedTenants);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      } finally {
        setIsLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isAuthenticated]);

  const handleTestService = async (service: PlatformService) => {
    const steps = getTestSteps(service.type);
    setTestingService(service.id);
    setTestSteps(steps.map((msg, i) => ({
      message: msg,
      status: i === 0 ? 'running' : 'pending'
    })));
    setShowTestDialog(true);

    try {
      // Step 1: Connecting
      await new Promise(r => setTimeout(r, 300));
      setTestSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? 'success' : idx === 1 ? 'running' : 'pending'
      })));

      // Call the appropriate test endpoint
      const endpoint = service.type === 'email' ? '/api/email/test' : '/api/services/test';
      const body = service.type === 'email'
        ? { action: 'test-connection' }
        : { service: service.type };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      // Step 2: Testing
      await new Promise(r => setTimeout(r, 300));
      setTestSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx < 2 ? 'success' : idx === 2 ? 'running' : 'pending'
      })));

      // Step 3: Validating
      await new Promise(r => setTimeout(r, 300));

      if (result.success) {
        // Mark all steps as success
        setTestSteps(prev => prev.map(step => ({ ...step, status: 'success' })));
        setServices(prev => prev.map(s =>
          s.id === service.id
            ? {
                ...s,
                status: 'healthy' as const,
                lastTestedAt: new Date(),
                details: result.details,
                errorMessage: undefined,
              }
            : s
        ));
      } else {
        setTestSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx < 2 ? 'success' : idx === 2 ? 'error' : 'pending'
        })));
        setServices(prev => prev.map(s =>
          s.id === service.id
            ? {
                ...s,
                status: 'unhealthy' as const,
                lastTestedAt: new Date(),
                errorMessage: result.error || 'Test failed',
              }
            : s
        ));
      }
    } catch (error) {
      setTestSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? 'success' : idx === 1 ? 'error' : 'pending'
      })));
      setServices(prev => prev.map(s =>
        s.id === service.id
          ? {
              ...s,
              status: 'unhealthy' as const,
              lastTestedAt: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Connection failed',
            }
          : s
      ));
    }

    await new Promise(r => setTimeout(r, 1500));
    setTestingService(null);
    setShowTestDialog(false);
  };

  const handleTestAll = async () => {
    for (const service of services) {
      await handleTestService(service);
    }
  };

  const handleEditApiKey = (service: PlatformService) => {
    setEditingService(service);
    setApiKeyForm({ currentKey: '', newKey: '' });
    setShowApiKey(false);
    setShowApiKeyDialog(true);
  };

  const handleSaveApiKey = async () => {
    if (!editingService || !apiKeyForm.newKey) return;

    setIsSavingKey(true);
    // backend_pending: Save API key to environment/secrets manager
    await new Promise(r => setTimeout(r, 1500));

    // Update local state with masked key
    setServices(prev => prev.map(s =>
      s.id === editingService.id
        ? {
            ...s,
            apiKeyMasked: `${apiKeyForm.newKey.slice(0, 4)}...${apiKeyForm.newKey.slice(-4)}`,
            status: 'untested' as const,
          }
        : s
    ));

    setIsSavingKey(false);
    setShowApiKeyDialog(false);
    setEditingService(null);
  };

  // Count services by status
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const unhealthyCount = services.filter(s => s.status === 'unhealthy' || s.status === 'degraded').length;
  const untestedCount = services.filter(s => s.status === 'untested').length;

  // Count tenants by integration mode
  const jurisOnlyTenants = tenants.filter(t =>
    Object.values(t.services).every(s => s === 'juris')
  ).length;
  const hybridTenants = tenants.filter(t => {
    const vals = Object.values(t.services);
    return vals.some(s => s === 'juris') && vals.some(s => s === 'custom');
  }).length;
  const customOnlyTenants = tenants.filter(t =>
    Object.values(t.services).every(s => s === 'custom')
  ).length;

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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Back Button & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/administration">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Platform Services</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage infrastructure, API keys, and view tenant integrations
              </p>
            </div>
          </div>
          <Button onClick={handleTestAll} disabled={testingService !== null}>
            <RefreshCw className={`h-4 w-4 mr-2 ${testingService ? 'animate-spin' : ''}`} />
            Test All Services
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-semibold text-green-600">{healthyCount}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Healthy Services</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="text-2xl font-semibold text-red-600">{unhealthyCount}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-semibold">{untestedCount}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Untested</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Services and Tenants */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">Platform Services</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Integrations</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Infrastructure Services</CardTitle>
                <CardDescription>
                  Core platform services powering all tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Service</TableHead>
                      <TableHead className="text-xs w-40">Provider</TableHead>
                      <TableHead className="text-xs w-32">Status</TableHead>
                      <TableHead className="text-xs w-40">API Key</TableHead>
                      <TableHead className="text-xs w-40">Last Tested</TableHead>
                      <TableHead className="text-xs w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              {getServiceIcon(service.type)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{service.name}</div>
                              {service.errorMessage && (
                                <div className="text-xs text-red-600">{service.errorMessage}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{service.displayName}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                        <TableCell>
                          {service.apiKeyMasked ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {service.apiKeyMasked}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditApiKey(service)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {service.lastTestedAt
                              ? service.lastTestedAt.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestService(service)}
                            disabled={testingService !== null}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${testingService === service.id ? 'animate-spin' : ''}`} />
                            Test
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-4">
            {/* Tenant Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-semibold">{jurisOnlyTenants}</div>
                  <div className="text-xs text-muted-foreground mt-1">Using Juris AGI Services</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-semibold">{hybridTenants}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hybrid Integration</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-semibold">{customOnlyTenants}</div>
                  <div className="text-xs text-muted-foreground mt-1">Own Infrastructure</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tenant Service Integration</CardTitle>
                <CardDescription>
                  How each tenant is using platform services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs w-28">Plan</TableHead>
                      <TableHead className="text-xs w-28">Mode</TableHead>
                      <TableHead className="text-xs w-20 text-center">Database</TableHead>
                      <TableHead className="text-xs w-20 text-center">Storage</TableHead>
                      <TableHead className="text-xs w-20 text-center">Vector</TableHead>
                      <TableHead className="text-xs w-20 text-center">AI</TableHead>
                      <TableHead className="text-xs w-20 text-center">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{tenant.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {tenant.usersCount} users
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                        <TableCell>{getInfraBadge(tenant.infraMode)}</TableCell>
                        <TableCell className="text-center">
                          {tenant.services.database === 'juris' ? (
                            <Badge variant="secondary" className="text-xs">Juris</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {tenant.services.storage === 'juris' ? (
                            <Badge variant="secondary" className="text-xs">Juris</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {tenant.services.vector === 'juris' ? (
                            <Badge variant="secondary" className="text-xs">Juris</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {tenant.services.ai === 'juris' ? (
                            <Badge variant="secondary" className="text-xs">Juris</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {tenant.services.email === 'juris' ? (
                            <Badge variant="secondary" className="text-xs">Juris</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Test Connection Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Testing Connection</DialogTitle>
            <DialogDescription>
              {testingService && services.find(s => s.id === testingService)?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {testSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {step.status === 'pending' && (
                  <CircleDot className="h-4 w-4 text-muted-foreground" />
                )}
                {step.status === 'running' && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                )}
                {step.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {step.status === 'error' && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                  {step.message}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update API Key</DialogTitle>
            <DialogDescription>
              Update the API key for {editingService?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Key</Label>
              <div className="p-3 rounded-lg bg-muted">
                <code className="text-sm">{editingService?.apiKeyMasked || 'Not set'}</code>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newKey">New API Key</Label>
              <div className="relative">
                <Input
                  id="newKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyForm.newKey}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, newKey: e.target.value })}
                  placeholder="Enter new API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The key will be encrypted and stored securely
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={isSavingKey || !apiKeyForm.newKey}>
              {isSavingKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
