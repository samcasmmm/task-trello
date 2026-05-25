'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import CreateTaskDialog from './create-task-dialog';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface SubtaskProps {
  task: any;
  level: number;
  onStatusChange?: (taskId: string, status: string) => void;
}

function SubtaskItem({ task, level, onStatusChange }: SubtaskProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const hasSubtasks = task.children && task.children.length > 0;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        onStatusChange?.(task.id, newStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 1.5}rem` }} className='space-y-2'>
      <div className='flex items-start gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
        {/* Expand button */}
        {hasSubtasks ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex-shrink-0 mt-1'
          >
            {isExpanded ? (
              <ChevronDown className='w-4 h-4 text-gray-600' />
            ) : (
              <ChevronRight className='w-4 h-4 text-gray-600' />
            )}
          </button>
        ) : (
          <div className='flex-shrink-0 w-4' />
        )}

        {/* Subtask content */}
        <Link href={`/dashboard/task/${task.id}`} className='flex-1 min-w-0'>
          <div className='space-y-1'>
            <h4 className='font-medium text-gray-900 text-sm hover:text-blue-600 truncate'>
              {task.title}
            </h4>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge
                variant='outline'
                className={`text-xs capitalize ${STATUS_COLORS[task.status]}`}
              >
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge
                variant='outline'
                className={`text-xs capitalize ${PRIORITY_COLORS[task.priority]}`}
              >
                {task.priority}
              </Badge>
              {task.due_date && (
                <span className='text-xs text-gray-600'>
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.assigned_to_user && (
                <span className='text-xs text-gray-600'>
                  @{task.assigned_to_user.fullName}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className='space-y-2'>
          {task.children.map((subtask: any) => (
            <SubtaskItem
              key={subtask.id}
              task={subtask}
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
}: {
  taskId: string;
  subtasks: any[];
}) {
  const [tasks, setTasks] = useState(subtasks);

  // Organize subtasks into a tree structure
  const buildTaskTree = (flatTasks: any[]) => {
    const map: Record<string, any> = {};
    const roots: any[] = [];

    // Create map of all tasks
    flatTasks.forEach((task) => {
      map[task.id] = { ...task, children: [] };
    });

    // Build tree
    flatTasks.forEach((task) => {
      if (task.parent_task_id === taskId) {
        roots.push(map[task.id]);
      } else if (task.parent_task_id && map[task.parent_task_id]) {
        map[task.parent_task_id].children.push(map[task.id]);
      }
    });

    return roots;
  };

  const rootSubtasks = buildTaskTree(tasks);
  const completedCount = tasks.filter((t) => t.status === 'done').length;

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Subtasks</CardTitle>
        </CardHeader>
        <CardContent className='text-center py-6'>
          <p className='text-gray-600 text-sm mb-4'>No subtasks yet</p>
          <CreateTaskDialog projectId={''} parentTaskId={taskId}>
            <Button size='sm' variant='outline'>
              <Plus className='w-4 h-4 mr-2' />
              Add Subtask
            </Button>
          </CreateTaskDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base'>
            Subtasks ({completedCount}/{tasks.length})
          </CardTitle>
          <CreateTaskDialog projectId={''} parentTaskId={taskId}>
            <Button size='sm' variant='outline'>
              <Plus className='w-4 h-4 mr-2' />
              Add
            </Button>
          </CreateTaskDialog>
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {rootSubtasks.map((subtask) => (
          <SubtaskItem key={subtask.id} task={subtask} level={0} />
        ))}
      </CardContent>
    </Card>
  );
}
