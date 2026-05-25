'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderPlus } from 'lucide-react'
import Link from 'next/link'
import CreateTenantDialog from '@/components/create-tenant-dialog'

interface Tenant {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  _count: {
    members: number
    projects: number
  }
}

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meResponse = await fetch('/api/auth/me')
        const meData = await meResponse.json()
        
        if (meData.user?.email) {
          setUserEmail(meData.user.email)
        }

        const response = await fetch('/api/tenants')
        if (!response.ok) throw new Error('Failed to fetch tenants')
        const data = await response.json()
        setTenants(data)
      } catch (error) {
        console.error('Error fetching tenants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const onTenantCreated = (newTenant: Tenant) => {
    setTenants([...tenants, newTenant])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{userEmail ? `, ${userEmail.split('@')[0]}` : ''}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your projects and tasks efficiently
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <CreateTenantDialog onSuccess={onTenantCreated}>
          <Button>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Workspace
          </Button>
        </CreateTenantDialog>
      </div>

      {/* Tenants overview */}
      {tenants && tenants.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Workspaces</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/dashboard/tenant/${tenant.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tenant.name}</span>
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {tenant._count.projects} projects
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {tenant.description || 'No description'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-10 text-center">
            <FolderPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create a new workspace to get started with managing your projects
            </p>
            <CreateTenantDialog onSuccess={onTenantCreated}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </Button>
            </CreateTenantDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
