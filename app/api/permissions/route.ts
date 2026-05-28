import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import db, { permissions } from '@/lib/drizzle';

/**
 * GET /api/permissions - Get all system-level permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Only authenticated users can list permissions
    await requireAuth();
    const allPermissions = await db.select().from(permissions).execute();
    return NextResponse.json(allPermissions);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
