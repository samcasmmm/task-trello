'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import CreateProjectDialog from '@/components/create-project-dialog';
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
} from 'recharts';

interface TenantData {
  id: string;
  name: string;
  description: string | null;
  members: any[];
}
interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}
interface StatsData {
  totalProjects: number;
  totalTasks: number;
  tasksDueToday: number;
  overdueTasks: number;
  completedTasks: number;
  activeMembers: number;
  tasksByStatus: { status: string; count: number }[];
  completionTrend: { name: string; completed: number; created: number }[];
  recentActivities: any[];
}

const STATUS_PIE_COLORS: Record<string, string> = {
  todo: '#444444',
  in_progress: '#888888',
  in_review: '#bbbbbb',
  done: '#6ee7b7',
  blocked: '#f87171',
};

const KPI = [
  {
    key: 'totalProjects',
    label: 'Projects',
    Icon: FolderKanban,
    lineColor: '#555555',
  },
  {
    key: 'totalTasks',
    label: 'Tasks',
    Icon: CheckSquare,
    lineColor: '#666666',
  },
  {
    key: 'tasksDueToday',
    label: 'Due Today',
    Icon: Clock,
    lineColor: '#888888',
  },
  {
    key: 'overdueTasks',
    label: 'Overdue',
    Icon: AlertTriangle,
    lineColor: '#e05555',
    danger: true,
  },
  {
    key: 'completedTasks',
    label: 'Completed',
    Icon: CheckSquare,
    lineColor: '#6ee7b7',
  },
  {
    key: 'activeMembers',
    label: 'Members',
    Icon: UserCheck,
    lineColor: '#aaaaaa',
  },
];

const tooltipStyle = {
  backgroundColor: '#111111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.375rem',
  color: '#aaaaaa',
  fontSize: '11px',
  boxShadow: 'none',
};

export default function TenantPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tenantRes, projectsRes, statsRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}`),
        fetch(`/api/tenants/${tenantId}/projects`),
        fetch(`/api/tenants/${tenantId}/stats`),
      ]);
      if (!tenantRes.ok || !projectsRes.ok || !statsRes.ok)
        throw new Error('Failed');
      setTenant(await tenantRes.json());
      setProjects(await projectsRes.json());
      setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);
  const onProjectCreated = (p: Project) => {
    setProjects((prev) => [...prev, p]);
    fetchData();
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin' />
          <p className='text-[11px]' style={{ color: 'var(--foreground-dim)' }}>
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!tenant)
    return (
      <div
        className='text-center py-20 text-sm'
        style={{ color: 'var(--foreground-muted)' }}
      >
        Workspace not found
      </div>
    );

  const statusChartData =
    stats?.tasksByStatus.map((s) => ({
      name: s.status.replace('_', ' '),
      value: s.count,
      color: STATUS_PIE_COLORS[s.status] || '#555',
    })) || [];

  return (
    <div className='space-y-7'>
      {/* Header */}
      <div
        className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5'
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <h1
            className='text-xl font-extrabold tracking-tight'
            style={{ color: 'var(--foreground)' }}
          >
            {tenant.name}
          </h1>
          {tenant.description && (
            <p
              className='text-xs mt-1 max-w-xl'
              style={{ color: 'var(--foreground-muted)' }}
            >
              {tenant.description}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Link href={`/dashboard/tenant/${tenantId}/settings`}>
            <Button size='sm' className='btn-ghost text-xs h-8 px-3 rounded-md'>
              <Settings className='w-3.5 h-3.5 mr-1.5' />
              Settings
            </Button>
          </Link>
          <CreateProjectDialog tenantId={tenantId} onSuccess={onProjectCreated}>
            <Button
              size='sm'
              className='btn-primary text-xs h-8 px-3 rounded-md'
            >
              <Plus className='w-3.5 h-3.5 mr-1.5' />
              New Project
            </Button>
          </CreateProjectDialog>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className='grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'>
          {KPI.map(({ key, label, Icon, lineColor, danger }) => {
            const val = (stats as any)[key] as number;
            const isDanger = danger && val > 0;
            return (
              <div
                key={key}
                className='relative overflow-hidden rounded-xl'
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  className='absolute left-0 top-0 w-px h-full'
                  style={{ background: isDanger ? '#e05555' : lineColor }}
                />
                <div className='p-4 pl-5'>
                  <div className='flex items-center justify-between mb-2.5'>
                    <p className='field-label'>{label}</p>
                    <Icon
                      className='w-3.5 h-3.5 flex-shrink-0'
                      style={{
                        color: isDanger ? '#e05555' : 'var(--foreground-dim)',
                      }}
                    />
                  </div>
                  <p
                    className='text-2xl font-black tracking-tight'
                    style={{
                      color: isDanger ? '#f87171' : 'var(--foreground)',
                    }}
                  >
                    {val}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {stats && stats.totalTasks > 0 && (
        <div className='grid gap-4 md:grid-cols-12'>
          {/* Line chart */}
          <div
            className='md:col-span-7 rounded-xl overflow-hidden'
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className='flex items-center gap-2 px-4 py-3'
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--surface-1)',
              }}
            >
              <TrendingUp
                className='w-3.5 h-3.5'
                style={{ color: 'var(--foreground-dim)' }}
              />
              <span
                className='text-xs font-bold'
                style={{ color: 'var(--foreground)' }}
              >
                Task Productivity Trend
              </span>
            </div>
            <div className='p-4'>
              <div className='h-56 w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={stats.completionTrend}>
                    <CartesianGrid
                      strokeDasharray='2 4'
                      vertical={false}
                      stroke='rgba(255,255,255,0.04)'
                    />
                    <XAxis
                      dataKey='name'
                      stroke='#444'
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke='#444'
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#aaa' }}
                      labelStyle={{ color: '#777', fontWeight: 700 }}
                    />
                    <Legend
                      verticalAlign='top'
                      height={28}
                      iconType='circle'
                      wrapperStyle={{ fontSize: '10px', color: '#666' }}
                    />
                    <Line
                      type='monotone'
                      dataKey='created'
                      name='Created'
                      stroke='#555'
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type='monotone'
                      dataKey='completed'
                      name='Completed'
                      stroke='#6ee7b7'
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pie chart */}
          <div
            className='md:col-span-5 rounded-xl overflow-hidden'
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className='flex items-center gap-2 px-4 py-3'
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--surface-1)',
              }}
            >
              <Activity
                className='w-3.5 h-3.5'
                style={{ color: 'var(--foreground-dim)' }}
              />
              <span
                className='text-xs font-bold'
                style={{ color: 'var(--foreground)' }}
              >
                Task Distribution
              </span>
            </div>
            <div className='p-4'>
              {statusChartData.length > 0 && (
                <>
                  <div className='h-40 w-full relative'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          innerRadius={40}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey='value'
                        >
                          {statusChartData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={tooltipStyle}
                          itemStyle={{ color: '#aaa' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                      <span
                        className='text-xl font-black'
                        style={{ color: 'var(--foreground)' }}
                      >
                        {stats.totalTasks}
                      </span>
                      <span className='field-label'>Total</span>
                    </div>
                  </div>
                  <div className='flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2'>
                    {statusChartData.map((item, i) => (
                      <div key={i} className='flex items-center gap-1'>
                        <div
                          className='w-1.5 h-1.5 rounded-sm'
                          style={{ background: item.color }}
                        />
                        <span
                          className='text-[10px] font-medium capitalize'
                          style={{ color: 'var(--foreground-dim)' }}
                        >
                          {item.name} ({item.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects + Activity */}
      <div className='grid gap-4 md:grid-cols-12'>
        {/* Projects */}
        <div className='md:col-span-8 space-y-3'>
          <div
            className='flex items-center justify-between pb-2'
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className='section-heading flex items-center gap-2'>
              <FolderKanban className='w-3.5 h-3.5' />
              Projects
            </h2>
            <CreateProjectDialog
              tenantId={tenantId}
              onSuccess={onProjectCreated}
            >
              <Button
                size='sm'
                className='btn-ghost text-[11px] h-7 px-2.5 rounded-md'
              >
                <Plus className='w-3 h-3 mr-1' />
                Add
              </Button>
            </CreateProjectDialog>
          </div>

          {projects.length > 0 ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/project/${project.id}`}
                  className='group block'
                >
                  <div
                    className='relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5'
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        'var(--border-strong)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        'var(--border-subtle)')
                    }
                  >
                    <div className='p-4'>
                      <div className='flex items-start justify-between gap-3 mb-3'>
                        <div
                          className='w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0'
                          style={{
                            background: project.color
                              ? `${project.color}22`
                              : 'var(--surface-3)',
                            border: `1px solid ${project.color || 'var(--border-strong)'}40`,
                            color: project.color || 'var(--foreground-muted)',
                          }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <ArrowRight
                          className='w-4 h-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          style={{ color: 'var(--foreground-dim)' }}
                        />
                      </div>
                      <h3
                        className='text-sm font-bold mb-1'
                        style={{ color: 'var(--foreground)' }}
                      >
                        {project.name}
                      </h3>
                      <p
                        className='text-xs line-clamp-2 mb-4 leading-relaxed'
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {project.description || 'No description provided.'}
                      </p>
                      <div
                        className='flex items-center gap-4 pt-3'
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                      >
                        <div
                          className='flex items-center gap-1.5 text-[10px] font-semibold'
                          style={{ color: 'var(--foreground-dim)' }}
                        >
                          <CheckSquare className='w-3 h-3' />
                          View tasks
                        </div>
                        <div
                          className='flex items-center gap-1.5 text-[10px] font-semibold'
                          style={{
                            color: project.color || 'var(--foreground-dim)',
                          }}
                        >
                          <div
                            className='w-1.5 h-1.5 rounded-full'
                            style={{
                              background:
                                project.color || 'var(--border-strong)',
                            }}
                          />
                          Active
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className='rounded-xl py-12 text-center'
              style={{
                background: 'var(--surface-2)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <FolderKanban
                className='w-8 h-8 mx-auto mb-3'
                style={{ color: 'var(--foreground-dim)' }}
              />
              <h3
                className='text-sm font-bold mb-1'
                style={{ color: 'var(--foreground)' }}
              >
                No active projects
              </h3>
              <p
                className='text-xs mb-4'
                style={{ color: 'var(--foreground-muted)' }}
              >
                Create a new project to begin managing tasks.
              </p>
              <CreateProjectDialog
                tenantId={tenantId}
                onSuccess={onProjectCreated}
              >
                <Button
                  size='sm'
                  className='btn-primary text-xs h-8 px-4 rounded-md'
                >
                  <Plus className='w-3.5 h-3.5 mr-1.5' />
                  Create First Project
                </Button>
              </CreateProjectDialog>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className='md:col-span-4 space-y-3'>
          <div
            className='pb-2'
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className='section-heading flex items-center gap-2'>
              <Activity className='w-3.5 h-3.5' />
              Activity Feed
            </h2>
          </div>
          <div
            className='rounded-xl overflow-hidden'
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className='p-3.5'>
              {stats && stats.recentActivities.length > 0 ? (
                <div className='space-y-3.5 max-h-72 overflow-y-auto pr-1'>
                  {stats.recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className='flex items-start gap-2.5 text-xs'
                    >
                      <div
                        className='w-1 h-1 rounded-full flex-shrink-0 mt-1.5'
                        style={{ background: 'var(--foreground-dim)' }}
                      />
                      <div className='space-y-0.5 min-w-0'>
                        <p style={{ color: 'var(--foreground-muted)' }}>
                          <span
                            className='font-semibold'
                            style={{ color: 'var(--foreground)' }}
                          >
                            {act.userFullName || 'System'}
                          </span>{' '}
                          <span
                            className='uppercase text-[10px] font-mono font-bold'
                            style={{ color: 'var(--foreground-dim)' }}
                          >
                            {act.action.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p
                          className='text-[10px] font-mono'
                          style={{ color: 'var(--foreground-dim)' }}
                        >
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className='text-center py-8 text-xs'
                  style={{ color: 'var(--foreground-dim)' }}
                >
                  No recent activity.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
