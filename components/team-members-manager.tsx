'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Mail,
  UserPlus,
  Trash2,
  ArrowRightLeft,
  Shield,
  Users,
  GitMerge,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

interface TeamMember {
  id: string;
  role: string;
  reportsToId: string | null;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface WorkspaceRole {
  id: string;
  name: string;
  description: string;
  tenantId: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 border border-purple-200 shadow-sm',
  admin: 'bg-gray-800 text-gray-200 border border-gray-700 shadow-sm',
  member: 'bg-green-100 text-green-800 border border-green-200 shadow-sm',
  viewer: 'bg-gray-100 text-gray-800 border border-gray-200 shadow-sm',
};

export default function TeamMembersManager({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();

  // Queries
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['tenant-members', tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/tenants/${tenantId}/members`);
      return res.data as TeamMember[];
    },
  });

  const { data: availableRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['tenant-roles', tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/tenants/${tenantId}/roles`);
      return res.data as WorkspaceRole[];
    },
  });

  const loading = membersLoading || rolesLoading;

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteReportsTo, setInviteReportsTo] = useState('__none__');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Direct creation states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'member',
    reportsToId: '__none__',
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/api/tenants/${tenantId}/members`, data);
      return res.data;
    },
    onSuccess: (result, variables) => {
      if (result.isAutoCreated) {
        toast.success(
          `Account created and invited: ${variables.email}. Temporary password: Welcome123!`,
          { duration: 8000 },
        );
      } else {
        toast.success(`Successfully added ${variables.email} to workspace.`);
      }
      setInviteEmail('');
      setInviteRole('member');
      setInviteReportsTo('__none__');
      setShowInviteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['tenant-members', tenantId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to invite user.';
      toast.error(errorMessage);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(`/api/tenants/${tenantId}/members`, data);
    },
    onSuccess: (_, variables) => {
      toast.success(`Registered and added ${variables.fullName} to team!`);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'member',
        reportsToId: '__none__',
      });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['tenant-members', tenantId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create user.';
      toast.error(errorMessage);
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      await api.patch(`/api/tenants/${tenantId}/members/${memberId}`, { role });
    },
    onSuccess: () => {
      toast.success('Member role updated.');
      queryClient.invalidateQueries({ queryKey: ['tenant-members', tenantId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Role change failed.';
      toast.error(errorMessage);
    },
  });

  const managerChangeMutation = useMutation({
    mutationFn: async ({
      memberId,
      reportsToId,
    }: {
      memberId: string;
      reportsToId: string | null;
    }) => {
      await api.patch(`/api/tenants/${tenantId}/members/${memberId}`, { reportsToId });
    },
    onSuccess: () => {
      toast.success('Reporting line updated.');
      queryClient.invalidateQueries({ queryKey: ['tenant-members', tenantId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Manager change failed.';
      toast.error(errorMessage);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/api/tenants/${tenantId}/members/${memberId}`);
    },
    onSuccess: (_, memberId, context: any) => {
      toast.success(`${context?.name || 'Member'} removed successfully.`);
      queryClient.invalidateQueries({ queryKey: ['tenant-members', tenantId] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to remove member.';
      toast.error(errorMessage);
    },
  });

  // Handlers
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required.');
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail.trim(),
      role: inviteRole,
      reportsToId: inviteReportsTo === '__none__' ? null : inviteReportsTo,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      toast.error('Name, email and password are required.');
      return;
    }
    createUserMutation.mutate({
      email: createForm.email,
      fullName: createForm.fullName,
      password: createForm.password,
      role: createForm.role,
      reportsToId: createForm.reportsToId === '__none__' ? null : createForm.reportsToId,
    });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    roleChangeMutation.mutate({ memberId, role: newRole });
  };

  const handleManagerChange = (memberId: string, newManagerUserId: string) => {
    managerChangeMutation.mutate({
      memberId,
      reportsToId: newManagerUserId === '__none__' ? null : newManagerUserId,
    });
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      return;
    }
    removeMemberMutation.mutate(memberId, { context: { name } });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent mx-auto mb-3" />
        <p className="text-sm">Loading team directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-100" />
            Workspace Directory
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            Manage workspace memberships, custom roles, and visual reporting structures
          </p>
        </div>

        <div className="flex gap-2">
          {/* Invite User Dialog */}
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-800 text-white hover:bg-blue-700 cursor-pointer">
                <Mail className="w-4 h-4 mr-2" />
                Invite Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Workspace Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the team member. If they are not yet registered, an
                  account will be created automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 py-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            <span className="capitalize">{role.name.replace(/_/g, ' ')}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Reports To</label>
                    <Select value={inviteReportsTo} onValueChange={setInviteReportsTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="No Manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Manager (Direct)</SelectItem>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.user.id} value={m.user.id}>
                            {m.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create User Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="cursor-pointer">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register & Add New User</DialogTitle>
                <DialogDescription>
                  Directly create a new user profile on the platform and add them to this workspace
                  immediately.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    required
                    placeholder="Jane Smith"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="jane.smith@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <Select
                      value={createForm.role}
                      onValueChange={(val) => setCreateForm({ ...createForm, role: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            <span className="capitalize">{role.name.replace(/_/g, ' ')}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Reports To</label>
                    <Select
                      value={createForm.reportsToId}
                      onValueChange={(val) => setCreateForm({ ...createForm, reportsToId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No Manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Manager (Direct)</SelectItem>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.user.id} value={m.user.id}>
                            {m.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Creating...' : 'Register User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Directory List */}
      <Card className="border border-border-default shadow-sm overflow-hidden p-0 bg-surface-1 gap-0">
        <CardHeader className="border-b bg-surface-2 flex flex-col items-start justify-center gap-1.5 py-5 px-6">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-foreground-dim" />
            Active Team Members ({teamMembers.length})
          </CardTitle>

          <CardDescription className="text-xs text-foreground-muted max-w-md">
            Assign system/custom roles, map reporting managers, and manage memberships.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-card">
          {teamMembers.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {teamMembers.map((member) => {
                const manager = teamMembers.find((m) => m.user.id === member.reportsToId);
                return (
                  <div
                    key={member.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-surface-1/40 transition-colors"
                  >
                    {/* User profile details */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                      <Avatar className="h-10 w-10 border border-border-subtle rounded-full">
                        <AvatarImage src={member.user.avatarUrl || ''} />
                        <AvatarFallback className="bg-surface-3 text-foreground font-bold">
                          {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {member.user.fullName}
                          <Badge
                            className={`capitalize shadow-none text-[10px] py-0 px-1.5 rounded-sm border-none ${
                              ROLE_COLORS[member.role] || 'bg-surface-3 text-foreground-muted'
                            }`}
                          >
                            {member.role.replace(/_/g, ' ')}
                          </Badge>
                        </h4>
                        <p className="text-xs text-foreground-dim">{member.user.email}</p>
                      </div>
                    </div>

                    {/* Reporting structure details */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <GitMerge className="w-4 h-4 text-foreground-dim" />
                      <div className="text-xs">
                        <span className="text-foreground-dim block">Reports to:</span>
                        {member.reportsToId && manager ? (
                          <span className="font-semibold text-foreground-muted">
                            {manager.user.fullName}
                          </span>
                        ) : (
                          <span className="text-foreground-dim/50 font-medium">
                            Direct Report (None)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Management actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Role selection dropdown */}
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-foreground-dim" />
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                          disabled={
                            roleChangeMutation.isPending &&
                            roleChangeMutation.variables?.memberId === member.id
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs bg-surface-3 border-border-default text-foreground focus:ring-border-strong rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-2 border border-border-default text-foreground rounded-md shadow-none">
                            {availableRoles.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.name}
                                className="text-xs focus:bg-surface-3 focus:text-foreground"
                              >
                                <span className="capitalize text-xs">
                                  {role.name.replace(/_/g, ' ')}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reports To dropdown */}
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-foreground-dim" />
                        <Select
                          value={member.reportsToId || '__none__'}
                          onValueChange={(val) => handleManagerChange(member.id, val)}
                          disabled={
                            managerChangeMutation.isPending &&
                            managerChangeMutation.variables?.memberId === member.id
                          }
                        >
                          <SelectTrigger className="h-8 w-40 text-xs bg-surface-3 border-border-default text-foreground focus:ring-border-strong rounded-md">
                            <SelectValue placeholder="Assign Lead..." />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-2 border border-border-default text-foreground rounded-md shadow-none">
                            <SelectItem
                              value="__none__"
                              className="text-xs focus:bg-surface-3 focus:text-foreground"
                            >
                              No Lead (Direct)
                            </SelectItem>
                            {teamMembers
                              .filter((m) => m.user.id !== member.user.id)
                              .map((m) => (
                                <SelectItem
                                  key={m.user.id}
                                  value={m.user.id}
                                  className="text-xs focus:bg-surface-3 focus:text-foreground"
                                >
                                  {m.user.fullName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0 rounded-md transition-colors"
                        onClick={() => handleRemoveMember(member.id, member.user.fullName)}
                        disabled={
                          removeMemberMutation.isPending &&
                          removeMemberMutation.variables === member.id
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs italic text-foreground-dim/60">
              No members found in this workspace.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
