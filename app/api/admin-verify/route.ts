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
    
    // JWT is valid, return admin status
    return NextResponse.json({
      success: true,
      isAdmin: true,
      adminId: authResult.adminId
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, isAdmin: false },
      { status: 500 }
    );
  }
});

// Add a GET endpoint for easier verification from client-side
export const GET = withRateLimit(rateLimitConfigs.moderate)(async (request: NextRequest) => {
  try {
    // Verify JWT authentication
    const authResult = requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // JWT is valid, return admin status
    return NextResponse.json({
      success: true,
      isAdmin: true,
      adminId: authResult.adminId
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, isAdmin: false },
      { status: 500 }
    );
  }
});