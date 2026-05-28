import { getCurrentUser } from '@/lib/auth';
import db, {
  tenantMembers,
  eq,
  and,
  userRoles,
  roles,
  permissions,
  rolePermissions,
  inArray,
} from '@/lib/drizzle';

export interface ApiAuthContext {
  userId: string;
  email: string;
}

/**
 * Get current authenticated user from JWT token
 */
export async function getApiAuthContext(): Promise<ApiAuthContext | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    return {
      userId: user.userId,
      email: user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - throw if not authenticated
 */
export async function requireAuth(): Promise<ApiAuthContext> {
  const authContext = await getApiAuthContext();

  if (!authContext) {
    throw new Error('Unauthorized');
  }

  return authContext;
}

/**
 * Verify user has access to a tenant
 */
export async function verifyTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const rows = await db
    .select({ id: tenantMembers.id })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)))
    .limit(1)
    .execute();

  return rows.length > 0;
}

/**
 * Verify user has specific role in a tenant
 */
export async function verifyTenantRole(
  userId: string,
  tenantId: string,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer',
): Promise<boolean> {
  const rows = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)))
    .limit(1)
    .execute();

  const member = rows[0];
  if (!member) return false;

  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  // If system role, evaluate hierarchy
  if (member.role in roleHierarchy) {
    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }

  // If custom role, assign fallback role level based on keyword analysis to prevent lockout
  let customRoleLevel = 2; // Default to member
  const lowerRole = member.role.toLowerCase();
  if (
    lowerRole.includes('admin') ||
    lowerRole.includes('owner') ||
    lowerRole.includes('manager') ||
    lowerRole.includes('lead') ||
    lowerRole.includes('boss')
  ) {
    customRoleLevel = 3;
  } else if (
    lowerRole.includes('view') ||
    lowerRole.includes('guest') ||
    lowerRole.includes('read')
  ) {
    customRoleLevel = 1;
  }

  return customRoleLevel >= roleHierarchy[requiredRole];
}

/**
 * Get user's role in a tenant
 */
export async function getUserTenantRole(userId: string, tenantId: string): Promise<string | null> {
  const member = await db.query.tenantMembers.findFirst({
    where: and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)),
  });

  return member?.role || null;
}

/**
 * Get role ids assigned to a user (optionally scoped to tenant)
 */
export async function getUserRoles(userId: string, tenantId?: string) {
  const whereClause = tenantId
    ? and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId))
    : eq(userRoles.userId, userId);

  const rows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(whereClause)
    .execute();

  return rows.map((r) => r.roleId);
}

/**
 * Return true if user has a permission (checks role -> role_permissions -> permissions)
 */
export async function userHasPermission(userId: string, permissionName: string, tenantId?: string) {
  const roleIds = await getUserRoles(userId, tenantId);
  if (!roleIds.length) return false;

  const rows = await db
    .select({ pName: permissions.name })
    .from(permissions)
    .leftJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds))
    .execute();

  return rows.some((r) => r.pName === permissionName);
}

/**
 * Require a permission or throw
 */
export async function requirePermission(userId: string, permissionName: string, tenantId?: string) {
  const ok = await userHasPermission(userId, permissionName, tenantId);
  if (!ok) throw new Error('Forbidden');
}

/**
 * Check if user can assign tasks in a tenant
 * Admin/Owner: can assign to any user
 * Manager: can assign to users only
 * Member/Viewer: cannot assign
 */
export async function canAssignTasks(userId: string, tenantId: string): Promise<boolean> {
  const userRole = await getUserTenantRole(userId, tenantId);

  // owner and admin can assign
  if (userRole === 'owner' || userRole === 'admin') {
    return true;
  }

  // manager can assign
  if (userRole === 'manager') {
    return true;
  }

  // member and viewer cannot assign
  return false;
}

/**
 * Get user's role in a tenant and check assignment permissions
 */
export async function getUserAssignmentRole(
  userId: string,
  tenantId: string,
): Promise<{
  role: string | null;
  canAssign: boolean;
  canAssignToManagers: boolean;
}> {
  const role = await getUserTenantRole(userId, tenantId);
  const canAssign = role === 'owner' || role === 'admin' || role === 'manager';
  const canAssignToManagers = role === 'owner' || role === 'admin';

  return {
    role,
    canAssign,
    canAssignToManagers,
  };
}
