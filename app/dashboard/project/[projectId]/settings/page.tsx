'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import CustomFieldsManager from '@/components/custom-fields-manager';
import api from '@/lib/axios';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/api/projects/${projectId}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href={`/dashboard/project/${projectId}`}>
        <Button variant="ghost" className="gap-2 pl-0 hover:pl-0">
          <ChevronLeft className="w-4 h-4" />
          Back to Project
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Settings</h1>
        <p className="mt-2 text-gray-600">{project.name}</p>
      </div>

      {/* Custom fields manager */}
      <CustomFieldsManager projectId={projectId} customFields={project.custom_fields || []} />
    </div>
  );
}
