import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import db, { tenants, tenantMembers, sql } from '@/lib/drizzle'

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
        membersCount: sql<number>`(
          SELECT COUNT(*) FROM tenant_members tm
          WHERE tm.tenant_id = tenants.id
        )`,
        projectsCount: sql<number>`(
          SELECT COUNT(*) FROM projects p
          WHERE p.tenant_id = tenants.id
        )`,
      })
      .from(tenants)
      .where(
        sql`EXISTS (
          SELECT 1 FROM tenant_members tm
          WHERE tm.tenant_id = tenants.id
            AND tm.user_id = ${authContext.userId}
        )`
      )
      .execute()

    return NextResponse.json(tenantRows)
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

