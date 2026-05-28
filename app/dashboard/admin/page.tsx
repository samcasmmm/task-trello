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
  Key,
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
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            Platform Admin Console
          </h1>
          <p className="text-gray-600 mt-1">
            Global controls for multi-tenant accounts, RBAC memberships, and real-time operations
            audit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Platform User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register Platform User</DialogTitle>
                <DialogDescription>
                  Register a new platform-wide user and configure their initial access role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    required
                    placeholder="Jane Doe"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="jane@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">System Role</label>
                  <Select
                    value={newUser.roleId}
                    onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select system role" />
                    </SelectTrigger>
                    <SelectContent>
                      {systemRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit">Register User</Button>
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
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="users" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="tenants" className="gap-2">
              <FolderKanban className="w-4 h-4" />
              Workspaces ({tenants.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="w-4 h-4" />
              Audit Logs ({logs.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tab 1: Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Assign system-level permissions and roles. Demoting, upgrading, and deleting user
                accounts takes effect instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading directory data...</div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-gray-600 font-medium">
                        <th className="pb-3">User Profile</th>
                        <th className="pb-3">Email Address</th>
                        <th className="pb-3">System Role Assignment</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((u) => {
                        const userRole = u.roles[0]?.id || 'r-member';
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={u.avatarUrl || ''} />
                                  <AvatarFallback>
                                    {u.fullName?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-gray-900">{u.fullName}</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{u.email}</td>
                            <td className="py-4">
                              <Select
                                value={userRole}
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                              >
                                <SelectTrigger className="w-44">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {systemRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <div className="text-center py-12 text-gray-500">
                  No platform users found matching your search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Workspaces */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Platform Workspaces</CardTitle>
              <CardDescription>
                Overview of tenant organizations hosted on this engine, including member counts and
                project pipelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading workspaces...</div>
              ) : filteredTenants.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTenants.map((t) => (
                    <Card
                      key={t.id}
                      className="hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 to-amber-500" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                          {t.name}
                          <Badge variant="outline">{t.slug}</Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {t.description || 'No workspace description.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between border-b pb-1">
                          <span>Team size</span>
                          <span className="font-semibold text-gray-900">
                            {t.memberCount} members
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span>Active Projects</span>
                          <span className="font-semibold text-gray-900">
                            {t.projectCount} projects
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>Tenant ID</span>
                          <span className="font-mono text-xs text-gray-400">{t.id}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No workspaces found matching search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Audit Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>System Operations Audit History</CardTitle>
              <CardDescription>
                Full security and action trail of project updates, task states, RBAC role updates,
                and platform creation logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading audit trail...</div>
              ) : filteredLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-gray-600 font-medium">
                        <th className="pb-3">Action Event</th>
                        <th className="pb-3">Performed By</th>
                        <th className="pb-3">Metadata Info</th>
                        <th className="pb-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-mono text-xs font-bold text-gray-900">
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-none capitalize shadow-none">
                              {l.action.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 text-gray-700">
                            <div>
                              <div className="font-medium text-gray-900">
                                {l.userFullName || 'System'}
                              </div>
                              <div className="text-xs text-gray-500">{l.userEmail}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <pre className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded max-w-sm truncate overflow-x-auto">
                              {JSON.stringify(l.metadata || {}, null, 2)}
                            </pre>
                          </td>
                          <td className="py-3 text-right text-gray-500 text-xs font-mono">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
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
