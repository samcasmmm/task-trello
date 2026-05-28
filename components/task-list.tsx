'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done', blocked: 'Blocked',
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  todo:        { color: '#777777', bg: 'rgba(100,100,100,0.12)' },
  in_progress: { color: '#aaaaaa', bg: 'rgba(150,150,150,0.1)' },
  in_review:   { color: '#cccccc', bg: 'rgba(180,180,180,0.08)' },
  done:        { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  blocked:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const PRIORITY_DOT: Record<string, string> = {
  low: '#444444', medium: '#d4a84b', high: '#e08050', urgent: '#e05555',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: '#666666', medium: '#d4a84b', high: '#e08050', urgent: '#e05555',
};

const COLUMNS = [
  { key: 'title', label: 'Task' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assigned_to', label: 'Assignee' },
  { key: 'dueDate', label: 'Due Date' },
];

export default function TaskList({ tasks = [] }: { projectId: string; tasks: any[] }) {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = tasks.filter(t => t.title.toLowerCase().includes(filterText.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    let aV = sortField === 'assigned_to' ? (a.assigned_to_user?.fullName || '') : a[sortField];
    let bV = sortField === 'assigned_to' ? (b.assigned_to_user?.fullName || '') : b[sortField];
    if (aV == null) return sortAsc ? -1 : 1;
    if (bV == null) return sortAsc ? 1 : -1;
    return aV < bV ? (sortAsc ? -1 : 1) : aV > bV ? (sortAsc ? 1 : -1) : 0;
  });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className='w-3 h-3 opacity-20' />;
    return sortAsc
      ? <ArrowUp className='w-3 h-3' style={{ color: 'var(--foreground-muted)' }} />
      : <ArrowDown className='w-3 h-3' style={{ color: 'var(--foreground-muted)' }} />;
  };

  return (
    <div className='space-y-3'>
      {/* Search */}
      <div className='relative max-w-xs'>
        <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2' style={{ color: 'var(--foreground-dim)' }} />
        <input type='text' placeholder='Filter tasks...' value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className='w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg outline-none transition-all'
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--foreground)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')} />
      </div>

      {/* Table */}
      <div className='rounded-xl overflow-hidden'
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
        <div className='overflow-x-auto'>
          <table className='w-full text-left' style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className='px-4 py-3 cursor-pointer select-none transition-colors'
                    style={{ color: 'var(--foreground-dim)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-dim)')}>
                    <div className='flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider'>
                      {col.label}
                      <SortIcon field={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? sorted.map((task, i) => {
                const ss = STATUS_STYLE[task.status] || STATUS_STYLE.todo;
                return (
                  <tr key={task.id}
                    style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className='px-4 py-3'>
                      <Link href={`/dashboard/task/${task.id}`}
                        className='text-xs font-semibold block truncate max-w-[240px] transition-colors'
                        style={{ color: 'var(--foreground)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground)')}>
                        {task.title}
                      </Link>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-[10px] font-bold px-2 py-1 rounded capitalize'
                        style={{ color: ss.color, background: ss.bg }}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1.5'>
                        <div className='w-1.5 h-1.5 rounded-full' style={{ background: PRIORITY_DOT[task.priority] || '#444' }} />
                        <span className='text-[10px] font-semibold capitalize' style={{ color: PRIORITY_COLOR[task.priority] || '#666' }}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {task.assigned_to_user ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-5 w-5 rounded'>
                            <AvatarImage src={task.assigned_to_user.avatarUrl || ''} />
                            <AvatarFallback className='text-[8px] font-bold rounded'
                              style={{ background: 'var(--surface-3)', color: 'var(--foreground-muted)', border: '1px solid var(--border-strong)' }}>
                              {task.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-xs font-medium' style={{ color: 'var(--foreground-muted)' }}>
                            {task.assigned_to_user.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className='text-xs' style={{ color: 'var(--foreground-dim)' }}>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-[11px] font-mono' style={{ color: 'var(--foreground-dim)' }}>
                        {task.due_date ? formatDate(task.due_date) : '—'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className='px-4 py-12 text-center text-xs' style={{ color: 'var(--foreground-dim)' }}>
                    No tasks match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
