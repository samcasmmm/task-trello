'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Shield, Users, GitMerge, Plus, ArrowRight, Settings, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import TeamMembersManager from '@/components/team-members-manager'
import api from '@/lib/axios'

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
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Custom Roles & Permissions states
  const [rolesList, setRolesList] = useState<WorkspaceRole[]>([])
  const [permissionsList, setPermissionsList] = useState<Permission[]>([])
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)

  // Hierarchy states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const fetchTenantData = async () => {
    try {
      const response = await api.get(`/api/tenants/${tenantId}`)
      setTenant(response.data)

      // Fetch custom roles, system permissions, and members for the hierarchy
      const [rolesRes, permsRes, membersRes] = await Promise.all([
        api.get(`/api/tenants/${tenantId}/roles`),
        api.get('/api/permissions'),
        api.get(`/api/tenants/${tenantId}/members`),
      ])

      setRolesList(rolesRes.data)
      setPermissionsList(permsRes.data)
      setTeamMembers(membersRes.data)
    } catch (error) {
      console.error('Error fetching tenant details:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchTenantData()
  }, [tenantId])

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRole.name.trim()) {
      toast.error('Role name is required.')
      return
    }

    setRolesLoading(true)
    try {
      await api.post(`/api/tenants/${tenantId}/roles`, {
        name: newRole.name.trim().toLowerCase().replace(/\s+/g, '_'),
        description: newRole.description,
        permissionIds: selectedPermissions,
      })

      toast.success(`Custom role "${newRole.name}" created successfully!`)
      setNewRole({ name: '', description: '' })
      setSelectedPermissions([])
      setShowRoleDialog(false)
      fetchTenantData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create role.'
      toast.error(errorMessage)
    } finally {
      setRolesLoading(false)
    }
  }

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permId))
    } else {
      setSelectedPermissions([...selectedPermissions, permId])
    }
  }

  // Recursive renderer for the reporting hierarchy organogram tree
  const renderHierarchyNode = (userId: string, depth = 0) => {
    const member = teamMembers.find((m) => m.user.id === userId)
    if (!member) return null

    const reports = teamMembers.filter((m) => m.reportsToId === userId)

    return (
      <div key={userId} className="space-y-4 relative pl-6 md:pl-10">
        {/* Visual node line guideline */}
        {depth > 0 && (
          <div className="absolute left-0 top-6 w-6 md:w-10 h-[1.5px] bg-slate-300" />
        )}
        <div className="absolute left-0 top-0 w-[1.5px] h-full bg-slate-200" />

        {/* Member visualization card */}
        <div className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm max-w-md transition-all">
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarImage src={member.user.avatarUrl || ''} />
            <AvatarFallback className="bg-slate-100 text-slate-800 font-bold text-xs">
              {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              {member.user.fullName}
              <Badge className="text-[9px] px-1 py-0 capitalize bg-slate-100 text-slate-700 font-bold shadow-none">
                {member.role.replace(/_/g, ' ')}
              </Badge>
            </h4>
            <p className="text-[11px] text-slate-500">{member.user.email}</p>
          </div>
          {reports.length > 0 && (
            <Badge variant="secondary" className="text-[9px] font-bold">
              Leads {reports.length}
            </Badge>
          )}
        </div>

        {/* Render child reports recursively */}
        {reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((r) => renderHierarchyNode(r.user.id, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Top level employees are those who don't report to anyone in the workspace
  const topLevelMembers = teamMembers.filter((m) => !m.reportsToId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          </div>
          <p className="text-sm text-slate-500">Loading workspace configurations...</p>
        </div>
      </div>
    )
  }

  if (!tenant) return null

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <Link href={`/dashboard/tenant/${tenantId}`}>
        <Button variant="ghost" className="gap-2 pl-0 hover:pl-0 text-slate-600 hover:text-slate-900">
          <ChevronLeft className="w-4 h-4" />
          Back to Workspace
        </Button>
      </Link>

      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-slate-700 animate-spin-slow" />
            Workspace Settings
          </h1>
          <p className="mt-1 text-slate-600 font-medium">{tenant.name}</p>
        </div>
      </div>

      {/* Settings Tabs Panel */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-slate-100 p-1 w-full sm:w-auto grid grid-cols-3 gap-1 mb-6">
          <TabsTrigger value="members" className="gap-2 text-xs font-semibold">
            <Users className="w-4 h-4" />
            Team Directory
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            Custom Roles
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2 text-xs font-semibold">
            <GitMerge className="w-4 h-4" />
            Reporting Hierarchy
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Team Members Directory */}
        <TabsContent value="members">
          <TeamMembersManager tenantId={tenantId} />
        </TabsContent>

        {/* Tab 2: Custom Roles Manager */}
        <TabsContent value="roles">
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" />
                  Custom Workspace Roles
                </CardTitle>
                <CardDescription>
                  Define custom roles and specify granular access permissions within this workspace.
                </CardDescription>
              </div>

              {/* Create Custom Role Dialog */}
              <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-2" />
                    New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Define Custom Role</DialogTitle>
                    <DialogDescription>
                      Provide a role name, description, and assign the appropriate permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole} className="space-y-4 py-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Role Name</label>
                      <Input
                        required
                        placeholder="e.g. Lead QA Engineer"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        className="focus-visible:ring-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <Input
                        placeholder="e.g. Can manage QA tasks and mark checklists"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                        className="focus-visible:ring-slate-800"
                      />
                    </div>

                    <div className="space-y-2 border-t pt-3">
                      <label className="text-sm font-bold text-slate-800 block mb-2">Assign Permissions</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {permissionsList.map((perm) => (
                          <div key={perm.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <Checkbox
                              id={perm.id}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label htmlFor={perm.id} className="text-xs font-bold text-slate-800 cursor-pointer capitalize">
                                {perm.name.replace(/_/g, ' ')}
                              </label>
                              <span className="text-[10px] text-slate-500 leading-normal">{perm.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter className="pt-4 border-t mt-4">
                      <Button type="submit" disabled={rolesLoading}>
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
                  <Card key={role.id} className="relative overflow-hidden border border-slate-100 hover:shadow-md transition-shadow">
                    <div className={`absolute left-0 top-0 h-full w-1 ${role.tenantId ? 'bg-amber-500' : 'bg-slate-800'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-extrabold capitalize text-slate-900 flex items-center gap-1.5">
                          {role.name.replace(/_/g, ' ')}
                          {role.tenantId ? (
                            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 shadow-none text-[9px] py-0">Custom</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-800 border border-slate-200 shadow-none text-[9px] py-0">System Role</Badge>
                          )}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs">{role.description || 'No description provided.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2">
                      <div>
                        <span className="font-semibold text-slate-800 block mb-1">Permissions assigned:</span>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((p) => (
                              <Badge key={p} variant="secondary" className="text-[9px] capitalize shadow-none">
                                {p.replace(/_/g, ' ')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No direct permissions.</span>
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
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-slate-500" />
                Team Reporting Structure
              </CardTitle>
              <CardDescription>
                Visual organogram demonstrating the reporting relationships and workflow chains of command.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {topLevelMembers.length > 0 ? (
                <div className="space-y-6">
                  {topLevelMembers.map((member) => (
                    <div key={member.user.id} className="space-y-4">
                      {/* Top-Level node starts here */}
                      <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-md max-w-md">
                        <Avatar className="h-10 w-10 border border-slate-800">
                          <AvatarImage src={member.user.avatarUrl || ''} />
                          <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">
                            {member.user.fullName?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                            {member.user.fullName}
                            <Badge className="text-[9px] px-1.5 py-0 capitalize bg-slate-800 text-white border border-slate-700 shadow-none font-bold">
                              {member.role.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className="text-[8px] bg-blue-600 text-white font-mono shadow-none uppercase font-bold py-0.5 px-1.5">Head</Badge>
                          </h4>
                          <p className="text-[11px] text-slate-400">{member.user.email}</p>
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
                <div className="p-8 text-center text-slate-500">
                  No reporting relationships have been configured yet. Map managers in the Team Directory.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
