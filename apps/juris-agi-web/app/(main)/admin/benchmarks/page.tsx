'use client';

import { useState } from 'react';
import { Plus, Search, Copy, Trash2, Edit, FileText, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// backend_pending: Load from API
const MOCK_BENCHMARKS = [
  {
    id: '1',
    name: 'Series A Default',
    description: 'Standard evaluation parameters for Series A investments',
    industry: 'vc',
    isDefault: true,
    usageCount: 45,
    lastUsed: new Date('2024-01-15'),
    parameters: {
      minRevenue: 1000000,
      maxBurnRate: 500000,
      minGrowthRate: 50,
      teamSize: { min: 5, max: 50 },
    },
  },
  {
    id: '2',
    name: 'Seed Stage',
    description: 'Relaxed parameters for early-stage startups',
    industry: 'vc',
    isDefault: false,
    usageCount: 23,
    lastUsed: new Date('2024-01-10'),
    parameters: {
      minRevenue: 0,
      maxBurnRate: 200000,
      minGrowthRate: 20,
      teamSize: { min: 2, max: 20 },
    },
  },
  {
    id: '3',
    name: 'Growth Stage',
    description: 'Higher bar for growth-stage companies',
    industry: 'vc',
    isDefault: false,
    usageCount: 12,
    lastUsed: new Date('2024-01-05'),
    parameters: {
      minRevenue: 10000000,
      maxBurnRate: 2000000,
      minGrowthRate: 100,
      teamSize: { min: 50, max: 500 },
    },
  },
];

export default function AdminBenchmarksPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBenchmarks = MOCK_BENCHMARKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benchmark Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable evaluation parameter templates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{MOCK_BENCHMARKS.length}</div>
            <div className="text-sm text-muted-foreground">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {MOCK_BENCHMARKS.reduce((sum, b) => sum + b.usageCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Usages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {MOCK_BENCHMARKS.filter((b) => b.isDefault).length}
            </div>
            <div className="text-sm text-muted-foreground">Default Templates</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Benchmark templates for evaluation parameters
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBenchmarks.map((benchmark) => (
                <TableRow key={benchmark.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {benchmark.name}
                          {benchmark.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {benchmark.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {benchmark.industry}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {benchmark.usageCount} evaluations
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {benchmark.lastUsed.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Preview: Series A Default</CardTitle>
          <CardDescription>
            Parameter values for the selected template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Minimum Revenue</div>
              <div className="text-lg font-medium">$1,000,000</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Max Burn Rate</div>
              <div className="text-lg font-medium">$500,000/month</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Min Growth Rate</div>
              <div className="text-lg font-medium">50% YoY</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Team Size Range</div>
              <div className="text-lg font-medium">5 - 50 employees</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
