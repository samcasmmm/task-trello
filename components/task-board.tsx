'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import CreateTaskDialog from './create-task-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Clock, AlertTriangle } from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<string, { bg: string; bar: string; badge: string }> = {
  todo: { bg: 'bg-slate-50', bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-700' },
  in_progress: { bg: 'bg-blue-50/40', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  in_review: { bg: 'bg-purple-50/40', bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
  done: { bg: 'bg-green-50/40', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  blocked: { bg: 'bg-red-50/40', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
}

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
    const grouped: Record<string, any[]> = {};
    STATUSES.forEach((s) => (grouped[s] = []));
    tasks.forEach((task) => {
      if (task.status && grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverStatus(null);
    setDraggingId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    onTaskMoved?.(taskId, newStatus);

    // Persist to server
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on failure
      onTaskMoved?.(taskId, task.status);
    }
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STATUSES.map((status) => {
          const styles = STATUS_COLORS[status];
          const colTasks = tasksByStatus[status];
          const isDragTarget = dragOverStatus === status;

          return (
            <div
              key={status}
              className="flex-shrink-0 w-72"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className="mb-3">
                <div className={`h-1 rounded-t-full mb-3 ${styles.bar}`} />
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {STATUS_LABELS[status]}
                    </h3>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${styles.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                className={`space-y-2.5 min-h-96 rounded-xl p-2 transition-all duration-150 ${
                  isDragTarget
                    ? 'bg-blue-50 ring-2 ring-blue-300 ring-dashed'
                    : 'bg-gray-50/60'
                }`}
              >
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-150 ${
                      draggingId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                    }`}
                  >
                    <Link href={`/dashboard/task/${task.id}`}>
                      <Card className="p-3.5 hover:shadow-md transition-all cursor-grab active:cursor-grabbing border border-gray-200 hover:border-gray-300 bg-white group">
                        {/* Priority dot + title */}
                        <div className="flex items-start gap-2 mb-2.5">
                          <span
                            className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-gray-400'}`}
                          />
                          <h4 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h4>
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold capitalize border px-1.5 py-0 h-5 ${PRIORITY_COLORS[task.priority] || ''}`}
                          >
                            {task.priority}
                          </Badge>

                          <div className="flex items-center gap-2">
                            {/* Due date */}
                            {task.due_date && (
                              <div
                                className={`flex items-center gap-0.5 text-[10px] font-mono ${
                                  isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-400'
                                }`}
                              >
                                {isOverdue(task.due_date) && (
                                  <AlertTriangle className="w-3 h-3" />
                                )}
                                {!isOverdue(task.due_date) && (
                                  <Clock className="w-3 h-3" />
                                )}
                                {formatDate(task.due_date)}
                              </div>
                            )}

                            {/* Assignee Avatar */}
                            {task.assigned_to_user && (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={task.assigned_to_user.avatarUrl || ''} />
                                <AvatarFallback className="text-[9px]">
                                  {task.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>

                        {/* Comment/Checklist counts */}
                        {((task.task_comments_count ?? 0) > 0 || (task.task_checklists_count ?? 0) > 0) && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-medium">
                            {(task.task_comments_count ?? 0) > 0 && (
                              <span>💬 {task.task_comments_count}</span>
                            )}
                            {(task.task_checklists_count ?? 0) > 0 && (
                              <span>✓ {task.task_checklists_count}</span>
                            )}
                          </div>
                        )}
                      </Card>
                    </Link>
                  </div>
                ))}

                {/* Add Task Button */}
                <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-400 hover:text-gray-700 hover:bg-white/80 border border-dashed border-gray-200 hover:border-gray-300 h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Task
                  </Button>
                </CreateTaskDialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
