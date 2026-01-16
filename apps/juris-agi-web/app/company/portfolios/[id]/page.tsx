'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  Pencil,
  X,
  Check,
  Info,
  Calendar,
  Globe,
  Tag,
  TrendingUp,
  Building2,
  Shield,
  FlaskConical,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useNavigation } from '@/contexts/NavigationContext';

// =============================================================================
// Constants (same as in new/page.tsx)
// =============================================================================

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { code: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
  { code: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
  { code: 'HKD', label: 'Hong Kong Dollar (HKD)', symbol: 'HK$' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)', symbol: '¥' },
];

function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

function formatNumberWithCommas(value: string | number): string {
  const numStr = typeof value === 'number' ? value.toString() : value;
  const digits = numStr.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatNumberWithCommas(value.toString())}`;
}

const TIMEZONES = [
  { code: 'America/New_York', label: 'Eastern Time (ET)' },
  { code: 'America/Chicago', label: 'Central Time (CT)' },
  { code: 'America/Denver', label: 'Mountain Time (MT)' },
  { code: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { code: 'Europe/London', label: 'London (GMT/BST)' },
  { code: 'Europe/Paris', label: 'Central European (CET)' },
  { code: 'Europe/Zurich', label: 'Zurich (CET)' },
  { code: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { code: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { code: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { code: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { code: 'UTC', label: 'UTC' },
];

const JURISDICTIONS = [
  { code: 'US-DE', label: 'Delaware, USA' },
  { code: 'US-NY', label: 'New York, USA' },
  { code: 'US-CA', label: 'California, USA' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'IE', label: 'Ireland' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'KY', label: 'Cayman Islands' },
  { code: 'BVI', label: 'British Virgin Islands' },
  { code: 'JE', label: 'Jersey' },
];

// VC Options
const FUND_TYPES = [
  { value: 'vc', label: 'Venture Capital' },
  { value: 'growth', label: 'Growth Equity' },
  { value: 'evergreen', label: 'Evergreen' },
  { value: 'opportunity', label: 'Opportunity Fund' },
];

// Insurance Options
const LINES_OF_BUSINESS = [
  { value: 'motor', label: 'Motor' },
  { value: 'property', label: 'Property' },
  { value: 'liability', label: 'Liability' },
  { value: 'marine', label: 'Marine' },
  { value: 'cyber', label: 'Cyber' },
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' },
  { value: 'aviation', label: 'Aviation' },
  { value: 'energy', label: 'Energy' },
  { value: 'other', label: 'Other' },
];

const POLICY_TERMS = [
  { value: '6_months', label: '6 months' },
  { value: '12_months', label: '12 months' },
  { value: '18_months', label: '18 months' },
  { value: '24_months', label: '24 months' },
  { value: '36_months', label: '36 months' },
];

const CAPITAL_REGIMES = [
  { value: 'solvency_ii', label: 'Solvency II (EU)' },
  { value: 'naic_rbc', label: 'NAIC RBC (US)' },
  { value: 'ifrs_17', label: 'IFRS 17' },
  { value: 'bermuda_bscr', label: 'Bermuda BSCR' },
  { value: 'hkia', label: 'HKIA (Hong Kong)' },
  { value: 'apra', label: 'APRA (Australia)' },
  { value: 'other', label: 'Other' },
];

const CLAIMS_HANDLING_MODELS = [
  { value: 'in_house', label: 'In-house' },
  { value: 'tpa', label: 'Third Party Administrator (TPA)' },
];

// Pharma Options
const THERAPEUTIC_AREAS = [
  'Oncology', 'Immunology', 'Neurology', 'Cardiovascular',
  'Infectious Disease', 'Metabolic', 'Respiratory', 'Rare Disease',
  'Dermatology', 'Ophthalmology', 'Hematology', 'Other',
];

const MODALITIES = [
  'Small Molecule', 'Biologic', 'Peptide', 'Gene Therapy',
  'Cell Therapy', 'mRNA', 'Antibody', 'ADC', 'Oligonucleotide', 'Other',
];

const DEVELOPMENT_STAGES = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'preclinical', label: 'Preclinical' },
  { value: 'phase_1', label: 'Phase 1' },
  { value: 'phase_2', label: 'Phase 2' },
  { value: 'phase_3', label: 'Phase 3' },
  { value: 'nda_bla', label: 'NDA/BLA Filing' },
];

const REGULATORS = [
  { value: 'fda', label: 'FDA (US)' },
  { value: 'ema', label: 'EMA (EU)' },
  { value: 'mhra', label: 'MHRA (UK)' },
  { value: 'pmda', label: 'PMDA (Japan)' },
  { value: 'nmpa', label: 'NMPA (China)' },
  { value: 'health_canada', label: 'Health Canada' },
  { value: 'tga', label: 'TGA (Australia)' },
];

const MANUFACTURING_STRATEGIES = [
  { value: 'in_house', label: 'In-house' },
  { value: 'cmo', label: 'Contract Manufacturing (CMO)' },
  { value: 'hybrid', label: 'Hybrid' },
];

// =============================================================================
// Types
// =============================================================================

interface PortfolioData {
  id: string;
  name: string;
  description: string;
  code: string;
  baseCurrency: string;
  timezone: string;
  jurisdiction: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  aumCurrent: number;
  aumTarget: number;
  status: string;
  portfolioType: string;
  industryProfile: {
    vc?: VCProfile;
    insurance?: InsuranceProfile;
    pharma?: PharmaProfile;
  };
  company?: {
    id: string;
    name: string;
    industryProfile: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VCProfile {
  fundType?: string;
  targetFundSize?: number | null;
  managementCompany?: { name: string; entityId: string | null } | null;
  fundTermYears?: number | null;
  extensionOptions?: string | null;
  investmentPeriodYears?: number | null;
  targetCheckSizeMin?: number | null;
  targetCheckSizeMax?: number | null;
  reservePolicy?: number | null;
  targetOwnershipMin?: number | null;
  targetOwnershipMax?: number | null;
  recyclingAllowed?: boolean;
  leverageAllowed?: boolean;
}

interface InsuranceProfile {
  lineOfBusiness?: string;
  territory?: string | null;
  policyTermStandard?: string;
  reinsuranceProgram?: string | null;
  capitalRegime?: string | null;
  limitsDefaults?: { maxPerRisk: number | null; maxPerEvent: number | null };
  claimsHandlingModel?: string;
}

interface PharmaProfile {
  therapeuticAreas?: string[];
  modalities?: string[];
  developmentStagesSupported?: string[];
  targetRegulators?: string[];
  manufacturingStrategy?: string | null;
  clinicalStrategyNotes?: string | null;
}

// =============================================================================
// Component
// =============================================================================

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    portfolios,
    selectedPortfolio,
    navigateToPortfolio,
    getPortfolioAccessLevel,
    getPortfolioLabel,
    isAdmin,
    company,
  } = useNavigation();

  const portfolioId = params.id as string;
  const portfolioLabelSingular = getPortfolioLabel(false);

  const [isLoading, setIsLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state - mirrors the form data structure
  const [editData, setEditData] = useState<Partial<PortfolioData>>({});
  const [tagInput, setTagInput] = useState('');

  const isVc = company?.industryProfile === 'vc';
  const isInsurance = company?.industryProfile === 'insurance';
  const isPharma = company?.industryProfile === 'pharma';
  const isAdminUser = isAdmin();

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch portfolio');
        return;
      }

      setPortfolioData(data.portfolio);
      setError(null);
    } catch (err) {
      setError('Failed to fetch portfolio');
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId]);

  // Set up navigation context and fetch data
  useEffect(() => {
    if (!portfolioId) {
      router.push('/company/portfolios');
      return;
    }

    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (portfolio) {
      const accessLevel = getPortfolioAccessLevel(portfolioId);
      const canAccess = accessLevel !== null || isAdmin();

      if (!canAccess) {
        router.push('/company/portfolios');
        return;
      }

      navigateToPortfolio(portfolio);
      fetchPortfolioData();
    } else if (portfolios.length > 0) {
      router.push('/company/portfolios');
    }
  }, [portfolioId, portfolios, navigateToPortfolio, getPortfolioAccessLevel, isAdmin, router, fetchPortfolioData]);

  // Start editing
  const handleStartEdit = () => {
    if (!portfolioData) return;

    // Initialize industry profile with defaults based on company type
    const existingProfile = portfolioData.industryProfile || {};
    let industryProfile = { ...existingProfile };

    if (isVc && !industryProfile.vc) {
      industryProfile.vc = {
        fundType: 'vc',
        targetFundSize: null,
        managementCompany: null,
        fundTermYears: null,
        extensionOptions: null,
        investmentPeriodYears: null,
        targetCheckSizeMin: null,
        targetCheckSizeMax: null,
        reservePolicy: null,
        targetOwnershipMin: null,
        targetOwnershipMax: null,
        recyclingAllowed: false,
        leverageAllowed: false,
      };
    }

    if (isInsurance && !industryProfile.insurance) {
      industryProfile.insurance = {
        lineOfBusiness: '',
        territory: null,
        policyTermStandard: '12_months',
        reinsuranceProgram: null,
        capitalRegime: null,
        limitsDefaults: { maxPerRisk: null, maxPerEvent: null },
        claimsHandlingModel: 'in_house',
      };
    }

    if (isPharma && !industryProfile.pharma) {
      industryProfile.pharma = {
        therapeuticAreas: [],
        modalities: [],
        developmentStagesSupported: [],
        targetRegulators: [],
        manufacturingStrategy: null,
        clinicalStrategyNotes: null,
      };
    }

    setEditData({
      name: portfolioData.name,
      description: portfolioData.description,
      code: portfolioData.code,
      baseCurrency: portfolioData.baseCurrency,
      timezone: portfolioData.timezone,
      jurisdiction: portfolioData.jurisdiction,
      startDate: portfolioData.startDate,
      endDate: portfolioData.endDate,
      tags: [...portfolioData.tags],
      aumCurrent: portfolioData.aumCurrent,
      aumTarget: portfolioData.aumTarget,
      industryProfile: JSON.parse(JSON.stringify(industryProfile)),
    });
    setIsEditing(true);
    setError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
    setTagInput('');
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    if (!portfolioData) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save changes');
        setIsSaving(false);
        return;
      }

      setPortfolioData(data.portfolio);
      setIsEditing(false);
      setEditData({});
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Tag handlers
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editData.tags?.includes(tag)) {
      setEditData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  // Industry profile update helpers
  const updateVCProfile = (field: string, value: unknown) => {
    setEditData((prev) => ({
      ...prev,
      industryProfile: {
        ...prev.industryProfile,
        vc: {
          ...(prev.industryProfile?.vc || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateInsuranceProfile = (field: string, value: unknown) => {
    setEditData((prev) => ({
      ...prev,
      industryProfile: {
        ...prev.industryProfile,
        insurance: {
          ...(prev.industryProfile?.insurance || {}),
          [field]: value,
        },
      },
    }));
  };

  const updatePharmaProfile = (field: string, value: unknown) => {
    setEditData((prev) => ({
      ...prev,
      industryProfile: {
        ...prev.industryProfile,
        pharma: {
          ...(prev.industryProfile?.pharma || {}),
          [field]: value,
        },
      },
    }));
  };

  // Helper to get display value
  const getDisplayValue = (value: unknown, fallback: string = '-'): string => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  const getLabelForValue = (options: { value: string; label: string }[], value: string): string => {
    return options.find((o) => o.value === value)?.label || value || '-';
  };

  const getTimezoneLabel = (code: string): string => {
    return TIMEZONES.find((t) => t.code === code)?.label || code || '-';
  };

  const getJurisdictionLabel = (code: string): string => {
    return JURISDICTIONS.find((j) => j.code === code)?.label || code || '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedPortfolio || !portfolioData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Portfolio not found</p>
      </div>
    );
  }

  // Always provide default empty objects for industry profiles to ensure all sections render
  const vcProfile: VCProfile = portfolioData.industryProfile?.vc || {};
  const insuranceProfile: InsuranceProfile = portfolioData.industryProfile?.insurance || {};
  const pharmaProfile: PharmaProfile = portfolioData.industryProfile?.pharma || {};

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{portfolioData.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {portfolioLabelSingular} Overview
            </p>
          </div>
          {isAdminUser && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm font-medium">{portfolioData.name}</p>
                  )}
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Internal Code</Label>
                  {isEditing ? (
                    <Input
                      value={editData.code || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., FUND-001"
                    />
                  ) : (
                    <p className="text-sm">{getDisplayValue(portfolioData.code)}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm">{getDisplayValue(portfolioData.description, 'No description')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Base Currency */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Base Currency</Label>
                    {isEditing ? (
                      <Select
                        value={editData.baseCurrency || 'USD'}
                        onValueChange={(value) => setEditData((prev) => ({ ...prev, baseCurrency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.symbol} - {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">
                        {getCurrencySymbol(portfolioData.baseCurrency)} ({portfolioData.baseCurrency})
                      </p>
                    )}
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Timezone</Label>
                    {isEditing ? (
                      <Select
                        value={editData.timezone || 'UTC'}
                        onValueChange={(value) => setEditData((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.code} value={tz.code}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{getTimezoneLabel(portfolioData.timezone)}</p>
                    )}
                  </div>
                </div>

                {/* Jurisdiction */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Jurisdiction</Label>
                  {isEditing ? (
                    <Select
                      value={editData.jurisdiction || ''}
                      onValueChange={(value) => setEditData((prev) => ({ ...prev, jurisdiction: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTIONS.map((j) => (
                          <SelectItem key={j.code} value={j.code}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{getJurisdictionLabel(portfolioData.jurisdiction)}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fund Size - VC Only */}
            {isVc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fund Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Current AUM</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.aumCurrent || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                              setEditData((prev) => ({ ...prev, aumCurrent: value }));
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-medium">
                          {formatCurrency(portfolioData.aumCurrent, portfolioData.baseCurrency)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target AUM</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.aumTarget || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                              setEditData((prev) => ({ ...prev, aumTarget: value }));
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {portfolioData.aumTarget > 0
                            ? formatCurrency(portfolioData.aumTarget, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VC Fund Profile */}
            {isVc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Fund Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fund Type & Target Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Fund Type</Label>
                      {isEditing ? (
                        <Select
                          value={editData.industryProfile?.vc?.fundType || vcProfile.fundType || 'vc'}
                          onValueChange={(value) => updateVCProfile('fundType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FUND_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{getLabelForValue(FUND_TYPES, vcProfile.fundType || '')}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target Fund Size</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.industryProfile?.vc?.targetFundSize || vcProfile.targetFundSize || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || null;
                              updateVCProfile('targetFundSize', value);
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {vcProfile.targetFundSize
                            ? formatCurrency(vcProfile.targetFundSize, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Management Company */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Management Company</Label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Company name"
                          value={editData.industryProfile?.vc?.managementCompany?.name || vcProfile.managementCompany?.name || ''}
                          onChange={(e) => updateVCProfile('managementCompany', {
                            ...(editData.industryProfile?.vc?.managementCompany || vcProfile.managementCompany || {}),
                            name: e.target.value,
                          })}
                        />
                        <Input
                          placeholder="Entity ID (optional)"
                          value={editData.industryProfile?.vc?.managementCompany?.entityId || vcProfile.managementCompany?.entityId || ''}
                          onChange={(e) => updateVCProfile('managementCompany', {
                            ...(editData.industryProfile?.vc?.managementCompany || vcProfile.managementCompany || {}),
                            entityId: e.target.value || null,
                          })}
                        />
                      </div>
                    ) : (
                      <p className="text-sm">
                        {vcProfile.managementCompany?.name || '-'}
                        {vcProfile.managementCompany?.entityId && ` (${vcProfile.managementCompany.entityId})`}
                      </p>
                    )}
                  </div>

                  {/* Fund Term & Investment Period */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Fund Term (years)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.industryProfile?.vc?.fundTermYears ?? vcProfile.fundTermYears ?? ''}
                          onChange={(e) => updateVCProfile('fundTermYears', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.fundTermYears ?? '-'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Extension Options</Label>
                      {isEditing ? (
                        <Input
                          value={editData.industryProfile?.vc?.extensionOptions ?? vcProfile.extensionOptions ?? ''}
                          onChange={(e) => updateVCProfile('extensionOptions', e.target.value || null)}
                          placeholder="e.g., 2x1 year"
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.extensionOptions || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Investment Period (years)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.industryProfile?.vc?.investmentPeriodYears ?? vcProfile.investmentPeriodYears ?? ''}
                          onChange={(e) => updateVCProfile('investmentPeriodYears', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.investmentPeriodYears ?? '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Check Size Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target Check Size (Min)</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.industryProfile?.vc?.targetCheckSizeMin || vcProfile.targetCheckSizeMin || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || null;
                              updateVCProfile('targetCheckSizeMin', value);
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {vcProfile.targetCheckSizeMin
                            ? formatCurrency(vcProfile.targetCheckSizeMin, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target Check Size (Max)</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.industryProfile?.vc?.targetCheckSizeMax || vcProfile.targetCheckSizeMax || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || null;
                              updateVCProfile('targetCheckSizeMax', value);
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {vcProfile.targetCheckSizeMax
                            ? formatCurrency(vcProfile.targetCheckSizeMax, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reserve & Ownership */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Reserve Policy (%)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.industryProfile?.vc?.reservePolicy ?? vcProfile.reservePolicy ?? ''}
                          onChange={(e) => updateVCProfile('reservePolicy', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.reservePolicy ? `${vcProfile.reservePolicy}%` : '-'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target Ownership (Min %)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.industryProfile?.vc?.targetOwnershipMin ?? vcProfile.targetOwnershipMin ?? ''}
                          onChange={(e) => updateVCProfile('targetOwnershipMin', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.targetOwnershipMin ? `${vcProfile.targetOwnershipMin}%` : '-'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Target Ownership (Max %)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.industryProfile?.vc?.targetOwnershipMax ?? vcProfile.targetOwnershipMax ?? ''}
                          onChange={(e) => updateVCProfile('targetOwnershipMax', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      ) : (
                        <p className="text-sm">{vcProfile.targetOwnershipMax ? `${vcProfile.targetOwnershipMax}%` : '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Policy Switches */}
                  <div className="flex gap-8 pt-2">
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <Switch
                          checked={editData.industryProfile?.vc?.recyclingAllowed ?? vcProfile.recyclingAllowed ?? false}
                          onCheckedChange={(checked) => updateVCProfile('recyclingAllowed', checked)}
                        />
                      ) : (
                        <Badge variant={vcProfile.recyclingAllowed ? 'default' : 'outline'}>
                          {vcProfile.recyclingAllowed ? 'Yes' : 'No'}
                        </Badge>
                      )}
                      <div>
                        <Label className="text-sm">Recycling Allowed</Label>
                        <p className="text-xs text-muted-foreground">Reinvest proceeds during investment period</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <Switch
                          checked={editData.industryProfile?.vc?.leverageAllowed ?? vcProfile.leverageAllowed ?? false}
                          onCheckedChange={(checked) => updateVCProfile('leverageAllowed', checked)}
                        />
                      ) : (
                        <Badge variant={vcProfile.leverageAllowed ? 'default' : 'outline'}>
                          {vcProfile.leverageAllowed ? 'Yes' : 'No'}
                        </Badge>
                      )}
                      <div>
                        <Label className="text-sm">Leverage Allowed</Label>
                        <p className="text-xs text-muted-foreground">Fund may use debt financing</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insurance Book Profile */}
            {isInsurance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Book Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Line of Business & Territory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Line of Business</Label>
                      {isEditing ? (
                        <Select
                          value={editData.industryProfile?.insurance?.lineOfBusiness || insuranceProfile.lineOfBusiness || ''}
                          onValueChange={(value) => updateInsuranceProfile('lineOfBusiness', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {LINES_OF_BUSINESS.map((lob) => (
                              <SelectItem key={lob.value} value={lob.value}>
                                {lob.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{getLabelForValue(LINES_OF_BUSINESS, insuranceProfile.lineOfBusiness || '')}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Territory</Label>
                      {isEditing ? (
                        <Input
                          value={editData.industryProfile?.insurance?.territory ?? insuranceProfile.territory ?? ''}
                          onChange={(e) => updateInsuranceProfile('territory', e.target.value || null)}
                          placeholder="e.g., North America"
                        />
                      ) : (
                        <p className="text-sm">{insuranceProfile.territory || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Policy Term & Capital Regime */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Standard Policy Term</Label>
                      {isEditing ? (
                        <Select
                          value={editData.industryProfile?.insurance?.policyTermStandard || insuranceProfile.policyTermStandard || '12_months'}
                          onValueChange={(value) => updateInsuranceProfile('policyTermStandard', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POLICY_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{getLabelForValue(POLICY_TERMS, insuranceProfile.policyTermStandard || '')}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Capital Regime</Label>
                      {isEditing ? (
                        <Select
                          value={editData.industryProfile?.insurance?.capitalRegime || insuranceProfile.capitalRegime || ''}
                          onValueChange={(value) => updateInsuranceProfile('capitalRegime', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAPITAL_REGIMES.map((regime) => (
                              <SelectItem key={regime.value} value={regime.value}>
                                {regime.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{getLabelForValue(CAPITAL_REGIMES, insuranceProfile.capitalRegime || '')}</p>
                      )}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Max per Risk</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.industryProfile?.insurance?.limitsDefaults?.maxPerRisk || insuranceProfile.limitsDefaults?.maxPerRisk || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || null;
                              updateInsuranceProfile('limitsDefaults', {
                                ...(editData.industryProfile?.insurance?.limitsDefaults || insuranceProfile.limitsDefaults || {}),
                                maxPerRisk: value,
                              });
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {insuranceProfile.limitsDefaults?.maxPerRisk
                            ? formatCurrency(insuranceProfile.limitsDefaults.maxPerRisk, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Max per Event</Label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(editData.baseCurrency || portfolioData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            value={formatNumberWithCommas(editData.industryProfile?.insurance?.limitsDefaults?.maxPerEvent || insuranceProfile.limitsDefaults?.maxPerEvent || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/,/g, '')) || null;
                              updateInsuranceProfile('limitsDefaults', {
                                ...(editData.industryProfile?.insurance?.limitsDefaults || insuranceProfile.limitsDefaults || {}),
                                maxPerEvent: value,
                              });
                            }}
                            className="pl-10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">
                          {insuranceProfile.limitsDefaults?.maxPerEvent
                            ? formatCurrency(insuranceProfile.limitsDefaults.maxPerEvent, portfolioData.baseCurrency)
                            : '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reinsurance */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Reinsurance Program</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.industryProfile?.insurance?.reinsuranceProgram ?? insuranceProfile.reinsuranceProgram ?? ''}
                        onChange={(e) => updateInsuranceProfile('reinsuranceProgram', e.target.value || null)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm">{insuranceProfile.reinsuranceProgram || '-'}</p>
                    )}
                  </div>

                  {/* Claims Handling */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Claims Handling Model</Label>
                    {isEditing ? (
                      <div className="flex gap-4">
                        {CLAIMS_HANDLING_MODELS.map((model) => (
                          <label key={model.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={model.value}
                              checked={(editData.industryProfile?.insurance?.claimsHandlingModel || insuranceProfile.claimsHandlingModel) === model.value}
                              onChange={(e) => updateInsuranceProfile('claimsHandlingModel', e.target.value)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{model.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{getLabelForValue(CLAIMS_HANDLING_MODELS, insuranceProfile.claimsHandlingModel || '')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pharma Pipeline Profile */}
            {isPharma && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Pipeline Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Therapeutic Areas */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Therapeutic Areas</Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {THERAPEUTIC_AREAS.map((area) => {
                          const isSelected = (editData.industryProfile?.pharma?.therapeuticAreas || pharmaProfile.therapeuticAreas || []).includes(area);
                          return (
                            <Badge
                              key={area}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const current = editData.industryProfile?.pharma?.therapeuticAreas || pharmaProfile.therapeuticAreas || [];
                                const updated = isSelected
                                  ? current.filter((a: string) => a !== area)
                                  : [...current, area];
                                updatePharmaProfile('therapeuticAreas', updated);
                              }}
                            >
                              {area}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(pharmaProfile.therapeuticAreas || []).length > 0
                          ? (pharmaProfile.therapeuticAreas || []).map((area) => (
                              <Badge key={area} variant="secondary">{area}</Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    )}
                  </div>

                  {/* Modalities */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Modalities</Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {MODALITIES.map((modality) => {
                          const isSelected = (editData.industryProfile?.pharma?.modalities || pharmaProfile.modalities || []).includes(modality);
                          return (
                            <Badge
                              key={modality}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const current = editData.industryProfile?.pharma?.modalities || pharmaProfile.modalities || [];
                                const updated = isSelected
                                  ? current.filter((m: string) => m !== modality)
                                  : [...current, modality];
                                updatePharmaProfile('modalities', updated);
                              }}
                            >
                              {modality}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(pharmaProfile.modalities || []).length > 0
                          ? (pharmaProfile.modalities || []).map((m) => (
                              <Badge key={m} variant="secondary">{m}</Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    )}
                  </div>

                  {/* Development Stages */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Development Stages Supported</Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-4">
                        {DEVELOPMENT_STAGES.map((stage) => {
                          const isSelected = (editData.industryProfile?.pharma?.developmentStagesSupported || pharmaProfile.developmentStagesSupported || []).includes(stage.value);
                          return (
                            <label key={stage.value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const current = editData.industryProfile?.pharma?.developmentStagesSupported || pharmaProfile.developmentStagesSupported || [];
                                  const updated = checked
                                    ? [...current, stage.value]
                                    : current.filter((s: string) => s !== stage.value);
                                  updatePharmaProfile('developmentStagesSupported', updated);
                                }}
                              />
                              <span className="text-sm">{stage.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(pharmaProfile.developmentStagesSupported || []).length > 0
                          ? (pharmaProfile.developmentStagesSupported || []).map((s) => (
                              <Badge key={s} variant="secondary">
                                {DEVELOPMENT_STAGES.find((d) => d.value === s)?.label || s}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    )}
                  </div>

                  {/* Target Regulators */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Target Regulators</Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-4">
                        {REGULATORS.map((reg) => {
                          const isSelected = (editData.industryProfile?.pharma?.targetRegulators || pharmaProfile.targetRegulators || []).includes(reg.value);
                          return (
                            <label key={reg.value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const current = editData.industryProfile?.pharma?.targetRegulators || pharmaProfile.targetRegulators || [];
                                  const updated = checked
                                    ? [...current, reg.value]
                                    : current.filter((r: string) => r !== reg.value);
                                  updatePharmaProfile('targetRegulators', updated);
                                }}
                              />
                              <span className="text-sm">{reg.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(pharmaProfile.targetRegulators || []).length > 0
                          ? (pharmaProfile.targetRegulators || []).map((r) => (
                              <Badge key={r} variant="secondary">
                                {REGULATORS.find((reg) => reg.value === r)?.label || r}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    )}
                  </div>

                  {/* Manufacturing Strategy */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Manufacturing Strategy</Label>
                    {isEditing ? (
                      <div className="flex gap-4">
                        {MANUFACTURING_STRATEGIES.map((strategy) => (
                          <label key={strategy.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={strategy.value}
                              checked={(editData.industryProfile?.pharma?.manufacturingStrategy || pharmaProfile.manufacturingStrategy) === strategy.value}
                              onChange={(e) => updatePharmaProfile('manufacturingStrategy', e.target.value)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{strategy.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{getLabelForValue(MANUFACTURING_STRATEGIES, pharmaProfile.manufacturingStrategy || '')}</p>
                    )}
                  </div>

                  {/* Clinical Strategy Notes */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Clinical Strategy Notes</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.industryProfile?.pharma?.clinicalStrategyNotes ?? pharmaProfile.clinicalStrategyNotes ?? ''}
                        onChange={(e) => updatePharmaProfile('clinicalStrategyNotes', e.target.value || null)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm">{pharmaProfile.clinicalStrategyNotes || '-'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Start Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.startDate || ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, startDate: e.target.value || null }))}
                      />
                    ) : (
                      <p className="text-sm">
                        {portfolioData.startDate
                          ? new Date(portfolioData.startDate).toLocaleDateString()
                          : '-'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">End Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.endDate || ''}
                        onChange={(e) => setEditData((prev) => ({ ...prev, endDate: e.target.value || null }))}
                      />
                    ) : (
                      <p className="text-sm">
                        {portfolioData.endDate
                          ? new Date(portfolioData.endDate).toLocaleDateString()
                          : '-'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          className="pl-8"
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    {(editData.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(editData.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {portfolioData.tags.length > 0
                      ? portfolioData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">No tags</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={portfolioData.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {portfolioData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{portfolioData.portfolioType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(portfolioData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(portfolioData.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {!isEditing && isAdminUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={handleStartEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
