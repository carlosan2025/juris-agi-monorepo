'use client';

import { useState } from 'react';
import {
  Building2,
  Globe,
  Calendar,
  Save,
  Settings2,
  DollarSign,
  Clock,
  Palette,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/date-utils';
import type { IndustryProfile } from '@/types/domain';
import { INDUSTRY_CONFIG, DEFAULT_COMPANY_SETTINGS, type CompanySettings } from '@/types/domain';

// backend_pending: Load from API
const MOCK_COMPANY = {
  id: '1',
  name: 'Acme Capital',
  slug: 'acme-capital',
  industryProfile: 'vc' as IndustryProfile,
  timezone: 'America/New_York',
  currency: 'USD',
  createdAt: new Date('2023-01-15'),
  subscription: 'Enterprise',
  usersCount: 12,
  projectsCount: 45,
  casesCount: 234,
  hasPublishedBaseline: true, // At least one project has published baseline
  settings: DEFAULT_COMPANY_SETTINGS,
};

const INDUSTRY_OPTIONS: { value: IndustryProfile; label: string; description: string }[] = [
  { value: 'vc', label: 'Venture Capital', description: 'Investment analysis for startups and growth companies' },
  { value: 'pharma', label: 'Pharmaceutical', description: 'Drug development pipeline evaluation' },
  { value: 'insurance', label: 'Insurance', description: 'Risk assessment and underwriting decisions' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'SGD', label: 'Singapore Dollar (S$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
];

export default function AdminCompanyPage() {
  const [companyName, setCompanyName] = useState(MOCK_COMPANY.name);
  const [industry, setIndustry] = useState<IndustryProfile>(MOCK_COMPANY.industryProfile);
  const [timezone, setTimezone] = useState(MOCK_COMPANY.timezone);
  const [currency, setCurrency] = useState(MOCK_COMPANY.currency);
  const [settings, setSettings] = useState<CompanySettings>(MOCK_COMPANY.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const industryConfig = INDUSTRY_CONFIG[industry];

  const handleSave = async () => {
    setIsSaving(true);
    // backend_pending: Save to API
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const updateSettings = (key: keyof CompanySettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateFeature = (feature: keyof CompanySettings['features'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">
            Configure your company profile, industry, and system preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Company Overview Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{MOCK_COMPANY.usersCount}</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{MOCK_COMPANY.projectsCount}</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{MOCK_COMPANY.casesCount}</div>
            <div className="text-xs text-muted-foreground">Total Cases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Badge variant="outline" className="mb-1">{MOCK_COMPANY.subscription}</Badge>
            <div className="text-xs text-muted-foreground">Plan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              {MOCK_COMPANY.hasPublishedBaseline ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {MOCK_COMPANY.hasPublishedBaseline ? 'Baseline Active' : 'Needs Setup'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="industry">Industry Settings</TabsTrigger>
          <TabsTrigger value="defaults">Defaults & Features</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </CardTitle>
              <CardDescription>
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Slug</Label>
                  <Input
                    value={MOCK_COMPANY.slug}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs. Contact support to change.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Created</Label>
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(MOCK_COMPANY.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure timezone and currency for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Default Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((cur) => (
                        <SelectItem key={cur.value} value={cur.value}>
                          {cur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize the appearance of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.brandColor || '#000000'}
                      onChange={(e) => updateSettings('brandColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.brandColor || '#000000'}
                      onChange={(e) => updateSettings('brandColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSettings('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industry Tab */}
        <TabsContent value="industry" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Industry Profile
              </CardTitle>
              <CardDescription>
                Select your industry to customize terminology and evaluation parameters.
                This affects how projects, cases, and portfolios are labeled throughout the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {INDUSTRY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      industry === opt.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => setIndustry(opt.value)}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {opt.description}
                    </div>
                    {industry === opt.value && (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Terminology Preview */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Terminology Preview for {industryConfig.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 bg-white/50 dark:bg-blue-950/30 rounded">
                      <span className="text-muted-foreground">Workspaces →</span>
                      <span className="font-medium">{industryConfig.workspaceLabel}s</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/50 dark:bg-blue-950/30 rounded">
                      <span className="text-muted-foreground">Projects →</span>
                      <span className="font-medium">{industryConfig.mandateLabel}s</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/50 dark:bg-blue-950/30 rounded">
                      <span className="text-muted-foreground">Cases →</span>
                      <span className="font-medium">{industryConfig.caseLabel}s</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/50 dark:bg-blue-950/30 rounded">
                      <span className="text-muted-foreground">Portfolio →</span>
                      <span className="font-medium">{industryConfig.portfolioLabel}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Primary Metrics
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {industryConfig.primaryMetrics.map((metric) => (
                        <Badge key={metric} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Decision Types
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {industryConfig.decisionTypes.map((dt) => (
                        <Badge key={dt} variant="outline" className="text-xs">
                          {dt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Defaults</CardTitle>
              <CardDescription>
                Default settings for new projects and evidence processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Context Size</Label>
                  <Select
                    value={settings.defaultContextSize}
                    onValueChange={(v) => updateSettings('defaultContextSize', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (Fast)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="large">Large (Thorough)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Maximum)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Affects processing depth and accuracy
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Claim Density</Label>
                  <Select
                    value={settings.defaultClaimDensity}
                    onValueChange={(v) => updateSettings('defaultClaimDensity', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Key facts only)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="high">High (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How many claims to extract per document
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precision/Recall Balance</Label>
                  <Select
                    value={settings.defaultPrecisionRecall}
                    onValueChange={(v) => updateSettings('defaultPrecisionRecall', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="precision">Precision (Fewer false positives)</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="recall">Recall (Catch everything)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>DSL Strictness</Label>
                  <Select
                    value={settings.dslStrictness}
                    onValueChange={(v) => updateSettings('dslStrictness', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict (Exact matching)</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="lenient">Lenient (Fuzzy matching)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>
                Control how baselines and cases are managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval for Baseline Activation</Label>
                  <p className="text-xs text-muted-foreground">
                    Baselines must be approved before they can be published
                  </p>
                </div>
                <Switch
                  checked={settings.requireApprovalForActivation}
                  onCheckedChange={(v) => updateSettings('requireApprovalForActivation', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-create Draft Baseline</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create a draft baseline when a project is created
                  </p>
                </div>
                <Switch
                  checked={settings.autoCreateDraftBaseline}
                  onCheckedChange={(v) => updateSettings('autoCreateDraftBaseline', v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Audit Retention (Days)</Label>
                <Input
                  type="number"
                  value={settings.auditRetentionDays}
                  onChange={(e) => updateSettings('auditRetentionDays', parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  How long to retain audit trail data ({Math.round(settings.auditRetentionDays / 365)} years)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable optional features for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Case Law & Precedents</Label>
                  <p className="text-xs text-muted-foreground">
                    Track decisions as precedents for future cases
                  </p>
                </div>
                <Switch
                  checked={settings.features.caselaw}
                  onCheckedChange={(v) => updateFeature('caselaw', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Monitoring & Drift Detection</Label>
                  <p className="text-xs text-muted-foreground">
                    Continuous monitoring of cases and baseline drift
                  </p>
                </div>
                <Switch
                  checked={settings.features.monitoring}
                  onCheckedChange={(v) => updateFeature('monitoring', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Portfolio Integration</Label>
                  <p className="text-xs text-muted-foreground">
                    Track cases as positions in portfolios
                  </p>
                </div>
                <Switch
                  checked={settings.features.portfolioIntegration}
                  onCheckedChange={(v) => updateFeature('portfolioIntegration', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Advanced Reporting</Label>
                  <p className="text-xs text-muted-foreground">
                    Generate IC memos, LP packs, and regulatory reports
                  </p>
                </div>
                <Switch
                  checked={settings.features.advancedReporting}
                  onCheckedChange={(v) => updateFeature('advancedReporting', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
