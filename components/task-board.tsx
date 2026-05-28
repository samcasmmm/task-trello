'use client';

import { useState, useMemo } from 'react';
import { TaskBoardColumn } from './task-board-column';
import api from '@/lib/axios';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

export default function TaskBoard({
  projectId,
  tasks,
  onTaskMoved,
  onTaskCreated,
}: {
  projectId: string;
  tasks: any[];
  onTaskMoved?: (taskId: string, newStatus: string) => void;
  onTaskCreated?: (task: any) => void;
}) {
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tasksByStatus = useMemo(() => {
    const g: Record<string, any[]> = {};
    STATUSES.forEach((s) => (g[s] = []));
    tasks.forEach((t) => {
      if (t.status && g[t.status]) g[t.status].push(t);
    });
    return g;
  }, [tasks]);

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverStatus(null);
    setDraggingId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    onTaskMoved?.(taskId, newStatus);
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
    } catch {
      onTaskMoved?.(taskId, task.status);
    }
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-1 px-1">
      <div className="flex gap-3 min-w-max">
        {STATUSES.map((status) => (
          <TaskBoardColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            projectId={projectId}
            isDragTarget={dragOverStatus === status}
            draggingId={draggingId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => handleDrop(e, status)}
            onDragStart={(e, taskId) => {
              e.dataTransfer.setData('taskId', taskId);
              setDraggingId(taskId);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverStatus(null);
            }}
            onTaskCreated={onTaskCreated}
          />
        ))}
      </div>
    </div>
  );
}
