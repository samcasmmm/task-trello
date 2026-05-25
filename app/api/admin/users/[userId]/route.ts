import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRoles } from '@/lib/api-auth'
import db, { users, userRoles, roles, auditLogs, eq, and } from '@/lib/drizzle'

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
 * PATCH /api/admin/users/[userId] - Update user details/roles
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminAuth = await assertSuperAdmin()
    const { userId } = await params
    const body = await request.json()
    const { fullName, email, roleId } = body

    // 1. Fetch user to verify they exist
    const userToUpdate = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent Super Admin from changing their own role to something else to avoid lockout
    if (userId === adminAuth.userId && roleId && roleId !== 'r-super-admin') {
      return NextResponse.json({ error: 'Cannot demote your own Super Admin role' }, { status: 400 })
    }

    // 2. Perform updates
    await db
      .update(users)
      .set({
        fullName: fullName ?? userToUpdate.fullName,
        email: email ?? userToUpdate.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // 3. Update role mapping if roleId provided
    if (roleId) {
      // Clear old system roles
      await db.delete(userRoles).where(eq(userRoles.userId, userId)).execute()
      
      // Insert new role
      await db.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId,
        roleId,
        assignedAt: new Date(),
      }).execute()
    }

    // Record action in audit logs
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: adminAuth.userId,
      action: 'user_updated_by_admin',
      metadata: {
        targetUserId: userId,
        fullNameChanged: !!fullName,
        roleIdAssigned: roleId || 'unchanged',
      },
      createdAt: new Date(),
    }).execute()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin user PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId] - Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminAuth = await assertSuperAdmin()
    const { userId } = await params

    if (userId === adminAuth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own admin user account' }, { status: 400 })
    }

    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove foreign keys first, safely handled
    await db.delete(userRoles).where(eq(userRoles.userId, userId))
    await db.delete(users).where(eq(users.id, userId))

    // Record in audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: adminAuth.userId,
      action: 'user_deleted_by_admin',
      metadata: {
        deletedUserId: userId,
        deletedUserEmail: userToDelete.email,
      },
      createdAt: new Date(),
    }).execute()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin user DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message === 'Forbidden' ? 403 : 401 }
    )
  }
}
