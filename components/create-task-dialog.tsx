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
import api from '@/lib/axios';

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
      const response = await api.post('/api/tasks', {
        projectId,
        parentTaskId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours || null,
      });

      const task = response.data;
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
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-surface-2 border border-border-default text-foreground shadow-none rounded-xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
            {parentTaskId ? 'Create Subtask' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground-muted">
            {parentTaskId
              ? 'Add a subtask to organize your work'
              : 'Add a new task to your project'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
              Task Title
            </label>
            <Input
              required
              placeholder="e.g., Design homepage mockup"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="field-input h-9 text-xs rounded-md placeholder:text-foreground-dim/30 border-border-default focus-visible:ring-border-strong"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
              Description
            </label>
            <WysiwygEditor
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Add more details about this task..."
              minHeight="100px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-surface-3 border-border-default focus:ring-border-strong text-xs h-9 text-foreground-muted rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border border-border-default text-foreground rounded-md shadow-none">
                  {PRIORITIES.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="text-xs capitalize focus:bg-surface-3 focus:text-foreground"
                    >
                      <span className="capitalize">{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
                Estimate Hours
              </label>
              <Input
                type="number"
                placeholder="e.g., 40"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="bg-surface-3 border-border-default focus-visible:ring-border-strong text-foreground h-9 text-xs rounded-md placeholder:text-foreground-dim/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-surface-3 border-border-default focus-visible:ring-border-strong text-foreground h-9 text-xs rounded-md select-none accent-border-strong"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground-dim mb-1">
                Due Date / End
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-surface-3 border-border-default focus-visible:ring-border-strong text-foreground h-9 text-xs rounded-md select-none accent-border-strong"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="btn-ghost text-xs h-9 rounded-md text-foreground-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs h-9 rounded-md font-bold"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
