'use client';

import { useState } from 'react';
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigation } from '@/contexts/NavigationContext';

// Mock billing data
const MOCK_SUBSCRIPTION = {
  plan: 'Enterprise',
  status: 'active',
  billingCycle: 'annual',
  price: 2400,
  nextBillingDate: new Date('2025-01-15'),
  seats: {
    used: 12,
    total: 25,
  },
  features: [
    'Unlimited portfolios',
    'Advanced AI analysis',
    'Custom integrations',
    'Priority support',
    'SSO authentication',
    'Audit logs',
  ],
};

const MOCK_INVOICES = [
  { id: 'INV-2024-003', date: new Date('2024-03-01'), amount: 200, status: 'paid' },
  { id: 'INV-2024-002', date: new Date('2024-02-01'), amount: 200, status: 'paid' },
  { id: 'INV-2024-001', date: new Date('2024-01-01'), amount: 2400, status: 'paid' },
  { id: 'INV-2023-012', date: new Date('2023-12-01'), amount: 200, status: 'paid' },
];

const MOCK_USAGE = {
  apiCalls: { used: 45000, limit: 100000 },
  storage: { used: 12.5, limit: 50 }, // GB
  documents: { used: 2340, limit: 10000 },
};

export default function BillingPage() {
  const { isOwner } = useNavigation();
  const [subscription] = useState(MOCK_SUBSCRIPTION);
  const [invoices] = useState(MOCK_INVOICES);
  const [usage] = useState(MOCK_USAGE);

  if (!isOwner()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">
            Only the account owner can access billing information.
          </p>
        </div>
      </div>
    );
  }

  const seatUsagePercent = (subscription.seats.used / subscription.seats.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your subscription and billing information
          </p>
        </div>
        <Button variant="outline">
          <CreditCard className="h-4 w-4 mr-2" />
          Update Payment Method
        </Button>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {subscription.plan} Plan
                <Badge className="bg-green-600">Active</Badge>
              </CardTitle>
              <CardDescription>
                Billed {subscription.billingCycle === 'annual' ? 'annually' : 'monthly'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${subscription.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  /{subscription.billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                <Calendar className="h-3 w-3" />
                Next billing: {subscription.nextBillingDate.toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Seat Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Seat Usage</span>
                <span className="font-medium">
                  {subscription.seats.used} / {subscription.seats.total} seats
                </span>
              </div>
              <Progress value={seatUsagePercent} className="h-2" />
              {seatUsagePercent > 80 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Running low on seats. Consider upgrading.
                </p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Included Features</span>
              <div className="grid grid-cols-2 gap-1">
                {subscription.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              Change Plan
            </Button>
            <Button variant="outline" size="sm">
              Add Seats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {usage.apiCalls.used.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {usage.apiCalls.limit.toLocaleString()} included
            </p>
            <Progress
              value={(usage.apiCalls.used / usage.apiCalls.limit) * 100}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{usage.storage.used} GB</div>
            <p className="text-xs text-muted-foreground">
              of {usage.storage.limit} GB included
            </p>
            <Progress
              value={(usage.storage.used / usage.storage.limit) * 100}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documents Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {usage.documents.used.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {usage.documents.limit.toLocaleString()} included
            </p>
            <Progress
              value={(usage.documents.used / usage.documents.limit) * 100}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice History</CardTitle>
          <CardDescription>Download past invoices for your records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Invoice</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell className="text-sm">
                    {invoice.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">${invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        invoice.status === 'paid'
                          ? 'border-green-500 text-green-600'
                          : 'border-amber-500 text-amber-600'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
