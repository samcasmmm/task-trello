'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckSquare } from 'lucide-react';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/auth/register', formData);

      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Sleek abstract blur glow backdrops */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Decorative center grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <Card className="w-full max-w-md border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 text-white">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Sign up to build your team workspaces and manage projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-100 h-10 text-sm placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-100 h-10 text-sm placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-slate-950/80 border-slate-800 focus-visible:ring-indigo-500/50 text-slate-100 h-10 text-sm placeholder:text-slate-600"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-blue-500/10 border-none mt-2"
              disabled={loading}
            >
              {loading ? 'Registering Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
