import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantRole } from '@/lib/api-auth'
import db, { projects, eq } from '@/lib/drizzle'

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth()
    const body = await request.json()

    const { tenantId, name, description, color, icon } = body

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'Tenant ID and name are required' },
        { status: 400 }
      )
    }

    const isAdmin = await verifyTenantRole(authContext.userId, tenantId, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || 'folder',
        createdById: authContext.userId,
      })
      .returning()

    const project = results[0]
    if (!project) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

