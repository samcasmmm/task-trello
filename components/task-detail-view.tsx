'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  X,
} from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

import SubtasksSection from './subtasks-section';
import TaskAttachments from './task-attachments';

export default function TaskDetailView({
  task,
  subtasks = [],
  projectId,
}: {
  task: any;
  subtasks?: any[];
  projectId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [checklistTitle, setChecklistTitle] = useState('');
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate,
        }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      toast.success('Task updated successfully!');
      setEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      toast.success('Comment added!');
      setCommentText('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistTitle.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: checklistTitle }),
      });
      if (!response.ok) throw new Error('Failed to add checklist item');
      toast.success('Checklist item added!');
      setChecklistTitle('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add checklist item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid gap-6 lg:grid-cols-3'>
      {/* Main content */}
      <div className='lg:col-span-2 space-y-6'>
        {/* Title and status */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                {editing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className='text-2xl font-bold'
                  />
                ) : (
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {task.title}
                  </h1>
                )}
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <X className='w-4 h-4' />
                ) : (
                  <Pencil className='w-4 h-4' />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Status and Priority */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-gray-600 block mb-2'>
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-600 block mb-2'>
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className='capitalize'>{p}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className='text-sm font-medium text-gray-600 block mb-2'>
                Description
              </label>
              {editing ? (
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              ) : (
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {task.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Due date */}
            <div>
              <label className='text-sm font-medium text-gray-600 block mb-2'>
                Due Date
              </label>
              {editing ? (
                <Input
                  type='date'
                  value={formData.dueDate || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              ) : (
                <p className='text-gray-700'>
                  {task.due_date ? formatDate(task.due_date) : 'No due date'}
                </p>
              )}
            </div>

            {/* Save button */}
            {editing && (
              <div className='flex gap-2 pt-2'>
                <Button onClick={handleUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant='outline' onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subtasks */}
        {projectId && <SubtasksSection taskId={task.id} subtasks={subtasks} />}

        {/* Checklist */}
        {task.task_checklists && task.task_checklists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle2 className='w-5 h-5' />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {task.task_checklists.map((item: any) => (
                <div key={item.id} className='flex items-center gap-3'>
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => {
                      fetch(`/api/tasks/${task.id}/checklists/${item.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: checked }),
                      });
                    }}
                  />
                  <span
                    className={
                      item.completed ? 'line-through text-gray-500' : ''
                    }
                  >
                    {item.title}
                  </span>
                </div>
              ))}

              <form
                onSubmit={handleAddChecklist}
                className='flex gap-2 pt-3 border-t'
              >
                <Input
                  placeholder='Add checklist item...'
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                />
                <Button type='submit' size='sm' disabled={loading}>
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MessageCircle className='w-5 h-5' />
              Comments ({task.task_comments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Comment list */}
            {task.task_comments && task.task_comments.length > 0 && (
              <div className='space-y-4 mb-4 pb-4 border-b'>
                {task.task_comments.map((comment: any) => (
                  <div key={comment.id} className='text-sm'>
                    <div className='font-medium text-gray-900'>
                      {comment.user.fullName}
                    </div>
                    <p className='text-gray-600 text-xs mb-1'>
                      {formatDate(comment.created_at)}
                    </p>
                    <p className='text-gray-700'>{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <form onSubmit={handleAddComment} className='space-y-2'>
              <Textarea
                placeholder='Add a comment...'
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <Button type='submit' disabled={loading || !commentText.trim()}>
                {loading ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className='space-y-4'>
        {/* Task info */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Task Info</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div>
              <p className='text-gray-600 mb-1'>Status</p>
              <Badge>{STATUS_LABELS[task.status]}</Badge>
            </div>
            <div>
              <p className='text-gray-600 mb-1'>Priority</p>
              <Badge className={PRIORITY_COLORS[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            {task.assigned_to_user && (
              <div>
                <p className='text-gray-600 mb-1'>Assigned To</p>
                <p className='font-medium'>{task.assigned_to_user.fullName}</p>
              </div>
            )}
            <div>
              <p className='text-gray-600 mb-1'>Created by</p>
              <p className='font-medium'>
                {task.created_by_user?.fullName || 'Unknown'}
              </p>
            </div>
            {task.due_date && (
              <div>
                <p className='text-gray-600 mb-1'>Due Date</p>
                <p className='font-medium'>{formatDate(task.due_date)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <TaskAttachments attachments={task.task_attachments} />
      </div>
    </div>
  );
}
