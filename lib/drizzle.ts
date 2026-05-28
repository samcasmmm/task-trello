import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, or, sql, asc, desc, inArray, isNull } from 'drizzle-orm';
import {
  users,
  tenants,
  tenantMembers,
  projects,
  tasks,
  taskChecklist,
  taskComments,
  taskAttachments,
  customFields,
  taskCustomFieldValues,
  notifications,
  auditLogs,
  // RBAC + extras
  roles,
  permissions,
  rolePermissions,
  userRoles,
  labels,
  taskLabels,
  taskMembers,
} from '@/db/schema';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, {
  max: 10,
});

export const db = drizzle(client, {
  schema: {
    users,
    tenants,
    tenantMembers,
    projects,
    tasks,
    taskChecklist,
    taskComments,
    taskAttachments,
    customFields,
    taskCustomFieldValues,
    notifications,
    auditLogs,
    // RBAC + extras
    roles,
    permissions,
    rolePermissions,
    userRoles,
    labels,
    taskLabels,
    taskMembers,
  },
});

export {
  users,
  tenants,
  tenantMembers,
  projects,
  tasks,
  taskChecklist,
  taskComments,
  taskAttachments,
  customFields,
  taskCustomFieldValues,
  notifications,
  auditLogs,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  labels,
  taskLabels,
  taskMembers,
  and,
  eq,
  or,
  sql,
  asc,
  desc,
  inArray,
  isNull,
};

export default db;
