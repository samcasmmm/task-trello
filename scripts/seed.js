const dbModule = require('../lib/drizzle');
const db = dbModule.default || dbModule;
const {
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
  eq,
} = dbModule;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting comprehensive database seeding...');

  // 1. Safe Cleanup in reverse dependency order
  console.log('Cleaning up existing data...');
  try {
    await db.delete(auditLogs);
    await db.delete(notifications);
    await db.delete(taskCustomFieldValues);
    await db.delete(customFields);
    await db.delete(taskAttachments);
    await db.delete(taskComments);
    await db.delete(taskChecklist);
    await db.delete(taskLabels);
    await db.delete(taskMembers);
    await db.delete(tasks);
    await db.delete(projects);
    await db.delete(tenantMembers);
    await db.delete(tenants);
    await db.delete(userRoles);
    await db.delete(rolePermissions);
    await db.delete(roles);
    await db.delete(permissions);
    await db.delete(users);
    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.log('Cleanup step skipped or encountered tables that were already empty:', err.message);
  }

  // 2. Seed Permissions
  console.log('Seeding permissions...');
  const permissionData = [
    { id: 'p-create-users', name: 'create_users', description: 'Create platform users' },
    { id: 'p-edit-users', name: 'edit_users', description: 'Edit platform users' },
    { id: 'p-delete-users', name: 'delete_users', description: 'Delete platform users' },
    { id: 'p-manage-tenants', name: 'manage_tenants', description: 'Manage tenants/workspaces' },
    { id: 'p-view-projects', name: 'view_all_projects', description: 'View all projects across platform' },
    { id: 'p-manage-projects', name: 'manage_projects', description: 'Create and edit workspace projects' },
    { id: 'p-manage-tasks', name: 'manage_tasks', description: 'Manage project tasks' },
    { id: 'p-manage-fields', name: 'manage_custom_fields', description: 'Manage custom fields' },
    { id: 'p-view-audit', name: 'view_audit_logs', description: 'View global audit logs' },
  ];

  for (const perm of permissionData) {
    await db.insert(permissions).values(perm).execute();
  }

  // 3. Seed Roles
  console.log('Seeding roles...');
  const roleData = [
    { id: 'r-super-admin', name: 'super_admin', description: 'Platform owner with full global control' },
    { id: 'r-tenant-manager', name: 'tenant_manager', description: 'Workspace owner who manages projects and teams' },
    { id: 'r-member', name: 'member', description: 'Regular workspace team member' },
  ];

  for (const role of roleData) {
    await db.insert(roles).values(role).execute();
  }

  // 4. Map Role Permissions
  console.log('Mapping role permissions...');
  const superAdminPerms = permissionData.map(p => p.id);
  const tenantManagerPerms = [
    'p-manage-projects',
    'p-manage-tasks',
    'p-manage-fields',
  ];
  const memberPerms = [
    'p-manage-tasks', // Members can update tasks, subtasks, checklists, add comments, etc.
  ];

  const rolePermissionMaps = [];
  
  superAdminPerms.forEach(pid => {
    rolePermissionMaps.push({
      id: crypto.randomUUID(),
      roleId: 'r-super-admin',
      permissionId: pid
    });
  });

  tenantManagerPerms.forEach(pid => {
    rolePermissionMaps.push({
      id: crypto.randomUUID(),
      roleId: 'r-tenant-manager',
      permissionId: pid
    });
  });

  memberPerms.forEach(pid => {
    rolePermissionMaps.push({
      id: crypto.randomUUID(),
      roleId: 'r-member',
      permissionId: pid
    });
  });

  for (const rp of rolePermissionMaps) {
    await db.insert(rolePermissions).values(rp).execute();
  }

  // 5. Seed Users
  console.log('Seeding users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const userData = [
    {
      id: 'u-admin',
      email: 'admin@platform.com',
      passwordHash: adminPassword,
      fullName: 'System Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'u-manager',
      email: 'manager@tenant.com',
      passwordHash: managerPassword,
      fullName: 'SaaS Manager',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
    },
    {
      id: 'u-member',
      email: 'member@tenant.com',
      passwordHash: memberPassword,
      fullName: 'Regular Dev',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
    }
  ];

  for (const u of userData) {
    await db.insert(users).values(u).execute();
  }

  // Assign user roles
  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    userId: 'u-admin',
    roleId: 'r-super-admin',
  }).execute();

  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    userId: 'u-manager',
    roleId: 'r-tenant-manager',
  }).execute();

  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    userId: 'u-member',
    roleId: 'r-member',
  }).execute();

  // 6. Seed Tenants/Workspaces
  console.log('Seeding tenants...');
  const tenantData = [
    {
      id: 't-acme',
      name: 'Acme Software Solutions',
      slug: 'acme-corp',
      description: 'Enterprise grade SaaS products workspace',
      ownerId: 'u-manager',
    }
  ];

  for (const t of tenantData) {
    await db.insert(tenants).values(t).execute();
  }

  // Tenant members
  await db.insert(tenantMembers).values({
    id: crypto.randomUUID(),
    tenantId: 't-acme',
    userId: 'u-manager',
    role: 'owner',
  }).execute();

  await db.insert(tenantMembers).values({
    id: crypto.randomUUID(),
    tenantId: 't-acme',
    userId: 'u-member',
    role: 'member',
  }).execute();

  // 7. Seed Projects
  console.log('Seeding projects...');
  const projectData = [
    {
      id: 'p-redesign',
      tenantId: 't-acme',
      name: 'SaaS Platform Redesign',
      description: 'Completely overhaul our web application interface and user experience to drive product conversion',
      color: '#3B82F6', // Sleek blue
      icon: 'layout',
      status: 'active',
      createdById: 'u-manager',
    },
    {
      id: 'p-marketing',
      tenantId: 't-acme',
      name: 'Marketing Expansion 2026',
      description: 'Prepare launch resources, content strategy, and SEO optimization for next-gen products',
      color: '#EC4899', // Pink
      icon: 'trending-up',
      status: 'active',
      createdById: 'u-manager',
    }
  ];

  for (const proj of projectData) {
    await db.insert(projects).values(proj).execute();
  }

  // 8. Seed Custom Fields
  console.log('Seeding custom fields...');
  const fieldData = [
    {
      id: 'cf-budget',
      projectId: 'p-redesign',
      name: 'Budget',
      fieldType: 'number',
      options: null,
      orderIndex: 1,
      createdById: 'u-manager',
    },
    {
      id: 'cf-severity',
      projectId: 'p-redesign',
      name: 'Severity',
      fieldType: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'],
      orderIndex: 2,
      createdById: 'u-manager',
    },
    {
      id: 'cf-sprint',
      projectId: 'p-redesign',
      name: 'Sprint',
      fieldType: 'text',
      options: null,
      orderIndex: 3,
      createdById: 'u-manager',
    },
    {
      id: 'cf-client',
      projectId: 'p-redesign',
      name: 'Client Name',
      fieldType: 'text',
      options: null,
      orderIndex: 4,
      createdById: 'u-manager',
    }
  ];

  for (const cf of fieldData) {
    await db.insert(customFields).values(cf).execute();
  }

  // 9. Seed Labels
  console.log('Seeding labels...');
  const labelData = [
    { id: 'l-bug', tenantId: 't-acme', projectId: 'p-redesign', name: 'Bug Fix', color: '#EF4444' }, // Red
    { id: 'l-feat', tenantId: 't-acme', projectId: 'p-redesign', name: 'Feature Request', color: '#10B981' }, // Green
    { id: 'l-design', tenantId: 't-acme', projectId: 'p-redesign', name: 'UI/UX Design', color: '#8B5CF6' }, // Purple
    { id: 'l-docs', tenantId: 't-acme', projectId: 'p-redesign', name: 'Documentation', color: '#F59E0B' }, // Amber
  ];

  for (const lbl of labelData) {
    await db.insert(labels).values(lbl).execute();
  }

  // 10. Seed Tasks (Recursive Tree Structure!)
  console.log('Seeding tasks & recursive subtasks...');
  
  // Root Task 1: Website Redesign Core
  await db.insert(tasks).values({
    id: 't1-root',
    projectId: 'p-redesign',
    title: 'Website Redesign UX Overhaul',
    description: 'Overhaul design systems, establish component guidelines, and implement key structural components.',
    status: 'in_progress',
    priority: 'high',
    assignedToId: 'u-manager',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    startDate: new Date(),
    estimatedHours: '80',
    actualHours: '16',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  }).execute();

  // Root Task 1 -> Child 1: Design Homepage
  await db.insert(tasks).values({
    id: 't1-child1',
    projectId: 'p-redesign',
    parentTaskId: 't1-root',
    title: 'Design Homepage Mockups',
    description: 'Design interactive, high-fidelity mockups for our next-generation homepage.',
    status: 'in_progress',
    priority: 'high',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startDate: new Date(),
    estimatedHours: '30',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  }).execute();

  // Root Task 1 -> Child 1 -> Sub-child 1: Hero Section
  await db.insert(tasks).values({
    id: 't1-sub1',
    projectId: 'p-redesign',
    parentTaskId: 't1-child1',
    title: 'Design Hero Section Layout',
    description: 'Vibrant modern header with dark mode toggle, engaging CTA buttons, and interactive glassmorphic card display.',
    status: 'done',
    priority: 'urgent',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    estimatedHours: '10',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }).execute();

  // Root Task 1 -> Child 1 -> Sub-child 2: Navbar Navigation
  await db.insert(tasks).values({
    id: 't1-sub2',
    projectId: 'p-redesign',
    parentTaskId: 't1-child1',
    title: 'Design Responsive Dropdown Navbar',
    description: 'Design accessible mobile navigation list with beautiful sub-menu drop lists.',
    status: 'in_progress',
    priority: 'medium',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    estimatedHours: '8',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }).execute();

  // Root Task 1 -> Child 1 -> Sub-child 3: Footer Links
  await db.insert(tasks).values({
    id: 't1-sub3',
    projectId: 'p-redesign',
    parentTaskId: 't1-child1',
    title: 'Design Structured Grid Footer',
    description: 'Lay out multi-column links, newsletter signup field, and socials bar.',
    status: 'todo',
    priority: 'low',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    estimatedHours: '6',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }).execute();

  // Root Task 1 -> Child 2: Development Implementation
  await db.insert(tasks).values({
    id: 't1-child2',
    projectId: 'p-redesign',
    parentTaskId: 't1-root',
    title: 'Setup Frontend Architecture',
    description: 'Initialize Next.js project with Tailwind CSS, shadcn/ui library, and configure standard layouts.',
    status: 'todo',
    priority: 'high',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    estimatedHours: '25',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }).execute();

  // Other Independent Root Tasks
  // Task 2: Database Migration
  await db.insert(tasks).values({
    id: 't2-root',
    projectId: 'p-redesign',
    title: 'Migrate PostgreSQL Database to Production Cloud',
    description: 'Ensure secure Neon DB connections, deploy production indexes, and run automated stress test queries.',
    status: 'todo',
    priority: 'high',
    assignedToId: 'u-manager',
    createdById: 'u-manager',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // OVERDUE TASK!
    estimatedHours: '15',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  }).execute();

  // Task 3: Setup Google Analytics
  await db.insert(tasks).values({
    id: 't3-root',
    projectId: 'p-redesign',
    title: 'Configure Analytics & Click Tracking',
    description: 'Connect Google Analytics and set up Vercel dashboard metrics for campaign funnel clicks.',
    status: 'done',
    priority: 'low',
    assignedToId: 'u-member',
    createdById: 'u-manager',
    dueDate: new Date(), // DUE TODAY!
    estimatedHours: '5',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }).execute();

  // 11. Custom Field Values
  console.log('Seeding custom field values...');
  const fieldValues = [
    { id: crypto.randomUUID(), taskId: 't1-root', customFieldId: 'cf-budget', value: 15000 },
    { id: crypto.randomUUID(), taskId: 't1-root', customFieldId: 'cf-severity', value: 'High' },
    { id: crypto.randomUUID(), taskId: 't1-root', customFieldId: 'cf-sprint', value: 'Sprint 24' },
    { id: crypto.randomUUID(), taskId: 't1-root', customFieldId: 'cf-client', value: 'Acme Partners' },
    { id: crypto.randomUUID(), taskId: 't1-child1', customFieldId: 'cf-budget', value: 5000 },
    { id: crypto.randomUUID(), taskId: 't1-child1', customFieldId: 'cf-severity', value: 'Medium' },
    { id: crypto.randomUUID(), taskId: 't1-sub1', customFieldId: 'cf-severity', value: 'Critical' },
  ];

  for (const val of fieldValues) {
    await db.insert(taskCustomFieldValues).values(val).execute();
  }

  // 12. Task Members
  console.log('Seeding task members...');
  await db.insert(taskMembers).values({ id: crypto.randomUUID(), taskId: 't1-root', userId: 'u-manager' }).execute();
  await db.insert(taskMembers).values({ id: crypto.randomUUID(), taskId: 't1-root', userId: 'u-member' }).execute();
  await db.insert(taskMembers).values({ id: crypto.randomUUID(), taskId: 't1-child1', userId: 'u-member' }).execute();

  // 13. Task Labels
  console.log('Seeding task labels...');
  await db.insert(taskLabels).values({ id: crypto.randomUUID(), taskId: 't1-root', labelId: 'l-design' }).execute();
  await db.insert(taskLabels).values({ id: crypto.randomUUID(), taskId: 't1-child1', labelId: 'l-design' }).execute();
  await db.insert(taskLabels).values({ id: crypto.randomUUID(), taskId: 't1-sub1', labelId: 'l-feat' }).execute();
  await db.insert(taskLabels).values({ id: crypto.randomUUID(), taskId: 't2-root', labelId: 'l-bug' }).execute();

  // 14. Checklist Items
  console.log('Seeding checklist items...');
  const checklistData = [
    { id: crypto.randomUUID(), taskId: 't1-root', title: 'Conduct user research study', completed: true, orderIndex: 0 },
    { id: crypto.randomUUID(), taskId: 't1-root', title: 'Prepare wireframe layout drafts', completed: true, orderIndex: 1 },
    { id: crypto.randomUUID(), taskId: 't1-root', title: 'Develop front-end component assets', completed: false, orderIndex: 2 },
    { id: crypto.randomUUID(), taskId: 't1-root', title: 'Run cross-browser responsiveness tests', completed: false, orderIndex: 3 },
  ];

  for (const cl of checklistData) {
    await db.insert(taskChecklist).values(cl).execute();
  }

  // 15. Task Comments
  console.log('Seeding comments...');
  await db.insert(taskComments).values({
    id: crypto.randomUUID(),
    taskId: 't1-root',
    userId: 'u-member',
    content: 'Completed the wireframe drafts! Ready for review in the subtask.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }).execute();

  await db.insert(taskComments).values({
    id: crypto.randomUUID(),
    taskId: 't1-root',
    userId: 'u-manager',
    content: 'Awesome work. Make sure the buttons have rounded-lg corners to align with our branding design.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  }).execute();

  // 16. System Audit Logs
  console.log('Seeding system audit logs...');
  const auditData = [
    { id: crypto.randomUUID(), userId: 'u-admin', action: 'user_created', metadata: { email: 'manager@tenant.com', fullName: 'SaaS Manager' } },
    { id: crypto.randomUUID(), userId: 'u-admin', action: 'user_created', metadata: { email: 'member@tenant.com', fullName: 'Regular Dev' } },
    { id: crypto.randomUUID(), userId: 'u-manager', action: 'tenant_created', metadata: { tenantId: 't-acme', name: 'Acme Software Solutions' } },
    { id: crypto.randomUUID(), userId: 'u-manager', action: 'project_created', metadata: { projectId: 'p-redesign', name: 'SaaS Platform Redesign' } },
    { id: crypto.randomUUID(), userId: 'u-manager', action: 'task_created', metadata: { taskId: 't1-root', title: 'Website Redesign UX Overhaul' } },
    { id: crypto.randomUUID(), userId: 'u-member', action: 'task_status_updated', metadata: { taskId: 't1-sub1', oldStatus: 'todo', newStatus: 'done' } },
    { id: crypto.randomUUID(), userId: 'u-member', action: 'comment_added', metadata: { taskId: 't1-root', commentLength: 61 } },
  ];

  for (const a of auditData) {
    await db.insert(auditLogs).values(a).execute();
  }

  // 17. Notifications
  console.log('Seeding notifications...');
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: 'u-member',
    content: 'You have been assigned to task: "Design Responsive Dropdown Navbar" by SaaS Manager.',
    read: false,
  }).execute();

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: 'u-manager',
    content: 'Regular Dev commented on "Website Redesign UX Overhaul".',
    read: false,
  }).execute();

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: 'u-member',
    content: 'Task: "Configure Analytics & Click Tracking" is due today!',
    read: true,
  }).execute();

  console.log('Database seeding successfully finished!');
}

seed().catch((err) => {
  console.error('Error during database seeding:', err);
  process.exit(1);
});
