import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { projects, tasks, taskComments, users, eq } from '@/lib/drizzle';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notification';

/**
 * POST /api/tasks/[taskId]/comments - Add comment to task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { taskId } = await params;

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.projectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [comment] = await db
      .insert(taskComments)
      .values({
        id: crypto.randomUUID(),
        taskId,
        userId: authContext.userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const [user] = await db.query.users.findMany({
      where: eq(users.id, authContext.userId),
    });

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'comment_added', {
      taskId,
      commentId: comment.id,
      contentLength: content.length,
    });

    // Trigger Notification for task assignee (if it's not the commenter themselves)
    if (task.assignedToId && task.assignedToId !== authContext.userId) {
      await createNotification(
        task.assignedToId,
        `${user?.fullName || authContext.email} commented on "${task.title}".`,
      );
    }

    return NextResponse.json(
      {
        ...comment,
        user: user
          ? {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl,
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
