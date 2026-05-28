import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { projects, tasks, eq, and, sql, isNull } from '@/lib/drizzle';

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
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const hasAccess = await verifyTenantAccess(authContext.userId, project.tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfTodayIso = startOfToday.toISOString();
    const endOfTodayIso = endOfToday.toISOString();

    // Last 12 months range
    const twelveMonthsAgo = new Date(startOfToday);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    const twelveMonthsAgoIso = twelveMonthsAgo.toISOString();

    const [aggregateRows, statusRows, priorityRows, createdMonthRows, completedMonthRows] =
      await Promise.all([
        // KPI aggregate
        db
          .select({
            totalTasks: sql<number>`count(*)`,
            tasksDueToday: sql<number>`sum(case when ${tasks.dueDate} >= ${startOfTodayIso} and ${tasks.dueDate} <= ${endOfTodayIso} then 1 else 0 end)`,
            overdueTasks: sql<number>`sum(case when ${tasks.dueDate} < ${startOfTodayIso} and ${tasks.status} != 'done' then 1 else 0 end)`,
            completedTasks: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`,
            inProgressTasks: sql<number>`sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end)`,
          })
          .from(tasks)
          .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
          .execute(),

        // Tasks by status
        db
          .select({ status: tasks.status, count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
          .groupBy(tasks.status)
          .execute(),

        // Tasks by priority
        db
          .select({ priority: tasks.priority, count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt)))
          .groupBy(tasks.priority)
          .execute(),

        // Monthly created trend (last 12 months)
        db
          .select({
            month: sql<Date>`date_trunc('month', ${tasks.createdAt})`,
            count: sql<number>`count(*)`,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.projectId, projectId),
              isNull(tasks.deletedAt),
              sql`${tasks.createdAt} >= ${twelveMonthsAgoIso}`,
              sql`${tasks.createdAt} <= ${endOfTodayIso}`,
            ),
          )
          .groupBy(sql`date_trunc('month', ${tasks.createdAt})`)
          .orderBy(sql`date_trunc('month', ${tasks.createdAt})`)
          .execute(),

        // Monthly completed trend (last 12 months)
        db
          .select({
            month: sql<Date>`date_trunc('month', ${tasks.updatedAt})`,
            count: sql<number>`count(*)`,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.projectId, projectId),
              isNull(tasks.deletedAt),
              eq(tasks.status, 'done'),
              sql`${tasks.updatedAt} >= ${twelveMonthsAgoIso}`,
              sql`${tasks.updatedAt} <= ${endOfTodayIso}`,
            ),
          )
          .groupBy(sql`date_trunc('month', ${tasks.updatedAt})`)
          .orderBy(sql`date_trunc('month', ${tasks.updatedAt})`)
          .execute(),
      ]);

    const agg = aggregateRows[0];
    const totalTasks = Number(agg?.totalTasks ?? 0);
    const tasksDueToday = Number(agg?.tasksDueToday ?? 0);
    const overdueTasks = Number(agg?.overdueTasks ?? 0);
    const completedTasks = Number(agg?.completedTasks ?? 0);
    const inProgressTasks = Number(agg?.inProgressTasks ?? 0);

    const tasksByStatus = statusRows.map((r) => ({ status: r.status, count: Number(r.count) }));
    const tasksByPriority = priorityRows.map((r) => ({
      priority: r.priority,
      count: Number(r.count),
    }));

    // Build 12-month trend array
    const createdMap = new Map(
      createdMonthRows.map((r) => [new Date(r.month).toISOString().slice(0, 7), Number(r.count)]),
    );
    const completedMap = new Map(
      completedMonthRows.map((r) => [new Date(r.month).toISOString().slice(0, 7), Number(r.count)]),
    );

    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrend.push({
        name: label,
        created: createdMap.get(key) ?? 0,
        completed: completedMap.get(key) ?? 0,
      });
    }

    return NextResponse.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      tasksDueToday,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      monthlyTrend,
    });
  } catch (error: any) {
    console.error('Project stats API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
