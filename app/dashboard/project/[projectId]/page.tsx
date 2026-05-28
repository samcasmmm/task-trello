'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Settings,
  LayoutGrid,
  List,
  Calendar,
  CalendarDays,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import CreateTaskDialog from '@/components/create-task-dialog';
import TaskBoard from '@/components/task-board';
import TaskList from '@/components/task-list';
import TaskCalendar from '@/components/task-calendar';
import Link from 'next/link';

// Extracted Components
import ProjectKpiCards from '@/components/project-kpi-cards';
import ProjectCharts from '@/components/project-charts';
import ProjectEmptyState from '@/components/project-empty-state';

// Advanced Views
import TaskTimeline from '@/components/task-timeline';
import TaskSwimlanes from '@/components/task-swimlanes';
import api from '@/lib/axios';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to_user?: { fullName: string; avatarUrl?: string } | null;
}

interface StatsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  tasksDueToday: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  monthlyTrend: { name: string; created: number; completed: number }[];
}

const VIEWS = [
  { key: 'board', label: 'Board', Icon: LayoutGrid },
  { key: 'list', label: 'List', Icon: List },
  { key: 'calendar', label: 'Calendar', Icon: Calendar },
  { key: 'timeline', label: 'Timeline / Gantt', Icon: CalendarDays },
  { key: 'swimlanes', label: 'Swimlanes', Icon: Layers },
];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeView, setActiveView] = useState<
    'board' | 'list' | 'calendar' | 'timeline' | 'swimlanes'
  >('board');

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, statsRes] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/projects/${projectId}/tasks`),
        api.get(`/api/projects/${projectId}/stats`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const onTaskCreated = (t: any) => {
    setTasks((p) => [...p, t]);
    fetchData();
  };

  const onTaskMoved = (taskId: string, newStatus: string) =>
    setTasks((p) => p.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
          <p className="text-[11px] text-foreground-dim">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-sm text-foreground-muted">Project not found</div>;
  }

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <Link href="/dashboard" className="hover:text-white transition-colors text-foreground-dim">
          Dashboard
        </Link>
        <span className="text-foreground-dim">/</span>
        <span className="font-medium text-foreground-muted">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-xs mt-1 max-w-xl text-foreground-muted">{project.description}</p>
          )}
          {tasks.length > 0 && (
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-32 h-1 rounded-full overflow-hidden bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[rgba(255,255,255,0.3)] data-[complete=true]:bg-[#6ee7b7]"
                  data-complete={progress === 100}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-foreground-dim">
                {doneTasks}/{tasks.length} done
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="btn-ghost text-xs h-8 px-3 rounded-md flex items-center gap-1.5"
          >
            {showAnalytics ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Link href={`/dashboard/project/${projectId}/settings`}>
            <Button size="sm" className="btn-ghost text-xs h-8 px-3 rounded-md">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Button>
          </Link>
          <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
            <Button size="sm" className="btn-primary text-xs h-8 px-3 rounded-md">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Task
            </Button>
          </CreateTaskDialog>
        </div>
      </div>

      {/* KPI row (Conditional) */}
      {showAnalytics && <ProjectKpiCards stats={stats} />}

      {/* Monthly charts (Conditional) */}
      {showAnalytics && <ProjectCharts stats={stats} />}

      {/* View tabs & Action panel */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-border-subtle">
          {VIEWS.map(({ key, label, Icon }) => {
            const isActive = activeView === key;
            return (
              <button
                key={key}
                onClick={() => setActiveView(key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isActive ? 'bg-surface-3 text-foreground' : 'bg-transparent text-foreground-dim'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] font-medium text-foreground-dim">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* View content */}
      {activeView === 'board' &&
        (tasks.length > 0 ? (
          <TaskBoard
            projectId={projectId}
            tasks={tasks}
            onTaskMoved={onTaskMoved}
            onTaskCreated={onTaskCreated}
          />
        ) : (
          <ProjectEmptyState projectId={projectId} onTaskCreated={onTaskCreated} />
        ))}
      {activeView === 'list' && <TaskList projectId={projectId} tasks={tasks} />}
      {activeView === 'calendar' && <TaskCalendar projectId={projectId} tasks={tasks} />}
      {activeView === 'timeline' && <TaskTimeline tasks={tasks} />}
      {activeView === 'swimlanes' && <TaskSwimlanes tasks={tasks} />}
    </div>
  );
}
