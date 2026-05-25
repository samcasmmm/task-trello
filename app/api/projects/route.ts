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

    const [project] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || 'folder',
        createdById: authContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

