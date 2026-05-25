import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth'
import db, {
  tasks,
  projects,
  users,
  taskComments,
  taskChecklist,
  taskAttachments,
  customFields,
  taskCustomFieldValues,
  eq,
  and,
  desc,
  asc,
  isNull,
} from '@/lib/drizzle'

/**
 * GET /api/tasks/[taskId] - Get task details with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { taskId } = await params

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    })

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [assignedTo] = task.assignedToId
      ? await db.query.users.findMany({
        where: eq(users.id, task.assignedToId),
      })
      : [null]

    const [createdBy] = await db.query.users.findMany({
      where: eq(users.id, task.createdById),
    })

    const commentRows = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt))
      .execute()

    const comments = commentRows.map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      user: {
        id: row.userId,
        email: row.email,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
      },
    }))

    const checklists = await db
      .select()
      .from(taskChecklist)
      .where(eq(taskChecklist.taskId, taskId))
      .orderBy(asc(taskChecklist.orderIndex))
      .execute()

    const attachmentRows = await db
      .select({
        id: taskAttachments.id,
        filename: taskAttachments.filename,
        fileSize: taskAttachments.fileSize,
        fileType: taskAttachments.fileType,
        storagePath: taskAttachments.storagePath,
        createdAt: taskAttachments.createdAt,
        uploadedById: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(taskAttachments)
      .leftJoin(users, eq(taskAttachments.uploadedById, users.id))
      .where(eq(taskAttachments.taskId, taskId))
      .execute()

    const attachments = attachmentRows.map((row) => ({
      id: row.id,
      filename: row.filename,
      fileSize: row.fileSize,
      fileType: row.fileType,
      storagePath: row.storagePath,
      createdAt: row.createdAt,
      uploadedBy: {
        id: row.uploadedById,
        email: row.email,
        fullName: row.fullName,
      },
    }))

    const customFieldRows = await db
      .select({
        id: taskCustomFieldValues.id,
        value: taskCustomFieldValues.value,
        customFieldId: customFields.id,
        fieldName: customFields.name,
        fieldType: customFields.fieldType,
        fieldOptions: customFields.options,
      })
      .from(taskCustomFieldValues)
      .leftJoin(customFields, eq(taskCustomFieldValues.customFieldId, customFields.id))
      .where(eq(taskCustomFieldValues.taskId, taskId))
      .execute()

    const customFieldValues = customFieldRows.map((row) => ({
      id: row.id,
      value: row.value,
      customField: {
        id: row.customFieldId,
        name: row.fieldName,
        fieldType: row.fieldType,
        options: row.fieldOptions,
      },
    }))

    const subtaskRows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        assignedToId: tasks.assignedToId,
        createdById: tasks.createdById,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(
        and(
          eq(tasks.parentTaskId, taskId),
          isNull(tasks.deletedAt)
        )
      )
      .execute()

    const subtasks = subtaskRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assignedTo: row.assignedToId
        ? {
          id: row.userId,
          email: row.email,
          fullName: row.fullName,
        }
        : null,
    }))

    return NextResponse.json({
      ...task,
      project_id: task.projectId,
      assignedTo: assignedTo
        ? {
          id: assignedTo.id,
          email: assignedTo.email,
          fullName: assignedTo.fullName,
          avatarUrl: assignedTo.avatarUrl,
        }
        : null,
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
      task_comments: comments,
      task_checklists: checklists,
      task_attachments: attachments,
      task_custom_field_values: customFieldValues,
      subtasks,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[taskId] - Update task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { taskId } = await params

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    })

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, status, priority, assignedToId, dueDate } = body

    const [updated] = await db
      .update(tasks)
      .set({
        title,
        description,
        status,
        priority,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning()

    const assignedTo = updated.assignedToId
      ? await db.query.users.findFirst({
        where: eq(users.id, updated.assignedToId),
      })
      : null

    return NextResponse.json({
      ...updated,
      assignedTo: assignedTo
        ? {
          id: assignedTo.id,
          email: assignedTo.email,
          fullName: assignedTo.fullName,
        }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[taskId] - Soft delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { taskId } = await params

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    })

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, taskId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

