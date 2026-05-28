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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface CreateTenantDialogProps {
  children: React.ReactNode;
  onSuccess?: (tenant: any) => void;
}

export default function CreateTenantDialog({ children, onSuccess }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/tenants', formData);

      const tenant = response.data;
      toast.success('Workspace created successfully!');
      setOpen(false);
      setFormData({ name: '', slug: '', description: '' });
      onSuccess?.(tenant);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to create workspace';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your projects and teams
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Workspace Name</label>
            <Input
              required
              placeholder="e.g., My Company"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Slug</label>
            <Input
              required
              placeholder="e.g., my-company"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">URL-friendly identifier for your workspace</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description (optional)
            </label>
            <Textarea
              placeholder="Describe your workspace..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
