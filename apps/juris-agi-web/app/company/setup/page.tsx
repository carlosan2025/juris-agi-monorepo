'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Building2,
  Briefcase,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import type { IndustryProfile } from '@/types/domain';

const STEPS = [
  { id: 'company', title: 'Company Details', icon: Building2 },
  { id: 'industry', title: 'Industry Profile', icon: Briefcase },
  { id: 'team', title: 'Invite Team', icon: Users },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

const INDUSTRY_OPTIONS: { value: IndustryProfile; label: string; description: string; features: string[] }[] = [
  {
    value: 'vc',
    label: 'Venture Capital',
    description: 'Investment funds and portfolio management',
    features: ['Portfolio tracking', 'Deal flow management', 'Investment analysis', 'Fund reporting'],
  },
  {
    value: 'insurance',
    label: 'Insurance',
    description: 'Underwriting and risk assessment',
    features: ['Risk assessment', 'Claims analysis', 'Policy management', 'Compliance tracking'],
  },
  {
    value: 'pharma',
    label: 'Pharmaceutical',
    description: 'Drug development and clinical trials',
    features: ['Clinical trial data', 'Regulatory compliance', 'Research analysis', 'Evidence synthesis'],
  },
];

export default function CompanySetupPage() {
  const router = useRouter();
  const { user, setCompanySetupComplete } = useAuth();
  const { completeSetup } = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Company details - pre-fill with company name from registration if available
    companyName: user?.companyName || '',
    description: '',
    website: '',
    // Industry
    industryProfile: '' as IndustryProfile | '',
    // Team invites
    invites: [{ email: '', name: '' }],
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.companyName.trim().length > 0;
      case 1:
        return formData.industryProfile !== '';
      case 2:
        return true; // Invites are optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addInvite = () => {
    setFormData({
      ...formData,
      invites: [...formData.invites, { email: '', name: '' }],
    });
  };

  const removeInvite = (index: number) => {
    setFormData({
      ...formData,
      invites: formData.invites.filter((_, i) => i !== index),
    });
  };

  const updateInvite = (index: number, field: 'email' | 'name', value: string) => {
    const newInvites = [...formData.invites];
    newInvites[index][field] = value;
    setFormData({ ...formData, invites: newInvites });
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // Save to navigation context (calls API to update company in database)
      await completeSetup({
        companyName: formData.companyName,
        industryProfile: formData.industryProfile as IndustryProfile,
      });

      // Mark setup complete in auth context
      setCompanySetupComplete();
      router.push('/company');
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your company (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select your industry to customize Juris for your specific needs. This determines
              terminology, default configurations, and available features.
            </p>
            <div className="grid gap-4">
              {INDUSTRY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormData({ ...formData, industryProfile: option.value })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.industryProfile === option.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        {formData.industryProfile === option.value && (
                          <Badge variant="default" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                    {formData.industryProfile === option.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {option.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite team members to join your company. You can always add more users later from
              the Users page.
            </p>
            <div className="space-y-3">
              {formData.invites.map((invite, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Email address"
                      type="email"
                      value={invite.email}
                      onChange={(e) => updateInvite(index, 'email', e.target.value)}
                    />
                    <Input
                      placeholder="Name (optional)"
                      value={invite.name}
                      onChange={(e) => updateInvite(index, 'name', e.target.value)}
                    />
                  </div>
                  {formData.invites.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeInvite(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addInvite}>
              + Add another
            </Button>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Invited users will receive an email invitation to join your
                company. You can assign them to specific portfolios and set their access levels
                (Maker/Checker) after they accept the invitation.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your company <strong>{formData.companyName}</strong> has been configured.
              {formData.invites.some((i) => i.email) &&
                ` We'll send invitations to your team members shortly.`}
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-sm mb-2">Next steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Create your first portfolio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Configure integrations in Settings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Set up mandates for your portfolios
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <Image
              src="/juris-logo.png"
              alt="Juris"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-8 h-px bg-border mx-1" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <CardTitle className="text-xl">
              {currentStep === 3 ? 'Setup Complete' : `Set up ${STEPS[currentStep].title}`}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Tell us about your company'}
              {currentStep === 1 && 'Choose your industry profile'}
              {currentStep === 2 && 'Invite your team members'}
              {currentStep === 3 && 'Your company is ready to use'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={currentStep === 0 ? 'invisible' : ''}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                {currentStep === 2 ? 'Complete Setup' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? 'Setting up...' : 'Go to Dashboard'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
