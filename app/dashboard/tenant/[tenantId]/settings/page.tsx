'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import TeamMembersManager from '@/components/team-members-manager'

export default function TenantSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}`)
        if (response.ok) {
          const data = await response.json()
          setTenant(data)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching tenant:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [tenantId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Link href={`/dashboard/tenant/${tenantId}`}>
        <Button variant="ghost" className="gap-2 pl-0 hover:pl-0">
          <ChevronLeft className="w-4 h-4" />
          Back to Workspace
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="mt-2 text-gray-600">{tenant.name}</p>
      </div>

      {/* Team members manager */}
      <TeamMembersManager
        tenantId={tenantId}
        members={tenant.tenant_members || []}
      />
    </div>
  )
}
