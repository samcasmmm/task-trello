'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  FolderKanban,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import AppLogo from './app-logo';
import api from '@/lib/axios';

export default function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [tenantOpen, setTenantOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((res) => {
        const d = res.data;
        if (d.user) setUser(d.user);
      })
      .catch(() => {});

    api
      .get('/api/notifications')
      .then((res) => {
        const d = res.data;
        setNotificationsCount(Array.isArray(d) ? d.filter((n: any) => !n.read).length : 0);
      })
      .catch(() => {});

    api
      .get('/api/tenants')
      .then((res) => {
        const d = res.data;
        if (Array.isArray(d)) {
          setTenants(d);
          if (d.length > 0) setCurrentTenant(d[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await api.post('/api/auth/logout');
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href;
  const isTenantActive = (id: string) => pathname.includes(id);

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 bg-surface-1 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-surface-3 border border-border-default">
            <Zap className="w-3.5 h-3.5 text-foreground-muted" />
          </div>
          <span className="text-sm font-bold text-foreground">
            <AppLogo />
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded transition-colors text-foreground-muted hover:text-foreground"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static md:flex md:flex-col h-full w-[216px] z-40 flex flex-col transition-transform duration-300 bg-surface-1 border-r border-border-subtle ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-[14px] border-b border-border-subtle">
          <div className="flex-1 min-w-0">
            <AppLogo />
          </div>
          {notificationsCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-surface-3 text-foreground-muted border border-border-strong">
              {notificationsCount}
            </span>
          )}
        </div>

        {/* Workspace switcher */}
        {tenants.length > 0 && (
          <div className="px-3 py-3 border-b border-border-subtle">
            <p className="section-heading mb-2 px-1">Workspace</p>
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-colors border text-foreground bg-surface-2 data-[open=true]:bg-surface-3 border-border-default"
                data-open={tenantOpen}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0 bg-surface-3 border border-border-strong text-foreground-muted">
                  {currentTenant?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold flex-1 truncate text-foreground">
                  {currentTenant?.name || 'Select'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 shrink-0 transition-transform text-foreground-dim ${tenantOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {tenantOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-md overflow-hidden z-50 bg-surface-2 border border-border-default [box-shadow:0_8px_32px_rgba(0,0,0,0.6)]">
                  {tenants.map((t) => {
                    const isSelected = currentTenant?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setCurrentTenant(t);
                          setTenantOpen(false);
                          setIsOpen(false);
                          router.push(`/dashboard/tenant/${t.id}`);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface-3 ${
                          isSelected ? 'text-foreground' : 'text-foreground-muted'
                        }`}
                      >
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold shrink-0 bg-surface-3 border border-border-strong text-foreground-dim">
                          {t.name?.charAt(0)}
                        </div>
                        <span className="truncate font-medium">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <NavItem
            href="/dashboard"
            label="Overview"
            Icon={LayoutDashboard}
            active={isActive('/dashboard')}
            onClick={() => setIsOpen(false)}
          />
          <NavItem
            href="/dashboard/notifications"
            label="Notifications"
            Icon={Bell}
            active={isActive('/dashboard/notifications')}
            onClick={() => setIsOpen(false)}
            badge={notificationsCount}
          />
          {currentTenant && (
            <NavItem
              href={`/dashboard/tenant/${currentTenant.id}`}
              label="Projects"
              Icon={FolderKanban}
              active={isTenantActive(currentTenant.id)}
              onClick={() => setIsOpen(false)}
            />
          )}
          {user?.isSuperAdmin && (
            <NavItem
              href="/dashboard/admin"
              label="Admin Panel"
              Icon={ShieldAlert}
              active={isActive('/dashboard/admin')}
              onClick={() => setIsOpen(false)}
              danger
            />
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-2 space-y-1 border-t border-border-subtle">
          {user && (
            <div className="px-2.5 py-2 mb-2 rounded-md bg-surface-2 border border-border-subtle">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 field-label">
                Signed in as
              </p>
              <p className="text-xs font-semibold truncate text-foreground">{user.email}</p>
              {user.isSuperAdmin && (
                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.25)]">
                  <ShieldAlert className="w-2.5 h-2.5" /> Super Admin
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-xs font-medium transition-colors text-foreground-dim hover:bg-[rgba(220,38,38,0.08)] hover:text-[#f87171]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
  onClick,
  badge,
  danger,
}: {
  href: string;
  label: string;
  Icon: any;
  active: boolean;
  onClick?: () => void;
  badge?: number;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-xs font-medium transition-all border-l-2 ${
        active
          ? danger
            ? 'bg-[rgba(239,68,68,0.08)] text-[#f87171] border-[#dc2626]'
            : 'bg-surface-3 text-foreground border-[rgba(255,255,255,0.3)]'
          : 'bg-transparent text-foreground-muted border-transparent hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-hover text-foreground-muted border border-border-strong">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
