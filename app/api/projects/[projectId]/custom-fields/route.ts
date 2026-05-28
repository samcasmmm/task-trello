import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantRole } from '@/lib/api-auth';
import db, { customFields, projects, eq, asc } from '@/lib/drizzle';

/**
 * GET /api/projects/[projectId]/custom-fields - List custom fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { projectId } = await params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customFieldsList = await db
      .select()
      .from(customFields)
      .where(eq(customFields.projectId, projectId))
      .orderBy(customFields.orderIndex)
      .execute();

    return NextResponse.json(customFieldsList);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/custom-fields - Create custom field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { projectId } = await params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isAdmin = await verifyTenantRole(authContext.userId, project.tenantId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, fieldType, options } = body;

    if (!name || !fieldType) {
      return NextResponse.json({ error: 'Name and field type are required' }, { status: 400 });
    }

    const [customField] = await db
      .insert(customFields)
      .values({
        id: crypto.randomUUID(),
        projectId,
        name,
        fieldType,
        options: options || null,
        createdById: authContext.userId,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(customField, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
