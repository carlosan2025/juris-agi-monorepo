'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Info,
  Calendar,
  Globe,
  Tag,
  X,
  TrendingUp,
  Users,
  Building2,
  Shield,
  FlaskConical,
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
import type { PortfolioAccessLevel, EnhancedPortfolio } from '@/types/domain';

// Common currencies (ISO 4217)
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

// Get currency symbol from code
function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

// Format number with thousand separators
function formatNumberWithCommas(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  // Add commas for thousands
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Common timezones (IANA)
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

// Common jurisdictions
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

// =============================================================================
// VC (Fund) Profile Options
// =============================================================================

const FUND_TYPES = [
  { value: 'vc', label: 'Venture Capital' },
  { value: 'growth', label: 'Growth Equity' },
  { value: 'evergreen', label: 'Evergreen' },
  { value: 'opportunity', label: 'Opportunity Fund' },
];

// =============================================================================
// Insurance (Book) Profile Options
// =============================================================================

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

// =============================================================================
// Pharma (Pipeline) Profile Options
// =============================================================================

const THERAPEUTIC_AREAS = [
  'Oncology',
  'Immunology',
  'Neurology',
  'Cardiovascular',
  'Infectious Disease',
  'Metabolic',
  'Respiratory',
  'Rare Disease',
  'Dermatology',
  'Ophthalmology',
  'Hematology',
  'Other',
];

const MODALITIES = [
  'Small Molecule',
  'Biologic',
  'Peptide',
  'Gene Therapy',
  'Cell Therapy',
  'mRNA',
  'Antibody',
  'ADC',
  'Oligonucleotide',
  'Other',
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

interface UserAssignment {
  userId: string;
  accessLevel: PortfolioAccessLevel;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  baseCurrency: string;
  timezone: string;
  jurisdiction: string;
  startDate: string;
  endDate: string;
  tags: string[];
  // AUM fields (primarily for VC, but applicable to others)
  aumCurrent: string; // Current AUM - mandatory for VC
  aumTarget: string; // Target AUM - optional
  // User assignments
  userAssignments: UserAssignment[];

  // ==========================================================================
  // VC (Fund) Profile Fields
  // ==========================================================================
  fundType: string;
  targetFundSize: string;
  managementCompanyName: string;
  managementCompanyEntityId: string;
  fundTermYears: string;
  extensionOptions: string;
  investmentPeriodYears: string;
  targetCheckSizeMin: string;
  targetCheckSizeMax: string;
  reservePolicy: string; // follow-on % target
  targetOwnershipMin: string;
  targetOwnershipMax: string;
  recyclingAllowed: boolean;
  leverageAllowed: boolean;

  // ==========================================================================
  // Insurance (Book) Profile Fields
  // ==========================================================================
  lineOfBusiness: string;
  territory: string;
  policyTermStandard: string;
  reinsuranceProgram: string;
  capitalRegime: string;
  limitsMaxPerRisk: string;
  limitsMaxPerEvent: string;
  claimsHandlingModel: string;

  // ==========================================================================
  // Pharma (Pipeline) Profile Fields
  // ==========================================================================
  therapeuticAreas: string[];
  modalities: string[];
  developmentStagesSupported: string[];
  targetRegulators: string[];
  manufacturingStrategy: string;
  clinicalStrategyNotes: string;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  const { isAdmin, getPortfolioLabel, company, getCompanyUsers, addPortfolio, currentUser } = useNavigation();

  const portfolioLabel = getPortfolioLabel(false);
  const portfolioLabelLower = portfolioLabel.toLowerCase();

  // Get all company users for assignment
  const companyUsers = getCompanyUsers();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    baseCurrency: 'USD',
    timezone: 'America/New_York',
    jurisdiction: '',
    startDate: '',
    endDate: '',
    tags: [],
    aumCurrent: '',
    aumTarget: '',
    userAssignments: [],
    // VC (Fund) Profile Fields
    fundType: 'vc',
    targetFundSize: '',
    managementCompanyName: '',
    managementCompanyEntityId: '',
    fundTermYears: '',
    extensionOptions: '',
    investmentPeriodYears: '',
    targetCheckSizeMin: '',
    targetCheckSizeMax: '',
    reservePolicy: '',
    targetOwnershipMin: '',
    targetOwnershipMax: '',
    recyclingAllowed: false,
    leverageAllowed: false,
    // Insurance (Book) Profile Fields
    lineOfBusiness: '',
    territory: '',
    policyTermStandard: '12_months',
    reinsuranceProgram: '',
    capitalRegime: '',
    limitsMaxPerRisk: '',
    limitsMaxPerEvent: '',
    claimsHandlingModel: 'in_house',
    // Pharma (Pipeline) Profile Fields
    therapeuticAreas: [],
    modalities: [],
    developmentStagesSupported: [],
    targetRegulators: [],
    manufacturingStrategy: '',
    clinicalStrategyNotes: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isAdminUser = isAdmin();
  const isVc = company?.industryProfile === 'vc';
  const isInsurance = company?.industryProfile === 'insurance';
  const isPharma = company?.industryProfile === 'pharma';

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminUser) {
      router.push('/company/portfolios');
    }
  }, [isAdminUser, router]);

  // Show nothing while redirecting non-admins
  if (!isAdminUser) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = `${portfolioLabel} name is required`;
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // AUM validation - mandatory for VC
    if (isVc) {
      if (!formData.aumCurrent.trim()) {
        newErrors.aumCurrent = 'Current AUM is required';
      } else {
        const aumValue = parseFloat(formData.aumCurrent.replace(/,/g, ''));
        if (isNaN(aumValue) || aumValue < 0) {
          newErrors.aumCurrent = 'Please enter a valid amount';
        }
      }

      // Validate target AUM if provided
      if (formData.aumTarget.trim()) {
        const targetValue = parseFloat(formData.aumTarget.replace(/,/g, ''));
        if (isNaN(targetValue) || targetValue < 0) {
          newErrors.aumTarget = 'Please enter a valid amount';
        }
      }
    }

    // Insurance validation - line of business is required
    if (isInsurance) {
      if (!formData.lineOfBusiness) {
        newErrors.lineOfBusiness = 'Line of business is required';
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Helper to parse currency values
    const parseCurrency = (value: string): number | null => {
      if (!value.trim()) return null;
      const parsed = parseFloat(value.replace(/,/g, ''));
      return isNaN(parsed) ? null : parsed;
    };

    // Build industry-specific profile data
    let industryProfile = {};

    if (isVc) {
      industryProfile = {
        vc: {
          fundType: formData.fundType || 'vc',
          targetFundSize: parseCurrency(formData.targetFundSize),
          managementCompany: formData.managementCompanyName.trim()
            ? {
                name: formData.managementCompanyName.trim(),
                entityId: formData.managementCompanyEntityId.trim() || null,
              }
            : null,
          fundTermYears: formData.fundTermYears ? parseInt(formData.fundTermYears) : null,
          extensionOptions: formData.extensionOptions.trim() || null,
          investmentPeriodYears: formData.investmentPeriodYears ? parseInt(formData.investmentPeriodYears) : null,
          targetCheckSizeMin: parseCurrency(formData.targetCheckSizeMin),
          targetCheckSizeMax: parseCurrency(formData.targetCheckSizeMax),
          reservePolicy: formData.reservePolicy ? parseFloat(formData.reservePolicy) : null,
          targetOwnershipMin: formData.targetOwnershipMin ? parseFloat(formData.targetOwnershipMin) : null,
          targetOwnershipMax: formData.targetOwnershipMax ? parseFloat(formData.targetOwnershipMax) : null,
          recyclingAllowed: formData.recyclingAllowed,
          leverageAllowed: formData.leverageAllowed,
        },
      };
    } else if (isInsurance) {
      industryProfile = {
        insurance: {
          lineOfBusiness: formData.lineOfBusiness,
          territory: formData.territory.trim() || null,
          policyTermStandard: formData.policyTermStandard,
          reinsuranceProgram: formData.reinsuranceProgram.trim() || null,
          capitalRegime: formData.capitalRegime || null,
          limitsDefaults: {
            maxPerRisk: parseCurrency(formData.limitsMaxPerRisk),
            maxPerEvent: parseCurrency(formData.limitsMaxPerEvent),
          },
          claimsHandlingModel: formData.claimsHandlingModel as 'tpa' | 'in_house',
        },
      };
    } else if (isPharma) {
      industryProfile = {
        pharma: {
          therapeuticAreas: formData.therapeuticAreas,
          modalities: formData.modalities,
          developmentStagesSupported: formData.developmentStagesSupported,
          targetRegulators: formData.targetRegulators,
          manufacturingStrategy: formData.manufacturingStrategy as 'in_house' | 'cmo' | 'hybrid' || null,
          clinicalStrategyNotes: formData.clinicalStrategyNotes.trim() || null,
        },
      };
    }

    // Prepare the payload for the API
    const portfolioData = {
      companyId: company?.id,
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      description: formData.description.trim() || null,
      baseCurrency: formData.baseCurrency,
      timezone: formData.timezone,
      jurisdiction: formData.jurisdiction || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      aumCurrent: formData.aumCurrent
        ? parseFloat(formData.aumCurrent.replace(/,/g, ''))
        : null,
      aumTarget: formData.aumTarget
        ? parseFloat(formData.aumTarget.replace(/,/g, ''))
        : null,
      userAssignments: formData.userAssignments,
      industryProfile,
    };

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Failed to create portfolio:', result.error, result.details);
        const errorMsg = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'Failed to create portfolio';
        setErrors({ name: errorMsg });
        setIsSaving(false);
        return;
      }

      // Add the new portfolio to the navigation context for immediate UI update
      const newPortfolio: EnhancedPortfolio = {
        id: result.portfolio.id,
        organizationId: result.portfolio.organizationId,
        workspaceId: result.portfolio.workspaceId,
        name: result.portfolio.name,
        description: result.portfolio.description,
        type: result.portfolio.type,
        status: result.portfolio.status,
        industryLabel: result.portfolio.industryLabel,
        constraints: result.portfolio.constraints,
        composition: result.portfolio.composition,
        metrics: {
          ...result.portfolio.metrics,
          lastCalculatedAt: new Date(result.portfolio.metrics.lastCalculatedAt),
        },
        createdAt: new Date(result.portfolio.createdAt),
        updatedAt: new Date(result.portfolio.updatedAt),
      };

      addPortfolio(newPortfolio);

      setIsSaving(false);
      router.push('/company/portfolios');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setErrors({ name: 'Failed to create portfolio. Please try again.' });
      setIsSaving(false);
    }
  };

  // User assignment handlers
  const toggleUserAssignment = (userId: string) => {
    setFormData((prev) => {
      const existing = prev.userAssignments.find((a) => a.userId === userId);
      if (existing) {
        return {
          ...prev,
          userAssignments: prev.userAssignments.filter((a) => a.userId !== userId),
        };
      } else {
        return {
          ...prev,
          userAssignments: [...prev.userAssignments, { userId, accessLevel: 'maker' }],
        };
      }
    });
  };

  const setUserAccessLevel = (userId: string, level: PortfolioAccessLevel) => {
    setFormData((prev) => ({
      ...prev,
      userAssignments: prev.userAssignments.map((a) =>
        a.userId === userId ? { ...a, accessLevel: level } : a
      ),
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/company/portfolios')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">New {portfolioLabel}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new {portfolioLabelLower} for {company?.name || 'your company'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                  <CardDescription>
                    Enter the core details for your {portfolioLabelLower}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {portfolioLabel} Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={`e.g., ${company?.industryProfile === 'vc' ? 'Growth Fund III' : company?.industryProfile === 'insurance' ? 'Commercial Property Book' : 'Oncology Pipeline 2025'}`}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Code */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="code">Internal Code</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Optional internal identifier used for tracking and reporting.
                            Common formats: FUND-001, GF-III, ONP-2025
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="code"
                      placeholder="e.g., FUND-001"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                      }
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder={`Describe the purpose and scope of this ${portfolioLabelLower}...`}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Configuration - comes first so currency is set before fund size */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                  <CardDescription>
                    Set currency, timezone, and jurisdiction preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Base Currency */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Base Currency</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              The primary currency for reporting and valuations.
                              All amounts will be in this currency.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={formData.baseCurrency}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, baseCurrency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} - {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Timezone</Label>
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, timezone: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.code} value={tz.code}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Jurisdiction */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Jurisdiction</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            The legal jurisdiction for compliance and regulatory reporting.
                            Leave blank if not applicable.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={formData.jurisdiction}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, jurisdiction: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTIONS.map((j) => (
                          <SelectItem key={j.code} value={j.code}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Fund Size / AUM - Only for VC */}
              {isVc && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fund Size</CardTitle>
                    <CardDescription>
                      Define the current and target assets under management in {getCurrencySymbol(formData.baseCurrency)} ({formData.baseCurrency})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Current AUM */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="aumCurrent">
                            Current AUM <span className="text-destructive">*</span>
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Total assets under management as of today.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(formData.baseCurrency)}
                          </span>
                          <Input
                            id="aumCurrent"
                            type="text"
                            placeholder="e.g., 150,000,000"
                            value={formData.aumCurrent}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value);
                              setFormData((prev) => ({ ...prev, aumCurrent: formatted }));
                            }}
                            className={`pl-10 ${errors.aumCurrent ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.aumCurrent && (
                          <p className="text-xs text-destructive">{errors.aumCurrent}</p>
                        )}
                      </div>

                      {/* Target AUM */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="aumTarget">Target AUM</Label>
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(formData.baseCurrency)}
                          </span>
                          <Input
                            id="aumTarget"
                            type="text"
                            placeholder="e.g., 250,000,000"
                            value={formData.aumTarget}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value);
                              setFormData((prev) => ({ ...prev, aumTarget: formatted }));
                            }}
                            className={`pl-10 ${errors.aumTarget ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.aumTarget && (
                          <p className="text-xs text-destructive">{errors.aumTarget}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VC Fund Profile Section */}
              {isVc && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Fund Profile
                    </CardTitle>
                    <CardDescription>
                      Configure fund structure, investment parameters, and policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Fund Type & Management Company */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fund Type</Label>
                        <Select
                          value={formData.fundType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, fundType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fund type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FUND_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="targetFundSize">Target Fund Size</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Total target capital raise for the fund</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(formData.baseCurrency)}
                          </span>
                          <Input
                            id="targetFundSize"
                            type="text"
                            placeholder="e.g., 500,000,000"
                            value={formData.targetFundSize}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value);
                              setFormData((prev) => ({ ...prev, targetFundSize: formatted }));
                            }}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Management Company */}
                    <div className="space-y-2">
                      <Label>Management Company</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Company name"
                          value={formData.managementCompanyName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, managementCompanyName: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="Entity ID (optional)"
                          value={formData.managementCompanyEntityId}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, managementCompanyEntityId: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    {/* Fund Term & Investment Period */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="fundTermYears">Fund Term (years)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Total fund life in years</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="fundTermYears"
                          type="number"
                          placeholder="e.g., 10"
                          value={formData.fundTermYears}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, fundTermYears: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="extensionOptions">Extension Options</Label>
                        <Input
                          id="extensionOptions"
                          placeholder="e.g., 2x1 year"
                          value={formData.extensionOptions}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, extensionOptions: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="investmentPeriodYears">Investment Period (years)</Label>
                        </div>
                        <Input
                          id="investmentPeriodYears"
                          type="number"
                          placeholder="e.g., 5"
                          value={formData.investmentPeriodYears}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, investmentPeriodYears: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    {/* Check Size Range */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Target Check Size Range</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Min and max investment amounts per deal</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(formData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            placeholder="Min (e.g., 1,000,000)"
                            value={formData.targetCheckSizeMin}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value);
                              setFormData((prev) => ({ ...prev, targetCheckSizeMin: formatted }));
                            }}
                            className="pl-10"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            {getCurrencySymbol(formData.baseCurrency)}
                          </span>
                          <Input
                            type="text"
                            placeholder="Max (e.g., 10,000,000)"
                            value={formData.targetCheckSizeMax}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value);
                              setFormData((prev) => ({ ...prev, targetCheckSizeMax: formatted }));
                            }}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reserve Policy & Ownership Targets */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="reservePolicy">Reserve Policy (%)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Target percentage reserved for follow-on investments</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <Input
                            id="reservePolicy"
                            type="number"
                            placeholder="e.g., 40"
                            value={formData.reservePolicy}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, reservePolicy: e.target.value }))
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetOwnershipMin">Target Ownership Min (%)</Label>
                        <div className="relative">
                          <Input
                            id="targetOwnershipMin"
                            type="number"
                            placeholder="e.g., 10"
                            value={formData.targetOwnershipMin}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, targetOwnershipMin: e.target.value }))
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetOwnershipMax">Target Ownership Max (%)</Label>
                        <div className="relative">
                          <Input
                            id="targetOwnershipMax"
                            type="number"
                            placeholder="e.g., 25"
                            value={formData.targetOwnershipMax}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, targetOwnershipMax: e.target.value }))
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Switches */}
                    <div className="flex gap-8 pt-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="recyclingAllowed"
                          checked={formData.recyclingAllowed}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, recyclingAllowed: checked }))
                          }
                        />
                        <div>
                          <Label htmlFor="recyclingAllowed" className="cursor-pointer">Recycling Allowed</Label>
                          <p className="text-xs text-muted-foreground">Reinvest proceeds during investment period</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="leverageAllowed"
                          checked={formData.leverageAllowed}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, leverageAllowed: checked }))
                          }
                        />
                        <div>
                          <Label htmlFor="leverageAllowed" className="cursor-pointer">Leverage Allowed</Label>
                          <p className="text-xs text-muted-foreground">Fund may use debt financing</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insurance Book Profile Section */}
              {isInsurance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Book Profile
                    </CardTitle>
                    <CardDescription>
                      Configure underwriting parameters, regulatory framework, and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Line of Business & Territory */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Line of Business <span className="text-destructive">*</span></Label>
                        <Select
                          value={formData.lineOfBusiness}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, lineOfBusiness: value }))
                          }
                        >
                          <SelectTrigger className={errors.lineOfBusiness ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select line of business" />
                          </SelectTrigger>
                          <SelectContent>
                            {LINES_OF_BUSINESS.map((lob) => (
                              <SelectItem key={lob.value} value={lob.value}>
                                {lob.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.lineOfBusiness && (
                          <p className="text-xs text-destructive">{errors.lineOfBusiness}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="territory">Territory</Label>
                        <Input
                          id="territory"
                          placeholder="e.g., North America, EMEA, Global"
                          value={formData.territory}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, territory: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    {/* Policy Term & Capital Regime */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Standard Policy Term</Label>
                        <Select
                          value={formData.policyTermStandard}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, policyTermStandard: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select policy term" />
                          </SelectTrigger>
                          <SelectContent>
                            {POLICY_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Capital Regime</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Regulatory capital framework applicable to this book</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select
                          value={formData.capitalRegime}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, capitalRegime: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select capital regime" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAPITAL_REGIMES.map((regime) => (
                              <SelectItem key={regime.value} value={regime.value}>
                                {regime.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Limits Defaults */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Default Limits</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Maximum exposure limits per risk and per event</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Max per Risk</span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                              {getCurrencySymbol(formData.baseCurrency)}
                            </span>
                            <Input
                              type="text"
                              placeholder="e.g., 50,000,000"
                              value={formData.limitsMaxPerRisk}
                              onChange={(e) => {
                                const formatted = formatNumberWithCommas(e.target.value);
                                setFormData((prev) => ({ ...prev, limitsMaxPerRisk: formatted }));
                              }}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Max per Event</span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                              {getCurrencySymbol(formData.baseCurrency)}
                            </span>
                            <Input
                              type="text"
                              placeholder="e.g., 100,000,000"
                              value={formData.limitsMaxPerEvent}
                              onChange={(e) => {
                                const formatted = formatNumberWithCommas(e.target.value);
                                setFormData((prev) => ({ ...prev, limitsMaxPerEvent: formatted }));
                              }}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reinsurance Program */}
                    <div className="space-y-2">
                      <Label htmlFor="reinsuranceProgram">Reinsurance Program</Label>
                      <Textarea
                        id="reinsuranceProgram"
                        placeholder="Describe the reinsurance structure (e.g., quota share, excess of loss, facultative arrangements)"
                        value={formData.reinsuranceProgram}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, reinsuranceProgram: e.target.value }))
                        }
                        rows={2}
                      />
                    </div>

                    {/* Claims Handling Model */}
                    <div className="space-y-2">
                      <Label>Claims Handling Model</Label>
                      <div className="flex gap-4">
                        {CLAIMS_HANDLING_MODELS.map((model) => (
                          <label
                            key={model.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="claimsHandlingModel"
                              value={model.value}
                              checked={formData.claimsHandlingModel === model.value}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, claimsHandlingModel: e.target.value }))
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{model.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pharma Pipeline Profile Section */}
              {isPharma && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Pipeline Profile
                    </CardTitle>
                    <CardDescription>
                      Configure therapeutic focus, modalities, and development strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Therapeutic Areas */}
                    <div className="space-y-2">
                      <Label>Therapeutic Areas</Label>
                      <div className="flex flex-wrap gap-2">
                        {THERAPEUTIC_AREAS.map((area) => {
                          const isSelected = formData.therapeuticAreas.includes(area);
                          return (
                            <Badge
                              key={area}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  therapeuticAreas: isSelected
                                    ? prev.therapeuticAreas.filter((a) => a !== area)
                                    : [...prev.therapeuticAreas, area],
                                }));
                              }}
                            >
                              {area}
                            </Badge>
                          );
                        })}
                      </div>
                      {formData.therapeuticAreas.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formData.therapeuticAreas.length} selected
                        </p>
                      )}
                    </div>

                    {/* Modalities */}
                    <div className="space-y-2">
                      <Label>Modalities</Label>
                      <div className="flex flex-wrap gap-2">
                        {MODALITIES.map((modality) => {
                          const isSelected = formData.modalities.includes(modality);
                          return (
                            <Badge
                              key={modality}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  modalities: isSelected
                                    ? prev.modalities.filter((m) => m !== modality)
                                    : [...prev.modalities, modality],
                                }));
                              }}
                            >
                              {modality}
                            </Badge>
                          );
                        })}
                      </div>
                      {formData.modalities.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formData.modalities.length} selected
                        </p>
                      )}
                    </div>

                    {/* Development Stages */}
                    <div className="space-y-2">
                      <Label>Development Stages Supported</Label>
                      <div className="flex flex-wrap gap-4">
                        {DEVELOPMENT_STAGES.map((stage) => {
                          const isSelected = formData.developmentStagesSupported.includes(stage.value);
                          return (
                            <label
                              key={stage.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    developmentStagesSupported: checked
                                      ? [...prev.developmentStagesSupported, stage.value]
                                      : prev.developmentStagesSupported.filter((s) => s !== stage.value),
                                  }));
                                }}
                              />
                              <span className="text-sm">{stage.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Regulators */}
                    <div className="space-y-2">
                      <Label>Target Regulators</Label>
                      <div className="flex flex-wrap gap-4">
                        {REGULATORS.map((regulator) => {
                          const isSelected = formData.targetRegulators.includes(regulator.value);
                          return (
                            <label
                              key={regulator.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetRegulators: checked
                                      ? [...prev.targetRegulators, regulator.value]
                                      : prev.targetRegulators.filter((r) => r !== regulator.value),
                                  }));
                                }}
                              />
                              <span className="text-sm">{regulator.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manufacturing Strategy */}
                    <div className="space-y-2">
                      <Label>Manufacturing Strategy</Label>
                      <div className="flex gap-4">
                        {MANUFACTURING_STRATEGIES.map((strategy) => (
                          <label
                            key={strategy.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="manufacturingStrategy"
                              value={strategy.value}
                              checked={formData.manufacturingStrategy === strategy.value}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, manufacturingStrategy: e.target.value }))
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{strategy.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Strategy Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="clinicalStrategyNotes">Clinical Strategy Notes</Label>
                      <Textarea
                        id="clinicalStrategyNotes"
                        placeholder="Describe the clinical development strategy, key milestones, partnership approach, etc."
                        value={formData.clinicalStrategyNotes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, clinicalStrategyNotes: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                  <CardDescription>
                    Define the {portfolioLabelLower} lifecycle dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {company?.industryProfile === 'vc'
                          ? 'Fund inception date'
                          : company?.industryProfile === 'insurance'
                          ? 'Book effective date'
                          : 'Pipeline start date'}
                      </p>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className={errors.endDate ? 'border-destructive' : ''}
                      />
                      {errors.endDate ? (
                        <p className="text-xs text-destructive">{errors.endDate}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {company?.industryProfile === 'vc'
                            ? 'Fund term end / wind-down'
                            : company?.industryProfile === 'insurance'
                            ? 'Book runoff date'
                            : 'Program end date'}
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
                  <CardDescription>
                    Add tags for organization and filtering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-8"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
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
                </CardContent>
              </Card>

              {/* Team Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Access
                  </CardTitle>
                  <CardDescription>
                    Assign team members and define their roles for this {portfolioLabelLower}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg divide-y">
                    {companyUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No team members available
                      </div>
                    ) : (
                      companyUsers.map((user) => {
                        const assignment = formData.userAssignments.find(
                          (a) => a.userId === user.id
                        );
                        const isCurrentUser = user.id === currentUser?.id;
                        const isAdminOrOwner = user.role === 'owner' || user.role === 'admin';

                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={!!assignment || isAdminOrOwner}
                                disabled={isAdminOrOwner}
                                onCheckedChange={() => toggleUserAssignment(user.id)}
                              />
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    {user.name}
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdminOrOwner ? (
                                <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                  Full Access (Admin)
                                </Badge>
                              ) : assignment ? (
                                <Select
                                  value={assignment.accessLevel}
                                  onValueChange={(value: PortfolioAccessLevel) =>
                                    setUserAccessLevel(user.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-28 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="maker">Maker</SelectItem>
                                    <SelectItem value="checker">Checker</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-muted-foreground">No access</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Maker:</strong> Can create and edit {company?.industryProfile === 'vc' ? 'deals' : company?.industryProfile === 'insurance' ? 'underwritings' : 'assessments'}, upload documents, and propose changes.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Checker:</strong> Can review, approve, and sign-off on decisions. Has all Maker permissions plus approval authority.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      `Create ${portfolioLabel}`
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/company/portfolios')}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          What happens next?
                        </p>
                        <p className="text-muted-foreground mt-1">
                          After creating this {portfolioLabelLower}, you&apos;ll be able to:
                        </p>
                        <ul className="text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                          <li>Add mandates and configure policies</li>
                          <li>Invite team members with access</li>
                          <li>Start tracking {company?.industryProfile === 'vc' ? 'deals' : company?.industryProfile === 'insurance' ? 'underwritings' : 'assessments'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium capitalize">{company?.industryProfile || 'VC'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}
