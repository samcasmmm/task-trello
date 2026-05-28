'use client'

import { TrendingUp, Activity, AlertTriangle } from 'lucide-react'
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

interface StatsData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  tasksDueToday: number
  overdueTasks: number
  tasksByStatus: { status: string; count: number }[]
  tasksByPriority: { priority: string; count: number }[]
  monthlyTrend: { name: string; created: number; completed: number }[]
}

interface ProjectChartsProps {
  stats: StatsData | null
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#444444',
  in_progress: '#888888',
  in_review: '#bbbbbb',
  done: '#6ee7b7',
  blocked: '#f87171',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#555555',
  medium: '#d4a84b',
  high: '#e08050',
  urgent: '#e05555',
}

const tooltipStyle = {
  backgroundColor: '#111111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.375rem',
  color: '#aaaaaa',
  fontSize: '11px',
  boxShadow: 'none',
}

export default function ProjectCharts({ stats }: ProjectChartsProps) {
  if (!stats || stats.totalTasks === 0) return null

  const statusChartData = stats.tasksByStatus.map((s) => ({
    name: s.status.replace(/_/g, ' '),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#555',
  }))

  const priorityChartData = stats.tasksByPriority.map((p) => ({
    name: p.priority,
    value: p.count,
    fill: PRIORITY_COLORS[p.priority] || '#555',
  }))

  return (
    <div className='grid gap-4 md:grid-cols-12'>
      {/* Monthly line chart */}
      <div
        className='md:col-span-7 rounded-lg overflow-hidden'
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
            Monthly Task Trend
          </span>
          <span
            className='text-[10px] ml-auto font-medium'
            style={{ color: 'var(--foreground-dim)' }}
          >
            Last 12 months
          </span>
        </div>
        <div className='p-4'>
          <div className='h-52 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid
                  strokeDasharray='2 4'
                  vertical={false}
                  stroke='rgba(255,255,255,0.04)'
                />
                <XAxis
                  dataKey='name'
                  stroke='#444'
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
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

      {/* Status + Priority stacked */}
      <div className='md:col-span-5 flex flex-col gap-4'>
        {/* Status donut */}
        <div
          className='flex-1 rounded-lg overflow-hidden'
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
              By Status
            </span>
          </div>
          <div className='p-3'>
            <div className='flex items-center gap-3'>
              <div className='h-28 w-28 flex-shrink-0 relative'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      innerRadius={30}
                      outerRadius={46}
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
                    className='text-sm font-black'
                    style={{ color: 'var(--foreground)' }}
                  >
                    {stats.totalTasks}
                  </span>
                  <span className='field-label'>Total</span>
                </div>
              </div>
              <div className='flex flex-col gap-1.5 flex-1'>
                {statusChartData.map((item, i) => (
                  <div key={i} className='flex items-center gap-1.5'>
                    <div
                      className='w-1.5 h-1.5 rounded-sm flex-shrink-0'
                      style={{ background: item.color }}
                    />
                    <span
                      className='text-[10px] font-medium capitalize flex-1'
                      style={{ color: 'var(--foreground-dim)' }}
                    >
                      {item.name}
                    </span>
                    <span
                      className='text-[10px] font-bold'
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Priority bar chart */}
        {priorityChartData.length > 0 && (
          <div
            className='rounded-lg overflow-hidden'
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
              <AlertTriangle
                className='w-3.5 h-3.5'
                style={{ color: 'var(--foreground-dim)' }}
              />
              <span
                className='text-xs font-bold'
                style={{ color: 'var(--foreground)' }}
              >
                By Priority
              </span>
            </div>
            <div className='p-3'>
              <div className='h-24 w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={priorityChartData} barSize={18}>
                    <XAxis
                      dataKey='name'
                      stroke='#444'
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke='#444'
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      width={20}
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: '#aaa' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey='value' name='Tasks' radius={[3, 3, 0, 0]}>
                      {priorityChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
