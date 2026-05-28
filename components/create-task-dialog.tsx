'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import WysiwygEditor from './wysiwyg-editor';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

interface CreateTaskDialogProps {
  projectId?: string;
  parentTaskId?: string;
  children: React.ReactNode;
  onSuccess?: (task: any) => void;
}

export default function CreateTaskDialog({
  projectId,
  parentTaskId,
  children,
  onSuccess,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          parentTaskId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          estimatedHours: formData.estimatedHours || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const task = await response.json();
      toast.success('Task created successfully!');
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        startDate: '',
        dueDate: '',
        estimatedHours: '',
      });
      onSuccess?.(task);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-md bg-slate-900 border border-slate-800 text-slate-100 shadow-none rounded'>
        <DialogHeader className='space-y-1.5'>
          <DialogTitle className='text-lg font-bold text-slate-100 tracking-tight'>
            {parentTaskId ? 'Create Subtask' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className='text-xs text-slate-400'>
            {parentTaskId
              ? 'Add a subtask to organize your work'
              : 'Add a new task to your project'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div>
            <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
              Task Title
            </label>
            <Input
              required
              placeholder='e.g., Design homepage mockup'
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className='field-input h-9 text-xs rounded-md placeholder:opacity-30'
            />
          </div>

          <div>
            <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
              Description
            </label>
            <WysiwygEditor
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder='Add more details about this task...'
              minHeight='100px'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger className='bg-slate-950/80 border-slate-800 focus:ring-slate-700 text-xs h-9 text-slate-200 rounded-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-slate-900 border-slate-800 text-slate-100 rounded-sm shadow-none'>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className='text-xs capitalize hover:bg-slate-800'>
                      <span className='capitalize'>{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                Estimate Hours
              </label>
              <Input
                type='number'
                placeholder='e.g., 40'
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedHours: e.target.value })
                }
                className='bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-200 h-9 text-xs rounded-sm placeholder:text-slate-600'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                Start Date
              </label>
              <Input
                type='date'
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className='bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-200 h-9 text-xs rounded-sm placeholder:text-slate-600'
              />
            </div>

            <div>
              <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                Due Date / End
              </label>
              <Input
                type='date'
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className='bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-200 h-9 text-xs rounded-sm placeholder:text-slate-600'
              />
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-3 border-t border-slate-800 mt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='btn-ghost text-xs h-9 rounded-md'
            >
              Cancel
            </Button>
            <Button 
              type='submit' 
              disabled={loading} 
              className='btn-primary text-xs h-9 rounded-md font-bold'
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
