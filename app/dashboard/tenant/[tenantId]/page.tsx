'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Settings,
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import CreateProjectDialog from '@/components/create-project-dialog'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

interface TenantData {
  id: string
  name: string
  description: string | null
  members: any[]
}

interface Project {
  id: string
  name: string
  description: string | null
  color: string
}

interface StatsData {
  totalProjects: number
  totalTasks: number
  tasksDueToday: number
  overdueTasks: number
  completedTasks: number
  activeMembers: number
  tasksByStatus: { status: string; count: number }[]
  tasksByPriority: { priority: string; count: number }[]
  completionTrend: { name: string; completed: number; created: number }[]
  recentActivities: any[]
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#94A3B8',        // slate
  in_progress: '#3B82F6', // blue
  in_review: '#8B5CF6',   // purple
  done: '#10B981',        // green
  blocked: '#EF4444',     // red
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#3B82F6',         // blue
  medium: '#F59E0B',      // amber
  high: '#F97316',        // orange
  urgent: '#EF4444',      // red
}

export default function TenantPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [tenantRes, projectsRes, statsRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}`),
        fetch(`/api/tenants/${tenantId}/projects`),
        fetch(`/api/tenants/${tenantId}/stats`),
      ])

      if (!tenantRes.ok || !projectsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const tenantData = await tenantRes.json()
      const projectsData = await projectsRes.json()
      const statsData = await statsRes.json()

      setTenant(tenantData)
      setProjects(projectsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching tenant data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tenantId])

  const onProjectCreated = (newProject: Project) => {
    setProjects([...projects, newProject])
    fetchData() // Refresh stats
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading workspace dashboard...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Workspace not found</h1>
      </div>
    )
  }

  // Format Status Chart Data
  const statusChartData = stats?.tasksByStatus.map(s => ({
    name: s.status.replace('_', ' ').toUpperCase(),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94A3B8'
  })) || []

  // Format Priority Chart Data
  const priorityChartData = stats?.tasksByPriority.map(p => ({
    name: p.priority.toUpperCase(),
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || '#3B82F6'
  })) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tenant.name} Workspace</h1>
          {tenant.description && (
            <p className="mt-1 text-gray-600 max-w-2xl">{tenant.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tenant/${tenantId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Workspace Settings
            </Button>
          </Link>
          <CreateProjectDialog tenantId={tenantId} onSuccess={onProjectCreated}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </CreateProjectDialog>
        </div>
      </div>

      {/* KPI Widgets Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Total Projects</CardTitle>
              <FolderKanban className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-400" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Total Tasks</CardTitle>
              <CheckSquare className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Due Today</CardTitle>
              <Clock className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.tasksDueToday}</div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-md transition-shadow relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${stats.overdueTasks > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Overdue Tasks</CardTitle>
              <AlertTriangle className={`w-4 h-4 ${stats.overdueTasks > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdueTasks}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Completed Tasks</CardTitle>
              <CheckSquare className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Active Team</CardTitle>
              <UserCheck className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activeMembers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Analytics Charts */}
      {stats && stats.totalTasks > 0 && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Chart 1: Task Completion Trend */}
          <Card className="md:col-span-7">
            <CardHeader className="pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Task Productivity Trend
              </CardTitle>
              <CardDescription>Daily comparison of tasks created vs. successfully marked Done</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="created" name="New Tasks" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="completed" name="Tasks Completed" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Tasks by Status */}
          <Card className="md:col-span-5">
            <CardHeader className="pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Task Distribution
              </CardTitle>
              <CardDescription>Visual breakdown by status and system priority</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Pie Chart */}
              {statusChartData.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider text-center">Tasks by Status</div>
                  <div className="h-44 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-gray-900">{stats.totalTasks}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Total</span>
                    </div>
                  </div>
                  {/* Custom Legend */}
                  <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                    {statusChartData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600 capitalize font-medium">{item.name.toLowerCase()} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Directory & Activity Timeline Split */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Projects */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-gray-600" />
              Workspace Projects
            </h2>
            <CreateProjectDialog tenantId={tenantId} onSuccess={onProjectCreated}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </CreateProjectDialog>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/project/${project.id}`}
                  className="group"
                >
                  <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full relative overflow-hidden bg-white">
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {project.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50/50 border-dashed py-12">
              <CardContent className="text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No active projects</h3>
                <p className="text-gray-500 mb-4 text-sm">Create a new project workspace to begin managing tasks.</p>
                <CreateProjectDialog tenantId={tenantId} onSuccess={onProjectCreated}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                </CreateProjectDialog>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="md:col-span-4 space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              Workspace Activity
            </h2>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Audit Stream</CardTitle>
              <CardDescription>Live events recorded within the workspace team</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((act) => (
                    <div key={act.id} className="text-xs flex gap-3 items-start">
                      <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                      <div className="space-y-1">
                        <p className="font-medium text-gray-800">
                          <span className="font-semibold text-gray-900">{act.userFullName || 'System'}</span>{' '}
                          <span className="text-blue-600 font-mono text-[10px] uppercase font-bold">
                            {act.action.replace(/_/g, ' ')}
                          </span>
                        </p>
                        {act.metadata && (
                          <p className="text-[10px] text-gray-500 font-mono bg-gray-50 p-1.5 rounded truncate max-w-[250px]">
                            {JSON.stringify(act.metadata)}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">{new Date(act.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">No recent activities recorded in this workspace.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
