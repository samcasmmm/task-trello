import { pgTable, text, timestamp, json, numeric, boolean, integer, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const users = pgTable(
   'users',
   {
      id: text('id').primaryKey(),
      email: text('email').notNull(),
      passwordHash: text('passwordHash').notNull(),
      fullName: text('fullName'),
      avatarUrl: text('avatarUrl'),
      createdAt: timestamp('createdAt').defaultNow().notNull(),
      updatedAt: timestamp('updatedAt').defaultNow().notNull(),
   },
   (user) => ({
      emailIndex: uniqueIndex('users_email_key').on(user.email),
   })
)

export const tenants = pgTable('tenants', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   slug: text('slug').notNull(),
   description: text('description'),
   logoUrl: text('logoUrl'),
   ownerId: text('ownerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const tenantMembers = pgTable(
   'tenant_members',
   {
      id: text('id').primaryKey(),
      tenantId: text('tenantId').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
      userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
      role: text('role').notNull().default('member'),
      joinedAt: timestamp('joinedAt').defaultNow().notNull(),
      updatedAt: timestamp('updatedAt').defaultNow().notNull(),
   },
   (member) => ({
      tenantUserUnique: uniqueIndex('tenant_members_tenantId_userId_key').on(
         member.tenantId,
         member.userId
      ),
      tenantIndex: index('tenant_members_tenantId_idx').on(member.tenantId),
      userIndex: index('tenant_members_userId_idx').on(member.userId),
   })
)

export const projects = pgTable('projects', {
   id: text('id').primaryKey(),
   tenantId: text('tenantId').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
   name: text('name').notNull(),
   description: text('description'),
   color: text('color').notNull().default('#3B82F6'),
   icon: text('icon').notNull().default('folder'),
   status: text('status').notNull().default('active'),
   createdById: text('createdById').notNull().references(() => users.id, { onDelete: 'set null' }),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
   deletedAt: timestamp('deletedAt'),
},
   (project) => ({
      tenantIdIndex: index('projects_tenantId_idx').on(project.tenantId),
      statusIndex: index('projects_status_idx').on(project.status),
   })
)

export const tasks = pgTable('tasks', {
   id: text('id').primaryKey(),
   projectId: text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
   parentTaskId: text('parentTaskId').references(() => tasks.id, { onDelete: 'cascade' }),
   title: text('title').notNull(),
   description: text('description'),
   status: text('status').notNull().default('todo'),
   priority: text('priority').notNull().default('medium'),
   assignedToId: text('assignedToId').references(() => users.id, { onDelete: 'set null' }),
   createdById: text('createdById').notNull().references(() => users.id, { onDelete: 'set null' }),
   dueDate: timestamp('dueDate'),
   startDate: timestamp('startDate'),
   estimatedHours: numeric('estimatedHours'),
   actualHours: numeric('actualHours'),
   tags: text("tags").array().default([]),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
   deletedAt: timestamp('deletedAt'),
},
   (task) => ({
      projectIdIndex: index('tasks_projectId_idx').on(task.projectId),
      statusIndex: index('tasks_status_idx').on(task.status),
      priorityIndex: index('tasks_priority_idx').on(task.priority),
      dueDateIndex: index('tasks_dueDate_idx').on(task.dueDate),
      createdAtIndex: index('tasks_createdAt_idx').on(task.createdAt),
      updatedAtIndex: index('tasks_updatedAt_idx').on(task.updatedAt),
      deletedAtIndex: index('tasks_deletedAt_idx').on(task.deletedAt),
      assignedToIdIndex: index('tasks_assignedToId_idx').on(task.assignedToId),
   })
)

export const taskChecklist = pgTable('task_checklists', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   title: text('title').notNull(),
   completed: boolean('completed').notNull().default(false),
   orderIndex: integer('orderIndex').notNull().default(0),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const taskComments = pgTable('task_comments', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   userId: text('userId').notNull().references(() => users.id, { onDelete: 'set null' }),
   content: text('content').notNull(),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const taskAttachments = pgTable('task_attachments', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   uploadedById: text('uploadedById').notNull().references(() => users.id, { onDelete: 'set null' }),
   filename: text('filename').notNull(),
   fileSize: integer('fileSize'),
   fileType: text('fileType'),
   storagePath: text('storagePath').notNull(),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const customFields = pgTable('custom_fields', {
   id: text('id').primaryKey(),
   projectId: text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
   name: text('name').notNull(),
   fieldType: text('fieldType').notNull(),
   options: json('options'),
   orderIndex: integer('orderIndex').notNull().default(0),
   createdById: text('createdById').notNull().references(() => users.id, { onDelete: 'set null' }),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const taskCustomFieldValues = pgTable('task_custom_field_values', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   customFieldId: text('customFieldId').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
   value: json('value'),
})

export const notifications = pgTable('notifications', {
   id: text('id').primaryKey(),
   userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
   content: text('content').notNull(),
   read: boolean('read').notNull().default(false),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
   id: text('id').primaryKey(),
   userId: text('userId').notNull().references(() => users.id, { onDelete: 'set null' }),
   action: text('action').notNull(),
   metadata: json('metadata'),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
})

// RBAC: roles, permissions, user_roles, role_permissions
export const roles = pgTable('roles', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   description: text('description'),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const permissions = pgTable('permissions', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   description: text('description'),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const rolePermissions = pgTable('role_permissions', {
   id: text('id').primaryKey(),
   roleId: text('roleId').notNull().references(() => roles.id, { onDelete: 'cascade' }),
   permissionId: text('permissionId').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const userRoles = pgTable('user_roles', {
   id: text('id').primaryKey(),
   userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
   roleId: text('roleId').notNull().references(() => roles.id, { onDelete: 'cascade' }),
   tenantId: text('tenantId').references(() => tenants.id, { onDelete: 'cascade' }),
   assignedAt: timestamp('assignedAt').defaultNow().notNull(),
})

// Labels and task-members (many-to-many)
export const labels = pgTable('labels', {
   id: text('id').primaryKey(),
   tenantId: text('tenantId').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
   projectId: text('projectId').references(() => projects.id, { onDelete: 'cascade' }),
   name: text('name').notNull(),
   color: text('color').notNull().default('#CBD5E1'),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
   updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const taskLabels = pgTable('task_labels', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   labelId: text('labelId').notNull().references(() => labels.id, { onDelete: 'cascade' }),
   createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const taskMembers = pgTable('task_members', {
   id: text('id').primaryKey(),
   taskId: text('taskId').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
   userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
   assignedAt: timestamp('assignedAt').defaultNow().notNull(),
})
