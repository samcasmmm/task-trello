'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done', blocked: 'Blocked',
};

const STATUS_CLASSES: Record<string, string> = {
  todo:        'text-slate-400 bg-slate-400/10',
  in_progress: 'text-slate-300 bg-slate-300/10',
  in_review:   'text-slate-200 bg-slate-200/10',
  done:        'text-emerald-400 bg-emerald-400/10',
  blocked:     'text-rose-400 bg-rose-400/10',
};

const PRIORITY_DOT_CLASSES: Record<string, string> = {
  low: 'bg-slate-600',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const PRIORITY_TEXT_CLASSES: Record<string, string> = {
  low: 'text-slate-500',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
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
      ? <ArrowUp className='w-3 h-3 text-foreground-muted' />
      : <ArrowDown className='w-3 h-3 text-foreground-muted' />;
  };

  return (
    <div className='space-y-3'>
      {/* Search */}
      <div className='relative max-w-xs'>
        <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim' />
        <input type='text' placeholder='Filter tasks...' value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className='w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg outline-none transition-all bg-surface-2 border border-border-default text-foreground focus:border-border-strong' />
      </div>

      {/* Table */}
      <div className='rounded-xl overflow-hidden bg-surface-2 border border-border-subtle'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='border-b border-border-subtle bg-surface-1'>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className='px-4 py-3 cursor-pointer select-none transition-colors text-foreground-dim hover:text-foreground-muted'>
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
                return (
                  <tr key={task.id}
                    className={`hover:bg-surface-3 transition-colors ${i < sorted.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                    <td className='px-4 py-3'>
                      <Link href={`/dashboard/task/${task.id}`}
                        className='text-xs font-semibold block truncate max-w-[240px] transition-colors text-foreground hover:text-foreground-muted'>
                        {task.title}
                      </Link>
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded capitalize ${STATUS_CLASSES[task.status] || STATUS_CLASSES.todo}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1.5'>
                        <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT_CLASSES[task.priority] || 'bg-slate-600'}`} />
                        <span className={`text-[10px] font-semibold capitalize ${PRIORITY_TEXT_CLASSES[task.priority] || 'text-slate-500'}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {task.assigned_to_user ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-5 w-5 rounded'>
                            <AvatarImage src={task.assigned_to_user.avatarUrl || ''} />
                            <AvatarFallback className='text-[8px] font-bold rounded bg-surface-3 text-foreground-muted border border-border-strong'>
                              {task.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-xs font-medium text-foreground-muted'>
                            {task.assigned_to_user.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className='text-xs text-foreground-dim'>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-[11px] font-mono text-foreground-dim'>
                        {task.due_date ? formatDate(task.due_date) : '—'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className='px-4 py-12 text-center text-xs text-foreground-dim'>
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
