import db, { notifications } from '@/lib/drizzle'

/**
 * Trigger a new notification for a specific user.
 */
export async function createNotification(
  userId: string,
  content: string
) {
  try {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId,
      content,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).execute()
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
