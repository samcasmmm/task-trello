import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import db, { notifications, eq, desc } from '@/lib/drizzle'

export async function GET() {
   try {
      const authContext = await requireAuth()

      const userNotifications = await db
         .select()
         .from(notifications)
         .where(eq(notifications.userId, authContext.userId))
         .orderBy(desc(notifications.createdAt))
         .execute()

      return NextResponse.json(userNotifications)
   } catch (error: any) {
      return NextResponse.json(
         { error: error.message || 'Unable to load notifications' },
         { status: error.message === 'Unauthorized' ? 401 : 500 }
      )
   }
}

export async function PATCH(request: NextRequest) {
   try {
      const authContext = await requireAuth()
      const body = await request.json()
      const { id, read } = body

      if (!id || typeof read !== 'boolean') {
         return NextResponse.json(
            { error: 'Notification id and read state are required' },
            { status: 400 }
         )
      }

      const notification = await db.query.notifications.findFirst({
         where: eq(notifications.id, id),
      })

      if (!notification) {
         return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }

      if (notification.userId !== authContext.userId) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const [updated] = await db
         .update(notifications)
         .set({ read })
         .where(eq(notifications.id, id))
         .returning()

      return NextResponse.json(updated)
   } catch (error: any) {
      return NextResponse.json(
         { error: error.message || 'Unable to update notification' },
         { status: error.message === 'Unauthorized' ? 401 : 500 }
      )
   }
}
