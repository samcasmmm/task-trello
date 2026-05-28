import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantRole } from '@/lib/api-auth';
import db, { tenantMembers, eq, and } from '@/lib/drizzle';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notification';

/**
 * PATCH /api/tenants/[tenantId]/members/[memberId] - Update member role and manager
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; memberId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId, memberId } = await params;

    const isAdmin = await verifyTenantRole(authContext.userId, tenantId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await db.query.tenantMembers.findFirst({
      where: and(eq(tenantMembers.id, memberId), eq(tenantMembers.tenantId, tenantId)),
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role, reportsToId } = body;

    const [updated] = await db
      .update(tenantMembers)
      .set({
        role: role !== undefined ? role : undefined,
        reportsToId: reportsToId !== undefined ? reportsToId || null : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tenantMembers.id, memberId))
      .returning();

    // Trigger Notification for the updated member
    await createNotification(
      member.userId,
      `Your workspace membership role has been updated to "${updated.role}".`,
    );

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'member_updated', {
      tenantId,
      memberId,
      updatedUserId: member.userId,
      role: updated.role,
      reportsToId: updated.reportsToId,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

/**
 * DELETE /api/tenants/[tenantId]/members/[memberId] - Remove member from workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; memberId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId, memberId } = await params;

    const isAdmin = await verifyTenantRole(authContext.userId, tenantId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await db.query.tenantMembers.findFirst({
      where: and(eq(tenantMembers.id, memberId), eq(tenantMembers.tenantId, tenantId)),
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent owners from removing themselves if they are the only owner (can be handled on UI, but safe deletion here)
    if (member.userId === authContext.userId && member.role === 'owner') {
      return NextResponse.json(
        { error: 'Workspace owner cannot remove themselves.' },
        { status: 400 },
      );
    }

    await db.delete(tenantMembers).where(eq(tenantMembers.id, memberId)).execute();

    // Notify the removed user
    await createNotification(member.userId, `You have been removed from the workspace.`);

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'member_removed', {
      tenantId,
      memberId,
      removedUserId: member.userId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
