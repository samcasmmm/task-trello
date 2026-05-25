import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth'
import db, {
  projects,
  tasks,
  users,
  taskComments,
  taskAttachments,
  taskChecklist,
  eq,
  and,
  desc,
  asc,
  inArray,
  sql,
  isNull,
} from '@/lib/drizzle'

/**
 * GET /api/projects/[projectId]/tasks - Get all tasks for a project
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

    const taskRows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assignedToId: tasks.assignedToId,
        createdById: tasks.createdById,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          isNull(tasks.parentTaskId),
          isNull(tasks.deletedAt)
        )
      )
      .orderBy(desc(tasks.createdAt))
      .execute()

    const taskIds = taskRows.map((task) => task.id)

    const commentsCountRows = taskIds.length
      ? await db
        .select({ taskId: taskComments.taskId, count: sql<number>`count(*)` })
        .from(taskComments)
        .where(inArray(taskComments.taskId, taskIds))
        .groupBy(taskComments.taskId)
        .execute()
      : []

    const attachmentsCountRows = taskIds.length
      ? await db
        .select({ taskId: taskAttachments.taskId, count: sql<number>`count(*)` })
        .from(taskAttachments)
        .where(inArray(taskAttachments.taskId, taskIds))
        .groupBy(taskAttachments.taskId)
        .execute()
      : []

    const subtasksCountRows = taskIds.length
      ? await db
        .select({ taskId: taskChecklist.taskId, count: sql<number>`count(*)` })
        .from(taskChecklist)
        .where(inArray(taskChecklist.taskId, taskIds))
        .groupBy(taskChecklist.taskId)
        .execute()
      : []

    const userIds = Array.from(
      new Set(
        taskRows
          .flatMap((task) => [task.assignedToId, task.createdById])
          .filter(Boolean) as string[]
      )
    )

    const usersRows = userIds.length
      ? await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(inArray(users.id, userIds))
        .execute()
      : []

    const usersById = new Map(usersRows.map((user) => [user.id, user]))

    const commentCounts = new Map(commentsCountRows.map((row) => [row.taskId, Number(row.count)]))
    const attachmentCounts = new Map(attachmentsCountRows.map((row) => [row.taskId, Number(row.count)]))
    const subtaskCounts = new Map(subtasksCountRows.map((row) => [row.taskId, Number(row.count)]))

    const responseTasks = taskRows.map((task) => ({
      ...task,
      project_id: projectId,
      due_date: task.dueDate,
      assigned_to_user: task.assignedToId
        ? {
          id: task.assignedToId,
          email: usersById.get(task.assignedToId)?.email ?? null,
          fullName: usersById.get(task.assignedToId)?.fullName ?? null,
          avatarUrl: usersById.get(task.assignedToId)?.avatarUrl ?? null,
        }
        : null,
      created_by_user: task.createdById
        ? {
          id: task.createdById,
          email: usersById.get(task.createdById)?.email ?? null,
          fullName: usersById.get(task.createdById)?.fullName ?? null,
        }
        : null,
      task_checklists_count: subtaskCounts.get(task.id) ?? 0,
      task_comments_count: commentCounts.get(task.id) ?? 0,
      task_attachments_count: attachmentCounts.get(task.id) ?? 0,
    }))

    return NextResponse.json(responseTasks)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

