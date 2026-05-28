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
      <div className="flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
          <p className="text-[11px] text-foreground-dim">Loading project...</p>
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
        <h1 className="text-3xl font-bold text-white">Project Settings</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
            Project:
          </span>
          <p className="text-white bg-white/20 max-w-fit px-3 py-1 rounded-md font-semibold tracking-tight text-xs">
            {project.name}
          </p>
        </div>
      </div>

      {/* Custom fields manager */}
      <CustomFieldsManager projectId={projectId} customFields={project.custom_fields || []} />
    </div>
  );
}
