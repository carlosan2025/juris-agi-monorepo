'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  MoreVertical,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  Crown,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UserX,
  UserCheck,
  Loader2,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigation } from '@/contexts/NavigationContext';
import type { CompanyUser, CompanyUserRole, PortfolioAccessLevel } from '@/types/domain';

interface PendingInvitation {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  portfolioCount: number;
}

type ConfirmActionType = 'suspend' | 'reactivate' | 'delete' | 'resend' | 'revoke' | 'delete_invite';

interface ConfirmAction {
  type: ConfirmActionType;
  targetId: string;
  targetName: string;
  targetEmail: string;
}

interface PortfolioForPermissions {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  portfolioType: string;
}

interface UserPermission {
  portfolioId: string;
  accessLevel: 'MAKER' | 'CHECKER' | 'VIEWER';
}

interface EditPermissionsTarget {
  userId: string;
  userName: string;
  userEmail: string;
}

function getRoleBadge(role: CompanyUserRole) {
  switch (role) {
    case 'owner':
      return <Badge className="bg-purple-600">Owner</Badge>;
    case 'admin':
      return <Badge className="bg-blue-600">Admin</Badge>;
    case 'member':
      return <Badge variant="secondary">Member</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function getStatusBadge(status: 'pending' | 'accepted' | 'expired') {
  switch (status) {
    case 'accepted':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs">Active</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">Pending</span>
        </div>
      );
    case 'expired':
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Expired</span>
        </div>
      );
  }
}

function getUserStatusBadge(status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') {
  switch (status) {
    case 'ACTIVE':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs">Active</span>
        </div>
      );
    case 'SUSPENDED':
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <Ban className="h-3.5 w-3.5" />
          <span className="text-xs">Suspended</span>
        </div>
      );
    case 'DELETED':
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Deleted</span>
        </div>
      );
  }
}

function getAccessLevelBadge(level: PortfolioAccessLevel) {
  return level === 'checker' ? (
    <Badge variant="outline" className="text-xs border-green-500 text-green-600">Checker</Badge>
  ) : (
    <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">Maker</Badge>
  );
}

export default function UsersPage() {
  const { isAdmin, portfolios, currentUser, company, getPortfolioLabel } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as CompanyUserRole,
    portfolioAccess: [] as { portfolioId: string; accessLevel: PortfolioAccessLevel }[],
  });
  const [isSending, setIsSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<{ url: string; emailSent: boolean } | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit permissions state
  const [showEditPermissions, setShowEditPermissions] = useState(false);
  const [editPermissionsTarget, setEditPermissionsTarget] = useState<EditPermissionsTarget | null>(null);
  const [allPortfoliosForPermissions, setAllPortfoliosForPermissions] = useState<PortfolioForPermissions[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    if (!company?.id) return;
    try {
      const response = await fetch(`/api/invitations?companyId=${company.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingInvitations(data.invitations.filter((inv: PendingInvitation) =>
            inv.status === 'PENDING' || inv.status === 'EXPIRED'
          ));
        }
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  }, [company?.id]);

  // Fetch company users
  const fetchUsers = useCallback(async () => {
    if (!company?.id) return;
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`/api/users?companyId=${company.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchInvitations();
    fetchUsers();
  }, [fetchInvitations, fetchUsers]);

  // Filter API users based on search query
  const filteredApiUsers = useMemo(() => {
    return apiUsers.filter(
      (u) =>
        (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apiUsers, searchQuery]);

  // Map API role to frontend role type
  const mapRole = (role: string): CompanyUserRole => {
    switch (role) {
      case 'OWNER':
        return 'owner';
      case 'ORG_ADMIN':
        return 'admin';
      default:
        return 'member';
    }
  };

  // Handle user actions (suspend, reactivate, delete)
  const handleUserAction = async () => {
    if (!confirmAction) return;

    setIsPerformingAction(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/users/${confirmAction.targetId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmAction.type }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error || 'Failed to perform action');
        return;
      }

      // Refresh users list
      fetchUsers();
      setConfirmAction(null);
    } catch (error) {
      setActionError('An unexpected error occurred');
    } finally {
      setIsPerformingAction(false);
    }
  };

  // Handle invitation actions (resend, revoke, delete)
  const handleInvitationAction = async () => {
    if (!confirmAction) return;

    setIsPerformingAction(true);
    setActionError(null);

    try {
      let response: Response;

      if (confirmAction.type === 'delete_invite') {
        response = await fetch(`/api/invitations/actions/${confirmAction.targetId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/invitations/actions/${confirmAction.targetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: confirmAction.type }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error || 'Failed to perform action');
        return;
      }

      // Refresh invitations list
      fetchInvitations();
      setConfirmAction(null);
    } catch (error) {
      setActionError('An unexpected error occurred');
    } finally {
      setIsPerformingAction(false);
    }
  };

  // Get confirmation dialog content based on action type
  const getConfirmationContent = () => {
    if (!confirmAction) return { title: '', description: '', buttonText: '', buttonVariant: 'default' as const };

    switch (confirmAction.type) {
      case 'suspend':
        return {
          title: 'Suspend User',
          description: `Are you sure you want to suspend ${confirmAction.targetName || confirmAction.targetEmail}? They will no longer be able to log in until reactivated.`,
          buttonText: 'Suspend User',
          buttonVariant: 'destructive' as const,
        };
      case 'reactivate':
        return {
          title: 'Reactivate User',
          description: `Are you sure you want to reactivate ${confirmAction.targetName || confirmAction.targetEmail}? They will be able to log in again.`,
          buttonText: 'Reactivate User',
          buttonVariant: 'default' as const,
        };
      case 'delete':
        return {
          title: 'Delete User',
          description: `Are you sure you want to delete ${confirmAction.targetName || confirmAction.targetEmail}? This action cannot be undone.`,
          buttonText: 'Delete User',
          buttonVariant: 'destructive' as const,
        };
      case 'resend':
        return {
          title: 'Resend Invitation',
          description: `Resend the invitation email to ${confirmAction.targetEmail}? The invitation will be extended for another 7 days.`,
          buttonText: 'Resend Invitation',
          buttonVariant: 'default' as const,
        };
      case 'revoke':
        return {
          title: 'Revoke Invitation',
          description: `Are you sure you want to revoke the invitation for ${confirmAction.targetEmail}? The invitation link will no longer work.`,
          buttonText: 'Revoke Invitation',
          buttonVariant: 'destructive' as const,
        };
      case 'delete_invite':
        return {
          title: 'Delete Invitation',
          description: `Are you sure you want to delete the invitation for ${confirmAction.targetEmail}? This action cannot be undone.`,
          buttonText: 'Delete Invitation',
          buttonVariant: 'destructive' as const,
        };
      default:
        return { title: '', description: '', buttonText: '', buttonVariant: 'default' as const };
    }
  };

  // Get industry-specific label for portfolios
  const portfolioLabelPlural = getPortfolioLabel(true);
  const portfolioLabelSingular = getPortfolioLabel(false);

  // Open edit permissions dialog
  const handleOpenEditPermissions = async (user: ApiUser) => {
    setEditPermissionsTarget({
      userId: user.id,
      userName: user.name || '',
      userEmail: user.email,
    });
    setShowEditPermissions(true);
    setIsLoadingPermissions(true);
    setPermissionsError(null);

    try {
      const response = await fetch(`/api/users/${user.id}/permissions`);
      const data = await response.json();

      if (!response.ok) {
        setPermissionsError(data.error || 'Failed to fetch permissions');
        return;
      }

      setAllPortfoliosForPermissions(data.allPortfolios || []);
      setUserPermissions(
        (data.memberships || []).map((m: { portfolioId: string; accessLevel: string }) => ({
          portfolioId: m.portfolioId,
          accessLevel: m.accessLevel as 'MAKER' | 'CHECKER' | 'VIEWER',
        }))
      );
    } catch (error) {
      setPermissionsError('Failed to load permissions');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Toggle portfolio assignment
  const togglePortfolioPermission = (portfolioId: string) => {
    setUserPermissions((prev) => {
      const existing = prev.find((p) => p.portfolioId === portfolioId);
      if (existing) {
        return prev.filter((p) => p.portfolioId !== portfolioId);
      } else {
        return [...prev, { portfolioId, accessLevel: 'MAKER' as const }];
      }
    });
  };

  // Set access level for a portfolio
  const setPermissionAccessLevel = (portfolioId: string, level: 'MAKER' | 'CHECKER' | 'VIEWER') => {
    setUserPermissions((prev) =>
      prev.map((p) => (p.portfolioId === portfolioId ? { ...p, accessLevel: level } : p))
    );
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!editPermissionsTarget) return;

    setIsSavingPermissions(true);
    setPermissionsError(null);

    try {
      const response = await fetch(`/api/users/${editPermissionsTarget.userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: userPermissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPermissionsError(data.error || 'Failed to save permissions');
        return;
      }

      // Close the dialog on success and refresh user list to update portfolio counts
      setShowEditPermissions(false);
      setEditPermissionsTarget(null);
      setUserPermissions([]);
      setAllPortfoliosForPermissions([]);
      fetchUsers(); // Refresh to update portfolio counts
    } catch (error) {
      setPermissionsError('Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Close edit permissions dialog
  const handleCloseEditPermissions = () => {
    setShowEditPermissions(false);
    setEditPermissionsTarget(null);
    setUserPermissions([]);
    setAllPortfoliosForPermissions([]);
    setPermissionsError(null);
  };

  const handleSendInvite = async () => {
    if (!company?.id) return;

    setIsSending(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          email: inviteData.email,
          role: inviteData.role,
          portfolioAccess: inviteData.portfolioAccess,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation');
        setIsSending(false);
        return;
      }

      // Show success with invite URL
      setInviteSuccess({
        url: data.invitation.inviteUrl,
        emailSent: data.emailSent,
      });

      // Refresh invitations list
      fetchInvitations();

      // Reset form but keep dialog open to show success
      setInviteData({
        email: '',
        role: 'member',
        portfolioAccess: [],
      });
    } catch (error) {
      setInviteError('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseInviteDialog = () => {
    setShowInviteDialog(false);
    setInviteError(null);
    setInviteSuccess(null);
    setInviteData({
      email: '',
      role: 'member',
      portfolioAccess: [],
    });
  };

  const copyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const togglePortfolioAccess = (portfolioId: string) => {
    setInviteData((prev) => {
      const existing = prev.portfolioAccess.find((p) => p.portfolioId === portfolioId);
      if (existing) {
        return {
          ...prev,
          portfolioAccess: prev.portfolioAccess.filter((p) => p.portfolioId !== portfolioId),
        };
      } else {
        return {
          ...prev,
          portfolioAccess: [...prev.portfolioAccess, { portfolioId, accessLevel: 'maker' }],
        };
      }
    });
  };

  const setPortfolioAccessLevel = (portfolioId: string, level: PortfolioAccessLevel) => {
    setInviteData((prev) => ({
      ...prev,
      portfolioAccess: prev.portfolioAccess.map((p) =>
        p.portfolioId === portfolioId ? { ...p, accessLevel: level } : p
      ),
    }));
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">
            You need admin privileges to manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage team members and their permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold">{apiUsers.length}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-green-600">
              {apiUsers.filter((u) => u.status === 'ACTIVE').length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-amber-600">
              {apiUsers.filter((u) => u.status === 'SUSPENDED').length}
            </div>
            <div className="text-xs text-muted-foreground">Suspended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-orange-600">
              {pendingInvitations.filter((i) => i.status === 'PENDING').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending Invites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-blue-600">
              {apiUsers.filter((u) => ['OWNER', 'ORG_ADMIN'].includes(u.role)).length}
            </div>
            <div className="text-xs text-muted-foreground">Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs w-24">Role</TableHead>
              <TableHead className="text-xs w-24">Status</TableHead>
              <TableHead className="text-xs w-28">Joined</TableHead>
              <TableHead className="text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : filteredApiUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredApiUsers.map((user) => {
                const role = mapRole(user.role);
                const isCurrentUser = user.id === currentUser?.id;
                const canManage = !isCurrentUser && role !== 'owner';

                return (
                  <TableRow key={user.id} className={user.status === 'SUSPENDED' ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {user.name || 'Unnamed User'}
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {user.portfolioCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {user.portfolioCount} {user.portfolioCount === 1 ? portfolioLabelSingular : portfolioLabelPlural}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getRoleBadge(role)}
                        {role === 'owner' && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditPermissions(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({
                                  type: 'suspend',
                                  targetId: user.id,
                                  targetName: user.name || '',
                                  targetEmail: user.email,
                                })}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {user.status === 'SUSPENDED' && (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({
                                  type: 'reactivate',
                                  targetId: user.id,
                                  targetName: user.name || '',
                                  targetEmail: user.email,
                                })}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reactivate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmAction({
                                type: 'delete',
                                targetId: user.id,
                                targetName: user.name || '',
                                targetEmail: user.email,
                              })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Invitations</h2>
          <div className="border rounded-lg bg-card divide-y">
            {pendingInvitations.map((invitation) => {
              const isExpired = invitation.status === 'EXPIRED' || new Date(invitation.expiresAt) < new Date();
              return (
                <div key={invitation.id} className={`flex items-center justify-between p-4 ${isExpired ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                      <Mail className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{invitation.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Invited as {invitation.role === 'ORG_ADMIN' ? 'Admin' : 'Member'} •
                        {isExpired ? 'Expired ' : 'Expires '}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({
                            type: 'resend',
                            targetId: invitation.id,
                            targetName: invitation.name || '',
                            targetEmail: invitation.email,
                          })}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend Invitation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!isExpired && (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({
                              type: 'revoke',
                              targetId: invitation.id,
                              targetName: invitation.name || '',
                              targetEmail: invitation.email,
                            })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Revoke Invitation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setConfirmAction({
                            type: 'delete_invite',
                            targetId: invitation.id,
                            targetName: invitation.name || '',
                            targetEmail: invitation.email,
                          })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={handleCloseInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new team member
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Invitation created successfully!
                  </p>
                  {!inviteSuccess.emailSent && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Email service is not configured. Share the link below manually.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invitation Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteSuccess.url}
                    className="text-xs font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyInviteUrl(inviteSuccess.url)}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    title="Open link"
                  >
                    <a href={inviteSuccess.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with the user to complete their registration
                </p>
              </div>

              <DialogFooter>
                <Button onClick={handleCloseInviteDialog}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {inviteError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {inviteError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="user@company.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    The user will provide their name when accepting the invitation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value: CompanyUserRole) =>
                      setInviteData({ ...inviteData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{portfolioLabelPlural} Access</Label>
                  <div className="border rounded-lg divide-y">
                    {portfolios.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No {portfolioLabelPlural.toLowerCase()} created yet
                      </div>
                    ) : portfolios.map((portfolio) => {
                      const access = inviteData.portfolioAccess.find(
                        (p) => p.portfolioId === portfolio.id
                      );
                      return (
                        <div
                          key={portfolio.id}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={!!access}
                              onCheckedChange={() => togglePortfolioAccess(portfolio.id)}
                            />
                            <span className="text-sm">{portfolio.name}</span>
                          </div>
                          {access && (
                            <Select
                              value={access.accessLevel}
                              onValueChange={(value: PortfolioAccessLevel) =>
                                setPortfolioAccessLevel(portfolio.id, value)
                              }
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maker">Maker</SelectItem>
                                <SelectItem value="checker">Checker</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Maker:</strong> Can create and edit. <strong>Checker:</strong> Can approve changes.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInviteDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteData.email || isSending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getConfirmationContent().title}</DialogTitle>
            <DialogDescription>
              {getConfirmationContent().description}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {actionError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmAction(null);
                setActionError(null);
              }}
              disabled={isPerformingAction}
            >
              Cancel
            </Button>
            <Button
              variant={getConfirmationContent().buttonVariant}
              onClick={() => {
                if (confirmAction?.type === 'resend' || confirmAction?.type === 'revoke' || confirmAction?.type === 'delete_invite') {
                  handleInvitationAction();
                } else {
                  handleUserAction();
                }
              }}
              disabled={isPerformingAction}
            >
              {isPerformingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {getConfirmationContent().buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={showEditPermissions} onOpenChange={handleCloseEditPermissions}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {portfolioLabelSingular} Permissions</DialogTitle>
            <DialogDescription>
              Assign {editPermissionsTarget?.userName || editPermissionsTarget?.userEmail} to {portfolioLabelPlural.toLowerCase()} and set their access level.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {permissionsError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {permissionsError}
              </div>
            )}

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading permissions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{portfolioLabelPlural} Access</Label>
                <div className="border rounded-lg divide-y max-h-[320px] overflow-y-auto">
                  {allPortfoliosForPermissions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No {portfolioLabelPlural.toLowerCase()} available
                    </div>
                  ) : (
                    allPortfoliosForPermissions.map((portfolio) => {
                      const permission = userPermissions.find((p) => p.portfolioId === portfolio.id);
                      const isAssigned = !!permission;

                      return (
                        <div
                          key={portfolio.id}
                          className={`flex items-center justify-between p-3 ${
                            portfolio.status !== 'ACTIVE' ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() => togglePortfolioPermission(portfolio.id)}
                            />
                            <div>
                              <span className="text-sm font-medium">{portfolio.name}</span>
                              {portfolio.status !== 'ACTIVE' && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {portfolio.status.toLowerCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isAssigned && (
                            <Select
                              value={permission.accessLevel}
                              onValueChange={(value: 'MAKER' | 'CHECKER' | 'VIEWER') =>
                                setPermissionAccessLevel(portfolio.id, value)
                              }
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MAKER">Maker</SelectItem>
                                <SelectItem value="CHECKER">Checker</SelectItem>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Maker:</strong> Can create and edit. <strong>Checker:</strong> Can approve changes. <strong>Viewer:</strong> Read-only access.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditPermissions}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isSavingPermissions || isLoadingPermissions}
            >
              {isSavingPermissions && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
