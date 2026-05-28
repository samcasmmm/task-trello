'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Folder, ArrowRight, Users, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import CreateTenantDialog from '@/components/create-tenant-dialog';
import api from '@/lib/axios';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  _count: { members: number; projects: number };
}

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, tenantsRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/tenants'),
        ]);
        const meData = meRes.data;
        if (meData.user) setUser(meData.user);
        setTenants(tenantsRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onTenantCreated = (t: Tenant) => setTenants((p) => [...p, t]);

  const firstName = user?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
          <p className="text-xs font-medium text-foreground-dim">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl p-6 bg-surface-2 border border-border-default">
        <div>
          <p className="text-[11px] font-semibold mb-1.5 text-foreground-dim">{greeting}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {firstName.charAt(0).toUpperCase() + firstName.slice(1)}
          </h1>
          <p className="text-sm mt-1 text-foreground-muted">
            {tenants.length > 0 ? (
              <>
                You have{' '}
                <span className="font-semibold text-foreground">
                  {tenants.length} workspace{tenants.length !== 1 ? 's' : ''}
                </span>{' '}
                active.
              </>
            ) : (
              'Create your first workspace to get started.'
            )}
          </p>
        </div>
        <div className="mt-4">
          <CreateTenantDialog onSuccess={onTenantCreated}>
            <Button className="btn-primary text-sm h-9 px-4 rounded-md">
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
          </CreateTenantDialog>
        </div>
      </div>

      {/* Workspaces grid */}
      {tenants.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-heading">Your Workspaces</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-surface-3 text-foreground-dim border border-border-subtle">
              {tenants.length} total
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <Link key={tenant.id} href={`/dashboard/tenant/${tenant.id}`} className="group block">
                <div className="relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 bg-surface-2 border border-border-subtle hover:border-border-strong">
                  {/* Top micro bar */}
                  <div className="h-px w-full bg-border-default" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 bg-surface-3 border border-border-strong text-foreground-muted">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <ArrowRight className="w-4 h-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-dim" />
                    </div>
                    <h3 className="text-sm font-bold mb-1 transition-colors text-foreground">
                      {tenant.name}
                    </h3>
                    <p className="text-xs line-clamp-2 mb-4 leading-relaxed text-foreground-muted">
                      {tenant.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-4 pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground-dim">
                        <FolderKanban className="w-3 h-3" />
                        {tenant._count.projects} projects
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground-dim">
                        <Users className="w-3 h-3" />
                        {tenant._count.members} members
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Add card */}
            <CreateTenantDialog onSuccess={onTenantCreated}>
              <div className="rounded-xl cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center h-[168px] bg-surface-2 border border-dashed border-border-default hover:border-border-strong">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform bg-surface-3 border border-border-strong">
                    <Plus className="w-4 h-4 text-foreground-muted" />
                  </div>
                  <p className="text-xs font-semibold text-foreground-dim">Add Workspace</p>
                </div>
              </div>
            </CreateTenantDialog>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center bg-surface-2 border border-dashed border-border-default">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-surface-3 border border-border-strong">
            <Folder className="w-6 h-6 text-foreground-dim" />
          </div>
          <h2 className="text-base font-bold mb-2 text-foreground">No workspaces yet</h2>
          <p className="text-sm mb-5 text-foreground-muted">
            Create your first workspace to start organizing projects and tasks.
          </p>
          <CreateTenantDialog onSuccess={onTenantCreated}>
            <Button className="btn-primary h-9 px-5 rounded-md text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </CreateTenantDialog>
        </div>
      )}
    </div>
  );
}
