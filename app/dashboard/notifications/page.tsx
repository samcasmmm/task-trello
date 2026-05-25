'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    } catch (error) {
      console.error('Unable to mark notification read', error);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2 text-blue-600'>
            <Bell className='w-5 h-5' />
            <h1 className='text-2xl font-semibold'>Notifications</h1>
          </div>
          <p className='text-gray-600 mt-2'>
            Stay on top of task assignments, due date alerts, and team activity.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>
            {notifications.filter((item) => !item.read).length} unread
          </Badge>
          <Button onClick={fetchNotifications} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className='space-y-4'>
        {notifications.length === 0 ? (
          <Card>
            <CardContent className='py-20 text-center text-gray-500'>
              No notifications yet.
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={
                notification.read
                  ? 'border border-gray-200'
                  : 'border border-blue-200 bg-blue-50'
              }
            >
              <CardHeader>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-blue-600' />
                    <CardTitle className='text-base font-semibold'>
                      {notification.read ? 'Read' : 'Unread'}
                    </CardTitle>
                  </div>
                  {!notification.read && (
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => markRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-gray-700 mb-3'>
                  {notification.content}
                </div>
                <div className='text-xs text-gray-500'>
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
