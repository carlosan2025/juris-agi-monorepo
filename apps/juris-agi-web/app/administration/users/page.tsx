'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  UserPlus,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  KeyRound,
  Building2,
  Search,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useJurisAdmin } from '@/contexts/JurisAdminContext';
import type { JurisAdmin } from '@/types/admin';

// Tenant user type
interface TenantUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  lastLoginAt: Date | null;
  createdAt: Date;
}

// Company type for filter
interface Company {
  id: string;
  name: string;
  slug: string;
  usersCount: number;
}

function getAdminRoleBadge(role: JurisAdmin['role']) {
  switch (role) {
    case 'super_admin':
      return <Badge className="bg-purple-600">Super Admin</Badge>;
    case 'admin':
      return <Badge className="bg-blue-600">Admin</Badge>;
    case 'support':
      return <Badge variant="secondary">Support</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function getTenantRoleBadge(role: TenantUser['role']) {
  switch (role) {
    case 'owner':
      return <Badge className="bg-purple-600">Owner</Badge>;
    case 'admin':
      return <Badge className="bg-blue-600">Admin</Badge>;
    case 'member':
      return <Badge variant="secondary">Member</Badge>;
    case 'viewer':
      return <Badge variant="outline">Viewer</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function getStatusBadge(status: 'active' | 'pending' | 'suspended') {
  switch (status) {
    case 'active':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs">Active</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs">Pending</span>
        </div>
      );
    case 'suspended':
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Suspended</span>
        </div>
      );
  }
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentAdmin, logout, getAllAdmins, addAdmin, deleteAdmin } = useJurisAdmin();

  const [admins, setAdmins] = useState<JurisAdmin[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Add admin dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: '',
    name: '',
    role: 'admin' as JurisAdmin['role'],
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Password reset dialog
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<TenantUser | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load admins on mount
  useEffect(() => {
    if (isAuthenticated) {
      setAdmins(getAllAdmins());
    }
  }, [isAuthenticated, getAllAdmins]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/administration/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch real tenant users from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform dates from strings to Date objects
            const users = data.users.map((u: TenantUser & { lastLoginAt: string | null; createdAt: string }) => ({
              ...u,
              lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
              createdAt: new Date(u.createdAt),
            }));
            setTenantUsers(users);
            setCompanies(data.companies || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  // Filter tenant users
  const filteredTenantUsers = tenantUsers.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === 'all' || user.companyId === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const handleAddAdmin = async () => {
    setError('');

    if (!newAdminData.email || !newAdminData.name) {
      setError('Please fill in all fields');
      return;
    }

    if (admins.some(a => a.email.toLowerCase() === newAdminData.email.toLowerCase())) {
      setError('An admin with this email already exists');
      return;
    }

    setIsAdding(true);

    addAdmin({
      email: newAdminData.email,
      name: newAdminData.name,
      role: newAdminData.role,
    });

    setAdmins(getAllAdmins());

    setIsAdding(false);
    setShowAddDialog(false);
    setNewAdminData({ email: '', name: '', role: 'admin' });
  };

  const handleDeleteAdmin = (adminId: string) => {
    if (adminId === currentAdmin?.adminId) {
      alert('You cannot delete your own account');
      return;
    }

    if (confirm('Are you sure you want to delete this admin?')) {
      deleteAdmin(adminId);
      setAdmins(getAllAdmins());
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    setIsResettingPassword(true);
    setResetPasswordResult(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          userId: resetPasswordUser.id,
          email: resetPasswordUser.email,
        }),
      });

      const result = await response.json();

      setResetPasswordResult({
        success: result.success,
        message: result.success
          ? `Password reset email sent to ${resetPasswordUser.email}`
          : result.error || 'Failed to send reset email',
      });
    } catch {
      setResetPasswordResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    }

    setIsResettingPassword(false);
  };

  const handleSuspendUser = (user: TenantUser) => {
    if (confirm(`Are you sure you want to ${user.status === 'suspended' ? 'reactivate' : 'suspend'} ${user.name}?`)) {
      setTenantUsers(prev => prev.map(u =>
        u.id === user.id
          ? { ...u, status: user.status === 'suspended' ? 'active' as const : 'suspended' as const }
          : u
      ));
    }
  };

  // Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.isActive).length;
  const totalTenantUsers = tenantUsers.length;
  const activeTenantUsers = tenantUsers.filter(u => u.status === 'active').length;
  const pendingTenantUsers = tenantUsers.filter(u => u.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">Juris Admin</h1>
                <p className="text-xs text-muted-foreground">Platform Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{currentAdmin?.name}</p>
                <p className="text-xs text-muted-foreground">{currentAdmin?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4">
          <Link href="/administration">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage platform administrators and tenant users
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold">{totalAdmins}</div>
              <div className="text-xs text-muted-foreground">Platform Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-green-600">{activeAdmins}</div>
              <div className="text-xs text-muted-foreground">Active Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold">{totalTenantUsers}</div>
              <div className="text-xs text-muted-foreground">Tenant Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-green-600">{activeTenantUsers}</div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-amber-600">{pendingTenantUsers}</div>
              <div className="text-xs text-muted-foreground">Pending Invites</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList>
            <TabsTrigger value="admins">Platform Admins ({totalAdmins})</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Users ({totalTenantUsers})</TabsTrigger>
          </TabsList>

          {/* Platform Admins Tab */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex items-center justify-end">
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Administrators</CardTitle>
                <CardDescription>
                  Users with access to the Juris Admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Admin</TableHead>
                      <TableHead className="text-xs w-32">Role</TableHead>
                      <TableHead className="text-xs w-32">Status</TableHead>
                      <TableHead className="text-xs w-40">Last Login</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {admin.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-2">
                                {admin.name}
                                {admin.id === currentAdmin?.adminId && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getAdminRoleBadge(admin.role)}</TableCell>
                        <TableCell>
                          {admin.passwordSet ? (
                            <div className="flex items-center gap-1.5 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="text-xs">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="text-xs">Pending Setup</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {admin.lastLoginAt
                              ? new Date(admin.lastLoginAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {admin.id !== currentAdmin?.adminId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenant Users Tab */}
          <TabsContent value="tenants" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tenant Users</CardTitle>
                <CardDescription>
                  Users belonging to tenant organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs w-28">Role</TableHead>
                      <TableHead className="text-xs w-28">Status</TableHead>
                      <TableHead className="text-xs w-36">Last Login</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenantUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.companyName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTenantRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setResetPasswordResult(null);
                                  setShowResetPasswordDialog(true);
                                }}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={user.status === 'suspended' ? 'text-green-600' : 'text-amber-600'}
                                onClick={() => handleSuspendUser(user)}
                              >
                                {user.status === 'suspended' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Reactivate
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Suspend
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTenantUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Add a new administrator to the Juris AGI platform. They will need to set their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="John Doe"
                value={newAdminData.name}
                onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newAdminData.role}
                onValueChange={(value: JurisAdmin['role']) =>
                  setNewAdminData({ ...newAdminData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Super Admins have full access. Admins can manage companies and users. Support has read-only access.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Send a password reset email to the user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resetPasswordUser && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {resetPasswordUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{resetPasswordUser.name}</div>
                    <div className="text-sm text-muted-foreground">{resetPasswordUser.email}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {resetPasswordUser.companyName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {resetPasswordResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  resetPasswordResult.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {resetPasswordResult.message}
              </div>
            )}

            {!resetPasswordResult && (
              <p className="text-sm text-muted-foreground">
                This will send an email to {resetPasswordUser?.email} with a link to reset their password.
                The link will expire in 24 hours.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              {resetPasswordResult ? 'Close' : 'Cancel'}
            </Button>
            {!resetPasswordResult && (
              <Button onClick={handleResetPassword} disabled={isResettingPassword}>
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
