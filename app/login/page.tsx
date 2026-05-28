'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

import AppLogo from '@/components/app-logo';

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('Logged in successfully');

      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Login failed';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background'>
      {/* Grid Overlay */}
      <div className='absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[48px_48px]' />

      <div className='relative w-full max-w-sm'>
        {/* Logo */}
        <div className='flex flex-col items-center mb-8'>
          <div className='w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-surface-3 border border-border-strong'>
            <Zap className='w-6 h-6 text-foreground-muted' />
          </div>

          <h1 className='text-2xl font-black tracking-tight text-foreground'>
            <AppLogo />
          </h1>

          <p className='text-sm mt-1.5 text-foreground-muted'>
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div className='rounded-2xl p-6 bg-surface-2 border border-border-default'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email */}
            <div className='space-y-1.5'>
              <label className='field-label block'>Email Address</label>

              <Input
                type='email'
                placeholder='name@company.com'
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                required
                className='field-input h-10 text-sm placeholder:text-foreground-dim'
              />
            </div>

            {/* Password */}
            <div className='space-y-1.5'>
              <label className='field-label block'>Password</label>

              <Input
                type='password'
                placeholder='••••••••'
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                required
                className='field-input h-10 text-sm placeholder:text-foreground-dim'
              />
            </div>

            {/* Submit */}
            <Button
              type='submit'
              disabled={loading}
              className='w-full h-10 text-sm btn-primary rounded-md mt-2'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <p className='text-center text-xs mt-5 pt-5 border-t border-border-subtle text-foreground-dim'>
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='font-semibold transition-colors text-foreground-muted hover:text-foreground'
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
