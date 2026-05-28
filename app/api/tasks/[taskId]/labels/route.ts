import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { tasks, taskLabels, labels, projects, eq, and } from '@/lib/drizzle';

/**
 * GET /api/tasks/[taskId]/labels - Get labels assigned to task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    await requireAuth();
    const { taskId } = await params;

    const rows = await db
      .select({
        id: taskLabels.id,
        labelId: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(taskLabels)
      .leftJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, taskId))
      .execute();

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[taskId]/labels - Assign a label to task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { taskId } = await params;

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(projects.id, task.projectId) });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { labelId } = await request.json();
    if (!labelId) return NextResponse.json({ error: 'labelId required' }, { status: 400 });

    // Avoid duplicates
    const existing = await db.query.taskLabels.findFirst({
      where: and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)),
    });
    if (existing) return NextResponse.json(existing);

    const [result] = await db
      .insert(taskLabels)
      .values({ id: crypto.randomUUID(), taskId, labelId, createdAt: new Date() })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[taskId]/labels - Remove a label from task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { taskId } = await params;

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(projects.id, task.projectId) });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { labelId } = await request.json();
    if (!labelId) return NextResponse.json({ error: 'labelId required' }, { status: 400 });

    await db
      .delete(taskLabels)
      .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
