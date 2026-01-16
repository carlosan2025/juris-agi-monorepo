'use client';

import { ScrollText, Plus, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FundConstitutionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Constitution</h1>
          <p className="text-sm text-muted-foreground">
            Baseline versions and governance rulebook
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Version
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Baseline Versions
          </CardTitle>
          <CardDescription>
            Track changes to fund rules, exclusions, risk appetite, and governance thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No baseline versions yet</p>
            <p className="text-sm">Create your first baseline to define fund constitution</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
