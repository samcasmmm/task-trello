'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import TaskDetailView from '@/components/task-detail-view';
import api from '@/lib/axios';

export default function TaskPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await api.get(`/api/tasks/${taskId}`);
        setTask(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
          <p className="text-[11px] text-foreground-dim">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-foreground-muted">Task not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/dashboard/project/${task.project_id}`}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 px-0 text-xs font-medium transition-colors bg-transparent text-foreground-dim hover:text-foreground"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Project
        </Button>
      </Link>
      <TaskDetailView task={task} projectId={task.project_id} />
    </div>
  );
}
