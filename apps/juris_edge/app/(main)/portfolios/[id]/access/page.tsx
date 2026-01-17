'use client';

import { ShieldCheck, Users, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FundAccessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Access</h1>
          <p className="text-sm text-muted-foreground">
            Role-based access control and audit log
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">With fund access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Roles Defined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Custom roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Fund Members
              </CardTitle>
              <CardDescription>
                Users with access to this fund and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No members assigned</p>
                <p className="text-sm">Add team members to collaborate on this fund</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role Definitions
              </CardTitle>
              <CardDescription>
                Configure fund-specific roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Using default roles</p>
                <p className="text-sm">Create custom roles for granular access control</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Complete activity history for compliance and review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No audit events</p>
                <p className="text-sm">Activity will be logged as users interact with the fund</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
