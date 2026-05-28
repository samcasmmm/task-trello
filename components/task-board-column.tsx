'use client';

import { Plus } from 'lucide-react';
import CreateTaskDialog from './create-task-dialog';
import { TaskBoardCard } from './task-board-card';

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    barColor: string;
    countBg: string;
    countColor: string;
    dropBg: string;
    dropBorder: string;
  }
> = {
  todo: {
    label: 'To Do',
    barColor: '#444444',
    countBg: 'rgba(80,80,80,0.15)',
    countColor: '#777777',
    dropBg: 'rgba(60,60,60,0.06)',
    dropBorder: '#444444',
  },
  in_progress: {
    label: 'In Progress',
    barColor: '#888888',
    countBg: 'rgba(136,136,136,0.12)',
    countColor: '#aaaaaa',
    dropBg: 'rgba(100,100,100,0.06)',
    dropBorder: '#888888',
  },
  in_review: {
    label: 'In Review',
    barColor: '#aaaaaa',
    countBg: 'rgba(170,170,170,0.12)',
    countColor: '#cccccc',
    dropBg: 'rgba(130,130,130,0.06)',
    dropBorder: '#aaaaaa',
  },
  done: {
    label: 'Done',
    barColor: '#6ee7b7',
    countBg: 'rgba(110,231,183,0.1)',
    countColor: '#6ee7b7',
    dropBg: 'rgba(110,231,183,0.04)',
    dropBorder: '#6ee7b7',
  },
  blocked: {
    label: 'Blocked',
    barColor: '#e05555',
    countBg: 'rgba(224,85,85,0.1)',
    countColor: '#f87171',
    dropBg: 'rgba(224,85,85,0.04)',
    dropBorder: '#e05555',
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
      className='flex-shrink-0 w-[300px] flex flex-col gap-2'
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className='flex items-center gap-2 px-0.5 py-1.5'>
        <div
          className='w-1.5 h-1.5 rounded-full flex-shrink-0'
          style={{ background: cfg.barColor }}
        />
        <span className='text-xs font-bold' style={{ color: 'var(--foreground)' }}>
          {cfg.label}
        </span>
        <span
          className='text-[10px] font-bold px-1.5 py-0.5 rounded-full'
          style={{ background: cfg.countBg, color: cfg.countColor }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className='flex flex-col gap-2 min-h-[480px] rounded-lg p-2 transition-all duration-200'
        style={{
          background: isDragTarget ? cfg.dropBg : 'var(--surface-2)',
          border: isDragTarget
            ? `1px dashed ${cfg.dropBorder}88`
            : '1px solid var(--border-subtle)',
        }}
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
          <button
            className='w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all mt-auto'
            style={{ color: 'var(--foreground-dim)', border: '1px dashed var(--border-subtle)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              (e.currentTarget as HTMLElement).style.color = 'var(--foreground-muted)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.color = 'var(--foreground-dim)';
            }}
          >
            <Plus className='w-3 h-3' />
            Add task
          </button>
        </CreateTaskDialog>
      </div>
    </div>
  );
}
