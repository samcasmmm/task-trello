'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Clock, AlertTriangle, MessageSquare, CheckSquare } from 'lucide-react';

const PRIORITY_DOT: Record<string, string> = {
  low: '#444444',
  medium: '#d4a84b',
  high: '#e08050',
  urgent: '#e05555',
};

const PRIORITY_LABEL: Record<string, { color: string; bg: string }> = {
  low: { color: '#666666', bg: 'rgba(80,80,80,0.12)' },
  medium: { color: '#d4a84b', bg: 'rgba(212,168,75,0.1)' },
  high: { color: '#e08050', bg: 'rgba(224,128,80,0.1)' },
  urgent: { color: '#e05555', bg: 'rgba(224,85,85,0.1)' },
};

function isOverdue(d?: string) {
  if (!d) return false;
  return (
    new Date(d) < new Date() &&
    new Date(d).toDateString() !== new Date().toDateString()
  );
}

export function TaskBoardCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  task: any;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const overdue = isOverdue(task.due_date);
  const prioStyle = PRIORITY_LABEL[task.priority] || PRIORITY_LABEL.low;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ opacity: isDragging ? 0.3 : 1, transition: 'all 0.15s' }}
    >
      <Link href={`/dashboard/task/${task.id}`}>
        <div
          className='rounded-lg p-3.5 cursor-grab active:cursor-grabbing group transition-all duration-150'
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
            (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)';
          }}
        >
          {/* Priority dot + title */}
          <div className='flex items-start gap-2.5 mb-3'>
            <div
              className='w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5'
              style={{ background: PRIORITY_DOT[task.priority] || '#444444' }}
            />
            <h4
              className='text-xs font-semibold leading-snug line-clamp-2 flex-1 transition-colors'
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
            >
              {task.title}
            </h4>
          </div>

          {/* Footer row */}
          <div className='flex items-center justify-between gap-2'>
            <span
              className='text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize'
              style={{ color: prioStyle.color, background: prioStyle.bg }}
            >
              {task.priority}
            </span>
            <div className='flex items-center gap-2'>
              {task.due_date && (
                <span
                  className='flex items-center gap-1 text-[10px] font-mono font-medium'
                  style={{ color: overdue ? '#f87171' : 'var(--foreground-dim)' }}
                >
                  {overdue ? (
                    <AlertTriangle className='w-2.5 h-2.5' />
                  ) : (
                    <Clock className='w-2.5 h-2.5' />
                  )}
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.assigned_to_user && (
                <Avatar className='h-5 w-5 rounded'>
                  <AvatarImage src={task.assigned_to_user.avatarUrl || ''} />
                  <AvatarFallback
                    className='text-[8px] font-bold rounded'
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--foreground-muted)',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    {task.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Meta counts */}
          {((task.task_comments_count ?? 0) > 0 || (task.task_checklists_count ?? 0) > 0) && (
            <div
              className='flex items-center gap-3 mt-2.5 pt-2.5'
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              {(task.task_comments_count ?? 0) > 0 && (
                <span
                  className='flex items-center gap-1 text-[10px] font-medium'
                  style={{ color: 'var(--foreground-dim)' }}
                >
                  <MessageSquare className='w-2.5 h-2.5' /> {task.task_comments_count}
                </span>
              )}
              {(task.task_checklists_count ?? 0) > 0 && (
                <span
                  className='flex items-center gap-1 text-[10px] font-medium'
                  style={{ color: 'var(--foreground-dim)' }}
                >
                  <CheckSquare className='w-2.5 h-2.5' /> {task.task_checklists_count}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
