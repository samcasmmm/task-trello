import { NextResponse } from 'next/server'
import { getApiAuthContext, getUserRoles } from '@/lib/api-auth'
import db, { users, eq } from '@/lib/drizzle'

export async function GET() {
  try {
    const authContext = await getApiAuthContext()

    if (!authContext) {
      return NextResponse.json({ user: null })
    }

    // Query Drizzle database for full user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, authContext.userId),
    })

    if (!userRecord) {
      return NextResponse.json({ user: null })
    }

    // Retrieve user roles to check for Super Admin status
    const assignedRoles = await getUserRoles(authContext.userId)
    const isSuperAdmin = assignedRoles.includes('r-super-admin') || assignedRoles.includes('super_admin')

    return NextResponse.json({
      user: {
        id: userRecord.id,
        userId: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        avatarUrl: userRecord.avatarUrl,
        isSuperAdmin,
        roles: assignedRoles,
      },
    })
  } catch (error) {
    console.error('me API error:', error)
    return NextResponse.json({ user: null })
  }
}
