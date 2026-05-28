'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me')
        const data = response.data

        if (data.user) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </main>
  )
}
