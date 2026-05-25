import { getCurrentUser } from '@/lib/auth'
import db, { tenantMembers, eq, and, userRoles, roles, permissions, rolePermissions, inArray } from '@/lib/drizzle'

export interface ApiAuthContext {
  userId: string
  email: string
}

/**
 * Get current authenticated user from JWT token
 */
export async function getApiAuthContext(): Promise<ApiAuthContext | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    return {
      userId: user.userId,
      email: user.email,
    }
  } catch {
    return null
  }
}

/**
 * Require authentication - throw if not authenticated
 */
export async function requireAuth(): Promise<ApiAuthContext> {
  const authContext = await getApiAuthContext()

  if (!authContext) {
    throw new Error('Unauthorized')
  }

  return authContext
}

/**
 * Verify user has access to a tenant
 */
export async function verifyTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const member = await db.query.tenantMembers.findFirst({
    where: and(
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.userId, userId)
    ),
  })

  return !!member
}

/**
 * Verify user has specific role in a tenant
 */
export async function verifyTenantRole(
  userId: string,
  tenantId: string,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): Promise<boolean> {
  const member = await db.query.tenantMembers.findFirst({
    where: and(
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.userId, userId)
    ),
  })

  if (!member) return false

  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }

  return roleHierarchy[member.role] >= roleHierarchy[requiredRole]
}

/**
 * Get user's role in a tenant
 */
export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<string | null> {
  const member = await db.query.tenantMembers.findFirst({
    where: and(
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.userId, userId)
    ),
  })

  return member?.role || null
}

/**
 * Get role ids assigned to a user (optionally scoped to tenant)
 */
export async function getUserRoles(userId: string, tenantId?: string) {
  const whereClause = tenantId
    ? and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId))
    : eq(userRoles.userId, userId)

  const rows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(whereClause)
    .execute()

  return rows.map((r) => r.roleId)
}

/**
 * Return true if user has a permission (checks role -> role_permissions -> permissions)
 */
export async function userHasPermission(userId: string, permissionName: string, tenantId?: string) {
  const roleIds = await getUserRoles(userId, tenantId)
  if (!roleIds.length) return false

  const rows = await db
    .select({ pName: permissions.name })
    .from(permissions)
    .leftJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds))
    .execute()

  return rows.some((r) => r.pName === permissionName)
}

/**
 * Require a permission or throw
 */
export async function requirePermission(userId: string, permissionName: string, tenantId?: string) {
  const ok = await userHasPermission(userId, permissionName, tenantId)
  if (!ok) throw new Error('Forbidden')
}

