'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Check, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch('/api/notifications', { id, read: true });
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--foreground)]">
            Notifications
          </h1>
          <p className="text-xs mt-1 text-[var(--foreground-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
          className="btn-ghost text-xs h-8 px-3 rounded-md flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="rounded-xl py-16 text-center bg-[var(--surface-2)] border border-[var(--border-subtle)]">
            <Bell className="w-8 h-8 mx-auto mb-3 text-[var(--foreground-dim)]" />
            <p className="text-sm font-semibold text-[var(--foreground-muted)]">
              No notifications yet
            </p>
            <p className="text-xs mt-1 text-[var(--foreground-dim)]">
              You'll see task assignments and updates here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all border ${
                n.read
                  ? 'bg-[var(--surface-2)] border-[var(--border-subtle)]'
                  : 'bg-[var(--surface-3)] border-[var(--border-default)]'
              }`}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !n.read ? 'bg-[var(--foreground-muted)]' : 'bg-[var(--border-default)]'
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium leading-relaxed ${
                    n.read ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground)]'
                  }`}
                >
                  {n.content}
                </p>
                <p className="text-[10px] mt-1 font-mono text-[var(--foreground-dim)]">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>

              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all border bg-[var(--surface-1)] text-foreground-dim border-border-default hover:text-foreground hover:border-[var(--border-strong)]"
                >
                  <Check className="w-3 h-3" />
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
