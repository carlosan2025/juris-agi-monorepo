'use client';

import { FileBarChart, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FundReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Reporting packs, instances, and certifications
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Configured templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="instances">Generated</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                Report Templates
              </CardTitle>
              <CardDescription>
                IC memos, LP packs, and regulatory report templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No report templates configured</p>
                <p className="text-sm">Create templates to automate reporting</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generated Reports</CardTitle>
              <CardDescription>
                Historical report instances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No reports generated yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certifications</CardTitle>
              <CardDescription>
                Report sign-offs and compliance certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <p>No certifications pending</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
