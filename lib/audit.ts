import db, { auditLogs } from '@/lib/drizzle';

/**
 * Asynchronously log a system or user action for auditing.
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  metadata: Record<string, any> = {},
) {
  try {
    const activeUserId = userId || 'u-system'; // fallback to system user if null
    await db
      .insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        userId: activeUserId,
        action,
        metadata,
        createdAt: new Date(),
      })
      .execute();
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
