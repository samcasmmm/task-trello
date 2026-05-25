import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import db, {
   projects,
   tasks,
   users,
   labels,
   tenantMembers,
   eq,
   and,
   or,
   sql,
   inArray,
} from '@/lib/drizzle'

export async function GET(request: NextRequest) {
   try {
      const authContext = await requireAuth()
      const query = request.nextUrl.searchParams.get('q')?.trim() || ''

      if (!query) {
         return NextResponse.json({ projects: [], tasks: [], users: [], labels: [] })
      }

      const searchPattern = `%${query}%`

      const userTenantRows = await db
         .select({ tenantId: tenantMembers.tenantId })
         .from(tenantMembers)
         .where(eq(tenantMembers.userId, authContext.userId))
         .execute()

      const tenantIds = userTenantRows.map((row) => row.tenantId)
      if (!tenantIds.length) {
         return NextResponse.json({ projects: [], tasks: [], users: [], labels: [] })
      }

      const [projectRows, taskRows, userRows, labelRows] = await Promise.all([
         db
            .select({ id: projects.id, name: projects.name, description: projects.description, tenantId: projects.tenantId })
            .from(projects)
            .where(
               and(
                  inArray(projects.tenantId, tenantIds),
                  or(
                     sql`${projects.name} ILIKE ${searchPattern}`,
                     sql`${projects.description} ILIKE ${searchPattern}`
                  )
               )
            )
            .limit(20)
            .execute(),
         db
            .select({ id: tasks.id, title: tasks.title, status: tasks.status, projectId: tasks.projectId })
            .from(tasks)
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(
               and(
                  inArray(projects.tenantId, tenantIds),
                  or(
                     sql`${tasks.title} ILIKE ${searchPattern}`,
                     sql`${tasks.description} ILIKE ${searchPattern}`
                  )
               )
            )
            .limit(20)
            .execute(),
         db
            .select({ id: users.id, fullName: users.fullName, email: users.email })
            .from(users)
            .leftJoin(tenantMembers, eq(users.id, tenantMembers.userId))
            .where(
               and(
                  inArray(tenantMembers.tenantId, tenantIds),
                  or(
                     sql`${users.fullName} ILIKE ${searchPattern}`,
                     sql`${users.email} ILIKE ${searchPattern}`
                  )
               )
            )
            .limit(20)
            .execute(),
         db
            .select({ id: labels.id, name: labels.name, color: labels.color, projectId: labels.projectId })
            .from(labels)
            .where(
               and(
                  inArray(labels.tenantId, tenantIds),
                  sql`${labels.name} ILIKE ${searchPattern}`
               )
            )
            .limit(20)
            .execute(),
      ])

      return NextResponse.json({
         projects: projectRows,
         tasks: taskRows,
         users: userRows,
         labels: labelRows,
      })
   } catch (error: any) {
      return NextResponse.json(
         { error: error.message || 'Search failed' },
         { status: error.message === 'Unauthorized' ? 401 : 500 }
      )
   }
}
