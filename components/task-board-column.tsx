'use client';

import { Plus } from 'lucide-react';
import CreateTaskDialog from './create-task-dialog';
import { TaskBoardCard } from './task-board-card';

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    barClass: string;
    countClass: string;
    dropActive: string;
  }
> = {
  todo: {
    label: 'To Do',
    barClass: 'bg-slate-600',
    countClass: 'bg-slate-800/40 text-slate-400',
    dropActive: 'bg-slate-800/10 border-slate-700 border-dashed',
  },
  in_progress: {
    label: 'In Progress',
    barClass: 'bg-slate-400',
    countClass: 'bg-slate-700/40 text-slate-300',
    dropActive: 'bg-slate-700/10 border-slate-600 border-dashed',
  },
  in_review: {
    label: 'In Review',
    barClass: 'bg-slate-300',
    countClass: 'bg-slate-600/40 text-slate-200',
    dropActive: 'bg-slate-600/10 border-slate-500 border-dashed',
  },
  done: {
    label: 'Done',
    barClass: 'bg-emerald-400',
    countClass: 'bg-emerald-950/40 text-emerald-400',
    dropActive: 'bg-emerald-950/10 border-emerald-500/50 border-dashed',
  },
  blocked: {
    label: 'Blocked',
    barClass: 'bg-rose-500',
    countClass: 'bg-rose-950/40 text-rose-400',
    dropActive: 'bg-rose-950/10 border-rose-500/50 border-dashed',
  },
};

export function TaskBoardColumn({
  status,
  tasks,
  projectId,
  isDragTarget,
  draggingId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onTaskCreated,
}: {
  status: string;
  tasks: any[];
  projectId: string;
  isDragTarget: boolean;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onTaskCreated?: (task: any) => void;
}) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className="shrink-0 w-[300px] flex flex-col gap-2"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-0.5 py-1.5">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.barClass}`} />
        <span className="text-xs font-bold text-foreground">{cfg.label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.countClass}`}>
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex flex-col gap-2 min-h-[480px] rounded-lg p-2 transition-all duration-200 border ${
          isDragTarget ? `${cfg.dropActive}` : 'border-border-subtle bg-surface-2'
        }`}
      >
        {tasks.map((task) => (
          <TaskBoardCard
            key={task.id}
            task={task}
            isDragging={draggingId === task.id}
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Add task button */}
        <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all mt-auto border border-dashed border-border-subtle text-foreground-dim hover:border-border-strong hover:text-foreground-muted">
            <Plus className="w-3 h-3" />
            Add task
          </button>
        </CreateTaskDialog>
      </div>
    </div>
  );
}
