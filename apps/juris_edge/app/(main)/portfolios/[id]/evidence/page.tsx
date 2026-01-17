'use client';

import { Library, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function FundEvidencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Evidence</h1>
          <p className="text-sm text-muted-foreground">
            Document library, admissibility schema, and extracted claims
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents and claims..." className="pl-9" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">In evidence library</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Extracted claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admissibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">--</div>
            <p className="text-xs text-muted-foreground">Schema not configured</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Library className="h-4 w-4" />
            Evidence Library
          </CardTitle>
          <CardDescription>
            Upload documents, define admissibility rules, and view extracted claims graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Library className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No documents uploaded</p>
            <p className="text-sm">Upload documents to build your evidence library</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
