import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRE = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Create a JWT token
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRE });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get the current user from cookies
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Set auth token in cookies
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Clear auth token from cookies
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
