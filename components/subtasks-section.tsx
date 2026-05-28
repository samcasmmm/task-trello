'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, CheckCircle } from 'lucide-react';
import CreateTaskDialog from './create-task-dialog';
import { formatDate } from '@/lib/utils';
import api from '@/lib/axios';
import { Select, SelectContent, SelectTrigger } from '@/components/ui/select';

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: 'text-[#777777]', bg: 'bg-[rgba(100,100,100,0.12)]', label: 'To Do' },
  in_progress: {
    color: 'text-[#aaaaaa]',
    bg: 'bg-[rgba(150,150,150,0.12)]',
    label: 'In Progress',
  },
  in_review: {
    color: 'text-[#cccccc]',
    bg: 'bg-[rgba(180,180,180,0.1)]',
    label: 'In Review',
  },
  done: { color: 'text-[#6ee7b7]', bg: 'bg-[rgba(110,231,183,0.1)]', label: 'Done' },
  blocked: { color: 'text-[#f87171]', bg: 'bg-[rgba(248,113,113,0.1)]', label: 'Blocked' },
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-[#444444]',
  medium: 'bg-[#d4a84b]',
  high: 'bg-[#e08050]',
  urgent: 'bg-[#e05555]',
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
      await api.patch(`/api/tasks/${task.id}`, { status: newStatus });
      onStatusChange?.(task.id, newStatus);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  // Pre-mapping recursive indentation layout using pure v4 arbitrary margins
  const marginClasses = [
    'ml-0',
    'ml-[1.125rem]',
    'ml-[2.25rem]',
    'ml-[3.375rem]',
    'ml-[4.5rem]',
    'ml-[5.625rem]',
  ];
  const computedMargin = marginClasses[level] || `ml-[calc(${level}*1.125rem)]`;

  return (
    <div className={`space-y-1.5 ${computedMargin}`}>
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors border bg-surface-2 border-border-subtle hover:border-border-default">
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0 mt-0.5 transition-colors text-foreground-dim"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="shrink-0 w-3.5 h-3.5 mt-0.5 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-foreground-dim" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/task/${task.id}`}
            className="text-xs font-medium block truncate transition-colors mb-1.5 text-foreground hover:text-foreground-muted"
          >
            {task.title}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status select */}
            <Select value={task.status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger
                className={`h-5 border-none shadow-none p-0 gap-1 w-auto text-[10px] font-bold capitalize bg-transparent ${statusStyle.color}`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusStyle.bg} ${statusStyle.color}`}
                >
                  {statusStyle.label}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-none bg-surface-2 border border-border-default">
                {Object.entries(STATUS_STYLE).map(([key, val]) => (
                  <button
                    key={key}
                    value={key}
                    className={`w-full text-left px-2 py-1.5 text-[11px] capitalize rounded-sm transition-colors hover:bg-surface-3 ${val.color}`}
                  >
                    {val.label}
                  </button>
                ))}
              </SelectContent>
            </Select>

            {/* Priority dot */}
            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-[#444]'}`}
              />
              <span className="text-[10px] capitalize text-foreground-dim">{task.priority}</span>
            </div>

            {task.due_date && (
              <span className="text-[10px] font-mono text-foreground-dim">
                {formatDate(task.due_date)}
              </span>
            )}
            {task.assignedTo && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-3 text-foreground-dim border border-border-subtle">
                @{task.assignedTo.fullName}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="space-y-1.5 pl-1 border-l border-border-subtle">
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
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <div className="rounded-xl overflow-hidden bg-surface-2 border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">Subtasks</span>
          {subtasks.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-3 text-foreground-dim border border-border-default">
              {completedCount}/{subtasks.length}
            </span>
          )}
        </div>
        <CreateTaskDialog projectId={projectId} parentTaskId={taskId} onSuccess={onRefresh}>
          <Button size="sm" className="text-[11px] h-7 px-2.5 rounded-md font-semibold btn-ghost">
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </CreateTaskDialog>
      </div>

      <div className="p-3">
        {/* Progress bar */}
        {subtasks.length > 0 && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex-1 h-1 rounded-full overflow-hidden bg-surface-3">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[rgba(255,255,255,0.25)] data-[complete=true]:bg-[#6ee7b7]"
                data-complete={progress === 100}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold shrink-0 text-foreground-dim">
              {progress}%
            </span>
          </div>
        )}

        {subtasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-7 h-7 mx-auto mb-2 text-foreground-dim" />
            <p className="text-xs text-foreground-dim">No subtasks yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rootSubtasks.map((sub) => (
              <SubtaskItem key={sub.id} task={sub} level={0} onStatusChange={() => onRefresh?.()} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
