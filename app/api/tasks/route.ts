import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth'
import db, { projects, tasks, users, eq } from '@/lib/drizzle'

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth()
    const body = await request.json()

    const { projectId, title, description, status, priority, assignedToId, dueDate, parentTaskId } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [task] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        projectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        parentTaskId: parentTaskId || null,
        createdById: authContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    const assignedTo = assignedToId
      ? await db.query.users.findFirst({
        where: eq(users.id, assignedToId),
      })
      : null

    const createdBy = await db.query.users.findFirst({
      where: eq(users.id, authContext.userId),
    })

    return NextResponse.json(
      {
        ...task,
        project_id: task.projectId,
        due_date: task.dueDate,
        assigned_to_user: assignedTo
          ? {
            id: assignedTo.id,
            email: assignedTo.email,
            fullName: assignedTo.fullName,
            avatarUrl: assignedTo.avatarUrl,
          }
          : null,
        created_by_user: createdBy
          ? {
            id: createdBy.id,
            email: createdBy.email,
            fullName: createdBy.fullName,
          }
          : null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

