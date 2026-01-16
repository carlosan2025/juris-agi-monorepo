'use client';

import { Scale, GitCompare, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FundPrecedentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Precedents</h1>
        <p className="text-sm text-muted-foreground">
          Case law database and baseline drift tracking
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precedents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Binding decisions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drift Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Detected this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">--</div>
            <p className="text-xs text-muted-foreground">Decision alignment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="precedents">
        <TabsList>
          <TabsTrigger value="precedents">Precedents</TabsTrigger>
          <TabsTrigger value="drift">Drift Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="precedents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Precedent Library
              </CardTitle>
              <CardDescription>
                Binding and persuasive precedents from past decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No precedents established</p>
                <p className="text-sm">Mark decisions as precedents to build case law</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                Drift Tracking
              </CardTitle>
              <CardDescription>
                Monitor deviations from established precedents and baseline rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No drift detected</p>
                <p className="text-sm">Drift events will appear when decisions deviate from precedents</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
