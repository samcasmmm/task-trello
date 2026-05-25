import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess, verifyTenantRole } from '@/lib/api-auth'
import db, { projects, tasks, customFields, eq, sql } from '@/lib/drizzle'

/**
 * GET /api/projects/[projectId] - Get project details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { projectId } = await params

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [taskCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .execute()

    const [customFieldCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customFields)
      .where(eq(customFields.projectId, projectId))
      .execute()

    return NextResponse.json({
      ...project,
      _count: {
        tasks: Number(taskCountRow?.count ?? 0),
        customFields: Number(customFieldCountRow?.count ?? 0),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * PATCH /api/projects/[projectId] - Update project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { projectId } = await params

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isAdmin = await verifyTenantRole(authContext.userId, project.tenantId, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, icon, status } = body

    const [updated] = await db
      .update(projects)
      .set({
        name,
        description,
        color,
        icon,
        status,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning()

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/projects/[projectId] - Delete project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { projectId } = await params

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isAdmin = await verifyTenantRole(authContext.userId, project.tenantId, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.delete(projects).where(eq(projects.id, projectId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

