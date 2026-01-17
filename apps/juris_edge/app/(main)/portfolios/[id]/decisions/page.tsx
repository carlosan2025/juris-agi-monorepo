'use client';

import { Gavel, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FundDecisionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Decisions</h1>
        <p className="text-sm text-muted-foreground">
          Decision records, exception register, and approval workflows
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Exceptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sign-offs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="decisions">
        <TabsList>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Decision Register
              </CardTitle>
              <CardDescription>
                All investment decisions with rationale and supporting evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Gavel className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No decisions recorded</p>
                <p className="text-sm">Decisions appear here after case evaluations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exception Register</CardTitle>
              <CardDescription>
                Cases that required exceptions to standard investment criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No exceptions logged</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Workflows</CardTitle>
              <CardDescription>
                Sign-off requirements and approval chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No pending approvals</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
