import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import db, { users, eq } from '@/lib/drizzle';
import { requireAuth, requirePermission } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // If authenticated, require `create_users` permission. If not, allow public registration.
    let authContext = null;
    try {
      authContext = await requireAuth();
    } catch (e) {
      console.log('AuthContext is failed', e);
    }

    if (authContext) {
      await requirePermission(authContext.userId, 'create_users');
    }

    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        fullName: fullName || '',
      })
      .returning();

    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
