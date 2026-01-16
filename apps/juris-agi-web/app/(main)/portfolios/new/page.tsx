'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Info,
  Calendar,
  Globe,
  Tag,
  X,
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
import { useAuth } from '@/contexts/AuthContext';

// Common currencies (ISO 4217)
const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '\u20AC' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '\u00A3' },
  { code: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
  { code: 'JPY', label: 'Japanese Yen (JPY)', symbol: '\u00A5' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
  { code: 'HKD', label: 'Hong Kong Dollar (HKD)', symbol: 'HK$' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)', symbol: '\u00A5' },
];

// Get currency symbol from code
function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

// Format number with thousand separators
function formatNumberWithCommas(value: string): string {
  const digits = value.replace(/\D/g, '');
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
  aumCurrent: string;
  aumTarget: string;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();

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
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
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

    const portfolioData = {
      companyId: user?.companyId,
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

      setIsSaving(false);
      router.push('/portfolios');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setErrors({ name: 'Failed to create portfolio. Please try again.' });
      setIsSaving(false);
    }
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
            onClick={() => router.push('/portfolios')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">New Fund</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a new fund for {user?.companyName || 'your company'}
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
                    Enter the core details for your fund
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Fund Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Growth Fund III"
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
                      placeholder="Describe the purpose and scope of this fund..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fund Size */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fund Size</CardTitle>
                  <CardDescription>
                    Define the current and target assets under management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current AUM */}
                    <div className="space-y-2">
                      <Label htmlFor="aumCurrent">Current AUM</Label>
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
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Target AUM */}
                    <div className="space-y-2">
                      <Label htmlFor="aumTarget">Target AUM</Label>
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
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration */}
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
                      <Label>Base Currency</Label>
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
                    <Label>Jurisdiction</Label>
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

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                  <CardDescription>
                    Define the fund lifecycle dates
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
                      {errors.endDate && (
                        <p className="text-xs text-destructive">{errors.endDate}</p>
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
                      'Create Fund'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/portfolios')}
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
                        <p className="font-medium">What happens next?</p>
                        <p className="text-muted-foreground mt-1">
                          After creating this fund, you&apos;ll be able to:
                        </p>
                        <ul className="text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                          <li>Add mandates and configure policies</li>
                          <li>Assign team members with access</li>
                          <li>Start tracking cases</li>
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
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-medium">{user?.companyName || 'N/A'}</span>
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
