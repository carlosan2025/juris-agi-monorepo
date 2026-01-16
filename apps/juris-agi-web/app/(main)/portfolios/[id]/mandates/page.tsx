'use client';

import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FundMandatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mandates</h1>
          <p className="text-sm text-muted-foreground">
            Investment mandates and strategies for this fund
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Mandate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Active Mandates
          </CardTitle>
          <CardDescription>
            Define investment criteria, sector focus, and evaluation rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No mandates configured yet</p>
            <p className="text-sm">Create your first mandate to define investment criteria</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
