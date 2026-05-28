'use client'

import { Zap, CheckSquare, Activity, Clock, AlertTriangle } from 'lucide-react'

interface StatsData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  tasksDueToday: number
  overdueTasks: number
}

interface ProjectKpiCardsProps {
  stats: StatsData | null
}

const KPI = [
  { key: 'totalTasks', label: 'Total', Icon: Zap, color: '#888' },
  { key: 'completedTasks', label: 'Done', Icon: CheckSquare, color: '#6ee7b7' },
  { key: 'inProgressTasks', label: 'In Progress', Icon: Activity, color: '#aaaaaa' },
  { key: 'tasksDueToday', label: 'Due Today', Icon: Clock, color: '#888' },
  { key: 'overdueTasks', label: 'Overdue', Icon: AlertTriangle, color: '#e05555', danger: true },
]

export default function ProjectKpiCards({ stats }: ProjectKpiCardsProps) {
  if (!stats) return null

  return (
    <div className='grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'>
      {KPI.map(({ key, label, Icon, color, danger }) => {
        const val = (stats as any)[key] as number
        const isDanger = danger && val > 0
        return (
          <div
            key={key}
            className='relative overflow-hidden rounded-lg'
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className='absolute left-0 top-0 w-px h-full'
              style={{ background: isDanger ? '#e05555' : color }}
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
        )
      })}
    </div>
  )
}
