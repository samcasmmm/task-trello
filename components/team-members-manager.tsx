'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Mail, UserPlus, Trash2, ArrowRightLeft, Shield, Users, GitMerge } from 'lucide-react';
import { toast } from 'sonner';

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
  admin: 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm',
  member: 'bg-green-100 text-green-800 border border-green-200 shadow-sm',
  viewer: 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm',
};

export default function TeamMembersManager({ tenantId }: { tenantId: string }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<WorkspaceRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const fetchMembersAndRoles = async () => {
    try {
      const [membersRes, rolesRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/members`),
        fetch(`/api/tenants/${tenantId}/roles`),
      ]);

      if (membersRes.ok && rolesRes.ok) {
        const membersData = await membersRes.json();
        const rolesData = await rolesRes.json();
        setTeamMembers(membersData);
        setAvailableRoles(rolesData);
      } else {
        toast.error('Failed to load team data.');
      }
    } catch (error) {
      console.error('Error loading team manager:', error);
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndRoles();
  }, [tenantId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required.');
      return;
    }

    setActionLoading('invite');
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          reportsToId: inviteReportsTo === '__none__' ? null : inviteReportsTo,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Invitation failed');
      }

      const result = await response.json();
      
      if (result.isAutoCreated) {
        toast.success(`Account created and invited: ${inviteEmail}. Temporary password: Welcome123!`, {
          duration: 8000,
        });
      } else {
        toast.success(`Successfully added ${inviteEmail} to workspace.`);
      }

      setInviteEmail('');
      setInviteRole('member');
      setInviteReportsTo('__none__');
      setShowInviteDialog(false);
      fetchMembersAndRoles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      toast.error('Name, email and password are required.');
      return;
    }

    setActionLoading('create');
    try {
      const memberRes = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createForm.email,
          fullName: createForm.fullName,
          password: createForm.password,
          role: createForm.role,
          reportsToId: createForm.reportsToId === '__none__' ? null : createForm.reportsToId,
        }),
      });

      if (!memberRes.ok) {
        const errData = await memberRes.json();
        throw new Error(errData.error || 'Failed to create user and add to workspace.');
      }

      toast.success(`Registered and added ${createForm.fullName} to team!`);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'member',
        reportsToId: '__none__',
      });
      setShowCreateDialog(false);
      fetchMembersAndRoles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role.');
      toast.success('Member role updated.');
      fetchMembersAndRoles();
    } catch (error: any) {
      toast.error(error.message || 'Role change failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManagerChange = async (memberId: string, newManagerUserId: string) => {
    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportsToId: newManagerUserId === '__none__' ? null : newManagerUserId }),
      });

      if (!response.ok) throw new Error('Failed to update reporting manager.');
      toast.success('Reporting line updated.');
      fetchMembersAndRoles();
    } catch (error: any) {
      toast.error(error.message || 'Manager change failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      return;
    }

    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to remove member.');
      }

      toast.success(`${name} removed successfully.`);
      fetchMembersAndRoles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mx-auto mb-3" />
        <p className="text-sm">Loading team directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-600" />
            Workspace Directory
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage workspace memberships, custom roles, and visual reporting structures
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Invite User Dialog */}
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                <Mail className="w-4 h-4 mr-2" />
                Invite Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Workspace Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the team member. If they are not yet registered, an account will be created automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 py-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
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
                    <label className="text-sm font-medium text-slate-700">Role</label>
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
                    <label className="text-sm font-medium text-slate-700">Reports To</label>
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
                  <Button type="submit" disabled={actionLoading === 'invite'}>
                    {actionLoading === 'invite' ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create User Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register & Add New User</DialogTitle>
                <DialogDescription>
                  Directly create a new user profile on the platform and add them to this workspace immediately.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input
                    required
                    placeholder="Jane Smith"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="jane.smith@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Password</label>
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
                    <label className="text-sm font-medium text-slate-700">Role</label>
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
                    <label className="text-sm font-medium text-slate-700">Reports To</label>
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
                  <Button type="submit" disabled={actionLoading === 'create'}>
                    {actionLoading === 'create' ? 'Creating...' : 'Register User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Directory List */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 pb-3 border-b">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            Active Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Assign system/custom roles, map reporting managers, and manage memberships.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {teamMembers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {teamMembers.map((member) => {
                const manager = teamMembers.find((m) => m.user.id === member.reportsToId);
                return (
                  <div
                    key={member.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-slate-50/40 transition-colors"
                  >
                    {/* User profile details */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={member.user.avatarUrl || ''} />
                        <AvatarFallback className="bg-slate-100 text-slate-800 font-bold">
                          {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {member.user.fullName}
                          <Badge className={`capitalize shadow-none text-[10px] py-0 px-1.5 ${ROLE_COLORS[member.role] || 'bg-slate-100 text-slate-700'}`}>
                            {member.role.replace(/_/g, ' ')}
                          </Badge>
                        </h4>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>

                    {/* Reporting structure details */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <GitMerge className="w-4 h-4 text-slate-400" />
                      <div className="text-xs">
                        <span className="text-slate-500 block">Reports to:</span>
                        {member.reportsToId && manager ? (
                          <span className="font-semibold text-slate-700">{manager.user.fullName}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Direct Report (None)</span>
                        )}
                      </div>
                    </div>

                    {/* Management actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Role selection dropdown */}
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                          disabled={actionLoading !== null}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                <span className="capitalize text-xs">{role.name.replace(/_/g, ' ')}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reports To dropdown */}
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        <Select
                          value={member.reportsToId || '__none__'}
                          onValueChange={(val) => handleManagerChange(member.id, val)}
                          disabled={actionLoading !== null}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="Assign Lead..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No Lead (Direct)</SelectItem>
                            {teamMembers
                              .filter((m) => m.user.id !== member.user.id) // cannot report to self
                              .map((m) => (
                                <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => handleRemoveMember(member.id, member.user.fullName)}
                        disabled={actionLoading !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No members found in this workspace.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
