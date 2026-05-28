'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Shield,
  Users,
  GitMerge,
  Plus,
  ArrowRight,
  Settings,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import TeamMembersManager from '@/components/team-members-manager';
import api from '@/lib/axios';

interface WorkspaceRole {
  id: string;
  name: string;
  description: string | null;
  tenantId: string | null;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface TeamMember {
  id: string;
  role: string;
  reportsToId: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export default function TenantSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Custom Roles & Permissions states
  const [rolesList, setRolesList] = useState<WorkspaceRole[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Hierarchy states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchTenantData = async () => {
    try {
      const response = await api.get(`/api/tenants/${tenantId}`);
      setTenant(response.data);

      // Fetch custom roles, system permissions, and members for the hierarchy
      const [rolesRes, permsRes, membersRes] = await Promise.all([
        api.get(`/api/tenants/${tenantId}/roles`),
        api.get('/api/permissions'),
        api.get(`/api/tenants/${tenantId}/members`),
      ]);

      setRolesList(rolesRes.data);
      setPermissionsList(permsRes.data);
      setTeamMembers(membersRes.data);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, [tenantId, router]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setRolesLoading(true);
    try {
      await api.post(`/api/tenants/${tenantId}/roles`, {
        name: newRole.name,
        description: newRole.description,
        permissions: selectedPermissions,
      });

      toast.success('Workspace role created successfully');
      setNewRole({ name: '', description: '' });
      setSelectedPermissions([]);
      setShowRoleDialog(false);
      fetchTenantData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create role';
      toast.error(errorMessage);
    } finally {
      setRolesLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  // Helper function to render a node in our visual reporting chart
  const renderHierarchyNode = (userId: string, level: number) => {
    const directReports = teamMembers.filter((m) => m.reportsToId === userId);
    const member = teamMembers.find((m) => m.user.id === userId);

    if (!member) return null;

    return (
      <div key={userId} className="space-y-4 relative pl-5 border-l border-border-subtle mt-4">
        {/* Connection line helper anchor */}
        <div className="absolute top-4 left-0 w-5 h-px bg-border-subtle" />

        {/* Node card */}
        <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border-subtle hover:border-border-strong transition-colors rounded-lg shadow-md max-w-md">
          <Avatar className="h-9 w-9 border border-border-subtle">
            <AvatarImage src={member.user.avatarUrl || ''} />
            <AvatarFallback className="bg-surface-3 text-gray-200 font-bold text-[10px]">
              {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              <span className="truncate">{member.user.fullName}</span>
              <Badge className="text-[8px] px-1.5 py-0 capitalize bg-surface-3 text-gray-300 border border-gray-700 shadow-none font-bold">
                {member.role.replace(/_/g, ' ')}
              </Badge>
            </h4>
            <p className="text-[10px] text-foreground-dim font-mono truncate">
              {member.user.email}
            </p>
          </div>
        </div>

        {/* Render child nodes */}
        {directReports.length > 0 && (
          <div className="space-y-4">
            {directReports.map((report) => renderHierarchyNode(report.user.id, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Top level employees are those who don't report to anyone in the workspace
  const topLevelMembers = teamMembers.filter((m) => !m.reportsToId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
          <p className="text-[11px] text-foreground-dim">Loading workspace configurations...</p>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <Link href={`/dashboard/tenant/${tenantId}`}>
        <Button
          variant="ghost"
          className="gap-2 pl-0 hover:pl-0 text-foreground-dim hover:text-foreground-muted"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Workspace
        </Button>
      </Link>

      <div className="flex items-center justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-foreground-muted animate-spin-slow" />
            Workspace Settings
          </h1>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
              Workspace:
            </span>
            <p className="text-white bg-white/20 max-w-fit px-3 py-1 rounded-sm  font-semibold tracking-tight text-xs">
              {tenant.name}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Tabs Panel */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-surface-2 p-1 border border-border-subtle rounded-lg w-full sm:w-auto flex flex-row items-center justify-center mx-auto gap-1 mb-6">
          <TabsTrigger
            value="members"
            className="gap-2 text-xs font-semibold px-4 py-1.5 rounded-md flex items-center justify-center data-[state=active]:bg-surface-3 data-[state=active]:text-foreground text-foreground-muted transition-all"
          >
            <Users className="w-4 h-4 shrink-0" />
            Team Directory
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="gap-2 text-xs font-semibold px-4 py-1.5 rounded-md flex items-center justify-center data-[state=active]:bg-surface-3 data-[state=active]:text-foreground text-foreground-muted transition-all"
          >
            <Shield className="w-4 h-4 shrink-0" />
            Custom Roles
          </TabsTrigger>
          <TabsTrigger
            value="hierarchy"
            className="gap-2 text-xs font-semibold px-4 py-1.5 rounded-md flex items-center justify-center data-[state=active]:bg-surface-3 data-[state=active]:text-foreground text-foreground-muted transition-all"
          >
            <GitMerge className="w-4 h-4 shrink-0" />
            Reporting Hierarchy
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Team Members Directory */}
        <TabsContent value="members">
          <TeamMembersManager tenantId={tenantId} />
        </TabsContent>

        {/* Tab 2: Custom Roles Manager */}
        <TabsContent value="roles">
          <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle shadow-none">
            <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  Custom Workspace Roles
                </CardTitle>
                <CardDescription className="text-xs text-foreground-dim">
                  Define custom roles and specify granular access permissions within this workspace.
                </CardDescription>
              </div>

              {/* Create Custom Role Dialog */}
              <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-primary text-xs font-bold rounded-md">
                    <Plus className="w-4 h-4 mr-2" />
                    New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-gray-900 border border-gray-800 text-gray-100 shadow-none rounded">
                  <DialogHeader>
                    <DialogTitle className="text-gray-100 font-bold">
                      Define Custom Role
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Provide a role name, description, and assign the appropriate permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole} className="space-y-4 py-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Role Name
                      </label>
                      <Input
                        required
                        placeholder="e.g. Lead QA Engineer"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        className="bg-gray-950/80 border-gray-800 focus-visible:ring-gray-700/50 text-gray-200 h-9 text-xs rounded-sm placeholder:text-gray-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Description
                      </label>
                      <Input
                        placeholder="e.g. Can manage QA tasks and mark checklists"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                        className="bg-gray-950/80 border-gray-800 focus-visible:ring-gray-700/50 text-gray-200 h-9 text-xs rounded-sm placeholder:text-gray-600"
                      />
                    </div>

                    <div className="space-y-2 border-t border-gray-800 pt-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                        Assign Permissions
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {permissionsList.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-start gap-2 p-2 bg-gray-950/40 rounded border border-gray-800 hover:bg-gray-900/50 transition-colors"
                          >
                            <Checkbox
                              id={perm.id}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label
                                htmlFor={perm.id}
                                className="text-xs font-bold text-gray-300 cursor-pointer capitalize"
                              >
                                {perm.name.replace(/_/g, ' ')}
                              </label>
                              <span className="text-[10px] text-gray-500 leading-normal">
                                {perm.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-800 mt-4">
                      <Button
                        type="submit"
                        disabled={rolesLoading}
                        className="btn-primary text-xs h-9 font-bold rounded-md"
                      >
                        {rolesLoading ? 'Creating...' : 'Create Role'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {rolesList.map((role) => (
                  <Card
                    key={role.id}
                    className="relative overflow-hidden border border-border-subtle bg-surface-3 hover:shadow-md transition-shadow shadow-none"
                  >
                    <div
                      className={`absolute left-0 top-0 h-full w-1 ${role.tenantId ? 'bg-amber-500' : 'bg-gray-700'}`}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-extrabold capitalize text-gray-200 flex items-center gap-1.5">
                          {role.name.replace(/_/g, ' ')}
                          {role.tenantId ? (
                            <Badge className="bg-amber-950/20 text-amber-500 border border-amber-500/25 shadow-none text-[8px] py-0">
                              Custom
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-800 text-gray-300 border border-gray-700 shadow-none text-[8px] py-0">
                              System Role
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-[11px] text-foreground-dim">
                        {role.description || 'No description provided.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-foreground-muted space-y-2">
                      <div>
                        <span className="font-semibold text-gray-300 block mb-1">
                          Permissions assigned:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((p) => (
                              <Badge
                                key={p}
                                variant="secondary"
                                className="text-[9px] capitalize shadow-none bg-surface-2 border border-border-subtle text-gray-400"
                              >
                                {p.replace(/_/g, ' ')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 italic">No direct permissions.</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Visual Reporting Hierarchy Tree */}
        <TabsContent value="hierarchy">
          <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle shadow-none">
            <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
              <CardTitle className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-gray-500" />
                Team Reporting Structure
              </CardTitle>
              <CardDescription className="text-xs text-foreground-dim">
                Visual organogram demonstrating the reporting relationships and workflow chains of
                command.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {topLevelMembers.length > 0 ? (
                <div className="space-y-6">
                  {topLevelMembers.map((member) => (
                    <div key={member.user.id} className="space-y-4">
                      {/* Top-Level node starts here */}
                      <div className="flex items-center gap-3 p-3 bg-surface-3 border border-border-strong text-white rounded-lg shadow-md max-w-md">
                        <Avatar className="h-10 w-10 border border-gray-800">
                          <AvatarImage src={member.user.avatarUrl || ''} />
                          <AvatarFallback className="bg-surface-2 text-white font-bold text-xs">
                            {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                            {member.user.fullName}
                            <Badge className="text-[9px] px-1.5 py-0 capitalize bg-gray-800 text-white border border-gray-700 shadow-none font-bold">
                              {member.role.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className="text-[8px] bg-gray-850 border border-gray-700 text-gray-200 font-mono shadow-none uppercase font-bold py-0.5 px-1.5">
                              Head
                            </Badge>
                          </h4>
                          <p className="text-[11px] text-gray-400">{member.user.email}</p>
                        </div>
                      </div>

                      {/* Render direct reports recursively */}
                      <div className="space-y-4 pl-0">
                        {teamMembers
                          .filter((m) => m.reportsToId === member.user.id)
                          .map((m) => renderHierarchyNode(m.user.id, 1))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-foreground-dim text-xs font-medium">
                  No reporting relationships have been configured yet. Map managers in the Team
                  Directory.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
