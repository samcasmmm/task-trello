import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth'
import db, {
  projects,
  tasks,
  tenantMembers,
  auditLogs,
  users,
  eq,
  and,
  inArray,
  sql,
  isNull,
  desc,
} from '@/lib/drizzle'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { tenantId } = await params

    // Verify tenant access
    const hasAccess = await verifyTenantAccess(authContext.userId, tenantId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Projects count
    const [projectCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .execute()
    const totalProjects = Number(projectCountRow?.count ?? 0)

    // 2. Fetch project ids in this tenant
    const projectList = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .execute()
    const projectIds = projectList.map((p) => p.id)

    // Standard fallback counts if no projects exist
    let totalTasks = 0
    let tasksDueToday = 0
    let overdueTasks = 0
    let completedTasks = 0
    let tasksByStatus: { status: string; count: number }[] = []
    let tasksByPriority: { priority: string; count: number }[] = []
    let completionTrend: { name: string; completed: number; created: number }[] = []

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const startOfTodayIso = startOfToday.toISOString()
    const endOfTodayIso = endOfToday.toISOString()

    if (projectIds.length > 0) {
      // Total Tasks
      const [taskCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt)
          )
        )
        .execute()
      totalTasks = Number(taskCountRow?.count ?? 0)

      // Tasks Due Today
      const [dueTodayRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt),
            sql`${tasks.dueDate} >= ${startOfTodayIso} AND ${tasks.dueDate} <= ${endOfTodayIso}`
          )
        )
        .execute()
      tasksDueToday = Number(dueTodayRow?.count ?? 0)

      // Overdue Tasks
      const [overdueRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt),
            sql`${tasks.dueDate} < ${startOfTodayIso}`,
            sql`${tasks.status} != 'done'`
          )
        )
        .execute()
      overdueTasks = Number(overdueRow?.count ?? 0)

      // Completed Tasks
      const [completedRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt),
            eq(tasks.status, 'done')
          )
        )
        .execute()
      completedTasks = Number(completedRow?.count ?? 0)

      // Tasks by Status
      const statusRows = await db
        .select({ status: tasks.status, count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt)
          )
        )
        .groupBy(tasks.status)
        .execute()
      tasksByStatus = statusRows.map((r) => ({ status: r.status, count: Number(r.count) }))

      // Tasks by Priority
      const priorityRows = await db
        .select({ priority: tasks.priority, count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            isNull(tasks.deletedAt)
          )
        )
        .groupBy(tasks.priority)
        .execute()
      tasksByPriority = priorityRows.map((r) => ({ priority: r.priority, count: Number(r.count) }))

      // 7-day completion trend (last 7 calendar days)
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)

        const start = new Date(d)
        const end = new Date(d)
        end.setHours(23, 59, 59, 999)
        const startIso = start.toISOString()
        const endIso = end.toISOString()

        // Count created on this day
        const [createdRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(
            and(
              inArray(tasks.projectId, projectIds),
              isNull(tasks.deletedAt),
              sql`${tasks.createdAt} >= ${startIso} AND ${tasks.createdAt} <= ${endIso}`
            )
          )
          .execute()

        // Count completed on this day (updated to done)
        const [completedTrendRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(
            and(
              inArray(tasks.projectId, projectIds),
              isNull(tasks.deletedAt),
              eq(tasks.status, 'done'),
              sql`${tasks.updatedAt} >= ${startIso} AND ${tasks.updatedAt} <= ${endIso}`
            )
          )
          .execute()

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        trendData.push({
          name: dayName,
          created: Number(createdRow?.count ?? 0),
          completed: Number(completedTrendRow?.count ?? 0),
        })
      }
      completionTrend = trendData
    }

    // 3. Active Members Count
    const [memberCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId))
      .execute()
    const activeMembers = Number(memberCountRow?.count ?? 0)

    // 4. Recent Activity Feed (top 5 audit logs relating to this tenant's users)
    const tenantUserRows = await db
      .select({ userId: tenantMembers.userId })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId))
      .execute()
    const tenantUserIds = tenantUserRows.map((u) => u.userId)

    const recentActivities = tenantUserIds.length > 0
      ? await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          userId: users.id,
          userFullName: users.fullName,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(inArray(auditLogs.userId, tenantUserIds))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5)
        .execute()
      : []

    return NextResponse.json({
      totalProjects,
      totalTasks,
      tasksDueToday,
      overdueTasks,
      completedTasks,
      activeMembers,
      tasksByStatus,
      tasksByPriority,
      completionTrend,
      recentActivities,
    })
  } catch (error: any) {
    console.error('Tenant stats API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
