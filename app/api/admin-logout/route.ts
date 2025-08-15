import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimitConfigs } from '@/app/lib/security/rateLimit';
import { requireAdminAuth } from '@/app/lib/security/jwt';

export const POST = withRateLimit(rateLimitConfigs.moderate)(async (request: NextRequest) => {
  try {
    // Verify JWT authentication
    const authResult = requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Create a response that clears the admin JWT cookie
    const response = NextResponse.json({ success: true });
    
    // Clear the cookie by setting an expired date
    response.cookies.set({
      name: 'adminJwt',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to logout' },
      { status: 500 }
    );
  }
});