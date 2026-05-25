import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import db, { eq, projects, tenants, tenantMembers, sql, inArray } from '@/lib/drizzle'

/**
 * GET /api/tenants - Get all tenants for the current user
 */
export async function GET() {
  try {
    const authContext = await requireAuth()

    const tenantRows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        description: tenants.description,
        logoUrl: tenants.logoUrl,
        ownerId: tenants.ownerId,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .innerJoin(tenantMembers, eq(tenantMembers.tenantId, tenants.id))
      .where(eq(tenantMembers.userId, authContext.userId))
      .execute()

    if (tenantRows.length === 0) {
      return NextResponse.json([])
    }

    const tenantIds = tenantRows.map((tenant) => tenant.id)

    const memberCountRows = await db
      .select({
        tenantId: tenantMembers.tenantId,
        count: sql<number>`count(*)`,
      })
      .from(tenantMembers)
      .where(inArray(tenantMembers.tenantId, tenantIds))
      .groupBy(tenantMembers.tenantId)
      .execute()

    const projectCountRows = await db
      .select({
        tenantId: projects.tenantId,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .where(inArray(projects.tenantId, tenantIds))
      .groupBy(projects.tenantId)
      .execute()

    const memberCountMap = new Map(memberCountRows.map((row) => [row.tenantId, Number(row.count)]))
    const projectCountMap = new Map(projectCountRows.map((row) => [row.tenantId, Number(row.count)]))

    const tenantsWithCounts = tenantRows.map((tenant) => ({
      ...tenant,
      _count: {
        members: memberCountMap.get(tenant.id) ?? 0,
        projects: projectCountMap.get(tenant.id) ?? 0,
      },
    }))

    return NextResponse.json(tenantsWithCounts)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/tenants - Create a new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth()
    const body = await request.json()

    const { name, slug, description, logoUrl } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const [tenant] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tenants)
        .values({
          id: crypto.randomUUID(),
          name,
          slug,
          description,
          logoUrl,
          ownerId: authContext.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      await tx.insert(tenantMembers).values({
        id: crypto.randomUUID(),
        tenantId: created.id,
        userId: authContext.userId,
        role: 'owner',
        joinedAt: new Date(),
        updatedAt: new Date(),
      })

      return [created]
    })

    return NextResponse.json(
      {
        ...tenant,
        _count: {
          members: 1,
          projects: 0,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

