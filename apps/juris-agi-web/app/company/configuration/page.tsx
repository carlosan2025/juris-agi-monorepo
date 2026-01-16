'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Building2,
  Save,
  Globe,
  Briefcase,
  CheckCircle2,
  Lock,
  Upload,
  Trash2,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from '@/contexts/NavigationContext';
import type { IndustryProfile } from '@/types/domain';

const INDUSTRY_LABELS: Record<IndustryProfile, { label: string; description: string }> = {
  vc: {
    label: 'Venture Capital',
    description: 'Investment funds and portfolio management',
  },
  insurance: {
    label: 'Insurance',
    description: 'Underwriting and risk assessment',
  },
  pharma: {
    label: 'Pharmaceutical',
    description: 'Drug development and clinical trials',
  },
};

export default function ConfigurationPage() {
  const { company, isAdmin, updateCompany } = useNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    address: '',
  });

  // Sync form data with company data
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: '',
        website: '',
        address: '',
      });
      // Fetch the current logo URL from the company
      fetchCompanyDetails();
    }
  }, [company?.id]);

  const fetchCompanyDetails = async () => {
    if (!company?.id) return;
    try {
      const response = await fetch(`/api/companies/${company.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.company.logoUrl) {
          setCurrentLogoUrl(data.company.logoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch company details:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Update company name via API
    if (formData.name !== company?.name) {
      await updateCompany({ name: formData.name });
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Invalid file type. Allowed: JPEG, PNG, WebP, SVG');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File too large. Maximum size: 2MB');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setLogoError(data.error || 'Failed to upload logo');
        return;
      }

      setCurrentLogoUrl(data.logoUrl);
      // Update company context
      updateCompany({ settings: { ...company.settings, logoUrl: data.logoUrl } });
    } catch (error) {
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!company?.id) return;

    setIsUploadingLogo(true);
    setLogoError(null);

    try {
      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setLogoError(data.error || 'Failed to remove logo');
        return;
      }

      setCurrentLogoUrl(null);
      // Update company context
      updateCompany({ settings: { ...company.settings, logoUrl: undefined } });
    } catch (error) {
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">
            You need admin privileges to access company configuration.
          </p>
        </div>
      </div>
    );
  }

  const industryInfo = company?.industryProfile
    ? INDUSTRY_LABELS[company.industryProfile]
    : null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Company Configuration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your company details and settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" />
            Company Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo to display in the sidebar and throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                {currentLogoUrl ? (
                  <Image
                    src={currentLogoUrl}
                    alt="Company logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
                {currentLogoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200 pixels. Max 2MB. Supports JPEG, PNG, WebP, SVG.
              </p>
              {logoError && (
                <p className="text-xs text-destructive">{logoError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Company Details
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your company"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-muted-foreground absolute ml-3" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Company address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Profile - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            Industry Profile
            <Badge variant="outline" className="ml-2 text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          </CardTitle>
          <CardDescription>
            Your industry was set during company setup and cannot be changed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {industryInfo ? (
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{industryInfo.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {industryInfo.description}
                  </div>
                </div>
                <Badge variant="default">{company?.industryProfile?.toUpperCase()}</Badge>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground">
              Industry profile not set
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            The industry profile determines terminology throughout the application (e.g., "Funds" for VC, "Books" for Insurance, "Pipelines" for Pharma).
            Contact support if you need to change your industry profile.
          </p>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              company?.setupComplete ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {company?.setupComplete ? 'Setup Complete' : 'Setup In Progress'}
              </div>
              <div className="text-xs text-muted-foreground">
                {company?.setupComplete
                  ? 'Your company is fully configured and ready to use'
                  : 'Complete the setup to start using all features'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
