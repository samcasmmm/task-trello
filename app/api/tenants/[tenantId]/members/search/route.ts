import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyTenantAccess } from '@/lib/api-auth';
import db, { tenantMembers, users, eq, and, sql } from '@/lib/drizzle';

/**
 * GET /api/tenants/[tenantId]/members/search?q=<query> - Search workspace members
 * Used for @mention autocomplete in comments and descriptions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const authContext = await requireAuth();
    const { tenantId } = await params;

    const hasAccess = await verifyTenantAccess(authContext.userId, tenantId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';

    const rows = await db
      .select({
        id: tenantMembers.id,
        role: tenantMembers.role,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(tenantMembers)
      .leftJoin(users, eq(tenantMembers.userId, users.id))
      .where(eq(tenantMembers.tenantId, tenantId))
      .execute();

    // Filter by query if provided
    const filtered = query
      ? rows.filter(
          (row) =>
            (row.fullName && row.fullName.toLowerCase().includes(query)) ||
            (row.email && row.email.toLowerCase().includes(query)),
        )
      : rows;

    const members = filtered.slice(0, 20).map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.email,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      role: row.role,
    }));

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 500 },
    );
  }
}
