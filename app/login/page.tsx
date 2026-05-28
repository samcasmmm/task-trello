'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Login failed')
      }
      toast.success('Logged in successfully')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4' style={{ background: 'var(--background)' }}>
      {/* Subtle grid overlay */}
      <div className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

      <div className='relative w-full max-w-sm'>
        {/* Logo */}
        <div className='flex flex-col items-center mb-8'>
          <div className='w-12 h-12 rounded-2xl flex items-center justify-center mb-4'
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }}>
            <Zap className='w-6 h-6' style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <h1 className='text-2xl font-black tracking-tight' style={{ color: 'var(--foreground)' }}>
            TaskEngine
          </h1>
          <p className='text-sm mt-1.5' style={{ color: 'var(--foreground-muted)' }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div className='rounded-2xl p-6'
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1.5'>
              <label className='field-label block'>Email Address</label>
              <Input
                type='email'
                placeholder='name@company.com'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className='field-input h-10 text-sm placeholder:text-[var(--foreground-dim)]'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='field-label block'>Password</label>
              <Input
                type='password'
                placeholder='••••••••'
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
                className='field-input h-10 text-sm placeholder:text-[var(--foreground-dim)]'
              />
            </div>

            <Button
              type='submit'
              className='w-full h-10 text-sm btn-primary rounded-md mt-2'
              disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className='text-center text-xs mt-5 pt-5' style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--foreground-dim)' }}>
            Don&apos;t have an account?{' '}
            <Link href='/register'
              className='font-semibold transition-colors'
              style={{ color: 'var(--foreground-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
