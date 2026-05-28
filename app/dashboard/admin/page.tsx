'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trash2,
  UserPlus,
  ShieldAlert,
  FolderKanban,
  History,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for creating a new user
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: 'r-member',
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Roles lookup
  const systemRoles = [
    { id: 'r-super-admin', name: 'Super Admin' },
    { id: 'r-tenant-manager', name: 'Tenant Manager' },
    { id: 'r-member', name: 'Member' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, tenantsRes, logsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/tenants'),
        api.get('/api/admin/logs'),
      ]);

      setUsers(usersRes.data);
      setTenants(tenantsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Connection error while fetching admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast.error('All fields are required');
      return;
    }

    try {
      await api.post('/api/admin/users', newUser);

      toast.success('User created successfully');
      setIsCreateOpen(false);
      setNewUser({ fullName: '', email: '', password: '', roleId: 'r-member' });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { roleId: newRoleId });

      toast.success('User role updated successfully');
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to update user role';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'Are you absolutely sure you want to delete this user? This will erase their login and roles.',
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);

      toast.success('User deleted successfully');
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  // Filter handlers
  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredLogs = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(l.metadata || {})
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Platform Admin Console
          </h1>
          <p className="text-sm mt-1 text-foreground-muted">
            Global controls for multi-tenant accounts, RBAC memberships, and real-time operations
            audit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="btn-ghost"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-primary text-xs font-bold rounded-md">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Platform User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-gray-100 shadow-none rounded">
              <DialogHeader>
                <DialogTitle className="text-gray-100 font-bold">
                  Register Platform User
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Register a new platform-wide user and configure their initial access role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Full Name
                  </label>
                  <Input
                    required
                    placeholder="Jane Doe"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="bg-gray-950/80 border-gray-800 focus-visible:ring-gray-700/50 text-gray-200 h-9 text-xs rounded-sm placeholder:text-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Email Address
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="jane@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="bg-gray-950/80 border-gray-800 focus-visible:ring-gray-700/50 text-gray-200 h-9 text-xs rounded-sm placeholder:text-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Password
                  </label>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="bg-gray-950/80 border-gray-800 focus-visible:ring-gray-700/50 text-gray-200 h-9 text-xs rounded-sm placeholder:text-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    System Role
                  </label>
                  <Select
                    value={newUser.roleId}
                    onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}
                  >
                    <SelectTrigger className="bg-gray-950/80 border-gray-800 focus:ring-gray-700 text-xs h-9 text-gray-200 rounded-sm">
                      <SelectValue placeholder="Select system role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-gray-100 rounded-sm shadow-none">
                      {systemRoles.map((r) => (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                          className="text-xs capitalize hover:bg-gray-800"
                        >
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="btn-primary text-xs h-9 font-bold rounded-md">
                    Register User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          setSearchQuery('');
        }}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-surface-2 p-1 border border-border-subtle rounded-lg">
            <TabsTrigger
              value="users"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-md data-[state=active]:bg-surface-3"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="tenants"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-md data-[state=active]:bg-surface-3"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Workspaces ({tenants.length})
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="gap-2 text-xs font-bold px-3 py-1.5 rounded-md data-[state=active]:bg-surface-3"
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs ({logs.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg outline-none bg-surface-2 border border-border-default text-foreground focus:border-border-strong"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tab 1: Users */}
        <TabsContent value="users">
          <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle shadow-none">
            <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
              <CardTitle className="text-sm font-bold text-gray-300">User Directory</CardTitle>
              <CardDescription className="text-xs text-foreground-dim">
                Assign system-level permissions and roles. Demoting, upgrading, and deleting user
                accounts takes effect instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  Loading directory data...
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-foreground-dim font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-4">User Profile</th>
                        <th className="pb-3 px-4">Email Address</th>
                        <th className="pb-3 px-4">System Role Assignment</th>
                        <th className="pb-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredUsers.map((u) => {
                        const userRole = u.roles[0]?.id || 'r-member';
                        return (
                          <tr key={u.id} className="hover:bg-surface-3/50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={u.avatarUrl || ''} />
                                  <AvatarFallback className="bg-surface-3 text-gray-200 font-bold text-xs">
                                    {u.fullName?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-foreground">{u.fullName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-foreground-muted font-medium">
                              {u.email}
                            </td>
                            <td className="py-4 px-4">
                              <Select
                                value={userRole}
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                              >
                                <SelectTrigger className="w-44 bg-surface-3 border-border-default text-xs h-8 text-foreground-muted rounded-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800 text-gray-100 rounded-sm shadow-none">
                                  {systemRoles.map((role) => (
                                    <SelectItem
                                      key={role.id}
                                      value={role.id}
                                      className="text-xs capitalize hover:bg-gray-800"
                                    >
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-400 hover:text-rose-500 hover:bg-rose-950/20"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  No platform users found matching your search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Workspaces */}
        <TabsContent value="tenants">
          <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle shadow-none">
            <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
              <CardTitle className="text-sm font-bold text-gray-300">Platform Workspaces</CardTitle>
              <CardDescription className="text-xs text-foreground-dim">
                Overview of tenant organizations hosted on this engine, including member counts and
                project pipelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  Loading workspaces...
                </div>
              ) : filteredTenants.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTenants.map((t) => (
                    <Card
                      key={t.id}
                      className="hover:shadow-md transition-shadow relative overflow-hidden bg-surface-3 border border-border-subtle shadow-none"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-rose-500 to-amber-500" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center justify-between text-gray-200">
                          {t.name}
                          <Badge className="text-[9px] bg-gray-800 border border-gray-700 text-gray-300 font-mono shadow-none uppercase font-bold py-0.5 px-1.5">
                            {t.slug}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1 text-xs text-foreground-dim">
                          {t.description || 'No workspace description.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 text-xs text-foreground-muted space-y-2">
                        <div className="flex justify-between border-b border-border-subtle pb-1">
                          <span>Team size</span>
                          <span className="font-semibold text-gray-200">
                            {t.memberCount} members
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border-subtle pb-1">
                          <span>Active Projects</span>
                          <span className="font-semibold text-gray-200">
                            {t.projectCount} projects
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>Tenant ID</span>
                          <span className="font-mono text-[10px] text-gray-500">{t.id}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  No workspaces found matching search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Audit Logs */}
        <TabsContent value="logs">
          <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle shadow-none">
            <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
              <CardTitle className="text-sm font-bold text-gray-300">
                System Operations Audit History
              </CardTitle>
              <CardDescription className="text-xs text-foreground-dim">
                Full security and action trail of project updates, task states, RBAC role updates,
                and platform creation logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  Loading audit trail...
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-foreground-dim font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-4">Action Event</th>
                        <th className="pb-3 px-4">Performed By</th>
                        <th className="pb-3 px-4">Metadata Info</th>
                        <th className="pb-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-surface-3/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-bold">
                            <Badge className="bg-surface-3 border border-border-subtle text-foreground-muted hover:bg-surface-3 capitalize shadow-none">
                              {l.action.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-foreground-muted font-medium">
                            <div>
                              <div className="font-semibold text-gray-200">
                                {l.userFullName || 'System'}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                {l.userEmail}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <pre className="text-[10px] text-gray-400 font-mono bg-gray-950/40 border border-border-subtle p-2 rounded max-w-sm truncate overflow-x-auto">
                              {JSON.stringify(l.metadata || {}, null, 2)}
                            </pre>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500 font-mono text-[10px]">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-foreground-dim text-xs font-medium">
                  No system audit logs found matching search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
