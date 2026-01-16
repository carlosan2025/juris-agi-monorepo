'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  CheckCircle2,
  Clock,
  Filter,
  ChevronDown,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/date-utils';

// Company roles matching Prisma schema
type CompanyRole =
  | 'OWNER'
  | 'ORG_ADMIN'
  | 'PROJECT_ADMIN'
  | 'MEMBER'
  | 'COMPLIANCE'
  | 'RISK'
  | 'FINANCE'
  | 'IC_MEMBER'
  | 'IC_CHAIR'
  | 'VIEWER';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  companyRole: CompanyRole;
  status: 'active' | 'pending' | 'deactivated';
  projectCount: number;
  lastActive: Date | null;
  createdAt: Date;
}

// backend_pending: Load from API
const MOCK_USERS: CompanyUser[] = [
  {
    id: '1',
    name: 'John Partner',
    email: 'john@acmecapital.com',
    companyRole: 'OWNER',
    status: 'active',
    projectCount: 12,
    lastActive: new Date('2024-01-15T10:30:00'),
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@acmecapital.com',
    companyRole: 'ORG_ADMIN',
    status: 'active',
    projectCount: 8,
    lastActive: new Date('2024-01-15T09:15:00'),
    createdAt: new Date('2023-03-20'),
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@acmecapital.com',
    companyRole: 'IC_MEMBER',
    status: 'active',
    projectCount: 5,
    lastActive: new Date('2024-01-14T16:45:00'),
    createdAt: new Date('2023-05-10'),
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@acmecapital.com',
    companyRole: 'RISK',
    status: 'active',
    projectCount: 3,
    lastActive: new Date('2024-01-14T11:20:00'),
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '5',
    name: 'Alex Chen',
    email: 'alex@acmecapital.com',
    companyRole: 'MEMBER',
    status: 'active',
    projectCount: 4,
    lastActive: new Date('2024-01-13T14:30:00'),
    createdAt: new Date('2023-08-01'),
  },
  {
    id: '6',
    name: 'Lisa Wilson',
    email: 'lisa@acmecapital.com',
    companyRole: 'COMPLIANCE',
    status: 'active',
    projectCount: 6,
    lastActive: new Date('2024-01-15T08:00:00'),
    createdAt: new Date('2023-09-10'),
  },
  {
    id: '7',
    name: 'David Brown',
    email: 'david@acmecapital.com',
    companyRole: 'VIEWER',
    status: 'pending',
    projectCount: 0,
    lastActive: null,
    createdAt: new Date('2024-01-10'),
  },
];

const ROLE_INFO: Record<CompanyRole, { label: string; description: string; color: string }> = {
  OWNER: {
    label: 'Owner',
    description: 'Full control including billing and company deletion',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  ORG_ADMIN: {
    label: 'Org Admin',
    description: 'Manage users, projects, and company settings',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  PROJECT_ADMIN: {
    label: 'Project Admin',
    description: 'Manage assigned projects and their baselines',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  MEMBER: {
    label: 'Member',
    description: 'Standard access to assigned projects',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  },
  COMPLIANCE: {
    label: 'Compliance',
    description: 'Access to compliance reports and audits',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  RISK: {
    label: 'Risk',
    description: 'Access to risk assessments and exception approvals',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  FINANCE: {
    label: 'Finance',
    description: 'Access to financial reports and portfolio data',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  IC_MEMBER: {
    label: 'IC Member',
    description: 'Investment committee member with voting rights',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  },
  IC_CHAIR: {
    label: 'IC Chair',
    description: 'Investment committee chair with final approval',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access to assigned projects',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('MEMBER');

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.companyRole === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = async () => {
    // backend_pending: Send invite via API
    await new Promise((r) => setTimeout(r, 1000));
    setIsInviteOpen(false);
    setInviteEmail('');
    setInviteRole('MEMBER');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users & Roles</h1>
          <p className="text-muted-foreground">
            Manage user access and company-wide permissions
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your company. They will receive an email with instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Company Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CompanyRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_INFO) as CompanyRole[])
                      .filter((r) => r !== 'OWNER') // Can't invite owners
                      .map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span>{ROLE_INFO[role].label}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_INFO[inviteRole].description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{MOCK_USERS.length}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {MOCK_USERS.filter((u) => u.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {MOCK_USERS.filter((u) => u.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {MOCK_USERS.filter((u) => ['OWNER', 'ORG_ADMIN'].includes(u.companyRole)).length}
            </div>
            <div className="text-xs text-muted-foreground">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-rose-600">
              {MOCK_USERS.filter((u) => ['IC_MEMBER', 'IC_CHAIR'].includes(u.companyRole)).length}
            </div>
            <div className="text-xs text-muted-foreground">IC Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.keys(ROLE_INFO) as CompanyRole[]).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_INFO[role].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_INFO[user.companyRole].color}>
                      {ROLE_INFO[user.companyRole].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{user.projectCount}</span>
                  </TableCell>
                  <TableCell>
                    {user.status === 'active' ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">Active</span>
                      </div>
                    ) : user.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-amber-600 dark:text-amber-400">Pending</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Deactivated</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastActive ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(user.lastActive)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Role Permissions</CardTitle>
          <CardDescription>Overview of what each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(ROLE_INFO) as CompanyRole[]).map((role) => (
              <div key={role} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <Badge variant="outline" className={`${ROLE_INFO[role].color} shrink-0`}>
                  {ROLE_INFO[role].label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {ROLE_INFO[role].description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
