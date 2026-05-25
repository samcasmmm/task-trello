import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth'
import db, { tasks, taskChecklist, projects, eq } from '@/lib/drizzle'

/**
 * PATCH /api/tasks/[taskId]/checklists/[checklistId] - Toggle or update checklist item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; checklistId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { taskId, checklistId } = await params

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const project = await db.query.projects.findFirst({ where: eq(projects.id, task.projectId) })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { completed, title } = body

    const updateData: any = { updatedAt: new Date() }
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title

    const [updated] = await db
      .update(taskChecklist)
      .set(updateData)
      .where(eq(taskChecklist.id, checklistId))
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
 * DELETE /api/tasks/[taskId]/checklists/[checklistId] - Delete checklist item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; checklistId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { taskId, checklistId } = await params

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const project = await db.query.projects.findFirst({ where: eq(projects.id, task.projectId) })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.delete(taskChecklist).where(eq(taskChecklist.id, checklistId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
