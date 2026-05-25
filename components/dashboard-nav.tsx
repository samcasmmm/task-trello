'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, LogOut, Settings, Plus, Folder, Bell } from 'lucide-react';

export default function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const notifications = await response.json();
          setNotificationsCount(
            notifications.filter((item: any) => item.read === false).length,
          );
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (response.ok) {
          const tenantList = await response.json();
          setTenants(tenantList);
          if (tenantList.length > 0) {
            setCurrentTenant(tenantList[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load tenants:', error);
      }
    };

    loadTenants();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className='hidden max-md:block md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50'>
        <div className='flex items-center justify-between h-full px-4'>
          <div className='flex items-center gap-2'>
            <h1 className='font-semibold text-lg'>Task Manager</h1>
            {notificationsCount > 0 && (
              <span className='rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white'>
                {notificationsCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100'
          >
            {isOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static md:w-64 h-full bg-white border-r transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='p-6 border-b hidden md:block'>
            <div className='flex items-center justify-between gap-3'>
              <h1 className='text-xl font-bold text-gray-900'>Task Manager</h1>
              <Button
                variant='ghost'
                className='group text-gray-600 hover:text-gray-900'
              >
                <Bell className='w-4 h-4' />
                {notificationsCount > 0 && (
                  <span className='ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white'>
                    {notificationsCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Tenant selector */}
          {tenants.length > 0 && (
            <div className='p-4 border-b'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='w-full justify-between'>
                    <span className='truncate'>
                      {currentTenant?.name || 'Select Tenant'}
                    </span>
                    <Folder className='w-4 h-4 ml-2' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56'>
                  {tenants.map((tenant) => (
                    <DropdownMenuItem
                      key={tenant.id}
                      onClick={() => {
                        setCurrentTenant(tenant);
                        setIsOpen(false);
                        router.push(`/dashboard/tenant/${tenant.id}`);
                      }}
                    >
                      {tenant.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Navigation Links */}
          <nav className='flex-1 p-4 space-y-2'>
            <Link
              href='/dashboard'
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Overview
            </Link>

            <Link
              href='/dashboard/notifications'
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard/notifications'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bell className='w-4 h-4 mr-3' />
              Notifications
            </Link>

            {currentTenant && (
              <Link
                href={`/dashboard/tenant/${currentTenant.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  pathname.includes(currentTenant.id)
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Folder className='w-4 h-4 mr-3' />
                Projects
              </Link>
            )}

            {user?.isSuperAdmin && (
              <Link
                href='/dashboard/admin'
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/dashboard/admin'
                    ? 'bg-red-50 text-red-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className='w-4 h-4 mr-3 inline-flex items-center justify-center font-bold text-xs bg-red-100 text-red-600 rounded'>
                  A
                </span>
                Admin Panel
              </Link>
            )}

            <div className='pt-4 mt-4 border-t'>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => setIsOpen(false)}
              >
                <Plus className='w-4 h-4 mr-2' />
                New Project
              </Button>
            </div>
          </nav>

          {/* User Menu */}
          <div className='p-4 border-t space-y-2'>
            {user && (
              <div className='px-2 py-1 text-sm truncate'>
                <p className='text-gray-500 text-xs'>Signed in as</p>
                <p className='font-medium text-gray-900 truncate'>
                  {user.email}
                </p>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='w-full justify-start'>
                  <Settings className='w-4 h-4 mr-2' />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56'>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-30 md:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
