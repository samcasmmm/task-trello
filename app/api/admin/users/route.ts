import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserRoles } from '@/lib/api-auth';
import db, { users, userRoles, roles, auditLogs, eq } from '@/lib/drizzle';
import bcrypt from 'bcryptjs';

// Helper to assert Super Admin status
async function assertSuperAdmin() {
  const authContext = await requireAuth();
  const assignedRoles = await getUserRoles(authContext.userId);
  const isSuperAdmin =
    assignedRoles.includes('r-super-admin') || assignedRoles.includes('super_admin');
  if (!isSuperAdmin) {
    throw new Error('Forbidden');
  }
  return authContext;
}

/**
 * GET /api/admin/users - Get all platform users and their roles
 */
export async function GET() {
  try {
    await assertSuperAdmin();

    // Fetch all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Fetch user roles mapping
    const allUserRoles = await db.query.userRoles.findMany();
    const allRoles = await db.query.roles.findMany();

    const roleMap = new Map(allRoles.map((r) => [r.id, r]));
    const userRoleMap = new Map<string, any[]>();

    allUserRoles.forEach((ur) => {
      const userList = userRoleMap.get(ur.userId) || [];
      const roleObj = roleMap.get(ur.roleId);
      if (roleObj) {
        userList.push(roleObj);
      }
      userRoleMap.set(ur.userId, userList);
    });

    const result = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      roles: userRoleMap.get(u.id) || [],
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 },
    );
  }
}

/**
 * POST /api/admin/users - Admin create a new platform user
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await assertSuperAdmin();
    const body = await request.json();
    const { email, password, fullName, roleId } = body;

    if (!email || !password || !fullName || !roleId) {
      return NextResponse.json(
        { error: 'Email, password, fullName, and roleId are required' },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        id: newUserId,
        email,
        passwordHash,
        fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Assign Role
    await db
      .insert(userRoles)
      .values({
        id: crypto.randomUUID(),
        userId: newUserId,
        roleId: roleId,
        assignedAt: new Date(),
      })
      .execute();

    // Log action in audit logs
    const [roleObj] = await db.select().from(roles).where(eq(roles.id, roleId)).execute();
    await db
      .insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        userId: adminAuth.userId,
        action: 'user_created_by_admin',
        metadata: {
          newUserId,
          email,
          fullName,
          roleAssigned: roleObj?.name || 'unknown',
        },
        createdAt: new Date(),
      })
      .execute();

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        roleId,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Admin user POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 },
    );
  }
}
