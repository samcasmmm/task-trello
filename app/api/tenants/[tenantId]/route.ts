import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess, verifyTenantRole } from '@/lib/api-auth';
import db, { tenants, tenantMembers, users, projects, eq, sql } from '@/lib/drizzle';

/**
 * GET /api/tenants/[tenantId] - Get tenant details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId } = await params;

    const hasAccess = await verifyTenantAccess(authContext.userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const memberRows = await db
      .select({
        id: tenantMembers.id,
        role: tenantMembers.role,
        joinedAt: tenantMembers.joinedAt,
        updatedAt: tenantMembers.updatedAt,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(tenantMembers)
      .leftJoin(users, eq(tenantMembers.userId, users.id))
      .where(eq(tenantMembers.tenantId, tenantId))
      .execute();

    const members = memberRows.map((row) => ({
      id: row.id,
      role: row.role,
      joinedAt: row.joinedAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        email: row.email,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
      },
    }));

    const [projectCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .execute();

    return NextResponse.json({
      ...tenant,
      members,
      _count: {
        projects: Number(projectCountRow?.count ?? 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

/**
 * PATCH /api/tenants/[tenantId] - Update tenant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId } = await params;

    const isAdmin = await verifyTenantRole(authContext.userId, tenantId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, logoUrl } = body;

    const [updatedTenant] = await db
      .update(tenants)
      .set({
        name,
        description,
        logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    const [memberCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId))
      .execute();

    const [projectCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .execute();

    return NextResponse.json({
      ...updatedTenant,
      _count: {
        members: Number(memberCountRow?.count ?? 0),
        projects: Number(projectCountRow?.count ?? 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

/**
 * DELETE /api/tenants/[tenantId] - Delete tenant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId } = await params;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (tenant.ownerId !== authContext.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
