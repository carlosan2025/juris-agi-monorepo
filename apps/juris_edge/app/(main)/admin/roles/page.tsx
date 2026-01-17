'use client';

import { Shield, Check, X, Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// backend_pending: Load from API
const ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    color: 'purple',
    userCount: 2,
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Can create and evaluate cases, manage projects',
    color: 'blue',
    userCount: 8,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to cases and reports',
    color: 'gray',
    userCount: 3,
  },
];

const PERMISSIONS = [
  { id: 'projects.create', label: 'Create Projects', category: 'Projects' },
  { id: 'projects.edit', label: 'Edit Projects', category: 'Projects' },
  { id: 'projects.delete', label: 'Delete Projects', category: 'Projects' },
  { id: 'cases.create', label: 'Create Cases', category: 'Cases' },
  { id: 'cases.evaluate', label: 'Run Evaluations', category: 'Cases' },
  { id: 'cases.approve', label: 'Approve Decisions', category: 'Cases' },
  { id: 'documents.upload', label: 'Upload Documents', category: 'Documents' },
  { id: 'documents.delete', label: 'Delete Documents', category: 'Documents' },
  { id: 'admin.users', label: 'Manage Users', category: 'Admin' },
  { id: 'admin.settings', label: 'Manage Settings', category: 'Admin' },
  { id: 'admin.billing', label: 'Manage Billing', category: 'Admin' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.id),
  analyst: [
    'projects.create',
    'projects.edit',
    'cases.create',
    'cases.evaluate',
    'documents.upload',
  ],
  viewer: [],
};

export default function AdminRolesPage() {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            View and manage user roles and their permissions
          </p>
        </div>

        {/* Roles Overview */}
        <div className="grid grid-cols-3 gap-4">
          {ROLES.map((role) => (
            <Card key={role.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      role.color === 'purple'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : role.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Shield
                      className={`h-5 w-5 ${
                        role.color === 'purple'
                          ? 'text-purple-600 dark:text-purple-400'
                          : role.color === 'blue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.userCount} users
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>
              Overview of permissions for each role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Permission</TableHead>
                  {ROLES.map((role) => (
                    <TableHead key={role.id} className="text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {['Projects', 'Cases', 'Documents', 'Admin'].map((category) => (
                  <>
                    <TableRow key={category} className="bg-muted/50">
                      <TableCell colSpan={4} className="font-medium">
                        {category}
                      </TableCell>
                    </TableRow>
                    {PERMISSIONS.filter((p) => p.category === category).map(
                      (permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="pl-8">{permission.label}</TableCell>
                          {ROLES.map((role) => (
                            <TableCell key={role.id} className="text-center">
                              {ROLE_PERMISSIONS[role.id].includes(permission.id) ? (
                                <Check className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Placeholder notice */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Role management is currently read-only.
              Custom roles and permission editing require backend integration.
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
