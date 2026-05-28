'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, CheckCircle } from 'lucide-react';
import CreateTaskDialog from './create-task-dialog';
import { formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

const STATUS_STYLE: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  todo: { color: '#777777', bg: 'rgba(100,100,100,0.12)', label: 'To Do' },
  in_progress: {
    color: '#aaaaaa',
    bg: 'rgba(150,150,150,0.12)',
    label: 'In Progress',
  },
  in_review: {
    color: '#cccccc',
    bg: 'rgba(180,180,180,0.1)',
    label: 'In Review',
  },
  done: { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', label: 'Done' },
  blocked: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Blocked' },
};

const PRIORITY_DOT: Record<string, string> = {
  low: '#444444',
  medium: '#d4a84b',
  high: '#e08050',
  urgent: '#e05555',
};

interface SubtaskProps {
  task: any;
  level: number;
  onStatusChange?: (taskId: string, status: string) => void;
}

function SubtaskItem({ task, level, onStatusChange }: SubtaskProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const hasChildren = task.children && task.children.length > 0;
  const statusStyle = STATUS_STYLE[task.status] || STATUS_STYLE.todo;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange?.(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 1.125}rem` }} className='space-y-1.5'>
      <div
        className='flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors'
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = 'var(--border-default)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = 'var(--border-subtle)')
        }
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex-shrink-0 mt-0.5 transition-colors'
            style={{ color: 'var(--foreground-dim)' }}
          >
            {isExpanded ? (
              <ChevronDown className='w-3.5 h-3.5' />
            ) : (
              <ChevronRight className='w-3.5 h-3.5' />
            )}
          </button>
        ) : (
          <div className='flex-shrink-0 w-3.5 h-3.5 mt-0.5 flex items-center justify-center'>
            <div
              className='w-1 h-1 rounded-full'
              style={{ background: 'var(--foreground-dim)' }}
            />
          </div>
        )}

        <div className='flex-1 min-w-0'>
          <Link
            href={`/dashboard/task/${task.id}`}
            className='text-xs font-medium block truncate transition-colors mb-1.5'
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--foreground-muted)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--foreground)')
            }
          >
            {task.title}
          </Link>
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Status select */}
            <Select
              value={task.status}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger
                className='h-5 border-none shadow-none p-0 gap-1 w-auto text-[10px] font-bold capitalize'
                style={{ background: 'transparent', color: statusStyle.color }}
              >
                <span
                  className='px-1.5 py-0.5 rounded text-[10px] font-bold'
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {statusStyle.label}
                </span>
              </SelectTrigger>
              <SelectContent
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                }}
                className='rounded-lg shadow-none'
              >
                {Object.entries(STATUS_STYLE).map(([key, val]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className='text-[11px] capitalize'
                    style={{ color: val.color }}
                  >
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority dot */}
            <div className='flex items-center gap-1'>
              <div
                className='w-1.5 h-1.5 rounded-full flex-shrink-0'
                style={{ background: PRIORITY_DOT[task.priority] || '#444' }}
              />
              <span
                className='text-[10px] capitalize'
                style={{ color: 'var(--foreground-dim)' }}
              >
                {task.priority}
              </span>
            </div>

            {task.due_date && (
              <span
                className='text-[10px] font-mono'
                style={{ color: 'var(--foreground-dim)' }}
              >
                {formatDate(task.due_date)}
              </span>
            )}
            {task.assignedTo && (
              <span
                className='text-[10px] font-medium px-1.5 py-0.5 rounded'
                style={{
                  background: 'var(--surface-3)',
                  color: 'var(--foreground-dim)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                @{task.assignedTo.fullName}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div
          className='space-y-1.5 pl-1'
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          {task.children.map((sub: any) => (
            <SubtaskItem
              key={sub.id}
              task={sub}
              level={level + 1}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubtasksSection({
  taskId,
  subtasks,
  projectId,
  onRefresh,
}: {
  taskId: string;
  subtasks: any[];
  projectId: string;
  onRefresh?: () => void;
}) {
  const buildTree = (flat: any[]) => {
    const map: Record<string, any> = {};
    const roots: any[] = [];
    flat.forEach((t) => (map[t.id] = { ...t, children: [] }));
    flat.forEach((t) => {
      const pid = t.parent_task_id || t.parentTaskId;
      if (pid === taskId) roots.push(map[t.id]);
      else if (pid && map[pid]) map[pid].children.push(map[t.id]);
    });
    return roots;
  };

  const rootSubtasks = buildTree(subtasks);
  const completedCount = subtasks.filter((t) => t.status === 'done').length;
  const progress =
    subtasks.length > 0
      ? Math.round((completedCount / subtasks.length) * 100)
      : 0;

  return (
    <div
      className='rounded-xl overflow-hidden'
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className='flex items-center justify-between px-4 py-3'
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
        }}
      >
        <div className='flex items-center gap-3'>
          <span
            className='text-xs font-bold'
            style={{ color: 'var(--foreground)' }}
          >
            Subtasks
          </span>
          {subtasks.length > 0 && (
            <span
              className='text-[10px] font-semibold px-2 py-0.5 rounded-full'
              style={{
                background: 'var(--surface-3)',
                color: 'var(--foreground-dim)',
                border: '1px solid var(--border-default)',
              }}
            >
              {completedCount}/{subtasks.length}
            </span>
          )}
        </div>
        <CreateTaskDialog
          projectId={projectId}
          parentTaskId={taskId}
          onSuccess={onRefresh}
        >
          <Button
            size='sm'
            className='text-[11px] h-7 px-2.5 rounded-md font-semibold btn-ghost'
          >
            <Plus className='w-3 h-3 mr-1' />
            Add
          </Button>
        </CreateTaskDialog>
      </div>

      <div className='p-3'>
        {/* Progress bar */}
        {subtasks.length > 0 && (
          <div className='flex items-center gap-2.5 mb-3'>
            <div
              className='flex-1 h-1 rounded-full overflow-hidden'
              style={{ background: 'var(--surface-3)' }}
            >
              <div
                className='h-full rounded-full transition-all duration-500'
                style={{
                  width: `${progress}%`,
                  background:
                    progress === 100 ? '#6ee7b7' : 'rgba(255,255,255,0.25)',
                }}
              />
            </div>
            <span
              className='text-[10px] font-semibold flex-shrink-0'
              style={{ color: 'var(--foreground-dim)' }}
            >
              {progress}%
            </span>
          </div>
        )}

        {subtasks.length === 0 ? (
          <div className='text-center py-6'>
            <CheckCircle
              className='w-7 h-7 mx-auto mb-2'
              style={{ color: 'var(--foreground-dim)' }}
            />
            <p className='text-xs' style={{ color: 'var(--foreground-dim)' }}>
              No subtasks yet
            </p>
          </div>
        ) : (
          <div className='space-y-1.5'>
            {rootSubtasks.map((sub) => (
              <SubtaskItem
                key={sub.id}
                task={sub}
                level={0}
                onStatusChange={() => onRefresh?.()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
