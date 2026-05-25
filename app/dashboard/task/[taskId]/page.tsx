'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import TaskDetailView from '@/components/task-detail-view';

export default function TaskPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setTask(data);
        }
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent' />
          </div>
          <p className='text-sm text-muted-foreground'>Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-2xl font-bold text-gray-900'>Task not found</h1>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <Link href={`/dashboard/project/${task.project_id}`}>
        <Button variant='ghost' className='gap-2 pl-0 hover:pl-0'>
          <ChevronLeft className='w-4 h-4' />
          Back to Project
        </Button>
      </Link>

      {/* Task detail view */}
      <TaskDetailView task={task} projectId={task.project_id} />
    </div>
  );
}
