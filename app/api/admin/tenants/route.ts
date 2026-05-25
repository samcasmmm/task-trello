import { NextResponse } from 'next/server'
import { requireAuth, getUserRoles } from '@/lib/api-auth'
import db, { tenants, tenantMembers, projects, sql, eq } from '@/lib/drizzle'

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
 * GET /api/admin/tenants - Get all platform tenants with statistics
 */
export async function GET() {
  try {
    await assertSuperAdmin()

    const allTenants = await db.query.tenants.findMany({
      orderBy: (tenants, { desc }) => [desc(tenants.createdAt)],
    })

    const result = await Promise.all(
      allTenants.map(async (t) => {
        const [memberCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tenantMembers)
          .where(eq(tenantMembers.tenantId, t.id))
          .execute()

        const [projectCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(projects)
          .where(eq(projects.tenantId, t.id))
          .execute()

        return {
          ...t,
          memberCount: Number(memberCountRow?.count ?? 0),
          projectCount: Number(projectCountRow?.count ?? 0),
        }
      })
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Admin tenants GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}
