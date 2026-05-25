import { NextResponse } from 'next/server'
import { requireAuth, getUserRoles } from '@/lib/api-auth'
import db, { auditLogs, users, eq, desc } from '@/lib/drizzle'

// Assert Super Admin access
async function assertSuperAdmin() {
  const authContext = await requireAuth()
  const assignedRoles = await getUserRoles(authContext.userId)
  const isSuperAdmin = assignedRoles.includes('r-super-admin') || assignedRoles.includes('super_admin')
  if (!isSuperAdmin) {
    throw new Error('Forbidden')
  }
  return authContext
}

/**
 * GET /api/admin/logs - Fetch global system audit logs (top 100)
 */
export async function GET() {
  try {
    await assertSuperAdmin()

    // Query Drizzle joining audit logs and users
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: users.id,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100)
      .execute()

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Admin logs GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}
