'use client';

import { Zap, CheckSquare, Activity, Clock, AlertTriangle } from 'lucide-react';

interface StatsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  tasksDueToday: number;
  overdueTasks: number;
}

interface ProjectKpiCardsProps {
  stats: StatsData | null;
}

const KPI = [
  { key: 'totalTasks', label: 'Total', Icon: Zap, color: 'bg-[#888]' },
  { key: 'completedTasks', label: 'Done', Icon: CheckSquare, color: 'bg-[#6ee7b7]' },
  { key: 'inProgressTasks', label: 'In Progress', Icon: Activity, color: 'bg-[#aaaaaa]' },
  { key: 'tasksDueToday', label: 'Due Today', Icon: Clock, color: 'bg-[#888]' },
  {
    key: 'overdueTasks',
    label: 'Overdue',
    Icon: AlertTriangle,
    color: 'bg-[#e05555]',
    danger: true,
  },
];

export default function ProjectKpiCards({ stats }: ProjectKpiCardsProps) {
  if (!stats) return null;

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {KPI.map(({ key, label, Icon, color, danger }) => {
        const val = (stats as any)[key] as number;
        const isDanger = danger && val > 0;
        return (
          <div
            key={key}
            className="relative overflow-hidden rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
          >
            {/* Left accent indicator edge bar */}
            <div
              className={`absolute left-0 top-0 w-px h-full ${isDanger ? 'bg-[#e05555]' : color}`}
            />
            <div className="p-4 pl-5">
              <div className="flex items-center justify-between mb-2.5">
                <p className="field-label">{label}</p>
                <Icon
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    isDanger ? 'text-[#e05555]' : 'text-[var(--foreground-dim)]'
                  }`}
                />
              </div>
              <p
                className={`text-2xl font-black tracking-tight ${
                  isDanger ? 'text-[#f87171]' : 'text-[var(--foreground)]'
                }`}
              >
                {val}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
