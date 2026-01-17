'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Target,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INDUSTRY_CONFIG, type IndustryProfile } from '@/types/domain';

// Wizard steps
type WizardStep = 'basics' | 'team' | 'confirm';

const STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'basics', label: 'Mandate Details', description: 'Name and description' },
  { id: 'team', label: 'Team Members', description: 'Assign initial team' },
  { id: 'confirm', label: 'Confirm', description: 'Review and create' },
];

// Mock company data
const MOCK_COMPANY = {
  industryProfile: 'vc' as IndustryProfile,
  users: [
    { id: '1', name: 'John Partner', email: 'john@acmecapital.com', role: 'OWNER' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@acmecapital.com', role: 'ORG_ADMIN' },
    { id: '3', name: 'Mike Johnson', email: 'mike@acmecapital.com', role: 'IC_MEMBER' },
    { id: '4', name: 'Emily Davis', email: 'emily@acmecapital.com', role: 'RISK' },
    { id: '5', name: 'Alex Chen', email: 'alex@acmecapital.com', role: 'MEMBER' },
  ],
};

interface MandateFormData {
  name: string;
  description: string;
  teamMembers: string[];
  mandateAdmin: string;
}

export default function NewMandatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<MandateFormData>({
    name: '',
    description: '',
    teamMembers: [],
    mandateAdmin: '',
  });

  const industryConfig = INDUSTRY_CONFIG[MOCK_COMPANY.industryProfile];
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return formData.name.trim().length >= 3;
      case 'team':
        return true; // Team is optional
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    // backend_pending: Create mandate via API
    // This will:
    // 1. Create the mandate with DRAFT status
    // 2. Auto-create a baseline version 1 in DRAFT status
    // 3. Initialize empty module payloads for all 5 modules
    // 4. Add team members
    await new Promise((r) => setTimeout(r, 1500));

    // Redirect to constitution wizard to complete setup
    router.push('/mandates/new-mandate-id/constitution');
  };

  const toggleTeamMember = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(userId)
        ? prev.teamMembers.filter((id) => id !== userId)
        : [...prev.teamMembers, userId],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mandates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Create New Mandate</h1>
          <p className="text-sm text-muted-foreground">
            Set up a new {industryConfig.mandateLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4 rounded-full bg-current/20 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
              )}
              <span className="font-medium">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {currentStep === 'basics' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Mandate Details
              </CardTitle>
              <CardDescription>
                Basic information about your new {industryConfig.mandateLabel.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Mandate Name *</Label>
                <Input
                  id="name"
                  placeholder={`e.g., ${industryConfig.label === 'Venture Capital' ? 'Growth Fund III Investment Mandate' : industryConfig.label === 'Insurance' ? 'Commercial Property Q1 Mandate' : 'Oncology Pipeline 2024 Mandate'}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for this evaluation mandate (min 3 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and scope of this mandate..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What happens next?
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>1. A draft baseline (v1) will be created automatically</p>
                  <p>2. You&apos;ll configure the 5 constitution modules (Mandate, Exclusions, Risk Appetite, Governance, Reporting)</p>
                  <p>3. Once published, you can create {industryConfig.caseLabel.toLowerCase()}s</p>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'team' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Select team members who will have access to this mandate (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mandate Admin</Label>
                <Select
                  value={formData.mandateAdmin}
                  onValueChange={(v) => setFormData({ ...formData, mandateAdmin: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mandate admin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_COMPANY.users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The mandate admin can manage baselines and team access
                </p>
              </div>

              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_COMPANY.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleTeamMember(user.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.teamMembers.includes(user.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        {formData.teamMembers.includes(user.id) && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review & Create
              </CardTitle>
              <CardDescription>
                Confirm the mandate details before creating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground">Mandate Name</div>
                    <div className="font-medium">{formData.name}</div>
                  </div>
                  <Badge variant="secondary">
                    {industryConfig.mandateLabel}
                  </Badge>
                </div>

                {formData.description && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                    <div className="text-sm">{formData.description}</div>
                  </div>
                )}

                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Team</div>
                  <div className="text-sm">
                    {formData.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {formData.teamMembers.map((id) => {
                          const user = MOCK_COMPANY.users.find((u) => u.id === id);
                          return user ? (
                            <Badge key={id} variant="outline">
                              {user.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No team members selected (can be added later)</span>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-900 dark:text-amber-100">
                        Constitution Setup Required
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        After creating this mandate, you&apos;ll need to configure the Mandate Constitution
                        (5 modules) and publish baseline v1 before you can create {industryConfig.caseLabel.toLowerCase()}s.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? () => router.push('/mandates') : handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep === 'confirm' ? (
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Create Mandate
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
