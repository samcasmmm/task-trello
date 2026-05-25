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

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    const startOfTodayIso = startOfToday.toISOString()
    const endOfTodayIso = endOfToday.toISOString()

    const sevenDaysAgo = new Date(startOfToday)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoIso = sevenDaysAgo.toISOString()

    // Run all independent queries in parallel
    const [projectCountRow, aggregateTaskStatsRows, statusCountsRows, priorityCountsRows, createdTrendRows, completedTrendRows, memberCountRow] = await Promise.all([
      // 1. Project count
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.tenantId, tenantId))
        .execute(),

      // 2. Aggregate task statistics (combines multiple counts into one query)
      db
        .select({
          totalTasks: sql<number>`count(*)`,
          tasksDueToday: sql<number>`sum(case when ${tasks.dueDate} >= ${startOfTodayIso} and ${tasks.dueDate} <= ${endOfTodayIso} then 1 else 0 end)`,
          overdueTasks: sql<number>`sum(case when ${tasks.dueDate} < ${startOfTodayIso} and ${tasks.status} != 'done' then 1 else 0 end)`,
          completedTasks: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`,
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(projects.tenantId, tenantId),
            isNull(tasks.deletedAt)
          )
        )
        .execute(),

      // 3. Tasks by Status
      db
        .select({ status: tasks.status, count: sql<number>`count(*)` })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(projects.tenantId, tenantId),
            isNull(tasks.deletedAt)
          )
        )
        .groupBy(tasks.status)
        .execute(),

      // 4. Tasks by Priority
      db
        .select({ priority: tasks.priority, count: sql<number>`count(*)` })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(projects.tenantId, tenantId),
            isNull(tasks.deletedAt)
          )
        )
        .groupBy(tasks.priority)
        .execute(),

      // 5. Created tasks trend (last 7 days)
      db
        .select({
          day: sql<Date>`date_trunc('day', ${tasks.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(projects.tenantId, tenantId),
            isNull(tasks.deletedAt),
            sql`${tasks.createdAt} >= ${sevenDaysAgoIso}`,
            sql`${tasks.createdAt} <= ${endOfTodayIso}`
          )
        )
        .groupBy(sql`date_trunc('day', ${tasks.createdAt})`)
        .orderBy(sql`date_trunc('day', ${tasks.createdAt})`)
        .execute(),

      // 6. Completed tasks trend (last 7 days)
      db
        .select({
          day: sql<Date>`date_trunc('day', ${tasks.updatedAt})`,
          count: sql<number>`count(*)`,
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(projects.tenantId, tenantId),
            isNull(tasks.deletedAt),
            eq(tasks.status, 'done'),
            sql`${tasks.updatedAt} >= ${sevenDaysAgoIso}`,
            sql`${tasks.updatedAt} <= ${endOfTodayIso}`
          )
        )
        .groupBy(sql`date_trunc('day', ${tasks.updatedAt})`)
        .orderBy(sql`date_trunc('day', ${tasks.updatedAt})`)
        .execute(),

      // 7. Member count
      db
        .select({ count: sql<number>`count(*)` })
        .from(tenantMembers)
        .where(eq(tenantMembers.tenantId, tenantId))
        .execute(),
    ])

    const totalProjects = Number(projectCountRow[0]?.count ?? 0)
    const aggregateStats = aggregateTaskStatsRows[0]
    const totalTasks = Number(aggregateStats?.totalTasks ?? 0)
    const tasksDueToday = Number(aggregateStats?.tasksDueToday ?? 0)
    const overdueTasks = Number(aggregateStats?.overdueTasks ?? 0)
    const completedTasks = Number(aggregateStats?.completedTasks ?? 0)
    const activeMembers = Number(memberCountRow[0]?.count ?? 0)

    const tasksByStatus = statusCountsRows.map((r) => ({ status: r.status, count: Number(r.count) }))
    const tasksByPriority = priorityCountsRows.map((r) => ({ priority: r.priority, count: Number(r.count) }))

    // Process trends
    const createdMap = new Map(
      createdTrendRows.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        Number(row.count),
      ])
    )
    const completedMap = new Map(
      completedTrendRows.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        Number(row.count),
      ])
    )

    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })

      trendData.push({
        name: dayName,
        created: createdMap.get(key) ?? 0,
        completed: completedMap.get(key) ?? 0,
      })
    }
    const completionTrend = trendData

    // Get recent activities (get user IDs and activities in one query using subquery)
    const recentActivities = await db
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
      .where(
        inArray(
          auditLogs.userId,
          db
            .select({ userId: tenantMembers.userId })
            .from(tenantMembers)
            .where(eq(tenantMembers.tenantId, tenantId))
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(5)
      .execute()

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

