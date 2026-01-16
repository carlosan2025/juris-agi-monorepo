'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', check: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains a number', check: (p: string) => /[0-9]/.test(p) },
];

interface InviteDetails {
  id: string;
  companyName: string;
  companyId: string;
  inviterName: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
  portfolioAccess: {
    portfolioId: string;
    portfolioName: string;
    accessLevel: 'maker' | 'checker';
  }[];
  expiresAt: string;
  status: string;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchInvite = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load invitation');
          setInvite(null);
        } else if (data.success) {
          setInvite(data.invitation);
          setFormData((prev) => ({ ...prev, name: data.invitation.name || '' }));
        }
      } catch (err) {
        setError('Failed to load invitation. Please try again.');
        setInvite(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvite();
    }
  }, [token]);

  const passwordMet = PASSWORD_REQUIREMENTS.map((req) =>
    req.check(formData.password)
  );
  const allPasswordRequirementsMet = passwordMet.every(Boolean);
  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allPasswordRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation');
        setIsSubmitting(false);
        return;
      }

      // Show success and redirect to login
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Invitation Error</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Account Created!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your account has been created successfully. Redirecting to login...
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/juris-logo.png"
              alt="Juris"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <CardTitle className="text-xl">You&apos;re invited to join</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{invite.companyName}</span>
          </div>
          <CardDescription className="mt-2">
            {invite.inviterName} has invited you to join their team on Juris
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Access summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your role:</span>
              <Badge variant="outline" className="capitalize">{invite.role}</Badge>
            </div>
            {invite.portfolioAccess && invite.portfolioAccess.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Portfolio access:</span>
                <div className="space-y-1">
                  {invite.portfolioAccess.map((access) => (
                    <div
                      key={access.portfolioId}
                      className="flex items-center justify-between text-sm bg-background rounded px-3 py-2"
                    >
                      <span>{access.portfolioName}</span>
                      <Badge
                        variant="outline"
                        className={
                          access.accessLevel === 'checker'
                            ? 'border-green-500 text-green-600'
                            : 'border-blue-500 text-blue-600'
                        }
                      >
                        {access.accessLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account creation form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invite.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {formData.password && (
                <div className="space-y-1 pt-2">
                  {PASSWORD_REQUIREMENTS.map((req, index) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-2 text-xs ${
                        passwordMet[index]
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${
                          passwordMet[index] ? 'opacity-100' : 'opacity-30'
                        }`}
                      />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !allPasswordRequirementsMet || !passwordsMatch || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By accepting this invitation, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
