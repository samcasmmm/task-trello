import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { tasks, taskCustomFieldValues, customFields, projects, eq, and } from '@/lib/drizzle';

/**
 * GET /api/tasks/[taskId]/custom-field-values - Get all custom field values for a task
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
      .execute();

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[taskId]/custom-field-values - Set or update a custom field value
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

    const body = await request.json();
    const { customFieldId, value } = body;

    if (!customFieldId) {
      return NextResponse.json({ error: 'customFieldId is required' }, { status: 400 });
    }

    // Upsert: check if value already exists
    const existing = await db.query.taskCustomFieldValues.findFirst({
      where: and(
        eq(taskCustomFieldValues.taskId, taskId),
        eq(taskCustomFieldValues.customFieldId, customFieldId),
      ),
    });

    let result;
    if (existing) {
      [result] = await db
        .update(taskCustomFieldValues)
        .set({ value: value ?? null })
        .where(eq(taskCustomFieldValues.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(taskCustomFieldValues)
        .values({
          id: crypto.randomUUID(),
          taskId,
          customFieldId,
          value: value ?? null,
        })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
