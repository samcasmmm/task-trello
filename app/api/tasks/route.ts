import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { projects, tasks, users, eq } from '@/lib/drizzle';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notification';

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth();
    const body = await request.json();

    const {
      projectId,
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      parentTaskId,
    } = body;

    let finalProjectId = projectId;
    let finalAssignedToId = assignedToId || null;

    if (parentTaskId) {
      const parentTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, parentTaskId),
      });
      if (parentTask) {
        if (!finalProjectId) {
          finalProjectId = parentTask.projectId;
        }
        if (!finalAssignedToId) {
          finalAssignedToId = parentTask.assignedToId;
        }
      }
    }

    if (!finalProjectId || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, finalProjectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        projectId: finalProjectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        assignedToId: finalAssignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours: estimatedHours ? String(estimatedHours) : null,
        actualHours: actualHours ? String(actualHours) : null,
        parentTaskId: parentTaskId || null,
        createdById: authContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'task_created', {
      taskId: task.id,
      title: task.title,
      projectId: task.projectId,
    });

    // Trigger Notification for Assignee
    if (task.assignedToId) {
      await createNotification(
        task.assignedToId,
        `You have been assigned a new task: "${task.title}" in project "${project.name}".`,
      );
    }

    const assignedTo = assignedToId
      ? await db.query.users.findFirst({
          where: eq(users.id, assignedToId),
        })
      : null;

    const createdBy = await db.query.users.findFirst({
      where: eq(users.id, authContext.userId),
    });

    return NextResponse.json(
      {
        ...task,
        tenantId: project.tenantId,
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
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
