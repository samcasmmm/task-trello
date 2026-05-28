'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        const data = response.data;

        if (data.user) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-dvh bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border border-white/10 border-t-white/40 animate-spin" />
        <p className="text-[11px] text-foreground-dim">Loading...</p>
      </div>
    </main>
  );
}
