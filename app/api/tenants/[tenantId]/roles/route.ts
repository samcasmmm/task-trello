import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyTenantRole } from '@/lib/api-auth'
import db, { roles, rolePermissions, permissions, eq, or, isNull } from '@/lib/drizzle'
import { createAuditLog } from '@/lib/audit'

/**
 * GET /api/tenants/[tenantId]/roles - Get system roles and custom workspace roles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const authContext = await requireAuth()
    const { tenantId } = await params

    const workspaceRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        tenantId: roles.tenantId,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(
        or(
          isNull(roles.tenantId),
          eq(roles.tenantId, tenantId)
        )
      )
      .execute()

    // Fetch role permissions for custom roles
    const roleIds = workspaceRoles.map((r) => r.id)
    
    // We will retrieve permissions for all these roles
    const allRolePerms = await db
      .select({
        roleId: rolePermissions.roleId,
        permissionId: rolePermissions.permissionId,
        permissionName: permissions.name,
      })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .execute()

    const rolesWithPermissions = workspaceRoles.map((role) => {
      const perms = allRolePerms
        .filter((rp) => rp.roleId === role.id && rp.permissionName)
        .map((rp) => rp.permissionName as string)

      return {
        ...role,
        permissions: perms,
      }
    })

    return NextResponse.json(rolesWithPermissions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/tenants/[tenantId]/roles - Create a custom role inside a workspace
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
    const { name, description, permissionIds } = body

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    const newRoleId = `role-${crypto.randomUUID()}`

    const [newRole] = await db
      .insert(roles)
      .values({
        id: newRoleId,
        tenantId,
        name,
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Map permissions
    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      const inserts = permissionIds.map((pId: string) => ({
        id: crypto.randomUUID(),
        roleId: newRoleId,
        permissionId: pId,
        createdAt: new Date(),
      }))

      for (const row of inserts) {
        await db.insert(rolePermissions).values(row).execute()
      }
    }

    // Trigger Audit Log
    await createAuditLog(authContext.userId, 'role_created', {
      tenantId,
      roleId: newRoleId,
      name,
      permissionCount: permissionIds?.length || 0,
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create role:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
