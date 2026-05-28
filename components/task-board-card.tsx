'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Clock, AlertTriangle, MessageSquare, CheckSquare } from 'lucide-react';

const PRIORITY_DOT_CLASSES: Record<string, string> = {
  low: 'bg-slate-600',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const PRIORITY_LABEL_CLASSES: Record<string, string> = {
  low: 'text-slate-500 bg-slate-800/40',
  medium: 'text-amber-500 bg-amber-950/20',
  high: 'text-orange-500 bg-orange-950/20',
  urgent: 'text-red-500 bg-red-950/20',
};

function isOverdue(d?: string) {
  if (!d) return false;
  return new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();
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

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`transition-opacity duration-150 ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      <Link href={`/dashboard/task/${task.id}`}>
        <div className="rounded-lg p-3.5 cursor-grab active:cursor-grabbing group transition-all duration-150 bg-surface-1 border border-border-subtle hover:border-border-strong hover:bg-surface-2">
          {/* Priority dot + title */}
          <div className="flex items-start gap-2.5 mb-3">
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT_CLASSES[task.priority] || 'bg-slate-600'}`}
            />
            <h4 className="text-xs font-semibold leading-snug line-clamp-2 flex-1 text-foreground transition-colors group-hover:text-foreground-muted">
              {task.title}
            </h4>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${PRIORITY_LABEL_CLASSES[task.priority] || 'text-slate-500 bg-slate-800/40'}`}
            >
              {task.priority}
            </span>
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span
                  className={`flex items-center gap-1 text-[10px] font-mono font-medium ${overdue ? 'text-red-400' : 'text-foreground-dim'}`}
                >
                  {overdue ? (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  ) : (
                    <Clock className="w-2.5 h-2.5" />
                  )}
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.assigned_to_user && (
                <Avatar className="h-5 w-5 rounded">
                  <AvatarImage src={task.assigned_to_user.avatarUrl || ''} />
                  <AvatarFallback className="text-[8px] font-bold rounded bg-surface-3 text-foreground-muted border border-border-strong">
                    {task.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Meta counts */}
          {((task.task_comments_count ?? 0) > 0 || (task.task_checklists_count ?? 0) > 0) && (
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border-subtle">
              {(task.task_comments_count ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-foreground-dim">
                  <MessageSquare className="w-2.5 h-2.5" /> {task.task_comments_count}
                </span>
              )}
              {(task.task_checklists_count ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-foreground-dim">
                  <CheckSquare className="w-2.5 h-2.5" /> {task.task_checklists_count}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
