'use client';

import { useState } from 'react';
import {
  Bot,
  Mail,
  Cloud,
  Database,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Plug,
  Shield,
  ArrowRight,
  Building2,
  Layers,
  CircleDot,
  Pencil,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useNavigation } from '@/contexts/NavigationContext';
import {
  AI_PROVIDERS,
  EMAIL_PROVIDERS,
  STORAGE_PROVIDERS,
  VECTOR_PROVIDERS,
  type PlatformAIProvider,
  type EmailProvider as EmailProviderType,
} from '@/types/domain';

// Infrastructure modes
type InfrastructureMode = 'MULTI_TENANT' | 'HYBRID' | 'DEDICATED';
type ServiceMode = 'SHARED' | 'PLATFORM' | 'DEDICATED';

// Service status types
type ServiceStatus = 'active' | 'disabled' | 'error';

interface InfrastructureConfig {
  mode: InfrastructureMode;
  databaseMode: ServiceMode;
  storageMode: ServiceMode;
  vectorDbMode: ServiceMode;
  aiMode: ServiceMode;
  emailMode: ServiceMode;
  migrationInProgress: boolean;
  migrationStep?: string;
}

interface ServiceConfig {
  id: string;
  provider: string;
  displayName: string;
  status: ServiceStatus;
  isPrimary: boolean;
  apiKeyMasked?: string;
  lastTestedAt: Date | null;
  testStatus: 'success' | 'failed' | 'untested';
  source: 'juris' | 'custom'; // Simplified: juris = managed by Juris AGI, custom = tenant's own
  errorMessage?: string;
  // Usage stats for storage services
  usage?: {
    used: number; // in bytes, MB, GB depending on service
    unit: string;
    limit?: number;
  };
}

interface TestStep {
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

// Mock data for infrastructure config
const MOCK_INFRA_CONFIG: InfrastructureConfig = {
  mode: 'MULTI_TENANT',
  databaseMode: 'SHARED',
  storageMode: 'SHARED',
  vectorDbMode: 'SHARED',
  aiMode: 'PLATFORM',
  emailMode: 'PLATFORM',
  migrationInProgress: false,
};

// Initial state for all 5 services - will be populated by real API calls
const INITIAL_SERVICES: Record<string, ServiceConfig> = {
  database: {
    id: '1',
    provider: 'neon',
    displayName: 'Neon PostgreSQL',
    status: 'active',
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    source: 'juris',
    usage: {
      used: 0,
      unit: 'GB',
      limit: 10,
    },
  },
  storage: {
    id: '2',
    provider: 'cloudflare_r2',
    displayName: 'Cloudflare R2',
    status: 'active',
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    source: 'juris',
    usage: {
      used: 0,
      unit: 'GB',
      limit: 100,
    },
  },
  vector: {
    id: '3',
    provider: 'pgvector',
    displayName: 'pgvector (Neon)',
    status: 'active',
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    source: 'juris',
    usage: {
      used: 0,
      unit: 'vectors',
    },
  },
  ai: {
    id: '4',
    provider: 'openai',
    displayName: 'OpenAI',
    status: 'active',
    isPrimary: true,
    apiKeyMasked: 'sk-...****',
    lastTestedAt: null,
    testStatus: 'untested',
    source: 'juris',
  },
  email: {
    id: '5',
    provider: 'sendgrid',
    displayName: 'SendGrid',
    status: 'active',
    isPrimary: true,
    lastTestedAt: null,
    testStatus: 'untested',
    source: 'juris',
  },
};

function getStatusBadge(status: ServiceStatus, testStatus?: 'success' | 'failed' | 'untested') {
  if (status === 'error' || testStatus === 'failed') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }
  if (status === 'active' && testStatus === 'success') {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (status === 'disabled') {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleDot className="h-3 w-3" />
        Disabled
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Untested
    </Badge>
  );
}

function getSourceBadge(source: 'juris' | 'custom') {
  if (source === 'juris') {
    return <Badge variant="secondary">Juris AGI</Badge>;
  }
  return <Badge variant="default">Custom</Badge>;
}

function getInfraModeInfo(mode: InfrastructureMode) {
  switch (mode) {
    case 'MULTI_TENANT':
      return {
        label: 'Multi-Tenant',
        description: 'Using Juris AGI managed infrastructure with data isolation',
        badge: 'default' as const,
        icon: Layers,
      };
    case 'HYBRID':
      return {
        label: 'Hybrid',
        description: 'Mix of Juris AGI and your own services',
        badge: 'secondary' as const,
        icon: Building2,
      };
    case 'DEDICATED':
      return {
        label: 'Dedicated',
        description: 'Using your own infrastructure',
        badge: 'outline' as const,
        icon: Building2,
      };
  }
}

function formatUsage(usage: ServiceConfig['usage']): string {
  if (!usage) return '';
  if (usage.unit === 'vectors') {
    return `${(usage.used / 1000).toFixed(0)}K ${usage.unit}`;
  }
  return `${usage.used} ${usage.unit}`;
}

function formatUsageWithLimit(usage: ServiceConfig['usage']): string {
  if (!usage) return '';
  if (usage.limit) {
    return `${usage.used} / ${usage.limit} ${usage.unit}`;
  }
  return formatUsage(usage);
}

// Test steps for different service types - actual Evidence API health checks
function getTestSteps(serviceType: string, provider: string): string[] {
  switch (serviceType) {
    case 'ai':
      return [
        'Connecting to Evidence API...',
        `Verifying ${provider} embeddings available...`,
        'Validating API response...',
        'AI service ready',
      ];
    case 'email':
      return [
        `Connecting to ${provider}...`,
        'Testing SMTP connection...',
        'Verifying credentials...',
        'Email service ready',
      ];
    case 'storage':
      return [
        'Connecting to Evidence API...',
        `Verifying ${provider} access...`,
        'Testing storage permissions...',
        'Storage service ready',
      ];
    case 'database':
      return [
        'Connecting to Neon PostgreSQL...',
        'Querying database version...',
        'Verifying tenant access...',
        'Database healthy',
      ];
    case 'vector':
      return [
        'Connecting to Neon PostgreSQL...',
        'Checking pgvector extension...',
        'Verifying vector operations...',
        'pgvector ready',
      ];
    default:
      return ['Testing connection...', 'Verifying access...', 'Test complete'];
  }
}

export default function SettingsPage() {
  const { isAdmin } = useNavigation();
  const [infraConfig] = useState<InfrastructureConfig>(MOCK_INFRA_CONFIG);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configType, setConfigType] = useState<'ai' | 'email' | 'storage' | 'database' | 'vector'>('ai');
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Test state
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const infraModeInfo = getInfraModeInfo(infraConfig.mode);
  const InfraModeIcon = infraModeInfo.icon;

  // Count services by status (all 5 services)
  const serviceList = Object.values(services);
  const activeCount = serviceList.filter(s => s.status === 'active' && s.testStatus === 'success').length;
  const errorCount = serviceList.filter(s => s.status === 'error' || s.testStatus === 'failed').length;
  const disabledCount = serviceList.filter(s => s.status === 'disabled').length;
  const untestedCount = serviceList.filter(s => s.testStatus === 'untested').length;

  const handleOpenConfig = (type: 'ai' | 'email' | 'storage' | 'database' | 'vector', editing = false) => {
    setConfigType(type);
    setIsEditing(editing);
    const currentService = services[type];
    if (currentService && editing) {
      setConfigForm({
        provider: currentService.provider,
      });
    } else {
      setConfigForm({});
    }
    setShowApiKey(false);
    setShowConfigDialog(true);
  };

  const handleTestConnection = async (type: string) => {
    const service = services[type];
    if (!service) return;

    const steps = getTestSteps(type, service.displayName);
    setTestingService(type);
    setTestSteps(steps.map((msg, i) => ({
      message: msg,
      status: i === 0 ? 'running' : 'pending'
    })));
    setShowTestDialog(true);

    // For email service, use the existing email test API
    if (type === 'email') {
      try {
        // Step 1: Connecting
        await new Promise(r => setTimeout(r, 500));
        setTestSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? 'success' : idx === 1 ? 'running' : 'pending'
        })));

        // Call email test API
        const response = await fetch('/api/email/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test-connection' }),
        });
        const result = await response.json();

        if (result.success) {
          // Mark remaining steps as success
          setTestSteps(prev => prev.map(step => ({ ...step, status: 'success' })));
          setServices(prev => ({
            ...prev,
            [type]: { ...prev[type], lastTestedAt: new Date(), testStatus: 'success' as const, errorMessage: undefined }
          }));
        } else {
          // Mark as error
          setTestSteps(prev => prev.map((step, idx) => ({
            ...step,
            status: idx < 2 ? 'success' : idx === 2 ? 'error' : 'pending'
          })));
          setServices(prev => ({
            ...prev,
            [type]: { ...prev[type], lastTestedAt: new Date(), testStatus: 'failed' as const, errorMessage: result.error }
          }));
        }
      } catch (error) {
        setTestSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? 'success' : idx === 1 ? 'error' : 'pending'
        })));
        setServices(prev => ({
          ...prev,
          [type]: { ...prev[type], lastTestedAt: new Date(), testStatus: 'failed' as const, errorMessage: 'Connection failed' }
        }));
      }
    } else {
      // For infrastructure services (database, storage, vector, ai), call Evidence API
      try {
        // Step 1: Connecting
        await new Promise(r => setTimeout(r, 300));
        setTestSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? 'success' : idx === 1 ? 'running' : 'pending'
        })));

        // Call Evidence API test endpoint
        const response = await fetch('/api/services/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: type }),
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
          setServices(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              lastTestedAt: new Date(),
              testStatus: 'success' as const,
              errorMessage: undefined,
              // Update usage if available from result
              usage: type === 'vector' && result.details?.pgvectorVersion
                ? { ...prev[type].usage!, used: 0, unit: 'vectors' }
                : prev[type].usage,
            }
          }));
        } else {
          // Mark as error at the validation step
          setTestSteps(prev => prev.map((step, idx) => ({
            ...step,
            status: idx < 2 ? 'success' : idx === 2 ? 'error' : 'pending'
          })));
          setServices(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              lastTestedAt: new Date(),
              testStatus: 'failed' as const,
              errorMessage: result.error || 'Test failed'
            }
          }));
        }
      } catch (error) {
        // Network error - mark second step as error
        setTestSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? 'success' : idx === 1 ? 'error' : 'pending'
        })));
        setServices(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            lastTestedAt: new Date(),
            testStatus: 'failed' as const,
            errorMessage: error instanceof Error ? error.message : 'Connection failed'
          }
        }));
      }
    }

    // Keep dialog open briefly to show result
    await new Promise(r => setTimeout(r, 1500));
    setTestingService(null);
    setShowTestDialog(false);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    // backend_pending: Save service configuration
    await new Promise((r) => setTimeout(r, 1500));

    const newService: ServiceConfig = {
      id: Date.now().toString(),
      provider: configForm.provider,
      displayName: getProviderDisplayName(configType, configForm.provider),
      status: 'active',
      isPrimary: true,
      apiKeyMasked: configForm.apiKey ? `${configForm.apiKey.slice(0, 4)}...${configForm.apiKey.slice(-4)}` : undefined,
      lastTestedAt: null,
      testStatus: 'untested',
      source: 'custom',
    };

    setServices(prev => ({ ...prev, [configType]: newService }));
    setIsSaving(false);
    setShowConfigDialog(false);
  };

  const handleRevertToJuris = async (type: 'ai' | 'email' | 'storage' | 'database' | 'vector') => {
    // Revert to Juris AGI managed defaults
    const jurisDefaults: Record<string, ServiceConfig> = {
      database: {
        id: '1',
        provider: 'neon',
        displayName: 'Neon PostgreSQL',
        status: 'active',
        isPrimary: true,
        lastTestedAt: null,
        testStatus: 'untested',
        source: 'juris',
        usage: { used: 0, unit: 'GB', limit: 10 },
      },
      storage: {
        id: '2',
        provider: 'cloudflare_r2',
        displayName: 'Cloudflare R2',
        status: 'active',
        isPrimary: true,
        lastTestedAt: null,
        testStatus: 'untested',
        source: 'juris',
        usage: { used: 0, unit: 'GB', limit: 100 },
      },
      vector: {
        id: '3',
        provider: 'pgvector',
        displayName: 'pgvector (Neon)',
        status: 'active',
        isPrimary: true,
        lastTestedAt: null,
        testStatus: 'untested',
        source: 'juris',
        usage: { used: 0, unit: 'vectors' },
      },
      ai: {
        id: '4',
        provider: 'openai',
        displayName: 'OpenAI',
        status: 'active',
        isPrimary: true,
        lastTestedAt: null,
        testStatus: 'untested',
        source: 'juris',
      },
      email: {
        id: '5',
        provider: 'sendgrid',
        displayName: 'SendGrid',
        status: 'active',
        isPrimary: true,
        lastTestedAt: null,
        testStatus: 'untested',
        source: 'juris',
      },
    };
    setServices(prev => ({ ...prev, [type]: jurisDefaults[type] }));
  };

  const getProviderDisplayName = (type: string, provider: string): string => {
    if (type === 'ai') return AI_PROVIDERS[provider as PlatformAIProvider]?.displayName || provider;
    if (type === 'email') return EMAIL_PROVIDERS[provider as EmailProviderType]?.displayName || provider;
    if (type === 'storage') return STORAGE_PROVIDERS[provider as keyof typeof STORAGE_PROVIDERS]?.displayName || provider;
    if (type === 'vector') return VECTOR_PROVIDERS[provider as keyof typeof VECTOR_PROVIDERS]?.displayName || provider;
    return provider;
  };

  const getProviderOptions = (type: string) => {
    switch (type) {
      case 'ai':
        return Object.entries(AI_PROVIDERS).filter(([, info]) => info.supportsTenant);
      case 'email':
        return Object.entries(EMAIL_PROVIDERS).filter(([, info]) => info.supportsTenant);
      case 'storage':
        return Object.entries(STORAGE_PROVIDERS).filter(([, info]) => info.supportsTenant);
      case 'vector':
        return Object.entries(VECTOR_PROVIDERS);
      case 'database':
        return [
          ['postgresql', { displayName: 'PostgreSQL' }],
          ['neon', { displayName: 'Neon' }],
          ['supabase', { displayName: 'Supabase' }],
        ];
      default:
        return [];
    }
  };

  const canCustomize = (type: string): boolean => {
    // In MULTI_TENANT mode, only AI and Email can be customized
    // Storage services (database, storage, vector) require infrastructure migration
    if (infraConfig.mode === 'MULTI_TENANT') {
      return type === 'ai' || type === 'email';
    }
    return true;
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">
            You need admin privileges to access settings.
          </p>
        </div>
      </div>
    );
  }

  const renderServiceCard = (
    type: 'ai' | 'email' | 'storage' | 'database' | 'vector',
    title: string,
    description: string,
    icon: React.ReactNode,
    isStorageService: boolean = false
  ) => {
    const service = services[type];
    const customizable = canCustomize(type);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon}
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(service.status, service.testStatus)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Service details */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{service.displayName}</span>
                  {getSourceBadge(service.source)}
                </div>
                {service.apiKeyMasked && (
                  <div className="text-xs text-muted-foreground font-mono">
                    API Key: {service.apiKeyMasked}
                  </div>
                )}
                {/* Usage stats for storage services */}
                {isStorageService && service.usage && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HardDrive className="h-3 w-3" />
                    <span>Your usage: {formatUsageWithLimit(service.usage)}</span>
                  </div>
                )}
                {service.errorMessage && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {service.errorMessage}
                  </div>
                )}
                {service.lastTestedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last tested: {service.lastTestedAt.toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(type)}
                  disabled={testingService !== null}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${testingService === type ? 'animate-spin' : ''}`} />
                  Test
                </Button>
                {service.source === 'custom' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleOpenConfig(type, true)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleRevertToJuris(type)}
                    >
                      Revert
                    </Button>
                  </>
                )}
                {service.source === 'juris' && customizable && (
                  <Button variant="outline" size="sm" onClick={() => handleOpenConfig(type)}>
                    Use Own
                  </Button>
                )}
                {service.source === 'juris' && !customizable && isStorageService && (
                  <span className="text-xs text-muted-foreground">
                    Requires migration
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Services</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure third-party services and view their status
        </p>
      </div>

      {/* Status Summary - matches the 5 services */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-semibold">{activeCount}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div className="text-2xl font-semibold text-red-600">{errorCount}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Problems</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-semibold">{disabledCount}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Disabled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="text-2xl font-semibold">{untestedCount}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Untested</div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Mode Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <InfraModeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Infrastructure Mode</CardTitle>
                <CardDescription>{infraModeInfo.description}</CardDescription>
              </div>
            </div>
            <Badge variant={infraModeInfo.badge} className="text-sm">
              {infraModeInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {infraConfig.mode === 'MULTI_TENANT' && (
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertTitle>Data Isolation</AlertTitle>
              <AlertDescription className="text-sm">
                Your data is isolated on shared infrastructure using storage prefixes, vector namespaces,
                and row-level security. You can migrate to dedicated infrastructure at any time.
              </AlertDescription>
            </Alert>
          )}

          {infraConfig.mode !== 'DEDICATED' && (
            <div className="pt-2">
              <Button variant="outline" size="sm">
                <ArrowRight className="h-4 w-4 mr-2" />
                Request Infrastructure Migration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All 5 Services */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Infrastructure Services</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Storage services for your data. {infraConfig.mode === 'MULTI_TENANT' && 'Request migration to use your own infrastructure.'}
        </p>

        {renderServiceCard(
          'database',
          'Database',
          'PostgreSQL database for your case data and metadata',
          <Database className="h-5 w-5" />,
          true
        )}

        {renderServiceCard(
          'storage',
          'File Storage',
          'Cloud storage for documents and attachments',
          <Cloud className="h-5 w-5" />,
          true
        )}

        {renderServiceCard(
          'vector',
          'Vector Database',
          'Vector storage for document embeddings and semantic search',
          <Server className="h-5 w-5" />,
          true
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Platform Services</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          API services you can customize with your own keys.
        </p>

        {renderServiceCard(
          'ai',
          'AI Provider',
          'AI models for case analysis and document processing',
          <Bot className="h-5 w-5" />,
          false
        )}

        {renderServiceCard(
          'email',
          'Email Provider',
          'Email service for notifications and team invitations',
          <Mail className="h-5 w-5" />,
          false
        )}
      </div>

      {/* Test Connection Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Testing Connection</DialogTitle>
            <DialogDescription>
              {testingService && services[testingService]?.displayName}
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

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Update' : 'Configure'}{' '}
              {configType === 'ai' ? 'AI Provider' :
               configType === 'email' ? 'Email Provider' :
               configType === 'storage' ? 'Storage Provider' :
               configType === 'database' ? 'Database' :
               'Vector Database'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update your service credentials'
                : 'Enter your credentials to use your own service'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={configForm.provider || ''}
                onValueChange={(v) => setConfigForm({ ...configForm, provider: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {getProviderOptions(configType).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {(info as { displayName: string }).displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields based on provider */}
            {configForm.provider && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={configForm.apiKey || ''}
                      onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                      placeholder={isEditing ? 'Enter new API key (leave blank to keep current)' : 'Enter your API key'}
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
                </div>

                {/* Additional fields for specific providers */}
                {configType === 'email' && configForm.provider === 'smtp' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input
                          id="host"
                          value={configForm.host || ''}
                          onChange={(e) => setConfigForm({ ...configForm, host: e.target.value })}
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          value={configForm.port || ''}
                          onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })}
                          placeholder="587"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={configForm.username || ''}
                        onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                  </>
                )}

                {configType === 'storage' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bucket">Bucket Name</Label>
                      <Input
                        id="bucket"
                        value={configForm.bucket || ''}
                        onChange={(e) => setConfigForm({ ...configForm, bucket: e.target.value })}
                        placeholder="my-bucket"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={configForm.region || ''}
                        onChange={(e) => setConfigForm({ ...configForm, region: e.target.value })}
                        placeholder="us-east-1"
                      />
                    </div>
                  </>
                )}

                {configType === 'vector' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">Endpoint URL</Label>
                      <Input
                        id="endpoint"
                        value={configForm.endpoint || ''}
                        onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                        placeholder="https://your-instance.pinecone.io"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namespace">Namespace</Label>
                      <Input
                        id="namespace"
                        value={configForm.namespace || ''}
                        onChange={(e) => setConfigForm({ ...configForm, namespace: e.target.value })}
                        placeholder="production"
                      />
                    </div>
                  </>
                )}

                {configType === 'database' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="connectionString">Connection String</Label>
                      <Input
                        id="connectionString"
                        type={showApiKey ? 'text' : 'password'}
                        value={configForm.connectionString || ''}
                        onChange={(e) => setConfigForm({ ...configForm, connectionString: e.target.value })}
                        placeholder="postgresql://user:password@host:5432/db"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <a
                    href="#"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    How to get your credentials
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving || !configForm.provider}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
