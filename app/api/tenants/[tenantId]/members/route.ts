import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantRole } from '@/lib/api-auth';
import db, { tenantMembers, users, eq, and, sql, userRoles, tenants } from '@/lib/drizzle';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notification';
import bcrypt from 'bcryptjs';

/**
 * GET /api/tenants/[tenantId]/members - List team members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const { tenantId } = await params;

    const rows = await db
      .select({
        id: tenantMembers.id,
        role: tenantMembers.role,
        reportsToId: tenantMembers.reportsToId,
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

    const members = rows.map((row) => ({
      id: row.id,
      role: row.role,
      reportsToId: row.reportsToId,
      joinedAt: row.joinedAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        email: row.email,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
      },
    }));

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}

/**
 * POST /api/tenants/[tenantId]/members - Invite user to tenant (auto-creates account if email not registered)
 */
export async function POST(
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

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await request.json();
    const { email, role, reportsToId, fullName, password } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    let targetUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    let isAutoCreated = false;
    if (!targetUser) {
      // Auto-create user since they don't exist yet!
      const defaultPassword = password || 'Welcome123!';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const newUserId = crypto.randomUUID();

      const [newUser] = await db
        .insert(users)
        .values({
          id: newUserId,
          email,
          passwordHash,
          fullName: fullName || email.split('@')[0], // name or default
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Assign system role 'r-member' for them
      await db
        .insert(userRoles)
        .values({
          id: crypto.randomUUID(),
          userId: newUserId,
          roleId: 'r-member',
          tenantId,
        })
        .execute();

      targetUser = newUser;
      isAutoCreated = true;
    }

    const existingMember = await db.query.tenantMembers.findFirst({
      where: and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, targetUser.id)),
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const [member] = await db
      .insert(tenantMembers)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        userId: targetUser.id,
        role,
        reportsToId: reportsToId || null,
        joinedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Trigger Notification for the invited member
    await createNotification(
      targetUser.id,
      `You have been added to the workspace: "${tenant.name}" as a ${role}.`,
    );

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'member_invited', {
      tenantId,
      workspaceName: tenant.name,
      userId: targetUser.id,
      email: targetUser.email,
      role,
      isAutoCreated,
    });

    return NextResponse.json(
      {
        ...member,
        isAutoCreated,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          avatarUrl: targetUser.avatarUrl,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Member invite error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
