import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantRole } from '@/lib/api-auth'
import db, { tenantMembers, users, eq, and, sql } from '@/lib/drizzle'

/**
 * GET /api/tenants/[tenantId]/members - List team members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params

    const rows = await db
      .select({
        id: tenantMembers.id,
        role: tenantMembers.role,
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
      .execute()

    const members = rows.map((row) => ({
      id: row.id,
      role: row.role,
      joinedAt: row.joinedAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        email: row.email,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
      },
    }))

    return NextResponse.json(members)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/tenants/[tenantId]/members - Invite user to tenant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { tenantId } = await params

    const isAdmin = await verifyTenantRole(authContext.userId, tenantId, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const existingMember = await db.query.tenantMembers.findFirst({
      where: and(
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.userId, targetUser.id)
      ),
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      )
    }

    const [member] = await db
      .insert(tenantMembers)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        userId: targetUser.id,
        role,
        joinedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(
      {
        ...member,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          avatarUrl: targetUser.avatarUrl,
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

