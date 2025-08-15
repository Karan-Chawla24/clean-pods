import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface AdminJwtPayload {
  adminId: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export function generateAdminToken(adminId: string): string {
  return jwt.sign(
    { adminId, role: 'admin' as const },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function requireAdminAuth(request: NextRequest): NextResponse | AdminJwtPayload {
  // First try to get token from Authorization header
  let token = extractTokenFromAuthHeader(request);
  
  // If no token in header, try to get from cookies
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get('adminJwt')?.value || null;
    } catch (error) {
      // cookies() was called outside request scope, ignore and continue
      token = null;
    }
  }
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  
  return payload;
}

export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: 'adminJwt',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });
} 