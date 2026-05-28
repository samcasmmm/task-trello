'use client';

import { LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTaskDialog from '@/components/create-task-dialog';

interface ProjectEmptyStateProps {
  projectId: string;
  onTaskCreated: (t: any) => void;
}

export default function ProjectEmptyState({ projectId, onTaskCreated }: ProjectEmptyStateProps) {
  return (
    <div className="rounded-lg py-20 text-center bg-[var(--surface-2)] border border-dashed border-[var(--border-default)]">
      <div className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center bg-[var(--surface-3)] border border-[var(--border-strong)]">
        <LayoutGrid className="w-6 h-6 text-[var(--foreground-dim)]" />
      </div>
      <h3 className="text-sm font-bold mb-2 text-[var(--foreground)]">No tasks yet</h3>
      <p className="text-xs mb-5 text-[var(--foreground-muted)]">
        Create your first task to start building your project workflow.
      </p>
      <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
        <Button className="btn-primary h-9 px-5 rounded-md text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Create First Task
        </Button>
      </CreateTaskDialog>
    </div>
  );
}
