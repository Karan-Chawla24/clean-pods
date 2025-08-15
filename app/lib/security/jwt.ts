import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

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

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookie if header not present
  const token = request.cookies.get('adminJwt')?.value;
  return token || null;
}

export function requireAdminAuth(request: NextRequest): NextResponse | AdminJwtPayload {
  const token = extractTokenFromRequest(request);
  
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